import { browserLocalStorage, type BrowserStorageAdapter } from '../browser-storage';

export const NEW_LOOM_PUBLIC_WORKING_MODE_KEY = 'loom.publicWorkingMode';

export function browserPublicWorkingStorage(): BrowserStorageAdapter | null {
  return browserLocalStorage();
}

export function isNewLoomPublicWorkingMode(
  search = '',
  storage: BrowserStorageAdapter | null = null,
) {
  const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
  const publicParam = params.get('public');
  const workingParam = params.get('working');

  if (publicParam === '1' || publicParam === 'true') return true;
  if (publicParam === '0' || publicParam === 'false') return false;
  if (workingParam === 'public') return true;
  if (workingParam === 'private') return false;

  try {
    const stored = storage?.getItem(NEW_LOOM_PUBLIC_WORKING_MODE_KEY);
    return stored === '1' || stored === 'true' || stored === 'public';
  } catch {
    return false;
  }
}
