import {
  isAnthropicConfigured,
  runAnthropicHttp,
} from '../../../lib/anthropic-http';
import {
  normalizeBeginnerProfile,
  type BeginnerProfile,
} from '../../../lib/profile/beginner-profile';
import {
  normalizeCapabilities,
  computeStatus,
  type BeginnerCapability,
  type CapabilityEvidence,
} from '../../../lib/capability/capability-graph';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Derive Capabilities — the LLM derivation route (Task 2).
 *
 * POST { profile: BeginnerProfile } → derives 4–8 capabilities backed by
 * evidence refs that resolve to REAL profile entries (edu-N / exp-N / work-N /
 * artifact id). The LLM is instructed to be faithful: no invented entries, empty
 * when nothing supports a capability.
 *
 * Evidence-ref validation is the moat: any refId the model emits that does NOT
 * resolve to an actual edu/exp/work index or artifact id is DROPPED before the
 * result leaves this route. Status is then RECOMPUTED from the validated evidence
 * so a capability never claims 'strong' on hallucinated proof.
 *
 * Transport mirrors extract-profile/route.ts:
 *   - Node serverless runtime, force-dynamic.
 *   - Body size-capped before any model call (256 KB).
 *   - No API key → {configured:false} (200) so the client degrades cleanly.
 *   - Parse failure (transport/API error) → {ok:false}.
 *   - Empty result from a sparse profile is legitimate → {ok:true, capabilities:[]}.
 */

/** Upper bound on the request body. */
const MAX_BODY_BYTES = 256 * 1024;

const DERIVATION_MAX_TOKENS = 4096;

type DeriveRequestBody = { profile?: unknown };

/** Successful derivation — may be empty for a sparse profile. */
export type DeriveCapabilitiesOk = { ok: true; capabilities: BeginnerCapability[] };
/** Transport / parse failure. */
export type DeriveCapabilitiesFailed = { ok: false };
/** No API key on this deploy. */
export type DeriveCapabilitiesUnconfigured = { configured: false };

const DERIVATION_SYSTEM_PROMPT = `You are a professional career analyst. From the structured profile below, derive 4–8 capabilities the person demonstrably has.

For each capability output:
- "label": concise skill/capability name (≤80 chars)
- "evidence": array of { "kind", "refId", "label" } where:
  - kind is exactly one of: "education", "experience", "work", "artifact"
  - refId uses this STRICT scheme:
    - education entries: "edu-0", "edu-1", ... (zero-indexed)
    - experience entries: "exp-0", "exp-1", ... (zero-indexed)
    - works entries: "work-0", "work-1", ... (zero-indexed)
    - artifact entries: use the artifact's exact id field value
  - label: a short human-readable name for that profile entry
- "note": optional one-line clarifying note (omit if nothing useful to add)
- "growth": optional one-line growth suggestion

RULES — follow exactly:
- Be FAITHFUL. Only derive capabilities supported by the profile. Never invent a skill not evidenced in the data.
- Only reference refIds that exist in the supplied profile (edu-0..N-1, exp-0..M-1, work-0..P-1, artifact ids).
- If the profile is sparse and nothing supports a capability, return an empty array.
- Aim for 4–8 capabilities; fewer is fine when the profile is thin.
- Respond with ONLY a JSON array — no prose, no markdown, no code fences.

Example output shape (do not copy this, derive from the real profile):
[
  {
    "label": "Python Programming",
    "evidence": [
      { "kind": "experience", "refId": "exp-0", "label": "Data Analyst at Acme" },
      { "kind": "work", "refId": "work-0", "label": "P&L Dashboard" }
    ],
    "growth": "Explore async patterns and packaging"
  }
]`;

/**
 * Build a concise text representation of the profile for the prompt.
 * We send structured text (not raw JSON) so the model can count indices.
 */
function profileToPromptText(profile: BeginnerProfile): string {
  const lines: string[] = [];

  lines.push(`Name: ${profile.home.name || '(unnamed)'}`);
  if (profile.home.headline) lines.push(`Headline: ${profile.home.headline}`);
  if (profile.about?.summary) lines.push(`Summary: ${profile.about.summary}`);

  lines.push('');
  lines.push('Education:');
  if (profile.education.length === 0) {
    lines.push('  (none)');
  } else {
    profile.education.forEach((e, i) => {
      lines.push(
        `  [edu-${i}] ${e.institution} — ${e.qualification}${e.field ? `, ${e.field}` : ''}${e.start || e.end ? ` (${[e.start, e.end].filter(Boolean).join('–')})` : ''}`,
      );
      if (e.notes) lines.push(`    Notes: ${e.notes}`);
    });
  }

  lines.push('');
  lines.push('Experience:');
  if (profile.experience.length === 0) {
    lines.push('  (none)');
  } else {
    profile.experience.forEach((x, i) => {
      lines.push(
        `  [exp-${i}] ${x.role} at ${x.organization}${x.start || x.end ? ` (${[x.start, x.end].filter(Boolean).join('–')})` : ''}`,
      );
      (x.bullets ?? []).forEach((b) => lines.push(`    • ${b}`));
    });
  }

  lines.push('');
  lines.push('Works:');
  if (profile.works.length === 0) {
    lines.push('  (none)');
  } else {
    profile.works.forEach((w, i) => {
      lines.push(`  [work-${i}] ${w.title}${w.role ? ` (${w.role})` : ''}`);
      if (w.description) lines.push(`    ${w.description}`);
    });
  }

  const artifacts = profile.artifacts ?? [];
  if (artifacts.length > 0) {
    lines.push('');
    lines.push('Artifacts (uploaded proof documents):');
    artifacts.forEach((a) => {
      lines.push(`  [${a.id}] ${a.label || a.name} (${a.kind})`);
      if (a.extractedText) lines.push(`    Excerpt: ${a.extractedText.slice(0, 400)}`);
    });
  }

  return lines.join('\n');
}

