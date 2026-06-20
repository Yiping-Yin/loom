import React from 'react';
import { LoomGlobalNav } from '../../components/verified-dossier/LoomGlobalNav';
import { type BeginnerProfile } from '../../lib/profile/beginner-profile';

export function WorksProfileView({ profile }: { profile: BeginnerProfile }) {
  const entries = profile.works;

  return (
    <main className="vd-section-page vd-section-page--works" aria-labelledby="works-title">
      <LoomGlobalNav activeHref="/works" ariaLabel="Works navigation" />
      <nav className="home-profile-section-nav" aria-label="Profile sections">
        <a href="/about">About</a>
        <a href="/education">Education</a>
        <a href="/experience">Experience</a>
        <a href="/works" aria-current="page">Works</a>
        <a href="/digital-me">Digital Me</a>
        <a href="/card">Card</a>
      </nav>
      <header className="vd-section-page__hero">
        <div className="vd-section-page__hero-copy">
          <p>Works</p>
          <h1 id="works-title">Works &amp; Projects.</h1>
          <span>{entries.length} {entries.length === 1 ? 'project' : 'projects'} on record.</span>
        </div>
      </header>
      {entries.length === 0 ? (
        <section className="vd-section-page__list" aria-label="Works entries">
          <p className="vd-section-page__band-label">Projects</p>
        </section>
      ) : (
        <section className="vd-section-page__list" aria-label="Works entries">
          <p className="vd-section-page__band-label">Projects</p>
          {entries.map((entry, index) => (
            <article key={index} className="vd-section-page__card" aria-label={entry.title}>
              {entry.link ? (
                <a href={entry.link} className="vd-entry-title-link" rel="noopener noreferrer">
                  <strong>{entry.title}</strong>
                </a>
              ) : (
                <strong>{entry.title}</strong>
              )}
              {entry.role && <span className="vd-entry-role">{entry.role}</span>}
              {entry.date && <span className="vd-entry-meta">{entry.date}</span>}
              {entry.description && <p className="vd-entry-summary">{entry.description}</p>}
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

/**
 * No-profile fallback for /works. The owner's verified dossier has no Works
 * section (unlike Education/Experience, which fall back to rich dossier views),
 * so a direct visit must NOT render the beginner "0 projects on record." shell.
 * Render an explicit empty-state that explains Works belongs to beginner
 * profiles and points back to the dossier surfaces.
 */
export function WorksOwnerEmptyView() {
  return (
    <main className="vd-section-page vd-section-page--works" aria-labelledby="works-title">
      <LoomGlobalNav activeHref="/works" ariaLabel="Works navigation" />
      <header className="vd-section-page__hero">
        <div className="vd-section-page__hero-copy">
          <p>Works</p>
          <h1 id="works-title">No works surface here.</h1>
          <span>
            Works &amp; Projects is part of a personal Loom profile. This verified
            dossier presents its evidence under Education and Experience instead.
          </span>
        </div>
      </header>
      <section className="vd-section-page__list" aria-label="Works navigation">
        <p className="vd-section-page__band-label">Go to</p>
        <nav className="home-profile-section-nav" aria-label="Dossier sections">
          <a href="/experience">Experience &amp; projects</a>
          <a href="/education">Education</a>
          <a href="/">Home</a>
        </nav>
      </section>
    </main>
  );
}
