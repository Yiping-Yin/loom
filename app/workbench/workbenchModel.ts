// Loom Workbench — pure model.
// Soul: a lab notebook. Skeleton: an IDE. Center: the manuscript.
// Everything here is a pure function over the typed native snapshot so the
// signature interactions (time travel, page gaps, positions, palette,
// heartbeat) are unit-testable without a DOM.

import type {
  NativeReflectionCase,
  NativeTraceRecord,
} from '../reflection/nativeReflectionSnapshot';
import { SWIFT_REFERENCE_EPOCH_MS } from '../reflection/nativeReflectionSnapshot';

export type ManuscriptEntryKind = 'capture' | 'meaning' | 'question' | 'correction' | 'principle';

export type ManuscriptEntry = {
  id: string;
  kind: ManuscriptEntryKind;
  label: string;
  text: string;
  sourceAnchor: string;
  page: number | null;
  isWeakAnchor: boolean;
  openCondition: string | null;
  /** The struck first understanding when this entry is a revision. */
  supersededText: string | null;
  /** Zero-based commit order — the time-travel axis. */
  sequence: number;
  focus: string;
  createdAtMs: number | null;
};

const CAPTURE_LINE = /^Captured (.+?) from (.+?) \[(.+?)\]\s*([:.])?\s*([\s\S]+)$/;
const EVIDENCE_MARKER = '\nEvidence:';

function entryKindForFocus(focus: string): ManuscriptEntryKind {
  if (focus === 'question') return 'question';
  if (focus === 'correction') return 'correction';
  if (focus === 'principle') return 'principle';
  if (focus.includes('user') || focus.includes('meaning')) return 'meaning';
  return 'capture';
}

function labelForEntry(kind: ManuscriptEntryKind, focus: string): string {
  switch (kind) {
    case 'question': return 'Question';
    case 'correction': return 'Correction';
    case 'principle': return 'Principle';
    case 'meaning': return 'Committed meaning';
    case 'capture':
      if (focus.includes('data')) return 'Selected data';
      if (focus.includes('document') || focus.includes('slide')) return 'Document point';
      return 'Original selection';
  }
}

function pageFrom(sourceAnchor: string): number | null {
  const match = sourceAnchor.match(/page (\d+)/i);
  return match ? Number(match[1]) : null;
}

function stripUserPrefix(text: string): string {
  return text.replace(/^(principle|memory|correction|correct|question|meaning|translation|意思|含义|翻译)[:：]\s*/i, '').trim();
}

function openConditionFrom(text: string, kind: ManuscriptEntryKind): string | null {
  if (kind !== 'question') return null;
  const match = text.match(/closes when:\s*([\s\S]+)$/i);
  const value = match?.[1]?.trim();
  return value && value.length > 0 ? value : null;
}

function entryFromRecord(record: NativeTraceRecord, sequence: number): ManuscriptEntry {
  const kind = entryKindForFocus(record.focus);
  const text = stripUserPrefix(record.text);
  const weak =
    record.evidence.some(
      (item) =>
        (item.label === 'anchor precision' || item.label === 'visual precision') &&
        (item.value.includes('visual context only') || item.value.includes('window')),
    ) || record.evidence.some((item) => item.label === 'fallback note' && item.value.includes('weak'));
  return {
    id: record.id,
    kind,
    label: labelForEntry(kind, record.focus),
    text,
    sourceAnchor: record.sourceAnchor,
    page: pageFrom(record.sourceAnchor),
    isWeakAnchor: weak,
    openCondition: openConditionFrom(text, kind),
    supersededText: null,
    sequence,
    focus: record.focus,
    createdAtMs: record.createdAt != null ? SWIFT_REFERENCE_EPOCH_MS + record.createdAt * 1000 : null,
  };
}

function entryFromLegacyLine(line: string, sequence: number): ManuscriptEntry | null {
  const match = line.match(CAPTURE_LINE);
  if (!match) return null;
  const markerIndex = line.indexOf(EVIDENCE_MARKER);
  const evidenceTail = markerIndex === -1 ? '' : line.slice(markerIndex + EVIDENCE_MARKER.length);
  const focus = match[3]!.trim();
  const kind = entryKindForFocus(focus);
  const body = markerIndex === -1 ? match[5]! : line.slice(0, markerIndex).match(CAPTURE_LINE)?.[5] ?? match[5]!;
  const text = stripUserPrefix(body.trim());
  const weak = evidenceTail.includes('visual context only') || /anchor precision=[^;]*window/.test(evidenceTail) || evidenceTail.includes('weak');
  return {
    id: `legacy-${sequence}-${line.slice(0, 40)}`,
    kind,
    label: labelForEntry(kind, focus),
    text,
    sourceAnchor: match[2]!.trim(),
    page: pageFrom(match[2]!),
    isWeakAnchor: weak,
    openCondition: openConditionFrom(text, kind),
    supersededText: null,
    sequence,
    focus,
    createdAtMs: null,
  };
}

