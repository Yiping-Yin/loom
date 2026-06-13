'use client';

/**
 * FirstContact — cinematic background layers for the History hero.
 *
 * T1: static resting state only.
 *   - Cool-black backdrop with a subtle radial atmosphere (faint cyan tint).
 *   - Moon layer using /brand/loom_lunar_orb.png, positioned back-left.
 *   - Empty placeholder divs for T2+ layers (god-rays, color/reflection,
 *     comet-canvas, visor-text) — resting/empty; no hooks, no motion.
 *
 * ALL new layers: position:absolute; inset:0; pointer-events:none; z-index:0
 * (below .hero > * which is z-index:2, and below .heroLight / .heroDust
 * which are z-index:1). The existing visor, text, and archive row sit on top.
 *
 * Static-export safe: no window/document access, no server APIs, no
 * next/image optimizer. The moon is a plain CSS background-image (<img> is
 * avoided so it doesn't disturb layout flow; it's a decorative backdrop).
 */
import styles from './FirstContact.module.css';

export function FirstContact() {
  return (
    <>
      {/* Cool-black backdrop with very faint cyan/ink radial atmosphere */}
      <div
        className={styles.backdrop}
        aria-hidden="true"
      />

      {/* Moon: /brand/loom_lunar_orb.png, cool-toned, back-left depth layer */}
      <div
        className={styles.moon}
        aria-hidden="true"
      />

      {/* T2+ placeholder: god-ray volumetric light cones (inactive in T1) */}
      <div
        className={styles.godRays}
        aria-hidden="true"
      />

      {/* T2+ placeholder: iridescent color/reflection sweep (inactive in T1) */}
      <div
        className={styles.colorReflection}
        aria-hidden="true"
      />

      {/* T2+ placeholder: animated comet canvas (inactive in T1) */}
      <div
        className={styles.cometCanvas}
        aria-hidden="true"
      />

      {/* T2+ placeholder: LOOM wordmark / eyebrow inside the visor (inactive in T1) */}
      <div
        className={styles.visorText}
        aria-hidden="true"
      />
    </>
  );
}

export default FirstContact;
