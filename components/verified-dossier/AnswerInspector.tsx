import {
  resolveVerifiedDossierArtifact,
  type VerifiedDossierAiPrompt,
} from '../../lib/new-loom/verified-dossier-home';
import { ArtifactCitationCard } from './DocumentPreviewCard';

export function AnswerInspector({
  prompt,
  citationRegistryCount,
  citationRegistryLabels,
}: {
  prompt: VerifiedDossierAiPrompt;
  citationRegistryCount: number;
  citationRegistryLabels: readonly string[];
}) {
  return (
    <section className="vd-answer-inspector" aria-labelledby="answer-inspector-title">
      <div className="vd-answer-inspector__header">
        <h2 id="answer-inspector-title">Answer inspector</h2>
        <span>Grounded</span>
      </div>
      <div className="vd-question-card">
        <strong>{prompt.question}</strong>
      </div>
      <div className="vd-answer-block">
        <h3>Answer</h3>
        <p>{prompt.answer}</p>
      </div>
      <h3 className="vd-citation-heading">Cited sources</h3>
      <div className="vd-citation-list" aria-label="Cited artifacts">
        {prompt.citations.map((artifactId) => {
          const artifact = resolveVerifiedDossierArtifact(artifactId);
          return <ArtifactCitationCard key={artifact.id} artifact={artifact} />;
        })}
      </div>
      <div className="vd-citation-registry" aria-label="Reference citation registry">
        <span>Citation registry</span>
        <strong>{citationRegistryCount} registry sources available</strong>
        <small>
          {citationRegistryLabels.length > 0
            ? citationRegistryLabels.join(' / ')
            : 'Waiting for registry'}
        </small>
      </div>
      <div className="vd-followup vd-followup--readonly" aria-label="Homepage answer inspector status">
        <span>Citation preview is read-only on the homepage.</span>
      </div>
    </section>
  );
}
