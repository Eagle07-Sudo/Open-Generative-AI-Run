#!/usr/bin/env node
/**
 * Runs the gitleaks CLI (must be installed separately).
 * https://github.com/gitleaks/gitleaks#installing
 *
 * Usage: node scripts/gitleaks-detect.mjs [filesystem|git]
 */
import { spawnSync } from 'child_process';

function printInstallHelp() {
  console.error('\n[gitleaks] CLI not found. Install from:');
  console.error('  https://github.com/gitleaks/gitleaks#installing');
  console.error('  Windows: winget install gitleaks  OR  choco install gitleaks');
  console.error('  macOS:   brew install gitleaks');
}

const checkCmd = process.platform === 'win32' ? 'where' : 'which';
const check = spawnSync(checkCmd, ['gitleaks'], {
  stdio: 'ignore',
  shell: process.platform === 'win32',
});

if (check.status !== 0) {
  printInstallHelp();
  process.exit(1);
}

const mode = process.argv[2] === 'git' ? 'git' : 'filesystem';
const args =
  mode === 'git'
    ? ['detect', '--config', '.gitleaks.toml', '--verbose']
    : ['detect', '--source', '.', '--config', '.gitleaks.toml', '--verbose'];

const result = spawnSync('gitleaks', args, {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.error?.code === 'ENOENT') {
  printInstallHelp();
  process.exit(1);
}

process.exit(result.status === null ? 1 : result.status);
