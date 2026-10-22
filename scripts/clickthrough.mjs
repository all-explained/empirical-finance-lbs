/**
 * Drive every shared widget control in built chapters, at desktop and 360px.
 * Build first: npm run build.
 *
 *   npm run clickthrough             # all chapters
 *   npm run clickthrough -- 09-time   # paths containing "09-time"
 */
import { existsSync, readdirSync } from 'node:fs';
import { withPreview } from './lib/preview.mjs';

function chapterPages(dir = 'dist/chapters', path = 'chapters/') {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) return chapterPages(`${dir}/${entry.name}`, `${path}${entry.name}/`);
    if (entry.name === 'index.html') return [path];
    return entry.name.endsWith('.html') ? [path + entry.name] : [];
  });
}

async function checkState(page, widget, errors) {
  // Let event handlers, React updates and the next painted frame finish.
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  if (errors.length) throw new Error(errors.join(' | '));
  const katexErrors = await page.locator('.katex-error').count();
  if (katexErrors) throw new Error(`${katexErrors} KaTeX error(s)`);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (overflow > 1) throw new Error(`horizontal overflow of ${overflow}px`);
  for (const readout of await widget.locator('.widget-readout').all()) {
    if (!(await readout.innerText()).trim()) throw new Error('empty .widget-readout');
  }
}

async function driveWidget(browser, base, path, index, viewport) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
  page.on('pageerror', (error) => errors.push(error.message));
  let title = `widget ${index + 1}`;
  let controlName = 'page';
  let actionName = 'load';
  let actions = 0;
  const controlsRun = [];
  try {
    await page.goto(base + path, { waitUntil: 'networkidle' });
    const widget = page.locator('figure.widget').nth(index);
    title = (await widget.locator('.widget-title').innerText()).trim() || title;
    await widget.scrollIntoViewIfNeeded();
    actionName = 'hydrate';
    // client:visible islands keep `ssr` until their React event handlers are ready.
    await page.waitForFunction((i) => {
      const figure = document.querySelectorAll('figure.widget')[i];
      return figure && !figure.closest('astro-island[ssr]');
    }, index);
    await checkState(page, widget, errors);

    const controls = widget.locator('input[type="range"], .ctl-segmented [role="radio"], select, button.ctl-button');
    for (let i = 0; i < await controls.count(); i++) {
      const control = controls.nth(i);
      const info = await control.evaluate((element) => ({
        kind: element.matches('input') ? 'slider' : element.matches('select') ? 'select' : element.matches('[role="radio"]') ? 'segmented' : 'button',
        label: Array.from(element.labels ?? []).map((label) => (label.querySelector('.ctl-label') ?? label).textContent.trim()).join(' ')
          || element.closest('[role="radiogroup"]')?.getAttribute('aria-label')
          || element.textContent.trim(),
      }));
      controlName = `${info.kind} "${info.label || i + 1}"${info.kind === 'segmented' ? ` option "${(await control.innerText()).trim()}"` : ''}`;
      controlsRun.push(controlName);

      async function act(name, perform) {
        actionName = name;
        await perform();
        await checkState(page, widget, errors);
        actions++;
      }

      if (info.kind === 'slider') {
        const { min, max, middle } = await control.evaluate((element) => {
          const min = Number(element.min || 0);
          const max = Number(element.max || 100);
          const step = element.step === 'any' ? 0 : Number(element.step || 1);
          const middle = step ? Math.min(max, min + Math.round((max - min) / (2 * step)) * step) : (min + max) / 2;
          return { min, max, middle };
        });
        for (const [name, value] of [['minimum', min], ['maximum', max], ['middle', middle]]) {
          await act(`${name} (${value})`, () => control.evaluate((element, next) => {
            // Bypass React's value tracker so the bubbling input event reaches onChange.
            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(element, String(next));
            element.dispatchEvent(new Event('input', { bubbles: true }));
          }, value));
        }
      } else if (info.kind === 'select') {
        const options = await control.locator('option').evaluateAll((elements) => elements.map((option) => ({
          value: option.value, label: option.textContent.trim(),
        })));
        for (const option of options) {
          await act(`choose "${option.label}" (${option.value})`, () => control.selectOption(option.value));
        }
      } else {
        await act(`click "${(await control.innerText()).trim()}"`, () => control.click());
      }
    }
    return { title, actions, controls: controlsRun };
  } catch (error) {
    throw new Error(`${path} · ${title} · ${viewport.width}px · ${controlName} · ${actionName}: ${error.message}`);
  } finally {
    await page.close();
  }
}

async function main() {
  if (!existsSync('dist/index.html')) throw new Error('build missing; run npm run build first');
  const paths = chapterPages().filter((path) => !process.argv[2] || path.includes(process.argv[2]));
  if (!paths.length) {
    console.log('no chapter pages to check');
    return;
  }
  await withPreview(async (browser, base) => {
    for (const path of paths) {
      const page = await browser.newPage();
      let count;
      try {
        const response = await page.goto(base + path, { waitUntil: 'networkidle' });
        if (!response?.ok()) throw new Error(`${path}: HTTP ${response?.status()}`);
        count = await page.locator('figure.widget').count();
      } finally {
        await page.close();
      }
      for (let index = 0; index < count; index++) {
        const results = [];
        for (const viewport of [{ width: 1280, height: 900 }, { width: 360, height: 800 }]) {
          const result = await driveWidget(browser, base, path, index, viewport);
          results.push({ ...result, width: viewport.width });
        }
        console.log(`✓ ${path} · ${results[0].title} · ${results.map((r) => `${r.actions} actions at ${r.width}px`).join(', ')} · ${results[0].controls.join('; ')}`);
      }
    }
  });
}

main().catch((error) => {
  console.error(`✗ ${error.message}`);
  process.exitCode = 1;
});
