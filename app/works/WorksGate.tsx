'use client';

import { ProfileGate } from '../profile/ProfileGate';
import { WorksProfileView, WorksOwnerEmptyView } from './WorksViews';

/**
 * Client gate for /works. Wraps ProfileGate (which takes a `renderProfile`
 * function prop) so the page can stay a server component and keep its
 * `export const metadata` — a function prop cannot cross the server→client
 * boundary, so it must be created inside a client component. Views live in
 * ./WorksViews so importing them here never pulls page.tsx into the client graph
 * (which would re-taint the page as a client component).
 *
 * SSR / first paint and the owner (no beginner profile) get
 * WorksOwnerEmptyView — the owner's dossier has no Works section, so the
 * beginner "0 projects on record." shell would be misleading. After mount,
 * ProfileGate swaps to WorksProfileView when a beginner profile is present.
 */
export function WorksGate() {
  return (
    <ProfileGate renderProfile={(profile) => <WorksProfileView profile={profile} />}>
      <WorksOwnerEmptyView />
    </ProfileGate>
  );
}
