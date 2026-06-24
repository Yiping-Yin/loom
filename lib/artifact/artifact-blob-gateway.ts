/**
 * Supabase Storage wrapper for artifact blob bytes (Phase 2). One private bucket
 * `artifacts`, object path `{userId}/{artifactId}`. Returns null when Supabase is
 * unconfigured, so the whole artifact-sync layer is inert without env — mirroring
 * profile-gateway / the Phase 3 gateways.
 */
import { getSupabaseClient } from '../supabase/client';

const BUCKET = 'artifacts';

export interface ArtifactBlobGateway {
  listRemoteIds(userId: string): Promise<string[]>;
  upload(userId: string, id: string, blob: Blob): Promise<void>;
  download(userId: string, id: string): Promise<Blob | null>;
  remove(userId: string, id: string): Promise<void>;
}

export function artifactBlobGateway(): ArtifactBlobGateway | null {
  const sb = getSupabaseClient();
  if (!sb) return null;
  const path = (userId: string, id: string) => `${userId}/${id}`;
  return {
    async listRemoteIds(userId) {
      const { data, error } = await sb.storage.from(BUCKET).list(userId);
      if (error) throw error;
      return (data ?? []).map((object: { name: string }) => object.name);
    },
    async upload(userId, id, blob) {
      const { error } = await sb.storage.from(BUCKET).upload(path(userId, id), blob, { upsert: true });
      if (error) throw error;
    },
    async download(userId, id) {
      const { data, error } = await sb.storage.from(BUCKET).download(path(userId, id));
      if (error) return null;
      return data ?? null;
    },
    async remove(userId, id) {
      const { error } = await sb.storage.from(BUCKET).remove([path(userId, id)]);
      if (error) throw error;
    },
  };
}