/**
 * Map every legitimate refId in a profile to its AUTHORITATIVE kind:
 *   edu-N → education, exp-N → experience, work-N → work, artifact.id → artifact.
 *
 * Used both to validate evidence (a refId not in the map is dropped) AND to
 * overwrite the model's claimed `kind` with the truth derived from the refId.
 * Without the overwrite a model could emit { kind:'artifact', refId:'edu-0' } —
 * a resolvable ref but a forged kind — and earn 'strong' (computeStatus requires
 * an artifact) with zero real uploaded proof. Deriving kind from the refId makes
 * 'strong' un-forgeable.
 */
function buildRefKinds(profile: BeginnerProfile): Map<string, CapabilityEvidence['kind']> {
  const kinds = new Map<string, CapabilityEvidence['kind']>();
  (profile.education ?? []).forEach((_, i) => kinds.set(`edu-${i}`, 'education'));
  (profile.experience ?? []).forEach((_, i) => kinds.set(`exp-${i}`, 'experience'));
  (profile.works ?? []).forEach((_, i) => kinds.set(`work-${i}`, 'work'));
  (profile.artifacts ?? []).forEach((a) => kinds.set(a.id, 'artifact'));
  return kinds;
}

/**
 * Parse the model's raw text response into validated, normalized BeginnerCapabilities.
 *
 * Steps:
 * 1. Strip a markdown code fence if present.
 * 2. Locate the outer JSON array.
 * 3. JSON.parse defensively.
 * 4. normalizeCapabilities — sanitizes labels, lengths, evidence shapes.
 * 5. DROP any evidence entry whose refId is not in the profile, and overwrite
 *    each surviving entry's kind with the authoritative kind from its refId.
 * 6. RECOMPUTE status from the validated (possibly reduced) evidence.
 *
 * Returns [] on any parse failure so the route can distinguish:
 *   - empty (parse OK, sparse profile) → ok:true, capabilities:[]
 *   - null would mean transport/API failure → ok:false
 * We use [] for both, and the caller uses try/catch to distinguish transport errors.
 *
 * Exported so the parse→validate seam is unit-testable without a live key.
 */
export function parseDerivedCapabilities(
  text: string,
  profile: BeginnerProfile,
): BeginnerCapability[] {
  if (typeof text !== 'string') return [];

  let raw = text.trim();
  if (!raw) return [];

  // Strip a leading/trailing markdown code fence (```json … ``` or ``` … ```).
  const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(raw);
  if (fence) {
    raw = fence[1].trim();
  }

  // Locate the outer JSON array even if the model wrapped it in stray prose.
  const start = raw.indexOf('[');
  const end = raw.lastIndexOf(']');
  if (start === -1 || end === -1 || end <= start) return [];
  const candidate = raw.slice(start, end + 1);

  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  // Sanitize: cap labels, coerce statuses, drop malformed evidence entries.
  const normalized = normalizeCapabilities(parsed);

  // Map each valid refId to its authoritative kind, derived from the profile.
  const refKinds = buildRefKinds(profile);

  // Drop evidence whose refId doesn't resolve to a real profile entry, OVERWRITE
  // the model's claimed kind with the authoritative one (so a forged
  // kind:'artifact' on a non-artifact ref can't earn 'strong'), then recompute
  // status from the validated evidence.
  return normalized.map((cap) => {
    const validatedEvidence = cap.evidence
      .filter((ev) => refKinds.has(ev.refId))
      .map((ev) => ({ ...ev, kind: refKinds.get(ev.refId)! }));
    const recomputedStatus = computeStatus(validatedEvidence);
    return {
      ...cap,
      evidence: validatedEvidence,
      status: recomputedStatus,
    };
  });
}

export async function POST(request: Request): Promise<Response> {
  let body: DeriveRequestBody;
  try {
    const rawBody = await request.text();
    if (rawBody.length > MAX_BODY_BYTES) {
      return Response.json({ error: 'Request body is too large.' }, { status: 413 });
    }
    body = JSON.parse(rawBody) as DeriveRequestBody;
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Normalize the incoming profile (sanitizes hrefs, caps sizes, drops empties).
  const profile = normalizeBeginnerProfile(body.profile);

  if (!isAnthropicConfigured()) {
    return Response.json(
      { configured: false } satisfies DeriveCapabilitiesUnconfigured,
      { status: 200 },
    );
  }

  const profileText = profileToPromptText(profile);
  const prompt = `${DERIVATION_SYSTEM_PROMPT}\n\nProfile to derive capabilities from:\n\n${profileText}`;

  let rawResponse: string;
  try {
    rawResponse = await runAnthropicHttp(prompt, { maxTokens: DERIVATION_MAX_TOKENS });
  } catch {
    return Response.json({ ok: false } satisfies DeriveCapabilitiesFailed, { status: 200 });
  }

  const capabilities = parseDerivedCapabilities(rawResponse, profile);

  return Response.json(
    { ok: true, capabilities } satisfies DeriveCapabilitiesOk,
    { status: 200 },
  );
}
