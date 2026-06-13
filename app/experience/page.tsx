import React from 'react';

import {
  VERIFIED_DOSSIER_EXPERIENCE_ENTRIES,
  VERIFIED_DOSSIER_PRESENTATION_CATEGORIES,
  resolveVerifiedDossierArtifact,
  type VerifiedDossierExperienceEntry,
} from '../../lib/new-loom/verified-dossier-home';
import { FileBadge } from '../../components/verified-dossier/FileBadge';
import { LoomGlobalNav } from '../../components/verified-dossier/LoomGlobalNav';
import styles from './ExperiencePage.module.css';

export const metadata = { title: 'Experience · Loom' };

const EXPERIENCE_ENTRY_LABELS: Record<string, string> = {
  'optiver-unsw-trading-academy': 'Trading academy + QBook.',
  'gumtree-smart-listing-assistant': 'ML pricing guidance.',
  'python-financial-data-portfolio-analytics': 'Python market analytics.',
  'jiangren-lets-go-travel-app': 'Travel app prototype.',
  'unsw-research-assistant': 'Quant finance support.',
};

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
      <span className="vd-entry-summary">{EXPERIENCE_ENTRY_LABELS[entry.id] ?? entry.summary}</span>
      {entry.highlights.length ? (
        <details className="vd-entry-notes">
          <summary>Evidence notes</summary>
          <span className="vd-entry-highlights">
            {entry.highlights.map((highlight) => (
              <span key={highlight} className="vd-entry-highlight">
                {highlight}
              </span>
            ))}
          </span>
        </details>
      ) : null}
      {entry.verification === 'pending-documentation' ? (
        <details className="vd-entry-notes vd-entry-notes--pending">
          <summary>Documentation pending</summary>
          <span className="vd-entry-pending">
            {entry.verificationNote}
          </span>
        </details>
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
    <main className="vd-section-page vd-section-page--experience" aria-labelledby="experience-title">
      <LoomGlobalNav activeHref="/experience" ariaLabel="Experience navigation" />
      <span className={styles.routeCssAnchor} aria-hidden="true" />
      <header className="vd-section-page__hero">
        <div className="vd-section-page__hero-copy">
          <p>Experience</p>
          <h1 id="experience-title">Experience evidence.</h1>
          <span>{category.summary}</span>
        </div>
        <dl className="vd-section-page__hero-proof" aria-label="Experience evidence summary">
          <div>
            <dt>Work</dt>
            <dd>{workEntries.length}</dd>
          </div>
          <div>
            <dt>Projects</dt>
            <dd>{projectEntries.length}</dd>
          </div>
          <div>
            <dt>Files</dt>
            <dd>{artifacts.length}</dd>
          </div>
        </dl>
      </header>
      <section
        className="vd-section-page__list vd-section-page__list--work"
        aria-label="Work and trading-program experience"
      >
        <p className="vd-section-page__band-label">Work / Programs</p>
        {workEntries.map((entry) => (
          <ExperienceEntryCard key={entry.id} entry={entry} />
        ))}
      </section>
      <section
        className="vd-section-page__list vd-section-page__list--projects"
        aria-label="Project experience"
      >
        <p className="vd-section-page__band-label">Projects</p>
        {projectEntries.map((entry) => (
          <ExperienceEntryCard key={entry.id} entry={entry} />
        ))}
      </section>
      <section className="vd-section-page__artifact-strip" aria-label="Experience evidence">
        <p className="vd-section-page__band-label">Evidence</p>
        {artifacts.map((artifact) => (
          <a key={artifact.id} href={artifact.href}>
            <FileBadge kind={artifact.kind} label={artifact.label} compact />
          </a>
        ))}
      </section>
    </main>
  );
}
