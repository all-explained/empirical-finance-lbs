/**
 * KaTeX macros shared by server-rendered MDX math and client-side <Tex>.
 * Each macro wraps its argument in a CSS class so the colour follows the
 * active theme (see src/styles/theme.css). See docs/STYLE_GUIDE.md §4.
 */
export const katexMacros: Record<string, string> = {
  '\\Ret': '\\htmlClass{c-return}{#1}',
  '\\Rf': '\\htmlClass{c-rf}{#1}',
  '\\Factor': '\\htmlClass{c-factor}{#1}',
  '\\SDF': '\\htmlClass{c-sdf}{#1}',
  '\\Signal': '\\htmlClass{c-signal}{#1}',
  '\\Data': '\\htmlClass{c-data}{#1}',
  '\\Model': '\\htmlClass{c-model}{#1}',
  '\\Err': '\\htmlClass{c-error}{#1}',
  '\\Prob': '\\htmlClass{c-prob}{#1}',
};

export const katexOptions = {
  macros: katexMacros,
  trust: (ctx: { command: string }) => ctx.command === '\\htmlClass',
  strict: 'ignore' as const,
  throwOnError: false,
};
