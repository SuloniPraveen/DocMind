import fs from 'fs';
import { logInfo } from './utils';

// Use CommonJS require so we can call the core pdf-parse function directly (v1.1.1)
// We explicitly require the internal implementation file to avoid bundler weirdness.
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-explicit-any
const pdfParse: any = require('pdf-parse/lib/pdf-parse.js');

export async function extractPdfText(
  inputPath: string,
): Promise<{ text: string; pages: string[]; meta?: any }> {
  // Read PDF into a buffer
  const dataBuffer = fs.readFileSync(inputPath);

  // Use pdf-parse to extract text + basic metadata
  const data = await pdfParse(dataBuffer);

  const rawText = (data.text || '').replace(/\r\n/g, '\n');

  let pages: string[] = [];

  // Try to split into pages using form feed (when available)
  if (rawText.includes('\f')) {
    pages = rawText
      .split('\f')
      .map((p: string) => p.trim())
      .filter((p: string) => Boolean(p));
  } else {
    // Fallback: approximate pages by splitting by number of pages in metadata
    const numPages = data.numpages || 1;
    const approxLen = Math.ceil(rawText.length / Math.max(1, numPages));

    for (let i = 0; i < rawText.length; i += approxLen) {
      const chunk = rawText.slice(i, i + approxLen).trim();
      if (chunk) pages.push(chunk);
    }
  }

  if (pages.length === 0) {
    logInfo('No text found; PDF may be scanned. (OCR not enabled in this app.)');
  }

  return {
    text: rawText,
    pages,
    meta: {
      numPages: data.numpages,
      info: data.info,
    },
  };
}

/**
 * Very simple heuristic to guess if OCR might be needed:
 * if average text per page is small, it might be a scanned PDF.
 */
export function needsOcr(pages: string[]): boolean {
  const total = pages.join('\n');
  const avgLen = total.length / Math.max(1, pages.length);
  return avgLen < 600;
}
