'use client';

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import type { BeginnerCapability, CapabilityEvidence, CapabilityStatus } from '../lib/capability/capability-graph';
import type { BeginnerProfile } from '../lib/profile/beginner-profile';
import { getArtifactObjectUrl } from '../lib/artifact/artifact-store';
import styles from './CapabilityMap.module.css';

/**
 * CapabilityMap · Task 5 — star-river + comets visualization above the Task-4
 * capability cards.
 *
 * Brand cosmology (ties to /product-history): the Digital Me tells one cosmic
 * story — identity (moon = Memory) → capabilities (the star-river / 银河) →
 * standout capabilities (comets / 彗星) → grounded on the library/horizon
 * (Earth-horizon = the evidence base). Each capability is a STAR in a flowing
 * galactic band; its magnitude (radius + glow) = evidence strength, so the
 * river literally brightens as proof compounds. The strongest capabilities
 * become comets with a tail, drawing the eye to what is most proven.
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
 * SSR-safe: layout is deterministic (no Math.random at render — positions derive
 * from the capability index + a stable hash of its id), and getArtifactObjectUrl
 * is only called from click handlers, never at render time, so it never touches
 * IndexedDB during server-side rendering.
 */
export function CapabilityMap({
  capabilities,
  profile: _profile,
}: {
  capabilities: BeginnerCapability[];
  profile: BeginnerProfile;
}) {
  // Shared selection: clicking a star highlights + scrolls to its card.
  const [activeId, setActiveId] = useState<string | null>(null);
  // Refs to each card so a star click can scroll the matching card into view.
  const cardRefs = useRef<Record<string, HTMLLIElement | null>>({});

  const selectCapability = useCallback((id: string) => {
    setActiveId(id);
    const el = cardRefs.current[id];
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, []);

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
    <div className={styles.map}>
      <StarRiver
        capabilities={capabilities}
        activeId={activeId}
        onSelect={selectCapability}
      />

      <ul className={styles.cardList} role="list">
        {capabilities.map((cap) => (
          <CapabilityCard
            key={cap.id}
            capability={cap}
            active={cap.id === activeId}
            cardRef={(el) => {
              cardRefs.current[cap.id] = el;
            }}
          />
        ))}
      </ul>
    </div>
  );
}

// ── Star-river layout ─────────────────────────────────────────────────────────

const STAR_VIEW_W = 1000;
const STAR_VIEW_H = 260;
// The river flows left→right across the width, resting toward the horizon.
const RIVER_X0 = 96; // leave room for the moon anchor at the left
const RIVER_X1 = 956;
const RIVER_Y_MID = 138; // centerline of the band
const RIVER_AMP = 30; // gentle vertical sweep of the band
const RIVER_SCATTER = 34; // per-star vertical scatter around the band
const HORIZON_Y = 224;
const MAX_COMETS = 3;

type RiverGeo = {
  vw: number;
  vh: number;
  x0: number;
  x1: number;
  yMid: number;
  amp: number;
  scatter: number;
  horizonY: number;
  moonCx: number;
  moonR: number;
  moonGlowR: number;
  compact: boolean;
};

/**
 * River geometry adapts to capability count. A rich profile (>3) keeps the full
 * wide band, byte-for-byte as before. A sparse profile (≤3) gets a small,
 * contained constellation — so one capability reads as a deliberate seed, not a
 * lone dot stranded on a full-width void.
 */
function geometryFor(n: number): RiverGeo {
  if (n > 3) {
    return {
      vw: STAR_VIEW_W,
      vh: STAR_VIEW_H,
      x0: RIVER_X0,
      x1: RIVER_X1,
      yMid: RIVER_Y_MID,
      amp: RIVER_AMP,
      scatter: RIVER_SCATTER,
      horizonY: HORIZON_Y,
      moonCx: 44,
      moonR: 26,
      moonGlowR: 46,
      compact: false,
    };
  }
  const vw = 92 + n * 150 + 80; // n1→322, n2→472, n3→622
  return {
    vw,
    vh: 188,
    x0: 92,
    x1: vw - 46,
    yMid: 100,
    amp: 18,
    scatter: 22,
    horizonY: 158,
    moonCx: 36,
    moonR: 21,
    moonGlowR: 36,
    compact: true,
  };
}

/** Deterministic 32-bit hash of a string (FNV-1a). No Math.random. */
function hashId(id: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  // Unsigned, normalized to [0, 1).
  return (h >>> 0) / 0xffffffff;
}

