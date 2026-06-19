'use client';

import { LoomGlobalNav } from '../components/verified-dossier/LoomGlobalNav';
import { type BeginnerProfile } from '../lib/profile/beginner-profile';
import { NEW_LOOM_CAPABILITIES } from '../lib/new-loom/product-shell';
import './HomeClient.module.css';

/**
 * Beginner-profile Home view. Renders a hero from `profile.home` + section nav
 * links, then the NEW_LOOM_CAPABILITIES block (Sources/Draft nav) — exactly
 * what HomeClient renders minus VerifiedDossierHome.
 *
 * A beginner has no verified dossier, so VerifiedDossierHome is intentionally
 * omitted.
 */
export function HomeProfileView({ profile }: { profile: BeginnerProfile }) {
  const { home, about } = profile;
  const displayName = home.name || 'Your name';

  return (
    <>
      <main aria-labelledby="home-profile-title">
        <div className="loom-cosmic-field" aria-hidden="true" />
        <LoomGlobalNav activeHref="/" ariaLabel="Verified dossier navigation" />

        <section className="home-profile-hero">
          <h1 id="home-profile-title">{displayName}</h1>
          {home.headline && <p className="home-profile-headline">{home.headline}</p>}
          {about.summary && (
            <p className="home-profile-summary">{about.summary}</p>
          )}
        </section>

        <nav className="home-profile-section-nav" aria-label="Profile sections">
          <a href="/about">About</a>
          <a href="/education">Education</a>
          <a href="/experience">Experience</a>
        </nav>
      </main>

      <div className="new-loom-home-capabilities">
        {NEW_LOOM_CAPABILITIES.map((capability) => (
          <a
            key={capability.id}
            href={capability.href}
            data-capability={capability.id}
            className="new-loom-home-capabilities__link"
          >
            {capability.label}
          </a>
        ))}
      </div>
    </>
  );
}
