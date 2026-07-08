'use client';

import { WorksOwnerEmptyView } from './WorksViews';

/**
 * Client gate for /works. The owner's dossier has no Works section, so the
 * page renders the owner empty view directly. (The beginner "N projects on
 * record" shell retired with the beginner layer — ONE-digital-me.)
 */
export function WorksGate() {
  return <WorksOwnerEmptyView />;
}
