/**
 * Change-event bus for learning-engine writes (Phase 4), mirroring profile-events /
 * draft-events. Fired from trace/panel/weave store write paths so the sync hook
 * debounces a push. Single channel — the hook re-syncs all three stores on any
 * change (the merge is idempotent, so re-syncing is safe). SSR-safe.
 */
const CHANGED = 'loom:learning-changed';

export function notifyLearningChanged(): void {
  if (typeof window === 'undefined') return;
  try { window.dispatchEvent(new Event(CHANGED)); } catch { /* dispatch unavailable */ }
}

export function onLearningChange(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => cb();
  window.addEventListener(CHANGED, handler);
  return () => window.removeEventListener(CHANGED, handler);
}
