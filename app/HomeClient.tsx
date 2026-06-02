'use client';

import { useEffect, useState } from 'react';
import { VerifiedDossierHome } from '../components/verified-dossier/VerifiedDossierHome';
import { subscribeLoomMirror } from '../lib/loom-mirror-store';
import { loadPanelRecords, PANEL_RECORDS_KEY } from '../lib/loom-panel-records';
import { loadPursuitRecords, PURSUIT_RECORDS_KEY } from '../lib/loom-pursuit-records';
import { loadWeaveRecords, WEAVE_RECORDS_KEY } from '../lib/loom-weave-records';
import {
  RECENT_RECORDS_KEY,
  loadLatestRecentRecord,
  type LoomRecentRecord,
} from '../lib/loom-recent-records';

type LoomNavigateWindow = {
  webkit?: {
    messageHandlers?: {
      loomNavigate?: { postMessage: (msg: unknown) => void };
    };
  };
};

function callNativeBridge(action: string, payload?: Record<string, unknown>) {
  try {
    const handler = (window as unknown as LoomNavigateWindow).webkit?.messageHandlers
      ?.loomNavigate;
    if (handler?.postMessage) {
      handler.postMessage({ action, ...(payload ?? {}) });
      return true;
    }
  } catch (_) {}
  return false;
}

function countFromPayload(raw: unknown): number {
  if (Array.isArray(raw)) return raw.length;
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    for (const field of ['items', 'panels', 'pursuits', 'weaves']) {
      const v = o[field];
      if (Array.isArray(v)) return v.length;
    }
  }
  return 0;
}

function formatActivity(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function formatNativeActivitySummary({
  panelCount,
  pursuitCount,
  weaveCount,
}: {
  panelCount: number;
  pursuitCount: number;
  weaveCount: number;
}) {
  return [
    `Draft: ${formatActivity(panelCount, 'item', 'items')}`,
    `Process: ${formatActivity(pursuitCount, 'path', 'paths')}`,
    `Sources: ${formatActivity(weaveCount, 'link', 'links')}`,
  ].join(', ');
}

export function HomeClient() {
  const [ready, setReady] = useState(false);
  const [recent, setRecent] = useState<LoomRecentRecord | null>(null);
  const [panelCount, setPanelCount] = useState(0);
  const [pursuitCount, setPursuitCount] = useState(0);
  const [weaveCount, setWeaveCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      const [nextRecent, nextPanelCount, nextPursuitCount, nextWeaveCount] = await Promise.all([
        loadLatestRecentRecord(),
        loadPanelRecords().then(countFromPayload),
        loadPursuitRecords().then(countFromPayload),
        loadWeaveRecords().then(countFromPayload),
      ]);
      if (cancelled) return;
      setRecent(nextRecent);
      setPanelCount(nextPanelCount);
      setPursuitCount(nextPursuitCount);
      setWeaveCount(nextWeaveCount);
      setReady(true);
    };
    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const dispose = subscribeLoomMirror(RECENT_RECORDS_KEY, 'loom-recents-updated', () => {
      void loadLatestRecentRecord().then((next) => {
        if (!cancelled) setRecent(next);
      });
    });
    return () => {
      cancelled = true;
      dispose();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const refreshPanels = async () => {
      const next = countFromPayload(await loadPanelRecords());
      if (!cancelled) setPanelCount(next);
    };
    const refreshPursuits = async () => {
      const next = countFromPayload(await loadPursuitRecords());
      if (!cancelled) setPursuitCount(next);
    };
    const refreshWeaves = async () => {
      const next = countFromPayload(await loadWeaveRecords());
      if (!cancelled) setWeaveCount(next);
    };
    const disposePanels = subscribeLoomMirror(PANEL_RECORDS_KEY, 'loom-panels-updated', () => {
      void refreshPanels();
    });
    const disposePursuits = subscribeLoomMirror(PURSUIT_RECORDS_KEY, 'loom-pursuits-updated', () => {
      void refreshPursuits();
    });
    const disposeWeaves = subscribeLoomMirror(WEAVE_RECORDS_KEY, 'loom-weaves-updated', () => {
      void refreshWeaves();
    });
    return () => {
      cancelled = true;
      disposePanels();
      disposePursuits();
      disposeWeaves();
    };
  }, []);

  const handleOpenSources = () => {
    const href = '/knowledge';
    if (callNativeBridge('navigate', { href })) return;
    window.location.href = href;
  };

  const handleOpenRecent = () => {
    if (!recent) return;
    if (callNativeBridge('navigate', { href: recent.href })) return;
    window.location.href = recent.href;
  };

  return (
    <VerifiedDossierHome
      activitySummary={formatNativeActivitySummary({ panelCount, pursuitCount, weaveCount })}
      ready={ready}
      hasRecent={Boolean(recent)}
      onOpenSources={handleOpenSources}
      onOpenRecent={handleOpenRecent}
    />
  );
}
