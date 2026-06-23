import React from 'react';
import { LoomGlobalNav } from '../components/verified-dossier/LoomGlobalNav';

/**
 * Neutral empty state for a default identity route (/about, /education,
 * /experience, /digital-me) when no localStorage beginner profile is present.
 *
 * F2 step 2: a no-profile STRANGER must NOT see the owner's dossier. This
 * mirrors the WorksOwnerEmptyView model — an explicit "this is your <section>
 * page; build your Loom to fill it" state — with two CTAs: build your own Loom,
 * or see a finished example. The owner Dossier*View / DigitalMeRoleOSClient is
 * no longer rendered on these default routes; it lives only at /example*.
 */
export function IdentityEmptyState({
  section,
  activeHref,
  titleId,
  exampleHref = '/example',
}: {
  /** Section label, e.g. "About" / "Education" / "Experience" / "Digital Me". */
  section: string;
  /** Nav href to mark active, e.g. "/about". */
  activeHref: string;
  /** id for the page <h1>, matched by the route's aria-labelledby. */
  titleId: string;
  /** Where "See an example" points (showcase route for this section). */
  exampleHref?: string;
}) {
  return (
    <main className="vd-section-page" aria-labelledby={titleId}>
      <LoomGlobalNav activeHref={activeHref} ariaLabel={`${section} navigation`} />
      <header className="vd-section-page__hero">
        <div className="vd-section-page__hero-copy">
          <p>{section}</p>
          <h1 id={titleId}>This is your {section} page.</h1>
          <span>
            Build your LOOM to fill it with your own evidence — or see a finished
            example first.
          </span>
        </div>
      </header>
      <section className="vd-section-page__list" aria-label={`Get started with ${section}`}>
        <p className="vd-section-page__band-label">Get started</p>
        <nav className="home-profile-section-nav" aria-label="Get started">
          <a href="/onboarding/profile">Build your LOOM →</a>
          <a href={exampleHref}>See an example →</a>
        </nav>
        {/* Discreet owner entry: the macOS app has no address bar, so this is the
            only way to reach the URL-only /me loader from inside the app. Muted so
            it reads as a utility, not a stranger-facing CTA. */}
        <p style={{ marginTop: 'var(--space-5)', fontSize: '0.8rem' }}>
          <a href="/me" style={{ color: 'var(--muted)' }}>
            Owner? Load your profile →
          </a>
        </p>
        <p style={{ marginTop: 'var(--space-3)', fontSize: '0.8rem' }}>
          <a href="/account" style={{ color: 'var(--muted)' }}>
            Sign in to sync →
          </a>
        </p>
      </section>
    </main>
  );
}
