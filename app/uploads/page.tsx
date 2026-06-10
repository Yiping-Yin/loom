import { redirect } from 'next/navigation';

export const metadata = { title: 'Sources · Loom' };

/**
 * /uploads is a compatibility route. File intake now lives in Sources
 * on both web and native — old bookmarks land on the workbench that
 * owns intake instead of a separate upload surface.
 */
export default function LegacyUploadsPage() {
  redirect('/sources');
}
