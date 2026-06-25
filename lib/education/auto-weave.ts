/**
 * Auto-weave: turn a beginner's raw course files into the Learning Evidence Chain
 * (weeks + problem sets + roled, provenance-labelled files) with zero manual wiring.
 *
 * This is the "magic" that lets a first-time user out-do a hand-built course page:
 * they drop the materials they already have (lecture PDFs, problem sets, answers,
 * explanations) and the structure — which took ECON3202 hundreds of hand-authored
 * lines — falls out automatically, with the source boundary (official / private /
 * AI) labelled for free.
 */

export type RawFile = { name: string; path?: string };

export type FileRole =
  | 'lecture'
  | 'exercises'
  | 'solutions'
  | 'assignment'
  | 'answer'
  | 'explanation'
  | 'material';

/** Provenance hygiene: who authored this — the institution, the student, or an AI. */
export type SourceBoundary = 'official' | 'private' | 'ai';

export type WovenFile = {
  name: string;
  path?: string;
  role: FileRole;
  boundary?: SourceBoundary;
};

export type WovenWeek = { n: number; label: string; files: WovenFile[] };
export type WovenProblemSet = { n: number; label: string; files: WovenFile[] };

export type WovenCourse = {
  weeks: WovenWeek[];
  problemSets: WovenProblemSet[];
  loose: WovenFile[];
};

function hay(file: RawFile): string {
  return `${file.path ?? ''} ${file.name}`;
}

/** A problem set / assignment number, from "Problem Set 03", "PS03", or "Problem 3". */
function detectProblemSet(h: string): number | null {
  let m = h.match(/problem\s*set\s*0*(\d{1,3})/i);
  if (m) return Number(m[1]);
  m = h.match(/\bPS\s*0*(\d{1,3})\b/i);
  if (m) return Number(m[1]);
  m = h.match(/\bproblem\s*0*(\d{1,3})\b/i); // "Problem1", "Problem 3", "Problem1-codex…"
  if (m) return Number(m[1]);
  return null;
}

/** A week number, from a "02_Week/W01/" folder, "W1 A …", or "Week 1". */
function detectWeek(h: string): number | null {
  const m = h.match(/(?:\bweek\s*0*|\bW0*)(\d{1,2})\b/i);
  return m ? Number(m[1]) : null;
}

function detectRole(name: string): FileRole {
  if (/codex|explanation|walkthrough/i.test(name)) return 'explanation';
  if (/problem\s*set\s*\d/i.test(name)) return 'assignment';
  if (/\bproblem\s*\d|\banswer/i.test(name)) return 'answer';
  if (/solutions?/i.test(name)) return 'solutions';
  if (/exercises?|tutorial|practice/i.test(name)) return 'exercises';
  if (/\.(pdf|docx?|pptx?|md|markdown|txt|tex)$/i.test(name)) return 'lecture';
  return 'material';
}

function boundaryFor(role: FileRole): SourceBoundary | undefined {
  if (role === 'assignment') return 'official';
  if (role === 'answer') return 'private';
  if (role === 'explanation') return 'ai';
  return undefined;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function weaveCourse(files: RawFile[]): WovenCourse {
  const weeksMap = new Map<number, WovenFile[]>();
  const psMap = new Map<number, WovenFile[]>();
  const loose: WovenFile[] = [];

  for (const file of files) {
    const h = hay(file);
    const role = detectRole(file.name);
    const woven: WovenFile = { name: file.name, path: file.path, role };

    // Problem sets take priority — their files (assignment / answer / explanation)
    // also carry a problem number that must not be mistaken for a week.
    const ps = detectProblemSet(h);
    if (ps != null) {
      woven.boundary = boundaryFor(role);
      if (!psMap.has(ps)) psMap.set(ps, []);
      psMap.get(ps)!.push(woven);
      continue;
    }

    const week = detectWeek(h);
    if (week != null) {
      if (!weeksMap.has(week)) weeksMap.set(week, []);
      weeksMap.get(week)!.push(woven);
      continue;
    }

    loose.push(woven);
  }

  const weeks: WovenWeek[] = [...weeksMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([n, fs]) => ({ n, label: `W${pad(n)}`, files: fs }));
  const problemSets: WovenProblemSet[] = [...psMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([n, fs]) => ({ n, label: `PS${pad(n)}`, files: fs }));

  return { weeks, problemSets, loose };
}