/** Records-first; legacy 'Captured …' lines only when no records exist. */
export function deriveEntries(nativeCase: NativeReflectionCase): ManuscriptEntry[] {
  let entries: ManuscriptEntry[];
  if (nativeCase.traceRecords && nativeCase.traceRecords.length > 0) {
    entries = nativeCase.traceRecords.map((record, index) => entryFromRecord(record, index));
  } else {
    const inputStep = nativeCase.steps.find((step) => step.id === 'input' || step.title === 'Input');
    entries = (inputStep?.items ?? [])
      .map((line, index) => entryFromLegacyLine(line, index))
      .filter((entry): entry is ManuscriptEntry => entry !== null);
  }
  return pairRevisions(entries);
}

/** A correction supersedes the latest earlier committed entry sharing its
 *  source anchor — the pair renders as ONE revision unit. */
export function pairRevisions(entries: ManuscriptEntry[]): ManuscriptEntry[] {
  const hidden = new Set<string>();
  const result = entries.map((entry) => ({ ...entry }));
  for (const entry of result) {
    if (entry.kind !== 'correction') continue;
    for (let i = entry.sequence - 1; i >= 0; i -= 1) {
      const prior = result.find((item) => item.sequence === i);
      if (!prior || hidden.has(prior.id)) continue;
      if ((prior.kind === 'meaning' || prior.kind === 'capture') && prior.sourceAnchor === entry.sourceAnchor) {
        entry.supersededText = prior.text;
        hidden.add(prior.id);
        break;
      }
    }
  }
  return result.filter((entry) => !hidden.has(entry.id));
}

/** Book order: the source's own structure (page ascending); unanchored
 *  entries keep commit order at the end. */
export function bookOrder(entries: ManuscriptEntry[]): ManuscriptEntry[] {
  return [...entries].sort((a, b) => {
    const pageA = a.page ?? Number.MAX_SAFE_INTEGER;
    const pageB = b.page ?? Number.MAX_SAFE_INTEGER;
    if (pageA !== pageB) return pageA - pageB;
    return a.sequence - b.sequence;
  });
}

/** 读厚 progress: uncovered page spans between the covered extremes. */
export function pageGaps(entries: ManuscriptEntry[]): Array<{ from: number; to: number }> {
  const pages = [...new Set(entries.map((entry) => entry.page).filter((page): page is number => page !== null))].sort(
    (a, b) => a - b,
  );
  if (pages.length < 2) return [];
  const gaps: Array<{ from: number; to: number }> = [];
  for (let i = 1; i < pages.length; i += 1) {
    if (pages[i]! - pages[i - 1]! > 1) {
      gaps.push({ from: pages[i - 1]! + 1, to: pages[i]! - 1 });
    }
  }
  return gaps;
}

/** Open questions are POSITIONS: open until their close condition is met
 *  (a later correction/meaning on the same anchor closes them implicitly —
 *  v1 keeps them open until superseded). */
export function openPositions(entries: ManuscriptEntry[]): ManuscriptEntry[] {
  return entries.filter((entry) => entry.kind === 'question');
}

/** Time travel: the manuscript as it stood after `upTo` commits (by
 *  sequence). `upTo` = entries.length shows the present. */
export function manuscriptAt(entries: ManuscriptEntry[], upTo: number): ManuscriptEntry[] {
  return entries.filter((entry) => entry.sequence < upTo);
}

/** Pass boundaries for the time-travel scale: the first review-kind commit
 *  starts the review pass. */
export function passBoundaries(entries: ManuscriptEntry[]): { firstPassEnd: number; total: number } {
  const ordered = [...entries].sort((a, b) => a.sequence - b.sequence);
  const firstReview = ordered.find((entry) => ['question', 'correction', 'principle'].includes(entry.kind));
  return {
    firstPassEnd: firstReview ? firstReview.sequence : ordered.length,
    total: ordered.length,
  };
}

