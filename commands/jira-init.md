# /jira-init

Run this command after `/gsd:new-project` to initialize the Jira structure for the current GSD milestone.

Works correctly on both **new projects** (no phases started yet) and **existing projects** (some phases already complete or in progress). Completed phases are recorded in Jira as Done without creating noise from already-executed Stories and Tasks.

## Usage

```
/jira-init
```

## What it does

1. Reads `.planning/ROADMAP.md` to get the phase list
2. Reads `.planning/STATE.md` to determine which phases are already complete
3. Creates a **Fix Version** in Jira for the milestone
4. For each Phase:
   - **Already complete** → creates Epic and immediately transitions it to Done (history only, no Stories/Tasks)
   - **In progress** → creates Epic in In Progress; Stories/Tasks will be created by `/jira-sync-tasks`
   - **Not started** → creates Epic as To Do
5. Saves all references to `.planning/jira-bridge/manifest.json`

## Instructions for Claude

<instructions>

### Step 1 — Read configuration

Read the gsd-jira-bridge config file. Search in this order:
1. `./.claude/gsd-jira-bridge.json`
2. `~/.claude/gsd-jira-bridge.json`

Extract: `cloud_id`, `project_key`, `base_url`.

If the file does not exist, stop:
```
✗ gsd-jira-bridge not configured. Run ./install.sh first.
```

### Step 2 — Read GSD ROADMAP

Read `.planning/ROADMAP.md`. Extract:
- **Milestone name** (e.g. "v1.0.0 - MVP")
- **Phase list** with number and title

If the file does not exist, stop:
```
✗ ROADMAP.md not found. Run /gsd:new-project first.
```

### Step 3 — Read GSD STATE to classify phases

Read `.planning/STATE.md`. For each phase, determine its current state:

| STATE.md signal | Classification |
|---|---|
| Phase marked complete / ✓ / archived | `done` |
| Phase marked as current / in progress / executing | `in_progress` |
| Phase not yet mentioned or marked todo | `todo` |

Build a map: `{ phase_number: "done" | "in_progress" | "todo" }`.

If STATE.md does not exist, treat all phases as `todo`.

**If any phases are `done` or `in_progress`, this is a brownfield install.** Show a notice:
```
ℹ Existing project detected:
  Phase 1: Authentication  → done (will be recorded as Done in Jira, no Stories/Tasks)
  Phase 2: Dashboard       → in_progress (Epic will be In Progress)
  Phase 3: Reporting       → todo

  Completed phases will be created as Done Epics in Jira.
  Run /jira-sync-tasks only for phases that still have open work.
```

### Step 4 — Create Fix Version in Jira

Use the Jira MCP to create a Fix Version:
- `name`: milestone name from ROADMAP
- `description`: "Created by gsd-jira-bridge"
- `released`: false

Save as `jira_version_id`.

### Step 5 — Create one Epic per Phase

For each phase, build the GSD branch name:
- `{N}` = zero-padded number (e.g. `01`, `02`)
- `{slug}` = title lowercase, spaces to hyphens, special chars removed
- Format: `gsd/phase-{N}-{slug}`

Create a Jira Issue of type **Epic**:
- `summary`: GSD branch name (e.g. `gsd/phase-01-authentication`)
- `description`:
  ```
  Phase N: [original title]
  GSD Branch: gsd/phase-{N}-{slug}

  [objectives from ROADMAP if available]
  ```
- `fixVersions`: `[{ "id": jira_version_id }]`
- `labels`: `["gsd-phase"]`

Save the Epic ID, key, and branch name.

### Step 6 — Transition Epics based on phase state

After creating each Epic:

**If phase is `done`:**
- Transition the Epic to "Done"
- Add a comment:
  ```
  ✓ Phase completed before gsd-jira-bridge was installed.
  Recorded as Done. No Stories or Tasks will be created for this phase.
  ```
- Set manifest status to `"done"`, `"skip_tasks": true`

**If phase is `in_progress`:**
- Transition the Epic to "In Progress"
- Set manifest status to `"in_progress"`
- Note: run `/jira-sync-tasks N` only for waves that are not yet complete

**If phase is `todo`:**
- Leave Epic in default status (To Do)
- Set manifest status to `"todo"`

### Step 7 — Write the manifest

Write `.planning/jira-bridge/manifest.json`:

```json
{
  "version": "1.0.0",
  "synced_at": "<ISO timestamp>",
  "brownfield": true,
  "milestone": {
    "gsd_name": "<milestone name>",
    "jira_version_id": "<id>",
    "jira_version_name": "<name>"
  },
  "phases": [
    {
      "gsd_phase": 1,
      "gsd_title": "<title>",
      "gsd_branch": "gsd/phase-01-<slug>",
      "jira_epic_id": "<id>",
      "jira_epic_key": "<key>",
      "status": "done",
      "skip_tasks": true
    },
    {
      "gsd_phase": 2,
      "gsd_title": "<title>",
      "gsd_branch": "gsd/phase-02-<slug>",
      "jira_epic_id": "<id>",
      "jira_epic_key": "<key>",
      "status": "in_progress",
      "skip_tasks": false
    }
  ],
  "waves": [],
  "tasks": [],
  "unplanned": []
}
```

Set `"brownfield": false` if all phases were `todo`.

### Step 8 — Output summary

```
✓ gsd-jira-bridge initialized

  Milestone  → [name] (Jira Version ID: xxx)

  Phase 1 → gsd/phase-01-authentication  (Epic: PRJ-1) → Done ✓  [skipped tasks]
  Phase 2 → gsd/phase-02-dashboard       (Epic: PRJ-2) → In Progress ⚡
  Phase 3 → gsd/phase-03-reporting       (Epic: PRJ-3) → To Do

  [If brownfield]
  ⚠ Brownfield install: 1 phase already complete, 1 in progress.
    → Do NOT run /jira-sync-tasks for Phase 1 (already done)
    → Run /jira-sync-tasks 2 only for waves still open in Phase 2
    → Run /jira-sync-tasks 3 normally when you reach Phase 3

  Next step: /jira-validate → /gsd:discuss-phase 2 → /jira-sync-phase 2
```

</instructions>
