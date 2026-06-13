'use client';

/**
 * useFirstContact — the motion engine for the History "first contact" hero.
 *
 * Returns a ref for the backdrop node inside the hero <section>. On mount it
 * resolves the enclosing section and drives three CSS custom properties on it,
 * which every decorative layer interpolates from in pure CSS:
 *
 *   --fc-p          0 → 1 approach progress
 *   --fc-px/--fc-py 0 → 1 normalised pointer position (throttled pointermove)
 *
 * Trigger model: the approach AUTO-PLAYS ONCE as a timed sequence the first
 * time the hero scrolls into view (an rAF eased timeline 0→1). This guarantees
 * the climax payoff (comet + colour bloom + visor reveal) is actually seen,
 * which a scroll-scrub could not (the visor scrolls off before p reaches the
 * climax). It latches `data-fc-climax` past CLIMAX_P — a one-shot that fires
 * the burst and then freezes the scene at "arrived" forever.
 *
 * On the very first session view the cold open plays first, so the approach is
 * delayed until it has faded (detected via the shared sessionStorage key, which
 * the cold open has not yet set when this effect runs). Reduced-motion /
 * reduced-data short-circuit straight to arrived. Pointer is an always-on
 * channel, independent of the timeline. Everything tears down on unmount; no
 * work happens during render, so the host component stays static-export safe.
 */
import { useEffect, useRef } from 'react';
import { CLIMAX_P, COLD_OPEN_DURATION_MS, COLD_OPEN_KEY } from './constants';

const APPROACH_MS = 2600;

// ease-out cubic — fast departure from the dark, gentle arrival.
function easeOut(x: number) {
  return 1 - Math.pow(1 - x, 3);
}

export function useFirstContact() {
  const anchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const anchor = anchorRef.current;
    const root = anchor?.closest('section') as HTMLElement | null;
    if (!root) return;

    const setVar = (name: string, value: string) => root.style.setProperty(name, value);

    const prefersReduced =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      window.matchMedia('(prefers-reduced-data: reduce)').matches;

    // Reduced motion/data → land on the arrived frame, wire nothing but a
    // recentre of the pointer vars.
    if (prefersReduced) {
      setVar('--fc-p', '1');
      root.dataset.fcClimax = '1';
      root.dataset.fcArrived = '1';
      return;
    }

    root.dataset.fcJs = '1';
    setVar('--fc-p', '0');

    // ── Approach timeline (auto-play once on first enter) ──────────────────
    let played = false;
    let frame = 0;
    let startTimer = 0;

    const tick = (t0: number) => {
      const step = (now: number) => {
        const elapsed = now - t0;
        const p = Math.min(1, elapsed / APPROACH_MS);
        const eased = easeOut(p);
        setVar('--fc-p', eased.toFixed(4));
        if (eased >= CLIMAX_P && !root.dataset.fcClimax) {
          root.dataset.fcClimax = '1';
        }
        if (p < 1) {
          frame = requestAnimationFrame(step);
        }
      };
      frame = requestAnimationFrame(step);
    };

    const play = () => {
      if (played) return;
      played = true;
      // Wait out the cold open on the first session view. The cold open sets
      // COLD_OPEN_KEY in its own (later) effect, so an unset key here means it
      // is about to play and we should hold at S0 until it fades.
      let coldPending = false;
      try {
        coldPending = window.sessionStorage.getItem(COLD_OPEN_KEY) !== '1';
      } catch {
        coldPending = false;
      }
      const delay = coldPending ? COLD_OPEN_DURATION_MS - 250 : 220;
      startTimer = window.setTimeout(() => {
        // performance.now baseline captured inside rAF for resume-safety.
        frame = requestAnimationFrame((now) => tick(now));
      }, delay);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) play();
      },
      { threshold: 0.35 },
    );
    observer.observe(root);

    // ── Pointer channel (always on, independent of the timeline) ───────────
    let pointerRaf = 0;
    let px = 0.5;
    let py = 0.5;
    const onPointerMove = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      px = Math.min(1, Math.max(0, (event.clientX - rect.left) / Math.max(rect.width, 1)));
      py = Math.min(1, Math.max(0, (event.clientY - rect.top) / Math.max(rect.height, 1)));
      if (pointerRaf) return;
      pointerRaf = requestAnimationFrame(() => {
        pointerRaf = 0;
        setVar('--fc-px', px.toFixed(3));
        setVar('--fc-py', py.toFixed(3));
      });
    };
    const recenterPointer = () => {
      setVar('--fc-px', '0.5');
      setVar('--fc-py', '0.5');
    };
    root.addEventListener('pointermove', onPointerMove, { passive: true });
    root.addEventListener('pointerleave', recenterPointer, { passive: true });

    return () => {
      observer.disconnect();
      root.removeEventListener('pointermove', onPointerMove);
      root.removeEventListener('pointerleave', recenterPointer);
      if (frame) cancelAnimationFrame(frame);
      if (pointerRaf) cancelAnimationFrame(pointerRaf);
      if (startTimer) window.clearTimeout(startTimer);
      delete root.dataset.fcJs;
    };
  }, []);

  return anchorRef;
}

export default useFirstContact;
