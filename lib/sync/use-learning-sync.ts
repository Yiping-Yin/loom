'use client';

/**
 * Drives learning-engine sync (Phase 4): traces (event-union merge), panels +
 * weaves (LWW). Full sync on sign-in + focus + debounced on learning-change.
 * Inert when Supabase is unconfigured or signed out. Mirrors the Phase 1/2/3 hooks.
 */
import { useEffect, useRef, useState } from 'react';
import { onAuthChange, getSession, type AuthSession } from '../auth/auth-client';
import { onLearningChange } from './learning-events';
import { AsyncCollectionSync, lwwMerge, type SyncStatus, type RecordMerge } from './async-collection-sync';
import { tracesGateway, panelsGateway, weavesGateway } from './learning-gateways';
import { traceMapper, panelMapper, weaveMapper } from './learning-mappers';
import { traceLocalPort } from './trace-local-port';
import { panelLocalPort } from './panel-local-port';
import { weaveLocalPort } from './weave-local-port';
import { mergeTrace } from './trace-merge';
import type { Trace } from '../trace/types';

type Engine = { syncOnce(userId: string): Promise<SyncStatus> };

export async function syncAllLearning(userId: string, engines: Engine[]): Promise<SyncStatus> {
  if (engines.length === 0) return 'synced';
  const results = await Promise.all(engines.map((engine) => engine.syncOnce(userId)));
  return results.some((result) => result === 'error') ? 'error' : 'synced';
}

/** Trace per-record merge: union events + LWW metadata when both sides present. */
const traceRecordMerge: RecordMerge<Trace> = (local, remote) => {
  if (local && remote) {
    const merged = mergeTrace(local.value, remote.value);
    return { value: merged, updatedAt: merged.updatedAt };
  }
  return local ?? remote;
};

function buildEngines(): Engine[] {
  const engines: Engine[] = [];
  const tg = tracesGateway();
  if (tg) engines.push(new AsyncCollectionSync<Trace>(tg, traceLocalPort(), traceMapper, traceRecordMerge));
  const pg = panelsGateway();
  if (pg) engines.push(new AsyncCollectionSync(pg, panelLocalPort(), panelMapper, lwwMerge()));
  const wg = weavesGateway();
  if (wg) engines.push(new AsyncCollectionSync(wg, weaveLocalPort(), weaveMapper, lwwMerge()));
  return engines;
}

export function useLearningSync(): { session: AuthSession; status: SyncStatus } {
  const [session, setSession] = useState<AuthSession>(null);
  const [status, setStatus] = useState<SyncStatus>('idle');
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;
    const engines = buildEngines();

    const run = async (userId: string) => {
      if (engines.length === 0) return;
      setStatus('syncing');
      const next = await syncAllLearning(userId, engines);
      if (active) setStatus(next);
    };

    getSession().then((s) => { if (active) { setSession(s); if (s) run(s.userId); } });
    const offAuth = onAuthChange((s) => {
      if (!active) return;
      setSession(s);
      if (s) run(s.userId); else setStatus('idle');
    });
    const offChange = onLearningChange(() => {
      if (debounce.current) clearTimeout(debounce.current);
      debounce.current = setTimeout(() => { getSession().then((s) => { if (s) run(s.userId); }); }, 1200);
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
