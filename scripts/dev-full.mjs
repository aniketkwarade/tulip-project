import { spawn } from 'node:child_process';
import { LOCAL_DEV } from './local-dev-config.mjs';

const EXPECTED_BACKEND_SERVICE = 'tulip-data-center-backend';
const EXPECTED_FRONTEND_TITLE = '<title>TULIP</title>';

async function probe(url, readResponse) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(1200) });
    return await readResponse(response);
  } catch {
    return { state: 'offline' };
  }
}

async function probeBackend() {
  return probe(LOCAL_DEV.backendHealthUrl, async response => {
    if (!response.ok) return { state: 'conflict' };
    const payload = await response.json().catch(() => null);
    return payload?.ok && payload?.service === EXPECTED_BACKEND_SERVICE
      ? { state: 'ready' }
      : { state: 'conflict' };
  });
}

async function probeFrontend() {
  return probe(LOCAL_DEV.url, async response => {
    if (!response.ok) return { state: 'conflict' };
    const html = await response.text();
    return html.includes(EXPECTED_FRONTEND_TITLE)
      ? { state: 'ready' }
      : { state: 'conflict' };
  });
}

const [backend, frontend] = await Promise.all([
  probeBackend(),
  probeFrontend()
]);

if (backend.state === 'conflict') {
  console.error(`[tulip-dev] Port ${LOCAL_DEV.backendPort} is occupied by another service.`);
  process.exit(1);
}

if (frontend.state === 'conflict') {
  console.error(`[tulip-dev] ${LOCAL_DEV.url} is occupied by another app.`);
  process.exit(1);
}

const commands = [];

if (backend.state === 'offline') {
  commands.push(['node', ['server/index.mjs']]);
} else {
  console.log('[tulip-dev] Reusing the running data service.');
}

if (frontend.state === 'offline') {
  commands.push(['node', ['node_modules/vite/bin/vite.js']]);
} else {
  console.log('[tulip-dev] Reusing the running app.');
}

console.log(`[tulip-dev] LostPlanet: ${LOCAL_DEV.url}`);

if (commands.length === 0) {
  process.exit(0);
}

const children = commands.map(([cmd, args]) =>
  spawn(cmd, args, {
    stdio: 'inherit',
    env: process.env
  })
);

function shutdown(code = 0) {
  for (const child of children) {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  }
  process.exit(code);
}

for (const child of children) {
  child.on('exit', code => {
    if (code && code !== 0) {
      shutdown(code);
    }
  });
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
