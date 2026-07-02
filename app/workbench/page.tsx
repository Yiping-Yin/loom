import WorkbenchClient from './WorkbenchClient';

export const metadata = { title: 'Loom · Workbench' };

// The Loom Workbench: lab-notebook soul, IDE skeleton, manuscript center.
// Hosted as the native window's main surface; a plain browser gets the demo
// store so the form is reviewable anywhere.
export default function WorkbenchPage() {
  return <WorkbenchClient />;
}
