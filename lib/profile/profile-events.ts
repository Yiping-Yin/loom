/**
 * Change-notification for the beginner profile. The sync layer subscribes to
 * this; profile-storage emits it on every successful local write. One-way: the
 * sync layer depends on storage, never the reverse.
 */
export const BEGINNER_PROFILE_CHANGE_EVENT = 'loom:beginner-profile:changed';

/** Emit the change event. SSR-safe no-op when there is no window. */
export function notifyBeginnerProfileChanged(): void {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent(BEGINNER_PROFILE_CHANGE_EVENT));
  } catch {
    // dispatch can throw in exotic embeddings; never let it break a write.
  }
}

/** Subscribe to profile changes. Returns an unsubscribe fn. SSR-safe. */
export function onBeginnerProfileChange(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(BEGINNER_PROFILE_CHANGE_EVENT, cb);
  return () => window.removeEventListener(BEGINNER_PROFILE_CHANGE_EVENT, cb);
}
