/**
 * The narrow seam the sync engine uses to touch local state, so the engine never
 * imports localStorage directly (keeps it unit-testable + decoupled). Wraps the
 * existing profile store and adds the local version clock (see plan header).
 */
import {
  readBeginnerProfileLocal,
  writeBeginnerProfileLocal,
} from '../profile/profile-storage';
import type { BeginnerProfile } from '../profile/beginner-profile';

export const LOCAL_UPDATED_AT_KEY = 'loom:beginner-profile:local-updated-at';

export interface ProfileLocalPort {
  read(): BeginnerProfile | null;
  write(profile: BeginnerProfile): boolean;
  getLocalUpdatedAt(): number;
  setLocalUpdatedAt(ms: number): void;
}

function ls(): Storage | null {
  if (typeof window === 'undefined') return null;
  try { return window.localStorage ?? null; } catch { return null; }
}

export function localStorageProfilePort(): ProfileLocalPort {
  return {
    read: () => readBeginnerProfileLocal(),
    write: (p) => writeBeginnerProfileLocal(p),
    getLocalUpdatedAt: () => {
      const raw = ls()?.getItem(LOCAL_UPDATED_AT_KEY);
      const n = raw ? Number(raw) : 0;
      return Number.isFinite(n) ? n : 0;
    },
    setLocalUpdatedAt: (ms) => {
      try { ls()?.setItem(LOCAL_UPDATED_AT_KEY, String(ms)); } catch { /* quota */ }
    },
  };
}
