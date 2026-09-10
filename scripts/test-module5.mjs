/**
 * Module 5: Automated Verification & Diagnostic Test Runner
 * Delegates to the production TypeScript test suite using tsx.
 */

import { spawnSync } from 'node:child_process';

const isWindows = process.platform === 'win32';
const npxCmd = isWindows ? 'npx.cmd' : 'npx';

const result = spawnSync(npxCmd, ['tsx', 'scripts/test-module5.ts'], {
  stdio: 'inherit',
  shell: isWindows,
  cwd: process.cwd(),
});

process.exit(result.status ?? 0);
