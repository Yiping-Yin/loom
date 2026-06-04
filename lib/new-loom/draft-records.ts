import {
  browserLocalStorage,
  safeStorageGetItem,
  safeStorageSetItem,
  type BrowserStorageAdapter,
} from '../browser-storage';

export const NEW_LOOM_DRAFT_RECORDS_KEY = 'loom.new.draft-records.v1';

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
    draftUrl: cleanDraftRecordText(input.draftUrl) || '/draft',
    status: input.status,
    updatedAt,
  };
}

export function saveDraftRecord(
  record: NewLoomDraftRecord,
  input: { storage?: BrowserStorageAdapter | null } = {},
) {
  const storage = input.storage ?? browserLocalStorage();
  const records = loadDraftRecords({ storage }).filter((existingRecord) => existingRecord.id !== record.id);
  records.unshift(record);

  return safeStorageSetItem(storage, NEW_LOOM_DRAFT_RECORDS_KEY, JSON.stringify(records));
}

export function loadDraftRecords(input: { storage?: BrowserStorageAdapter | null } = {}) {
  const storage = input.storage ?? browserLocalStorage();
  const raw = safeStorageGetItem(storage, NEW_LOOM_DRAFT_RECORDS_KEY);
  if (!raw) return [] as NewLoomDraftRecord[];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isDraftRecord).sort(compareDraftRecordsByUpdatedAt);
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
  return `/drafts/${encodeURIComponent(record.id)}`;
}

function isDraftRecord(value: unknown): value is NewLoomDraftRecord {
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
