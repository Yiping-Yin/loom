import SystemClient from '../SystemClient';

// /system — how Loom works, on one quiet sheet. Explains the loop
// between the two primary workspaces (Sources → notes → Draft) and
// links the support surfaces that sit around it.

export const metadata = { title: 'System · Loom' };

export default function SystemPage() {
  return <SystemClient />;
}
