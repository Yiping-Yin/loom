import { WorksGate } from './WorksGate';

// Re-export the views so existing render tests can import them from this module.
export { WorksProfileView, WorksOwnerEmptyView } from './WorksViews';

export const metadata = { title: 'Works · Loom' };

export default function WorksPage() {
  return <WorksGate />;
}
