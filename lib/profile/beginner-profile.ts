import { safeHref } from './safe-href';

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
export type BeginnerProfile = {
  version: 1;
  home: { name: string; headline: string };
  about: { summary: string; links: ProfileLink[] };
  education: EducationEntry[];
  experience: ExperienceEntry[];
  works: WorkItem[];
};

export function emptyBeginnerProfile(): BeginnerProfile {
  return {
    version: 1,
    home: { name: '', headline: '' },
    about: { summary: '', links: [] },
    education: [],
    experience: [],
    works: [],
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

const cap = (v: string, max: number): string => (v.length > max ? v.slice(0, max) : v);

const str = (v: unknown, max = FIELD_MAX): string =>
  typeof v === 'string' ? cap(v, max) : '';
const optStr = (v: unknown, max = FIELD_MAX): string | undefined =>
  typeof v === 'string' && v.trim() ? cap(v, max) : undefined;

export function normalizeBeginnerProfile(raw: unknown): BeginnerProfile {
  if (!raw || typeof raw !== 'object') return emptyBeginnerProfile();
  const r = raw as Record<string, unknown>;
  const home = (r.home && typeof r.home === 'object' ? r.home : {}) as Record<string, unknown>;
  const about = (r.about && typeof r.about === 'object' ? r.about : {}) as Record<string, unknown>;
  const links = Array.isArray(about.links) ? (about.links as unknown[]) : [];
  const education = Array.isArray(r.education) ? (r.education as unknown[]) : [];
  const experience = Array.isArray(r.experience) ? (r.experience as unknown[]) : [];
  const works = Array.isArray(r.works) ? (r.works as unknown[]) : [];
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
  };
}
