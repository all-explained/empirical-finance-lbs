import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { chromium } from 'playwright';

const PORT = 4329;
const BASE = `http://localhost:${PORT}/empirical-finance-lbs/`;

async function waitForServer(server) {
  for (let i = 0; i < 60; i++) {
    if (server.exitCode !== null || server.signalCode !== null) {
      throw new Error('preview server stopped before it was ready');
    }
    try {
      const res = await fetch(BASE);
      if (res.ok) return;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('preview server did not start');
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
  // Run Astro directly so that killing it really stops the server.
  const server = spawn(process.execPath, ['node_modules/astro/bin/astro.mjs', 'preview', '--port', String(PORT), '--ignore-lock'], { stdio: 'ignore' });
  let browser;
  try {
    await waitForServer(server);
    browser = await launch();
    return await check(browser, BASE);
  } finally {
    try {
      await browser?.close();
    } finally {
      if (server.exitCode === null && server.signalCode === null) {
        const stopped = once(server, 'exit');
        server.kill();
        await stopped;
      }
    }
  }
}
