# /jira-sync

The all-in-one sync command. Run it at any time to bring Jira up to date with the current GSD state — no need to remember which specific command to use or when.

## Usage

```
/jira-sync
/jira-sync 12
```

Without arguments, syncs all phases that need attention. With a phase number, focuses on that phase only.

## What it does

1. Reads ROADMAP.md and compares it with the manifest to find new phases not yet in Jira
2. For each phase that needs syncing, automatically determines what action is needed and executes it:
   - **New phase** (not in manifest) → creates Epic in Jira
   - **Discussed phase** (CONTEXT.md exists) → updates Epic with context, moves to In Progress
   - **Planned phase** (PLAN.md exists) → creates missing Stories and Tasks
   - **Executing phase** (STATE.md shows progress) → updates task/story statuses
   - **Complete phase** → marks Epic as Done
3. Updates the manifest
4. Shows a summary of everything that was done

## Instructions for Claude

<instructions>

### Step 1 — Read config and manifest

Read `gsd-bridge-jira.json` and `.planning/jira-bridge/manifest.json`.

If the manifest does not exist, stop:
```
✗ gsd-jira-bridge not initialized. Run /jira-init first.
```

### Step 2 — Read full GSD state

Read the following files to build a complete picture of the project:
- `.planning/ROADMAP.md` — full phase list
- `.planning/STATE.md` — current execution state
- `.planning/phases/` — list of phase folders to detect CONTEXT.md and PLAN.md

For each phase in the ROADMAP, determine:
- Is it in the manifest? (`in_manifest: true/false`)
- Does CONTEXT.md exist? (`discussed: true/false`)
- Does PLAN.md exist? (`planned: true/false`)
- What is its state in STATE.md? (`todo / in_progress / done`)

### Step 3 — If a phase number was provided

Filter to only that phase. If it is not in the ROADMAP, stop:
```
✗ Phase N not found in ROADMAP.md
```

### Step 4 — Determine action needed for each phase

For each phase (or the specified one), determine the action:

| Condition | Action |
|---|---|
| Not in manifest | `create_epic` — create Epic in Jira and add to manifest |
| In manifest, CONTEXT.md exists, Epic still To Do | `sync_context` — update Epic description, move to In Progress |
| In manifest, PLAN.md exists, no Stories in manifest | `sync_tasks` — create Stories and Tasks |
| In manifest, STATE.md shows progress, tasks not updated | `update_status` — update task/story/epic statuses |
| In manifest, STATE.md shows done, Epic not Done in Jira | `close_phase` — transition Epic to Done |
| Everything already in sync | `skip` — nothing to do |

### Step 5 — Execute actions

For each phase that needs action, execute it in order. Reuse the exact logic from:
- `create_epic` → same as Step 5 in `/jira-init` for a single phase
- `sync_context` → same as Steps 5-7 in `/jira-sync-phase`
- `sync_tasks` → same as Steps 5-6 in `/jira-sync-tasks`
- `update_status` → same as Steps 5-6 in `/jira-update`
- `close_phase` → transition Epic to Done, update manifest

For `create_epic`: also check if CONTEXT.md or PLAN.md already exist for this phase and immediately chain the appropriate follow-up actions.

### Step 6 — Update the manifest

Update all modified entries in the manifest with timestamps.

### Step 7 — Output summary

```
✓ /jira-sync complete

  Phase 9  → already in sync ✓
  Phase 10 → already in sync ✓
  Phase 11 → already in sync ✓
  Phase 12 → Epic created (EZ-149) + context synced ✓

  1 phase updated, 3 already in sync.

  [If nothing needed]
  ✓ Everything in sync — no actions needed.
```

</instructions>
