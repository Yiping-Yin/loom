'use client';

import { useEffect, useRef, useState } from 'react';
import { onAuthChange, getSession, type AuthSession } from '../auth/auth-client';
import { onBeginnerProfileChange } from '../profile/profile-events';
import { localStorageProfilePort } from './local-store-port';
import { supabaseProfileGateway } from './profile-gateway';
import { ProfileSync, type SyncStatus } from './profile-sync';

/** Monotonic version clock: never returns ≤ prev, so equal/backwards wall clocks still advance. */
export function nextLocalClock(prev: number, wall: number): number {
  return wall > prev ? wall : prev + 1;
}

/**
 * Drives profile sync for the signed-in user: sync on sign-in, debounced push on
 * local change, pull on window focus. Inert when Supabase is unconfigured or
 * signed out. Returns the current session + sync status for the UI.
 */
export function useProfileSync(): { session: AuthSession; status: SyncStatus } {
  const [session, setSession] = useState<AuthSession>(null);
  const [status, setStatus] = useState<SyncStatus>('idle');
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;
    const port = localStorageProfilePort();
    const gateway = supabaseProfileGateway();
    const engine = gateway ? new ProfileSync(gateway, port) : null;

    const run = async (userId: string) => {
      if (!engine) return;
      setStatus('syncing');
      const s = await engine.syncOnce(userId);
      if (active) setStatus(s);
    };

    getSession().then((s) => { if (active) { setSession(s); if (s) run(s.userId); } });

    const offAuth = onAuthChange((s) => {
      if (!active) return;
      setSession(s);
      if (s) run(s.userId); else setStatus('idle');
    });

    const offChange = onBeginnerProfileChange(() => {
      port.setLocalUpdatedAt(nextLocalClock(port.getLocalUpdatedAt(), Date.now()));
      if (debounce.current) clearTimeout(debounce.current);
      debounce.current = setTimeout(() => {
        getSession().then((s) => { if (s) run(s.userId); });
      }, 1200);
    });

    const onFocus = () => { getSession().then((s) => { if (s) run(s.userId); }); };
    if (typeof window !== 'undefined') window.addEventListener('focus', onFocus);

    return () => {
      active = false;
      offAuth(); offChange();
      if (debounce.current) clearTimeout(debounce.current);
      if (typeof window !== 'undefined') window.removeEventListener('focus', onFocus);
    };
  }, []);

  return { session, status };
}
