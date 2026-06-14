'use client';

/**
 * FirstContact — the cinematic background sequence for the History hero.
 *
 * Layers (all position:absolute; inset:0; pointer-events:none; aria-hidden;
 * z-index:0 — below the pinned hero content at z-index:2):
 *   - backdrop        cool-black radial atmosphere, brightens with approach
 *   - moon            waxes from a dim crescent-lit sphere to a full cool orb,
 *                     parallaxing on pointer
 *   - godRays         volumetric light cones that strengthen toward the climax
 *   - colorReflection grayscale → photographic colour bloom, ignited at climax
 *   - comet / cometHead a one-shot streak that sweeps across at the climax
 *
 * Motion is driven entirely from three CSS custom properties written by
 * useFirstContact onto the enclosing hero <section> (--fc-p approach,
 * --fc-px/--fc-py pointer). The static / no-JS / reduced-motion render is the
 * clean "arrived" frame (default --fc-p:1), so the export bundle and SSR ship
 * a complete picture with no motion.
 *
 * Static-export safe: useFirstContact only touches the DOM inside an effect,
 * never during render; the moon is a CSS background-image (no next/image).
 */
import { useFirstContact } from './useFirstContact';
import styles from './FirstContact.module.css';

function FirstContactLayers() {
  const anchorRef = useFirstContact();

  return (
    // Single overlay root. It is the one direct child of the hero <section>,
    // so the section's broad `.hero > * { position: relative; z-index: 2 }`
    // reset lands HERE (neutralised with !important in .root) instead of on
    // every layer. The layers then position against this root at z-index:0,
    // below the pinned hero content. The ref resolves the section for the
    // engine via .closest('section').
    <div ref={anchorRef} className={styles.root} aria-hidden="true">
      {/* Cool-black radial atmosphere backdrop. */}
      <div className={styles.backdrop} aria-hidden="true" />

      {/* Volumetric god-rays from upper-left. */}
      <div className={styles.godRays} aria-hidden="true" />

      {/* Grayscale → colour reflection sweep; blooms at the climax. */}
      <div className={styles.colorReflection} aria-hidden="true" />
    </div>
  );
}

/**
 * FirstContactRoot — the overlay layers PLUS the cold open as siblings.
 *
 * The cold open must paint ABOVE the pinned hero content (z-index:2), so it
 * cannot live inside the z-0 overlay root (a stacking context). It is a second
 * direct child of the hero <section> and lifts itself above the content with
 * !important (the same reason .root needs it — to escape `.hero > *`).
 */
export function FirstContact() {
  return (
    <>
      <FirstContactLayers />
      {/* (Static version: the one-shot comet + cold-open are disabled. The
          comet markup stays for the cinematic restore but never animates.) */}
      <div className={styles.cometCanvas} aria-hidden="true">
        <span className={styles.comet} aria-hidden="true">
          <span className={styles.cometHead} aria-hidden="true" />
        </span>
      </div>
    </>
  );
}

export default FirstContact;
