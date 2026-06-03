import type { VerifiedDossierArtifact } from '../../lib/new-loom/verified-dossier-home';
import { FileBadge } from './FileBadge';

export type DocumentPreviewCardProps = {
  artifact: VerifiedDossierArtifact;
};

export function DocumentPreviewCard({ artifact }: DocumentPreviewCardProps) {
  const preview = artifact.preview;
  const lines = preview?.lines ?? [artifact.role, artifact.shelf.toUpperCase(), artifact.label];

  return (
    <a className="vd-document-card" href={artifact.href} aria-label={`Open ${artifact.label}`}>
      <span className={`vd-document-preview vd-document-preview--${artifact.kind}`} aria-hidden="true">
        <span className="vd-document-preview__kicker">{preview?.kicker ?? artifact.role}</span>
        <span className="vd-document-preview__title">{preview?.title ?? artifact.label}</span>
        <span className="vd-document-preview__body">
          {lines.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </span>
      </span>
      <span className="vd-document-card__footer">
        <FileBadge kind={artifact.kind} label={artifact.label} compact />
        <span className="vd-document-card__meta">{preview?.metadata ?? artifact.role}</span>
        <span className="vd-document-card__tag">{preview?.tag ?? artifact.shelf}</span>
      </span>
    </a>
  );
}

export function ArtifactCitationCard({ artifact }: DocumentPreviewCardProps) {
  const preview = artifact.preview;
  const lines = preview?.lines.slice(0, 2) ?? [artifact.role, artifact.label];

  return (
    <a className="vd-citation-card" href={artifact.href} aria-label={`Open cited source ${artifact.label}`}>
      <span className="vd-citation-card__copy">
        <FileBadge kind={artifact.kind} label={artifact.label} compact />
        <span>{preview?.metadata ?? artifact.role}</span>
      </span>
      <span className={`vd-citation-card__thumb vd-citation-card__thumb--${artifact.kind}`} aria-hidden="true">
        <span>{preview?.title ?? artifact.kind.toUpperCase()}</span>
        {lines.map((line) => (
          <i key={line}>{line}</i>
        ))}
      </span>
    </a>
  );
}
