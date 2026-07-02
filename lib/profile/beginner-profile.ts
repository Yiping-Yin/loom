import { safeHref } from './safe-href';
import type { BeginnerCapability } from '../capability/capability-graph';
import { normalizeCapabilities } from '../capability/capability-graph';

export type ProfileLink = { label: string; href: string };
export type EducationEntry = {
  institution: string; qualification: string;
  field?: string; start?: string; end?: string; notes?: string;
};
export type ExperienceEntry = {
  role: string; organization: string;
  start?: string; end?: string; location?: string; bullets: string[];
};
export type WorkItem = {
  title: string;
  description?: string;
  link?: string;
  role?: string;
  date?: string;
};
/**
 * The citeable META projection of an uploaded artifact. The BLOB itself lives in
 * IndexedDB keyed by `id` (see lib/artifact/artifact-store.ts) — only this small
 * record is persisted in the localStorage profile, so the blob never eats the
 * localStorage quota. `kind` is a free string here (the store narrows it to
 * 'pdf'|'image'|'doc'|'other') so an unknown value from old/edited storage
 * normalizes safely rather than being dropped.
 */
export type ArtifactRef = {
  id: string;
  name: string;
  kind: string;
  label?: string;
  thumbnailDataUri?: string;
  /**
   * A bounded plain-text excerpt of the document (PDF first pages only; images/
   * unknown carry none). This is what makes the artifact a GROUNDED citation: the
   * cited-answer engine searches + answers from this real text, fixing the
   * "self-citation" problem where a beginner's citation only pointed back at their
   * own typed fields. Capped + control-stripped here at the storage seam.
   */
  extractedText?: string;
};
export type BeginnerProfile = {
  version: 1;
  home: { name: string; headline: string };
  about: { summary: string; links: ProfileLink[] };
  education: EducationEntry[];
  experience: ExperienceEntry[];
  works: WorkItem[];
  /** Uploaded proof documents (blobs live in IndexedDB; this is the citeable meta). */
  artifacts?: ArtifactRef[];
  /** Derived or LLM-provided capabilities with evidence backing. */
  capabilities?: BeginnerCapability[];
};

export function emptyBeginnerProfile(): BeginnerProfile {
  return {
    version: 1,
    home: { name: '', headline: '' },
    about: { summary: '', links: [] },
    education: [],
    experience: [],
    works: [],
    artifacts: [],
    capabilities: [],
  };
}

// Per-field length caps. Prevents an absurdly large stored profile from driving
// unbounded token/cost on the keyed web deploy, without truncating so
// aggressively that normal content (a multi-paragraph summary) breaks. The
// limits are generous: ~2000 chars for the free-text summary, ~300 for every
// other short field, and a bounded number of bullets/links per entry.
const SUMMARY_MAX = 2000;
const FIELD_MAX = 300;
const HREF_MAX = 2048;
// Artifact caps. The thumbnail is a downscaled data URI (~a few KB for a small
// preview) — a generous ceiling keeps a normal preview while refusing a pasted
// full-resolution blob that would blow the localStorage quota. The count cap
// bounds how many proof cards (and how much localStorage) a profile can hold.
const ARTIFACTS_MAX = 24;
const ARTIFACT_NAME_MAX = 200;
const ARTIFACT_LABEL_MAX = 120;
const THUMBNAIL_MAX = 200_000;
// The extracted-text excerpt cap. Matches the store's extraction ceiling so a
// legitimate PDF excerpt survives intact, while a tampered profile carrying a
// huge or control-char-laden value is bounded + sanitized at the storage seam
// (the same defence applied to every other free-text field).
const ARTIFACT_TEXT_MAX = 4000;

const cap = (v: string, max: number): string => (v.length > max ? v.slice(0, max) : v);

const str = (v: unknown, max = FIELD_MAX): string =>
  typeof v === 'string' ? cap(v, max) : '';
const optStr = (v: unknown, max = FIELD_MAX): string | undefined =>
  typeof v === 'string' && v.trim() ? cap(v, max) : undefined;

/**
 * Keep a thumbnail only if it's a bounded image data URI. This is a defence at
 * the storage seam: an arbitrary `data:` URI (e.g. text/html) or an oversized
 * blob is dropped so a tampered/edited profile can never store something the
 * card would render as anything other than an <img src>.
 */
const optThumbnail = (v: unknown): string | undefined => {
  if (typeof v !== 'string') return undefined;
  if (v.length > THUMBNAIL_MAX) return undefined;
  return /^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(v) ? v : undefined;
};

