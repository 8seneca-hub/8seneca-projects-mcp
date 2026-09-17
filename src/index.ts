#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { startHttpServer } from "./http.js";
import { createServer } from "./server.js";

async function main() {
  // Positional mode, the way upstream's rewrite does it. stdio stays the
  // default: every teammate is already registered against the npx path with no
  // argument at all.
  const mode = process.argv[2] ?? "stdio";

  if (mode === "http") {
    await startHttpServer();
    return;
  }

  if (mode !== "stdio") {
    console.error(`Unknown mode "${mode}". Use "stdio" (the default) or "http".`);
    process.exit(1);
  }

  const { server, version } = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`Plane MCP Server running on stdio: ${version}`);
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
