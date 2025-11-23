import pLimit from 'p-limit';
import { extractPdfText, needsOcr } from './pdf';
import { heuristicExtractAuthors, heuristicExtractTitle, logInfo, logStep } from './utils';
import { extractWithLLM } from './ai';
import type { Extraction } from './schema';

const CHUNK_TARGET = parseInt(process.env.DOC_CHUNK_TARGET || '', 10) || 9000;
const CONCURRENCY = parseInt(process.env.DOC_CONCURRENCY || '', 10) || 3;
const MAX_CHUNKS = parseInt(process.env.DOC_MAX_CHUNKS || '', 10) || 0;

function chunkText(pages: string[], approxChars = CHUNK_TARGET): string[] {
  if (pages.length === 0) return [''];
  const totalPages = pages.length;
  const chunks: string[] = [];
  let current = '';

  for (let i = 0; i < totalPages; i++) {
    const pageBlock = `\n\n===== PAGE ${i + 1} / ${totalPages} =====\n${pages[i]}`;

    if (current.length > 0 && current.length + pageBlock.length > approxChars) {
      chunks.push(current);
      current = '';
    }

    current += pageBlock;
  }

  if (current.length > 0) chunks.push(current);
  return chunks;
}

function mergeExtractions(extrs: Extraction[]): Extraction {
  const nonUnknown = (vals: string[]) =>
    vals.map((v) => (v || '').trim()).filter((v) => v && v.toLowerCase() !== 'unknown');

  const authorsSet = new Set<string>();
  for (const e of extrs) e.authors.forEach((a) => a && a !== 'Unknown' && authorsSet.add(a));

  type TextField = Exclude<keyof Extraction, 'authors'>;

  const pickFirst = (field: TextField): string => {
    const vals = nonUnknown(
      extrs.map((e) => (typeof e[field] === 'string' ? (e[field] as string) : '')),
    );
    return vals[0] || 'Unknown';
  };

  const joinUnique = (field: TextField): string => {
    const seen = new Set<string>();
    const parts: string[] = [];

    for (const e of extrs) {
      const t = typeof e[field] === 'string' ? (e[field] as string) : '';
      const key = t.slice(0, 200);
      if (t && t !== 'Unknown' && !seen.has(key)) {
        parts.push(t);
        seen.add(key);
      }
    }

    return parts.length ? parts.join(' ') : 'Unknown';
  };

  return {
    documentType: pickFirst('documentType'),
    authors: Array.from(authorsSet),
    date: pickFirst('date'),
    contentSummary: joinUnique('contentSummary'),
    methodsSummary: joinUnique('methodsSummary'),
    findingsSummary: joinUnique('findingsSummary'),
    conclusionsSummary: joinUnique('conclusionsSummary'),
  };
}

export async function runPipeline(
  inputPdfPath: string,
): Promise<Extraction> {
  logStep(`Reading PDF: ${inputPdfPath}`);
  const { pages } = await extractPdfText(inputPdfPath);

  if (needsOcr(pages)) {
    logInfo('PDF looks text-light (possibly scanned). OCR not enabled in this app.');
  }
  logStep(`Pages detected: ${pages.length}`);

  const firstTwo = pages.slice(0, 2).join('\n');
  const title = heuristicExtractTitle(firstTwo) ?? heuristicExtractTitle(pages.join('\n'));
  const authorsHint = heuristicExtractAuthors(firstTwo).length
    ? heuristicExtractAuthors(firstTwo)
    : heuristicExtractAuthors(pages.join('\n'));

  let chunks = chunkText(pages, CHUNK_TARGET);
  if (MAX_CHUNKS > 0) chunks = chunks.slice(0, MAX_CHUNKS);
  logStep(`Chunked into ${chunks.length} chunk(s) (~${CHUNK_TARGET} chars target each)`);

  const limit = pLimit(CONCURRENCY);
  let done = 0;

  const perChunk = await Promise.all(
    chunks.map((c) =>
      limit(async () => {
        const r = await extractWithLLM(c, { title, authors: authorsHint });
        done++;
        logStep(`Completed chunk ${done}/${chunks.length}`);
        return r;
      }),
    ),
  );

  const merged = mergeExtractions(perChunk);

  if (!merged.authors.length && authorsHint.length) merged.authors = authorsHint;

  return merged;
}
