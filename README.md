# gsd-jira-bridge

> Automatically syncs [GSD (Get Shit Done)](https://github.com/gsd-build/get-shit-done) with Jira — no enterprise theater, no friction.

GSD is the best planning and execution system for Claude Code. Jira is the project management tool used by professional teams. **gsd-jira-bridge** is the bridge between the two.

Every time GSD advances through its cycle (new milestone, discuss phase, plan phase, execute, complete), a simple slash command keeps Jira perfectly aligned — updating Epics, Stories, Tasks, and Versions atomically.

---

## GSD → Jira Mapping

| GSD | Jira |
|-----|------|
| Milestone | Fix Version |
| Phase | Epic (named after GSD branch) |
| Wave | Story |
| Task | Task |

Epic names follow the GSD branch format exactly: `gsd/phase-{N}-{slug}` (e.g. `gsd/phase-01-authentication`), ensuring perfect traceability between git and Jira.

---

## Prerequisites

Before installing, make sure you have:

1. **Claude Code** installed and configured
2. **GSD** installed (global or local):
   ```bash
   npx get-shit-done-cc --claude --global
   ```
3. **Jira MCP** configured in Claude Code — your `claude_desktop_config.json` must include the Atlassian/Jira MCP server
4. An existing **Jira project** with Epic, Story, and Task as Issue types
5. Your **Jira Cloud ID** and **Project Key** ready

The installer checks all of this and guides you step by step.

---

## Installation

Open a terminal **from inside your project** and run:

```bash
npx gsd-jira-bridge
```

That's it. Works on Windows, Linux, and macOS — no cloning, no path issues, no cleanup needed. npm downloads the installer, runs it, and removes itself automatically.

The installer asks for:
- Install type: **global** (`~/.claude/`) or **local** (`./.claude/`)
- Jira Cloud ID
- Jira Project Key (e.g. `EZY`)
- Jira Base URL (e.g. `https://yourorg.atlassian.net`)

Config is saved to `~/.claude/gsd-jira-bridge.json` (or `./.claude/gsd-jira-bridge.json` for local installs).

To uninstall:

```bash
npx gsd-jira-bridge --uninstall
```

After installing, run `/jira-validate` to confirm everything is working before starting.

---

## After Installation — Getting Started

Once the installer completes, the `/jira-*` commands are available globally in Claude Code. You don't need to do anything else to "load" them.

**Step 1 — Open your project in Claude Code**

Navigate to your project folder in the terminal and launch Claude Code:

```bash
cd path/to/your/project
claude
```

If you don't have a project yet, create one first:

```bash
mkdir my-project
cd my-project
git init
claude
```

**Step 2 — Verify the installation**

Once inside Claude Code, run:

```
/jira-validate
```

This checks that the config, Jira MCP connection, and Issue types are all working. Fix any issues it reports before proceeding.

**Step 3 — Start your GSD workflow**

If you are starting a new project:

```
/gsd:new-project
```

Then immediately initialize the Jira structure:

```
/jira-init
```

If you are joining an existing project that already has `.planning/`:

```
/jira-init
```

gsd-jira-bridge will detect completed phases automatically and handle them correctly.

**Step 4 — Follow the workflow**

From here, each GSD command has a corresponding bridge command. Run them in pairs:

```
/gsd:discuss-phase 1    →   /jira-sync-phase 1
/gsd:plan-phase 1       →   /jira-sync-tasks 1
/gsd:execute-phase 1    →   /jira-update 1
/gsd:complete-milestone →   /jira-close
```

Not sure where you are? Run `/jira-status` at any time for a full overview.

---



gsd-jira-bridge plugs into the GSD cycle without modifying it. For each GSD step, run the corresponding bridge command:

```
/gsd:new-project          → /jira-init
/gsd:discuss-phase N      → /jira-sync-phase N
/gsd:plan-phase N         → /jira-sync-tasks N
/gsd:execute-phase N      → /jira-update N   (repeatable)
/gsd:complete-milestone   → /jira-close
```

Utilities — use anytime:
```
/jira-status              → full sync overview + mismatch detection
/jira-pull                → import Jira issues not tracked in GSD
/jira-annotate            → link GSD documents to Jira Issues
/jira-validate            → verify installation health (run once after install)
/jira-repair              → repair manifest if out of sync
```

### Example

```bash
# 1. New GSD project
/gsd:new-project
# → Answer questions, approve roadmap

# 2. Initialize Jira
/jira-init
# → Creates Fix Version "v1.0.0 - MVP" and Epics for each Phase

# 3. Plan Phase 1
/clear
/gsd:discuss-phase 1
# → Discuss objectives and context

# 4. Sync Phase 1 to Jira
/jira-sync-phase 1
# → Updates Epic with context, moves it to In Progress

# 5. Generate the plan
/gsd:plan-phase 1
# → Creates PLAN.md with Waves and Tasks

# 6. Create Stories and Tasks in Jira
/jira-sync-tasks 1
# → Creates one Story per Wave, one Task per GSD task

# 7. Execute
/gsd:execute-phase 1

# 8. Update Jira during/after execution
/jira-update 1
# → Updates statuses from STATE.md and git log

# 9. Annotate Jira Issues with links to GSD documents
/jira-annotate --phase 1

# 10. Check for any manually created Jira issues
/jira-pull

# 11. Verify and move to next phase
/gsd:verify-work 1
/clear
# → Repeat from step 3 for Phase 2

# 12. Close the milestone
/gsd:complete-milestone
/jira-close
# → Releases Fix Version, archives manifest
```

---

## Commands

### `/jira-init`
Initializes the Jira structure for the current GSD milestone. Creates the Fix Version and one Epic per Phase. Saves everything to `.planning/jira-bridge/manifest.json`.

**When:** after `/gsd:new-project`

---

### `/jira-sync-phase N`
Updates the Jira Epic for Phase N with the context from `/gsd:discuss-phase`. Verifies the Epic name matches the GSD branch format. Transitions the Epic to "In Progress".

**When:** after `/gsd:discuss-phase N`

---

### `/jira-sync-tasks N`
Creates Stories (one per Wave) and Tasks (one per GSD task) for Phase N. Links them to the Epic and Fix Version.

**When:** after `/gsd:plan-phase N`

---

### `/jira-update N`
Reconciles GSD state (STATE.md + git log) with Jira. Updates Task, Story, and Epic statuses. Adds comments with commit references.

**When:** after `/gsd:execute-phase N`, or during execution for intermediate updates

---

### `/jira-close`
Closes the milestone: releases the Fix Version in Jira, adds release notes from GSD CHANGELOG, archives the manifest.

**When:** after `/gsd:complete-milestone`

---

### `/jira-status`
Full sync overview. Compares GSD and Jira state, identifies mismatches, suggests the next command.

**When:** anytime

---

### `/jira-pull [--phase N]`
Reverse flow — Jira → GSD. Detects Issues created manually in Jira that GSD doesn't know about. Proposes how to integrate each one into the GSD workflow. Accepts `--phase N` to limit the search.

**When:** periodically, or whenever someone creates Issues in Jira outside the GSD workflow

---

### `/jira-annotate [--phase N | --all]`
Adds a comment to each Jira Issue with a direct link to the corresponding GSD document (CONTEXT.md, PLAN.md, SUMMARY.md) on GitHub/GitLab. Keeps the team aligned without leaving Jira.

**When:** after each `execute-phase` or `verify-work` to keep links up to date

---

### `/jira-validate`
Verifies in 5 steps that everything is correctly configured: config file, MCP connection, Jira project, Issue types, GSD installation. Produces a report with instructions for fixing any issues.

**When:** once after installation, or when something stops working

---

### `/jira-repair [--full]`
Reconciles the manifest with the real state of Jira when they go out of sync. Detects Issues missing from the manifest, stale statuses, Issues deleted from Jira, and Epic names not matching the GSD branch format.

**When:** if the manifest is corrupt, if you've manually edited Issues in Jira, or after a migration

---

## Generated files

```
.planning/
└── jira-bridge/
    ├── manifest.json          ← current sync state
    └── archive/
        └── manifest-v1.0.0-[timestamp].json   ← previous milestones
```

The `manifest.json` is the core of the bridge: it maps every GSD entity (phase, wave, task) to the corresponding Jira Issue (epic key, story key, task key) and tracks its status.

---

## Uninstall

```bash
./uninstall.sh
```

Removes all slash commands and the config file. Data in `.planning/jira-bridge/` is preserved.

---

## Compatibility

- GSD: `gsd-build/get-shit-done` version 1.5+
- Claude Code: any recent version
- Jira: Cloud (Atlassian MCP)
- GSD install type: both global and local supported

---

## Author

**Luigi Serra**
- GitHub: [@luigiserra-org](https://github.com/luigiserra-org)
- LinkedIn: [luigiserra](https://www.linkedin.com/in/luigiserra/)

---

## License

MIT
