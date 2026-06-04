import {
  VERIFIED_DOSSIER_AI_PROMPT,
  VERIFIED_DOSSIER_LOOM_INTRO,
  VERIFIED_DOSSIER_PRESENTATION_CATEGORIES,
  resolveVerifiedDossierArtifact,
} from '../../lib/new-loom/verified-dossier-home';
import { FileBadge } from '../../components/verified-dossier/FileBadge';

export const metadata = { title: 'Digital Me · Loom' };

export default function DigitalMePage() {
  const category = VERIFIED_DOSSIER_PRESENTATION_CATEGORIES.find((item) => item.id === 'digital-me');
  if (!category) throw new Error('Missing Digital Me category');
  const citations = VERIFIED_DOSSIER_AI_PROMPT.citations.map(resolveVerifiedDossierArtifact);

  return (
    <main className="vd-section-page" aria-labelledby="digital-me-title">
      <nav className="vd-section-page__nav" aria-label="Digital Me navigation">
        <a href="/">Loom</a>
        <a href="/about">About</a>
        <a href="/education">Education</a>
        <a href="/experience">Experience</a>
        <a aria-current="page" href="/digital-me">Digital Me</a>
      </nav>
      <header className="vd-section-page__hero">
        <p>Digital Me</p>
        <h1 id="digital-me-title">A grounded digital-person layer, not only an ask box.</h1>
        <span>{category.summary}</span>
      </header>
      <section className="vd-section-page__list" aria-label="Digital Me capabilities">
        {category.capabilities.map((capability) => (
          <article key={capability}>
            <strong>{capability}</strong>
            <span>Uses the same source archive and Draft layer behind the public profile.</span>
          </article>
        ))}
      </section>
      <section className="vd-section-page__answer" aria-labelledby="digital-me-answer-title">
        <h2 id="digital-me-answer-title">{VERIFIED_DOSSIER_AI_PROMPT.question}</h2>
        <p>{VERIFIED_DOSSIER_AI_PROMPT.answer}</p>
        <div>
          {citations.map((artifact) => (
            <a key={artifact.id} href={artifact.href}>
              <FileBadge kind={artifact.kind} label={artifact.label} compact />
            </a>
          ))}
        </div>
      </section>
      <section className="vd-section-page__loom-layer" aria-labelledby="digital-me-loom-title">
        <h2 id="digital-me-loom-title">{VERIFIED_DOSSIER_LOOM_INTRO.title}</h2>
        <ol>
          {VERIFIED_DOSSIER_LOOM_INTRO.steps.map((step) => (
            <li key={step.label}>
              <strong>{step.label}</strong>
              <span>{step.text}</span>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
