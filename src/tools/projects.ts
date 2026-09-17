import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { makePlaneRequest } from "../common/request-helper.js";
import { type Project } from "../schemas.js";

type ProjectsResponse = {
  grouped_by: null;
  sub_grouped_by: null;
  total_count: number;
  next_cursor: string;
  prev_cursor: string;
  next_page_results: boolean;
  prev_page_results: boolean;
  count: number;
  total_pages: number;
  total_results: number;
  extra_stats: null;
  results: Project[];
};

export const registerProjectTools = (server: McpServer) => {
  server.tool("get_projects", "Get all projects for the current user", {}, async () => {
    const projectsResponse: ProjectsResponse = await makePlaneRequest<ProjectsResponse>(
      "GET",
      `workspaces/${process.env.PLANE_WORKSPACE_SLUG}/projects/`
    );

    const projects = projectsResponse.results.map((project) => ({
      name: project.name,
      id: project.id,
      identifier: project.identifier,
      description: project.description,
      project_lead: project.project_lead,
      project_manager: project.project_manager,
      docs_view: project.docs_view,
    }));

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(projects, null, 2),
        },
      ],
    };
  });

  server.tool(
    "create_project",
    "Create a new project",
    {
      name: z.string().describe("The name of the project"),
      identifier: z
        .string()
        .max(7)
        .describe(
          "The identifier of the project. This is typically a word of around 5 characters derived from the name of the project in uppercase."
        ),
      project_manager: z
        .string()
        .uuid()
        .optional()
        .describe(
          "8seneca fork: the uuid of the project's manager. Must be an active member of the workspace or the create is refused. Use get_workspace_members to find the uuid."
        ),
      docs_view: z.boolean().optional().describe("8seneca fork: enable the project's Docs tab"),
    },
    async ({ name, identifier, project_manager, docs_view }) => {
      const project = await makePlaneRequest("POST", `workspaces/${process.env.PLANE_WORKSPACE_SLUG}/projects/`, {
        name,
        identifier: identifier.toUpperCase().replaceAll(" ", ""),
        ...(project_manager !== undefined && { project_manager }),
        ...(docs_view !== undefined && { docs_view }),
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(project, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "get_project_summary",
    "8seneca fork: get a project's counts — how many work items, modules, cycles, states, members, pages, labels and intakes it holds. Cheaper than listing each. This requests project_id as uuid parameter. If you have a readable identifier for project, you can use the get_projects tool to get the project_id from it",
    {
      project_id: z.string().describe("The uuid identifier of the project to summarise"),
    },
    async ({ project_id }) => {
      const summary = await makePlaneRequest(
        "GET",
        `workspaces/${process.env.PLANE_WORKSPACE_SLUG}/projects/${project_id}/summary/`
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(summary, null, 2),
          },
        ],
      };
    }
  );
};