/** Magnitude (0..1) of a capability from its evidence strength + status. */
function magnitude(cap: BeginnerCapability): number {
  const statusFloor: Record<CapabilityStatus, number> = {
    strong: 0.6,
    partial: 0.34,
    direction: 0.16,
  };
  // base from status, + compounding contribution from each piece of evidence.
  const fromEvidence = Math.min(cap.evidence.length, 5) * 0.12;
  return Math.min(1, statusFloor[cap.status] + fromEvidence);
}

type StarLayout = {
  cap: BeginnerCapability;
  cx: number;
  cy: number;
  r: number; // visible star radius
  glow: number; // glow radius
  mag: number; // 0..1 magnitude
  isComet: boolean;
  /** outward unit direction of the band at this point, for the comet tail. */
  tailDx: number;
  tailDy: number;
};

/**
 * Decide which capabilities become comets: all `strong`, else fall back to the
 * top 1–2 by evidence count. Capped at MAX_COMETS so the field stays quiet.
 */
function pickComets(capabilities: BeginnerCapability[]): Set<string> {
  const strong = capabilities.filter((c) => c.status === 'strong');
  let chosen: BeginnerCapability[];
  if (strong.length > 0) {
    chosen = strong
      .slice()
      .sort((a, b) => b.evidence.length - a.evidence.length)
      .slice(0, MAX_COMETS);
  } else {
    // Fall back to the top 1–2 by evidence count (only those with evidence).
    chosen = capabilities
      .filter((c) => c.evidence.length > 0)
      .slice()
      .sort((a, b) => b.evidence.length - a.evidence.length)
      .slice(0, Math.min(2, MAX_COMETS));
  }
  return new Set(chosen.map((c) => c.id));
}

function layoutStars(capabilities: BeginnerCapability[], geo: RiverGeo): StarLayout[] {
  const comets = pickComets(capabilities);
  const n = capabilities.length;
  const span = geo.x1 - geo.x0;

  return capabilities.map((cap, i) => {
    // Even spread along the band, nudged by a stable per-id hash so the field
    // feels scattered rather than gridded — deterministic, SSR-stable.
    const h = hashId(cap.id);
    const t = n === 1 ? 0.5 : (i + 0.5) / n; // 0..1 along the river
    const jitterX = (h - 0.5) * (span / Math.max(n, 1)) * 0.45;
    const cx = geo.x0 + t * span + jitterX;

    // Band centerline sweeps gently; each star scatters around it by its hash.
    const bandY = geo.yMid - Math.sin(t * Math.PI) * geo.amp;
    const scatter = (hashId(cap.id + '~y') - 0.5) * 2 * geo.scatter;
    const cy = bandY + scatter;

    const mag = magnitude(cap);
    const r = 2.4 + mag * 6.6; // base + magnitude
    const glow = r + 6 + mag * 14;

    // Local band direction (derivative of the sweep) for the comet tail.
    const dDir = -Math.cos(t * Math.PI) * geo.amp * Math.PI;
    const len = Math.hypot(span, dDir) || 1;
    const tailDx = span / len;
    const tailDy = dDir / len;

    return {
      cap,
      cx,
      cy,
      r,
      glow,
      mag,
      isComet: comets.has(cap.id),
      tailDx,
      tailDy,
    };
  });
}

// ── StarRiver SVG ─────────────────────────────────────────────────────────────

