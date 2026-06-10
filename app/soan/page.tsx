import { redirect } from 'next/navigation';

export const metadata = { title: 'Draft board · Loom' };

/**
 * /soan — compatibility redirect into Draft.
 *
 * The card board that used to live here now belongs to Draft: `/draft?view=board`
 * mounts the draft-card board so cards of every register (unclear notes,
 * connections, sketches) and their relations sit beside the writing surface
 * instead of as a separate top-level thinking surface.
 */
export default function LegacySoanPage() {
  redirect('/draft?view=board');
}
