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
 * (`me-about`, `me-edu-{i}`, `me-exp-{i}`, `me-link-{i}`). The citation resolver
 * maps those ids back to a displayable label + on-site href (e.g. "Experience ·
 * Optiver" → /experience), paralleling how the dossier resolves artifact ids.
 *
 * NOTE on grounding: only sections with a real on-site destination resolve to a
 * citation. The free-text `me-about` block is searchable context but is NOT a
 * citeable artifact (it has no inspectable proof), so it is intentionally not
 * resolvable — exactly like the Yiping profile/claim entries. Education,
 * experience, and links DO resolve, so on-topic answers cite real sections.
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

  return sources;
}

/**
 * Citation display resolver for beginner source ids — the parallel of
 * resolveVerifiedDossierArtifact. Returns a label + on-site href for a REAL
 * education/experience/link id in this profile, and null for the non-citeable
 * `me-about` block or any unknown/fabricated id.
 *
 * Returning null for unknown ids is the grounding guarantee: parseAskYipingCitations
 * drops anything this rejects, so a model can never cite a section that does not
 * exist in the profile.
 */
export function resolveBeginnerSource(
  id: string,
  profile: BeginnerProfile,
): { id: string; label: string; href?: string } | null {
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
    if (!resolved || !resolved.href) return null;
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
