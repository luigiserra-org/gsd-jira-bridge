# /jira-annotate

Adds a comment to each Jira Issue (Epic, Story, Task) with a direct link to the corresponding GSD document on GitHub/GitLab. Team members can navigate from Jira directly to PLAN.md, CONTEXT.md, or SUMMARY.md without leaving Jira.

## Usage

```
/jira-annotate
/jira-annotate --phase 1
/jira-annotate --all
```

Without arguments, annotates the current phase. With `--phase N` annotates a specific phase. With `--all` annotates all phases in the milestone.

## What it does

1. Reads the manifest to find Jira Issues for each Phase
2. Builds the URL to the corresponding GSD document on GitHub/GitLab
3. Adds a comment to each Issue with the link and a summary
4. Marks the annotation in the manifest

## Instructions for Claude

<instructions>

### Step 1 — Read config, manifest and GSD config

Read `gsd-jira-bridge.json` and `.planning/jira-bridge/manifest.json`.
Also read `.planning/config.json` from GSD for any remote repository info.

### Step 2 — Determine the repository base URL

To build links to GSD files, you need the remote repository URL. Try in order:

1. Run `git remote get-url origin` to get the remote URL
2. Convert SSH to HTTPS if needed:
   - `git@github.com:user/repo.git` → `https://github.com/user/repo`
   - `git@gitlab.com:user/repo.git` → `https://gitlab.com/user/repo`
3. Determine the current branch: `git branch --show-current`

If the remote cannot be determined, ask the user:
```
? No remote repository found.
  Enter the base URL of your repo (e.g. https://github.com/user/repo):
```

Build the base URL for links:
- GitHub: `{repo_url}/blob/{branch}/`
- GitLab: `{repo_url}/-/blob/{branch}/`

### Step 3 — Determine phases to annotate

- Without arguments: use the current phase from `STATE.md`
- With `--phase N`: use that phase
- With `--all`: all phases in the manifest

For each phase, determine which GSD documents exist:

| Document | Path | Available after |
|---|---|---|
| CONTEXT.md | `.planning/phases/{N}-*/CONTEXT.md` | discuss-phase |
| PLAN.md | `.planning/phases/{N}-*/{N}-*-PLAN.md` | plan-phase |
| SUMMARY.md | `.planning/phases/{N}-*/SUMMARY.md` | execute-phase |
| VERIFICATION.md | `.planning/phases/{N}-*/VERIFICATION.md` | verify-work |

### Step 4 — Build comments for each Issue

**For Epics (Phase):**

```markdown
📋 **GSD — Phase Documents**

| Document | Link |
|---|---|
| CONTEXT.md | [Open]({base_url}.planning/phases/01-authentication/CONTEXT.md) |
| PLAN.md | [Open]({base_url}.planning/phases/01-authentication/01-1-PLAN.md) |
| SUMMARY.md | Not yet available |

GSD Branch: `gsd/phase-01-authentication`
Updated: {timestamp}
```

**For Stories (Wave):**

```markdown
📋 **GSD — Wave 1**

Phase plan: [{base_url}.planning/phases/01-authentication/PLAN.md]
Wave: 1 of N

Updated: {timestamp}
```

**For Tasks:**

```markdown
📋 **GSD — Task**
Phase: 1 | Wave: 1
Plan: [{base_url}.planning/phases/01-authentication/PLAN.md]
```

### Step 5 — Check if comment already exists

Before adding a comment, check whether a comment with the header `📋 **GSD —` already exists on the Issue. If it does:
- Update the existing comment (do not create duplicates)
- Report that the comment was updated, not newly created

### Step 6 — Add comments in Jira

Use the Jira MCP to add (or update) the comment on each Issue.

### Step 7 — Update the manifest

For each annotated Issue, add to the manifest:

```json
{
  "annotated_at": "<ISO timestamp>",
  "repo_url": "<repo base url>"
}
```

### Step 8 — Output summary

```
✓ /jira-annotate complete

  Repository: https://github.com/user/ezyfront
  Branch: main

  Phase 1 [gsd/phase-01-authentication]:
    ✓ Epic  PRJ-1  → comment added (3 documents linked)
    ✓ Story PRJ-10 → comment added
    ✓ Story PRJ-13 → comment added
    ✓ Task  PRJ-11 → comment added
    ✓ Task  PRJ-14 → comment added

  Total: 5 Issues annotated

  Tip: re-run /jira-annotate after each execute-phase
  to update links with newly generated documents.
```

</instructions>
