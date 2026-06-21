/**
 * Beginner Ask corpus — the mass-market generalization of Ask Yiping.
 *
 * Ask Yiping's grounded, source-cited answering (lib/new-loom/ask-yiping.ts)
 * runs over a corpus of `AskYipingSource`s plus a citation resolver. This module
 * builds those two things from a *beginner's own* BeginnerProfile instead of the
 * hardcoded Yiping dossier, so the SAME retrieval / prompt / citation discipline
 * (context-only answers, cite-only-real-ids, refuse-when-unsupported) works on
 * anyone's data.
 *
 * Every source carries a STABLE id derived from the profile section it came from
 * (`me-about`, `me-edu-{i}`, `me-exp-{i}`, `me-link-{i}`, `me-artifact-{i}`). The
 * citation resolver maps those ids back to a displayable citation, paralleling how
 * the dossier resolves artifact ids.
 *
 * NOTE on grounding: a source resolves to a citation only if it points at real,
 * inspectable proof. Education, experience, works, and links resolve to an on-site
 * (or external) href. UPLOADED ARTIFACTS (`me-artifact-{i}`) are the strongest
 * grounding: their searchable text is the document's OWN extracted text, and their
 * citation carries the artifact's blob id so the client can open the real file at
 * click time (there is no normal href — the blob lives in IndexedDB). This is the
 * M2b fix for the "self-citation" problem: a beginner answer now grounds in and
 * cites the actual document, not just the user's typed fields. The free-text
 * `me-about` block remains searchable but NON-citeable (no inspectable proof).
 */

import type {
  AskYipingCitation,
  AskYipingCitationResolver,
  AskYipingCorpusContext,
  AskYipingSource,
} from './ask-yiping';
import type { BeginnerProfile } from '../profile/beginner-profile';

export const BEGINNER_ABOUT_SOURCE_ID = 'me-about';

const EDU_ID_PREFIX = 'me-edu-';
const EXP_ID_PREFIX = 'me-exp-';
const WORK_ID_PREFIX = 'me-work-';
const LINK_ID_PREFIX = 'me-link-';
const ARTIFACT_ID_PREFIX = 'me-artifact-';

/** Join non-empty parts into one searchable string. */
function joinText(parts: readonly (string | undefined)[]): string {
  return parts.filter((part) => part && part.trim()).join(' ');
}

/** "May 2026" / "May 2026 – Present" / "" depending on which dates exist. */
function formatDates(start?: string, end?: string): string {
  if (start && end) return `${start} – ${end}`;
  if (start) return `${start} – Present`;
  if (end) return end;
  return '';
}

/**
 * Maps a BeginnerProfile into searchable Ask sources with stable ids.
 *
 * - `me-about`   : name + headline + summary (always first, the always-included
 *                  profile entry — searchable, not citeable).
 * - `me-edu-{i}` : institution + qualification + field + dates (+ notes).
 * - `me-exp-{i}` : role + organization + dates + location + bullets.
 * - `me-link-{i}`: label + href.
 * - `me-artifact-{i}`: an uploaded document — searchable text is name + label +
 *                  the document's OWN extracted text. RESOLVABLE (counts toward
 *                  the grounding floor + is citeable); its citation opens the
 *                  real blob by id, so an answer grounds in the actual file.
 *
 * Empty/garbage sections are assumed already dropped by normalizeBeginnerProfile,
 * but we still guard against blank searchable text so retrieval stays clean.
 */
