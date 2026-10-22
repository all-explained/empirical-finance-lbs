/**
 * The full course outline (mirrors docs/CURRICULUM.md). Chapters that exist as
 * MDX files in src/content/chapters/ are linked; the rest show as "coming soon".
 */
export interface PartInfo {
  number: number;
  roman: string;
  title: string;
  difficulty: string;
  chapters: { number: number; title: string }[];
}

export const parts: PartInfo[] = [];

/** Join a path onto the site's base URL (GitHub Pages serves under /empirical-finance-lbs/). */
export function url(path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const clean = path.replace(/^\//, '');
  return `${base}/${clean}`;
}
