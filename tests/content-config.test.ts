import { describe, expect, it, vi } from 'vitest';
import { collections } from '../src/content.config';
import { parts } from '../src/data/curriculum';

// Use Astro's real collection helper outside its virtual-module runtime.
vi.mock('astro:content', () => import('astro/content/config'));

const schema = collections.chapters.schema;
if (!schema || typeof schema === 'function') throw new Error('Expected a chapter schema object');

const chapter = {
  title: 'Schema test',
  chapter: 1,
  difficulty: 1,
  summary: 'A chapter used to check part validation.',
};

describe('chapter part validation', () => {
  it.each([1, 17])('accepts part %s', (part) => {
    expect(schema.safeParse({ ...chapter, part }).success).toBe(true);
  });

  it.each([0, 1.5])('rejects part %s', (part) => {
    expect(schema.safeParse({ ...chapter, part }).success).toBe(false);
  });

  it('rejects a part beyond the curriculum', () => {
    expect(schema.safeParse({ ...chapter, part: parts.length + 1 }).success).toBe(false);
  });
});
