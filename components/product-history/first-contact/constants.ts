/** FirstContact cinematic hero — shared constants.
 *
 *  Identity copy (pinned by contract) + motion timing/thresholds for the
 *  scroll-driven "first contact" sequence (cold open → approach → comet
 *  climax → settle). All values are isomorphic plain data so this module is
 *  safe to import from both the server page and the client layers. */

// ── Locked identity copy (contract-pinned — do not change wording) ─────────
export const VISOR_WORDMARK = 'LOOM';
export const EYEBROW = 'LIBRARY · EYES · MEMORY';
export const EXPLANATION = 'A living, source-backed identity that can answer for you';

// ── Motion engine constants ────────────────────────────────────────────────
/** Progress at which the one-shot climax (comet + colour bloom + visor
 *  reveal) latches. Once latched it stays latched for the page lifetime, so
 *  scrolling back up never replays the burst. */
export const CLIMAX_P = 0.9;

/** Fraction of one viewport of scrolling over which the approach plays out
 *  (`--fc-p` 0 → 1). The History hero is ~100svh tall, so we scrub against
 *  the viewport rather than the element's own (near-zero) internal overflow. */
export const SCRUB_SPAN = 0.8;

// ── Cold open ───────────────────────────────────────────────────────────────
/** sessionStorage flag so the cold-open "History" flicker plays at most once
 *  per browser session (skipped on reload, on reduced-motion, and on SSR). */
export const COLD_OPEN_KEY = 'loom:first-contact:cold-open';

/** Total cold-open lifetime in ms (fade-in → ≤3 low-contrast flickers →
 *  fade-out). Kept well under a strobe threshold for WCAG flash safety. */
export const COLD_OPEN_DURATION_MS = 2600;
