'use client';

import { useLearningSync } from '../lib/sync/use-learning-sync';

/**
 * Global installer (Phase 4): mounts useLearningSync app-wide so traces/panels/
 * weaves sync on sign-in / focus / change. Renders nothing. Inert when Supabase is
 * unconfigured or signed out. Distinct from the LOCAL PanelSync/WeaveSync installers
 * (those are cross-tab/derivation, not cloud sync).
 */
export function LearningSyncInstaller() {
  useLearningSync();
  return null;
}