/** Today's quiet pulse. */
export function heartbeat(cases: NativeReflectionCase[], now: Date = new Date()): { captures: number; meanings: number } {
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  let captures = 0;
  let meanings = 0;
  for (const nativeCase of cases) {
    for (const record of nativeCase.traceRecords ?? []) {
      if (record.createdAt == null) continue;
      const ms = SWIFT_REFERENCE_EPOCH_MS + record.createdAt * 1000;
      if (ms < dayStart) continue;
      const kind = entryKindForFocus(record.focus);
      if (kind === 'capture') captures += 1;
      else meanings += 1;
    }
  }
  return { captures, meanings };
}

export type PaletteItem = {
  type: 'project' | 'entry' | 'page';
  title: string;
  subtitle: string;
  caseID: string;
  entryID?: string;
  page?: number;
};

/** ⌘P universe: projects, entries, and jumpable source pages. */
export function paletteIndex(cases: NativeReflectionCase[]): PaletteItem[] {
  const items: PaletteItem[] = [];
  for (const nativeCase of cases) {
    items.push({ type: 'project', title: nativeCase.title, subtitle: nativeCase.project, caseID: nativeCase.id });
    for (const entry of deriveEntries(nativeCase)) {
      items.push({
        type: 'entry',
        title: entry.text.slice(0, 80),
        subtitle: `${entry.label}${entry.page ? ` · p.${entry.page}` : ''} · ${nativeCase.title}`,
        caseID: nativeCase.id,
        entryID: entry.id,
      });
      if (entry.page !== null) {
        // ⌘P "adverse selection" → Enter → the original opens at p.12: the
        // jumpable page is indexed by the CONCEPT captured there.
        items.push({
          type: 'page',
          title: `p.${entry.page} — ${entry.text.slice(0, 60)}`,
          subtitle: `Open ${entry.sourceAnchor}`,
          caseID: nativeCase.id,
          entryID: entry.id,
          page: entry.page,
        });
      }
    }
  }
  return items;
}

export function filterPalette(items: PaletteItem[], query: string, limit = 12): PaletteItem[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return items.filter((item) => item.type === 'project').slice(0, limit);
  const scored = items
    .map((item) => {
      const haystack = `${item.title} ${item.subtitle}`.toLowerCase();
      const index = haystack.indexOf(needle);
      return { item, index };
    })
    .filter(({ index }) => index !== -1)
    .sort((a, b) => a.index - b.index);
  const seen = new Set<string>();
  const result: PaletteItem[] = [];
  for (const { item } of scored) {
    const key = `${item.type}:${item.caseID}:${item.entryID ?? ''}:${item.page ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
    if (result.length >= limit) break;
  }
  return result;
}

export type ManuscriptChapter = {
  index: number;
  title: string;
  pageFrom: number | null;
  pageTo: number | null;
  entries: ManuscriptEntry[];
};

/** The book's own structure: consecutive page clusters become chapters
 *  (a jump of more than 2 pages starts a new one); unanchored entries join
 *  the current chapter; principles move to the Conclusions back-matter. */
export function groupChapters(entries: ManuscriptEntry[]): {
  chapters: ManuscriptChapter[];
  conclusions: ManuscriptEntry[];
} {
  const conclusions = entries.filter((entry) => entry.kind === 'principle');
  const body = bookOrder(entries.filter((entry) => entry.kind !== 'principle'));
  const chapters: ManuscriptChapter[] = [];
  let current: ManuscriptChapter | null = null;
  for (const entry of body) {
    const startsNew =
      current === null ||
      (entry.page !== null && current.pageTo !== null && entry.page - current.pageTo > 2);
    if (startsNew) {
      current = {
        index: chapters.length + 1,
        title: '',
        pageFrom: entry.page,
        pageTo: entry.page,
        entries: [],
      };
      chapters.push(current);
    }
    current!.entries.push(entry);
    if (entry.page !== null) {
      current!.pageFrom = current!.pageFrom ?? entry.page;
      current!.pageTo = Math.max(current!.pageTo ?? entry.page, entry.page);
    }
  }
  for (const chapter of chapters) {
    chapter.title =
      chapter.pageFrom === null
        ? 'Notes'
        : chapter.pageFrom === chapter.pageTo
          ? `p.${chapter.pageFrom}`
          : `p.${chapter.pageFrom}–${chapter.pageTo}`;
  }
  return { chapters, conclusions };
}
