'use client';

/**
 * LandingShowcase — the "What you're weaving" section. It SHOWS a finished LOOM
 * (a fictional sample identity + a capability star-river) so a stranger grasps
 * the product without prose and without exposing the owner's data. Purely
 * decorative: the star-river adapts the deterministic layout/comet math from
 * components/CapabilityMap.tsx but drops all interactivity, IndexedDB, and
 * cards. The SVG is aria-hidden; twinkle is reduced-motion-gated in CSS.
 *
 * Layout: an identity row on top (initials + name/role + proof chips), then the
 * star-river full-width below so the constellation has room to breathe (a cramped
 * half-width river collided its labels).
 */

import { SHOWCASE_PERSONA, SHOWCASE_CAPABILITIES } from '../lib/onboarding/showcase-persona';
import type { BeginnerCapability } from '../lib/capability/capability-graph';
import styles from './LandingShowcase.module.css';

const VW = 1000;
const VH = 240;

// The river curve (quadratic Bézier). Stars are seated ON this curve so the
// constellation reads as a flowing river and labels split cleanly into two rows
// (above the curve / below it) instead of scattering and colliding.
const P0 = { x: 96, y: VH * 0.6 };
const C = { x: VW * 0.4, y: VH * 0.22 };
const P1 = { x: VW - 40, y: VH * 0.5 };
const bez = (u: number, a: number, b: number, c: number) =>
  (1 - u) * (1 - u) * a + 2 * (1 - u) * u * b + u * u * c;

/** Deterministic FNV-1a → [0,1) jitter. No Math.random → SSR-stable layout. */
function hash01(id: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i += 1) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return ((h >>> 0) % 1000) / 1000;
}

function magnitudeOf(cap: BeginnerCapability): number {
  const ev = cap.evidence?.length ?? 0;
  if (cap.status === 'strong') return Math.min(1, 0.72 + ev * 0.08);
  if (cap.status === 'partial') return 0.46 + Math.min(ev, 2) * 0.04;
  return 0.22;
}

type Star = { cap: BeginnerCapability; x: number; y: number; r: number; mag: number; above: boolean };

function layoutStars(caps: BeginnerCapability[]): Star[] {
  const n = caps.length;
  return caps.map((cap, i) => {
    const mag = magnitudeOf(cap);
    // Even spread along the curve, leaving room for the moon at the source.
    const u = n <= 1 ? 0.5 : 0.14 + (i / (n - 1)) * 0.82;
    const x = bez(u, P0.x, C.x, P1.x);
    const y = bez(u, P0.y, C.y, P1.y) + (hash01(`${cap.id}:y`) - 0.5) * 14;
    const r = 4 + mag * 9;
    // Alternate labels above/below the curve so neighbours never collide.
    return { cap, x, y, r, mag, above: i % 2 === 0 };
  });
}

const INITIALS = SHOWCASE_PERSONA.name
  .split(/\s+/)
  .map((w) => w[0])
  .join('')
  .slice(0, 2)
  .toUpperCase();

