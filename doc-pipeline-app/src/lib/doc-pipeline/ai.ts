import { ExtractionSchema, type Extraction } from './schema';
import { trimForPrompt } from './utils';
import { spawn } from 'child_process';

const MODEL = process.env.OLLAMA_MODEL || 'mistral';

export async function extractWithLLM(
  docText: string,
  hints: { title?: string | null; authors?: string[] },
): Promise<Extraction> {
  const prompt = buildPrompt(docText, hints);
  const output = await runOllama(prompt, MODEL);

  let candidate: any = tryParseJSON(output);
  candidate = normalizeToSchema(candidate);

  const parsed = ExtractionSchema.safeParse(candidate);
  if (parsed.success) return parsed.data;

  const recovered = normalizeToSchema(tryRecoverJSON(output));
  const parsed2 = ExtractionSchema.safeParse(recovered);
  if (parsed2.success) return parsed2.data;

  return {
    documentType: 'Unknown',
    authors: [],
    date: 'Unknown',
    contentSummary: 'Unknown',
    methodsSummary: 'Unknown',
    findingsSummary: 'Unknown',
    conclusionsSummary: 'Unknown',
  };
}

function buildPrompt(docText: string, hints: { title?: string | null; authors?: string[] }) {
  const hintBlock = `
HINTS (may be wrong; verify with text):
- Possible Title: ${hints.title || 'Unknown'}
- Possible Authors: ${hints.authors?.join(', ') || 'Unknown'}
`.trim();

  return `
You extract metadata from SCIENTIFIC PAPERS. Work ONLY from the provided text.
Return ONE JSON object with EXACT keys:
documentType, authors (array of strings), date, contentSummary, methodsSummary, findingsSummary, conclusionsSummary.

Definitions:
- documentType: e.g., Research Article, Review, Case Report, RCT, Cohort Study, Systematic Review, etc.
- authors: list of person names only.
- date: publication year or date string if available; otherwise "Unknown".
- contentSummary: 2–4 short sentences about what the paper studies.
- methodsSummary: 2–4 short sentences (design, sample, measures, analysis).
- findingsSummary: 2–4 short sentences summarizing main empirical results.
- conclusionsSummary: 1–3 short sentences summarizing the authors’ conclusions/implications.

Rules:
- Use "Unknown" ONLY if not present in this text.
- Do NOT invent data. Keep sentences concise.
- Reply with ONLY JSON (no prose, no markdown).

${hintBlock}

DOCUMENT CHUNK:
${trimForPrompt(docText, 9000)}
`.trim();
}

function runOllama(prompt: string, model: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn('ollama', ['run', model], { stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '';
    let err = '';

    proc.stdout.on('data', (d) => (out += d.toString()));
    proc.stderr.on('data', (d) => (err += d.toString()));

    proc.on('error', reject);
    proc.on('close', (code) =>
      code === 0
        ? resolve(out.trim())
        : reject(new Error(err || `ollama exited with code ${code}`)),
    );

    proc.stdin.write(prompt);
    proc.stdin.end();
  });
}

function tryParseJSON(text: string): any {
  try {
    return JSON.parse(text);
  } catch {}
  const m = text.match(/\{[\s\S]*\}/);
  if (m) {
    try {
      return JSON.parse(m[0]);
    } catch {}
  }
  return {};
}

function tryRecoverJSON(text: string): any {
  const cleaned = text
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ');

  const m = cleaned.match(/\{[\s\S]*\}/);
  if (!m) return {};
  try {
    return JSON.parse(m[0]);
  } catch {
    return {};
  }
}

function normalizeToSchema(obj: any): Extraction {
  const authorsRaw = obj?.authors ?? obj?.author ?? obj?.author_list ?? [];
  const authors = Array.isArray(authorsRaw)
    ? authorsRaw
        .map(String)
        .map((s: string) => s.trim())
        .filter((s: string) => Boolean(s))
    : String(authorsRaw || '')
        .split(/[,;]+/)
        .map((s: string) => s.trim())
        .filter((s: string) => Boolean(s));

  const contentSummary = obj?.contentSummary ?? obj?.abstract ?? obj?.summary ?? 'Unknown';
  const methodsSummary = obj?.methodsSummary ?? obj?.methods ?? obj?.methodology ?? 'Unknown';
  const findingsSummary = obj?.findingsSummary ?? obj?.findings ?? obj?.results ?? 'Unknown';
  const conclusionsSummary =
    obj?.conclusionsSummary ?? obj?.conclusions ?? obj?.conclusion ?? 'Unknown';
  const date = obj?.date ?? obj?.year ?? obj?.publication_date ?? 'Unknown';
  const documentType =
    obj?.documentType ?? obj?.type ?? obj?.articleType ?? obj?.title ?? 'Unknown';

  return {
    documentType: String(documentType || 'Unknown'),
    authors,
    date: String(date || 'Unknown'),
    contentSummary: String(contentSummary || 'Unknown'),
    methodsSummary: String(methodsSummary || 'Unknown'),
    findingsSummary: String(findingsSummary || 'Unknown'),
    conclusionsSummary: String(conclusionsSummary || 'Unknown'),
  };
}