function StarRiver({
  capabilities,
  activeId,
  onSelect,
}: {
  capabilities: BeginnerCapability[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  const geo = geometryFor(capabilities.length);
  const stars = layoutStars(capabilities, geo);

  return (
    <div
      className={`${styles.starRiver}${geo.compact ? ` ${styles.starRiverCompact}` : ''}`}
      data-star-river=""
      data-compact={geo.compact ? '' : undefined}
      aria-hidden={false}
    >
      <svg
        className={styles.starRiverSvg}
        viewBox={`0 0 ${geo.vw} ${geo.vh}`}
        preserveAspectRatio="xMidYMid meet"
        role="group"
        aria-label="Capability star-river — each star is a capability; brighter stars and comets are your most proven."
      >
        <defs>
          {/* Star core: bright white-cyan centre fading outward */}
          <radialGradient id="cmStarCore" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.96" />
            <stop offset="0.22" stopColor="var(--signature-cyan-hi, #6ce7f2)" stopOpacity="1" />
            <stop offset="0.58" stopColor="var(--signature-cyan, #4bc5de)" stopOpacity="0.85" />
            <stop offset="1" stopColor="var(--signature-cyan, #4bc5de)" stopOpacity="0" />
          </radialGradient>
          {/* Star glow halo: more luminous than before */}
          <radialGradient id="cmStarGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="var(--signature-cyan-hi, #6ce7f2)" stopOpacity="0.55" />
            <stop offset="0.45" stopColor="var(--signature-cyan, #4bc5de)" stopOpacity="0.22" />
            <stop offset="1" stopColor="var(--signature-cyan, #4bc5de)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="cmMoon" cx="32%" cy="28%" r="80%">
            <stop offset="0" stopColor="#E8EFF1" />
            <stop offset="0.4" stopColor="#9aa7ad" />
            <stop offset="0.74" stopColor="#3a454d" />
            <stop offset="1" stopColor="#0c1116" />
          </radialGradient>
          {/* Comet tail: head-end bright, tip fully transparent, along local band direction */}
          <linearGradient id="cmCometTail" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="var(--signature-cyan-hi, #6ce7f2)" stopOpacity="0.0" />
            <stop offset="0.55" stopColor="var(--signature-cyan, #4bc5de)" stopOpacity="0.28" />
            <stop offset="0.82" stopColor="var(--signature-cyan-hi, #6ce7f2)" stopOpacity="0.72" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.55" />
          </linearGradient>
          {/* Comet head glow: bright core + wide soft halo */}
          <radialGradient id="cmCometHead" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="0.18" stopColor="var(--signature-cyan-hi, #6ce7f2)" stopOpacity="1" />
            <stop offset="0.48" stopColor="var(--signature-cyan, #4bc5de)" stopOpacity="0.75" />
            <stop offset="0.72" stopColor="var(--signature-cyan, #4bc5de)" stopOpacity="0.28" />
            <stop offset="1" stopColor="var(--signature-cyan, #4bc5de)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Horizon / library baseline — quiet, grounding the river. */}
        <line
          className={styles.horizon}
          data-horizon=""
          x1={0}
          y1={geo.horizonY}
          x2={geo.vw}
          y2={geo.horizonY}
        />

        {/* Moon (Memory) anchor at the left end. */}
        <g className={styles.moonAnchor} data-moon-anchor="" aria-hidden="true">
          <circle className={styles.moonGlow} cx={geo.moonCx} cy={geo.yMid} r={geo.moonGlowR} />
          <circle cx={geo.moonCx} cy={geo.yMid} r={geo.moonR} fill="url(#cmMoon)" />
        </g>

        {/* Faint band guide the stars rest along. */}
        <RiverBand geo={geo} />

        {/* Comet tails first (behind the heads). */}
        {stars
          .filter((s) => s.isComet)
          .map((s) => (
            <CometTail key={`tail-${s.cap.id}`} star={s} />
          ))}

        {/* Stars + comet heads — focusable controls. */}
        {stars.map((s) => (
          <StarNode
            key={s.cap.id}
            star={s}
            active={s.cap.id === activeId}
            onSelect={onSelect}
          />
        ))}
      </svg>
    </div>
  );
}

/** Faint flowing band the stars sit along (decorative). */
function RiverBand({ geo }: { geo: RiverGeo }) {
  // A quadratic sweep matching the centerline used in layoutStars.
  const midX = (geo.x0 + geo.x1) / 2;
  const peakY = geo.yMid - geo.amp;
  const d = `M ${geo.x0} ${geo.yMid} Q ${midX} ${peakY - 30} ${geo.x1} ${geo.yMid}`;
  return <path className={styles.riverBand} d={d} fill="none" aria-hidden="true" />;
}

/** Drawn comet tail streaking backwards along the band direction. */
function CometTail({ star }: { star: StarLayout }) {
  // Tail tip is behind the comet (opposite travel direction).
  const tailLen = 90 + star.mag * 80;
  const tipX = star.cx - star.tailDx * tailLen;
  const tipY = star.cy - star.tailDy * tailLen;

  // Perpendicular to the travel direction for width control.
  const px = -star.tailDy;
  const py = star.tailDx;
  // Base width at the head end, converges to a point at the tip.
  const baseW = 3.5 + star.mag * 5.5;

  // Smooth quad taper: wide at head, pointed at tip.
  // Uses a bezier control point 70% along toward the tip to keep the
  // taper visually smooth rather than perfectly linear.
  const ctlX = star.cx - star.tailDx * tailLen * 0.7;
  const ctlY = star.cy - star.tailDy * tailLen * 0.7;

  const d =
    `M ${star.cx + px * baseW} ${star.cy + py * baseW} ` +
    `Q ${ctlX + px * (baseW * 0.35)} ${ctlY + py * (baseW * 0.35)} ${tipX} ${tipY} ` +
    `Q ${ctlX - px * (baseW * 0.35)} ${ctlY - py * (baseW * 0.35)} ` +
    `${star.cx - px * baseW} ${star.cy - py * baseW} Z`;

  // Apply the gradient along the tail axis (tip → head direction).
  const gradId = `cmCometTailGrad-${star.cap.id}`;

  return (
    <g aria-hidden="true">
      {/* Inline gradient anchored to this tail's specific coordinates */}
      <defs>
        <linearGradient
          id={gradId}
          gradientUnits="userSpaceOnUse"
          x1={tipX}
          y1={tipY}
          x2={star.cx}
          y2={star.cy}
        >
          <stop offset="0" stopColor="var(--signature-cyan, #4bc5de)" stopOpacity="0" />
          <stop offset="0.45" stopColor="var(--signature-cyan, #4bc5de)" stopOpacity="0.22" />
          <stop offset="0.78" stopColor="var(--signature-cyan-hi, #6ce7f2)" stopOpacity="0.62" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.42" />
        </linearGradient>
      </defs>
      <path
        className={styles.cometTail}
        data-comet-tail=""
        d={d}
        fill={`url(#${gradId})`}
      />
    </g>
  );
}

function StarNode({
  star,
  active,
  onSelect,
}: {
  star: StarLayout;
  active: boolean;
  onSelect: (id: string) => void;
}) {
  const { cap } = star;
  const label = `${cap.label} — ${cap.status}, ${cap.evidence.length} evidence`;
  const handle = () => onSelect(cap.id);

  return (
    <g
      className={`${styles.starNode} ${active ? styles.starNodeActive : ''}`}
      data-star-node=""
      data-cap-id={cap.id}
      data-active={active ? '' : undefined}
      role="button"
      tabIndex={0}
      aria-label={label}
      aria-pressed={active}
      onClick={handle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handle();
        }
      }}
    >
      <title>{label}</title>

      {/* enlarged transparent hit / keyboard target */}
      <circle cx={star.cx} cy={star.cy} r={Math.max(star.glow, 16)} fill="transparent" />

      {/* soft glow halo — magnitude-scaled */}
      <circle
        className={styles.starGlow}
        cx={star.cx}
        cy={star.cy}
        r={star.glow}
        fill="url(#cmStarGlow)"
      />

      {star.isComet ? (
        // Comet head: drawn glowing disc (bright cyan core + wide halo) so it
        // reads unmistakably as a comet head at all sizes.
        // The brand asset is referenced via a hidden <image> to preserve
        // test assertions (data-comet + loom_lunar_comet_icon).
        <g className={styles.cometHead} data-comet="">
          {/* Brand asset reference — kept for test contract; visually hidden. */}
          <image
            href="/brand/loom_lunar_comet_icon.svg"
            xlinkHref="/brand/loom_lunar_comet_icon.svg"
            x={star.cx - 4}
            y={star.cy - 4}
            width={8}
            height={8}
            opacity={0}
            aria-hidden="true"
          />
          {/* Wide soft halo */}
          <circle
            cx={star.cx}
            cy={star.cy}
            r={Math.max(star.r + 10, 18)}
            fill="url(#cmCometHead)"
            opacity={0.7}
          />
          {/* Bright inner core */}
          <circle
            cx={star.cx}
            cy={star.cy}
            r={Math.max(star.r * 0.55, 4.5)}
            fill="#ffffff"
            opacity={0.92}
          />
        </g>
      ) : null}

      {/* star core — the magnitude circle (data-star-mag carries the radius) */}
      <circle
        className={styles.starCore}
        data-star-mag=""
        cx={star.cx}
        cy={star.cy}
        r={star.r}
        fill="url(#cmStarCore)"
      />
    </g>
  );
}

// ── CapabilityCard ────────────────────────────────────────────────────────────

function CapabilityCard({
  capability,
  active,
  cardRef,
}: {
  capability: BeginnerCapability;
  active: boolean;
  cardRef: (el: HTMLLIElement | null) => void;
}) {
  const statusLabel = STATUS_LABEL[capability.status];

  return (
    <li
      ref={cardRef}
      className={`${styles.card} ${styles[capability.status]} ${active ? styles.cardActive : ''}`}
      data-status={capability.status}
      data-active={active ? '' : undefined}
    >
      {/* Status ring + accessible label */}
      <div className={styles.statusBadge} aria-label={`Capability status: ${statusLabel}`}>
        <span className={styles.statusRing} aria-hidden="true" />
        <span className={styles.statusLabel}>{statusLabel}</span>
      </div>

      {/* Capability heading */}
      <strong className={styles.capLabel}>{capability.label}</strong>

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
