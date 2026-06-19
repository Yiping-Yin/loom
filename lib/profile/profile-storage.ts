import { normalizeBeginnerProfile, type BeginnerProfile } from './beginner-profile';

/**
 * localStorage key for the single-tenant beginner profile.
 *
 * Persistence lives in the browser so it works identically in dev, the web
 * build, and the shipped static macOS app (`loom://bundle`, no Node server).
 * `scripts/build-static-export.mjs` shelves `app/api`, so a server route would
 * 404 in the installed app — the client store is the universal path.
 */
export const BEGINNER_PROFILE_KEY = 'loom:beginner-profile';

/** True only in a browser context with a usable localStorage. */
function getLocalStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage ?? null;
  } catch {
    // Access can throw in some privacy / sandboxed contexts.
    return null;
  }
}

/**
 * Read + normalize the beginner profile from localStorage.
 *
 * Returns null when absent, during SSR (no `window`), or when the stored value
 * is missing / unparseable. Always normalized, so callers get a safe shape.
 */
export function readBeginnerProfileLocal(): BeginnerProfile | null {
  const store = getLocalStorage();
  if (!store) return null;
  let raw: string | null;
  try {
    raw = store.getItem(BEGINNER_PROFILE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    return normalizeBeginnerProfile(JSON.parse(raw));
  } catch {
    return null;
  }
}

/**
 * Normalize + persist the beginner profile to localStorage. No-op during SSR or
 * when localStorage is unavailable.
 */
export function writeBeginnerProfileLocal(profile: BeginnerProfile): void {
  const store = getLocalStorage();
  if (!store) return;
  const normalized = normalizeBeginnerProfile(profile);
  try {
    store.setItem(BEGINNER_PROFILE_KEY, JSON.stringify(normalized));
  } catch {
    // Quota / privacy mode — silently ignore; the wizard keeps in-memory state.
  }
}
