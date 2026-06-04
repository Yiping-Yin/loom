import {
  VERIFIED_DOSSIER_PRESENTATION_CATEGORIES,
  resolveVerifiedDossierArtifact,
} from '../../lib/new-loom/verified-dossier-home';
import { FileBadge } from '../../components/verified-dossier/FileBadge';

export const metadata = { title: 'Experience · Loom' };

export default function ExperiencePage() {
  const category = VERIFIED_DOSSIER_PRESENTATION_CATEGORIES.find((item) => item.id === 'experience');
  if (!category) throw new Error('Missing Experience category');
  const artifacts = category.artifactIds.map(resolveVerifiedDossierArtifact);

  return (
    <main className="vd-section-page" aria-labelledby="experience-title">
      <nav className="vd-section-page__nav" aria-label="Experience navigation">
        <a href="/">Loom</a>
        <a href="/about">About</a>
        <a href="/education">Education</a>
        <a aria-current="page" href="/experience">Experience</a>
        <a href="/digital-me">Digital Me</a>
      </nav>
      <header className="vd-section-page__hero">
        <p>Experience</p>
        <h1 id="experience-title">Projects, work, competitions, and build evidence.</h1>
        <span>{category.summary}</span>
      </header>
      <section className="vd-section-page__list" aria-label="Experience capabilities">
        {category.capabilities.map((capability) => (
          <article key={capability}>
            <strong>{capability}</strong>
            <span>Backed by source records and process artifacts.</span>
          </article>
        ))}
      </section>
      <section className="vd-section-page__artifact-strip" aria-label="Experience evidence">
        {artifacts.map((artifact) => (
          <a key={artifact.id} href={artifact.href}>
            <FileBadge kind={artifact.kind} label={artifact.label} compact />
          </a>
        ))}
      </section>
    </main>
  );
}
