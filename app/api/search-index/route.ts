import { promises as fs } from 'node:fs';
import path from 'node:path';
import { searchIndexPath } from '../../../lib/derived-index-cache';
import { appendReferenceSourcesToSearchIndex } from '../../../lib/new-loom/reference-source-registry';
import { CONTENT_ROOT } from '../../../lib/server-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EMPTY_SEARCH_INDEX = {
  generatedAt: null,
  count: 0,
  index: {
    storedFields: {},
  },
};

export async function GET() {
  const candidates = [searchIndexPath(), path.join(CONTENT_ROOT, 'public', 'search-index.json')];

  for (const candidate of candidates) {
    try {
      const body = await fs.readFile(candidate, 'utf-8');
      const payload = appendReferenceSourcesToSearchIndex(JSON.parse(body));
      return Response.json(payload, {
        headers: {
          'cache-control': 'public, max-age=300',
        },
      });
    } catch {}
  }

  return Response.json(appendReferenceSourcesToSearchIndex(EMPTY_SEARCH_INDEX), {
    headers: {
      'cache-control': 'no-store',
    },
  });
}
