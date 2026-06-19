import { promises as fs } from 'node:fs';
import { redirect } from 'next/navigation';
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
  if (!configured) redirect('/onboarding');
  // HomeGate renders the verified dossier on first paint and overlays the
  // beginner profile (read from localStorage) on the client if one exists.
  return <HomeGate />;
}
