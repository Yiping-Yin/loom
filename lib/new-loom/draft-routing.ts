import { type NewLoomDraftRecord } from './draft-storage';

/**
 * Map a legacy /draft search string to the equivalent /studio editor URL.
 * `?d=<id>` → `edit=<id>`; absent → `edit=new`. All other params (draftType,
 * draftRecord, view, ref/label/quote/…) are preserved so deep links keep working.
 */
export function draftStubTarget(search: string): string {
  const params = new URLSearchParams(search);
  const d = params.get('d');
  params.delete('d');
  params.set('edit', d && d.trim() ? d.trim() : 'new');
  return `/studio?${params.toString()}`;
}

/**
 * Select the draft to edit. `new` (or absent) → null (a fresh document);
 * an id → that record, or null when it no longer exists (→ a fresh document).
 */
export function selectDraftById(
  records: NewLoomDraftRecord[],
  editId: string | undefined,
): NewLoomDraftRecord | null {
  if (!editId || editId === 'new') return null;
  return records.find((r) => r.id === editId) ?? null;
}
