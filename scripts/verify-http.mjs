// End-to-end check for http mode against a live Plane instance. Needs a real
// token, so it is not part of `npm test`.
//
//   MCP_URL=http://localhost:8080/mcp GOOD_KEY=<token> [SECOND_KEY=<other>] \
//     npm run verify:http
//
// Covers the things that must not regress: a request with no key is refused
// before any tool runs, a bad key fails without echoing itself, all 54 tools
// list, and a fork-only tool returns real data.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const URL_ = process.env.MCP_URL;
const GOOD = process.env.GOOD_KEY;

const connect = async (key) => {
  const client = new Client({ name: "verify", version: "0" });
  const headers = key === null ? {} : { "X-API-Key": key };
  await client.connect(new StreamableHTTPClientTransport(new URL(URL_), { requestInit: { headers } }));
  return client;
};

let failures = 0;
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? " — " + detail : ""}`);
  if (!ok) failures += 1;
};

// 1. no header at all
try {
  await connect(null);
  check("no X-API-Key is refused", false, "connected anyway");
} catch (e) {
  check("no X-API-Key is refused", /Missing X-API-Key/.test(String(e)), String(e).slice(0, 90));
}

// 2. empty header
try {
  await connect("   ");
  check("empty X-API-Key is refused", false, "connected anyway");
} catch (e) {
  check("empty X-API-Key is refused", /Missing X-API-Key/.test(String(e)), String(e).slice(0, 90));
}

// 3. bad key: connects (the server does not pre-validate) but tools fail cleanly
{
  const client = await connect("pln_definitelynotarealkey000000000000000");
  const res = await client.callTool({ name: "get_projects", arguments: {} });
  const text = JSON.stringify(res).slice(0, 200);
  check("bad key fails cleanly", /401|failed/i.test(text), text.slice(0, 120));
  check("bad key error does not echo the key", !JSON.stringify(res).includes("definitelynotarealkey"));
  await client.close();
}

// 4. real key: full tool surface + a fork-only tool against live data
{
  const client = await connect(GOOD);
  const { tools } = await client.listTools();
  check("54 tools listed", tools.length === 54, `got ${tools.length}`);
  check(
    "fork-only tools present",
    [
      "get_project_summary",
      "get_project_docs",
      "create_view",
      "get_view",
      "list_project_views",
      "update_view",
      "delete_view",
    ].every((t) => tools.some((x) => x.name === t))
  );

  const projects = await client.callTool({ name: "get_projects", arguments: {} });
  const list = JSON.parse(projects.content[0].text);
  const arr = Array.isArray(list) ? list : (list.results ?? []);
  check("get_projects returns live data", arr.length > 0, `${arr.length} projects`);

  const summary = await client.callTool({ name: "get_project_summary", arguments: { project_id: arr[0].id } });
  const parsed = JSON.parse(summary.content[0].text);
  check(
    "get_project_summary returns real data",
    typeof parsed === "object" && Object.keys(parsed).length > 0,
    Object.keys(parsed).join(",")
  );
  await client.close();
}

// 5. two different keys keep their own identity
if (process.env.SECOND_KEY) {
  const who = async (key) => {
    const c = await connect(key);
    const r = await c.callTool({ name: "get_user", arguments: {} });
    await c.close();
    return JSON.parse(r.content[0].text).email;
  };
  const [a, b] = [await who(GOOD), await who(process.env.SECOND_KEY)];
  check("per-request key decides identity", a !== b, `${a} vs ${b}`);
}

console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
