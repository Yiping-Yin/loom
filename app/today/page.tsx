import { TodayClient } from './TodayClient';

export const metadata = { title: 'Today · Loom' };

/**
 * /today — daily capture surface.
 *
 * Renders TodayClient directly: a frictionless jot input (client-side
 * localStorage via lib/jot/jot-storage) + recent jots + today's reading
 * record. No redirect — this is a live surface, not a compat stub.
 *
 * Route remains in NEW_LOOM_LEGACY_ROUTES (product-shell.ts) because it
 * is not yet a first-level sidebar destination; it is discoverable via
 * /today directly and is not linked from HomeClient.
 */
export default function TodayPage() {
  return <TodayClient totalDocs={0} docsLite={[]} daily={null} />;
}
