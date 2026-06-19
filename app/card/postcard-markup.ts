import { type BeginnerProfile } from '../../lib/profile/beginner-profile';
import { safeHref } from '../../lib/profile/safe-href';

/**
 * Shared, framework-free markup + style for the digital postcard.
 *
 * Both the live React surface (DigitalPostcard) and the downloadable standalone
 * `.html` render from the SAME derived view-model and the SAME inlined CSS here,
 * so a downloaded card looks identical to the on-screen card with zero external
 * references. Keeping this dependency-free (no React, no CSS modules) is what
 * lets `buildStandaloneCardHtml` produce a single self-contained file.
 *
 * Colour + material match the site brand language: dark cover background,
 * signature cyan (#4BC5DE) + data cyan (#6CE7F2), restrained liquid glass. The
 * standalone export hard-codes those token VALUES (a downloaded file has no
 * access to the site's CSS variables); the live surface reuses the same values
 * so the two stay visually in lockstep.
 */

const SIGNATURE_CYAN = '#4BC5DE';
const DATA_CYAN = '#6CE7F2';

const SUMMARY_MAX_CHARS = 220;

export type PostcardStat = { label: string; value: number };

export type PostcardModel = {
  name: string;
  headline: string;
  summary: string;
  /** Only non-zero counts, in display order. */
  stats: PostcardStat[];
  /** A one-line capability cue (top work, or a journey hint), or ''. */
  capabilityHint: string;
  /** True when the profile has nothing beyond a name/headline. */
  isSparse: boolean;
};

/** Truncate to a graceful single line, breaking on a word where possible. */
function truncate(value: string, max: number): string {
  const clean = value.trim();
  if (clean.length <= max) return clean;
  const slice = clean.slice(0, max);
  const lastSpace = slice.lastIndexOf(' ');
  const head = lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice;
  return `${head.trimEnd()}…`;
}

/**
 * Derive the compact postcard view-model from a (already-normalized) profile.
 *
 * The card is proof-optional: it surfaces only what exists. Counts that are zero
 * are dropped from the stat strip; a missing summary / works simply collapses.
 */
export function buildPostcardModel(profile: BeginnerProfile): PostcardModel {
  const name = profile.home.name.trim() || 'Your name';
  const headline = profile.home.headline.trim();
  const summary = truncate(profile.about.summary, SUMMARY_MAX_CHARS);

  const stats: PostcardStat[] = [
    { label: profile.works.length === 1 ? 'Work' : 'Works', value: profile.works.length },
    {
      label: profile.experience.length === 1 ? 'Experience' : 'Experiences',
      value: profile.experience.length,
    },
    {
      label: profile.education.length === 1 ? 'Education' : 'Education entries',
      value: profile.education.length,
    },
  ].filter((stat) => stat.value > 0);

  // Capability hint: prefer a named work, else the most recent experience role,
  // else an education qualification — a single line that hints at substance.
  let capabilityHint = '';
  if (profile.works.length > 0) {
    const top = profile.works[0];
    capabilityHint = top.role ? `${top.title} · ${top.role}` : top.title;
  } else if (profile.experience.length > 0) {
    const top = profile.experience[0];
    capabilityHint = top.organization ? `${top.role} · ${top.organization}` : top.role;
  } else if (profile.education.length > 0) {
    const top = profile.education[0];
    capabilityHint = top.field ? `${top.qualification}, ${top.field}` : top.qualification;
  }
  capabilityHint = truncate(capabilityHint, 90);

  const isSparse =
    stats.length === 0 && !summary && !capabilityHint;

  return { name, headline, summary, stats, capabilityHint, isSparse };
}

/** HTML-escape text so derived content cannot break out of the markup sink. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export const POSTCARD_FOOTER_LINE = 'Verified, cited — ask my Digital Me anything.';

/**
 * The inlined CSS for the postcard, scoped under `.loom-postcard`.
 *
 * `moonSrc` differs by context: the live surface passes the site asset path
 * (`/brand/loom_lunar_orb.png`); the standalone export passes a data: URI so the
 * downloaded file needs no network. When no moon source is available the mark
 * degrades to a quiet cyan ring (see markup).
 */
