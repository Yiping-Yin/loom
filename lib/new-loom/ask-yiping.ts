/**
 * Ask Yiping — the web-deployable conversational core of Digital Me.
 *
 * This module is the pure retrieval + prompt + citation layer. It contains NO
 * transport: a server API route pairs it with lib/anthropic-http.ts. Everything
 * here is derived from the STRUCTURED verified dossier data (no embedding model,
 * no file IO) so it runs cheaply on Node serverless.
 *
 * Grounding discipline is enforced in buildAskYipingPrompt and parseAskYipingCitations:
 * answers must come ONLY from the provided dossier context, citations must be REAL
 * dossier artifact ids that resolve via resolveVerifiedDossierArtifact, and the model
 * is told to plainly refuse when the context does not support an answer.
 */

import {
  DIGITAL_ME_PROOF_PATH,
  DIGITAL_ME_QUANT_ROLE_LENS,
} from './digital-me-role-os';
import {
  VERIFIED_DOSSIER_ARTIFACTS,
  VERIFIED_DOSSIER_EXPERIENCE_ENTRIES,
  VERIFIED_DOSSIER_PROFILE,
  VERIFIED_DOSSIER_UNSW_COURSES,
  resolveVerifiedDossierArtifact,
  type VerifiedDossierArtifactId,
} from './verified-dossier-home';

export type AskYipingSource = {
  id: string;
  title: string;
  kind: string;
  href: string;
  text: string;
};

export type AskYipingCitation = {
  artifactId: string;
  title: string;
  href: string;
  /**
   * Optional file kind for the cited source. Carried for uploaded beginner
   * artifacts (me-artifact-*) so the client can render the right badge and,
   * crucially, knows this citation opens a stored blob by `artifactId` rather
   * than navigating `href`. Owner/dossier and section citations omit it.
   */
  kind?: string;
};

/**
 * A citation resolver maps a corpus source id to a real, displayable citation
 * (artifactId + title + href) or null when the id is NOT a citeable artifact.
 * This is the single seam that lets the same grounding/citation discipline run
 * over any corpus: the Yiping corpus resolves ids via the verified dossier, a
 * beginner corpus resolves ids via that user's own profile sections. Returning
 * null is what enforces "cite only real ids" — non-resolvable corpus entries
 * (claims, courses, a beginner's free-text about block) are dropped from
 * citations exactly as before.
 */
export type AskYipingCitationResolver = (id: string) => AskYipingCitation | null;

/**
 * The optional retrieval/grounding context the core functions accept. Every
 * field defaults to the existing Yiping behavior, so passing nothing is
 * identical to the original single-corpus implementation.
 */
export type AskYipingCorpusContext = {
  /** The searchable corpus to retrieve from. Defaults to ASK_YIPING_CORPUS. */
  corpus?: AskYipingSource[];
  /** Maps a source id to a citation or null. Defaults to the dossier resolver. */
  resolveCitation?: AskYipingCitationResolver;
  /** Id of the always-included profile entry. Defaults to the Yiping profile. */
  profileSourceId?: string;
};

/** Stable id for the always-included profile/role lens entry. */
export const ASK_YIPING_PROFILE_SOURCE_ID = 'profile-role-lens';

/**
 * Default citation resolver: a corpus id is citeable iff it is a real verified
 * dossier artifact id, in which case it resolves to that artifact's label+href.
 * This preserves the original Yiping behavior (claims/courses/experience/profile
 * ids are non-resolvable → dropped from citations).
 */
export const resolveAskYipingDossierCitation: AskYipingCitationResolver = (id) => {
  const artifact = resolveVerifiedDossierArtifact(id as VerifiedDossierArtifactId);
  if (!artifact) return null;
  return { artifactId: artifact.id, title: artifact.label, href: artifact.href };
};

const STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'all', 'am', 'an', 'and', 'any', 'are',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between',
  'both', 'but', 'by', 'can', 'cant', 'could', 'did', 'do', 'does', 'doing',
  'done', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'has',
  'have', 'having', 'he', 'her', 'here', 'hers', 'him', 'his', 'how', 'i', 'if',
  'in', 'into', 'is', 'it', 'its', 'just', 'me', 'more', 'most', 'my', 'no',
  'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our',
  'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some', 'such', 'than',
  'that', 'the', 'their', 'them', 'then', 'there', 'these', 'they', 'this',
  'those', 'through', 'to', 'too', 'under', 'until', 'up', 'use', 'using', 'very',
  'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom',
  'why', 'will', 'with', 'would', 'you', 'your', 'yours', 'yiping',
]);

/**
 * Topical synonym groups. Every term in a group is treated as equivalent at
 * scoring time, so a question phrased with one spelling/word still overlaps an
 * artifact (or its claim/evidence context) phrased with another. This is what
 * lets "concavity / optimisation" reach the "Concave-Functions" lecture artifact
 * whose own text only literally says "concave", and bridges the en/us spellings
 * of optimise/optimize.
 */
const SYNONYM_GROUPS: readonly (readonly string[])[] = [
  ['concavity', 'concave', 'concavefunctions', 'convexity', 'convex'],
  ['optimisation', 'optimization', 'optimise', 'optimize', 'optimal', 'optimality'],
  ['programming', 'program', 'coding', 'code', 'implementation', 'developer'],
  ['python', 'py'],
  ['cpp', 'c++'],
  ['trading', 'trader', 'trade', 'market', 'markets', 'qbook', 'optibook', 'orderbook'],
  ['economics', 'economic', 'econ', 'econ3202'],
  ['mathematical', 'mathematics', 'maths', 'math'],
];

const SYNONYM_EXPANSIONS: Map<string, string[]> = (() => {
  const map = new Map<string, string[]>();
  for (const group of SYNONYM_GROUPS) {
    for (const term of group) {
      map.set(term, group.filter((other) => other !== term));
    }
  }
  return map;
})();

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9+]+/)
    .filter((token) => token.length > 1 && !STOPWORDS.has(token));
}

/**
 * Tokenizes and then expands each token with any topical synonyms, so overlap
 * scoring is spelling- and synonym-aware. Used for both query terms and source
 * terms so the matching is symmetric.
 */
function expandedTokenSet(text: string): Set<string> {
  const tokens = new Set(tokenize(text));
  for (const token of [...tokens]) {
    const synonyms = SYNONYM_EXPANSIONS.get(token);
    if (synonyms) {
      for (const synonym of synonyms) tokens.add(synonym);
    }
  }
  return tokens;
}

function joinLines(lines: readonly string[]): string {
  return lines.filter(Boolean).join(' ');
}

/**
 * The retrieval corpus, built once at module load from the verified dossier
 * data. Every entry's id maps back to a real artifact id where one exists, so
 * downstream citations resolve via resolveVerifiedDossierArtifact.
 */
export const ASK_YIPING_CORPUS: AskYipingSource[] = buildCorpus();

/**
 * Builds, per artifact id, the extra searchable context that the proof-path
 * claims and evidence nodes carry ABOUT that artifact. The dossier links an
 * artifact (e.g. the "Concave-Functions" lecture PDF) to a claim/evidence node
 * whose prose talks about "concavity and optimisation". Folding that context
 * into the artifact's searchable text is what lets an on-topic question reach
 * the resolvable artifact, not just the (non-resolvable) claim node.
 */
