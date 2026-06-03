import { promises as fs } from 'node:fs';
import {
  referenceSourceAbsolutePath,
  referenceSourceFilename,
  referenceSourceMime,
} from '../../../lib/new-loom/reference-artifact-bindings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return new Response('missing id', { status: 400 });

  const abs = referenceSourceAbsolutePath(id);
  const filename = referenceSourceFilename(id);
  if (!abs || !filename) return new Response('not found', { status: 404 });

  try {
    const data = await fs.readFile(abs);
    return new Response(new Uint8Array(data), {
      headers: {
        'content-type': referenceSourceMime(id),
        'cache-control': 'private, max-age=3600',
        'content-disposition': `inline; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch {
    return new Response('not found', { status: 404 });
  }
}
