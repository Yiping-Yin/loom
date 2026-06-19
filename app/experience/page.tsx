import { ExperienceGate } from './ExperienceGate';

// Re-export the views so existing render tests can import them from this module.
export {
  DossierExperienceView,
  ExperienceProfileView,
} from './ExperienceViews';

export const metadata = { title: 'Experience · Loom' };

export default function ExperiencePage() {
  return <ExperienceGate />;
}
