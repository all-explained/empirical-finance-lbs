import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { parts, type PartInfo } from '../src/data/curriculum';

it('keeps every part and chapter in sync with docs/CURRICULUM.md', () => {
  const outline = readFileSync(new URL('../docs/CURRICULUM.md', import.meta.url), 'utf8');
  const expected: PartInfo[] = [];
  const romanValues: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };

  for (const line of outline.split(/\r?\n/)) {
    if (line.startsWith('## Part ')) {
      const match = /^## Part ([IVXLCDM]+) — (.+) (●+(?:–●+)?)$/.exec(line);
      if (!match) throw new Error(`Unrecognised part heading: ${line}`);
      const [, roman, title, difficulty] = match;
      const digits = [...roman].map((digit) => romanValues[digit]);
      const number = digits.reduce((sum, value, i) => sum + (value < (digits[i + 1] ?? 0) ? -value : value), 0);
      expected.push({ number, roman, title, difficulty, chapters: [] });
    } else if (/^### \d+\./.test(line)) {
      const match = /^### (\d+)\. (.+)$/.exec(line);
      const part = expected.at(-1);
      if (!match || !part) throw new Error(`Invalid chapter heading or missing part: ${line}`);
      part.chapters.push({ number: Number(match[1]), title: match[2] });
    }
  }

  expect(expected.length).toBeGreaterThan(0);
  for (const part of expected) expect(part.chapters.length).toBeGreaterThan(0);
  expect(parts).toEqual(expected);
});