export function buildBeginnerCorpus(profile: BeginnerProfile): AskYipingSource[] {
  const sources: AskYipingSource[] = [];
  const name = profile.home.name.trim();
  const headline = profile.home.headline.trim();

  // 1. About — always-included profile entry (searchable, non-citeable).
  sources.push({
    id: BEGINNER_ABOUT_SOURCE_ID,
    title: joinText([name || 'About', headline ? `— ${headline}` : '']),
    kind: 'profile',
    href: '/about',
    text: joinText([name, headline, profile.about.summary]),
  });

  // 2. Education entries.
  profile.education.forEach((entry, index) => {
    const title = joinText([entry.institution, entry.qualification ? `— ${entry.qualification}` : '']);
    sources.push({
      id: `${EDU_ID_PREFIX}${index}`,
      title: title || `Education ${index + 1}`,
      kind: 'education',
      href: '/education',
      text: joinText([
        entry.institution,
        entry.qualification,
        entry.field,
        formatDates(entry.start, entry.end),
        entry.notes,
      ]),
    });
  });

  // 3. Experience entries.
  profile.experience.forEach((entry, index) => {
    const title = joinText([entry.role, entry.organization ? `· ${entry.organization}` : '']);
    sources.push({
      id: `${EXP_ID_PREFIX}${index}`,
      title: title || `Experience ${index + 1}`,
      kind: 'experience',
      href: '/experience',
      text: joinText([
        entry.role,
        entry.organization,
        formatDates(entry.start, entry.end),
        entry.location,
        ...entry.bullets,
      ]),
    });
  });

  // 3.5. Works entries.
  profile.works.forEach((entry, index) => {
    const title = joinText([entry.title, entry.role ? `· ${entry.role}` : '']);
    sources.push({
      id: `${WORK_ID_PREFIX}${index}`,
      title: title || `Work ${index + 1}`,
      kind: 'work',
      href: entry.link?.trim() || '/works',
      text: joinText([entry.title, entry.description, entry.role, entry.date]),
    });
  });

  // 4. Links.
  profile.about.links.forEach((link, index) => {
    sources.push({
      id: `${LINK_ID_PREFIX}${index}`,
      title: link.label || 'Link',
      kind: 'link',
      href: link.href,
      text: joinText([link.label, link.href]),
    });
  });

  // 5. Uploaded artifacts. Searchable text = name + label + the document's OWN
  //    extracted text (PDFs; images carry none). This is the grounded slice: an
  //    on-topic question now matches the real document body, and the citation it
  //    resolves to opens that actual file. `href` here is only a display fallback
  //    (the digital-me surface where the proof cards live) — the citation does
  //    NOT navigate it; the client opens the blob by artifactId at click time.
  (profile.artifacts ?? []).forEach((artifact, index) => {
    sources.push({
      id: `${ARTIFACT_ID_PREFIX}${index}`,
      title: artifact.label?.trim() || artifact.name,
      kind: artifact.kind || 'doc',
      href: '/digital-me',
      text: joinText([artifact.name, artifact.label, artifact.extractedText]),
    });
  });

  return sources;
}

/**
 * What a resolved beginner source citation carries.
 *
 * - `id`        : the corpus source id (e.g. `me-exp-0`, `me-artifact-0`).
 * - `label`     : human-readable citation label.
 * - `href`      : an on-site/external destination — for section/link citations
 *                 the client navigates this.
 * - `artifactId`: ONLY for `me-artifact-{i}`. The real `ArtifactRef.id` (the
 *                 IndexedDB blob key). When present, the client opens the stored
 *                 document by this id instead of navigating `href`.
 * - `kind`      : optional file kind (artifacts), so the client renders the right
 *                 badge and routes to the blob-open path.
 */
export type ResolvedBeginnerSource = {
  id: string;
  label: string;
  href?: string;
  artifactId?: string;
  kind?: string;
};

/**
 * Citation display resolver for beginner source ids — the parallel of
 * resolveVerifiedDossierArtifact. Returns a citation for a REAL section/link/
 * artifact id in this profile, and null for the non-citeable `me-about` block or
 * any unknown/fabricated id.
 *
 * For `me-artifact-{i}` it returns a citation carrying the artifact's real blob
 * `artifactId` + `kind` (no normal href — the client opens the blob at click
 * time). This is what makes uploaded documents GROUNDED, openable citations.
 *
 * Returning null for unknown ids is the grounding guarantee: parseAskYipingCitations
 * drops anything this rejects, so a model can never cite a section or document that
 * does not exist in the profile.
 */
