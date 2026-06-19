import { ArrowUpRight } from 'lucide-react';
import { LoomGlobalNav } from '../../components/verified-dossier/LoomGlobalNav';
import { type BeginnerProfile } from '../../lib/profile/beginner-profile';
import styles from './AboutClient.module.css';

/**
 * Beginner-profile About view. Mirrors the hero shell of AboutClient but
 * renders from a BeginnerProfile rather than the verified dossier constants.
 *
 * Intentionally omits: photo, CV/resume panel, "Source-backed claims" FileBadge
 * artifacts, and the "Profile map" surface grid — a new user has none of those.
 */
export function AboutProfileView({ profile }: { profile: BeginnerProfile }) {
  const { home, about } = profile;
  const displayName = home.name || 'Your name';
  const intro = about.summary || home.headline || '';

  return (
    <main className={styles.page} aria-labelledby="about-title">
      <div className="loom-cosmic-field" aria-hidden="true" />
      <LoomGlobalNav activeHref="/about" ariaLabel="Verified dossier navigation" />
      <nav className="home-profile-section-nav" aria-label="Profile sections">
        <a href="/about" aria-current="page">About</a>
        <a href="/education">Education</a>
        <a href="/experience">Experience</a>
        <a href="/works">Works</a>
      </nav>

      <div className={styles.shell}>
        <section className={styles.hero}>
          <aside className={styles.profileRail} aria-label="Public profile">
            <p className={styles.kicker}>Public profile</p>

            {/* Initials placeholder — beginner has no photo */}
            <div
              aria-hidden="true"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                aspectRatio: '1.06 / 1',
                borderRadius: '5px',
                border: '1px solid var(--line)',
                background: 'rgba(75, 197, 222, 0.06)',
                color: 'var(--signature-cyan-hi, #8AF7E6)',
                fontFamily: 'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, monospace',
                fontSize: 'clamp(2.4rem, 4vw, 3rem)',
                fontWeight: 600,
                letterSpacing: '0.04em',
                userSelect: 'none',
              }}
            >
              {nameInitials(displayName)}
            </div>

            <div className={styles.identity}>
              <h1 id="about-title">{displayName}</h1>
              {home.headline && <strong>{home.headline}</strong>}
              {intro && intro !== home.headline && <p>{intro}</p>}
            </div>

            {about.links.length > 0 && (
              <nav className={styles.profileLinks} aria-label="Profile links" id="profile-links">
                {about.links.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    id={link.label.toLowerCase().replace(/\s+/g, '-')}
                  >
                    <span>{link.label}</span>
                    <ArrowUpRight
                      className={styles.externalLinkIcon}
                      aria-hidden="true"
                      size={13}
                      strokeWidth={1.8}
                    />
                  </a>
                ))}
              </nav>
            )}
          </aside>
        </section>
      </div>
    </main>
  );
}

function nameInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
}
