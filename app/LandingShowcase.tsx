'use client';

/**
 * LandingShowcase — the "What you're weaving" section. It SHOWS a finished LOOM
 * (a fictional sample identity + a capability star-river) so a stranger grasps
 * the product without prose and without exposing the owner's data. Purely
 * decorative: the star-river adapts the deterministic layout/comet math from
 * components/CapabilityMap.tsx but drops all interactivity, IndexedDB, and
 * cards. The SVG is aria-hidden; twinkle is reduced-motion-gated in CSS.
 */

import { SHOWCASE_PERSONA, SHOWCASE_CAPABILITIES } from '../lib/onboarding/showcase-persona';
import type { BeginnerCapability } from '../lib/capability/capability-graph';
import styles from './LandingShowcase.module.css';

const VW = 1000;
const VH = 300;

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
  return 0.2;
}

type Star = { cap: BeginnerCapability; x: number; y: number; r: number; mag: number };

function layoutStars(caps: BeginnerCapability[]): Star[] {
  const n = caps.length;
  return caps.map((cap, i) => {
    const mag = magnitudeOf(cap);
    const t = n <= 1 ? 0.5 : i / (n - 1);
    const x = 130 + t * (VW - 230);
    const y = 96 + hash01(`${cap.id}:y`) * 118;
    const r = 3 + mag * 7;
    return { cap, x, y, r, mag };
  });
}

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
            <div className={styles.grid}>
              <div className={styles.identity}>
                <div className={styles.avatar} aria-hidden />
                <p className={styles.name}>{SHOWCASE_PERSONA.name}</p>
                <p className={styles.role}>
                  {SHOWCASE_PERSONA.role} · {SHOWCASE_PERSONA.location}
                </p>
                <p className={styles.summary}>{SHOWCASE_PERSONA.summary}</p>
                <div className={styles.chips}>
                  <span className={styles.chip}>{SHOWCASE_PERSONA.sourcesCount} sources</span>
                  <span className={`${styles.chip} ${styles.chipVerified}`}>
                    {SHOWCASE_PERSONA.artifactsVerified} artifacts verified
                  </span>
                </div>
              </div>

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
                      <stop offset="0%" stopColor="#eafdff" />
                      <stop offset="45%" stopColor="var(--signature-cyan-hi)" />
                      <stop offset="100%" stopColor="var(--signature-cyan)" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient id="lsGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="var(--signature-cyan-hi)" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="var(--signature-cyan-hi)" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient id="lsMoon" cx="38%" cy="32%" r="72%">
                      <stop offset="0%" stopColor="#eef3f6" />
                      <stop offset="60%" stopColor="#c7d4db" />
                      <stop offset="100%" stopColor="#8aa0ac" />
                    </radialGradient>
                    <linearGradient id="lsComet" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="var(--signature-cyan-hi)" stopOpacity="0" />
                      <stop offset="100%" stopColor="var(--signature-cyan-hi)" stopOpacity="0.85" />
                    </linearGradient>
                  </defs>

                  {/* river band */}
                  <path
                    d={`M40 ${VH * 0.62} Q ${VW * 0.4} ${VH * 0.28} ${VW - 40} ${VH * 0.52}`}
                    fill="none"
                    stroke="var(--signature-cyan)"
                    strokeOpacity="0.12"
                    strokeWidth="40"
                    strokeLinecap="round"
                  />
                  {/* horizon */}
                  <line
                    x1="40"
                    y1={VH - 36}
                    x2={VW - 40}
                    y2={VH - 36}
                    stroke="#ffffff"
                    strokeOpacity="0.06"
                    strokeDasharray="2 8"
                  />
                  {/* moon anchor (Memory) */}
                  <circle cx="58" cy={VH * 0.5} r="26" fill="url(#lsMoon)" />

                  {/* links between consecutive capabilities */}
                  {stars.slice(0, -1).map((s, i) => (
                    <line
                      key={`link-${s.cap.id}`}
                      x1={s.x}
                      y1={s.y}
                      x2={stars[i + 1].x}
                      y2={stars[i + 1].y}
                      stroke="var(--signature-cyan-hi)"
                      strokeOpacity="0.18"
                      strokeWidth="1"
                    />
                  ))}

                  {/* comets — the standout strong capabilities */}
                  {comets.map((s) => (
                    <path
                      key={`comet-${s.cap.id}`}
                      d={`M${s.x - 120} ${s.y - 26} Q ${s.x - 50} ${s.y - 8} ${s.x} ${s.y}`}
                      fill="none"
                      stroke="url(#lsComet)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  ))}

                  {/* stars + labels */}
                  {stars.map((s) => (
                    <g key={s.cap.id} className={styles.star}>
                      <circle cx={s.x} cy={s.y} r={s.r * 3.2} fill="url(#lsGlow)" />
                      <circle cx={s.x} cy={s.y} r={s.r} fill="url(#lsStar)" />
                      <text
                        x={s.x}
                        y={s.y + s.r + 20}
                        textAnchor="middle"
                        className={styles.starLabel}
                      >
                        {s.cap.label}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
