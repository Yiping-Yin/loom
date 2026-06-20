'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { BeginnerCapability, CapabilityEvidence, CapabilityStatus } from '../lib/capability/capability-graph';
import type { BeginnerProfile } from '../lib/profile/beginner-profile';
import { getArtifactObjectUrl } from '../lib/artifact/artifact-store';
import styles from './CapabilityMap.module.css';

/**
 * CapabilityMap · Task 4 — capability cards (status ring/badge, evidence chips,
 * growth nudge).
 *
 * Task 5 will prepend the SVG star-river above the cards list; this component
 * handles only the card layer.
 *
 * Status semantics:
 *   strong    = full signature-cyan ring  (2+ evidence, at least one artifact)
 *   partial   = dimmer ring               (some evidence but not strong)
 *   direction = muted hairline ring       (aspirational, no backing evidence)
 *
 * Evidence chip routing:
 *   education  → /education
 *   experience → /experience
 *   work       → /works
 *   artifact   → button: IndexedDB blob open-in-new-tab (mirrors VerifiedArtifactCard)
 *
 * SSR-safe: getArtifactObjectUrl is only called from click handlers, never at
 * render time, so it never touches IndexedDB during server-side rendering.
 */
export function CapabilityMap({
  capabilities,
  profile: _profile,
}: {
  capabilities: BeginnerCapability[];
  profile: BeginnerProfile;
}) {
  if (capabilities.length === 0) {
    return (
      <div className={styles.emptyState} role="status">
        <p className={styles.emptyPrompt}>
          Build your capability map — Loom reads your experience, work, and proof to map what you can do.
        </p>
      </div>
    );
  }

  return (
    <ul className={styles.cardList} role="list">
      {capabilities.map((cap) => (
        <CapabilityCard key={cap.id} capability={cap} />
      ))}
    </ul>
  );
}

// ── CapabilityCard ────────────────────────────────────────────────────────────

function CapabilityCard({ capability }: { capability: BeginnerCapability }) {
  const statusLabel = STATUS_LABEL[capability.status];

  return (
    <li className={`${styles.card} ${styles[capability.status]}`} data-status={capability.status}>
      {/* Status ring + accessible label */}
      <div className={styles.statusBadge} aria-label={`Capability status: ${statusLabel}`}>
        <span className={styles.statusRing} aria-hidden="true" />
        <span className={styles.statusLabel}>{statusLabel}</span>
      </div>

      {/* Capability heading */}
      <strong className={styles.capLabel}>{capability.label}</strong>

      {/* Optional note */}
      {capability.note && (
        <p className={styles.note}>{capability.note}</p>
      )}

      {/* Evidence chips */}
      {capability.evidence.length > 0 && (
        <ul className={styles.evidenceList} aria-label="Evidence">
          {capability.evidence.map((ev, idx) => (
            <EvidenceChip key={`${ev.kind}-${ev.refId}-${idx}`} evidence={ev} />
          ))}
        </ul>
      )}

      {/* Growth nudge */}
      {capability.growth && (
        <p className={styles.growth}>
          <span aria-hidden="true">→ </span>
          {capability.growth}
        </p>
      )}
    </li>
  );
}

// ── EvidenceChip ──────────────────────────────────────────────────────────────

const EVIDENCE_ROUTE: Record<Exclude<CapabilityEvidence['kind'], 'artifact'>, string> = {
  education: '/education',
  experience: '/experience',
  work: '/works',
};

function EvidenceChip({ evidence }: { evidence: CapabilityEvidence }) {
  if (evidence.kind === 'artifact') {
    return <ArtifactChip refId={evidence.refId} label={evidence.label} />;
  }

  const href = EVIDENCE_ROUTE[evidence.kind];
  return (
    <li className={styles.evidenceItem}>
      <Link href={href} className={styles.evidenceLink}>
        {evidence.label}
      </Link>
    </li>
  );
}

// ── ArtifactChip ──────────────────────────────────────────────────────────────

/**
 * Mirrors VerifiedArtifactCard's open behavior exactly:
 *  1. getArtifactObjectUrl(id) → null | url
 *  2. If null: set unavailable (disabled, "file unavailable")
 *  3. If url: window.open(url, '_blank', 'noopener,noreferrer')
 *  4. If window.open returns null (popup blocked): window.location.href = url
 */
function ArtifactChip({ refId, label }: { refId: string; label: string }) {
  const [chipStatus, setChipStatus] = useState<'idle' | 'opening' | 'unavailable'>('idle');

  async function handleOpen() {
    if (chipStatus === 'opening') return;
    setChipStatus('opening');
    try {
      const url = await getArtifactObjectUrl(refId);
      if (!url) {
        setChipStatus('unavailable');
        return;
      }
      const win = typeof window !== 'undefined'
        ? window.open(url, '_blank', 'noopener,noreferrer')
        : null;
      if (!win) {
        // Popup blocked — navigate same tab as fallback.
        if (typeof window !== 'undefined') window.location.href = url;
      }
      setChipStatus('idle');
    } catch {
      setChipStatus('unavailable');
    }
  }

  const unavailable = chipStatus === 'unavailable';

  return (
    <li className={styles.evidenceItem}>
      <button
        type="button"
        className={`${styles.evidenceButton} ${unavailable ? styles.evidenceUnavailable : ''}`}
        onClick={handleOpen}
        disabled={chipStatus === 'opening' || unavailable}
        aria-label={unavailable ? `${label} — file unavailable` : `Open ${label}`}
      >
        {unavailable ? (
          <span>{label} — file unavailable</span>
        ) : (
          <>
            <span>{label}</span>
            <span className={styles.openArrow} aria-hidden="true"> Open ↗</span>
          </>
        )}
      </button>
    </li>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<CapabilityStatus, string> = {
  strong: 'Strong',
  partial: 'Partial',
  direction: 'Direction',
};