export function LandingShowcase() {
  const stars = layoutStars(SHOWCASE_CAPABILITIES);
  const comets = [...stars]
    .filter((s) => s.cap.status === 'strong')
    .sort((a, b) => b.mag - a.mag)
    .slice(0, 2);

  return (
    <section className={styles.showcase} aria-label="An example LOOM">
      <div className={styles.inner}>
        <p className={styles.eyebrow}>What you’re weaving</p>
        <h2 className={styles.heading}>A self that can speak for you.</h2>

        <div className={styles.stage}>
          <div className={styles.panel}>
            <header className={styles.identity}>
              <span className={styles.avatar} aria-hidden>
                {INITIALS}
              </span>
              <span className={styles.idText}>
                <span className={styles.name}>{SHOWCASE_PERSONA.name}</span>
                <span className={styles.role}>
                  {SHOWCASE_PERSONA.role} · {SHOWCASE_PERSONA.location}
                </span>
              </span>
              <span className={styles.chips}>
                <span className={styles.chip}>{SHOWCASE_PERSONA.sourcesCount} sources</span>
                <span className={`${styles.chip} ${styles.chipVerified}`}>
                  {SHOWCASE_PERSONA.artifactsVerified} artifacts verified
                </span>
              </span>
            </header>

            <p className={styles.summary}>{SHOWCASE_PERSONA.summary}</p>

            <div className={styles.river}>
              <p className={styles.riverLabel}>Capability star-river</p>
              <svg
                className={styles.riverSvg}
                viewBox={`0 0 ${VW} ${VH}`}
                preserveAspectRatio="xMidYMid meet"
                aria-hidden="true"
              >
                <defs>
                  <radialGradient id="lsStar" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.96" />
                    <stop offset="22%" stopColor="var(--signature-cyan-hi)" />
                    <stop offset="58%" stopColor="var(--signature-cyan)" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="var(--signature-cyan)" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="lsGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="var(--signature-cyan-hi)" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="var(--signature-cyan-hi)" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="lsMoon" cx="38%" cy="32%" r="72%">
                    <stop offset="0%" stopColor="#eef3f6" />
                    <stop offset="60%" stopColor="#c7d4db" />
                    <stop offset="100%" stopColor="#8aa0ac" />
                  </radialGradient>
                  <linearGradient id="lsComet" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="var(--signature-cyan)" stopOpacity="0" />
                    <stop offset="70%" stopColor="var(--signature-cyan-hi)" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="#eafcfb" stopOpacity="0.9" />
                  </linearGradient>
                </defs>

                {/* flowing river band — the curve the stars are seated on */}
                <path
                  d={`M${P0.x} ${P0.y} Q ${C.x} ${C.y} ${P1.x} ${P1.y}`}
                  fill="none"
                  stroke="var(--signature-cyan)"
                  strokeOpacity="0.08"
                  strokeWidth="22"
                  strokeLinecap="round"
                />

                {/* links between consecutive capabilities */}
                {stars.slice(0, -1).map((s, i) => (
                  <line
                    key={`link-${s.cap.id}`}
                    x1={s.x}
                    y1={s.y}
                    x2={stars[i + 1].x}
                    y2={stars[i + 1].y}
                    stroke="var(--signature-cyan-hi)"
                    strokeOpacity="0.16"
                    strokeWidth="1"
                  />
                ))}

                {/* moon anchor (Memory) at the river's source */}
                <circle cx="44" cy={P0.y} r="24" fill="url(#lsMoon)" />

                {/* comets + star bodies — luminous layers screen-blended so cyan
                    accumulates as a jewel rising from the dark, mirroring the real
                    capability star-river. Labels are kept OUT of the blend below. */}
                <g style={{ mixBlendMode: 'screen' }}>
                  {/* comets — the standout strong capabilities */}
                  {comets.map((s) => (
                    <path
                      key={`comet-${s.cap.id}`}
                      d={`M${s.x - 130} ${s.y - 30} Q ${s.x - 55} ${s.y - 10} ${s.x} ${s.y}`}
                      fill="none"
                      stroke="url(#lsComet)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  ))}

                  {/* star glow + core */}
                  {stars.map((s) => (
                    <g key={s.cap.id} className={styles.star}>
                      <circle cx={s.x} cy={s.y} r={s.r * 3.4} fill="url(#lsGlow)" />
                      <circle cx={s.x} cy={s.y} r={s.r} fill="url(#lsStar)" />
                    </g>
                  ))}
                </g>

                {/* labels — normal blend so the mono text stays crisp + legible */}
                {stars.map((s) => (
                  <text
                    key={`label-${s.cap.id}`}
                    x={s.x}
                    y={s.above ? s.y - s.r - 12 : s.y + s.r + 22}
                    textAnchor="middle"
                    className={styles.starLabel}
                  >
                    {s.cap.label}
                  </text>
                ))}
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
