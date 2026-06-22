import type { BeginnerProfile } from '../profile/beginner-profile';

// ── Types ────────────────────────────────────────────────────────────────────

export type CapabilityStatus = 'strong' | 'partial' | 'direction';

export type CapabilityEvidence = {
  kind: 'education' | 'experience' | 'work' | 'artifact';
  refId: string;
  label: string;
  /**
   * A short, grounded quote from the source text — the window around the matched
   * keyword, control-stripped + whitespace-collapsed + bounded (~120-160 chars,
   * ellipsized). Present only when the evidence was matched against meaningful
   * text (an artifact/draft excerpt, an experience bullet, a work description, an
   * education line); a bare label-only source carries none. This is what makes
   * the capability map "inspectable elevation": a viewer SEES the proof, not just
   * that proof exists.
   */
  excerpt?: string;
};

export type BeginnerCapability = {
  id: string;
  label: string;
  status: CapabilityStatus;
  evidence: CapabilityEvidence[];
  note?: string;
  growth?: string;
};

// ── Status computation ───────────────────────────────────────────────────────

/**
 * Compute a capability's evidence strength.
 * strong  = evidence.length >= 2 AND at least one artifact
 * partial = evidence.length >= 1 (but not strong)
 * direction = 0 evidence
 */
export function computeStatus(evidence: CapabilityEvidence[]): CapabilityStatus {
  if (evidence.length === 0) return 'direction';
  const hasArtifact = evidence.some((e) => e.kind === 'artifact');
  if (evidence.length >= 2 && hasArtifact) return 'strong';
  return 'partial';
}

// ── Heuristic derivation ─────────────────────────────────────────────────────

/**
 * Deterministic FNV-1a hash of a string → short base36 token. No Math.random,
 * so the token is stable across reloads. Used as the slug fallback for labels
 * with no ASCII alphanumerics (e.g. all-CJK labels) which would otherwise strip
 * to an empty string.
 */
