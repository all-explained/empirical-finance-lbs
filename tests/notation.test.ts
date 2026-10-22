import katex from 'katex';
import { describe, expect, it } from 'vitest';
import guide from '../docs/STYLE_GUIDE.md?raw';
import { katexMacros, katexOptions } from '../src/lib/katexMacros';

/** Macros named in the "Macro" column (the second) of the §3 notation tables. */
function notationMacros(): Set<string> {
  const section = guide.slice(guide.indexOf('## 3. Notation'), guide.indexOf('## 4. Colour'));
  const names = new Set<string>();
  for (const line of section.split('\n')) {
    if (!line.startsWith('|')) continue;
    for (const m of (line.split('|')[2] ?? '').matchAll(/\\[A-Za-z]+/g)) names.add(m[0]);
  }
  return names;
}

describe('notation table vs KaTeX macros', () => {
  const named = notationMacros();

  it('finds macros in the notation table', () => {
    expect(named.size).toBeGreaterThan(0);
  });

  it('every macro the notation table names is defined', () => {
    expect([...named].filter((m) => !(m in katexMacros))).toEqual([]);
  });

  it('every defined macro appears in the notation table', () => {
    expect(Object.keys(katexMacros).filter((m) => !named.has(m))).toEqual([]);
  });

  it('every macro renders with its colour class', () => {
    for (const [name, body] of Object.entries(katexMacros)) {
      const cls = body.match(/\\htmlClass\{([\w-]+)\}/)?.[1];
      expect(cls, name).toBeDefined();
      expect(katex.renderToString(`${name}{x}`, { ...katexOptions, throwOnError: true })).toContain(cls);
    }
  });
});
