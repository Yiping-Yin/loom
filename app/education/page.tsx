import React from 'react';

import {
  VERIFIED_DOSSIER_PRESENTATION_CATEGORIES,
  VERIFIED_DOSSIER_SECTIONS,
  VERIFIED_DOSSIER_UNSW_COURSES,
  formatVerifiedDossierCourseMeta,
  resolveVerifiedDossierArtifact,
} from '../../lib/new-loom/verified-dossier-home';
import { FileBadge } from '../../components/verified-dossier/FileBadge';
import { InstitutionMark } from '../../components/verified-dossier/InstitutionMark';
import { LoomGlobalNav } from '../../components/verified-dossier/LoomGlobalNav';
import styles from './EducationPage.module.css';

export const metadata = { title: 'Education · Loom' };

const EDUCATION_SHELF_LABELS: Record<string, string> = {
  unsw: 'Course evidence.',
  quantnet: 'QuantNet practice.',
  wqu: 'Finance credentials.',
  claude: 'AI learning proof.',
};

export default function EducationPage() {
  const category = VERIFIED_DOSSIER_PRESENTATION_CATEGORIES.find((item) => item.id === 'education');
  if (!category) throw new Error('Missing Education category');
  const educationSourceSectionIds = new Set<string>(category.sourceSectionIds);
  const sections = VERIFIED_DOSSIER_SECTIONS.filter((section) =>
    educationSourceSectionIds.has(section.id),
  );
  const artifacts = category.artifactIds.map(resolveVerifiedDossierArtifact);

  return (
    <main className="vd-section-page" aria-labelledby="education-title">
      <LoomGlobalNav activeHref="/education" ariaLabel="Education navigation" />
      <span className={styles.routeCssAnchor} aria-hidden="true" />
      <header className="vd-section-page__hero">
        <div className="vd-section-page__hero-copy">
          <p>Education</p>
          <h1 id="education-title">Education evidence.</h1>
          <span>{category.summary}</span>
        </div>
        <dl className="vd-section-page__hero-proof" aria-label="Education evidence summary">
          <div>
            <dt>Source shelves</dt>
            <dd>{sections.length}</dd>
          </div>
          <div>
            <dt>Visible courses</dt>
            <dd>{VERIFIED_DOSSIER_UNSW_COURSES.slice(0, 8).length}</dd>
          </div>
          <div>
            <dt>Evidence files</dt>
            <dd>{artifacts.length}</dd>
          </div>
        </dl>
      </header>
      <section className="vd-section-page__grid" aria-label="Education shelves">
        <p className="vd-section-page__band-label">Institutions</p>
        {sections.map((section) => (
          <a key={section.id} className="vd-section-page__card" href={section.href}>
            <InstitutionMark kind={section.id} />
            <strong>{section.label}</strong>
            <small>{EDUCATION_SHELF_LABELS[section.id] ?? section.summary}</small>
          </a>
        ))}
      </section>
      <section className="vd-section-page__course-strip" aria-label="UNSW course folders">
        <p className="vd-section-page__band-label">UNSW courses</p>
        {VERIFIED_DOSSIER_UNSW_COURSES.slice(0, 8).map((course) => (
          <a key={course.id} href={course.href} title={courseTitle(course)}>
            <strong>{course.code}</strong>
            <span>{formatVerifiedDossierCourseMeta(course) || course.status}</span>
          </a>
        ))}
      </section>
      <section className="vd-section-page__artifact-strip" aria-label="Education evidence">
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

function courseTitle(course: (typeof VERIFIED_DOSSIER_UNSW_COURSES)[number]) {
  return (
    [course.moodleTitle, course.handbookYear ? `UNSW Handbook ${course.handbookYear}` : null]
      .filter(Boolean)
      .join(' / ') || course.status
  );
}
