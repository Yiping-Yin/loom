import { redirect } from 'next/navigation';

export const metadata = { title: 'Draft · Loom' };

export default function LegacyPalimpsestPage() {
  redirect('/draft');
}
