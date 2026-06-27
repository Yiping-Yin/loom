/**
 * The Year · "twelve columns, one ribbon".
 *
 * Pure helpers behind the /year and /hour support surfaces. The Year
 * reviews twelve months of material by weight, not by count; the
 * wintering ribbon beneath the columns shows what cooled; Question
 * containers hold what is still open. The Hour reuses the same
 * overview, narrowed to the current thinking window.
 */

import { bucketNewLoomWinteringItems, type NewLoomWinteringBuckets } from './wintering-state';

export const NEW_LOOM_YEAR_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

export type NewLoomYearMonthLabel = (typeof NEW_LOOM_YEAR_MONTHS)[number];

export type NewLoomYearItemOrigin = 'trace' | 'question' | 'capture' | 'local';

export type NewLoomYearItem = {
  id: string;
  title: string;
  origin: NewLoomYearItemOrigin;
  /** Last touch — visit, edit, capture, or settle. */
  at: number;
  /** Emphasis is by weight, not by count. */
  weight: number;
  href?: string;
  /** Question container the item belongs to, when it grew out of one. */
  question?: string;
  /** Hidden when the surface runs in public working mode. */
  privateItem?: boolean;
};

export type NewLoomYearMonthColumn = {
  month: NewLoomYearMonthLabel;
  monthIndex: number;
  weight: number;
  items: NewLoomYearItem[];
};

export type NewLoomYearQuestionContainer = {
  id: string;
  question: string;
  items: NewLoomYearItem[];
};

export type NewLoomYearOverview = {
  year: number;
  months: NewLoomYearMonthColumn[];
  /** The wintering ribbon under the columns: active / wintering / archived. */
  ribbon: NewLoomWinteringBuckets<NewLoomYearItem>;
  questionContainers: NewLoomYearQuestionContainer[];
};

export function buildNewLoomYearOverview(
  items: readonly NewLoomYearItem[],
  now: number = Date.now(),
): NewLoomYearOverview {
  const year = new Date(now).getFullYear();
  const months: NewLoomYearMonthColumn[] = NEW_LOOM_YEAR_MONTHS.map((month, monthIndex) => ({
    month,
    monthIndex,
    weight: 0,
    items: [],
  }));

  const dated = items.filter((item) => Number.isFinite(item.at) && item.at > 0);
  const sorted = [...dated].sort((a, b) => b.at - a.at);

  for (const item of sorted) {
    const touched = new Date(item.at);
    if (touched.getFullYear() !== year) continue;
    const column = months[touched.getMonth()];
    column.items.push(item);
    column.weight += item.weight;
  }

  const questionMap = new Map<string, NewLoomYearQuestionContainer>();
  for (const item of sorted) {
    const question = item.question?.trim();
    if (!question) continue;
    const key = question.toLowerCase();
    const container = questionMap.get(key) ?? {
      id: `question-${questionMap.size + 1}`,
      question,
      items: [],
    };
    container.items.push(item);
    questionMap.set(key, container);
  }

  return {
    year,
    months,
    ribbon: bucketNewLoomWinteringItems(sorted, now),
    questionContainers: [...questionMap.values()],
  };
}

/** Strip private material so the overview is safe to show in public working mode. */
export function publicWorkingYearOverview(overview: NewLoomYearOverview): NewLoomYearOverview {
  const visible = (items: NewLoomYearItem[]) => items.filter((item) => !item.privateItem);
  return {
    ...overview,
    months: overview.months.map((column) => {
      const items = visible(column.items);
      return {
        ...column,
        items,
        weight: items.reduce((sum, item) => sum + item.weight, 0),
      };
    }),
    ribbon: {
      active: visible(overview.ribbon.active),
      wintering: visible(overview.ribbon.wintering),
      archived: visible(overview.ribbon.archived),
    },
    questionContainers: overview.questionContainers
      .map((container) => ({ ...container, items: visible(container.items) }))
      .filter((container) => container.items.length > 0),
  };
}

