# /jira-repair

Rebuilds or repairs the `jira-bridge/manifest.json` by querying Jira directly. Use this when the manifest has gone out of sync — corrupted file, deleted Issues, manual edits, or a migration.

## Usage

```
/jira-repair
/jira-repair --full
```

With `--full` rewrites the entire manifest from scratch by querying Jira (slower but guarantees maximum accuracy).

## What it does

1. Analyzes the current manifest and identifies inconsistencies
2. Queries Jira to retrieve the real state of all Issues
3. Reconciles the differences
4. Rewrites the corrected manifest

## Instructions for Claude

<instructions>

### Step 1 — Read config

Read `gsd-jira-bridge.json`. If it does not exist, stop:
```
✗ gsd-jira-bridge not configured. Run ./install.sh first.
```

### Step 2 — Assess manifest state

Try to read `.planning/jira-bridge/manifest.json`.

Three possible scenarios:

**A) Manifest does not exist or is empty:**
Warn the user and proceed in full rebuild mode (same as `--full`).

**B) Manifest exists but is potentially corrupt:**
Check the JSON structure — if it is not valid JSON, proceed in full rebuild mode.

**C) Manifest exists and is valid:**
Proceed with targeted reconciliation.

### Step 3 — Fetch real state from Jira

**Fix Version (Milestone):**
Use the Jira MCP to list project Versions. Find the one matching `milestone.jira_version_name` in the manifest (or, in `--full` mode, ask the user which Version to use).

**Epics (Phases):**
JQL: `project = {project_key} AND issuetype = Epic AND labels = "gsd-phase" ORDER BY created ASC`

**Stories (Waves):**
JQL: `project = {project_key} AND issuetype = Story AND labels = "gsd-wave" ORDER BY created ASC`

**Tasks:**
JQL: `project = {project_key} AND issuetype = Task AND labels = "gsd-task" ORDER BY created ASC`

### Step 4 — Read GSD state

Read `.planning/ROADMAP.md` and `.planning/STATE.md` to have the GSD reference for rebuilding the mapping.

### Step 5 — Identify inconsistencies

Compare manifest vs real Jira vs GSD ROADMAP:

| Problem type | Description |
|---|---|
| `missing_in_manifest` | Issue exists in Jira with gsd-* label but not in manifest |
| `missing_in_jira` | Key in manifest but Issue not found in Jira (possibly deleted) |
| `status_mismatch` | Status in manifest differs from actual Jira status |
| `branch_mismatch` | Epic name in Jira does not match `gsd/phase-{N}-{slug}` format |
| `orphan_story` | Story in Jira with gsd-wave label but not linked to any gsd-phase Epic |

Show the inconsistency summary:

```
🔍 Analysis complete — N inconsistencies found:

  MISSING IN MANIFEST:
  → PRJ-23 (Epic) "gsd/phase-03-reporting" — exists in Jira, missing from manifest

  STATUS MISMATCH:
  → PRJ-11 (Task) manifest=todo but Jira=Done
  → PRJ-14 (Story) manifest=in_progress but Jira=Done

  MISSING IN JIRA:
  → PRJ-99 (Task) in manifest but not found in Jira (possibly deleted)

Proceed with repair? (y/n)
```

### Step 6 — Apply fixes

On user confirmation:

**For `missing_in_manifest`:** Add the Issue to the manifest with data fetched from Jira.

**For `missing_in_jira`:** Mark the manifest entry as `"jira_deleted": true` and add an explanatory `"note"` field. Do not remove from manifest to preserve history.

**For `status_mismatch`:** Update the status in the manifest to match Jira (Jira is source of truth).

**For `branch_mismatch`:** Update the `gsd_branch` field in the manifest with the correct name derived from the Epic summary.

**For `orphan_story`:** Add to the `unplanned` section of the manifest, flagged for review.

### Step 7 — Write the repaired manifest

Update `.planning/jira-bridge/manifest.json` with all fixes applied.

Append a `repair_log` entry:

```json
{
  "repair_log": [
    {
      "repaired_at": "<ISO timestamp>",
      "issues_fixed": 3,
      "details": "Updated 2 statuses, recovered 1 missing Epic"
    }
  ]
}
```

### Step 8 — Output summary

```
✓ /jira-repair complete

  Inconsistencies found:  N
  Fixed:                  X
  Needs review:           Y (see unplanned section in manifest)

  Manifest updated: .planning/jira-bridge/manifest.json

  Tip: run /jira-status to verify the current state.
```

</instructions>
