/**
 * URL-scheme allowlist for user-supplied hrefs.
 *
 * Beginner profiles let users paste arbitrary link hrefs (about links, works
 * links). Those strings are rendered verbatim into `<a href=...>` sinks, so a
 * `javascript:`/`data:`/`vbscript:` scheme would execute on click. A truthiness
 * check is NOT enough: browsers tolerate leading/trailing whitespace, control
 * characters, mixed case, and embedded `\t`/`\n`/`\r` inside the scheme
 * (e.g. `java\tscript:alert(1)` still runs). This helper normalizes those away
 * and allows ONLY safe destinations, dropping everything else to `''`.
 *
 * Allowed:
 *   - http://  https://  mailto:  (case-insensitive)
 *   - relative / in-page hrefs: `/...`, `#...`, `./...`, `../...`
 * Dropped (→ ''):
 *   - any other explicit scheme (javascript:, data:, vbscript:, file:, ftp:, …)
 *   - scheme-relative `//host` (ambiguous; not needed for profile links)
 *
 * Mirrors the spirit of the http/https allowlist in app/api/url-preview/route.ts.
 */

const ALLOWED_SCHEMES = ['http:', 'https:', 'mailto:'];

// ASCII control characters (0x00–0x1F and 0x7F). Browsers strip tab/newline/CR
// from URLs before parsing the scheme, so `java\tscript:` must collapse to
// `javascript:` and then be rejected. Expressed via \x escapes so the source
// never contains literal control bytes.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\x00-\x1F\x7F]/g;

/**
 * Strip characters a browser ignores when parsing a URL scheme: ASCII control
 * chars (incl. tab/newline/CR) and the leading/trailing whitespace that browsers
 * trim before dispatching navigation. This is what defeats `java\tscript:`.
 */
function stripIgnorableChars(raw: string): string {
  return raw.replace(CONTROL_CHARS, '').trim();
}

export function safeHref(raw: string | undefined): string {
  if (typeof raw !== 'string') return '';
  const cleaned = stripIgnorableChars(raw);
  if (!cleaned) return '';

  // Relative / in-page destinations are always safe (they cannot carry a scheme).
  if (cleaned.startsWith('/') && !cleaned.startsWith('//')) {
    return cleaned;
  }
  if (cleaned.startsWith('#') || cleaned.startsWith('./') || cleaned.startsWith('../')) {
    return cleaned;
  }

  // If there is a scheme (`scheme:` before any `/`, `?`, `#`), it must be allowed.
  const schemeMatch = cleaned.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
  if (schemeMatch) {
    const scheme = schemeMatch[1].toLowerCase() + ':';
    return ALLOWED_SCHEMES.includes(scheme) ? cleaned : '';
  }

  // No scheme and not an obviously-relative form: drop scheme-relative `//host`
  // (ambiguous), otherwise treat as a bare relative path and keep it.
  if (cleaned.startsWith('//')) return '';
  return cleaned;
}
