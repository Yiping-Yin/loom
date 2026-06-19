import { readBeginnerProfile } from '../../../lib/profile/profile-store';
import { ProfileWizardClient } from './ProfileWizardClient';

export const metadata = { title: 'Build your profile · Loom' };

export default async function ProfileWizardPage() {
  const initial = await readBeginnerProfile();
  return <ProfileWizardClient initial={initial} />;
}
