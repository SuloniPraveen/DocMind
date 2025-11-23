import type { Extraction } from './schema';

export interface NormalizedSection {
  id: 'content' | 'methods' | 'findings' | 'conclusions';
  title: string;
  bullets: string[];
}

export interface NormalizedResult {
  documentType: string;
  year: string;
  authors: string[];
  sections: NormalizedSection[];
}

function splitIntoBullets(text: string): string[] {
  if (!text) return [];

  const normalized = text.replace(/\. *,/g, '. ');

  const roughSentences = normalized
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const unique: string[] = [];

  for (const s of roughSentences) {
    const key = s.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(s);
    }
  }

  return unique;
}

function dedupeAuthors(authors: string[]): string[] {
  const cleaned = authors
    .filter(Boolean)
    .map((a) => a.trim())
    .filter((a) => a.length > 0 && !/et al\./i.test(a));

  const seen = new Set<string>();
  const unique: string[] = [];
  for (const a of cleaned) {
    const key = a.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(a);
    }
  }
  return unique;
}

export function normalizeResult(raw: Extraction): NormalizedResult {
  return {
    documentType: raw.documentType,
    year: raw.date,
    authors: dedupeAuthors(raw.authors),
    sections: [
      { id: 'content', title: 'Content Summary', bullets: splitIntoBullets(raw.contentSummary) },
      { id: 'methods', title: 'Methods Summary', bullets: splitIntoBullets(raw.methodsSummary) },
      { id: 'findings', title: 'Findings Summary', bullets: splitIntoBullets(raw.findingsSummary) },
      {
        id: 'conclusions',
        title: 'Conclusions Summary',
        bullets: splitIntoBullets(raw.conclusionsSummary),
      },
    ],
  };
}
