import {
  VERIFIED_DOSSIER_PRESENTATION_CATEGORIES,
  VERIFIED_DOSSIER_SECTIONS,
  VERIFIED_DOSSIER_UNSW_COURSES,
  resolveVerifiedDossierArtifact,
} from '../../lib/new-loom/verified-dossier-home';
import { FileBadge } from '../../components/verified-dossier/FileBadge';
import { InstitutionMark } from '../../components/verified-dossier/InstitutionMark';

export const metadata = { title: 'Education · Loom' };

export default function EducationPage() {
  const category = VERIFIED_DOSSIER_PRESENTATION_CATEGORIES.find((item) => item.id === 'education');
  if (!category) throw new Error('Missing Education category');
  const educationSourceSectionIds = new Set<string>(category.sourceSectionIds);
  const sections = VERIFIED_DOSSIER_SECTIONS.filter((section) => educationSourceSectionIds.has(section.id));
  const artifacts = category.artifactIds.map(resolveVerifiedDossierArtifact);

  return (
    <main className="vd-section-page" aria-labelledby="education-title">
      <nav className="vd-section-page__nav" aria-label="Education navigation">
        <a href="/">Loom</a>
        <a href="/about">About</a>
        <a aria-current="page" href="/education">Education</a>
        <a href="/experience">Experience</a>
        <a href="/digital-me">Digital Me</a>
      </nav>
      <header className="vd-section-page__hero">
        <p>Education</p>
        <h1 id="education-title">Coursework, credentials, and learning evidence.</h1>
        <span>{category.summary}</span>
      </header>
      <section className="vd-section-page__grid" aria-label="Education shelves">
        {sections.map((section) => (
          <a key={section.id} className="vd-section-page__card" href={section.href}>
            <InstitutionMark kind={section.id} />
            <strong>{section.label}</strong>
            <small>{section.summary}</small>
          </a>
        ))}
      </section>
      <section className="vd-section-page__course-strip" aria-label="UNSW course folders">
        {VERIFIED_DOSSIER_UNSW_COURSES.slice(0, 8).map((course) => (
          <a key={course.id} href={course.href}>
            <strong>{course.code}</strong>
            <span>{course.status}</span>
          </a>
        ))}
      </section>
      <section className="vd-section-page__artifact-strip" aria-label="Education evidence">
        {artifacts.map((artifact) => (
          <a key={artifact.id} href={artifact.href}>
            <FileBadge kind={artifact.kind} label={artifact.label} compact />
          </a>
        ))}
      </section>
    </main>
  );
}
