import {
  resolveVerifiedDossierArtifact,
  type VerifiedDossierAiPrompt,
} from '../../lib/new-loom/verified-dossier-home';
import type { NewLoomDraftAnswerPreview } from '../../lib/new-loom/draft-answer-preview';
import { draftRecordDetailHref, type NewLoomDraftRecord } from '../../lib/new-loom/draft-records';
import { FileBadge } from './FileBadge';

export function AnswerInspector({
  prompt,
  citationRegistryCount,
  citationRegistryLabels,
  draftAnswerPreview,
  draftRecord,
}: {
  prompt: VerifiedDossierAiPrompt;
  citationRegistryCount: number;
  citationRegistryLabels: readonly string[];
  draftAnswerPreview?: NewLoomDraftAnswerPreview | null;
  draftRecord?: NewLoomDraftRecord | null;
}) {
  const question = draftAnswerPreview?.question ?? draftRecord?.title ?? prompt.question;
  const answer = draftAnswerPreview?.answer ?? draftRecord?.answer ?? prompt.answer;
  const citedArtifacts = prompt.citations.map(resolveVerifiedDossierArtifact);
  const draftSources = draftAnswerPreview
    ? draftAnswerPreview.sourceLabels.map((label, index) => ({
        label,
        href: draftAnswerPreview.sourceHrefs[index] ?? '#',
      }))
    : draftRecord
      ? draftRecord.sourceLabels.map((label, index) => ({
          label,
          href: draftRecord.sourceHrefs[index] ?? '#',
        }))
    : [];
  const hasDraftContext = Boolean(draftAnswerPreview || draftRecord);
  const statusLabel = draftRecord ? 'Studio saved' : draftAnswerPreview ? 'Studio preview' : 'Grounded';
  const sourceCount = hasDraftContext ? draftSources.length : citedArtifacts.length;
  const sourceCountLabel = `${sourceCount} ${sourceCount === 1 ? 'source' : 'sources'}`;

  return (
    <section className="vd-answer-inspector vd-answer-inspector--proof" aria-labelledby="cited-answer-title">
      <div className="vd-answer-inspector__header">
        <h2 id="cited-answer-title">Cited answer</h2>
        <span>{statusLabel}</span>
      </div>
      <article className="vd-answer-snapshot" aria-label="Grounded cited answer">
        <small>{hasDraftContext ? 'Latest Studio' : 'UNSW'}</small>
        <strong>{question}</strong>
        <p>{answer}</p>
      </article>
      {draftRecord ? (
        <a className="vd-draft-record-link" href={draftRecordDetailHref(draftRecord)}>
          <span>Studio record</span>
          <strong>{draftRecord.title}</strong>
          <small>{formatDraftRecordStatus(draftRecord.status)}</small>
        </a>
      ) : null}
      <div className="vd-grounding-strip vd-grounding-strip--compact" aria-label="Grounding status">
        <span>
          <strong>{sourceCountLabel}</strong>
          <small>{hasDraftContext ? 'Studio sources' : 'Cited PDFs'}</small>
        </span>
        <span>
          <strong>{citationRegistryCount}</strong>
          <small>Registry</small>
        </span>
      </div>
      {hasDraftContext ? (
        <>
          <h3 className="vd-citation-heading">Sources</h3>
          <div className="vd-draft-answer-sources vd-draft-answer-sources--compact" aria-label="Studio sources">
            {draftSources.length > 0 ? (
              draftSources.slice(0, 2).map((source) => (
                <a key={`${source.href}:${source.label}`} className="vd-draft-answer-source" href={source.href}>
                  <span>{source.label}</span>
                  <small>{source.href}</small>
                </a>
              ))
            ) : (
              <p>No Studio sources published.</p>
            )}
            {draftSources.length > 2 ? (
              <span className="vd-citation-row__more">+{draftSources.length - 2} sources</span>
            ) : null}
          </div>
        </>
      ) : (
        <>
          <h3 className="vd-citation-heading">Sources</h3>
          <div className="vd-citation-list vd-citation-list--compact vd-citation-list--asset" aria-label="Cited artifacts">
            {citedArtifacts.slice(0, 2).map((artifact) => (
              <a key={artifact.id} className="vd-citation-row" href={artifact.href}>
                <span className="vd-citation-row__thumb" aria-hidden="true">
                  {artifact.thumbnailSrc ? <img src={artifact.thumbnailSrc} alt="" draggable={false} /> : null}
                </span>
                <span className="vd-citation-row__body">
                  <FileBadge kind={artifact.kind} label={artifact.label} compact />
                </span>
              </a>
            ))}
            {citedArtifacts.length > 2 ? (
              <span className="vd-citation-row__more">+{citedArtifacts.length - 2} source</span>
            ) : null}
          </div>
        </>
      )}
      <div className="vd-citation-registry" aria-label="Reference citation registry">
        <span>Citation registry</span>
        <strong>{citationRegistryCount} registry sources available</strong>
        <small>
          {citationRegistryLabels.length > 0
            ? citationRegistryLabels.join(' / ')
            : 'Waiting for registry'}
        </small>
      </div>
    </section>
  );
}

function formatDraftRecordStatus(status: NewLoomDraftRecord['status']) {
  if (status === 'previewed') return 'Previewed';
  if (status === 'published') return 'Published';
  return 'In progress';
}
