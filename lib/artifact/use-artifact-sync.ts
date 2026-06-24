'use client';

/**
 * Drives artifact blob sync for the signed-in user (Phase 2): push local blobs to
 * Storage on sign-in / focus / upload, lazily pull a missing blob on "Open" via the
 * artifact-store fallback seam, and prune a remote blob when the local one is
 * deleted. Inert when Supabase is unconfigured or signed out. Mirrors useProfileSync.
 */
import { useEffect, useState } from 'react';
import { onAuthChange, getSession, type AuthSession } from '../auth/auth-client';
import { readBeginnerProfileLocal } from '../profile/profile-storage';
import type { BeginnerProfile } from '../profile/beginner-profile';
import {
  listArtifactMeta, getArtifactBlob, hasArtifact, putArtifactRecord,
  setArtifactRemoteFallback, type ArtifactKind,
} from './artifact-store';
import { artifactBlobGateway } from './artifact-blob-gateway';
import { onArtifactAdded, onArtifactDeleted } from './artifact-events';
import {
  pushAllArtifacts, ensureArtifactLocal,
  type ArtifactLocalPort, type ArtifactMetaHint,
} from './artifact-sync';

const ALLOWED_KINDS: readonly ArtifactKind[] = ['pdf', 'image', 'doc', 'other'];
function coerceKind(kind: string): ArtifactKind {
  return (ALLOWED_KINDS as readonly string[]).includes(kind) ? (kind as ArtifactKind) : 'other';
}

/** Build a meta hint for caching a pulled blob, from the synced profile ArtifactRef. */
export function artifactMetaHintFor(profile: BeginnerProfile | null, id: string): ArtifactMetaHint {
  const ref = profile?.artifacts?.find((artifact) => artifact.id === id);
  if (!ref) return { name: id, kind: 'other' };
  return {
    name: ref.name || id,
    kind: coerceKind(ref.kind),
    thumbnailDataUri: ref.thumbnailDataUri,
    extractedText: ref.extractedText,
  };
}

/** The real local port over the IndexedDB artifact store. */
export function artifactLocalPort(): ArtifactLocalPort {
  return {
    listIds: async () => (await listArtifactMeta()).map((meta) => meta.id),
    has: (id) => hasArtifact(id),
    readBlob: (id) => getArtifactBlob(id),
    writeBlob: async (id, blob, metaHint) => {
      await putArtifactRecord(
        {
          id,
          name: metaHint.name,
          kind: metaHint.kind,
          size: blob.size,
          addedAt: Date.now(),
          thumbnailDataUri: metaHint.thumbnailDataUri,
          extractedText: metaHint.extractedText,
        },
        blob,
      );
    },
  };
}

export function useArtifactSync(): { session: AuthSession } {
  const [session, setSession] = useState<AuthSession>(null);

  useEffect(() => {
    let active = true;
    const gateway = artifactBlobGateway();
    const port = artifactLocalPort();

    const pushAll = (userId: string) => { if (gateway) void pushAllArtifacts(userId, gateway, port); };

    const install = (userId: string) => {
      if (!gateway) return;
      setArtifactRemoteFallback((id) =>
        ensureArtifactLocal(userId, id, artifactMetaHintFor(readBeginnerProfileLocal(), id), gateway, port));
    };

    getSession().then((s) => { if (active) { setSession(s); if (s) { install(s.userId); pushAll(s.userId); } } });

    const offAuth = onAuthChange((s) => {
      if (!active) return;
      setSession(s);
      if (s) { install(s.userId); pushAll(s.userId); } else setArtifactRemoteFallback(null);
    });
    const offAdd = onArtifactAdded(() => { getSession().then((s) => { if (s) pushAll(s.userId); }); });
    // Delete is id-specific: remove EXACTLY the deleted blob from Storage. Never
    // reconcile by local-cache absence — under lazy-pull the local cache is a
    // partial subset, so absence is the normal cold-device state, not a delete.
    const offDel = onArtifactDeleted((id) => {
      getSession().then((s) => { if (s && gateway) void gateway.remove(s.userId, id).catch(() => {}); });
    });
    const onFocus = () => { getSession().then((s) => { if (s) pushAll(s.userId); }); };
    if (typeof window !== 'undefined') window.addEventListener('focus', onFocus);

    return () => {
      active = false;
      offAuth();
      offAdd();
      offDel();
      setArtifactRemoteFallback(null);
      if (typeof window !== 'undefined') window.removeEventListener('focus', onFocus);
    };
  }, []);

  return { session };
}
