/**
 * Tiny change-event bus for draft writes, mirroring profile-events.ts. Fired ONLY
 * from user-initiated saves (createDraft / updateDraft / saveDraftRecord) — the
 * sync engine writes through silent low-level mutators so its own writes never
 * re-trigger a sync. SSR-safe.
 */
const DRAFTS_CHANGED_EVENT = 'loom:drafts-changed';

export function notifyDraftsChanged(): void {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new Event(DRAFTS_CHANGED_EVENT));
  } catch {
    /* dispatch unavailable — ignore */
  }
}

export function onDraftsChange(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => cb();
  window.addEventListener(DRAFTS_CHANGED_EVENT, handler);
  return () => window.removeEventListener(DRAFTS_CHANGED_EVENT, handler);
}
