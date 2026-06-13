'use client';

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
      <main
        className={styles.main}
        style={{
          alignItems: 'center',
          padding:
            'clamp(7.2rem, 12vh, 9rem) clamp(1.5rem, 5vw, 4rem) clamp(3rem, 6vh, 6rem)',
          fontFamily: 'var(--serif)',
        }}
      >
        <article
        className={styles.sectionCard}
        style={{
          width: '100%',
          maxWidth: '34rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.75rem',
        }}
      >
        {/* Eyebrow — serif small-caps per Vellum chrome rule. Reads as a
            proper tracked eyebrow (small-caps + letter-spacing) so it carries
            the site-wide eyebrow structure while keeping the editorial serif
            character of this chrome page. */}
        <div
          className="loom-smallcaps"
          style={{
            fontFamily: 'var(--serif)',
            fontVariant: 'small-caps',
            textTransform: 'lowercase',
            fontSize: '0.82rem',
            fontWeight: 500,
            letterSpacing: '0.22em',
            color: 'var(--fg-secondary)',
          }}
        >
          Colophon
        </div>

        {/* Title — Loom */}
        <h1
          style={{
            fontFamily: 'Cormorant Garamond, var(--display)',
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: '64px',
            lineHeight: 1.05,
            letterSpacing: '-0.01em',
            color: 'var(--fg)',
            margin: 0,
          }}
        >
          Loom
        </h1>

        {/* Subtitle — current visual canon */}
        <div
          style={{
            fontFamily: 'Cormorant Garamond, var(--display)',
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: '24px',
            lineHeight: 1.2,
            color: 'var(--muted)',
            marginTop: '-0.5rem',
          }}
        >
          Graphite canon
        </div>

        <Ornament />

        {/* Type paragraph */}
        <p style={bodyStyle}>
          Set in Cormorant Garamond (chrome) and EB Garamond (body), with New
          York as the silent companion for ordinary reading. CJK falls through
          to Songti SC.
        </p>

        {/* Palette paragraph */}
        <p style={bodyStyle}>
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
        <p style={bodyStyle}>
          Built by one hand.{' '}
          <br />
          With thanks to anyone who waited.
        </p>

        <Ornament />

        {/* Footer */}
        <div
          style={{
            fontFamily: 'Cormorant Garamond, var(--display)',
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: '0.82rem',
            color: 'var(--muted)',
            marginTop: '0.5rem',
          }}
        >
          © 2026 · All rights respected
        </div>
        </article>
      </main>
    </div>
  );
}

// ── components ────────────────────────────────────────────────────────────

const bodyStyle: React.CSSProperties = {
  fontFamily: "'EB Garamond', var(--serif)",
  fontSize: '0.95rem',
  lineHeight: 1.7,
  color: 'var(--fg)',
  margin: 0,
  maxWidth: '30rem',
  textWrap: 'pretty' as unknown as undefined,
};

/** Tiny inline color chip used inline in the palette sentence. */
function Swatch({ value, label }: { value: string; label: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: '0.35em',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          display: 'inline-block',
          width: '0.72em',
          height: '0.72em',
          background: value,
          border: '0.5px solid var(--border)',
          borderRadius: 2,
          boxShadow: 'inset 0 0.5px 0 rgba(255, 255, 255, 0.12)',
          verticalAlign: 'baseline',
          transform: 'translateY(0.05em)',
        }}
      />
      <span
        style={{
          fontFamily: 'var(--mono)',
          fontSize: '0.82em',
          color: 'var(--muted)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {label}
      </span>
    </span>
  );
}
