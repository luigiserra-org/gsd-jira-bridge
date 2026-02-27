# /jira-status

Shows a complete overview of the sync state between GSD and Jira. Use it at any time to understand where you are and what still needs syncing.

## Usage

```
/jira-status
```

## What it does

1. Reads the manifest and GSD STATE.md
2. Compares statuses between GSD and Jira
3. Highlights any mismatches
4. Suggests the next command to run

## Instructions for Claude

<instructions>

### Step 1 — Read config and manifest

Read `gsd-jira-bridge.json` and `.planning/jira-bridge/manifest.json`.

If the manifest does not exist or is empty, show:
```
✗ gsd-jira-bridge not initialized.
  Run /gsd:new-project → then /jira-init
```
And stop.

### Step 2 — Read GSD state

Read `.planning/STATE.md` and `.planning/ROADMAP.md`.
Determine:
- Current milestone
- Current phase
- Total number of phases
- Overall state (planning / executing / verifying)

### Step 3 — Compare GSD vs Jira

For each phase in the manifest, compare the GSD state with the expected Jira state:

| GSD State | Expected Jira State | Mismatched? |
|---|---|---|
| todo | Epic: To Do | No |
| in_progress | Epic: In Progress | No |
| planned | Stories + Tasks created | No |
| executing | Tasks In Progress | No |
| done | Epic: Done | No |

Identify all mismatches.

### Step 4 — Live check on Jira (optional)

If there are tasks in the manifest with status `in_progress` or `done`, use the Jira MCP to verify their current status in Jira and compare with the manifest. Report any discrepancies.

### Step 5 — Output summary

```
╔══════════════════════════════════════════════╗
║        gsd-jira-bridge — Status              ║
╚══════════════════════════════════════════════╝

  Milestone   → [name] (Jira Version: [name])
  Project     → [PROJECT_KEY] — [base_url]

  ┌─────────────────────────────────────────────┐
  │ Phase   │ GSD State    │ Jira Epic  │  Sync │
  ├─────────────────────────────────────────────┤
  │ Phase 1 │ done         │ PRJ-1 Done │  ✓    │
  │ Phase 2 │ executing    │ PRJ-2 In   │  ✓    │
  │ Phase 3 │ todo         │ PRJ-3 Todo │  ✓    │
  └─────────────────────────────────────────────┘

  Phase 2 — Task Detail:
    Wave 0 [PRJ-10] Done ✓
    Wave 1 [PRJ-13] In Progress ⚡
      ├── [PRJ-14] Implement endpoint → Done ✓
      └── [PRJ-15] Input validation   → In Progress ⚡

  Milestone progress: 1/3 phases complete (33%)
  Phase 2 progress:   3/4 tasks complete (75%)

  [If mismatches found]
  ⚠ Mismatches detected:
    - Phase 2: GSD=done but Jira Epic still In Progress
      → Run: /jira-update 2

  [Suggested next command]
  → Recommended next step: /jira-update 2
```

</instructions>
