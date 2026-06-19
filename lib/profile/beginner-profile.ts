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

const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const optStr = (v: unknown): string | undefined =>
  typeof v === 'string' && v.trim() ? v : undefined;

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
      summary: str(about.summary),
      links: links
        .map((l) => (l && typeof l === 'object' ? (l as Record<string, unknown>) : {}))
        .filter((l) => str(l.href))
        .map((l) => ({ label: str(l.label) || 'Link', href: str(l.href) })),
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
          .filter((b) => typeof b === 'string' && b.trim()) as string[],
      })),
    works: works
      .map((w) => (w && typeof w === 'object' ? (w as Record<string, unknown>) : {}))
      .filter((w) => str(w.title).trim())
      .map((w) => ({
        title: str(w.title),
        description: optStr(w.description),
        link: optStr(w.link),
        role: optStr(w.role),
        date: optStr(w.date),
      })),
  };
}
