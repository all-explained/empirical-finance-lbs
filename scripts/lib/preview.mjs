import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { chromium } from 'playwright';

async function freePort() {
  const listener = createServer();
  listener.listen(0, '127.0.0.1');
  await once(listener, 'listening');
  const { port } = listener.address();
  await new Promise((resolve, reject) => listener.close((error) => error ? reject(error) : resolve()));
  return port;
}

async function waitForServer(server, base, port, output, spawnError) {
  for (let i = 0; i < 60; i++) {
    if (spawnError()) throw spawnError();
    if (server.exitCode !== null || server.signalCode !== null) {
      throw new Error(`preview server stopped before it was ready:\n${output()}`);
    }
    // Only trust a URL announced by this child, never an existing HTTP listener.
    const announced = output().match(/http:\/\/127\.0\.0\.1:(\d+)\//);
    if (announced && Number(announced[1]) !== port) {
      throw new Error(`preview server changed port from ${port} to ${announced[1]}; refusing to check another server`);
    }
    if (announced) {
      let response;
      try {
        response = await fetch(base, { signal: AbortSignal.timeout(1000) });
      } catch { /* not up yet */ }
      if (server.exitCode !== null || server.signalCode !== null) {
        throw new Error('preview server stopped while checking its URL');
      }
      if (response?.ok) return;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`preview server did not start:\n${output()}`);
}

async function launch() {
  try {
    return await chromium.launch();
  } catch {
    // Pre-installed Chromium in some environments (e.g. Claude Code cloud sessions).
    return chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  }
}

/** Run a browser check with the shared preview URL; always release both processes. */
export async function withPreview(check) {
  const port = await freePort();
  const base = `http://127.0.0.1:${port}/empirical-finance-lbs/`;
  // Run Astro directly so that killing it really stops the server.
  const server = spawn(process.execPath, ['node_modules/astro/bin/astro.mjs', 'preview', '--host', '127.0.0.1', '--port', String(port), '--ignore-lock'], { stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  let spawnError;
  server.stdout.on('data', (chunk) => { output += chunk; });
  server.stderr.on('data', (chunk) => { output += chunk; });
  server.on('error', (error) => { spawnError = error; });
  let browser;
  try {
    await waitForServer(server, base, port, () => output, () => spawnError);
    browser = await launch();
    return await check(browser, base);
  } finally {
    try {
      await browser?.close();
    } finally {
      if (server.pid && server.exitCode === null && server.signalCode === null) {
        const stopped = once(server, 'exit');
        server.kill();
        await stopped;
      }
    }
  }
}
