'use client';

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
import { ProfileGate } from '../profile/ProfileGate';
import { type BeginnerProfile } from '../../lib/profile/beginner-profile';
import styles from './EducationPage.module.css';

const EDUCATION_SHELF_LABELS: Record<string, string> = {
  unsw: 'Course evidence.',
  quantnet: 'QuantNet practice.',
  wqu: 'Finance credentials.',
  claude: 'AI learning proof.',
};

function DossierEducationView() {
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

export function EducationProfileView({ profile }: { profile: BeginnerProfile }) {
  const entries = profile.education;

  return (
    <main className="vd-section-page" aria-labelledby="education-title">
      <LoomGlobalNav activeHref="/education" ariaLabel="Education navigation" />
      <header className="vd-section-page__hero">
        <div className="vd-section-page__hero-copy">
          <p>Education</p>
          <h1 id="education-title">Education.</h1>
          <span>{entries.length} {entries.length === 1 ? 'institution' : 'institutions'} on record.</span>
        </div>
      </header>
      {entries.length === 0 ? (
        <section className="vd-section-page__grid" aria-label="Education entries">
          <p className="vd-section-page__band-label">Institutions</p>
        </section>
      ) : (
        <section className="vd-section-page__grid" aria-label="Education entries">
          <p className="vd-section-page__band-label">Institutions</p>
          {entries.map((entry, index) => (
            <div key={index} className="vd-section-page__card">
              <span
                className="vd-education-profile-initials"
                aria-label={entry.institution}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '2.4rem',
                  height: '2.4rem',
                  borderRadius: '50%',
                  background: 'rgba(75, 197, 222, 0.12)',
                  border: '1px solid rgba(75, 197, 222, 0.28)',
                  color: 'var(--signature-cyan-hi, #8AF7E6)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  lineHeight: 1,
                  letterSpacing: '0.02em',
                  userSelect: 'none',
                }}
              >
                {institutionInitials(entry.institution)}
              </span>
              <strong>{entry.institution}</strong>
              <small>
                {[
                  entry.qualification,
                  entry.field,
                  formatDateRange(entry.start, entry.end),
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </small>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}

export default function EducationPage() {
  return (
    <ProfileGate renderProfile={(profile) => <EducationProfileView profile={profile} />}>
      <DossierEducationView />
    </ProfileGate>
  );
}

function courseTitle(course: (typeof VERIFIED_DOSSIER_UNSW_COURSES)[number]) {
  return (
    [course.moodleTitle, course.handbookYear ? `UNSW Handbook ${course.handbookYear}` : null]
      .filter(Boolean)
      .join(' / ') || course.status
  );
}

function institutionInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((word) => word[0].toUpperCase())
    .join('');
}

function formatDateRange(start?: string, end?: string): string {
  if (!start && !end) return '';
  if (start && end) return `${start}–${end}`;
  if (start) return `${start}–`;
  return `–${end}`;
}
