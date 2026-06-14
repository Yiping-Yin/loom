/**
 * Helmet — Digital Me as a real astronaut helmet approaching from the dark.
 *
 * Renders the photographic helmet: a clean front-view shot whose dark visor
 * already carries an Earth-at-night reflection (city lights + the blue
 * atmospheric limb) — the spec's "reflection cosmos", baked into the source.
 *
 * Pure static markup — no hooks, no DOM access — so it is server-render /
 * static-export safe. Approach/turn motion is applied by the parent .helmet via
 * --fc-p; the photo's own brightness + saturation (Helmet.module.css) also read
 * --fc-p, so it emerges from the cold dark and floods to colour as it nears.
 */
import styles from './Helmet.module.css';

export function Helmet() {
  return <div className={styles.helmetPhoto} aria-hidden="true" />;
}

export default Helmet;
