import {
  formatVerifiedDossierCourseFileCount,
  resolveVerifiedDossierArtifact,
  type VerifiedDossierArtifactId,
  type VerifiedDossierCourseFolder,
  type VerifiedDossierGraphEdge,
  type VerifiedDossierGraphNode,
  type VerifiedDossierSection,
  type VerifiedDossierWorkbenchStep,
} from '../../lib/new-loom/verified-dossier-home';
import { buildDraftUrlFromArtifacts } from '../../lib/new-loom/source-to-draft';
import { draftRecordDetailHref, type NewLoomDraftRecord } from '../../lib/new-loom/draft-records';
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
  courseFolders = [],
  draftRecords = [],
}: {
  section: VerifiedDossierSection;
  artifactIds: readonly VerifiedDossierArtifactId[];
  courseFolders?: readonly VerifiedDossierCourseFolder[];
  draftRecords?: readonly NewLoomDraftRecord[];
}) {
  const artifacts = artifactIds.map(resolveVerifiedDossierArtifact);
  const sampleArtifacts = artifacts.slice(0, 3);
  const visibleCourseFolders = courseFolders.slice(0, 6);
  const draftUrl = buildDraftUrlFromArtifacts(artifacts, { type: 'ai-answer' });
  const artifactHrefs = new Set(artifacts.map((artifact) => artifact.href));
  const linkedDraftRecords = draftRecords.filter((record) =>
    record.sourceHrefs.some((href) => artifactHrefs.has(href) || href.startsWith(section.href)),
  );

  return (
    <article className="vd-active-story vd-active-story--shelf" aria-labelledby="active-evidence-story-title">
      <div className="vd-active-story__header">
        <InstitutionMark kind={section.id} />
        <div className="vd-active-story__title">
          <small>Active source shelf</small>
          <h2 id="active-evidence-story-title">{section.label}</h2>
        </div>
        <strong>{courseFolders.length} courses</strong>
      </div>
      <div className="vd-active-story__actions">
        <a className="vd-active-story__link vd-active-story__draft-link" href={draftUrl}>
          Studio with sources <ArrowIcon />
        </a>
        <a className="vd-active-story__link" href={section.href}>
          Open source shelf <ArrowIcon />
        </a>
      </div>

      <div className="vd-active-story__shelf-panel">
        <div className="vd-course-folder-grid" aria-label="UNSW course folders">
          {visibleCourseFolders.map((course) => (
            <a key={course.id} className="vd-course-folder-card" href={course.href}>
              <span className="vd-course-folder-card__icon" aria-hidden="true" />
              <span>
                <strong>{course.code}</strong>
                <small>{formatVerifiedDossierCourseFileCount(course.fileCount)}</small>
              </span>
              <em>{course.status}</em>
            </a>
          ))}
        </div>

        <div className="vd-active-story__sample-strip" aria-label="Sample UNSW source files">
          {sampleArtifacts.map((artifact) => (
            <a key={artifact.id} className="vd-active-story__sample-chip" href={artifact.href}>
              <FileBadge kind={artifact.kind} label={artifact.label} compact />
            </a>
          ))}
        </div>

        {linkedDraftRecords.length > 0 ? (
          <div className="vd-active-story__draft-records" aria-label="Studio records">
            <h3>Studio records</h3>
            <div>
              {linkedDraftRecords.map((record) => (
                <a key={record.id} href={draftRecordDetailHref(record)}>
                  <span>{record.title}</span>
                  <small>{formatDraftRecordStatus(record.status)}</small>
                  <ArrowIcon />
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function formatDraftRecordStatus(status: NewLoomDraftRecord['status']) {
  if (status === 'previewed') return 'Previewed';
  if (status === 'published') return 'Published';
  return 'In progress';
}

export function SourceGraph({
  graph,
}: {
  graph: {
    nodes: readonly VerifiedDossierGraphNode[];
    edges: readonly VerifiedDossierGraphEdge[];
  };
}) {
  return (
    <section className="vd-source-graph vd-source-graph--proof" aria-label="Cited answer evidence">
      <div className="vd-source-graph__header">
        <span>Cited output</span>
      </div>
      <ul className="vd-source-graph__canvas" aria-label="Citation proof assets">
        {graph.nodes.map((node) => (
          <SourceGraphNode key={node.id} node={node} />
        ))}
      </ul>
    </section>
  );
}

function SourceGraphNode({ node }: { node: VerifiedDossierGraphNode }) {
  const artifact = node.artifactId ? resolveVerifiedDossierArtifact(node.artifactId) : null;

  return (
    <li
      className={`vd-source-graph__node vd-source-graph__node--${node.kind}`}
      aria-label={node.label}
    >
      <span className="vd-source-graph__asset" aria-hidden="true">
        {artifact?.thumbnailSrc ? (
          <img src={artifact.thumbnailSrc} alt="" draggable={false} />
        ) : (
          <span>{node.kind === 'draft' ? 'MD' : 'AI'}</span>
        )}
      </span>
      <span className="vd-source-graph__copy">
        <strong>{node.label}</strong>
      </span>
    </li>
  );
}

export function ProvenanceChain({ steps }: { steps: readonly VerifiedDossierWorkbenchStep[] }) {
  return (
    <section className="vd-provenance-section vd-provenance-section--rail" aria-labelledby="provenance-title">
      <h2 id="provenance-title">Sources <span>→</span> Studio <span>→</span> Digital Me</h2>
      <ol className="vd-provenance-chain" aria-label="Sources to Studio to Digital Me chain">
        {steps.map((step, index) => (
          <li key={step.number} className="vd-provenance-chain__item">
            <article className="vd-provenance-step" aria-label={`${step.title}: ${step.summary}. ${step.detail}`}>
              <span className="vd-step-number">{step.number}</span>
              <h3>{step.title}</h3>
              <strong>{step.summary}</strong>
            </article>
            {index < steps.length - 1 ? <StepArrow /> : null}
          </li>
        ))}
      </ol>
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