function buildArtifactContextById(): Map<string, string[]> {
  const contextById = new Map<string, string[]>();
  const push = (artifactId: string, ...lines: (string | undefined)[]) => {
    const existing = contextById.get(artifactId) ?? [];
    for (const line of lines) {
      if (line) existing.push(line);
    }
    contextById.set(artifactId, existing);
  };

  // Evidence nodes name an artifact directly and describe its role use.
  for (const evidence of DIGITAL_ME_PROOF_PATH.evidence) {
    push(evidence.artifactId, evidence.supportedCapability, evidence.roleUse);
  }

  // Claims carry the topical prose; attribute each claim's text to every
  // artifact reachable through its evidence ids.
  for (const claim of DIGITAL_ME_PROOF_PATH.claims) {
    for (const evidenceId of claim.evidenceIds) {
      const evidence = DIGITAL_ME_PROOF_PATH.evidence.find((node) => node.id === evidenceId);
      if (evidence) {
        push(evidence.artifactId, claim.text, claim.roleRelevance);
      }
    }
  }

  return contextById;
}

function buildCorpus(): AskYipingSource[] {
  const sources: AskYipingSource[] = [];
  const artifactContextById = buildArtifactContextById();

  // 1. Profile + role lens entry (always included by retrieve).
  sources.push({
    id: ASK_YIPING_PROFILE_SOURCE_ID,
    title: `${VERIFIED_DOSSIER_PROFILE.name} — ${VERIFIED_DOSSIER_PROFILE.roles.join(' / ')}`,
    kind: 'profile',
    href: '/about',
    text: joinLines([
      `${VERIFIED_DOSSIER_PROFILE.name} is a ${VERIFIED_DOSSIER_PROFILE.roles.join(' and ')} based in ${VERIFIED_DOSSIER_PROFILE.location}.`,
      `Memberships: ${VERIFIED_DOSSIER_PROFILE.memberships.map((m) => m.label).join(', ')}.`,
      `Digital Me role lens: ${DIGITAL_ME_QUANT_ROLE_LENS.label}. ${DIGITAL_ME_QUANT_ROLE_LENS.thesis}`,
      `Role criteria: ${DIGITAL_ME_QUANT_ROLE_LENS.criteria.join(', ')}.`,
    ]),
  });

  // 2. Every verified dossier artifact. Its searchable text = label + role +
  //    preview lines + sourcePath/folder + the claim/evidence context that the
  //    proof path attaches to this artifact (topical prose like "concavity and
  //    optimisation"). Enriching the text here is what makes resolvable
  //    artifacts surface for on-topic questions instead of only claim nodes.
  for (const artifact of VERIFIED_DOSSIER_ARTIFACTS) {
    const previewLines = artifact.preview
      ? [artifact.preview.title, artifact.preview.kicker, artifact.preview.tag, ...artifact.preview.lines]
      : [];
    const context = artifactContextById.get(artifact.id) ?? [];
    sources.push({
      id: artifact.id,
      title: artifact.label,
      kind: artifact.kind,
      href: artifact.href,
      text: joinLines([
        artifact.label,
        artifact.role,
        'sourcePath' in artifact ? artifact.sourcePath ?? '' : '',
        'sourceFolder' in artifact ? artifact.sourceFolder ?? '' : '',
        ...previewLines,
        ...context,
      ]),
    });
  }

  // 3. Every Digital Me proof-path claim (text = claim.text + roleRelevance).
  for (const claim of DIGITAL_ME_PROOF_PATH.claims) {
    sources.push({
      id: `claim:${claim.id}`,
      title: `Claim: ${claim.id}`,
      kind: 'claim',
      href: '/digital-me',
      text: joinLines([claim.text, claim.roleRelevance]),
    });
  }

  // 4. Every CV-backed experience entry.
  for (const entry of VERIFIED_DOSSIER_EXPERIENCE_ENTRIES) {
    sources.push({
      id: `experience:${entry.id}`,
      title: `${entry.organisation} — ${entry.role}`,
      kind: 'experience',
      href: '/experience',
      text: joinLines([entry.organisation, entry.role, entry.summary, ...entry.highlights]),
    });
  }

  // 5. Every UNSW course folder hero (text = code + moodleTitle), at its href.
  for (const course of VERIFIED_DOSSIER_UNSW_COURSES) {
    sources.push({
      id: `course:${course.id}`,
      title: course.code,
      kind: 'course',
      href: course.href,
      text: joinLines([course.code, course.folder, course.status, course.moodleTitle ?? '']),
    });
  }

  return sources;
}

