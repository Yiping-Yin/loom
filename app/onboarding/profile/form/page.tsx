import { ProfileWizardClient } from '../ProfileWizardClient';

export const metadata = { title: 'Profile form · Loom' };

/**
 * Classic 5-step form wizard, reachable at /onboarding/profile/form.
 *
 * The conversational flow at /onboarding/profile is the default entry.
 * This route exists so returning users who prefer a structured form can use it,
 * and so that profile-wizard.test.tsx tests remain green with no path changes.
 */
export default function ProfileFormPage() {
  return <ProfileWizardClient />;
}
