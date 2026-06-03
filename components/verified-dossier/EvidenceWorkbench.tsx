import {
  resolveVerifiedDossierArtifact,
  type VerifiedDossierArtifactId,
  type VerifiedDossierGraphEdge,
  type VerifiedDossierGraphNode,
  type VerifiedDossierSection,
  type VerifiedDossierWorkbenchStep,
} from '../../lib/new-loom/verified-dossier-home';
import { DocumentPreviewCard } from './DocumentPreviewCard';
import { FileBadge } from './FileBadge';
import { InstitutionMark } from './InstitutionMark';

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12h13M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StepArrow() {
  return (
    <svg width="31" height="20" viewBox="0 0 31 20" fill="none" aria-hidden="true">
      <path d="M1 10h25M20 4l6 6-6 6" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
    </svg>
  );
}

export function ActiveEvidenceStory({
  section,
  artifactIds,
}: {
  section: VerifiedDossierSection;
  artifactIds: readonly VerifiedDossierArtifactId[];
}) {
  const artifacts = artifactIds.map(resolveVerifiedDossierArtifact);
  const featuredArtifacts = artifacts.slice(0, 2);
  const supportArtifacts = artifacts.slice(2);

  return (
    <article className="vd-active-story" aria-labelledby="active-evidence-story-title">
      <div className="vd-active-story__header">
        <InstitutionMark kind={section.id} />
        <div className="vd-active-story__title">
          <small>Active evidence story</small>
          <h2 id="active-evidence-story-title">{section.label}</h2>
        </div>
        <strong>{artifacts.length} files</strong>
      </div>
      <div className="vd-active-story__featured">
        {featuredArtifacts.map((artifact) => (
          <DocumentPreviewCard key={artifact.id} artifact={artifact} />
        ))}
      </div>
      <div className="vd-active-story__support">
        {supportArtifacts.map((artifact) => (
          <a key={artifact.id} className="vd-active-story__support-row" href={artifact.href}>
            <FileBadge kind={artifact.kind} label={artifact.label} compact />
            <span>{artifact.role}</span>
          </a>
        ))}
      </div>
      <a className="vd-active-story__link" href={section.href}>
        Open source shelf <ArrowIcon />
      </a>
    </article>
  );
}

export function SourceGraph({
  graph,
}: {
  graph: {
    nodes: readonly VerifiedDossierGraphNode[];
    edges: readonly VerifiedDossierGraphEdge[];
  };
}) {
  const nodeLabels = new Map(graph.nodes.map((node) => [node.id, node.label]));

  return (
    <section className="vd-source-graph" aria-label="Source relationship graph">
      <div className="vd-source-graph__header">
        <span>Source graph</span>
        <strong>{graph.nodes.length} nodes</strong>
      </div>
      <div className="vd-source-graph__canvas">
        {graph.nodes.map((node) => (
          <article key={node.id} className={`vd-source-graph__node vd-source-graph__node--${node.kind}`}>
            <small>{node.eyebrow}</small>
            <strong>{node.label}</strong>
          </article>
        ))}
      </div>
      <div className="vd-source-graph__edges">
        {graph.edges.map((edge) => {
          const fromLabel = nodeLabels.get(edge.from) ?? edge.from;
          const toLabel = nodeLabels.get(edge.to) ?? edge.to;

          return (
            <span key={`${edge.from}-${edge.to}`} aria-label={`${fromLabel} to ${toLabel}: ${edge.label}`}>
              {edge.label}
            </span>
          );
        })}
      </div>
    </section>
  );
}

export function ProvenanceChain({ steps }: { steps: readonly VerifiedDossierWorkbenchStep[] }) {
  return (
    <section className="vd-provenance-section" aria-labelledby="provenance-title">
      <h2 id="provenance-title">Sources <span>→</span> Draft <span>→</span> Answer</h2>
      <div className="vd-provenance-chain" aria-label="Sources to Draft to Answer chain">
        {steps.map((step, index) => (
          <div key={step.number} className="vd-provenance-chain__item">
            <article className="vd-provenance-step">
              <span className="vd-step-number">{step.number}</span>
              <h3>{step.title}</h3>
              <strong>{step.summary}</strong>
              <p>{step.detail}</p>
            </article>
            {index < steps.length - 1 ? <StepArrow /> : null}
          </div>
        ))}
      </div>
    </section>
  );
}

export function SourceIndex({ sections }: { sections: readonly VerifiedDossierSection[] }) {
  return (
    <section className="vd-source-index" aria-labelledby="source-index-title">
      <h2 id="source-index-title">Source index</h2>
      <div className="vd-source-index__grid">
        {sections.map((section) => {
          const sectionArtifacts = section.artifactIds.map(resolveVerifiedDossierArtifact);

          return (
            <a key={section.id} className="vd-source-index__card" href={section.href}>
              <InstitutionMark kind={section.id} />
              <span>
                <strong>{section.label}</strong>
                <small>{section.status}</small>
              </span>
              <span className="vd-source-index__files">
                {sectionArtifacts.map((artifact) => (
                  <FileBadge key={artifact.id} kind={artifact.kind} label={artifact.label} compact />
                ))}
              </span>
              <ArrowIcon />
            </a>
          );
        })}
      </div>
    </section>
  );
}
