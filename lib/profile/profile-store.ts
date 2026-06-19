import { promises as fs } from 'node:fs';
import path from 'node:path';
import { loomUserDataRoot } from '../paths';
import { normalizeBeginnerProfile, type BeginnerProfile } from './beginner-profile';

export function profileStorePath(): string {
  return path.join(loomUserDataRoot(), 'beginner-profile.json');
}

export async function readBeginnerProfile(
  file: string = profileStorePath(),
): Promise<BeginnerProfile | null> {
  try {
    const raw = await fs.readFile(file, 'utf-8');
    return normalizeBeginnerProfile(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function writeBeginnerProfile(
  profile: BeginnerProfile,
  file: string = profileStorePath(),
): Promise<void> {
  const normalized = normalizeBeginnerProfile(profile);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(normalized, null, 2), 'utf-8');
}
