'use client';

import { useEffect, useState } from 'react';
import { VerifiedDossierHome } from '../components/verified-dossier/VerifiedDossierHome';
import { subscribeLoomMirror } from '../lib/loom-mirror-store';
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

export function HomeClient() {
  const [recent, setRecent] = useState<LoomRecentRecord | null>(null);

  useEffect(() => {
    let cancelled = false;

    const refreshRecent = () => {
      void loadLatestRecentRecord().then((next) => {
        if (!cancelled) setRecent(next);
      });
    };

    refreshRecent();
    const dispose = subscribeLoomMirror(RECENT_RECORDS_KEY, 'loom-recents-updated', refreshRecent);

    return () => {
      cancelled = true;
      dispose();
    };
  }, []);

  const handleOpenSources = () => {
    const href = '/knowledge';
    if (callNativeBridge('navigate', { href })) return;
    window.location.href = href;
  };

  const handleOpenRecent = () => {
    const href = recent?.href ?? '/draft';
    if (callNativeBridge('navigate', { href })) return;
    window.location.href = href;
  };

  return (
    <VerifiedDossierHome
      hasRecent={Boolean(recent)}
      onOpenSources={handleOpenSources}
      onOpenRecent={handleOpenRecent}
    />
  );
}
