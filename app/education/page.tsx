import { EducationGate } from './EducationGate';

// Re-export the views so existing render tests can import them from this module.
export {
  DossierEducationView,
  EducationProfileView,
} from './EducationViews';

export const metadata = { title: 'Education · Loom' };

export default function EducationPage() {
  return <EducationGate />;
}