export function postcardCss(): string {
  return `
.loom-postcard {
  --pc-signature: ${SIGNATURE_CYAN};
  --pc-data: ${DATA_CYAN};
  --pc-ink-0: #0a0d10;
  --pc-ink-1: #11151a;
  --pc-text-1: #eef1f2;
  --pc-text-2: #b4bbbf;
  --pc-text-3: #828b90;
  --pc-line: rgba(255, 255, 255, 0.1);
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: 25rem;
  margin-inline: auto;
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
  padding: clamp(1.5rem, 4vw, 2.1rem);
  border-radius: 16px;
  border: 1px solid var(--pc-line);
  color: var(--pc-text-1);
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  background:
    radial-gradient(120% 80% at 80% -10%, rgba(108, 231, 242, 0.1), transparent 60%),
    linear-gradient(135deg, rgba(238, 241, 242, 0.07), rgba(180, 187, 191, 0.03) 34%, transparent 60%),
    linear-gradient(180deg, rgba(28, 33, 38, 0.92), rgba(12, 15, 18, 0.97));
  -webkit-backdrop-filter: blur(20px) saturate(115%);
  backdrop-filter: blur(20px) saturate(115%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.07),
    inset 0 -1px 0 rgba(0, 0, 0, 0.45),
    0 18px 48px rgba(0, 0, 0, 0.55);
}
.loom-postcard *,
.loom-postcard *::before,
.loom-postcard *::after { box-sizing: border-box; }
.loom-postcard__brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.loom-postcard__moon {
  width: 2.1rem;
  height: 2.1rem;
  border-radius: 999px;
  object-fit: cover;
  flex: none;
  box-shadow: 0 0 18px rgba(75, 197, 222, 0.22);
}
.loom-postcard__moon--fallback {
  border: 1.5px solid var(--pc-signature);
  background: radial-gradient(circle at 35% 30%, rgba(108, 231, 242, 0.35), transparent 65%);
}
.loom-postcard__wordmark {
  font-family: ui-monospace, "JetBrains Mono", "SF Mono", Menlo, monospace;
  font-size: 0.68rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--pc-text-3);
}
.loom-postcard__identity { display: flex; flex-direction: column; gap: 0.35rem; }
.loom-postcard__eyebrow {
  margin: 0;
  font-family: ui-monospace, "JetBrains Mono", "SF Mono", Menlo, monospace;
  font-size: 0.62rem;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--pc-signature);
}
.loom-postcard__name {
  margin: 0;
  font-family: "Cormorant Garamond", Georgia, "Times New Roman", serif;
  font-size: clamp(1.9rem, 7vw, 2.5rem);
  font-weight: 600;
  line-height: 1.05;
  letter-spacing: -0.01em;
  color: var(--pc-text-1);
}
.loom-postcard__headline {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 500;
  line-height: 1.45;
  color: var(--pc-text-2);
}
.loom-postcard__summary {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.55;
  color: var(--pc-text-3);
}
.loom-postcard__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.loom-postcard__stat {
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
  padding: 0.32rem 0.6rem;
  border: 1px solid var(--pc-line);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.025);
}
.loom-postcard__stat-value {
  font-family: ui-monospace, "JetBrains Mono", "SF Mono", Menlo, monospace;
  font-size: 0.95rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--pc-data);
}
.loom-postcard__stat-label {
  font-size: 0.66rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--pc-text-3);
}
.loom-postcard__hint {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 0.78rem;
  line-height: 1.4;
  color: var(--pc-text-2);
}
.loom-postcard__hint-dot {
  flex: none;
  width: 0.42rem;
  height: 0.42rem;
  border-radius: 999px;
  background: var(--pc-signature);
  box-shadow: 0 0 7px rgba(75, 197, 222, 0.55);
}
.loom-postcard__footer {
  margin: 0;
  padding-top: 0.95rem;
  border-top: 1px solid var(--pc-line);
  font-size: 0.74rem;
  line-height: 1.45;
  color: var(--pc-text-3);
}
.loom-postcard__footer strong {
  color: var(--pc-signature);
  font-weight: 600;
}
.loom-postcard__footer a {
  color: var(--pc-data);
  text-decoration: none;
}
.loom-postcard__footer a:hover { text-decoration: underline; }
`.trim();
}

