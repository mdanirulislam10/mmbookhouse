import { spawnSync } from 'node:child_process';

const isWindows = process.platform === 'win32';
const npxCmd = isWindows ? 'npx.cmd' : 'npx';

const result = spawnSync(npxCmd, ['tsx', 'scripts/test-task41.ts'], {
  stdio: 'inherit',
  shell: isWindows,
  cwd: process.cwd(),
});

process.exit(result.status ?? 0);
