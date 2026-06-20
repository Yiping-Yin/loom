import {
  isAnthropicConfigured,
  runAnthropicHttp,
} from '../../../lib/anthropic-http';
import {
  normalizeBeginnerProfile,
  type BeginnerProfile,
} from '../../../lib/profile/beginner-profile';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Extract Profile — the MOAT on-ramp.
 *
 * A beginner pastes a résumé / bio / CV and gets back a STRUCTURED, citeable
 * BeginnerProfile (home / about / education / experience / works) instead of an
 * opaque blob dumped into about.summary. The structured fields are what the
 * grounded "Ask" engine (app/api/ask) can actually retrieve and cite — without
 * this, a freshly-onboarded beginner's bot is "born refusing" because the only
 * content it has is the non-citeable summary.
 *
 * Transport conventions mirror app/api/ask/route.ts:
 *   - Node serverless runtime, never the native Mac app bridge.
 *   - Body is size-capped before any model call (bounds token/cost on the keyed
 *     web deploy; the static export shelves /api so a 404 falls back to manual
 *     entry client-side).
 *   - No API key → {configured:false} (200) so the client degrades cleanly to
 *     the honest "stored to your summary" stub.
 *
 * Extraction approach (see EXTRACTION_SYSTEM_PROMPT): lib/anthropic-http only
 * supports a single text prompt (no native tool-use), so we instruct the model
 * to respond with ONLY a JSON object matching the BeginnerProfile schema and
 * parse it DEFENSIVELY (strip code fences, locate the outer object, JSON.parse).
 * Whatever the model returns is run through normalizeBeginnerProfile server-side
 * before it leaves this route — hrefs are sanitized, sizes capped, empty entries
 * dropped. The model's raw output is never trusted.
 */

/**
 * Upper bound on the résumé `text` body. Matches the ask route's profile cap.
 * Generous for any real résumé/CV, but blocks a multi-megabyte payload from
 * driving unbounded extraction token/cost on the keyed web deploy.
 */
const MAX_TEXT_BYTES = 64 * 1024;

/**
 * Extraction uses Sonnet (the anthropic-http default) — faithfulness matters
 * more than cost here, and this runs once per onboarding paste, not per turn.
 * A cheaper Haiku path could be swapped in via the `model` option if extraction
 * volume ever dominates cost; accuracy is the priority for the make-or-break
 * first contact, so we keep the default.
 */
const EXTRACTION_MAX_TOKENS = 4096;

type ExtractRequestBody = { text?: unknown };

/** Successful, normalized extraction. */
export type ExtractProfileOk = { ok: true; profile: BeginnerProfile };
/** The model answered but the output couldn't be parsed into a profile. */
export type ExtractProfileFailed = { ok: false };
/** No API key on this deploy — client falls back to manual entry / the stub. */
export type ExtractProfileUnconfigured = { configured: false };

const EXTRACTION_SYSTEM_PROMPT = `You extract a structured professional profile from a résumé, CV, or bio.

Respond with ONLY a single JSON object — no prose, no markdown, no code fences — matching exactly this TypeScript shape:

{
  "home": { "name": string, "headline": string },
  "about": { "summary": string },
  "education": Array<{
    "institution": string,
    "qualification": string,
    "field"?: string,
    "start"?: string,
    "end"?: string,
    "notes"?: string
  }>,
  "experience": Array<{
    "role": string,
    "organization": string,
    "start"?: string,
    "end"?: string,
    "location"?: string,
    "bullets": string[]
  }>,
  "works": Array<{
    "title": string,
    "description"?: string,
    "link"?: string,
    "role"?: string,
    "date"?: string
  }>
}

RULES — follow exactly:
- Extract FAITHFULLY. Use ONLY information present in the source text. Never invent, guess, or embellish a name, date, employer, school, role, or accomplishment.
- If a section is absent from the source, return it as an empty array (or empty string for home/about fields). Do not fabricate entries to fill a section.
- "headline" is a short one-line role/title summary (e.g. "Quantitative developer · Sydney"). Leave it "" if the source has nothing suitable.
- "summary" is a brief 1–3 sentence professional bio. Map dates, employers, schools, roles, and accomplishments into the STRUCTURED education/experience/works fields — NOT into the summary. The summary is only a high-level overview.
- For experience "bullets": each distinct accomplishment or responsibility is its own string. Omit the bullets entirely (empty array) if none are stated.
- Only include "link" on a work if a real URL appears in the source.
- Output must be valid JSON and nothing else.`;

/**
 * Parse the model's raw text response into a normalized BeginnerProfile.
 *
 * Defensive by design — the model is *instructed* to emit bare JSON, but we
 * never assume it complied: strip a ```json code fence if present, locate the
 * outer { … } object (the model may wrap it in stray prose), JSON.parse, then
 * hand it to normalizeBeginnerProfile (the trusted sanitize/cap seam). Returns
 * null on any failure so the route can answer {ok:false} instead of throwing.
 *
 * Exported so the parse→normalize seam is unit-testable without a live key.
 */
export function parseExtractedProfile(raw: string): BeginnerProfile | null {
  if (typeof raw !== 'string') return null;

  let text = raw.trim();
  if (!text) return null;

  // Strip a leading/trailing markdown code fence (```json … ``` or ``` … ```).
  const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(text);
  if (fence) {
    text = fence[1].trim();
  }

  // Locate the outer JSON object even if the model wrapped it in stray prose.
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  const candidate = text.slice(start, end + 1);

  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;

  // Never trust the model's raw output: sanitize hrefs, cap sizes, drop empties.
  return normalizeBeginnerProfile(parsed);
}

export async function POST(request: Request): Promise<Response> {
  let body: ExtractRequestBody;
  try {
    body = (await request.json()) as ExtractRequestBody;
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const text = typeof body.text === 'string' ? body.text : '';
  if (!text.trim()) {
    return Response.json(
      { error: 'A non-empty `text` field is required.' },
      { status: 400 },
    );
  }

  // Reject an absurdly large body before any model call to bound token/cost an
  // untrusted caller can drive on the keyed web deploy.
  if (text.length > MAX_TEXT_BYTES) {
    return Response.json({ error: 'Résumé text is too large.' }, { status: 413 });
  }

  // No API key on this deploy (static export / unconfigured web): stay useful by
  // signalling the client to fall back to manual entry + the honest summary stub.
  if (!isAnthropicConfigured()) {
    return Response.json({ configured: false } satisfies ExtractProfileUnconfigured, {
      status: 200,
    });
  }

  const prompt = `${EXTRACTION_SYSTEM_PROMPT}\n\nRésumé / CV / bio text to extract from:\n"""\n${text}\n"""`;

  let rawResponse: string;
  try {
    rawResponse = await runAnthropicHttp(prompt, { maxTokens: EXTRACTION_MAX_TOKENS });
  } catch {
    // Network / API / timeout — report a clean failure so the client falls back
    // to the manual stub rather than crashing.
    return Response.json({ ok: false } satisfies ExtractProfileFailed, { status: 200 });
  }

  const profile = parseExtractedProfile(rawResponse);
  if (!profile) {
    return Response.json({ ok: false } satisfies ExtractProfileFailed, { status: 200 });
  }

  return Response.json({ ok: true, profile } satisfies ExtractProfileOk, { status: 200 });
}