export function resolveBeginnerSource(
  id: string,
  profile: BeginnerProfile,
): ResolvedBeginnerSource | null {
  if (id.startsWith(EDU_ID_PREFIX)) {
    const index = Number(id.slice(EDU_ID_PREFIX.length));
    const entry = profile.education[index];
    if (!entry) return null;
    return {
      id,
      label: entry.institution
        ? `Education · ${entry.institution}`
        : entry.qualification
          ? `Education · ${entry.qualification}`
          : 'Education',
      href: '/education',
    };
  }

  if (id.startsWith(EXP_ID_PREFIX)) {
    const index = Number(id.slice(EXP_ID_PREFIX.length));
    const entry = profile.experience[index];
    if (!entry) return null;
    return {
      id,
      label: entry.organization
        ? `Experience · ${entry.organization}`
        : entry.role
          ? `Experience · ${entry.role}`
          : 'Experience',
      href: '/experience',
    };
  }

  if (id.startsWith(WORK_ID_PREFIX)) {
    const index = Number(id.slice(WORK_ID_PREFIX.length));
    const entry = profile.works[index];
    if (!entry) return null;
    return {
      id,
      label: `Works · ${entry.title}`,
      href: entry.link?.trim() || '/works',
    };
  }

  if (id.startsWith(LINK_ID_PREFIX)) {
    const index = Number(id.slice(LINK_ID_PREFIX.length));
    const link = profile.about.links[index];
    if (!link) return null;
    return { id, label: link.label || 'Link', href: link.href };
  }

  if (id.startsWith(ARTIFACT_ID_PREFIX)) {
    const index = Number(id.slice(ARTIFACT_ID_PREFIX.length));
    const artifact = (profile.artifacts ?? [])[index];
    if (!artifact) return null;
    // The citation's identity is the REAL blob id, not the corpus index id, so
    // the client opens the actual stored document. No navigable href — the blob
    // lives in IndexedDB and is resolved on click via getArtifactObjectUrl.
    return {
      id,
      label: artifact.label?.trim() || artifact.name,
      artifactId: artifact.id,
      kind: artifact.kind || 'doc',
    };
  }

  // `me-about` (free-text, non-citeable) and any unknown id are not resolvable.
  return null;
}

/**
 * The AskYipingCitationResolver shape (id → AskYipingCitation | null) bound to a
 * specific profile. This is what /api/ask passes into retrieve + parse so the
 * SAME core enforces cite-only-real-ids against the beginner's sections.
 */
export function beginnerCitationResolver(profile: BeginnerProfile): AskYipingCitationResolver {
  return (id: string): AskYipingCitation | null => {
    const resolved = resolveBeginnerSource(id, profile);
    if (!resolved) return null;
    // Uploaded artifact: the citation carries the REAL blob id (so the client
    // opens the document) and its kind. There is no navigable href — href stays
    // empty and the client routes to the blob-open path on the artifactId.
    if (resolved.artifactId) {
      return {
        artifactId: resolved.artifactId,
        title: resolved.label,
        href: '',
        kind: resolved.kind,
      };
    }
    // Section/link citation: requires a real destination to be citeable.
    if (!resolved.href) return null;
    return { artifactId: resolved.id, title: resolved.label, href: resolved.href };
  };
}

/**
 * Convenience: the full corpus context (corpus + resolver + always-on profile id)
 * for a beginner profile, ready to hand to retrieveAskYipingSources.
 */
export function beginnerCorpusContext(profile: BeginnerProfile): Required<AskYipingCorpusContext> {
  return {
    corpus: buildBeginnerCorpus(profile),
    resolveCitation: beginnerCitationResolver(profile),
    profileSourceId: BEGINNER_ABOUT_SOURCE_ID,
  };
}
