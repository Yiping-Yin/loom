/**
 * lib/jot/jot-storage · client-side localStorage store for free-floating jots.
 *
 * A jot is a quick, unanchored thought: no title, no doc, no AI call required.
 * Captured from the /today surface and persisted in localStorage so they
 * survive in dev, the web build, and the shipped static macOS app
 * (`loom://bundle`, no Node server). The same reasoning as profile-storage.ts:
 * `scripts/build-static-export.mjs` shelves `app/api`, so a server route
 * would 404 in the installed app.
 *
 * Shape is intentionally minimal. Future: migrate to a client db if jots grow
 * large, but localStorage is the right start for a quick-jot surface.
 *
 * API:
 *   readJots()        → Jot[]  (newest-first)
 *   appendJot(text)   → Jot    (the newly created jot)
 */

export type JotId = string;

export type Jot = {
  id: JotId;
  text: string;
  /** Unix ms timestamp of creation. */
  at: number;
};

/** localStorage key for the jot log. */
export const JOTS_KEY = 'loom:jots';

/** Maximum jots kept in localStorage (oldest pruned beyond this). */
const MAX_JOTS = 200;

// ── internal helpers ────────────────────────────────────────────────────────

/** Safe localStorage accessor — returns null during SSR or sandboxed contexts. */
function getLocalStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

function generateJotId(): JotId {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 7);
  return `jt_${ts}_${rand}`;
}

/** Read raw jot array from storage. Returns [] when absent or unparseable. */
function readRaw(): Jot[] {
  const store = getLocalStorage();
  if (!store) return [];
  let raw: string | null;
  try {
    raw = store.getItem(JOTS_KEY);
  } catch {
    return [];
  }
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const valid: Jot[] = [];
    for (const item of parsed) {
      if (
        item !== null &&
        typeof item === 'object' &&
        typeof (item as Record<string, unknown>).id === 'string' &&
        typeof (item as Record<string, unknown>).text === 'string' &&
        typeof (item as Record<string, unknown>).at === 'number'
      ) {
        valid.push(item as Jot);
      }
    }
    return valid;
  } catch {
    return [];
  }
}

/** Write jot array to storage. Silent no-op on quota / sandboxed error. */
function writeRaw(jots: Jot[]): void {
  const store = getLocalStorage();
  if (!store) return;
  try {
    store.setItem(JOTS_KEY, JSON.stringify(jots));
  } catch {
    // Quota exceeded or privacy mode — silently ignore.
  }
}

// ── public API ───────────────────────────────────────────────────────────────

/**
 * Read all jots from localStorage, newest-first.
 *
 * Safe to call during SSR (returns []).
 */
export function readJots(): Jot[] {
  const raw = readRaw();
  // Sort newest-first by `at` (defensive: storage order may drift).
  return [...raw].sort((a, b) => b.at - a.at);
}

/**
 * Append a new jot. Trims whitespace; ignores empty/whitespace-only text.
 *
 * Returns the new Jot on success, or null if text is empty or storage is
 * unavailable (SSR, privacy mode, etc.).
 */
export function appendJot(text: string): Jot | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const jot: Jot = {
    id: generateJotId(),
    text: trimmed,
    at: Date.now(),
  };

  const existing = readRaw();
  // Prepend newest first in storage so the raw array is already sorted.
  const updated = [jot, ...existing].slice(0, MAX_JOTS);
  writeRaw(updated);
  return jot;
}
