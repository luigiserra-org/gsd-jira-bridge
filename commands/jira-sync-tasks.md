# /jira-sync-tasks

Run this command after `/gsd:plan-phase [N]` to create Stories (Waves) and Tasks in Jira corresponding to the GSD plan generated.

Only creates Issues for Waves and Tasks that are **not yet complete** in GSD. Safe to run on existing projects — already-finished work is skipped automatically.

## Usage

```
/jira-sync-tasks 1
/jira-sync-tasks 2
```

## What it does

1. Checks the manifest — if the phase has `skip_tasks: true`, stops immediately
2. Reads GSD `STATE.md` to identify which Waves and Tasks are already complete
3. Reads the `PLAN.md` for phase N
4. **Skips** already-completed Waves and Tasks
5. Creates Stories and Tasks only for open work
6. Updates the manifest

## Instructions for Claude

<instructions>

### Step 1 — Read phase number from input

The user passed a number (e.g. `1`). Call it `PHASE_NUM`.

### Step 2 — Read config and manifest

Read `gsd-jira-bridge.json` and `.planning/jira-bridge/manifest.json`.

From `phases`, find the entry with `gsd_phase == PHASE_NUM`.

**If `skip_tasks` is `true`**, stop immediately:
```
⏭ Phase N is marked as complete — no Stories or Tasks will be created.
  This phase was finished before gsd-jira-bridge was installed.
  Its Epic in Jira is already set to Done.
```

Extract `jira_epic_key`, `jira_epic_id`, and `jira_version_id` from `milestone`.

### Step 3 — Read GSD STATE.md to classify waves and tasks

Read `.planning/STATE.md`. For the current phase, identify the completion state of each Wave and each Task:

| STATE.md signal | Classification |
|---|---|
| Wave/Task marked ✓ / complete / done | `done` — skip |
| Wave/Task marked in progress / current | `in_progress` — create as In Progress |
| Wave/Task not mentioned or marked todo | `todo` — create as To Do |

Build a map:
```
wave_0: done
wave_1: in_progress
  task_0: done
  task_1: in_progress
  task_2: todo
wave_2: todo
  task_0: todo
```

If STATE.md does not exist or has no data for this phase, treat everything as `todo`.

**If all waves are `done`**, stop:
```
⏭ All waves in Phase N are already complete in GSD.
  No Stories or Tasks will be created.
  Run /jira-update N to record the completion state in Jira.
```

### Step 4 — Read PLAN.md

Look for `.planning/phases/[N]-*/PLAN.md`.

Parse the Wave → Task structure. Cross-reference with the state map from Step 3.

If PLAN.md does not exist, stop:
```
✗ PLAN.md not found for Phase N. Run /gsd:plan-phase N first.
```

### Step 5 — Create Stories for open Waves only

For each Wave:

**If wave is `done`:** Skip — do not create a Story. Log it as skipped.

**If wave is `in_progress` or `todo`:** Create a Jira Issue of type **Story**:
- `summary`: Wave title (e.g. "Wave 1: Core Feature")
- `description`: list of tasks in this wave (marking done ones as already complete)
- `fixVersions`: `[{ "id": jira_version_id }]`
- `labels`: `["gsd-wave"]`
- Link to Epic

If wave is `in_progress`, transition the Story to "In Progress" after creation.

Save: `jira_story_id`, `jira_story_key`, `wave_number`, `skipped: false`.

### Step 6 — Create Tasks for open Tasks only

For each Task within each non-skipped Wave:

**If task is `done`:** Skip — do not create a Task. Log it as skipped.

**If task is `in_progress` or `todo`:** Create a Jira Issue of type **Task**:
- `summary`: GSD task description
- `description`: task details from PLAN.md
- `parent`: `jira_story_key` of the parent Wave
- `fixVersions`: `[{ "id": jira_version_id }]`
- `labels`: `["gsd-task"]`

If task is `in_progress`, transition to "In Progress" after creation.

Save: `jira_task_id`, `jira_task_key`, `wave_number`, `skipped: false`.

### Step 7 — Update the manifest

Add waves and tasks. Use `"skipped": true` for those not created:

```json
{
  "waves": [
    {
      "gsd_phase": 2,
      "wave_number": 0,
      "wave_title": "Wave 0: Setup",
      "skipped": true,
      "skip_reason": "already complete in GSD"
    },
    {
      "gsd_phase": 2,
      "wave_number": 1,
      "wave_title": "Wave 1: Core Feature",
      "jira_story_id": "xxx",
      "jira_story_key": "PRJ-10",
      "status": "in_progress",
      "skipped": false
    }
  ],
  "tasks": [
    {
      "gsd_phase": 2,
      "wave_number": 1,
      "task_description": "Implement endpoint",
      "skipped": true,
      "skip_reason": "already complete in GSD"
    },
    {
      "gsd_phase": 2,
      "wave_number": 1,
      "task_description": "Add input validation",
      "jira_task_id": "xxx",
      "jira_task_key": "PRJ-11",
      "status": "todo",
      "skipped": false
    }
  ]
}
```

Update the phase status:
```json
{
  "status": "planned",
  "tasks_synced_at": "<ISO timestamp>"
}
```

### Step 8 — Output summary

```
✓ Phase N — tasks synced with Jira

  Epic  → [EPIC_KEY]: gsd/phase-{N}-{slug}

  Wave 0 → skipped (already complete in GSD)

  Wave 1 → Story [PRJ-10]  (In Progress ⚡)
    ├── Task: Implement endpoint  → skipped (already done)
    └── Task: Add input validation → [PRJ-11] created ✓

  Wave 2 → Story [PRJ-13]  (To Do)
    ├── Task: Write tests     → [PRJ-14] created ✓
    └── Task: Deploy to staging → [PRJ-15] created ✓

  Created: 1 Story, 3 Tasks
  Skipped: 1 Wave, 1 Task (already complete in GSD)

  Next step: /gsd:execute-phase N → then /jira-update N
```

</instructions>