function hashToken(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

/**
 * Normalise a label into a URL-slug-style id segment. Falls back to a stable
 * hash token when the label has no ASCII alphanumerics (e.g. '数据分析'), so two
 * distinct non-Latin labels never both collapse to the same empty slug (which
 * would silently drop one and collide React keys / card focus downstream).
 */
function slug(label: string): string {
  const base = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || `c${hashToken(label)}`;
}

/**
 * Keyword → canonical capability label.
 * Keys are lowercase token fragments; first match wins for a given text chunk.
 * Order matters: more specific entries first.
 */
const KEYWORD_MAP: ReadonlyArray<{ tokens: readonly string[]; label: string }> = [
  // Multi-word / specific entries first so granular capabilities are seeded
  // alongside the generic ones (matching no longer stops at the first hit, so a
  // single line like "led the design system" can yield Leadership + Design
  // Systems + Product Design rather than collapsing to one bucket).
  { tokens: ['machine learning', 'deep learning', 'neural network'], label: 'Machine Learning' },
  { tokens: ['design system', 'component library', 'design token'], label: 'Design Systems' },
  {
    tokens: ['user research', 'usability', 'user testing', 'user interview', 'hci', 'human-computer'],
    label: 'User Research',
  },
  { tokens: ['prototyp'], label: 'Prototyping' },
  {
    tokens: [
      'product design',
      'product designer',
      'ux design',
      'ui design',
      'ui/ux',
      'user experience',
      'user interface',
      'interaction design',
      'figma',
      'wireframe',
      'design',
    ],
    label: 'Product Design',
  },
  { tokens: ['optimis', 'optimiz', 'convex', 'linear programming'], label: 'Optimisation' },
  { tokens: ['p&l', 'pnl', 'profit', 'trading', 'market making', 'quant', 'options', 'greeks'], label: 'Trading & Markets' },
  { tokens: ['data analysis', 'data analyst', 'analytics', 'dashboard', 'visualis', 'visualiz'], label: 'Data Analysis' },
  { tokens: ['financial model', 'modelling', 'modeling'], label: 'Financial Modelling' },
  { tokens: ['python'], label: 'Python Programming' },
  {
    tokens: ['front-end', 'frontend', 'react', 'css', 'html', 'typescript', 'javascript'],
    label: 'Front-end Engineering',
  },
  { tokens: ['led ', 'leading', 'leadership', 'managed', 'manager', 'mentored'], label: 'Leadership' },
  { tokens: ['research'], label: 'Research' },
  { tokens: ['math', 'maths', 'mathematics', 'calculus', 'statistics', 'probability'], label: 'Mathematics' },
  { tokens: ['writing', 'documentation', 'communication'], label: 'Technical Writing' },
  { tokens: ['programming', 'software', 'engineering', 'code', 'coding', 'developer', 'development'], label: 'Software Engineering' },
];

/** Collect all text tokens from a profile entry for keyword scanning. */
function textTokens(pieces: (string | undefined)[]): string {
  return pieces.filter(Boolean).join(' ').toLowerCase();
}

/** Check whether a text chunk matches any token in a keyword list. */
function matchesTokens(text: string, tokens: readonly string[]): boolean {
  return tokens.some((t) => text.includes(t));
}

// Excerpt window bounds. A grounded quote is the slice of source text around the
// matched keyword: long enough to read as a real sentence-window, short enough to
// stay a glanceable chip. The upper cap mirrors the storage-seam discipline used
// elsewhere — bounded + control-stripped so a tampered/huge field can never blow
// up the card.
const EXCERPT_MAX = 160;
const EXCERPT_PAD = 60; // chars of context kept on each side of the keyword

/**
 * Strip ASCII control characters (keeping ordinary whitespace) and collapse
 * whitespace runs to single spaces. Same discipline as the artifact storage seam,
 * so an excerpt never carries garbage from an extracted PDF.
 */
function cleanText(raw: string): string {
  return raw
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Build a short, grounded excerpt: the window of `source` around the first
 * matched token, control-stripped + collapsed + bounded to EXCERPT_MAX, with a
 * leading/trailing ellipsis when the window is clipped. Matching is
 * case-insensitive against the lower-cased source, but the returned text
 * preserves the ORIGINAL casing.
 *
 * Returns undefined when there's no meaningful text or no token matches — a
 * label-only source (e.g. a bare role title with no bullets) never invents a
 * quote.
 */
function buildExcerpt(source: string | undefined, tokens: readonly string[]): string | undefined {
  if (!source) return undefined;
  const cleaned = cleanText(source);
  if (!cleaned) return undefined;

  const lower = cleaned.toLowerCase();
  let hit = -1;
  let hitLen = 0;
  for (const t of tokens) {
    const idx = lower.indexOf(t);
    if (idx !== -1 && (hit === -1 || idx < hit)) {
      hit = idx;
      hitLen = t.length;
    }
  }
  if (hit === -1) return undefined;

  // Window the keyword: pad on both sides, clamped to the string bounds.
  let start = Math.max(0, hit - EXCERPT_PAD);
  let end = Math.min(cleaned.length, hit + hitLen + EXCERPT_PAD);

  // Snap the start to a word boundary so we don't begin mid-word (only when we
  // actually clipped the head).
  if (start > 0) {
    const space = cleaned.indexOf(' ', start);
    if (space !== -1 && space < hit) start = space + 1;
  }
  if (end < cleaned.length) {
    const space = cleaned.lastIndexOf(' ', end);
    if (space !== -1 && space > hit + hitLen) end = space;
  }

  let window = cleaned.slice(start, end).trim();
  const clippedHead = start > 0;
  let clippedTail = end < cleaned.length;

  // Hard-cap the final length, leaving room for the ellipses.
  if (window.length > EXCERPT_MAX - 2) {
    window = window.slice(0, EXCERPT_MAX - 2).trim();
    clippedTail = true;
  }

  return `${clippedHead ? '…' : ''}${window}${clippedTail ? '…' : ''}`;
}

/**
 * Attach a grounded excerpt to an evidence item if it doesn't already carry one.
 * First meaningful excerpt wins: the same evidence object is shared across the
 * candidates it backs, so we set it once (the earliest matched-text source) and
 * leave it stable thereafter.
 */
function attachExcerpt(
  ev: CapabilityEvidence,
  source: string | undefined,
  tokens: readonly string[],
): void {
  if (ev.excerpt) return;
  const excerpt = buildExcerpt(source, tokens);
  if (excerpt) ev.excerpt = excerpt;
}

/**
 * Derive 1–8 capabilities from a `BeginnerProfile` using a deterministic,
 * offline-safe heuristic (no Math.random, no network/LLM).
 *
 * Strategy:
 * 1. Build a pool of candidate labels from:
 *    - experience role titles (one candidate each)
 *    - work item titles (one candidate each)
 *    - keyword-map hits from scanning bullets / descriptions / summary / about
 * 2. For each candidate, map evidence by token overlap.
 * 3. Drop candidates with no evidence AND no keyword hit.
 * 4. Compute status, assign stable ids, cap at 8.
 */
export function deriveCapabilitiesHeuristic(profile: BeginnerProfile): BeginnerCapability[] {
  // Build flat evidence pools (indexed by their refId prefix).
  const eduEvidence: CapabilityEvidence[] = (profile.education ?? []).map((e, i) => ({
    kind: 'education' as const,
    refId: `edu-${i}`,
    label: e.institution || e.qualification || `Education ${i}`,
  }));
  const expEvidence: CapabilityEvidence[] = (profile.experience ?? []).map((e, i) => ({
    kind: 'experience' as const,
    refId: `exp-${i}`,
    label: e.organization || e.role || `Experience ${i}`,
  }));
  const workEvidence: CapabilityEvidence[] = (profile.works ?? []).map((w, i) => ({
    kind: 'work' as const,
    refId: `work-${i}`,
    label: w.title || `Work ${i}`,
  }));
  const artEvidence: CapabilityEvidence[] = (profile.artifacts ?? []).map((a) => ({
    kind: 'artifact' as const,
    refId: a.id,
    label: a.label || a.name,
  }));

  // ── Candidate collection ────────────────────────────────────────────────

  // Map: canonical label → Set<CapabilityEvidence>
  const candidateMap = new Map<string, Set<CapabilityEvidence>>();

  const ensure = (label: string) => {
    if (!candidateMap.has(label)) candidateMap.set(label, new Set());
  };

  // 1a. Experience role titles → direct candidates.
  profile.experience?.forEach((exp, i) => {
    if (!exp.role && !exp.organization) return;
    // Try to map the role to a keyword-canonical label first.
    const roleText = textTokens([exp.role, exp.organization]);
    let mapped = false;
    for (const entry of KEYWORD_MAP) {
      if (matchesTokens(roleText, entry.tokens)) {
        ensure(entry.label);
        candidateMap.get(entry.label)!.add(expEvidence[i]);
        mapped = true;
      }
    }
    if (!mapped) {
      // Use role title directly as a capability.
      const label = exp.role || exp.organization;
      ensure(label);
      candidateMap.get(label)!.add(expEvidence[i]);
    }
  });

  // 1b. Work titles → candidates.
  profile.works?.forEach((work, i) => {
    if (!work.title) return;
    const workText = textTokens([work.title, work.description, work.role]);
    // Grounded quote comes from the prose (description/role), never the title —
    // the title is the chip label, so quoting it would just echo the label.
    const workProse = [work.description, work.role].filter(Boolean).join(' ');
    let mapped = false;
    for (const entry of KEYWORD_MAP) {
      if (matchesTokens(workText, entry.tokens)) {
        ensure(entry.label);
        candidateMap.get(entry.label)!.add(workEvidence[i]);
        attachExcerpt(workEvidence[i], workProse, entry.tokens);
        mapped = true;
      }
    }
    if (!mapped) {
      ensure(work.title);
      candidateMap.get(work.title)!.add(workEvidence[i]);
    }
  });

  // 1c. Keyword scan of experience bullets.
  profile.experience?.forEach((exp, i) => {
    const bulletProse = (exp.bullets ?? []).filter(Boolean).join(' ');
    const bulletText = bulletProse.toLowerCase();
    for (const entry of KEYWORD_MAP) {
      if (matchesTokens(bulletText, entry.tokens)) {
        ensure(entry.label);
        candidateMap.get(entry.label)!.add(expEvidence[i]);
        attachExcerpt(expEvidence[i], bulletProse, entry.tokens);
      }
    }
  });

  // 1d. Keyword scan of works descriptions.
  profile.works?.forEach((work, i) => {
    const workProse = [work.description, work.role].filter(Boolean).join(' ');
    const descText = workProse.toLowerCase();
    for (const entry of KEYWORD_MAP) {
      if (matchesTokens(descText, entry.tokens)) {
        ensure(entry.label);
        candidateMap.get(entry.label)!.add(workEvidence[i]);
        attachExcerpt(workEvidence[i], workProse, entry.tokens);
      }
    }
  });

  // 1e. Keyword scan of about.summary.
  const summaryText = textTokens([profile.about?.summary]);
  for (const entry of KEYWORD_MAP) {
    if (matchesTokens(summaryText, entry.tokens)) {
      ensure(entry.label);
      // No direct evidence to attach here — keyword hit alone can create
      // a direction-status candidate if nothing else backs it.
    }
  }

  // 1f. Artifacts contribute evidence to matching candidates.
  (profile.artifacts ?? []).forEach((art, _i) => {
    const artText = textTokens([art.label, art.name, art.extractedText]);
    const ev = artEvidence.find((a) => a.refId === art.id);
    if (!ev) return;
    for (const entry of KEYWORD_MAP) {
      if (matchesTokens(artText, entry.tokens) && candidateMap.has(entry.label)) {
        candidateMap.get(entry.label)!.add(ev);
        // Grounded quote comes from the document body only — the label/name are
        // the chip's own text, so quoting them would echo the label. A bare-label
        // artifact (no extractedText) carries no excerpt.
        attachExcerpt(ev, art.extractedText, entry.tokens);
      }
    }
    // Also match against education/experience/works for the artifact.
    eduEvidence.forEach((ee) => {
      if (matchesTokens(artText, [ee.label.toLowerCase()]) && candidateMap.size > 0) {
        // Attach artifact to any existing candidate that has the edu as evidence.
        for (const [_label, evSet] of candidateMap) {
          if (evSet.has(ee)) evSet.add(ev);
        }
      }
    });
  });

  // 1g. Education keyword hits both CREATE candidates and contribute evidence —
  // a field of study (e.g. HCI → User Research) is real signal, so a capability
  // backed only by a degree should still surface, not be silently dropped.
  profile.education?.forEach((edu, i) => {
    const eduText = textTokens([edu.institution, edu.qualification, edu.field, edu.notes]);
    // Grounded quote comes from the field of study / notes / qualification — the
    // institution is the chip label, so it's excluded from the quote.
    const eduProse = [edu.field, edu.notes, edu.qualification].filter(Boolean).join(' ');
    for (const entry of KEYWORD_MAP) {
      if (matchesTokens(eduText, entry.tokens)) {
        ensure(entry.label);
        candidateMap.get(entry.label)!.add(eduEvidence[i]);
        attachExcerpt(eduEvidence[i], eduProse, entry.tokens);
      }
    }
  });

  // ── Filter + build ──────────────────────────────────────────────────────

  const results: BeginnerCapability[] = [];
  const seenIds = new Set<string>();

  for (const [label, evSet] of candidateMap) {
    if (!label.trim()) continue;

    const evidence = Array.from(evSet);
    const capId = `cap-${slug(label)}`;

    // Deduplicate by id (same keyword might map to same label from multiple paths).
    if (seenIds.has(capId)) continue;
    seenIds.add(capId);

    const status = computeStatus(evidence);

    results.push({
      id: capId,
      label,
      status,
      evidence,
    });

    if (results.length >= 8) break;
  }

  return results;
}

// ── Normalizer ───────────────────────────────────────────────────────────────

const VALID_KINDS = new Set<string>(['education', 'experience', 'work', 'artifact']);
const VALID_STATUSES = new Set<string>(['strong', 'partial', 'direction']);

const CAP_COUNT_MAX = 12;
const CAP_LABEL_MAX = 80;
const CAP_NOTE_MAX = 240;
const CAP_GROWTH_MAX = 160;
const CAP_EVIDENCE_MAX = 8;

function capStr(v: unknown, max: number): string {
  if (typeof v !== 'string') return '';
  return v.length > max ? v.slice(0, max) : v;
}

function optCapStr(v: unknown, max: number): string | undefined {
  if (typeof v !== 'string' || !v.trim()) return undefined;
  return v.length > max ? v.slice(0, max) : v;
}

/**
 * Sanitize untrusted capabilities input (e.g. from the LLM route or old storage).
 * - Drop entries without a string label.
 * - Cap count to 12.
 * - Cap label/note/growth lengths.
 * - Coerce invalid status to 'direction'.
 * - Keep only valid evidence entries; cap at 8.
 * - Does NOT recompute status — trusts the provided value (clamped to enum).
 */
export function normalizeCapabilities(raw: unknown): BeginnerCapability[] {
  if (!Array.isArray(raw)) return [];

  const normalized = (raw as unknown[])
    .slice(0, CAP_COUNT_MAX)
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const e = entry as Record<string, unknown>;

      const label = capStr(e.label, CAP_LABEL_MAX);
      if (!label.trim()) return null;

      const status: CapabilityStatus = VALID_STATUSES.has(e.status as string)
        ? (e.status as CapabilityStatus)
        : 'direction';

      const rawEvidence = Array.isArray(e.evidence) ? (e.evidence as unknown[]) : [];
      const evidence: CapabilityEvidence[] = rawEvidence
        .slice(0, CAP_EVIDENCE_MAX)
        .map((ev) => {
          if (!ev || typeof ev !== 'object') return null;
          const evObj = ev as Record<string, unknown>;
          if (!VALID_KINDS.has(evObj.kind as string)) return null;
          if (typeof evObj.refId !== 'string') return null;
          if (typeof evObj.label !== 'string') return null;
          const out: CapabilityEvidence = {
            kind: evObj.kind as CapabilityEvidence['kind'],
            refId: evObj.refId,
            label: evObj.label,
          };
          // Carry the optional grounded excerpt through, sanitized at the seam:
          // a non-string is dropped, and an oversized/garbage value is
          // control-stripped + collapsed + bounded (mirrors the heuristic's own
          // discipline), so untrusted LLM/old-storage input can't smuggle a huge
          // or control-laden quote onto the card.
          if (typeof evObj.excerpt === 'string') {
            const cleaned = cleanText(evObj.excerpt);
            if (cleaned) out.excerpt = cleaned.length > EXCERPT_MAX ? cleaned.slice(0, EXCERPT_MAX) : cleaned;
          }
          return out;
        })
        .filter((ev): ev is CapabilityEvidence => ev !== null);

      // Dedupe evidence by kind+refId: the SAME proof cited twice must not count
      // as two pieces. computeStatus counts entries, so a duplicated artifact ref
      // could otherwise forge a 'strong' badge from a single document.
      const seenEvidenceKeys = new Set<string>();
      const dedupedEvidence = evidence.filter((ev) => {
        const key = `${ev.kind}|${ev.refId}`;
        if (seenEvidenceKeys.has(key)) return false;
        seenEvidenceKeys.add(key);
        return true;
      });

      // Reuse slug() so a label with no ASCII alphanumerics (all-CJK) falls back
      // to a stable hash token instead of collapsing to an empty 'cap-' id.
      const id = typeof e.id === 'string' && e.id.trim()
        ? e.id
        : `cap-${slug(label)}`;

      const result: BeginnerCapability = {
        id,
        label,
        status,
        evidence: dedupedEvidence,
      };

      const note = optCapStr(e.note, CAP_NOTE_MAX);
      if (note !== undefined) result.note = note;

      const growth = optCapStr(e.growth, CAP_GROWTH_MAX);
      if (growth !== undefined) result.growth = growth;

      return result;
    })
    .filter((c): c is BeginnerCapability => c !== null);

  // Id-uniqueness pass: two capabilities that derive the same id (identical
  // labels, or a repeated explicit id in old/edited storage) would collide React
  // keys + card refs in CapabilityMap. Suffix -2/-3/... on collision, mirroring
  // the heuristic's seenIds guard.
  const seenIds = new Set<string>();
  for (const cap of normalized) {
    if (!seenIds.has(cap.id)) {
      seenIds.add(cap.id);
      continue;
    }
    let unique = cap.id;
    let n = 2;
    while (seenIds.has(unique)) unique = `${cap.id}-${n++}`;
    seenIds.add(unique);
    cap.id = unique;
  }

  return normalized;
}
