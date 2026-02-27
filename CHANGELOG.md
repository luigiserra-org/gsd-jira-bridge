# Changelog

All notable changes to gsd-jira-bridge are documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.3.3] — 2026-02-27

### New /jira-sync command

#### Added
- `/jira-sync` — all-in-one sync command: detects what each phase needs (create Epic, sync context, create tasks, update statuses) and executes everything automatically. Run it at any time without worrying about which specific command to use.
- `/jira-sync N` — same but focused on a single phase

#### Changed
- README workflow section updated: `/jira-sync` is now the recommended command after each GSD step
- Installer summary updated to highlight `/jira-sync` as the main sync command

---

## [1.3.2] — 2026-02-27

### Improved installer messages

#### Changed
- Brownfield warning rewritten: instructions now clearly say to finish installation first, then open Claude Code
- Cloud ID instructions fixed: now points to `/_edge/tenant_info` endpoint which actually works
- Project Key instructions simplified

---

## [1.3.0] — 2026-02-27

### npm package — cross-platform installation

#### Added
- `package.json` — published as `gsd-jira-bridge` on npm
- `bin/install.js` — Node.js cross-platform installer replacing `install.sh` (works on Windows, Linux, macOS natively)
- `--uninstall` flag: `npx gsd-jira-bridge --uninstall`
- `--dry-run` flag for testing without writing files
- `.github/workflows/npm-publish.yml` — GitHub Action that publishes to npm automatically on git tag push
- GitHub Release created automatically alongside each npm publish
- Version consistency check: Action fails if `package.json` version does not match the git tag

#### Changed
- Installation is now simply `npx gsd-jira-bridge` — no cloning, no bash, no path issues
- `install.sh` and `uninstall.sh` kept for reference but superseded by the npm installer

---

## [1.2.0] — 2026-02-26

### Brownfield support — safe installs on existing projects

#### Added
- `/jira-init` now reads `STATE.md` to classify each phase as `done`, `in_progress`, or `todo` before creating Jira Issues
- Completed phases are created as Done Epics in Jira with a note — no Stories or Tasks generated (avoids noise)
- In-progress phases are created with correct Epic status; `/jira-sync-tasks` creates only open waves/tasks
- `skip_tasks: true` flag in manifest prevents accidental Story/Task creation for completed phases
- `/jira-sync-tasks` skips Waves and Tasks already marked complete in `STATE.md`; logs each skip with reason
- `/jira-sync-phase` now guards against updating Epics for already-complete phases
- `install.sh` detects existing `.planning/STATE.md` and shows a brownfield warning with guidance
- `brownfield: true` field in manifest when existing completed phases are detected

---

## [1.1.0] — 2026-02-26

### Reverse flow and utility commands

#### Added
- Command `/jira-pull` — reverse flow Jira → GSD: detects Issues created manually in Jira not tracked in the manifest, proposes how to integrate them into GSD, adds `gsd-tracked` label
- Command `/jira-validate` — verifies installation health in 5 steps (config, MCP, Jira project, Issue types, GSD)
- Command `/jira-repair` — reconciles manifest with real Jira state, detects and fixes all inconsistency types; `--full` flag for complete rebuild
- Command `/jira-annotate` — adds a comment to each Jira Issue with a direct link to GSD documents (CONTEXT.md, PLAN.md, SUMMARY.md) on GitHub/GitLab; supports `--phase N` and `--all`
- `unplanned` section in manifest to track Issues imported via `/jira-pull`
- `repair_log` field in manifest to record repair history
- `install.sh` updated: suggests `/jira-validate` as first command after installation
- `uninstall.sh` updated: removes all 4 new commands as well

---

## [1.0.0] — 2026-02-26

### First public release

#### Added
- `install.sh` — interactive installer with prerequisite checks (Claude Code, GSD, Jira MCP)
- `uninstall.sh` — clean removal of all installed files
- `config.template.json` — Jira configuration template
- Command `/jira-init` — initializes Fix Version and Epics in Jira after `/gsd:new-project`
- Command `/jira-sync-phase` — updates Epic with context from `/gsd:discuss-phase`, verifies GSD branch alignment
- Command `/jira-sync-tasks` — creates Stories (Waves) and Tasks in Jira after `/gsd:plan-phase`
- Command `/jira-update` — reconciles GSD → Jira state after `/gsd:execute-phase`
- Command `/jira-close` — releases Fix Version and archives manifest after `/gsd:complete-milestone`
- Command `/jira-status` — sync overview at any time with mismatch detection
- `.planning/jira-bridge/manifest.json` as persistent GSD ↔ Jira mapping registry
- Epic names aligned to GSD branch format: `gsd/phase-{N}-{slug}`

#### Mapping implemented
| GSD | Jira |
|-----|------|
| Milestone | Fix Version |
| Phase | Epic (named after GSD branch) |
| Wave | Story |
| Task | Task |

---

## Roadmap

### [1.2.0] — planned
- Support for GSD `branching_strategy: milestone`
- `/jira-sync-wave` command for granular Wave-level updates
- `--dry-run` flag on all commands to preview changes before applying

### [1.3.0] — planned
- Multi-project support (multiple `project_key` values for different milestones)
- Confluence integration to auto-create documentation pages per Phase
