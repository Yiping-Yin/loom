import { redirect } from 'next/navigation';

export const metadata = { title: 'Sources · Loom' };

export default function LegacyAtlasPage() {
  redirect('/sources');
}
