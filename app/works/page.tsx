'use client';

import React from 'react';
import { LoomGlobalNav } from '../../components/verified-dossier/LoomGlobalNav';
import { ProfileGate } from '../profile/ProfileGate';
import { type BeginnerProfile, emptyBeginnerProfile } from '../../lib/profile/beginner-profile';

export function WorksProfileView({ profile }: { profile: BeginnerProfile }) {
  const entries = profile.works;

  return (
    <main className="vd-section-page vd-section-page--works" aria-labelledby="works-title">
      <LoomGlobalNav activeHref="/works" ariaLabel="Works navigation" />
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

export default function WorksPage() {
  return (
    <ProfileGate renderProfile={(profile) => <WorksProfileView profile={profile} />}>
      <WorksProfileView profile={emptyBeginnerProfile()} />
    </ProfileGate>
  );
}
