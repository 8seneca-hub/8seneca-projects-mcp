import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { IncomingMessage, ServerResponse, createServer as createHttpServer } from "node:http";

import { withApiKey } from "./common/api-key.js";
import { getVersion } from "./common/version.js";
import { createServer } from "./server.js";

const MCP_PATH = "/mcp";
const RATE_LIMIT = Number(process.env.MCP_RATE_LIMIT ?? 120);
const RATE_WINDOW_MS = 60_000;

// Host header allow-list for the SDK's DNS-rebinding protection. A deployment
// that forgets MCP_ALLOWED_HOSTS fails loudly with a 421 rather than silently
// dropping the check.
const ALLOWED_HOSTS = [
  ...(process.env.MCP_ALLOWED_HOSTS ?? "")
    .split(",")
    .map((host) => host.trim())
    .filter(Boolean),
  `localhost:${process.env.PORT ?? 8080}`,
  `127.0.0.1:${process.env.PORT ?? 8080}`,
];

// ponytail: fixed-window counter in process memory — correct for one replica.
// Move the counter to Redis if this ever scales out.
const hits = new Map<string, { count: number; resetAt: number }>();
setInterval(() => {
  const now = Date.now();
  for (const [key, hit] of hits) {
    if (hit.resetAt <= now) hits.delete(key);
  }
}, RATE_WINDOW_MS).unref();

function isRateLimited(clientIp: string): boolean {
  const now = Date.now();
  const hit = hits.get(clientIp);
  if (!hit || hit.resetAt <= now) {
    hits.set(clientIp, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  hit.count += 1;
  return hit.count > RATE_LIMIT;
}

// Caddy is the only hop in front of this service on Railway, so the first
// X-Forwarded-For entry is the real client.
function clientIpOf(req: IncomingMessage): string {
  const forwarded = req.headers["x-forwarded-for"];
  const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(",")[0]?.trim();
  return first || req.socket.remoteAddress || "unknown";
}

function sendError(res: ServerResponse, status: number, message: string): void {
  if (res.headersSent) return;
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ jsonrpc: "2.0", error: { code: -32600, message }, id: null }));
}

async function handleMcpRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (isRateLimited(clientIpOf(req))) {
    sendError(res, 429, "Too many requests. Try again in a minute.");
    return;
  }

  // Never fall back to a server-side PLANE_API_KEY here. Without this refusal an
  // anonymous caller inherits whatever the deployment's own key can reach, and
  // every write is attributed to one account.
  const header = req.headers["x-api-key"];
  const apiKey = (Array.isArray(header) ? header[0] : header)?.trim();
  if (!apiKey) {
    sendError(res, 401, "Missing X-API-Key header. Pass your own Plane API token.");
    return;
  }

  // Stateless: a fresh server and transport per request, so concurrent callers
  // never share a JSON-RPC id space or a credential.
  const { server } = createServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    // ponytail: deprecated in SDK 1.30 in favour of external middleware, but it
    // still works and is two lines. Move it out when the SDK drops it.
    enableDnsRebindingProtection: true,
    allowedHosts: ALLOWED_HOSTS,
  });

  res.on("close", () => {
    void transport.close();
    void server.close();
  });

  try {
    await server.connect(transport);
    await withApiKey(apiKey, () => transport.handleRequest(req, res));
  } catch (error) {
    // Only the message, never the error object: this server is the path every
    // teammate's Plane token travels and axios carries the headers on the error.
    console.error("MCP request failed:", error instanceof Error ? error.message : "unknown error");
    sendError(res, 500, "Internal server error");
  }
}

export async function startHttpServer(): Promise<void> {
  const port = Number(process.env.PORT ?? 8080);

  const httpServer = createHttpServer((req, res) => {
    const path = (req.url ?? "").split("?")[0];

    // Lets the Caddy route and the Railway deploy be verified without a token.
    if (req.method === "GET" && path === "/health") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("ok");
      return;
    }

    if (path !== MCP_PATH) {
      sendError(res, 404, "Not found");
      return;
    }

    // Stateless mode has no stream to resume and no session to delete.
    if (req.method !== "POST") {
      sendError(res, 405, "Method not allowed. Streamable HTTP in stateless mode accepts POST only.");
      return;
    }

    void handleMcpRequest(req, res);
  });

  await new Promise<void>((resolve) => httpServer.listen(port, resolve));
  console.error(`Plane MCP Server running on http://0.0.0.0:${port}${MCP_PATH}: ${getVersion()}`);
}
