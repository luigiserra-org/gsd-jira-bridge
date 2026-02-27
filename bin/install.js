#!/usr/bin/env node
// =============================================================================
// gsd-jira-bridge — Installer
// Cross-platform (Windows, Linux, macOS)
// =============================================================================

const fs   = require('fs');
const path = require('path');
const os   = require('os');
const rl   = require('readline');

// ── Flags ─────────────────────────────────────────────────────────────────────
const DRY_RUN    = process.argv.includes('--dry-run');
const UNINSTALL  = process.argv.includes('--uninstall');

// ── Colors (disabled on Windows CMD without VT support) ───────────────────────
const IS_WIN = process.platform === 'win32';
const c = {
  green:  s => `\x1b[32m${s}\x1b[0m`,
  yellow: s => `\x1b[33m${s}\x1b[0m`,
  red:    s => `\x1b[31m${s}\x1b[0m`,
  blue:   s => `\x1b[34m${s}\x1b[0m`,
  bold:   s => `\x1b[1m${s}\x1b[0m`,
};

const ok   = msg => console.log(`${c.green('✓')} ${msg}`);
const warn = msg => console.log(`${c.yellow('⚠')}  ${msg}`);
const err  = msg => console.log(`${c.red('✗')} ${msg}`);
const info = msg => console.log(`${c.blue('→')} ${msg}`);
const log  = msg => console.log(msg);

// ── Readline helper ───────────────────────────────────────────────────────────
function ask(question, defaultVal = '') {
  return new Promise(resolve => {
    const iface = rl.createInterface({ input: process.stdin, output: process.stdout });
    const prompt = defaultVal
      ? `${c.bold('?')} ${question} [${defaultVal}]: `
      : `${c.bold('?')} ${question}: `;
    iface.question(prompt, answer => {
      iface.close();
      resolve(answer.trim() || defaultVal);
    });
  });
}

// ── Paths ─────────────────────────────────────────────────────────────────────
const HOME         = os.homedir();
const GLOBAL_CMDS  = path.join(HOME, '.claude', 'commands');
const GLOBAL_CFG   = path.join(HOME, '.claude', 'gsd-jira-bridge.json');
const LOCAL_CMDS   = path.join(process.cwd(), '.claude', 'commands');
const LOCAL_CFG    = path.join(process.cwd(), '.claude', 'gsd-jira-bridge.json');

// Commands source — relative to this script
const SRC_COMMANDS = path.join(__dirname, '..', 'commands');
const COMMANDS     = fs.readdirSync(SRC_COMMANDS).filter(f => f.endsWith('.md'));

