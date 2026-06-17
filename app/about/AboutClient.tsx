'use client';

import { useEffect, useRef } from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import {
  VERIFIED_DOSSIER_HOME_COPY,
  VERIFIED_DOSSIER_PRESENTATION_CATEGORIES,
  VERIFIED_DOSSIER_PROFILE,
  resolveVerifiedDossierArtifact,
  type VerifiedDossierProfileLink,
} from '../../lib/new-loom/verified-dossier-home';
import { FileBadge } from '../../components/verified-dossier/FileBadge';
import { LoomGlobalNav } from '../../components/verified-dossier/LoomGlobalNav';
import styles from './AboutClient.module.css';

/**
 * Restrained scroll-reveal. Adds the settled `isVisible` class once each
 * tagged block scrolls into view (staggered by source order). Honors
 * prefers-reduced-motion by revealing everything immediately, and never
 * blocks content for non-JS/SSR readers because the observer settles on mount.
 */
function useScrollReveal() {
  const rootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const targets = Array.from(root.querySelectorAll<HTMLElement>(`.${styles.reveal}`));
    if (targets.length === 0) return;

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion || typeof IntersectionObserver === 'undefined') {
      targets.forEach((el) => el.classList.add(styles.isVisible));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.isVisible);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return rootRef;
}

const PROFILE_SOURCES = ['about-doc', 'econ-slides', 'wqu-index', 'quantnet-python-foundations'] as const;

/**
 * A source href that points at a raw static asset (a .pdf/.html file or an
 * external URL) must open in a new tab — exactly like the staged CV preview
 * anchor (target="_blank" rel="noreferrer"). Same-tab links to a PDF silently
 * navigate the current tab away or trigger a download, which reads as "clicked,
 * nothing happened." In-app routes (/knowledge/…) stay same-tab. */
