import React from 'react';

import {
  VERIFIED_DOSSIER_EXPERIENCE_ENTRIES,
  VERIFIED_DOSSIER_PRESENTATION_CATEGORIES,
  VERIFIED_DOSSIER_TOP_NAV,
  resolveVerifiedDossierArtifact,
  type VerifiedDossierExperienceEntry,
} from '../../lib/new-loom/verified-dossier-home';
import { FileBadge } from '../../components/verified-dossier/FileBadge';

export const metadata = { title: 'Experience · Loom' };

function formatEntryMeta(entry: VerifiedDossierExperienceEntry) {
  return [entry.period, entry.location].filter(Boolean).join(' · ');
}

function ExperienceEntryCard({ entry }: { entry: VerifiedDossierExperienceEntry }) {
  const proofArtifacts = entry.proofArtifactIds.map(resolveVerifiedDossierArtifact);
  const meta = formatEntryMeta(entry);

  return (
    <article aria-label={`${entry.organisation} — ${entry.role}`}>
      <strong>{entry.organisation}</strong>
      <span className="vd-entry-role">{entry.role}</span>
      {meta ? <span className="vd-entry-meta">{meta}</span> : null}
      <span className="vd-entry-summary">{entry.summary}</span>
      {entry.highlights.length ? (
        <span className="vd-entry-highlights">
          {entry.highlights.map((highlight) => (
            <span key={highlight} className="vd-entry-highlight">
              {highlight}
            </span>
          ))}
        </span>
      ) : null}
      {entry.verification === 'pending-documentation' ? (
        <span className="vd-entry-pending">Documentation pending — {entry.verificationNote}</span>
      ) : null}
      {proofArtifacts.map((artifact) => (
        <a key={artifact.id} href={artifact.href}>
          <FileBadge kind={artifact.kind} label={artifact.label} compact />
        </a>
      ))}
    </article>
  );
}

export default function ExperiencePage() {
  const category = VERIFIED_DOSSIER_PRESENTATION_CATEGORIES.find((item) => item.id === 'experience');
  if (!category) throw new Error('Missing Experience category');
  const artifacts = category.artifactIds.map(resolveVerifiedDossierArtifact);

  const workEntries = VERIFIED_DOSSIER_EXPERIENCE_ENTRIES.filter(
    (entry) => entry.category !== 'project',
  );
  const projectEntries = VERIFIED_DOSSIER_EXPERIENCE_ENTRIES.filter(
    (entry) => entry.category === 'project',
  );

  return (
    <main className="vd-section-page" aria-labelledby="experience-title">
      <nav className="vd-section-page__nav" aria-label="Experience navigation">
        <a href="/loom">Loom</a>
        {VERIFIED_DOSSIER_TOP_NAV.map((item) => (
          <a key={item.label} href={item.href} aria-current={item.href === '/experience' ? 'page' : undefined}>
            {item.label}
          </a>
        ))}
      </nav>
      <header className="vd-section-page__hero">
        <p>Experience</p>
        <h1 id="experience-title">Work, trading programs, and project evidence from the CV.</h1>
        <span>{category.summary}</span>
      </header>
      <section className="vd-section-page__list" aria-label="Work and trading-program experience">
        <p className="vd-section-page__band-label">Work &amp; trading programs</p>
        {workEntries.map((entry) => (
          <ExperienceEntryCard key={entry.id} entry={entry} />
        ))}
      </section>
      <section className="vd-section-page__list" aria-label="Project experience">
        <p className="vd-section-page__band-label">Projects</p>
        {projectEntries.map((entry) => (
          <ExperienceEntryCard key={entry.id} entry={entry} />
        ))}
      </section>
      <section className="vd-section-page__artifact-strip" aria-label="Experience evidence">
        <p className="vd-section-page__band-label">Evidence files</p>
        {artifacts.map((artifact) => (
          <a key={artifact.id} href={artifact.href}>
            <FileBadge kind={artifact.kind} label={artifact.label} compact />
          </a>
        ))}
      </section>
    </main>
  );
}
