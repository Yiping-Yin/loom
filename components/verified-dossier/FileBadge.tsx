import type { VerifiedDossierFileKind } from '../../lib/new-loom/verified-dossier-home';

const FILE_KIND_EXTENSIONS: Record<VerifiedDossierFileKind, string> = {
  pdf: 'PDF',
  word: 'DOCX',
  ppt: 'PPTX',
  excel: 'XLSX',
  markdown: 'MD',
  html: 'HTML',
  text: 'TXT',
};

export type FileBadgeProps = {
  kind: VerifiedDossierFileKind;
  label: string;
  compact?: boolean;
};

export function FileBadge({ kind, label, compact = false }: FileBadgeProps) {
  const extension = FILE_KIND_EXTENSIONS[kind];
  const className = [
    'vd-file-badge',
    `vd-file-badge--${kind}`,
    compact ? 'vd-file-badge--compact' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={className} aria-label={`${extension} file: ${label}`}>
      <span className="vd-file-badge__icon" aria-hidden="true">
        {extension}
      </span>
      <span className="vd-file-badge__label">{label}</span>
    </span>
  );
}
