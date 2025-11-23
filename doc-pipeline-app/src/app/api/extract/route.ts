import { NextRequest, NextResponse } from 'next/server';
import { runPipeline } from '@/lib/doc-pipeline/pipeline';
import { normalizeResult } from '@/lib/doc-pipeline/normalize';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ status: 'error', error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'doc-pipeline-'));
    const tmpPath = path.join(tmpDir, file.name || 'upload.pdf');

    await fs.writeFile(tmpPath, bytes);

    const extraction = await runPipeline(tmpPath);
    const normalized = normalizeResult(extraction);

    return NextResponse.json({ status: 'success', raw: extraction, normalized }, { status: 200 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { status: 'error', error: err?.message || 'Unexpected error' },
      { status: 500 },
    );
  }
}
