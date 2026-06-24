/**
 * Change-event bus for artifact writes (Phase 2), mirroring profile-events /
 * draft-events. Fired from putArtifact / deleteArtifact so the sync hook knows to
 * push or prune. SSR-safe. The id arg is kept for call-site clarity; handlers
 * re-read state on any event.
 */
const ADDED = 'loom:artifact-added';
const DELETED = 'loom:artifact-deleted';

function emit(type: string): void {
  if (typeof window === 'undefined') return;
  try { window.dispatchEvent(new Event(type)); } catch { /* dispatch unavailable */ }
}

function on(type: string, cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => cb();
  window.addEventListener(type, handler);
  return () => window.removeEventListener(type, handler);
}

export function notifyArtifactAdded(_id: string): void { emit(ADDED); }
export function onArtifactAdded(cb: () => void): () => void { return on(ADDED, cb); }
export function notifyArtifactDeleted(_id: string): void { emit(DELETED); }
export function onArtifactDeleted(cb: () => void): () => void { return on(DELETED, cb); }
