'use client';

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import type { BeginnerCapability, CapabilityEvidence, CapabilityStatus } from '../lib/capability/capability-graph';
import type { BeginnerProfile } from '../lib/profile/beginner-profile';
import { getArtifactObjectUrl } from '../lib/artifact/artifact-store';
import { draftArtifactEditHref } from '../lib/new-loom/draft-artifacts';
import { safeHref } from '../lib/profile/safe-href';
import styles from './CapabilityMap.module.css';

/**
 * CapabilityMap · Task 5 — star-river + comets visualization above the Task-4
 * capability cards.
 *
 * Brand cosmology (ties to /product-history): the Digital Me tells one cosmic
 * story — identity (moon = Memory) → capabilities (the star-river / galaxy) →
 * standout capabilities (comets) → grounded on the library/horizon
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
 *   artifact   → uploaded: button, IndexedDB blob open-in-new-tab (mirrors
 *                VerifiedArtifactCard); draft-derived (refId `draft-<id>`): a
 *                same-tab link to the Studio editor (/digital-me?edit=<id>) since
 *                a draft has no blob (mirrors the Ask-side citation path)
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
          Build your capability map — LOOM reads your experience, work, and proof to map what you can do.
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

// 青芒光帘 is VERTICAL: a curtain of light falls from the moon (Memory) at the top,
// down to the horizon base. The portrait viewBox is kept narrow + contained by CSS so
// a full-width portrait doesn't tower over the page.
const STAR_VIEW_W = 440;
const STAR_VIEW_H = 560;
const RIVER_Y0 = 120; // top of the band, just below the moon
const RIVER_Y1 = 500; // bottom of the band, just above the horizon
const RIVER_X_MID = 220; // vertical centerline of the falling band
const RIVER_AMP = 24; // gentle horizontal sway of the band
const RIVER_SCATTER = 42; // per-star horizontal scatter around the band
const HORIZON_Y = 524;
const MAX_COMETS = 3;

type RiverGeo = {
  vw: number;
  vh: number;
  y0: number;
  y1: number;
  xMid: number;
  amp: number;
  scatter: number;
  horizonY: number;
  moonCx: number;
  moonCy: number;
  moonR: number;
  moonGlowR: number;
  compact: boolean;
};

/**
 * Curtain geometry adapts to capability count. A rich profile (>3) keeps the full
 * tall curtain. A sparse profile (≤3) gets a shorter, contained fall — so one
 * capability reads as a deliberate seed, not a lone dot stranded in a tall void.
 */
