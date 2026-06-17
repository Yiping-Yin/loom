'use client';

import type { CSSProperties } from 'react';
import Ornament from '../components/Ornament';
import styles from './loom-support-page.module.css';
import { LoomSupportNav } from './LoomSupportNav';

/**
 * ColophonClient — Loom's back matter.
 *
 * Structure (single vertical column, centered on paper):
 *
 *   COLOPHON
 *
 *   Loom
 *   Graphite canon
 *
 *   <prose about the type>
 *   <prose about the palette>
 *
 *   Built by one hand.
 *   With thanks to anyone who waited.
 *
 *   ── · ──
 *
 *   © 2026 · All rights respected
 *
 * Typography:
 *   - Eyebrow "COLOPHON" — small-caps, muted
 *   - Title "Loom" — 64pt italic Cormorant Garamond, ink
 *   - Subtitle "Graphite canon" — 24pt italic serif, muted
 *   - Body — 0.95rem EB Garamond, lh 1.7
 *   - Ornament breaks between blocks
 *   - Footer — muted italic, tiny
 *
 * This surface is chrome / identity, so art fonts are allowed (the usual
 * "prefer --serif (New York)" rule applies to user content, not the
 * colophon).
 */
export default function ColophonClient() {
  return (
    <div className={styles.surface}>
      <LoomSupportNav active="/colophon" />
      <main className={`${styles.main} ${styles.colophonMain}`}>
        <article className={`${styles.sectionCard} ${styles.colophonCard}`}>
        {/* Eyebrow — serif small-caps per Vellum chrome rule. Reads as a
            proper tracked eyebrow (small-caps + letter-spacing) so it carries
            the site-wide eyebrow structure while keeping the editorial serif
            character of this chrome page. */}
        <div className={`${styles.colophonEyebrow} loom-smallcaps`}>
          Colophon
        </div>

        {/* Title — Loom */}
        <h1 className={styles.colophonTitle}>
          Loom
        </h1>

        {/* Subtitle — current visual canon */}
        <div className={styles.colophonSubtitle}>
          Graphite canon
        </div>

        <Ornament />

        {/* Type paragraph */}
        <p className={styles.colophonBody}>
          Set in Cormorant Garamond (chrome) and EB Garamond (body), with New
          York as the silent companion for ordinary reading. CJK falls through
          to Songti SC.
        </p>

        {/* Palette paragraph */}
        <p className={styles.colophonBody}>
          Palette is set in graphite-black <Swatch value="#070809" label="#070809" />{' '}
          with raised silver surfaces in <Swatch value="#181B1E" label="#181B1E" /> and{' '}
          <Swatch value="#30353A" label="#30353A" />. Comet ice{' '}
          <Swatch value="#4BC5DE" label="#4BC5DE" /> is the brand voice, held to
          hairlines, single words, and data accents. Pale ion{' '}
          <Swatch value="#8AF7E6" label="#8AF7E6" /> is reserved for active
          focus. Gain green and loss red carry the market tones.
        </p>

        <Ornament />

        {/* Hand paragraph */}
        <p className={styles.colophonBody}>
          Built by one hand.{' '}
          <br />
          With thanks to anyone who waited.
        </p>

        <Ornament />

        {/* Footer */}
        <div className={styles.colophonFooter}>
          © 2026 · All rights respected
        </div>
        </article>
      </main>
    </div>
  );
}

// ── components ────────────────────────────────────────────────────────────

/** Tiny inline color chip used inline in the palette sentence. */
function Swatch({ value, label }: { value: string; label: string }) {
  return (
    <span
      className={styles.swatch}
      style={{ '--swatch-color': value } as CSSProperties}
    >
      <span className={styles.swatchDot} aria-hidden="true" />
      <span className={styles.swatchLabel}>
        {label}
      </span>
    </span>
  );
}
