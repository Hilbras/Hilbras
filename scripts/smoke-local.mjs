#!/usr/bin/env node
/**
 * Runs the smoke test against a local server it starts itself.
 *
 * `pnpm smoke` expects a server to be running, which makes `pnpm check` fail on
 * a clean machine with a connection refused — the sort of failure that teaches
 * people to skip the step. CI worked around it by starting a server itself,
 * which meant the local path and the CI path were doing different things.
 *
 * This makes the local path self-contained: boot, wait for the document, run the
 * smoke test, shut down, and exit with the smoke test's status. The port is
 * overridable so it does not collide with a preview or an e2e run.
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT ?? 4176);
const base = `http://127.0.0.1:${port}`;

const server = spawn(process.execPath, [join(root, 'scripts/serve-with-headers.mjs')], {
  cwd: root,
  env: { ...process.env, PORT: String(port) },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let serverOutput = '';
server.stdout.on('data', (chunk) => (serverOutput += chunk));
server.stderr.on('data', (chunk) => (serverOutput += chunk));

const stop = () => {
  if (!server.killed) server.kill('SIGTERM');
};
process.on('exit', stop);
process.on('SIGINT', () => {
  stop();
  process.exit(130);
});

// Wait for the server rather than sleeping a guessed interval.
const deadline = Date.now() + 30_000;
let ready = false;
while (Date.now() < deadline) {
  try {
    const response = await fetch(`${base}/`, { method: 'HEAD' });
    if (response.ok) {
      ready = true;
      break;
    }
  } catch {
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}

if (!ready) {
  console.error(`smoke: the server did not come up on ${base}\n${serverOutput}`);
  stop();
  process.exit(1);
}

const smoke = spawn(process.execPath, [join(root, 'scripts/smoke.mjs'), base], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, PORT: String(port) },
});

smoke.on('exit', (code) => {
  stop();
  process.exit(code ?? 1);
});
