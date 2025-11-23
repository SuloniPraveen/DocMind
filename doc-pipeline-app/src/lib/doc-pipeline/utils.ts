import chalk from 'chalk';

/**
 * Joins multiple pages into a single readable text block,
 * clearly labeling each page boundary for clarity in debugging and LLM parsing.
 */
export function joinPages(pages: string[]): string {
  return pages
    .map((p, i) => `\n\n===== PAGE ${i + 1} / ${pages.length} =====\n${p}`)
    .join('\n');
}

/**
 * Lightweight, color-coded console logging helpers.
 */
export const logInfo = (m: string) => console.log(chalk.cyan('ⓘ'), m);
export const logStep = (m: string) => console.log(chalk.green('✓'), m);
export const logWarn = (m: string) => console.log(chalk.yellow('⚠'), m);
export const logError = (m: string) => console.error(chalk.red('✖'), m);

/**
 * Attempts to guess the document’s title from early lines of text.
 */
export function heuristicExtractTitle(text: string): string | null {
  const lines = text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  const idx = lines.findIndex((l) => /^abstract\b|^introduction\b/i.test(l));

  const titleCandidates = (idx > 0 ? lines.slice(0, Math.min(idx, 5)) : lines.slice(0, 5)).filter(
    (l) => l.length > 8 && l.length < 220,
  );

  return titleCandidates[0] || null;
}

/**
 * Tries to extract author names from the first few lines of a paper.
 */
export function heuristicExtractAuthors(text: string): string[] {
  const firstK = text.split(/\r?\n/).slice(0, 60).join(' ');

  const m = firstK.match(/(?:by|authors?)\s*[:\-]\s*([^\n]+)/i);
  if (m) {
    return m[1]
      .split(/[,;]+/)
      .map((s) => s.replace(/\d+|\*/g, '').trim())
      .filter(Boolean);
  }

  const candidates = firstK.match(/\b([A-Z][a-z]+(?:\s[A-Z]\.)?(?:\s[A-Z][a-z]+)+)\b/g);
  if (!candidates) return [];

  return Array.from(new Set(candidates)).slice(0, 12);
}

/**
 * Truncates overly long strings to fit within prompt limits for the LLM.
 */
export function trimForPrompt(s: string, maxChars = 12000): string {
  if (s.length <= maxChars) return s;
  return s.slice(0, maxChars) + `\n\n[TRUNCATED: ${s.length - maxChars} more chars]`;
}
