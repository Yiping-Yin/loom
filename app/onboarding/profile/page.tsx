import { ProfileWizardClient } from './ProfileWizardClient';

export const metadata = { title: 'Build your profile · Loom' };

export default function ProfileWizardPage() {
  // The wizard reads any existing profile from localStorage on mount (edit /
  // resume), so the page no longer reads from the filesystem on the server.
  return <ProfileWizardClient />;
}
