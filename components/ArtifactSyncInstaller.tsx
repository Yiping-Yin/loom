'use client';

import { useArtifactSync } from '../lib/artifact/use-artifact-sync';

/**
 * Global installer (Phase 2): mounts useArtifactSync app-wide so the lazy-pull
 * fallback is installed wherever artifacts are Opened (Digital Me, capability map,
 * Ask), and blob push runs on sign-in / focus / upload. Renders nothing. Inert
 * when Supabase is unconfigured or signed out. Mirrors PanelSync / WeaveSync.
 */
export function ArtifactSyncInstaller() {
  useArtifactSync();
  return null;
}
