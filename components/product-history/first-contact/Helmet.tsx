/**
 * Helmet — the astronaut-helmet silhouette that frames the visor (Digital Me).
 *
 * A luminous SVG outline (the spec's accepted structural fallback for a
 * rendered helmet image): a cropped close-up dome + side curve + neck ring,
 * with the visor window cut out so the bright faceplate (heroStudy) shows
 * through. Pure static SVG — no hooks, no DOM access — so it is server-render /
 * static-export safe. Motion (approach/turn) is applied by the parent .helmet
 * via --fc-p; the stroke intensities below also read --fc-p so the rim-light
 * grows as the helmet faces you.
 *
 * The SVG is drawn ~28% taller and ~10% wider than the visor and positioned so
 * its central window aligns with the .helmet box; the dome rises above, the
 * neck is cropped below — "close, half-cropped, filling the frame".
 */
import styles from './Helmet.module.css';

// Outer helmet silhouette (viewBox 0 0 1000 1000): dome → side → neck base.
const SILHOUETTE =
  'M500 28 C766 28 946 196 946 466 C946 700 858 884 690 974 L310 974 ' +
  'C142 884 54 700 54 466 C54 196 234 28 500 28 Z';

// Visor window (rounded rect ~ [80,920] x [180,820], r70) — cut from the shell.
const WINDOW =
  'M150 180 H850 A70 70 0 0 1 920 250 V750 A70 70 0 0 1 850 820 H150 ' +
  'A70 70 0 0 1 80 750 V250 A70 70 0 0 1 150 180 Z';

export function Helmet() {
  return (
    <svg
      className={styles.helmetSvg}
      viewBox="0 0 1000 1000"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {/* Dark glass shell body */}
        <linearGradient id="fc-helmet-shell" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(46,55,64,0.92)" />
          <stop offset="34%" stopColor="rgba(20,25,31,0.95)" />
          <stop offset="100%" stopColor="rgba(4,5,7,0.99)" />
        </linearGradient>
        {/* Single main rim light, upper-left → fading round the dome */}
        <linearGradient id="fc-helmet-rim" x1="0.12" y1="0.04" x2="0.9" y2="1">
          <stop offset="0%" stopColor="rgba(150,250,235,0.95)" />
          <stop offset="22%" stopColor="rgba(75,197,222,0.7)" />
          <stop offset="52%" stopColor="rgba(75,197,222,0.12)" />
          <stop offset="100%" stopColor="rgba(75,197,222,0)" />
        </linearGradient>
        <radialGradient id="fc-helmet-dome" cx="0.32" cy="0.12" r="0.6">
          <stop offset="0%" stopColor="rgba(180,210,222,0.4)" />
          <stop offset="60%" stopColor="rgba(120,150,165,0.06)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>

      {/* Shell body = silhouette minus the visor window (even-odd) */}
      <path className={styles.shell} d={`${SILHOUETTE} ${WINDOW}`} fillRule="evenodd" fill="url(#fc-helmet-shell)" />
      {/* Dome sheen (upper-left volume) */}
      <path className={styles.dome} d={`${SILHOUETTE} ${WINDOW}`} fillRule="evenodd" fill="url(#fc-helmet-dome)" />
      {/* Outer silhouette rim-light */}
      <path className={styles.silhouette} d={SILHOUETTE} fill="none" stroke="url(#fc-helmet-rim)" strokeWidth="3" />
      {/* Visor window frame */}
      <path className={styles.windowRim} d={WINDOW} fill="none" stroke="rgba(160,210,222,0.34)" strokeWidth="2" />
      {/* Neck ring seam */}
      <path
        className={styles.neck}
        d="M300 880 C400 922 600 922 700 880"
        fill="none"
        stroke="rgba(150,200,214,0.3)"
        strokeWidth="2.5"
      />
    </svg>
  );
}

export default Helmet;
