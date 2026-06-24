/**
 * Artifact blob sync engine (Phase 2). Pushes local blobs to Storage (reconciling
 * against what's already remote) and lazily pulls a missing blob on demand. Pure
 * orchestration over an ArtifactLocalPort + ArtifactBlobGateway, so it is unit-
 * testable with in-memory fakes. Best-effort/local-first: every entry point
 * swallows errors and never throws to the UI.
 */
import type { ArtifactBlobGateway } from './artifact-blob-gateway';
import type { ArtifactKind } from './artifact-store';

export type ArtifactMetaHint = {
  name: string;
  kind: ArtifactKind;
  thumbnailDataUri?: string;
  extractedText?: string;
};

export interface ArtifactLocalPort {
  listIds(): Promise<string[]>;
  has(id: string): Promise<boolean>;
  readBlob(id: string): Promise<Blob | null>;
  writeBlob(id: string, blob: Blob, metaHint: ArtifactMetaHint): Promise<void>;
}

/** Push every local blob whose id is not yet in Storage. Best-effort. */
export async function pushAllArtifacts(
  userId: string,
  gateway: ArtifactBlobGateway,
  port: ArtifactLocalPort,
): Promise<void> {
  try {
    const [localIds, remoteIds] = await Promise.all([port.listIds(), gateway.listRemoteIds(userId)]);
    const remote = new Set(remoteIds);
    for (const id of localIds) {
      if (remote.has(id)) continue;
      const blob = await port.readBlob(id);
      if (blob) await gateway.upload(userId, id, blob);
    }
  } catch {
    /* best-effort; retried on the next sync */
  }
}

/** Push one local blob. Best-effort. */
export async function pushArtifact(
  userId: string,
  id: string,
  gateway: ArtifactBlobGateway,
  port: ArtifactLocalPort,
): Promise<void> {
  try {
    const blob = await port.readBlob(id);
    if (blob) await gateway.upload(userId, id, blob);
  } catch {
    /* best-effort */
  }
}

/** Ensure a blob is cached locally; download + cache on a miss. Returns whether it pulled. */
export async function ensureArtifactLocal(
  userId: string,
  id: string,
  metaHint: ArtifactMetaHint,
  gateway: ArtifactBlobGateway,
  port: ArtifactLocalPort,
): Promise<boolean> {
  try {
    if (await port.has(id)) return false;
    const blob = await gateway.download(userId, id);
    if (!blob) return false;
    await port.writeBlob(id, blob, metaHint);
    return true;
  } catch {
    return false;
  }
}
