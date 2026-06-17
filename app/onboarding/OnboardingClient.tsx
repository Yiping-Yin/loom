'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { ScanScopePicker } from '../../components/ScanScopePicker';
import { TextInput } from '../../components/TextInput';
import { WeftShuttle } from '../../components/DocViewer';
import { LoomGlobalNav } from '../../components/verified-dossier/LoomGlobalNav';
import styles from './OnboardingClient.module.css';

type Phase = 'pick' | 'scope' | 'scanning' | 'done' | 'error';

const ONBOARDING_DONE_ROUTE = '/sources';

declare global {
  interface Window {
    webkit?: {
      messageHandlers?: Record<string, { postMessage: (msg: unknown) => void }>;
    };
    loomOnboarding?: {
      receiveFolder: (path: string) => void;
      receiveFolderError: (reason: string) => void;
    };
  }
}

/**
 * First-run web surface. Shares the global Loom chrome and cold graphite setup
 * scene while preserving the functional paths: POST /api/content-root, POST
 * /api/ingest, ScanScopePicker persist.
 */
export function OnboardingClient() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('pick');
  const [folder, setFolder] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [manualPath, setManualPath] = useState<string>('');
  const [scopeModalOpen, setScopeModalOpen] = useState(false);
  const [showManualPath, setShowManualPath] = useState(false);

  useEffect(() => {
    // Swift posts the chosen folder back via evaluateJavaScript; expose the
    // receiver on window so the native shell can invoke it.
    window.loomOnboarding = {
      receiveFolder: (p: string) => {
        setFolder(p);
        void saveAndIngest(p);
      },
      receiveFolderError: (reason: string) => {
        setError(reason || 'folder selection cancelled');
      },
    };
    return () => {
      delete window.loomOnboarding;
    };
  }, []);

  const saveAndIngest = async (p: string) => {
    setError('');
    try {
      const save = await fetch('/api/content-root', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentRoot: p }),
      });
      if (!save.ok) {
        const body = await save.json().catch(() => ({}));
        throw new Error(body.error || `save failed (${save.status})`);
      }
      setFolder(p);
      // Hand off to scope picker — the picker persists scope and triggers
      // the ingest itself. Avoids scanning everything only to narrow later.
      setPhase('scope');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPhase('error');
    }
  };

  const skipScopeAndIngestAll = async () => {
    setPhase('scanning');
    try {
      const ing = await fetch('/api/ingest', { method: 'POST' });
      if (!ing.ok) {
        const body = await ing.json().catch(() => ({}));
        throw new Error(body.error || `ingest failed (${ing.status})`);
      }
      setPhase('done');
      setTimeout(() => router.push(ONBOARDING_DONE_ROUTE), 600);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPhase('error');
    }
  };

  const pickFolder = () => {
    const handler = window.webkit?.messageHandlers?.loomChooseFolder;
    if (handler) {
      handler.postMessage({});
    } else {
      // Browser fallback — Swift handler only exists inside the Loom app.
      setError('Folder picker requires the Loom app. Paste a path below instead.');
      setShowManualPath(true);
    }
  };

  return (
    <>
      <LoomGlobalNav ariaLabel="Onboarding navigation" />
      <main className={styles.page}>
        <section className={styles.shell}>
          <Eyebrow>Setup · Sources</Eyebrow>

          <h1
            aria-label="Set up Sources."
            className={styles.title}
          >
            Set up
            <br />
            {' '}
            <span className={styles.titleAccent}>Sources.</span>
          </h1>

          <p className={styles.lead}>
            Choose the folder that contains the files Loom should index. Local files stay on this
            machine and become the source layer for Draft.
          </p>

          {phase === 'pick' && (
            <PickPhase
              onPick={pickFolder}
              manualPath={manualPath}
              setManualPath={setManualPath}
              onManualSubmit={() => void saveAndIngest(manualPath.trim())}
              showManualPath={showManualPath}
              setShowManualPath={setShowManualPath}
              error={error}
            />
          )}

          {phase === 'scope' && (
            <ScopePhase
              folder={folder}
              onOpenModal={() => setScopeModalOpen(true)}
              onSkip={() => void skipScopeAndIngestAll()}
              scopeModalOpen={scopeModalOpen}
              onCloseModal={() => setScopeModalOpen(false)}
              onScopeSaved={() => {
                setScopeModalOpen(false);
                setPhase('done');
                setTimeout(() => router.push(ONBOARDING_DONE_ROUTE), 600);
              }}
            />
          )}

          {phase === 'scanning' && <ScanningPhase folder={folder} />}

          {phase === 'done' && (
            <p className={styles.done}>
              All set — opening Sources…
            </p>
          )}

          {phase === 'error' && (
            <ErrorPhase message={error} onRetry={() => setPhase('pick')} />
          )}
        </section>
      </main>
    </>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.eyebrow}>
      {children}
    </div>
  );
}

