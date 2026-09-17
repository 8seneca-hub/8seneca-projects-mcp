# 8seneca Projects MCP Server

MCP server for 8seneca's Plane fork at [projects.8seneca.com](https://projects.8seneca.com), workspace `8seneca`.

Forked from [`makeplane/plane-mcp-server`](https://github.com/makeplane/plane-mcp-server) at **v0.1.5** — the last TypeScript release, and the one published to npm. Upstream has since rewritten the server in Python on `plane-sdk`; that line targets Plane Cloud and does not fit this deployment (PQL is refused by our edition, and roughly two thirds of its tools 404 here), so this fork stays on the v0.1.5 base.

## What this fork adds

Everything upstream v0.1.5 does, plus the fork's own fields and endpoints:

| Addition | Where |
|---|---|
| `estimate_hours` on work items | `create_issue`, `update_issue` |
| `project_manager`, `docs_view` | `get_projects`, `create_project` |
| `get_project_summary` | project counts in one call |
| `list_project_views`, `get_view`, `create_view`, `update_view`, `delete_view` | saved views, fork-only on `/api/v1` |
| `get_project_docs` | reads a project's published docs site |

**`estimate_hours` is hours, always.** The fork normalises `estimate_unit` server-side (8HUB-167), so it is not exposed as an input — send `estimate_hours` alone. It is mutually exclusive with `estimate_point`: whichever is sent wins, and the other is cleared.

**Only `/api/v1` is reachable.** The fork's Django URLconf splits `/api/v1/` (API-key auth) from `/api/` (session/JWT). Project types, domains, defaults, teams, summary CRUD, summary statuses and the P&L subsystem all live on the session side and cannot be reached with a Plane API token. Tools for those wait on the backend ticket that promotes them.

## Install (team setup)

The repo is public, so npm installs it straight from git — no registry, no npm
login, nothing to publish. `prepare` builds it on install.

```bash
claude mcp add 8projects -s user \
  -e PLANE_API_KEY=<your own token> \
  -e PLANE_API_HOST_URL=https://projects.8seneca.com \
  -e PLANE_WORKSPACE_SLUG=8seneca \
  -- npx -y github:8seneca-hub/8seneca-projects-mcp
```

Pin a release by appending a tag: `github:8seneca-hub/8seneca-projects-mcp#v0.1.5-8seneca.1`.
Without one you track `main`, which npx re-resolves as its cache expires.

**Everyone uses their own API token.** Generate one at
[Workspace Settings > API Tokens](https://projects.8seneca.com/8seneca/settings/api-tokens/).
The token carries your own permissions, so the server can only reach what you
can already reach. Do not share one token across the team — it makes every
write look like it came from one person.

Any MCP client works, not just Claude Code; the equivalent JSON is under
[Usage](#usage) below.

## Development

```bash
npm install
npm run build          # -> build/index.js
npm run lint
```

Point an MCP client at `node <repo>/build/index.js` with the env vars below.

---

The Plane MCP Server brings the power of Model Context Protocol (MCP) to Plane, allowing AI agents and developer tools to interact programmatically with your Plane workspace.

Whether you're building intelligent assistants, automation scripts, or workflow-driven tools, this server provides a seamless bridge to Plane’s API—so you can create projects, manage issues, assign tasks, and keep your work in sync with AI-powered tools.

## What can you do with it?
This server unlocks all sorts of useful capabilities for anyone working with Plane:

- Spin up projects and work items directly from your AI or app interface.

- Update progress, assign team members, set properties, or add comments—all programmatically.

- Move issues through workflows and update their states on the fly.

- Organize work with labels, modules, and cycles.

- Analyze data about your team’s work across projects.

- Build smart apps that interact naturally with Plane—whether it’s an AI agent logging work, or a bot keeping projects tidy.


## Tools

### Users

- `get_user`  
  - Get the current user's information
  - No parameters required

### Projects

- `get_projects`
  - Get all projects for the current user
  - No parameters required

- `create_project`   
  - Create a new project
  - Parameters:
    - `name` (string, required): Project name 
    - `identifier` (string, required): Short uppercase key, max 7 chars
    - `project_manager` (string, optional): UUID of the manager. **8seneca fork.** Must be an active workspace member or the create is refused
    - `docs_view` (boolean, optional): Enable the project's Docs tab. **8seneca fork**

- `get_project_summary` — **8seneca fork**
  - A project's counts in one call: work items, modules, cycles, states, members, pages, labels, intakes
  - Parameters:
    - `project_id` (string, required): UUID of the project

### Issue Types

- `list_issue_types`  
    - Get all issue types for a specific project
    - Parameters: 
      - `project_id` (string, required): UUID of the project

- `get_issue_type`
  - Get details of a specific issue type
  - Parameters: 
      - `project_id` (string, required): UUID of the project
      - `type_id` (string, required): UUID of the issue type

- `create_issue_type`
  - Create a new issue type in a project
  - Parameters: 
    - `project_id` (string, required): UUID of the project 
    - `issue_type_data`: Object containing:
       - `name` (string, required): Name of the issue type 
        - `description` (string, required): Description of the issue type 

- `update_issue_type` 
  - Update an existing issue type
  - Parameters: 
    - `project_id` (string, required): UUID of the project 
    - `type_id` (string, required): UUID of the issue type
    - `issue_type_data` (object): Fields to update on the issue type

- `delete_issue_type` 
  - Delete an issue type
  - Parameters:
    - `project_id` (string, required): UUID of the project
    - `type_id`  (string, required): UUID of the issue type

### States

- `list_states` 
  - Get all states for a specific project
  - Parameters:
    - `project_id` (string, required): UUID of the project

- `get_state` 
  - Get details of a specific state
  - Parameters:
    - `project_id` (string, required): UUID of the project 
    - `state_id` (string, required): UUID of the state 

- `create_state` 
  - Create a new state in a project
   - Parameters:
     - `project_id` (string, required): UUID of the project
     - `state_data`: Object containing:
        - `name` (string, required): Name of the state 
        - `color` (string, required): Color code for the state 

- `update_state`
   - Update an existing state
   - Parameters:
      - `project_id` (string, required): UUID of the project 
      - `state_id` (string, required): UUID of the state 
      - `state_data` (object): Fields to update on the state 

- `delete_state` 
  - Delete a state
  - Parameters:
    - `project_id` (string, required): UUID of the project 
    - `state_id` (string, required): UUID of the state 

### Labels

- `list_labels` 
  - Get all labels for a specific project
  - Parameters:
    - `project_id` (string, required): UUID of the project

- `get_label` 
  - Get details of a specific label
  - Parameters:
    - `project_id` (string, required): UUID of the project 
    - `label_id` (string, required): UUID of the label 

- `create_label` 
  - Create a new label in a project
  - Parameters:
    - `project_id` (string, required): UUID of the project 
    - `label_data`: Object containing:
      - `name` (string, required): Name of the label 
      - `color` (string, required): Color code for the label 

- `update_label` 
  - Update an existing label
  - Parameters:
    - `project_id` (string, required): UUID of the project
    - `label_id`  (string, required): UUID of the label
    - `label_data` (object): Fields to update on the label 

- `delete_label`
  - Delete a label
  - Parameters:
    - `project_id` (string, required): UUID of the project 
    - `label_id` (string, required): UUID of the label 

### Issues

- `get_issue_using_readable_identifier` 
  - Get issue details using readable identifier (e.g., PROJ-123)
  - Parameters:
    - `project_identifier` (string, required)
    - `issue_identifier` (string, required): Issue numbe: Project identifier (e.g., "PROJ") r (e.g., "123") 

- `get_issue_comments` 
  - Get all comments for a specific issue
  - Parameters:
    - `project_id` (string, required): UUID of the project 
    - `issue_id` (string, required): UUID of the issue 

- `add_issue_comment` 
  - Add a comment to an issue
  - Parameters:
    - `project_id` (string, required): UUID of the project 
    - `issue_id` (string, required): UUID of the issue 
    - `comment_html` (string, required): HTML content of the comment 

- `create_issue` 
  - Create a new issue
  - Parameters:
    - `project_id` (string, required): UUID of the project 
    - `issue_data`: Object containing:
     - `name` (string, required): Title of the issue 
      - `description_html` (string, required): HTML description of the issue 

- `update_issue` 
  - Update an existing issue
  - Parameters:
    - `project_id` (string, required): UUID of the project 
    - `issue_id` (string, required): UUID of the issue 
    - `issue_data` (object): Fields to update on the issue

`issue_data` on both accepts `estimate_hours` (positive integer) — **8seneca fork**.
Hours is the only unit, so `estimate_unit` is set server-side and is not a
parameter. It is mutually exclusive with `estimate_point`: whichever is sent
wins and the other is cleared. 

### Modules

- `list_modules` 
  - Get all modules for a specific project
  - Parameters:
    - `project_id` (string, required): UUID of the project 

- `get_module` 
  - Get details of a specific module
  - Parameters:
    - `project_id` (string, required): UUID of the project 
    - `module_id` (string, required): UUID of the module 

- `create_module` 
  - Create a new module in a project
  - Parameters:
    - `project_id` (string, required): UUID of the project 
    - `module_data`: Object containing:
      - `name` (string, required): Name of the module 

- `update_module` 
  - Update an existing module
  - Parameters:
    - `project_id` (string, required): UUID of the project 
    - `module_id` (string, required): UUID of the module 
    - `module_data` (object): Fields to update on the module 

- `delete_module` 
  - Delete a module
  - Parameters:
    - `project_id` (string, required): UUID of the project 
    - `module_id` (string, required): UUID of the module 

### Module Issues

- `list_module_issues` 
  - Get all issues for a specific module
  - Parameters:
    - `project_id` (string, required): UUID of the project 
    - `module_id` (string, required): UUID of the module 

- `add_module_issues` 
  - Add issues to a module
  - Parameters:
    - `project_id` (string, required): UUID of the project 
    - `module_id` (string, required): UUID of the module 
    - `issues` (string[], required): Array of issue UUIDs to add 

- `delete_module_issue` 
  - Remove an issue from a module
  - Parameters:
    - `project_id` (string, required): UUID of the project 
    - `module_id` (string, required): UUID of the module 
    - `issue_id` (string, required): UUID of the issue to remove 

### Cycles

- `list_cycles` 
  - Get all cycles for a specific project
  - Parameters:
    - `project_id` (string, required): UUID of the project 

- `get_cycle` 
  - Get details of a specific cycle
  - Parameters:
    - `project_id` (string, required): UUID of the project 
    - `cycle_id` (string, required): UUID of the cycle 

- `create_cycle` 
  - Create a new cycle in a project
  - Parameters:
    - `project_id` (string, required): UUID of the project 
    - `cycle_data`: Object containing:
     - `name` (string, required): Name of the cycle 
      - `start_date` (string, required): Start date (YYYY-MM-DD) 
      - `end_date` (string, required)
: End date (YYYY-MM-DD) 
- `update_cycle` 
  - Update an existing cycle
  - Parameters:
    - `project_id` (string, required): UUID of the project 
    - `cycle_id` (string, required): UUID of the cycle 
    - `cycle_data` (object): Fields to update on the cycle 

- `delete_cycle` 
  - Delete a cycle
  - Parameters:
    - `project_id` (string, required): UUID of the project 
    - `cycle_id` (string, required): UUID of the cycle 

### Cycle Issues

- `list_cycle_issues` 
  - Get all issues for a specific cycle
  - Parameters:
    - `project_id` (string, required): UUID of the project 
    - `cycle_id` (string, required): UUID of the cycle 

- `add_cycle_issues` 
  - Add issues to a cycle
  - Parameters:
    - `project_id` (string, required): UUID of the project 
    - `cycle_id` (string, required): UUID of the cycle 
    - `issues` (string[], required): Array of issue UUIDs to add 

- `delete_cycle_issue` 
  - Remove an issue from a cycle
  - Parameters:
    - `project_id` (string, required): UUID of the project 
    - `cycle_id` (string, required): UUID of the cycle 
    - `issue_id` (string, required): UUID of the issue to remove 

### Views — 8seneca fork

Saved views are served from `/api/v1` on this fork; upstream keeps them on the
session-auth app API, out of reach of an API token.

- `list_project_views`
  - Get all saved views for a project
  - Parameters:
    - `project_id` (string, required): UUID of the project

- `get_view`
  - Get one saved view
  - Parameters:
    - `project_id` (string, required): UUID of the project
    - `view_id` (string, required): UUID of the view

- `create_view`
  - Create a saved view. Requires project Admin or Member
  - Parameters:
    - `project_id` (string, required): UUID of the project
    - `view_data` (object, required): `name` required. Pass `rich_filters` or the view opens unfiltered

- `update_view`
  - Update a saved view
  - Parameters:
    - `project_id` (string, required): UUID of the project
    - `view_id` (string, required): UUID of the view
    - `view_data` (object, required): Fields to change

- `delete_view`
  - Delete a saved view. Owner or project Admin only
  - Parameters:
    - `project_id` (string, required): UUID of the project
    - `view_id` (string, required): UUID of the view

### Docs — 8seneca fork

- `get_project_docs`
  - Read a page of a project's published docs site. Returns the raw file, HTML for a page
  - Parameters:
    - `project_id` (string, required): UUID of the project
    - `path` (string, optional): Path within the site, e.g. `guide/setup.html`. Omit for the index
  - Only projects with `docs_view` on **and a published build** have any; others 404. There is no path listing, so follow links from the index
  - The write half of the docs API (presign uploads, commit a build) is a CI deploy step and is deliberately not wrapped

### Work Logs

- `get_issue_worklogs` 
  - Get all worklogs for a specific issue
  - Parameters:
    - `project_id` (string, required): UUID of the project 
    - `issue_id` (string, required): UUID of the issue 

- `get_total_worklogs` 
  - Get total logged time for a project
  - Parameters:
    - `project_id` (string, required): UUID of the project 

- `create_worklog` 
  - Create a new worklog for an issue
  - Parameters:
    - `project_id` (string, required): UUID of the project 
    - `issue_id` (string, required): UUID of the issue 
    - `worklog_data`: Object containing:
      - `description` (string, required): Description of the work done 
      - `duration` (integer, required): Duration in minutes 

- `update_worklog` 
  - Update an existing worklog
  - Parameters:
    - `project_id` (string, required): UUID of the project
    - `issue_id` (string, required): UUID of the issue 
    - `worklog_id` (string, required): UUID of the worklog 
    - `worklog_data` (object): Fields to update on the worklog 

- `delete_worklog` 
  - Delete a worklog
  - Parameters:
    - `project_id` (string, required): UUID of the project 
    - `issue_id` (string, required): UUID of the issue 
    - `worklog_id` (string, required): UUID of the worklog 


## Configuration Parameters

- `PLANE_API_KEY` - Your Plane API token. You can generate one from the Workspace Settings > API Tokens page (`/settings/api-tokens/`) in the Plane app. 
- `PLANE_WORKSPACE_SLUG` - The workspace slug for your Plane instance. The workspace-slug represents the unique workspace identifier for a workspace in Plane. It can be found in the URL.
- `PLANE_API_HOST_URL` - The host URL of the Plane API Server. For this fork: `https://projects.8seneca.com`. Defaults to https://api.plane.so/ if unset, which is not what you want here.

## Usage

### Claude Desktop

You can add Plane to [Claude Desktop](https://modelcontextprotocol.io/quickstart/user) by updating your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "8projects": {
      "command": "node",
      "args": [
        "<PATH_TO_THIS_REPO>/build/index.js"
      ],
      "env": {
        "PLANE_API_KEY": "<YOUR_API_KEY>",
        "PLANE_API_HOST_URL": "https://projects.8seneca.com",
        "PLANE_WORKSPACE_SLUG": "8seneca"
      }
    }
  }
}
```

### VSCode

You can also connect Plane to [VSCode](https://code.visualstudio.com/docs/copilot/chat/mcp-servers#_add-an-mcp-server) by editing your `.vscode.json` or `mcp.json` file:

```json
{
  "servers": {
    "8projects": {
      "command": "node",
      "args": [
        "<PATH_TO_THIS_REPO>/build/index.js"
      ],
      "env": {
        "PLANE_API_KEY": "<YOUR_API_KEY>",
        "PLANE_API_HOST_URL": "https://projects.8seneca.com",
        "PLANE_WORKSPACE_SLUG": "8seneca"
      }
    }
  }
}

```

## License

This MCP server is licensed under the MIT License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MIT License. For more details, please see the LICENSE file in the project repository.