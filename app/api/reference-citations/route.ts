import { listReferenceCitationCandidates } from '../../../lib/new-loom/reference-source-registry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({
    candidates: listReferenceCitationCandidates(),
  }, {
    headers: {
      'cache-control': 'no-store',
    },
  });
}
