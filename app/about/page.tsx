import AboutClient from './AboutClient';
import { AboutProfileView } from './AboutProfileView';
import { readBeginnerProfile } from '../../lib/profile/profile-store';

export const metadata = { title: 'About · Loom' };

export default async function AboutPage() {
  const profile = await readBeginnerProfile();
  return profile ? <AboutProfileView profile={profile} /> : <AboutClient />;
}
