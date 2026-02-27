# /jira-validate

Verifies that the gsd-jira-bridge installation is correct and fully functional. Checks configuration, Jira MCP connectivity, project accessibility, and required Issue types. Run this once after installation.

## Usage

```
/jira-validate
```

## What it does

1. Verifies the local configuration file
2. Tests the Jira MCP connection
3. Checks that the Jira project exists and is accessible
4. Verifies that required Issue types are configured (Epic, Story, Task)
5. Verifies that GSD is installed and `.planning/` is accessible
6. Produces a report with any problems and how to fix them

## Instructions for Claude

<instructions>

### Step 1 — Verify configuration file

Look for `gsd-jira-bridge.json` in `./.claude/` then `~/.claude/`.

Check that all required fields are present:
- `jira.cloud_id` — not empty, not equal to `"YOUR_CLOUD_ID_HERE"`
- `jira.project_key` — not empty, not equal to `"YOUR_PROJECT_KEY"`
- `jira.base_url` — starts with `https://`

Partial output:
```
[1/5] Configuration
  ✓ File found: ~/.claude/gsd-jira-bridge.json
  ✓ cloud_id: configured
  ✓ project_key: EZY
  ✓ base_url: https://yourorg.atlassian.net
```

If a field is not configured:
```
  ✗ cloud_id: not configured (placeholder value found)
    → Run ./install.sh to reconfigure
```

### Step 2 — Test Jira MCP connection

Use the Jira MCP to fetch current user info.

```
[2/5] Jira MCP Connection
  ✓ MCP reachable
  ✓ Authenticated as: [user name]
  ✓ Account ID: [id]
```

If the call fails:
```
  ✗ Cannot connect to Jira MCP
    → Verify that the Jira MCP is configured in Claude Code
    → Check your claude_desktop_config.json
    → Docs: https://docs.claude.com/en/docs/mcp
```

### Step 3 — Verify Jira project exists

Use the Jira MCP to fetch project details using `project_key`.

```
[3/5] Jira Project
  ✓ Project found: [Project Name] (EZY)
  ✓ Type: Software
  ✓ Access: read + write
```

If the project does not exist or is inaccessible:
```
  ✗ Project "EZY" not found or inaccessible
    → Check the project_key in gsd-jira-bridge.json
    → Verify your Jira account permissions
```

### Step 4 — Verify Issue types

Use the Jira MCP to fetch the Issue types configured in the project.

Verify the presence of:
- **Epic** — required for GSD Phases
- **Story** — required for GSD Waves
- **Task** — required for GSD Tasks

```
[4/5] Issue Types
  ✓ Epic: available
  ✓ Story: available
  ✓ Task: available
```

If a type is missing:
```
  ✗ Story: not found in project
    → The Jira project must have Epic, Story, and Task as Issue types
    → Go to: Jira → Project Settings → Issue Types
    → Add the missing type, or use a Scrum or Kanban project type
```

### Step 5 — Verify GSD installation

Check for GSD command files:
- In `~/.claude/commands/` look for files starting with `gsd`
- Or in `./.claude/commands/`

Check for `.planning/config.json` in the current project.

```
[5/5] GSD Installation
  ✓ GSD commands found: ~/.claude/commands/ (global install)
  ✓ .planning/config.json found in current project
  ✓ GSD version: [version if available]
```

If GSD is not found:
```
  ✗ GSD commands not found
    → Install GSD: npx get-shit-done-cc --claude --global
```

If `.planning/` does not exist:
```
  ⚠ .planning/ not found in current directory
    → No problem yet: it will be created by /gsd:new-project
    → Make sure to run /jira-init from your project root
```

### Step 6 — Final report

```
╔══════════════════════════════════════════════╗
║      gsd-jira-bridge — Validation Report     ║
╚══════════════════════════════════════════════╝

  [1/5] Configuration        ✓
  [2/5] MCP Connection       ✓
  [3/5] Jira Project         ✓
  [4/5] Issue Types          ✓
  [5/5] GSD Installation     ✓

  ✓ All good — gsd-jira-bridge is ready to use!

  Start with: /gsd:new-project → then /jira-init
```

If there are errors:

```
  ✗ 2 problems found — fix these before using gsd-jira-bridge

  Critical issues (blocking):
  → [2/5] MCP connection failed
  → [4/5] Issue type "Story" missing from Jira project

  Follow the instructions above for each problem, then re-run /jira-validate.
```

</instructions>