/**
 * Setup action button. Primary actions use a real SVG arrow, keeping navigation
 * glyphs aligned with the global Loom chrome.
 */
function VellumButton({
  label,
  icon,
  onClick,
  disabled,
  tone = 'primary',
}: {
  label: ReactNode;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: 'primary' | 'ghost';
}) {
  return (
    <button
      type="button"
      className={`${styles.button} ${
        tone === 'primary' ? styles.primaryButton : styles.ghostButton
      }`}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
      {icon}
    </button>
  );
}

function PickPhase({
  onPick,
  manualPath,
  setManualPath,
  onManualSubmit,
  showManualPath,
  setShowManualPath,
  error,
}: {
  onPick: () => void;
  manualPath: string;
  setManualPath: (v: string) => void;
  onManualSubmit: () => void;
  showManualPath: boolean;
  setShowManualPath: (v: boolean) => void;
  error: string;
}) {
  return (
    <div className={styles.phase}>
      <div className={styles.actionRow}>
        <VellumButton
          label="Choose Sources root"
          icon={<ArrowRight aria-hidden="true" size={14} strokeWidth={1.8} />}
          onClick={onPick}
        />
        <button
          type="button"
          onClick={() => setShowManualPath(!showManualPath)}
          className={styles.manualToggle}
        >
          or paste a path
        </button>
      </div>

      {showManualPath && (
        <div className={styles.manualPath}>
          <div className={styles.pathField}>
            <TextInput
              size="md"
              value={manualPath}
              onChange={(e) => setManualPath(e.target.value)}
              placeholder="/Users/you/Documents/Study"
            />
          </div>
          <VellumButton
            tone="ghost"
            label="use this path"
            onClick={onManualSubmit}
            disabled={!manualPath.trim()}
          />
        </div>
      )}

      <p className={styles.note}>
        Loom reads the files you already organized: PDFs, slides, notes. Nothing leaves this
        machine.
      </p>

      {error && (
        <p className={styles.errorText}>
          {error}
        </p>
      )}
    </div>
  );
}

function ScopePhase({
  folder,
  onOpenModal,
  onSkip,
  scopeModalOpen,
  onCloseModal,
  onScopeSaved,
}: {
  folder: string;
  onOpenModal: () => void;
  onSkip: () => void;
  scopeModalOpen: boolean;
  onCloseModal: () => void;
  onScopeSaved: () => void;
}) {
  return (
    <div className={styles.scopePhase}>
      <div className={styles.statePanel}>
        <div className={styles.stateTitle}>
          Sources root is set.
        </div>
        <div className={styles.monoPath}>
          {folder}
        </div>
        <p className={styles.stateCopy}>
          Want Loom to read only certain folders? Pick the subfolders you care about, or let it
          scan everything.
        </p>
      </div>

      <div className={styles.phaseActionRow}>
        <VellumButton
          label="Choose source folders"
          icon={<ArrowRight aria-hidden="true" size={14} strokeWidth={1.8} />}
          onClick={onOpenModal}
        />
        <VellumButton tone="ghost" label="scan every source" onClick={onSkip} />
      </div>

      <ScanScopePicker open={scopeModalOpen} onClose={onCloseModal} onSaved={onScopeSaved} />
    </div>
  );
}

function ScanningPhase({ folder }: { folder: string }) {
  return (
    <div className={`${styles.statePanel} ${styles.scanningPanel}`}>
      <div className={styles.scanningHeader}>
        <WeftShuttle width={48} height={10} />
        <span className={styles.stateTitle}>
          Reading sources…
        </span>
      </div>
      <p className={styles.stateCopy}>
        Loom is looking through {folder}, drawing names from syllabi and slide decks. This takes a
        minute the first time.
      </p>
    </div>
  );
}

function ErrorPhase({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className={styles.errorPanel}>
      <div className={styles.stateTitle}>
        Setup needs attention.
      </div>
      <p className={styles.stateCopy}>
        {message}
      </p>
      <div className={styles.phaseActionRow}>
        <VellumButton tone="ghost" label="try again" onClick={onRetry} />
      </div>
    </div>
  );
}