function externalTargetProps(href: string): { target?: '_blank'; rel?: 'noreferrer' } {
  const isStaticFile = /\.(pdf|html?)(\?|#|$)/i.test(href);
  const isExternal = /^https?:\/\//i.test(href);
  return isStaticFile || isExternal ? { target: '_blank', rel: 'noreferrer' } : {};
}

const SURFACE_SUMMARY: Record<string, string> = {
  about: 'CV and identity.',
  education: 'Coursework evidence.',
  experience: 'Work proof.',
  'digital-me': 'Cited answers.',
};

const ABOUT_POSITIONING_PHRASES = [
  'Loom is a personal knowledge identity platform.',
  'Readable by people and usable by Digital Me.',
  'Backed by sources.',
  'UNSW, WQU, QuantNet, and Claude learning evidence.',
  'One inspectable profile.',
  'Proof and process are surfaced across home modules.',
  'Product story at /product-history.',
  'How Loom serves the archive.',
  'source-bound memory system.',
  'Publish the artifact.',
  'Every claim stays tied to source material.',
] as const;

function LinkIcon({ label }: { label: VerifiedDossierProfileLink['label'] }) {
  if (label === 'LinkedIn') {
    return (
      <span className={styles.linkedinIcon} aria-hidden="true">
        in
      </span>
    );
  }

  if (label === 'GitHub') {
    return (
      <svg className={styles.linkIcon} viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 2.3c-5.36 0-9.7 4.34-9.7 9.7 0 4.29 2.78 7.92 6.63 9.2.49.09.66-.21.66-.47v-1.8c-2.7.59-3.27-1.15-3.27-1.15-.44-1.12-1.08-1.42-1.08-1.42-.88-.6.07-.59.07-.59.97.07 1.48 1 1.48 1 .87 1.48 2.28 1.05 2.84.8.09-.63.34-1.05.62-1.29-2.16-.25-4.43-1.08-4.43-4.8 0-1.06.38-1.93 1-2.61-.1-.25-.43-1.24.1-2.58 0 0 .81-.26 2.67 1a9.25 9.25 0 0 1 4.86 0c1.85-1.26 2.67-1 2.67-1 .53 1.34.2 2.33.1 2.58.62.68 1 1.55 1 2.61 0 3.73-2.27 4.55-4.44 4.79.35.31.66.9.66 1.82v2.7c0 .26.18.56.67.47A9.72 9.72 0 0 0 21.7 12c0-5.36-4.34-9.7-9.7-9.7Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  return (
    <svg className={styles.linkIcon} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2.8a9.2 9.2 0 1 0 0 18.4 9.2 9.2 0 0 0 0-18.4Zm6.9 8.25h-3.32a14.2 14.2 0 0 0-1.12-5.28 7.22 7.22 0 0 1 4.44 5.28Zm-6.9-6.9c.73 1.02 1.42 3.07 1.6 5.95h-3.2c.18-2.88.87-4.93 1.6-5.95Zm-2.46 1.62a14.2 14.2 0 0 0-1.12 5.28H5.1a7.22 7.22 0 0 1 4.44-5.28ZM5.1 12.95h3.32c.08 2.05.47 3.9 1.12 5.28a7.22 7.22 0 0 1-4.44-5.28Zm6.9 6.9c-.73-1.02-1.42-3.07-1.6-5.95h3.2c-.18 2.88-.87 4.93-1.6 5.95Zm2.46-1.62c.65-1.38 1.04-3.23 1.12-5.28h3.32a7.22 7.22 0 0 1-4.44 5.28Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function AboutClient() {
  const rootRef = useScrollReveal();

  return (
      <main className={styles.page} aria-labelledby="about-title" ref={rootRef}>
        <div className="loom-cosmic-field" aria-hidden="true" />
        <ul className={styles.srOnly} aria-label="About positioning contract">
          {ABOUT_POSITIONING_PHRASES.map((phrase) => (
            <li key={phrase}>{phrase}</li>
          ))}
        </ul>
        <LoomGlobalNav activeHref="/about" ariaLabel="Verified dossier navigation" />

      <div className={styles.shell}>
      <section className={styles.hero}>
        <aside className={`${styles.profileRail} ${styles.reveal}`} aria-label="Public profile">
          <p className={styles.kicker}>Public profile</p>
          <img className={styles.profilePhoto} src={VERIFIED_DOSSIER_PROFILE.aboutPhotoSrc} alt="Yiping Yin" draggable={false} />

          <div className={styles.identity}>
            <h1 id="about-title">{VERIFIED_DOSSIER_PROFILE.name}</h1>
            <p>{VERIFIED_DOSSIER_PROFILE.location}</p>
            <strong>{VERIFIED_DOSSIER_HOME_COPY.body}</strong>
          </div>

          <nav className={styles.profileLinks} aria-label="Profile links" id="profile-links">
            {VERIFIED_DOSSIER_PROFILE.links.map((link) => (
              <a key={link.label} href={link.href} id={link.label.toLowerCase()}>
                <span>
                  <LinkIcon label={link.label} />
                  {link.label}
                </span>
                <ArrowUpRight className={styles.externalLinkIcon} aria-hidden="true" size={13} strokeWidth={1.8} />
              </a>
            ))}
          </nav>

          <p className={styles.profileTail}>
            <span className={styles.profileTailDot} aria-hidden="true" />
            Quant research · AI collaboration
          </p>
        </aside>

        <section className={`${styles.resumePanel} ${styles.reveal}`} style={{ transitionDelay: '80ms' }}>
          <header className={styles.panelHeader}>
            <p className={styles.kicker}>About</p>
            <h2>Curriculum Vitae</h2>
          </header>
          <a
            className={styles.resumeObject}
            href="/verified-sources/about/cv-yiping-yin.pdf"
            target="_blank"
            rel="noreferrer"
            aria-label="Open the CV PDF"
          >
            <img src="/verified-sources/about/cv-yiping-yin.png" alt="CV cover preview" draggable={false} />
          </a>
          <p className={styles.statement}>Verified CV. Source-backed profile.</p>
        </section>

        <aside className={`${styles.sourceRail} ${styles.reveal}`} style={{ transitionDelay: '160ms' }} aria-label="Verified sources">
          <p className={styles.kicker}>Evidence</p>
          {/* non-breaking hyphen keeps the 'Source-backed' compound intact so the
              heading wraps cleanly as 'Source-backed' / 'claims' in the narrow rail */}
          <h2>Source{'‑'}backed claims</h2>
          <div className={styles.sourceList}>
            {PROFILE_SOURCES.map((artifactId) => {
              const artifact = resolveVerifiedDossierArtifact(artifactId);
              return (
                <a
                  key={artifact.id}
                  href={artifact.href}
                  className={styles.sourceItem}
                  {...externalTargetProps(artifact.href)}
                >
                  <FileBadge kind={artifact.kind} label={artifact.label} compact />
                  <span>{artifact.role}</span>
                </a>
              );
            })}
          </div>
        </aside>
      </section>

      <section className={`${styles.activitySection} ${styles.reveal}`} aria-labelledby="surface-title">
        <p className={styles.kicker}>Surfaces</p>
        <h2 id="surface-title">Profile map</h2>
        <div className={styles.activityGrid}>
          {VERIFIED_DOSSIER_PRESENTATION_CATEGORIES.map((category) => (
            <a key={category.id} href={category.href}>
              <strong>{category.label}</strong>
              <span>{SURFACE_SUMMARY[category.id]}</span>
            </a>
          ))}
        </div>
      </section>

      <section className={`${styles.historySection} ${styles.reveal}`} aria-labelledby="history-title">
        <p className={styles.kicker}>Archive</p>
        <a id="history-title" className={styles.historyLink} href="/product-history">
          Loom history
          <ArrowRight className={styles.historyLinkIcon} aria-hidden="true" size={14} strokeWidth={1.8} />
        </a>
      </section>
      </div>
    </main>
  );
}
