import { promises as fs } from 'node:fs';
import { loomContentRootConfigPath } from '../lib/paths';
import { HomeGate } from './HomeGate';


async function hasConfiguredContentRoot(): Promise<boolean> {
  try {
    const raw = await fs.readFile(loomContentRootConfigPath(), 'utf-8');
    const parsed = JSON.parse(raw) as { contentRoot?: string };
    const root = (parsed.contentRoot ?? '').trim();
    if (!root) return false;
    const stat = await fs.stat(root);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

export default async function Home() {
  const configured = await hasConfiguredContentRoot();
  // The redirect to /onboarding is intentionally handled client-side in
  // HomeGate: the localStorage beginner profile is not visible server-side, so
  // a server redirect would block profile-only users from ever reaching
  // HomeProfileView. HomeGate redirects to /onboarding only when there is no
  // local profile AND configured is false (first-run behavior preserved).
  return <HomeGate configured={configured} />;
}
