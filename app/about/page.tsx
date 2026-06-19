'use client';

import AboutClient from './AboutClient';
import { AboutProfileView } from './AboutProfileView';
import { ProfileGate } from '../profile/ProfileGate';

export default function AboutPage() {
  return (
    <ProfileGate renderProfile={(profile) => <AboutProfileView profile={profile} />}>
      <AboutClient />
    </ProfileGate>
  );
}
