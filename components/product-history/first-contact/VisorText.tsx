'use client';

/**
 * VisorText — the locked Loom identity rendered inside the History hero visor.
 *
 * Replaces the retired L-eyes-M monogram. The eyes moved to the app icon; the
 * wordmark is now clean Fraunces. This piece renders, on the existing
 * `.heroStudy` glass visor shell:
 *   1. the LOOM wordmark in Fraunces, set on an outward-bulging (convex)
 *      baseline via an inline SVG <textPath>, with per-letter falloff
 *      (opacity + slight size taper toward the edges) inside a perspective
 *      container so it reads as a lit, dimensional mark;
 *   2. a small uppercase eyebrow — LIBRARY · EYES · MEMORY;
 *   3. the explanation line.
 *
 * Rendered at a resting *lit* state: this is the static / no-JS fallback.
 * No window/document access in render, so it is static-export safe. Cool-black
 * + signature-cyan only. The wordmark face is scoped to the offline
 * `--font-wordmark` stack — no other surface is restyled.
 */
import { EXPLANATION, EYEBROW, VISOR_WORDMARK } from './constants';
import styles from './VisorText.module.css';

const LETTERS = VISOR_WORDMARK.split('');

// Per-letter falloff: brightest at the centre of the wordmark, tapering in
// opacity and scale toward the edges so the convex mark reads as lit and
// dimensional. Symmetric around the middle letter.
function letterFalloff(index: number, count: number) {
  const mid = (count - 1) / 2;
  const distance = mid === 0 ? 0 : Math.abs(index - mid) / mid; // 0 centre → 1 edge
  return {
    opacity: 1 - distance * 0.34,
    scale: 1 - distance * 0.07,
  };
}

export function VisorText() {
  return (
    <div className={styles.visorText}>
      <p className={styles.eyebrow}>{EYEBROW}</p>

      <div className={styles.wordmarkStage}>
        <svg
          className={styles.wordmarkSvg}
          viewBox="0 0 320 132"
          role="img"
          aria-label={VISOR_WORDMARK}
          focusable="false"
        >
          <defs>
            {/* Convex / outward-bulging baseline: the text rides over the top
                of this arc, so the middle letters sit higher than the edges. */}
            <path id="visor-wordmark-arc" d="M 48 100 Q 160 36 272 100" fill="none" />
            <linearGradient id="visor-wordmark-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(244, 248, 249, 0.98)" />
              <stop offset="62%" stopColor="rgba(231, 238, 240, 0.92)" />
              <stop offset="100%" stopColor="rgba(176, 214, 222, 0.86)" />
            </linearGradient>
          </defs>
          <text
            className={styles.wordmarkText}
            textAnchor="middle"
            fill="url(#visor-wordmark-fill)"
          >
            <textPath href="#visor-wordmark-arc" startOffset="50%">
              {LETTERS.map((letter, index) => {
                const { opacity, scale } = letterFalloff(index, LETTERS.length);
                return (
                  <tspan
                    key={`${letter}-${index}`}
                    fillOpacity={opacity}
                    fontSize={`${(scale * 100).toFixed(2)}%`}
                  >
                    {letter}
                  </tspan>
                );
              })}
            </textPath>
          </text>
        </svg>
      </div>

      <p className={styles.explanation}>{EXPLANATION}</p>
    </div>
  );
}

export default VisorText;
