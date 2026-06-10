import type { NewLoomDraftReference } from './draft-storage';

export const NEW_LOOM_DRAFT_ANSWER_PREVIEW_KEY = 'loom.new.draft.answer-preview.v1';

export type NewLoomDraftAnswerPreview = {
  question: string;
  answer: string;
  draftTitle: string;
  sourceLabels: string[];
  sourceHrefs: string[];
  updatedAt: string;
};

export type DraftAnswerPreviewStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

export function buildDraftAnswerPreview(input: {
  title: string;
  body: string;
  answer: string;
  references: Array<Pick<NewLoomDraftReference, 'label' | 'href' | 'sourceTitle'>>;
  now?: () => string;
}): NewLoomDraftAnswerPreview {
  const draftTitle = cleanPreviewText(input.title) || 'AI answer';
  const question = extractDraftSection(input.body, 'Question') || draftTitle;
  const sources = uniqueSources(input.references);

  return {
    question,
    answer: cleanPreviewText(input.answer),
    draftTitle,
    sourceLabels: sources.map((source) => source.label),
    sourceHrefs: sources.map((source) => source.href),
    updatedAt: (input.now ?? (() => new Date().toISOString()))(),
  };
}

export function extractDraftAnswerFromBody(body: string) {
  return extractDraftSection(body, 'Answer');
}

export function saveDraftAnswerPreview(
  preview: NewLoomDraftAnswerPreview,
  adapter = browserAnswerPreviewStorage(),
) {
  if (!adapter) return false;
  try {
    adapter.setItem(NEW_LOOM_DRAFT_ANSWER_PREVIEW_KEY, JSON.stringify(preview));
    return true;
  } catch (_) {
    return false;
  }
}

export function loadDraftAnswerPreview(
  adapter = browserAnswerPreviewStorage(),
): NewLoomDraftAnswerPreview | null {
  if (!adapter) return null;
  try {
    const raw = adapter.getItem(NEW_LOOM_DRAFT_ANSWER_PREVIEW_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return isDraftAnswerPreview(parsed) ? parsed : null;
  } catch (_) {
    return null;
  }
}

function browserAnswerPreviewStorage(): DraftAnswerPreviewStorage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch (_) {
    return null;
  }
}

function isDraftAnswerPreview(value: unknown): value is NewLoomDraftAnswerPreview {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.question === 'string' &&
    typeof record.answer === 'string' &&
    typeof record.draftTitle === 'string' &&
    typeof record.updatedAt === 'string' &&
    Array.isArray(record.sourceLabels) &&
    Array.isArray(record.sourceHrefs) &&
    record.sourceLabels.every((label) => typeof label === 'string') &&
    record.sourceHrefs.every((href) => typeof href === 'string')
  );
}

function uniqueSources(
  references: Array<Pick<NewLoomDraftReference, 'label' | 'href' | 'sourceTitle'>>,
) {
  const byHref = new Map<string, { label: string; href: string }>();

  for (const reference of references) {
    const href = cleanPreviewText(reference.href);
    if (!href || byHref.has(href)) continue;

    const label = cleanPreviewText(reference.sourceTitle ?? reference.label);
    if (!label) continue;
    byHref.set(href, { label, href });
  }

  return Array.from(byHref.values());
}

function extractDraftSection(body: string, heading: string) {
  const normalizedHeading = heading.trim().toLowerCase();
  const lines = body.split(/\r?\n/);
  let start = -1;

  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^#{2,6}\s+(.+?)\s*$/);
    if (match?.[1]?.trim().toLowerCase() === normalizedHeading) {
      start = index + 1;
      break;
    }
  }

  if (start < 0) return '';

  const sectionLines: string[] = [];
  for (let index = start; index < lines.length; index += 1) {
    if (/^#{2,6}\s+/.test(lines[index])) break;
    sectionLines.push(lines[index]);
  }

  return cleanPreviewText(sectionLines.join(' '));
}

function cleanPreviewText(value: string | undefined) {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}
