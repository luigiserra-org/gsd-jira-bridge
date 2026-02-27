# /jira-update

Run this command after `/gsd:execute-phase [N]` (or at any point during execution) to update Task and Story statuses in Jira based on actual GSD progress.

## Usage

```
/jira-update 1
/jira-update 2
```

## What it does

1. Reads GSD `STATE.md` to determine which tasks are complete
2. Updates each Jira Task status (Todo → In Progress → Done)
3. Updates Story (Wave) status when all tasks are done
4. Adds comments to tasks with commit details
5. Updates the manifest

## Instructions for Claude

<instructions>

### Step 1 — Read phase number from input

Call it `PHASE_NUM`. If not provided, ask the user.

### Step 2 — Read config and manifest

Read `gsd-jira-bridge.json` and `.planning/jira-bridge/manifest.json`.

From `tasks`, filter those with `gsd_phase == PHASE_NUM`.
From `waves`, filter those with `gsd_phase == PHASE_NUM`.

### Step 3 — Read GSD state

Read `.planning/STATE.md`. Identify:
- Tasks marked as **completed** (✓ or [x] or status "done")
- Tasks **in progress**
- Tasks still **todo**

Also read recent git log to associate commits with tasks:
```bash
git log --oneline -20
```

### Step 4 — Reconcile GSD state with Jira manifest

For each task in the phase manifest:
1. Find the corresponding task in STATE.md (by description or position)
2. Determine the new Jira status: `todo` | `in_progress` | `done`
3. Compare with the current status in the manifest

### Step 5 — Update Tasks in Jira

For each task whose status has changed:

**If moved to "In Progress":**
- Transition the Jira Issue to "In Progress"

**If moved to "Done":**
- Transition the Jira Issue to "Done"
- Add a comment:
  ```
  ✓ Completed by GSD
  Phase: N | Wave: X
  Commit: [hash] — [commit message if available]
  ```

### Step 6 — Update Stories (Waves) in Jira

For each Wave in the phase:
- If **all tasks** in the wave are Done → transition the Story to "Done"
- If **at least one task** is In Progress → transition the Story to "In Progress" (if not already)

### Step 7 — Update the manifest

For each updated task, write in the manifest:
```json
{
  "status": "done",
  "completed_at": "<ISO timestamp>",
  "commit": "<hash>"
}
```

For each updated wave:
```json
{
  "status": "done",
  "completed_at": "<ISO timestamp>"
}
```

### Step 8 — Check phase completion

If **all tasks** in the phase are Done:
- Transition the phase Epic to "Done" in Jira
- Update the manifest: `"status": "done"` for the phase
- Show a special message in the summary

### Step 9 — Output summary

```
✓ Phase N — Jira updated

  Wave 0 [PRJ-10] → Done ✓
    ├── [PRJ-11] Configure environment → Done ✓
    └── [PRJ-12] Install dependencies → Done ✓

  Wave 1 [PRJ-13] → In Progress ⚡
    ├── [PRJ-14] Implement endpoint → Done ✓
    └── [PRJ-15] Input validation   → In Progress ⚡

  Progress: 3/4 tasks complete (75%)

  [If phase complete]
  🎉 Phase N complete! Epic [EPIC_KEY] → Done
  Next step: /gsd:verify-work N → /gsd:discuss-phase N+1 → /jira-sync-phase N+1
```

</instructions>
