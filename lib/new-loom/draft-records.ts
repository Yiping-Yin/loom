import {
  browserLocalStorage,
  safeStorageGetItem,
  safeStorageSetItem,
  type BrowserStorageAdapter,
} from '../browser-storage';
import { notifyDraftsChanged } from '../sync/draft-events';

export const NEW_LOOM_DRAFT_RECORDS_KEY = 'loom.new.draft-records.v1';
const DIGITAL_ME_ANSWER_ROUTE = '/digital-me';
const DIGITAL_ME_ANSWER_ANCHOR = '#digital-me-answer-title';

export type NewLoomDraftRecordStatus = 'drafting' | 'previewed' | 'published';

export type NewLoomDraftRecord = {
  id: string;
  title: string;
  answer: string;
  sourceLabels: string[];
  sourceHrefs: string[];
  draftUrl: string;
  status: NewLoomDraftRecordStatus;
  updatedAt: string;
};

export function buildDraftRecord(input: {
  title: string;
  answer: string;
  sourceLabels: string[];
  sourceHrefs: string[];
  draftUrl: string;
  status: NewLoomDraftRecordStatus;
  now?: () => string;
}): NewLoomDraftRecord {
  const updatedAt = (input.now ?? (() => new Date().toISOString()))();
  const title = cleanDraftRecordText(input.title) || 'Untitled draft';

  return {
    id: buildDraftRecordId(title, updatedAt),
    title,
    answer: cleanDraftRecordText(input.answer),
    sourceLabels: input.sourceLabels.map(cleanDraftRecordText).filter(Boolean),
    sourceHrefs: input.sourceHrefs.map(cleanDraftRecordText).filter(Boolean),
    draftUrl: cleanDraftRecordText(input.draftUrl) || `${DIGITAL_ME_ANSWER_ROUTE}${DIGITAL_ME_ANSWER_ANCHOR}`,
    status: input.status,
    updatedAt,
  };
}

/** Silent insert-or-replace by id. Used by the sync engine so its own writes do
 * NOT emit a change event (which would re-trigger sync). */
export function putDraftRecord(
  record: NewLoomDraftRecord,
  input: { storage?: BrowserStorageAdapter | null } = {},
) {
  const storage = input.storage ?? browserLocalStorage();
  const records = loadDraftRecords({ storage }).filter((existingRecord) => existingRecord.id !== record.id);
  records.unshift(record);

  return safeStorageSetItem(storage, NEW_LOOM_DRAFT_RECORDS_KEY, JSON.stringify(records));
}

/** User-facing save: persists then emits a draft-change event for the sync hook. */
export function saveDraftRecord(
  record: NewLoomDraftRecord,
  input: { storage?: BrowserStorageAdapter | null } = {},
) {
  const result = putDraftRecord(record, input);
  notifyDraftsChanged();
  return result;
}

export function loadDraftRecords(input: { storage?: BrowserStorageAdapter | null } = {}) {
  const storage = input.storage ?? browserLocalStorage();
  const raw = safeStorageGetItem(storage, NEW_LOOM_DRAFT_RECORDS_KEY);
  if (!raw) return [] as NewLoomDraftRecord[];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isDraftAnswerRecord).sort(compareDraftRecordsByUpdatedAt);
  } catch (_) {
    return [];
  }
}

export function loadLatestDraftRecord(input: { storage?: BrowserStorageAdapter | null } = {}) {
  return loadDraftRecords(input)[0] ?? null;
}

export function loadDraftRecordById(
  id: string,
  input: { storage?: BrowserStorageAdapter | null } = {},
) {
  const cleanId = cleanDraftRecordText(id);
  if (!cleanId) return null;
  return loadDraftRecords(input).find((record) => record.id === cleanId) ?? null;
}

export function draftRecordDetailHref(record: Pick<NewLoomDraftRecord, 'id'>) {
  return `${DIGITAL_ME_ANSWER_ROUTE}?draftRecord=${encodeURIComponent(record.id)}${DIGITAL_ME_ANSWER_ANCHOR}`;
}

/** Remove an answer record by id. No-op when there is no storage (SSR). */
export function removeDraftRecordById(
  id: string,
  input: { storage?: BrowserStorageAdapter | null } = {},
) {
  const storage = input.storage ?? browserLocalStorage();
  const cleanId = cleanDraftRecordText(id);
  if (!cleanId) return;
  const records = loadDraftRecords({ storage }).filter((record) => record.id !== cleanId);
  safeStorageSetItem(storage, NEW_LOOM_DRAFT_RECORDS_KEY, JSON.stringify(records));
}

export function isDraftAnswerRecord(value: unknown): value is NewLoomDraftRecord {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;

  return (
    typeof record.id === 'string' &&
    typeof record.title === 'string' &&
    typeof record.answer === 'string' &&
    typeof record.draftUrl === 'string' &&
    typeof record.updatedAt === 'string' &&
    isDraftRecordStatus(record.status) &&
    Array.isArray(record.sourceLabels) &&
    Array.isArray(record.sourceHrefs) &&
    record.sourceLabels.every((label) => typeof label === 'string') &&
    record.sourceHrefs.every((href) => typeof href === 'string')
  );
}

function isDraftRecordStatus(value: unknown): value is NewLoomDraftRecordStatus {
  return value === 'drafting' || value === 'previewed' || value === 'published';
}

function compareDraftRecordsByUpdatedAt(left: NewLoomDraftRecord, right: NewLoomDraftRecord) {
  return right.updatedAt.localeCompare(left.updatedAt);
}

function buildDraftRecordId(title: string, updatedAt: string) {
  return `${updatedAt}:${title}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function cleanDraftRecordText(value: string | undefined) {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}
