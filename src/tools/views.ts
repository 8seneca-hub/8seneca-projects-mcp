import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { makePlaneRequest } from "../common/request-helper.js";
import { IssueView as IssueViewSchema } from "../schemas.js";

export const registerViewTools = (server: McpServer): void => {
  server.tool(
    "list_project_views",
    "Get all saved views for a project. A view is a named, filtered work item list. This requests project_id as uuid parameter. If you have a readable identifier for project, you can use the get_projects tool to get the project_id from it",
    {
      project_id: z.string().describe("The uuid identifier of the project to get views for"),
    },
    async ({ project_id }) => {
      const views = await makePlaneRequest(
        "GET",
        `workspaces/${process.env.PLANE_WORKSPACE_SLUG}/projects/${project_id}/views/`
      );
      return {
        content: [{ type: "text", text: JSON.stringify(views, null, 2) }],
      };
    }
  );

  server.tool(
    "get_view",
    "Get a specific saved view. This requests project_id and view_id as uuid parameters. If you do not have the view_id, use the list_project_views tool to find it",
    {
      project_id: z.string().describe("The uuid identifier of the project containing the view"),
      view_id: z.string().describe("The uuid identifier of the view to get"),
    },
    async ({ project_id, view_id }) => {
      const view = await makePlaneRequest(
        "GET",
        `workspaces/${process.env.PLANE_WORKSPACE_SLUG}/projects/${project_id}/views/${view_id}/`
      );
      return {
        content: [{ type: "text", text: JSON.stringify(view, null, 2) }],
      };
    }
  );

  server.tool(
    "create_view",
    "Create a saved view in a project. Requires project Admin or Member role. Pass rich_filters to make the view open filtered — without it the view saves but shows every work item",
    {
      project_id: z.string().describe("The uuid identifier of the project to create the view in"),
      view_data: IssueViewSchema.partial().required({ name: true }),
    },
    async ({ project_id, view_data }) => {
      const view = await makePlaneRequest(
        "POST",
        `workspaces/${process.env.PLANE_WORKSPACE_SLUG}/projects/${project_id}/views/`,
        view_data
      );
      return {
        content: [{ type: "text", text: JSON.stringify(view, null, 2) }],
      };
    }
  );

  server.tool(
    "update_view",
    "Update a saved view. This requests project_id and view_id as uuid parameters. If you do not have the view_id, use the list_project_views tool to find it",
    {
      project_id: z.string().describe("The uuid identifier of the project containing the view"),
      view_id: z.string().describe("The uuid identifier of the view to update"),
      view_data: IssueViewSchema.partial().describe("The fields to update on the view"),
    },
    async ({ project_id, view_id, view_data }) => {
      const view = await makePlaneRequest(
        "PATCH",
        `workspaces/${process.env.PLANE_WORKSPACE_SLUG}/projects/${project_id}/views/${view_id}/`,
        view_data
      );
      return {
        content: [{ type: "text", text: JSON.stringify(view, null, 2) }],
      };
    }
  );

  server.tool(
    "delete_view",
    "Delete a saved view. This requests project_id and view_id as uuid parameters. Only the view's owner or a project Admin may delete it",
    {
      project_id: z.string().describe("The uuid identifier of the project containing the view"),
      view_id: z.string().describe("The uuid identifier of the view to delete"),
    },
    async ({ project_id, view_id }) => {
      await makePlaneRequest(
        "DELETE",
        `workspaces/${process.env.PLANE_WORKSPACE_SLUG}/projects/${project_id}/views/${view_id}/`
      );
      return {
        content: [{ type: "text", text: `View ${view_id} deleted` }],
      };
    }
  );
};
