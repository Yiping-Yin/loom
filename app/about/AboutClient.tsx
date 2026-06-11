'use client';

import {
  VERIFIED_DOSSIER_HISTORY,
  VERIFIED_DOSSIER_HOME_COPY,
  VERIFIED_DOSSIER_PRESENTATION_CATEGORIES,
  VERIFIED_DOSSIER_PROFILE,
  resolveVerifiedDossierArtifact,
  type VerifiedDossierProfileLink,
} from '../../lib/new-loom/verified-dossier-home';
import { FileBadge } from '../../components/verified-dossier/FileBadge';
import styles from './AboutClient.module.css';

const PROFILE_SOURCES = ['about-doc', 'econ-slides', 'wqu-index', 'quantnet-python-foundations'] as const;

const SURFACE_SUMMARY: Record<string, string> = {
  about: 'CV, identity, and public direction.',
  education: 'Coursework and official learning evidence.',
  experience: 'Work and project proofs.',
  'digital-me': 'Cited answers, canvases, and process links.',
};

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
  return (
      <main className={styles.page} aria-labelledby="about-title">
        <p className={styles.srOnly}>
          Loom is a personal knowledge display platform, readable by people and usable by Digital Me. Backed by sources, it connects UNSW, WQU, QuantNet, and Claude learning evidence into one inspectable profile.
        </p>
        <p className={styles.srOnly}>
          Proof and process are surfaced across home modules; see Product story at /product-history for full narrative.
        </p>
        <p className={styles.srOnly}>
          How Loom serves the archive: it works as a source-bound memory system, so every claim
          stays tied to the material it came from. Read a source, draft from it, and Publish the artifact.
        </p>
        <nav className="vd-nav" aria-label="Verified dossier navigation">
        <a className="vd-wordmark" href="/loom" aria-label="Open Loom product">
          Loom
        </a>
        <div className="vd-nav__links">
          {VERIFIED_DOSSIER_PROFILE &&
            [
              { label: 'Home', href: '/' },
              { label: 'About', href: '/about' },
              { label: 'Education', href: '/education' },
              { label: 'Experience', href: '/experience' },
              { label: 'Digital Me', href: '/digital-me' },
            ].map((item) => (
              <a key={item.label} href={item.href} aria-current={item.href === '/about' ? 'page' : undefined}>
                {item.label}
              </a>
            ))}
        </div>
        <img
          className="vd-nav__avatar"
          src={VERIFIED_DOSSIER_PROFILE.photoSrc}
          alt=""
          aria-hidden="true"
          draggable={false}
        />
      </nav>

      <div className={styles.shell}>
      <section className={styles.hero}>
        <aside className={styles.profileRail} aria-label="Public profile">
          <img className={styles.profilePhoto} src={VERIFIED_DOSSIER_PROFILE.photoSrc} alt="Yiping Yin" draggable={false} />

          <div className={styles.identity}>
            <p className={styles.kicker}>Public profile</p>
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
                <span aria-hidden="true">↗</span>
              </a>
            ))}
          </nav>

          <p className={styles.profileTail}>
            <span className={styles.profileTailDot} aria-hidden="true" />
            Open to quant research and AI collaboration
          </p>
        </aside>

        <section className={styles.resumePanel}>
          <header className={styles.panelHeader}>
            <div>
              <p className={styles.kicker}>About — identity</p>
              <h2>Curriculum Vitae</h2>
            </div>
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
          <p className={styles.statement}>{VERIFIED_DOSSIER_HOME_COPY.shortDefinition}</p>
        </section>

        <aside className={styles.sourceRail} aria-label="Verified sources">
          <p className={styles.kicker}>Evidence</p>
          <h2>Source-backed claims</h2>
          <div className={styles.sourceList}>
            {PROFILE_SOURCES.map((artifactId) => {
              const artifact = resolveVerifiedDossierArtifact(artifactId);
              return (
                <a key={artifact.id} href={artifact.href} className={styles.sourceItem}>
                  <FileBadge kind={artifact.kind} label={artifact.label} compact />
                  <span>{artifact.role}</span>
                </a>
              );
            })}
          </div>
        </aside>
      </section>

      <section className={styles.activitySection} aria-labelledby="surface-title">
        <p className={styles.kicker}>Profile surfaces</p>
        <h2 id="surface-title">Learning and Work</h2>
        <div className={styles.activityGrid}>
          {VERIFIED_DOSSIER_PRESENTATION_CATEGORIES.map((category) => (
            <a key={category.id} href={category.href}>
              <strong>{category.label}</strong>
              <span>{SURFACE_SUMMARY[category.id]}</span>
            </a>
          ))}
        </div>
      </section>

      <section className={styles.historySection} aria-labelledby="history-title">
        <p className={styles.kicker}>History notes</p>
        <h2 id="history-title">Product history anchors</h2>
        <ol className={styles.historyRows}>
          {VERIFIED_DOSSIER_HISTORY.slice(0, 3).map((item) => (
            <li key={item.title}>
              <time>{item.date}</time>
              <strong>{item.title}</strong>
            </li>
          ))}
        </ol>
      </section>
      </div>
    </main>
  );
}
