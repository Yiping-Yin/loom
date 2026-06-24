/**
 * Change-event bus for artifact writes (Phase 2), mirroring profile-events /
 * draft-events. Fired from putArtifact / deleteArtifact so the sync hook knows to
 * push or remove. Carries the affected artifact id (CustomEvent detail) so a
 * delete removes EXACTLY that remote object — never reconciling by local-cache
 * absence, which under lazy-pull would wrongly delete not-yet-pulled blobs.
 * SSR-safe.
 */
const ADDED = 'loom:artifact-added';
const DELETED = 'loom:artifact-deleted';

function emit(type: string, id: string): void {
  if (typeof window === 'undefined') return;
  try { window.dispatchEvent(new CustomEvent(type, { detail: id })); } catch { /* dispatch unavailable */ }
}

function on(type: string, cb: (id: string) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (event: Event) => cb((event as CustomEvent<string>).detail);
  window.addEventListener(type, handler);
  return () => window.removeEventListener(type, handler);
}

export function notifyArtifactAdded(id: string): void { emit(ADDED, id); }
export function onArtifactAdded(cb: (id: string) => void): () => void { return on(ADDED, cb); }
export function notifyArtifactDeleted(id: string): void { emit(DELETED, id); }
export function onArtifactDeleted(cb: (id: string) => void): () => void { return on(DELETED, cb); }