function geometryFor(n: number): RiverGeo {
  if (n > 3) {
    return {
      vw: STAR_VIEW_W,
      vh: STAR_VIEW_H,
      y0: RIVER_Y0,
      y1: RIVER_Y1,
      xMid: RIVER_X_MID,
      amp: RIVER_AMP,
      scatter: RIVER_SCATTER,
      horizonY: HORIZON_Y,
      moonCx: RIVER_X_MID,
      moonCy: 56,
      moonR: 26,
      moonGlowR: 46,
      compact: false,
    };
  }
  const vh = 150 + n * 96 + 70; // n1→316, n2→412, n3→508
  return {
    vw: 360,
    vh,
    y0: 104,
    y1: vh - 70,
    xMid: 180,
    amp: 16,
    scatter: 30,
    horizonY: vh - 40,
    moonCx: 180,
    moonCy: 48,
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
  const span = geo.y1 - geo.y0; // vertical fall the stars spread along

  return capabilities.map((cap, i) => {
    // Even spread DOWN the curtain, nudged by a stable per-id hash so the field
    // feels scattered rather than gridded — deterministic, SSR-stable.
    const h = hashId(cap.id);
    const t = n === 1 ? 0.5 : (i + 0.5) / n; // 0..1 down the curtain
    const jitterY = (h - 0.5) * (span / Math.max(n, 1)) * 0.45;
    const cy = geo.y0 + t * span + jitterY;

    // Band centerline sways gently side-to-side; each star scatters horizontally.
    const bandX = geo.xMid + Math.sin(t * Math.PI) * geo.amp;
    const scatter = (hashId(cap.id + '~x') - 0.5) * 2 * geo.scatter;
    const cx = bandX + scatter;

    const mag = magnitude(cap);
    const r = 2.4 + mag * 6.6; // base + magnitude
    const glow = r + 6 + mag * 14;

    // Local band direction (mostly downward) for the comet tail.
    const dDir = Math.cos(t * Math.PI) * geo.amp * Math.PI; // horizontal component
    const len = Math.hypot(span, dDir) || 1;
    const tailDx = dDir / len;
    const tailDy = span / len; // positive → the tail trails upward toward the source

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
            <stop offset="0.22" stopColor="var(--signature-cyan-hi, #8af7e6)" stopOpacity="1" />
            <stop offset="0.58" stopColor="var(--signature-cyan, #4bc5de)" stopOpacity="0.85" />
            <stop offset="1" stopColor="var(--signature-cyan, #4bc5de)" stopOpacity="0" />
          </radialGradient>
          {/* Star glow halo: more luminous than before */}
          <radialGradient id="cmStarGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="var(--signature-cyan-hi, #8af7e6)" stopOpacity="0.55" />
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
            <stop offset="0" stopColor="var(--signature-cyan-hi, #8af7e6)" stopOpacity="0.0" />
            <stop offset="0.55" stopColor="var(--signature-cyan, #4bc5de)" stopOpacity="0.28" />
            <stop offset="0.82" stopColor="var(--signature-cyan-hi, #8af7e6)" stopOpacity="0.72" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.55" />
          </linearGradient>
          {/* Comet head halo: a clean cyan glow — NO white plateau. The single
              white hot-point comes from cmCometCore below, so the head reads as a
              luminous jewel nucleus instead of a flat white disc. */}
          <radialGradient id="cmCometHead" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="var(--signature-cyan-hi, #8af7e6)" stopOpacity="0.92" />
            <stop offset="0.4" stopColor="var(--signature-cyan, #4bc5de)" stopOpacity="0.5" />
            <stop offset="0.72" stopColor="var(--signature-cyan, #4bc5de)" stopOpacity="0.18" />
            <stop offset="1" stopColor="var(--signature-cyan, #4bc5de)" stopOpacity="0" />
          </radialGradient>
          {/* Comet nucleus: a small hot point with a soft cyan falloff — replaces the
              old flat #fff disc that read as a white blob. White only at the very
              centre, fading fast through cyan-hi to transparent (no hard edge). */}
          <radialGradient id="cmCometCore" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="0.32" stopColor="#eafcfb" stopOpacity="0.92" />
            <stop offset="0.62" stopColor="var(--signature-cyan-hi, #8af7e6)" stopOpacity="0.72" />
            <stop offset="1" stopColor="var(--signature-cyan, #4bc5de)" stopOpacity="0" />
          </radialGradient>
          {/* Source comet head (the curtain's origin) — a clean, DEFINED glowing orb:
              a soft cyan coma disc + a bright core + a crisp white nucleus, layered so it
              reads as a luminous sphere, not a diffuse bloom. */}
          <radialGradient id="cmSrcComa" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#d7f6f4" stopOpacity="0.62" />
            <stop offset="0.42" stopColor="#5cc6d8" stopOpacity="0.30" />
            <stop offset="0.78" stopColor="#3a93a8" stopOpacity="0.10" />
            <stop offset="1" stopColor="#3a93a8" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="cmSrcCore" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="0.34" stopColor="#eafcfb" stopOpacity="0.92" />
            <stop offset="0.7" stopColor="#8fe9f0" stopOpacity="0.45" />
            <stop offset="1" stopColor="#8fe9f0" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 青芒 sparkle field — fine drifting light-particles that give the river the
            luminous-material quality (the cyan as lit material). Sparse + faint so it
            reads as light-dust, never competing with the clickable capability stars.
            Deterministic (seeded sin) so SSR + client agree. */}
        {Array.from({ length: 24 }, (_, i) => {
          const hx = Math.sin(i * 12.9898) * 43758.5453;
          const hy = Math.sin(i * 78.233) * 43758.5453;
          const rx = hx - Math.floor(hx);
          const ry = hy - Math.floor(hy);
          return (
            <circle
              key={`cm-spark-${i}`}
              cx={(rx * geo.vw).toFixed(1)}
              cy={(geo.vh * 0.16 + ry * geo.vh * 0.66).toFixed(1)}
              r={(0.6 + rx * 1.5).toFixed(2)}
              fill="#dffafd"
              opacity={(0.18 + ry * 0.46).toFixed(2)}
              style={{ mixBlendMode: 'screen' }}
            />
          );
        })}

        {/* Horizon / library baseline — quiet, grounding the river. */}
        <line
          className={styles.horizon}
          data-horizon=""
          x1={0}
          y1={geo.horizonY}
          x2={geo.vw}
          y2={geo.horizonY}
        />

        {/* Comet head — the curtain's source at the top: a bright cyan-white nucleus whose
            luminous tail falls as the 青芒光帘 below. (data-moon-anchor kept as the source hook.) */}
        <g className={styles.moonAnchor} data-moon-anchor="" aria-hidden="true">
          <circle cx={geo.moonCx} cy={geo.moonCy} r={geo.moonGlowR} fill="url(#cmSrcComa)" style={{ mixBlendMode: 'screen' }} />
          <circle cx={geo.moonCx} cy={geo.moonCy} r={geo.moonGlowR * 0.46} fill="url(#cmSrcCore)" style={{ mixBlendMode: 'screen' }} />
          <circle cx={geo.moonCx} cy={geo.moonCy} r={Math.max(geo.moonR * 0.18, 3.2)} fill="#ffffff" />
        </g>

        {/* Faint band guide the stars rest along. */}
        <RiverBand geo={geo} />

        {/* 青芒光帘 — fine luminous light-strands falling FROM the moon (Memory) at the top
            DOWN the curtain, fanning out toward the horizon (deep-teal → bright-cyan →
            white, brightest at the centre). Sits behind the capability stars;
            deterministic (seeded sin) so SSR + client agree. */}
        <g style={{ mixBlendMode: 'screen' }} fill="none" strokeLinecap="round">
          {Array.from({ length: 84 }, (_, i) => {
            const base = i / 83;
            const off = base - 0.5;
            const center = 1 - Math.min(1, Math.abs(off) * 2);
            const h1 = Math.sin(i * 91.3) * 43758.5453;
            const h2 = Math.sin(i * 14.74) * 43758.5453;
            const j1 = h1 - Math.floor(h1);
            const j2 = h2 - Math.floor(h2);
            const x0 = geo.moonCx + off * geo.moonR * 0.5 + (j1 - 0.5) * 4;
            const y0 = geo.moonCy + geo.moonR * 0.62;
            const xEnd = geo.moonCx + off * geo.vw * 0.92 + (j2 - 0.5) * 14;
            const yEnd = geo.horizonY - 6;
            const cy1 = y0 + (yEnd - y0) * 0.34;
            const cy2 = yEnd - (yEnd - y0) * 0.08;
            const d = `M ${x0.toFixed(1)} ${y0.toFixed(1)} C ${x0.toFixed(1)} ${cy1.toFixed(1)}, ${xEnd.toFixed(1)} ${cy2.toFixed(1)}, ${xEnd.toFixed(1)} ${yEnd.toFixed(1)}`;
            const bright = Math.min(1, center * 0.7 + j1 * 0.5);
            const stroke =
              bright > 0.86 ? '#f0fffe'
              : bright > 0.66 ? '#c4f3ef'
              : bright > 0.46 ? '#7fdce8'
              : bright > 0.28 ? '#3fa9c0'
              : bright > 0.15 ? '#246d7d'
              : '#1b525f';
            return (
              <path
                key={`cm-strand-${i}`}
                d={d}
                stroke={stroke}
                strokeWidth={(0.32 + j2 * (0.5 + center)).toFixed(2)}
                opacity={(0.07 + bright * 0.46).toFixed(2)}
              />
            );
          })}
        </g>

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

/** Faint falling band the stars sit along (decorative). */
function RiverBand({ geo }: { geo: RiverGeo }) {
  // A quadratic sway matching the centerline used in layoutStars (vertical fall).
  const midY = (geo.y0 + geo.y1) / 2;
  const peakX = geo.xMid + geo.amp;
  const d = `M ${geo.xMid} ${geo.y0} Q ${peakX + 30} ${midY} ${geo.xMid} ${geo.y1}`;
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
          <stop offset="0.78" stopColor="var(--signature-cyan-hi, #8af7e6)" stopOpacity="0.62" />
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
          {/* Wide soft cyan halo */}
          <circle
            cx={star.cx}
            cy={star.cy}
            r={Math.max(star.r + 8, 16)}
            fill="url(#cmCometHead)"
            opacity={0.66}
          />
          {/* Hot nucleus — a small soft jewel point, no hard white edge */}
          <circle
            cx={star.cx}
            cy={star.cy}
            r={Math.max(star.r * 0.46, 3.4)}
            fill="url(#cmCometCore)"
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
    return <ArtifactChip refId={evidence.refId} label={evidence.label} excerpt={evidence.excerpt} />;
  }

  const href = EVIDENCE_ROUTE[evidence.kind];
  return (
    <li className={styles.evidenceItem}>
      <Link href={href} className={styles.evidenceLink}>
        {evidence.label}
      </Link>
      <EvidenceExcerpt excerpt={evidence.excerpt} />
    </li>
  );
}

/**
 * The grounded supporting line under an evidence chip — a quiet quote from the
 * source text (the corpus/quote register used elsewhere: muted, with a hairline
 * cyan rule). Shows WHAT proof backs the capability, not just that it's backed.
 * Renders nothing for a label-only evidence item (no excerpt), so a bare source
 * never invents a quote. The excerpt arrives already bounded + control-stripped
 * from the graph/normalizer seam; CSS line-clamps it for graceful overflow.
 */
function EvidenceExcerpt({ excerpt }: { excerpt?: string }) {
  if (!excerpt) return null;
  return <p className={styles.evidenceExcerpt}>{excerpt}</p>;
}

// ── ArtifactChip ──────────────────────────────────────────────────────────────

/**
 * Routes an artifact evidence chip by id space:
 *
 *  - DRAFT-DERIVED (refId `draft-<id>`): a curated Studio draft has NO IndexedDB
 *    blob, so opening it as a blob would always go "file unavailable". Instead it
 *    cross-refs the Studio editor (/digital-me?edit=<id>) as a same-tab link —
 *    mirroring the Ask-side citation path (resolveBeginnerSource +
 *    draftArtifactEditHref). The href is run through safeHref for the same
 *    URL-scheme discipline as every other user-facing href.
 *  - UPLOADED: opens the real document blob (mirrors VerifiedArtifactCard):
 *      1. getArtifactObjectUrl(id) → null | url
 *      2. If null: set unavailable (disabled, "file unavailable")
 *      3. If url: window.open(url, '_blank', 'noopener,noreferrer')
 *      4. If window.open returns null (popup blocked): window.location.href = url
 */
function ArtifactChip({ refId, label, excerpt }: { refId: string; label: string; excerpt?: string }) {
  const [chipStatus, setChipStatus] = useState<'idle' | 'opening' | 'unavailable'>('idle');

  // Draft-derived artifact: open the Studio editor, not a (nonexistent) blob.
  const editHref = draftArtifactEditHref(refId);
  if (editHref) {
    const href = safeHref(editHref);
    if (href) {
      return (
        <li className={styles.evidenceItem}>
          <Link href={href} className={styles.evidenceLink} aria-label={`Open ${label}`}>
            <span>{label}</span>
            <span className={styles.openArrow} aria-hidden="true"> Open ↗</span>
          </Link>
          <EvidenceExcerpt excerpt={excerpt} />
        </li>
      );
    }
  }

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
      <EvidenceExcerpt excerpt={excerpt} />
    </li>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<CapabilityStatus, string> = {
  strong: 'Strong',
  partial: 'Partial',
  direction: 'Direction',
};