/** Items touched inside the current clock hour; falls back to the latest material. */
export function currentHourItemsFromYearOverview(
  overview: NewLoomYearOverview,
  now: number = Date.now(),
  limit = 7,
): NewLoomYearItem[] {
  const hourStart = new Date(now);
  hourStart.setMinutes(0, 0, 0);
  const windowStart = hourStart.getTime();

  const all = overview.months
    .flatMap((column) => column.items)
    .sort((a, b) => b.at - a.at);

  const inWindow = all.filter((item) => item.at >= windowStart && item.at <= now);
  if (inWindow.length > 0) return inWindow.slice(0, limit);

  // Quiet hour — show the most recently touched material so the page
  // still reflects what you were last thinking about.
  return all.slice(0, limit);
}

export function yearItemDraftHref(item: NewLoomYearItem) {
  const params = new URLSearchParams();
  params.set('ref', item.href ?? `loom://year/${encodeURIComponent(item.id)}`);
  params.set('label', item.title);
  params.set('source', item.title);
  params.set('kind', 'source');
  return `/studio?edit=new&${params.toString()}`;
}

export function hourItemDraftHref(item: NewLoomYearItem) {
  const params = new URLSearchParams();
  params.set('ref', item.href ?? `loom://hour/${encodeURIComponent(item.id)}`);
  params.set('label', item.title);
  params.set('source', item.title);
  params.set('kind', 'source');
  params.set('excerpt', 'Carried over from the current hour.');
  return `/studio?edit=new&${params.toString()}`;
}

/* ── Input adapters · shared by the /year and /hour clients ── */

export type NewLoomYearTraceLike = {
  id: string;
  title?: string;
  kind?: string;
  createdAt?: number;
  updatedAt?: number;
  events?: readonly unknown[];
  source?: { href?: string; sourceTitle?: string };
};

export function yearItemsFromTraces(traces: readonly NewLoomYearTraceLike[]): NewLoomYearItem[] {
  return traces
    .map((trace): NewLoomYearItem => ({
      id: `trace-${trace.id}`,
      title: trace.title?.trim() || trace.source?.sourceTitle?.trim() || 'Untitled thread',
      origin: 'trace',
      at: trace.updatedAt ?? trace.createdAt ?? 0,
      weight: Math.max(1, trace.events?.length ?? 0),
      href: trace.source?.href,
    }))
    .filter((item) => item.at > 0);
}

export type NewLoomYearQuestionRecordLike = {
  id?: string;
  question?: string;
  weight?: string;
  at?: number;
  settledAt?: number;
  hidden?: boolean;
};

export function yearItemsFromQuestionRecords(
  records: readonly NewLoomYearQuestionRecordLike[],
): NewLoomYearItem[] {
  return records
    .filter((record) => !record.hidden)
    .map((record, index): NewLoomYearItem => {
      const question = record.question?.trim();
      return {
        id: `question-${record.id ?? index}`,
        title: question || 'Open question',
        origin: 'question',
        at: record.settledAt ?? record.at ?? 0,
        weight: record.weight === 'heavy' ? 3 : record.weight === 'light' ? 1 : 2,
        question: question || undefined,
      };
    })
    .filter((item) => item.at > 0);
}

export type NewLoomYearCaptureEntryLike = {
  id?: string;
  slug?: string;
  title?: string;
  url?: string;
  href?: string;
  origin?: string;
  savedAt?: number;
  at?: number;
};

export function yearItemsFromCaptureEntries(
  entries: readonly NewLoomYearCaptureEntryLike[],
): NewLoomYearItem[] {
  return entries
    .map((entry, index): NewLoomYearItem => {
      const id = entry.id ?? entry.slug ?? `entry-${index}`;
      const isLocal = !entry.url && entry.origin !== 'web';
      return {
        id: `capture-${id}`,
        title: entry.title?.trim() || entry.slug || 'Untitled capture',
        origin: isLocal ? 'local' : 'capture',
        at: entry.savedAt ?? entry.at ?? 0,
        weight: 1,
        href: entry.href ?? entry.url,
      };
    })
    .filter((item) => item.at > 0);
}