/**
 * Sanitize an artifact's extracted-text excerpt at the storage seam. Strips ASCII
 * control characters (keeping ordinary whitespace), collapses whitespace runs to
 * single spaces, then hard-caps the length. Returns undefined for a non-string or
 * empty result so an artifact never carries a garbage/oversized excerpt — the
 * grounded corpus then folds in only clean, bounded document text.
 */
const optExtractedText = (v: unknown): string | undefined => {
  if (typeof v !== 'string') return undefined;
  const cleaned = v
     
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return undefined;
  return cap(cleaned, ARTIFACT_TEXT_MAX);
};

export function normalizeBeginnerProfile(raw: unknown): BeginnerProfile {
  if (!raw || typeof raw !== 'object') return emptyBeginnerProfile();
  const r = raw as Record<string, unknown>;
  const home = (r.home && typeof r.home === 'object' ? r.home : {}) as Record<string, unknown>;
  const about = (r.about && typeof r.about === 'object' ? r.about : {}) as Record<string, unknown>;
  const links = Array.isArray(about.links) ? (about.links as unknown[]) : [];
  const education = Array.isArray(r.education) ? (r.education as unknown[]) : [];
  const experience = Array.isArray(r.experience) ? (r.experience as unknown[]) : [];
  const works = Array.isArray(r.works) ? (r.works as unknown[]) : [];
  const artifacts = Array.isArray(r.artifacts) ? (r.artifacts as unknown[]) : [];
  return {
    version: 1,
    home: { name: str(home.name), headline: str(home.headline) },
    about: {
      summary: str(about.summary, SUMMARY_MAX),
      links: links
        .map((l) => (l && typeof l === 'object' ? (l as Record<string, unknown>) : {}))
        // Sanitize the href through the URL-scheme allowlist FIRST, then keep the
        // link only if a safe destination survives. A javascript:/data:/vbscript:
        // href normalizes to '' here and the whole link is dropped at the seam,
        // so no stored profile can ever render a dangerous-scheme anchor.
        .map((l) => ({ label: str(l.label) || 'Link', href: safeHref(str(l.href, HREF_MAX)) }))
        .filter((l) => l.href),
    },
    education: education
      .map((e) => (e && typeof e === 'object' ? (e as Record<string, unknown>) : {}))
      .filter((e) => str(e.institution) || str(e.qualification))
      .map((e) => ({
        institution: str(e.institution), qualification: str(e.qualification),
        field: optStr(e.field), start: optStr(e.start), end: optStr(e.end), notes: optStr(e.notes),
      })),
    experience: experience
      .map((x) => (x && typeof x === 'object' ? (x as Record<string, unknown>) : {}))
      .filter((x) => str(x.role) || str(x.organization))
      .map((x) => ({
        role: str(x.role), organization: str(x.organization),
        start: optStr(x.start), end: optStr(x.end), location: optStr(x.location),
        bullets: (Array.isArray(x.bullets) ? (x.bullets as unknown[]) : [])
          .filter((b) => typeof b === 'string' && b.trim())
          .map((b) => cap(b as string, FIELD_MAX)) as string[],
      })),
    works: works
      .map((w) => (w && typeof w === 'object' ? (w as Record<string, unknown>) : {}))
      .filter((w) => str(w.title).trim())
      .map((w) => {
        // Run the optional link through the allowlist; an unsafe scheme collapses
        // to '' which we store as undefined so the Works page renders plain text
        // rather than a dangerous-scheme anchor.
        const safeLink = safeHref(optStr(w.link, HREF_MAX));
        return {
          title: str(w.title),
          description: optStr(w.description, SUMMARY_MAX),
          link: safeLink || undefined,
          role: optStr(w.role),
          date: optStr(w.date),
        };
      }),
    // Artifacts: keep only refs that carry a non-empty id + name (the id keys the
    // IndexedDB blob, so a ref without one is unciteable and dropped). Caps name/
    // label length, validates the thumbnail data URI, and bounds the array length.
    artifacts: artifacts
      .map((a) => (a && typeof a === 'object' ? (a as Record<string, unknown>) : {}))
      .filter((a) => str(a.id) && str(a.name))
      .slice(0, ARTIFACTS_MAX)
      .map((a) => ({
        id: str(a.id, FIELD_MAX),
        name: str(a.name, ARTIFACT_NAME_MAX),
        kind: str(a.kind) || 'other',
        label: optStr(a.label, ARTIFACT_LABEL_MAX),
        thumbnailDataUri: optThumbnail(a.thumbnailDataUri),
        extractedText: optExtractedText(a.extractedText),
      })),
    // Capabilities: sanitize untrusted input from LLM route or old storage.
    // A non-array is coerced to []; invalid entries are dropped.
    capabilities: normalizeCapabilities(r.capabilities),
  };
}
