import { ConversationalOnboardingClient } from './ConversationalOnboardingClient';

export const metadata = { title: 'Build your profile · Loom' };

/**
 * Default entry point for /onboarding/profile.
 *
 * Renders the conversational (chat-first) onboarding. The classic 5-step form
 * wizard is still available at /onboarding/profile/form (see ./form/page.tsx)
 * and is linked from the footer of this page.
 */
export default function ProfileOnboardingPage() {
  return <ConversationalOnboardingClient />;
}