/**
 * The postcard's inner markup as an HTML string (no wrapper element).
 *
 * Shared by the standalone export. The React surface mirrors this structure
 * with JSX so the two never drift. `moonSrc` is the moon mark source; when ''
 * the mark renders as a quiet cyan ring fallback.
 *
 * `digitalMeHref` is run through `safeHref` and points at the live Digital Me
 * surface; in the standalone file it is an absolute URL so the footer link works
 * from a downloaded file.
 */
export function postcardInnerHtml(
  model: PostcardModel,
  moonSrc: string,
  digitalMeHref: string,
): string {
  const safeDigitalMe = safeHref(digitalMeHref);
  const moon = moonSrc
    ? `<img class="loom-postcard__moon" src="${escapeHtml(moonSrc)}" alt="" />`
    : `<span class="loom-postcard__moon loom-postcard__moon--fallback" aria-hidden="true"></span>`;

  const stats =
    model.stats.length > 0
      ? `<ul class="loom-postcard__stats">${model.stats
          .map(
            (stat) =>
              `<li class="loom-postcard__stat"><span class="loom-postcard__stat-value">${stat.value}</span><span class="loom-postcard__stat-label">${escapeHtml(stat.label)}</span></li>`,
          )
          .join('')}</ul>`
      : '';

  const summary = model.summary
    ? `<p class="loom-postcard__summary">${escapeHtml(model.summary)}</p>`
    : '';

  const headline = model.headline
    ? `<p class="loom-postcard__headline">${escapeHtml(model.headline)}</p>`
    : '';

  const hint = model.capabilityHint
    ? `<p class="loom-postcard__hint"><span class="loom-postcard__hint-dot" aria-hidden="true"></span><span>${escapeHtml(model.capabilityHint)}</span></p>`
    : '';

  const footer = safeDigitalMe
    ? `<p class="loom-postcard__footer"><strong>Verified, cited</strong> — <a href="${escapeHtml(safeDigitalMe)}">ask my Digital Me anything.</a></p>`
    : `<p class="loom-postcard__footer"><strong>Verified, cited</strong> — ask my Digital Me anything.</p>`;

  return [
    `<div class="loom-postcard__brand">${moon}<span class="loom-postcard__wordmark">Loom</span></div>`,
    `<div class="loom-postcard__identity"><p class="loom-postcard__eyebrow">Digital postcard</p><h1 class="loom-postcard__name">${escapeHtml(model.name)}</h1>${headline}</div>`,
    summary,
    stats,
    hint,
    footer,
  ]
    .filter(Boolean)
    .join('');
}

/**
 * Build a fully self-contained `.html` document for the card.
 *
 * No external references: the CSS is inlined and the moon mark is a data: URI
 * (or the cyan-ring fallback when none is supplied). Opens standalone in any
 * browser and matches the on-screen card.
 */
export function buildStandaloneCardHtml(
  profile: BeginnerProfile,
  moonDataUri: string,
  digitalMeUrl: string,
): string {
  const model = buildPostcardModel(profile);
  const inner = postcardInnerHtml(model, moonDataUri, digitalMeUrl);
  const title = `${model.name} — Loom digital postcard`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<style>
html, body {
  margin: 0;
  min-height: 100%;
  background:
    radial-gradient(120% 90% at 50% -10%, rgba(75, 197, 222, 0.08), transparent 60%),
    #0a0d10;
}
body {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(1.5rem, 6vw, 4rem);
}
${postcardCss()}
</style>
</head>
<body>
<div class="loom-postcard">${inner}</div>
</body>
</html>
`;
}
