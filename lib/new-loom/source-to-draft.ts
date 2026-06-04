import type { VerifiedDossierArtifact } from './verified-dossier-home';

export function buildDraftUrlFromArtifacts(
  artifacts: readonly VerifiedDossierArtifact[],
  input: { type?: string } = {},
) {
  const params = new URLSearchParams();
  const draftType = input.type?.trim();
  if (draftType) params.set('draftType', draftType);

  for (const artifact of artifacts) {
    params.append('ref', artifactDraftHref(artifact));
    params.append('label', artifact.label);
    params.append('source', artifact.label);
    params.append('kind', 'source');
    params.append('excerpt', artifactDraftExcerpt(artifact));
    params.append('artifactTargetId', artifact.id);
    params.append('artifactKind', artifact.kind);
    params.append('artifactLabel', artifact.label);
    params.append('artifactState', 'attached');
    params.append('artifactStateLabel', 'Attached source');
    if (artifact.sourcePath) params.append('sourcePath', artifact.sourcePath);
    if (artifact.shelf) params.append('category', artifact.shelf);
  }

  const query = params.toString();
  return query ? `/draft?${query}` : '/draft';
}

function artifactDraftHref(artifact: VerifiedDossierArtifact) {
  const marker = encodeURIComponent(artifact.id);
  return artifact.href.includes('#') ? `${artifact.href}-${marker}` : `${artifact.href}#${marker}`;
}

function artifactDraftExcerpt(artifact: VerifiedDossierArtifact) {
  return [
    artifact.role,
    artifact.preview?.title,
    artifact.sourcePath,
    ...(artifact.preview?.lines ?? []),
  ]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(' - ');
}
