'use client';

/**
 * Drives drafts sync for the signed-in user across BOTH draft collections: full
 * sync on sign-in + window focus, debounced push on local draft-change events.
 * Inert when Supabase is unconfigured or signed out. Mirrors useProfileSync.
 */
import { useEffect, useRef, useState } from 'react';
import { onAuthChange, getSession, type AuthSession } from '../auth/auth-client';
import { onDraftsChange } from './draft-events';
import { CollectionSync, type SyncStatus } from './collection-sync';
import { draftsLocalPort } from './drafts-local-port';
import { draftRecordsLocalPort } from './draft-records-local-port';
import { draftsGateway } from './drafts-gateway';
import { draftRecordsGateway } from './draft-records-gateway';
import { draftMapper } from './draft-mapper';
import { draftRecordMapper } from './draft-record-mapper';

type Engine = { syncOnce(userId: string): Promise<SyncStatus> };

/** Run all collection engines for a user; 'error' if any errors, else 'synced'. */
export async function syncAllCollections(userId: string, engines: Engine[]): Promise<SyncStatus> {
  if (engines.length === 0) return 'synced';
  const results = await Promise.all(engines.map((engine) => engine.syncOnce(userId)));
  return results.some((result) => result === 'error') ? 'error' : 'synced';
}

function buildEngines(): Engine[] {
  const engines: Engine[] = [];
  const draftGw = draftsGateway();
  if (draftGw) engines.push(new CollectionSync(draftGw, draftsLocalPort(), draftMapper));
  const recordGw = draftRecordsGateway();
  if (recordGw) engines.push(new CollectionSync(recordGw, draftRecordsLocalPort(), draftRecordMapper));
  return engines;
}

export function useDraftsSync(): { session: AuthSession; status: SyncStatus } {
  const [session, setSession] = useState<AuthSession>(null);
  const [status, setStatus] = useState<SyncStatus>('idle');
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;
    const engines = buildEngines();

    const run = async (userId: string) => {
      if (engines.length === 0) return;
      setStatus('syncing');
      const next = await syncAllCollections(userId, engines);
      if (active) setStatus(next);
    };

    getSession().then((s) => { if (active) { setSession(s); if (s) run(s.userId); } });

    const offAuth = onAuthChange((s) => {
      if (!active) return;
      setSession(s);
      if (s) run(s.userId); else setStatus('idle');
    });

    const offChange = onDraftsChange(() => {
      if (debounce.current) clearTimeout(debounce.current);
      debounce.current = setTimeout(() => {
        getSession().then((s) => { if (s) run(s.userId); });
      }, 1200);
    });

    const onFocus = () => { getSession().then((s) => { if (s) run(s.userId); }); };
    if (typeof window !== 'undefined') window.addEventListener('focus', onFocus);

    return () => {
      active = false;
      offAuth();
      offChange();
      if (debounce.current) clearTimeout(debounce.current);
      if (typeof window !== 'undefined') window.removeEventListener('focus', onFocus);
    };
  }, []);

  return { session, status };
}
