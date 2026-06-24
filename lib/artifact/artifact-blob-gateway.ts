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
      // Storage list() defaults to a 100-object page; paginate so libraries larger
      // than one page still reconcile completely.
      const ids: string[] = [];
      const pageSize = 1000;
      for (let offset = 0; ; offset += pageSize) {
        const { data, error } = await sb.storage.from(BUCKET).list(userId, { limit: pageSize, offset });
        if (error) throw error;
        const page = data ?? [];
        for (const object of page) ids.push(object.name);
        if (page.length < pageSize) break;
      }
      return ids;
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
