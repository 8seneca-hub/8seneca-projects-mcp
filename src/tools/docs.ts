import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { makePlaneRequest } from "../common/request-helper.js";

export const registerDocsTools = (server: McpServer): void => {
  // Read only. The write half of the docs API (`docs/uploads/` + `docs/commit/`)
  // presigns and then publishes a whole build manifest — a CI deploy step, not
  // something an assistant should drive one call at a time.
  server.tool(
    "get_project_docs",
    "Read a page of a project's published docs site. Returns the raw file the project publishes at that path — HTML for a page. Omit path to get the site's index. Only projects with docs_view enabled and a published build have any; others return a 404. There is no path listing, so follow the links in the index to reach other pages",
    {
      project_id: z.string().describe("The uuid identifier of the project whose docs to read"),
      path: z
        .string()
        .optional()
        .describe("Path within the docs site, e.g. 'guide/setup.html'. Omit for the site index"),
    },
    async ({ project_id, path }) => {
      const doc = await makePlaneRequest<unknown>(
        "GET",
        `workspaces/${process.env.PLANE_WORKSPACE_SLUG}/projects/${project_id}/docs/${path ?? ""}`
      );
      return {
        content: [
          {
            type: "text",
            text: typeof doc === "string" ? doc : JSON.stringify(doc, null, 2),
          },
        ],
      };
    }
  );
};
