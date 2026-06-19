import { NextResponse } from 'next/server';
import { normalizeBeginnerProfile } from '../../../lib/profile/beginner-profile';
import { readBeginnerProfile, writeBeginnerProfile } from '../../../lib/profile/profile-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const profile = await readBeginnerProfile();
  return NextResponse.json({ profile });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 });
  }
  const source =
    body && typeof body === 'object' && 'profile' in (body as Record<string, unknown>)
      ? (body as Record<string, unknown>).profile
      : body;
  const profile = normalizeBeginnerProfile(source);
  try {
    await writeBeginnerProfile(profile);
    return NextResponse.json({ ok: true, profile });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