function findProfileSource(corpus: AskYipingSource[], profileSourceId: string): AskYipingSource {
  const profile = corpus.find((source) => source.id === profileSourceId);
  // The profile entry is always pushed first in buildCorpus, so this is non-null.
  return profile ?? corpus[0];
}

/**
 * Keyword-overlap retrieval over the corpus. Lowercases and tokenizes the
 * question, scores each source by how many of its title+text terms overlap the
 * question terms, always includes the profile/role entry, and returns the top
 * `limit` sources. Falls back to a sensible default set when nothing overlaps.
 */
/**
 * Minimum number of resolvable-artifact sources retrieval tries to guarantee
 * whenever the question has any topical overlap with the corpus, so /api/ask
 * citations are never empty for an on-topic question.
 */
const MIN_RESOLVABLE_ARTIFACTS = 2;

export function retrieveAskYipingSources(
  question: string,
  limit = 6,
  context: AskYipingCorpusContext = {},
): AskYipingSource[] {
  const corpus = context.corpus ?? ASK_YIPING_CORPUS;
  const resolveCitation = context.resolveCitation ?? resolveAskYipingDossierCitation;
  const profileSourceId = context.profileSourceId ?? ASK_YIPING_PROFILE_SOURCE_ID;
  // A source is citeable for THIS corpus iff its resolver returns a citation.
  const isResolvableId = (id: string): boolean => resolveCitation(id) !== null;

  const safeLimit = Math.max(1, Math.floor(limit));
  const queryTerms = expandedTokenSet(question);
  const profile = findProfileSource(corpus, profileSourceId);

  const scored = corpus.filter((source) => source.id !== profileSourceId)
    .map((source) => {
      const sourceTerms = expandedTokenSet(`${source.title} ${source.text}`);
      let score = 0;
      for (const term of queryTerms) {
        if (sourceTerms.has(term)) score += 1;
      }
      return { source, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  const hasOverlap = scored.length > 0;

  let candidates: AskYipingSource[];
  if (hasOverlap) {
    candidates = scored.map((entry) => entry.source);
    // Guarantee that resolvable artifacts surface for on-topic questions. The
    // strongest hit can be a claim/course/experience node that does NOT resolve
    // to a real artifact (so it would yield empty citations). Back-fill from the
    // best-scoring resolvable artifacts — preferring ones already scored, then
    // the most relevant remaining artifacts — so /api/ask always has something
    // citeable when there is any topical overlap.
    const resolvableInCandidates = candidates.filter((source) => isResolvableId(source.id));
    if (resolvableInCandidates.length < MIN_RESOLVABLE_ARTIFACTS) {
      const present = new Set(candidates.map((source) => source.id));
      // Score the remaining (un-hit) artifacts so the back-fill is still relevant.
      const backfill = corpus.filter(
        (source) => isResolvableId(source.id) && !present.has(source.id),
      )
        .map((source) => {
          const sourceTerms = expandedTokenSet(`${source.title} ${source.text}`);
          let score = 0;
          for (const term of queryTerms) {
            if (sourceTerms.has(term)) score += 1;
          }
          return { source, score };
        })
        .sort((a, b) => b.score - a.score)
        .map((entry) => entry.source);

      const need = MIN_RESOLVABLE_ARTIFACTS - resolvableInCandidates.length;
      candidates = [...candidates, ...backfill.slice(0, need)];
    }
  } else {
    // No overlap (or empty question): fall back to the most representative,
    // resolvable artifacts so the model still has grounding to refuse against.
    candidates = corpus.filter(
      (source) => source.id !== profileSourceId && isResolvableId(source.id),
    );
  }

  // Always include the profile/role entry first. Then, when there is topical
  // overlap, prioritise resolvable artifacts so the limited window keeps at
  // least MIN_RESOLVABLE_ARTIFACTS citeable sources before topping up with the
  // remaining ranked candidates.
  const result: AskYipingSource[] = [profile];
  const added = new Set<string>([profile.id]);
  const take = (source: AskYipingSource) => {
    if (result.length >= safeLimit || added.has(source.id)) return;
    result.push(source);
    added.add(source.id);
  };

  if (hasOverlap) {
    let resolvableTaken = 0;
    for (const source of candidates) {
      if (result.length >= safeLimit) break;
      if (resolvableTaken >= MIN_RESOLVABLE_ARTIFACTS) break;
      if (isResolvableId(source.id)) {
        take(source);
        resolvableTaken += 1;
      }
    }
  }
  for (const source of candidates) {
    if (result.length >= safeLimit) break;
    take(source);
  }
  return result;
}

/**
 * Counts how many of the retrieved sources resolve to a REAL, citeable artifact
 * for this corpus. This is the grounding floor: when it is zero for a non-empty
 * question, /api/ask must NOT produce a confident grounded answer — there is
 * nothing inspectable to cite under the "Verified answers. Cited sources."
 * promise.
 *
 * The OWNER corpus always yields ≥ MIN_RESOLVABLE_ARTIFACTS here (retrieve's
 * no-overlap fallback returns resolvable artifacts, and its on-overlap path
 * back-fills resolvable artifacts), so this never trips for the owner. Only a
 * sparse beginner profile — e.g. name+headline+summary with no education,
 * experience, works, or links — can retrieve only the non-citeable `me-about`
 * entry and thus return 0 here.
 */
export function countResolvableSources(
  sources: AskYipingSource[],
  resolveCitation: AskYipingCitationResolver = resolveAskYipingDossierCitation,
): number {
  let count = 0;
  for (const source of sources) {
    if (resolveCitation(source.id) !== null) count += 1;
  }
  return count;
}

const SOURCES_DIRECTIVE = 'SOURCES:';

/**
 * Builds the grounded system + user prompt. The system message enforces the
 * grounding discipline (answer only from context, cite real ids, refuse plainly
 * when unsupported, never invent facts) and instructs the model to end its
 * answer with a `SOURCES: id1, id2` line listing the source ids it actually used.
 */
/** Max persona-name length interpolated into the system instruction. */
const PERSONA_NAME_MAX = 80;

/**
 * Single-line and length-cap a (possibly user-supplied) persona name before it
 * is interpolated into the system-instruction layer. Strips ASCII control
 * characters and collapses any run of whitespace (incl. newlines/tabs) to a
 * single space, so a beginner cannot inject a forged instruction line via their
 * profile name. Returns '' for a missing/blank/non-string name. No behavior
 * change for normal names (they have no control chars or newlines).
 */
export function sanitizePersonaName(raw: string | undefined): string {
  if (typeof raw !== 'string') return '';
  const singleLine = raw
     
    .replace(/[\x00-\x1F\x7F]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return singleLine.length > PERSONA_NAME_MAX
    ? singleLine.slice(0, PERSONA_NAME_MAX).trim()
    : singleLine;
}

export function buildAskYipingPrompt(
  question: string,
  sources: AskYipingSource[],
  context: { personaName?: string } = {},
): { system: string; user: string } {
  // Persona name is the only dossier-specific token in the system prompt; it
  // defaults to Yiping so existing behavior is byte-identical, and a beginner
  // request passes the profile owner's own name. The grounding RULES below are
  // intentionally identical regardless of corpus. Because a beginner-supplied
  // name flows into the system-instruction layer, sanitize it first: collapse
  // all whitespace/control chars to single spaces (no newlines that could forge
  // a new instruction line) and length-cap it. Normal names are unaffected.
  const personaName =
    sanitizePersonaName(context.personaName) || VERIFIED_DOSSIER_PROFILE.name;
  const firstName = personaName.split(/\s+/)[0] || personaName;
  const system = [
    `You are Ask ${firstName}, the verified Digital Me for ${personaName}.`,
    `Answer strictly from ${firstName}'s verified knowledge, education, and experience context provided below in CONTEXT.`,
    `Cite the specific sources you used by their id and title.`,
    `If the provided context does not support an answer, say so plainly: "I don't have verified evidence for that yet." Do not guess.`,
    `Never invent facts, dates, employers, links, grades, or credentials that are not in the context.`,
    `Speak about ${firstName} in a clear, professional, first- or third-person voice; keep the answer concise.`,
    `End your answer with a final line in exactly this format listing only the ids you actually used: ${SOURCES_DIRECTIVE} id1, id2`,
    `Use only ids that appear in the CONTEXT blocks. If you used no source, write "${SOURCES_DIRECTIVE} none".`,
  ].join('\n');

  const contextBlocks = sources
    .map((source, index) => {
      return [
        `[${index + 1}] id: ${source.id}`,
        `title: ${source.title}`,
        `text: ${source.text}`,
      ].join('\n');
    })
    .join('\n\n');

  const user = [
    `QUESTION:`,
    question.trim(),
    ``,
    `CONTEXT (only source of truth — every claim must trace to one of these blocks):`,
    contextBlocks,
  ].join('\n');

  return { system, user };
}

/**
 * Strips the trailing `SOURCES:` line from the model's answer, maps the listed
 * ids back to corpus sources that have a RESOLVABLE artifact id, dedupes, and
 * returns the cleaned answer plus real citations. Fabricated or non-resolvable
 * ids are dropped.
 */
export function parseAskYipingCitations(
  answerText: string,
  sources: AskYipingSource[],
  resolveCitation: AskYipingCitationResolver = resolveAskYipingDossierCitation,
): { answer: string; citations: AskYipingCitation[] } {
  const sourcesById = new Map(sources.map((source) => [source.id, source]));

  const lines = answerText.replace(/\r\n/g, '\n').split('\n');
  const directiveIndex = findLastIndex(lines, (line) =>
    line.trim().toUpperCase().startsWith(SOURCES_DIRECTIVE),
  );

  let listedIds: string[] = [];
  let cleaned = answerText;
  if (directiveIndex >= 0) {
    const directiveLine = lines[directiveIndex].trim();
    const rawList = directiveLine.slice(SOURCES_DIRECTIVE.length).trim();
    listedIds = rawList
      .split(/[,\s]+/)
      .map((id) => id.trim())
      .filter((id) => id.length > 0 && id.toLowerCase() !== 'none');
    cleaned = lines.slice(0, directiveIndex).join('\n').trimEnd();
  }

  const citations: AskYipingCitation[] = [];
  const seen = new Set<string>();
  for (const id of listedIds) {
    const source = sourcesById.get(id);
    if (!source) continue;
    // The citation must resolve to a REAL artifact via the corpus's resolver;
    // entries the resolver rejects (claims, courses, experience, profile, or a
    // beginner's free-text about block) are dropped. This is the grounding
    // discipline: cite only real, resolvable ids, never fabricated ones.
    const citation = resolveCitation(source.id);
    if (!citation) continue;
    if (seen.has(citation.artifactId)) continue;
    seen.add(citation.artifactId);
    citations.push(citation);
  }

  return { answer: cleaned, citations };
}

function findLastIndex<T>(items: T[], predicate: (item: T) => boolean): number {
  for (let index = items.length - 1; index >= 0; index -= 1) {
    if (predicate(items[index])) return index;
  }
  return -1;
}

/** Starter questions grounded in the real dossier. */
export const ASK_YIPING_SUGGESTED_QUESTIONS: string[] = [
  'Concavity in ECON3202 optimisation?',
  'QBook market-making proof?',
  'Python and C++ foundations?',
  'Quant role evidence?',
];
