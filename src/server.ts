import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { getVersion } from "./common/version.js";
import { registerTools } from "./tools/index.js";

export function createServer() {
  const version = getVersion();

  // SDK 1.30 moved capabilities out of the implementation info and into the
  // second options argument.
  const server = new McpServer({ name: "plane-mcp-server", version }, { capabilities: {} });

  registerTools(server);

  return { server, version };
}