// ── Uninstall mode ────────────────────────────────────────────────────────────
if (UNINSTALL) {
  uninstall();
  process.exit(0);
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  log('');
  log(c.bold('╔════════════════════════════════════════╗'));
  log(c.bold('║      gsd-jira-bridge  installer        ║'));
  log(c.bold('╚════════════════════════════════════════╝'));
  log('');

  if (DRY_RUN) {
    warn('Dry-run mode — no files will be written.');
    log('');
  }

  // ── Step 1: Prerequisites ──────────────────────────────────────────────────
  log(c.bold('[1/4] Checking prerequisites'));
  log('');

  let errors = 0;

  // Claude Code
  const claudeCmd = path.join(HOME, '.claude', 'commands');
  if (fs.existsSync(claudeCmd)) {
    ok('Claude Code config found: ~/.claude/');
  } else {
    err('Claude Code config not found. Install Claude Code first: https://claude.ai/code');
    errors++;
  }

  // GSD
  const gsdGlobal = fs.readdirSync(GLOBAL_CMDS).some(f => f.startsWith('gsd')) ;
  if (fs.existsSync(GLOBAL_CMDS) && fs.readdirSync(GLOBAL_CMDS).some(f => f.startsWith('gsd'))) {
    ok('GSD found (global install)');
  } else if (fs.existsSync(LOCAL_CMDS) && fs.readdirSync(LOCAL_CMDS).some(f => f.startsWith('gsd'))) {
    ok('GSD found (local install)');
  } else {
    err('GSD not found. Install with: npx get-shit-done-cc --claude --global');
    errors++;
  }

  if (errors > 0) {
    log('');
    err(`${errors} error(s) found. Fix prerequisites and re-run.`);
    process.exit(1);
  }

  // Brownfield detection
  const planningState = path.join(process.cwd(), '.planning', 'STATE.md');
  if (fs.existsSync(planningState)) {
    log('');
    warn('Existing GSD project detected — some phases may already be complete.');
    info('No problem: finish this installation, then open Claude Code and run:');
    info('  /jira-validate   → verify everything is working');
    info('  /jira-init       → gsd-jira-bridge will handle completed phases automatically');
  }

  log('');

  // ── Step 2: Jira configuration ─────────────────────────────────────────────
  log(c.bold('[2/4] Jira configuration'));
  log('');
  info('Cloud ID: open https://yourorg.atlassian.net/_edge/tenant_info in your browser — copy the cloudId value');
  info('Project Key: visible in your Jira project URL → .../jira/software/projects/[KEY]/...');
  log('');

  let cloudId = '';
  while (!cloudId) {
    cloudId = await ask('Jira Cloud ID (UUID)');
    if (!cloudId) warn('Cloud ID is required.');
  }

  let projectKey = '';
  while (!projectKey) {
    projectKey = (await ask('Jira Project Key (e.g. EZY)')).toUpperCase();
    if (!projectKey) warn('Project Key is required.');
  }

  let baseUrl = '';
  while (!baseUrl) {
    baseUrl = await ask('Jira base URL (e.g. https://yourorg.atlassian.net)');
    if (!baseUrl) warn('Base URL is required.');
  }

  log('');

  // ── Step 3: Install type ───────────────────────────────────────────────────
  log(c.bold('[3/4] Install type'));
  log('');
  log('  global  → ~/.claude/commands/  (available in all projects)');
  log('  local   → ./.claude/commands/  (current project only)');
  log('');

  const installType = await ask('Install type', 'global');
  const destCmds = installType === 'global' ? GLOBAL_CMDS : LOCAL_CMDS;
  const destCfg  = installType === 'global' ? GLOBAL_CFG  : LOCAL_CFG;

  log('');

  // ── Step 4: Copy files ─────────────────────────────────────────────────────
  log(c.bold('[4/4] Installing files'));
  log('');

  if (!DRY_RUN) {
    fs.mkdirSync(destCmds, { recursive: true });
  }

  for (const cmd of COMMANDS) {
    const src  = path.join(SRC_COMMANDS, cmd);
    const dest = path.join(destCmds, cmd);
    if (!DRY_RUN) fs.copyFileSync(src, dest);
    ok(`Installed: ${dest}`);
  }

  // Write config
  const config = {
    version: '1.0.0',
    jira: { cloud_id: cloudId, project_key: projectKey, base_url: baseUrl },
    mapping: { milestone: 'version', phase: 'epic', wave: 'story', task: 'task' },
    installed_at: new Date().toISOString(),
    install_type: installType,
  };

  if (!DRY_RUN) {
    fs.mkdirSync(path.dirname(destCfg), { recursive: true });
    fs.writeFileSync(destCfg, JSON.stringify(config, null, 2));
  }
  ok(`Config written: ${destCfg}`);

  // ── Summary ────────────────────────────────────────────────────────────────
  log('');
  log(c.bold('╔════════════════════════════════════════╗'));
  log(c.bold('║   gsd-jira-bridge installed! 🎉        ║'));
  log(c.bold('╚════════════════════════════════════════╝'));
  log('');
  log(`${c.bold('Main workflow:')}`);
  log('  /jira-init         → after /gsd:new-project');
  log('  /jira-sync-phase   → after /gsd:discuss-phase');
  log('  /jira-sync-tasks   → after /gsd:plan-phase');
  log('  /jira-update       → after /gsd:execute-phase');
  log('  /jira-close        → after /gsd:complete-milestone');
  log('');
  log(`${c.bold('Utilities:')}`);
  log('  /jira-status       → sync overview');
  log('  /jira-pull         → import untracked Jira issues');
  log('  /jira-annotate     → link GSD documents to Jira Issues');
  log('  /jira-validate     → verify installation (run this now!)');
  log('  /jira-repair       → repair manifest if out of sync');
  log('');
  log(`Start with: ${c.bold('/jira-validate')} → then ${c.bold('/gsd:new-project')} → then ${c.bold('/jira-init')}`);
  log('');
  log(`  by Luigi Serra · github.com/luigiserra-org`);
  log('');
})();

// ── Uninstall function ────────────────────────────────────────────────────────
function uninstall() {
  log('');
  log(c.bold('gsd-jira-bridge — Uninstaller'));
  log('');

  let removed = 0;

  for (const dir of [GLOBAL_CMDS, LOCAL_CMDS]) {
    if (!fs.existsSync(dir)) continue;
    for (const cmd of COMMANDS) {
      const target = path.join(dir, cmd);
      if (fs.existsSync(target)) {
        fs.unlinkSync(target);
        ok(`Removed: ${target}`);
        removed++;
      }
    }
  }

  for (const cfg of [GLOBAL_CFG, LOCAL_CFG]) {
    if (fs.existsSync(cfg)) {
      fs.unlinkSync(cfg);
      ok(`Removed: ${cfg}`);
      removed++;
    }
  }

  if (removed === 0) {
    warn('No gsd-jira-bridge files found. Was it installed?');
  } else {
    log('');
    ok(`gsd-jira-bridge removed (${removed} files deleted).`);
    log('');
    log('Note: .planning/jira-bridge/ data has been preserved.');
  }
  log('');
}
