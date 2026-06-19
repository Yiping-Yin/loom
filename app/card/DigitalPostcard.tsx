'use client';

import { useEffect, useState } from 'react';

import { type BeginnerProfile } from '../../lib/profile/beginner-profile';
import { safeHref } from '../../lib/profile/safe-href';
import { buildShareUrl } from '../../lib/profile/profile-share';
import {
  buildPostcardModel,
  buildStandaloneCardHtml,
  postcardCss,
} from './postcard-markup';
import styles from './CardPage.module.css';

const MOON_SRC = '/brand/loom_lunar_orb.png';
const DIGITAL_ME_HREF = '/digital-me';
const ONBOARDING_HREF = '/onboarding/profile';

/**
 * Read the moon brand asset and return it as a data: URI so the downloaded card
 * is self-contained (no network reference). Returns '' on any failure, in which
 * case the card degrades to the quiet cyan-ring fallback — the download still
 * works, it just omits the photo.
 */
async function loadMoonDataUri(): Promise<string> {
  try {
    const response = await fetch(MOON_SRC);
    if (!response.ok) return '';
    const blob = await response.blob();
    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(blob);
    });
  } catch {
    return '';
  }
}

/** Slugify a name into a safe filename stem. */
function fileStem(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'profile';
}

/**
 * DigitalPostcard — the shareable card of a person's Loom identity (pillar 3).
 *
 * Compact, on-brand (dark cover + signature/data cyan + restrained liquid
 * glass), proof-optional: it surfaces only what the profile has and still reads
 * intentionally for a name+headline-only profile.
 *
 * `isOwnCard` is true only when the profile was loaded from the owner's
 * localStorage (not a shared hash). Owner-only actions (copy link, download)
 * render only then; a hash-loaded viewer instead sees a quiet "Make your own
 * Loom" link to onboarding.
 */
export function DigitalPostcard({
  profile,
  isOwnCard,
}: {
  profile: BeginnerProfile;
  isOwnCard: boolean;
}) {
  const model = buildPostcardModel(profile);
  const safeDigitalMe = safeHref(DIGITAL_ME_HREF);
  const [copied, setCopied] = useState(false);

  // Reset the "Copied" confirmation after a short beat.
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2200);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copyShareLink() {
    const url = buildShareUrl(window.location.origin, profile);
    let ok = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        ok = true;
      }
    } catch {
      ok = false;
    }
    if (!ok) {
      // Fallback for browsers without async clipboard / insecure contexts.
      try {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        ok = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch {
        ok = false;
      }
    }
    if (ok) setCopied(true);
    else window.prompt('Copy your shareable Loom card link:', url);
  }

  async function downloadCard() {
    const moonDataUri = await loadMoonDataUri();
    const digitalMeUrl = `${window.location.origin}${safeDigitalMe || DIGITAL_ME_HREF}`;
    const html = buildStandaloneCardHtml(profile, moonDataUri, digitalMeUrl);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = `loom-card-${fileStem(model.name)}.html`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(objectUrl);
  }

  return (
    <div className={styles.stage}>
      <style>{postcardCss()}</style>

      <article className="loom-postcard" aria-label={`${model.name} — Loom digital postcard`}>
        <div className="loom-postcard__brand">
          {/* The realistic-moon brand mark — same asset/treatment as the nav orb. */}
          <img className="loom-postcard__moon" src={MOON_SRC} alt="" draggable={false} />
          <span className="loom-postcard__wordmark">Loom</span>
        </div>

        <div className="loom-postcard__identity">
          <p className="loom-postcard__eyebrow">Digital postcard</p>
          <h1 className="loom-postcard__name">{model.name}</h1>
          {model.headline && <p className="loom-postcard__headline">{model.headline}</p>}
        </div>

        {model.summary && <p className="loom-postcard__summary">{model.summary}</p>}

        {model.stats.length > 0 && (
          <ul className="loom-postcard__stats">
            {model.stats.map((stat) => (
              <li key={stat.label} className="loom-postcard__stat">
                <span className="loom-postcard__stat-value">{stat.value}</span>
                <span className="loom-postcard__stat-label">{stat.label}</span>
              </li>
            ))}
          </ul>
        )}

        {model.capabilityHint && (
          <p className="loom-postcard__hint">
            <span className="loom-postcard__hint-dot" aria-hidden="true" />
            <span>{model.capabilityHint}</span>
          </p>
        )}

        <p className="loom-postcard__footer">
          <strong>Verified, cited</strong> —{' '}
          {safeDigitalMe ? (
            <a href={safeDigitalMe}>ask my Digital Me anything.</a>
          ) : (
            <span>ask my Digital Me anything.</span>
          )}
        </p>
      </article>

      {isOwnCard ? (
        <div className={styles.actions} aria-label="Card actions">
          <button type="button" className={styles.action} onClick={copyShareLink}>
            {copied ? 'Copied' : 'Copy shareable link'}
          </button>
          <button
            type="button"
            className={`${styles.action} ${styles.actionGhost}`}
            onClick={downloadCard}
          >
            Download card
          </button>
        </div>
      ) : (
        <p className={styles.makeOwn}>
          <a href={safeHref(ONBOARDING_HREF) || ONBOARDING_HREF}>Make your own Loom →</a>
        </p>
      )}
    </div>
  );
}
