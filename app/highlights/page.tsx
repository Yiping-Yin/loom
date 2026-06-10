import { redirect } from 'next/navigation';

export const metadata = { title: 'Sources · Loom' };

export default function LegacyHighlightsPage() {
  redirect('/sources#reader-notes');
}
