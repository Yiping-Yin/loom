import { redirect } from 'next/navigation';

export const metadata = { title: 'Sources · Loom' };

export default function LegacyPatternsPage() {
  redirect('/sources#reader-notes');
}
