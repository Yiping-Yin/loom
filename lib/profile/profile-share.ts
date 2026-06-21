import {
  normalizeBeginnerProfile,
  type BeginnerProfile,
} from './beginner-profile';

/**
 * Shareable "digital postcard" link codec.
 *
 * A beginner's profile lives only in their browser localStorage (no server —
 * Loom ships as a static export and deploys to the web from main). To share a
 * card, the whole profile is encoded into the URL hash of `/card`, so the link
 * is self-contained: anyone who opens it sees the card with no backend.
 *
 * Security: a shared hash is attacker-controllable, so `decodeProfileFromHash`
 * always runs the decoded value through `normalizeBeginnerProfile`. That applies
 * the same safe-href allowlist + per-field size caps as stored profiles, so a
 * crafted link carrying a `javascript:` href or an oversized field is sanitized
 * before it ever reaches a render sink.
 *
 * SSR-safe + dep-free: uses `TextEncoder`/`TextDecoder` + `btoa`/`atob`, which
 * exist in the browser and in the Node test runtime, with no Buffer assumption.
 */

/** base64 → base64url (URL-safe, no padding) so the value is a clean hash. */
function base64ToBase64url(b64: string): string {
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** base64url → base64 (restore standard alphabet + padding) for `atob`. */
function base64urlToBase64(b64url: string): string {
  const restored = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (restored.length % 4)) % 4;
  return restored + '='.repeat(padLength);
}

/** Encode raw bytes to a binary string `btoa` accepts (one byte per char). */
function bytesToBinaryString(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return binary;
}

/** Decode a `btoa`-style binary string back to raw bytes. */
function binaryStringToBytes(binary: string): Uint8Array {
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Encode a profile to a Unicode-safe base64url string (the URL hash payload).
 *
 * JSON → UTF-8 bytes (TextEncoder, so emoji / CJK survive) → base64 (btoa over a
 * one-byte-per-char binary string) → base64url.
 *
 * `artifacts` are deliberately STRIPPED from the share payload: an ArtifactRef
 * points at a blob in THIS device's IndexedDB, which doesn't travel with the
 * link, and its base64 thumbnail would bloat the URL. A shared postcard is the
 * profile text only; proof artifacts live where they were uploaded. (Decode runs
 * through normalize, which yields `artifacts: []`, so the round-trip is stable.)
 */
export function encodeProfileToHash(profile: BeginnerProfile): string {
  const { artifacts: _artifacts, ...shareable } = profile;
  const json = JSON.stringify(shareable);
  const bytes = new TextEncoder().encode(json);
  const base64 = btoa(bytesToBinaryString(bytes));
  return base64ToBase64url(base64);
}

/**
 * Decode a URL hash back to a normalized profile, or null on any failure.
 *
 * Strips a leading `#`, base64url-decodes, JSON.parses, then ALWAYS runs through
 * `normalizeBeginnerProfile` so a crafted link cannot carry a dangerous href or
 * an oversized field into the card. Any malformed input (bad base64, bad JSON)
 * returns null rather than throwing.
 */
export function decodeProfileFromHash(hash: string): BeginnerProfile | null {
  if (typeof hash !== 'string') return null;
  const trimmed = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!trimmed) return null;
  try {
    const base64 = base64urlToBase64(trimmed);
    const binary = atob(base64);
    const bytes = binaryStringToBytes(binary);
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json) as unknown;
    return normalizeBeginnerProfile(parsed);
  } catch {
    return null;
  }
}

/**
 * Build the full shareable card URL for a profile.
 *
 * `origin` is the caller's `window.location.origin` (e.g. https://loom.app).
 * The profile rides entirely in the hash fragment, which is never sent to a
 * server — the card renders client-side from the decoded hash.
 */
export function buildShareUrl(origin: string, profile: BeginnerProfile): string {
  return `${origin}/card#${encodeProfileToHash(profile)}`;
}
