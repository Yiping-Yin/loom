import type { VerifiedDossierArtifact } from '../../lib/new-loom/verified-dossier-home';
import { FileBadge } from './FileBadge';

export type DocumentPreviewCardProps = {
  artifact: VerifiedDossierArtifact;
  index?: number;
};

export function DocumentPreviewCard({ artifact }: DocumentPreviewCardProps) {
  const preview = artifact.preview;
  const lines = preview?.lines ?? [artifact.role, artifact.shelf.toUpperCase(), artifact.label];
  const facts = [
    artifact.pageCount ? `${artifact.pageCount} pages` : null,
    artifact.fileSize ?? null,
    artifact.modifiedAt ? `modified ${artifact.modifiedAt}` : null,
  ].filter(Boolean);

  return (
    <a
      className={`vd-document-card vd-document-card--${artifact.id}`}
      href={artifact.href}
      aria-label={`Open ${artifact.label}`}
    >
      <span
        className={`vd-document-preview vd-document-preview--${artifact.kind} vd-document-preview--${artifact.id}`}
      >
        {artifact.thumbnailSrc ? (
          <img
            className="vd-document-preview__image"
            src={artifact.thumbnailSrc}
            alt={`${artifact.label} first page preview`}
            draggable={false}
          />
        ) : (
          <>
            <span className="vd-document-preview__kicker">{preview?.kicker ?? artifact.role}</span>
            <span className="vd-document-preview__title">{preview?.title ?? artifact.label}</span>
            <span className="vd-document-preview__body">
              {lines.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </span>
          </>
        )}
      </span>
      <span className="vd-document-card__footer">
        <FileBadge kind={artifact.kind} label={artifact.label} compact />
        <span className="vd-document-card__meta">{facts.length > 0 ? facts.join(' - ') : preview?.metadata ?? artifact.role}</span>
        <span className="vd-document-card__path">{artifact.sourcePath ?? preview?.kicker ?? artifact.role}</span>
        <span className="vd-document-card__tag">{artifact.sourceFolder ?? preview?.tag ?? artifact.shelf}</span>
      </span>
    </a>
  );
}

export function ArtifactCitationCard({ artifact, index }: DocumentPreviewCardProps) {
  const preview = artifact.preview;
  const lines = preview?.lines.slice(0, 2) ?? [artifact.role, artifact.label];

  return (
    <a className="vd-citation-card" href={artifact.href} aria-label={`Open cited source ${artifact.label}`}>
      <span className="vd-citation-card__copy">
        {typeof index === 'number' ? <small>{String(index).padStart(2, '0')}</small> : null}
        <FileBadge kind={artifact.kind} label={artifact.label} compact />
        <span>{preview?.metadata ?? artifact.role}</span>
      </span>
      <span
        className={`vd-citation-card__thumb vd-citation-card__thumb--${artifact.kind} vd-citation-card__thumb--${artifact.id}`}
        aria-hidden="true"
      >
        {artifact.thumbnailSrc ? (
          <img src={artifact.thumbnailSrc} alt="" draggable={false} />
        ) : (
          <>
            <span>{preview?.title ?? artifact.kind.toUpperCase()}</span>
            {lines.map((line) => (
              <i key={line}>{line}</i>
            ))}
          </>
        )}
      </span>
    </a>
  );
}
