# /jira-pull

Checks whether there are Issues in Jira (bugs, tasks, stories created manually) that do not exist in the GSD manifest. For each untracked Issue, proposes how to integrate it into the GSD workflow.

## Usage

```
/jira-pull
/jira-pull --phase 2
```

With `--phase N` limits the search to Issues linked to the Epic of Phase N.

## What it does

1. Fetches all open Issues in the Jira project
2. Compares them with the manifest to find untracked ones
3. For each untracked Issue, proposes the most appropriate action
4. On confirmation, updates the manifest and suggests the corresponding GSD command

## Instructions for Claude

<instructions>

### Step 1 — Read config and manifest

Read `gsd-jira-bridge.json` and `.planning/jira-bridge/manifest.json`.

Build the list of all `jira_task_key`, `jira_story_key`, `jira_epic_key` already tracked in the manifest. Call it `tracked_keys`.

### Step 2 — Fetch Issues from Jira

Use the Jira MCP to search Issues in the project with JQL:

```
project = {project_key} AND statusCategory != Done ORDER BY created DESC
```

If the user passed `--phase N`, add:
```
AND "Epic Link" = {jira_epic_key_of_phase}
```

Fetch fields: `key`, `summary`, `issuetype`, `status`, `assignee`, `created`, `labels`, `parent`.

### Step 3 — Identify untracked Issues

For each fetched Issue:
- If the `key` is in `tracked_keys` → already tracked, skip
- If it has label `gsd-phase`, `gsd-wave`, `gsd-task`, or `gsd-tracked` → created by gsd-jira-bridge, skip
- Otherwise → **untracked**, add to the `untracked` list

If `untracked` is empty, show:
```
✓ All clear — no untracked Issues found in Jira
```
And stop.

### Step 4 — Classify and propose actions

For each untracked Issue, determine the proposed action based on type:

| Issue Type | Proposed Action |
|---|---|
| Bug | Add as `/gsd:quick` task to the current phase |
| Task | Add as a task in the next available Wave |
| Story | Evaluate whether it's a new Phase or an extra Wave |
| Epic | Flag as a potentially unplanned new Phase |
| Sub-task | Link to the parent GSD task if identifiable |

### Step 5 — Show summary and ask for confirmation

Display the list of untracked Issues with a proposal for each:

```
⚠ Found N untracked Issues in Jira:

  1. [PRJ-42] Bug: Login broken on Safari
     Type: Bug | Status: Open | Created: 2026-02-20
     → Proposed: add as /gsd:quick task
     → Command: /gsd:quick "Fix login bug on Safari [PRJ-42]"

  2. [PRJ-45] Add CSV export
     Type: Task | Status: In Progress | Created: 2026-02-22
     → Proposed: add to Phase 2, next Wave
     → Will be added to manifest as unplanned task

  3. [PRJ-47] Auth refactoring
     Type: Story | Status: Open
     → Proposed: evaluate as extra Wave in Phase 1
     → Requires manual review

For each issue: [A]dd to manifest | [S]kip | [All] add all
```

Wait for user response before proceeding.

### Step 6 — Update manifest for accepted Issues

For each Issue the user wants to track, add to the manifest under `unplanned`:

```json
{
  "unplanned": [
    {
      "jira_key": "PRJ-42",
      "summary": "Bug: Login broken on Safari",
      "type": "Bug",
      "status": "open",
      "proposed_action": "gsd:quick",
      "gsd_phase": 2,
      "added_at": "<ISO timestamp>",
      "resolved": false
    }
  ]
}
```

### Step 7 — Add tracking label in Jira

For each Issue added to the manifest, use the Jira MCP to add the label `gsd-tracked` — so future `/jira-pull` runs will recognize it.

### Step 8 — Output summary

```
✓ /jira-pull complete

  Tracked:      X issues added to manifest
  Skipped:      Y issues ignored
  Needs review: Z issues require manual action

  Suggested commands:
  → /gsd:quick "Fix login bug on Safari [PRJ-42]"
  → Add PRJ-45 to your next /gsd:plan-phase 2 session

  Run /jira-pull periodically to keep GSD and Jira in sync.
```

</instructions>
