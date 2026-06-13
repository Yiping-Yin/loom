'use client';

/**
 * useFirstContact — the motion engine for the History "first contact" hero.
 *
 * Returns a ref to attach to the backdrop node inside the hero `<section>`. On mount it
 * resolves the enclosing section and drives three CSS custom properties on it,
 * which every decorative layer interpolates from in pure CSS:
 *
 *   --fc-p          0 → 1 approach progress (passive rAF scroll-scrub)
 *   --fc-px/--fc-py 0 → 1 normalised pointer position (throttled pointermove)
 *
 * It also latches `data-fc-climax` once `--fc-p` crosses CLIMAX_P — a one-shot
 * that fires the comet + colour bloom and then freezes the scene at the
 * "arrived" state, so scrolling back up never replays the burst.
 *
 * Reduced-motion OR reduced-data short-circuits to the arrived frame with no
 * scroll/pointer wiring. Everything tears down on unmount. No work happens
 * during render, so the component embedding this stays static-export safe.
 */
import { useEffect, useRef } from 'react';
import { CLIMAX_P, SCRUB_SPAN } from './constants';

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

    // Reduced motion/data → land on the arrived frame, wire nothing.
    if (prefersReduced) {
      setVar('--fc-p', '1');
      root.dataset.fcClimax = '1';
      root.dataset.fcArrived = '1';
      return;
    }

    let scrollRaf = 0;
    let pointerRaf = 0;
    let inView = true;
    let latched = false;

    const compute = () => {
      scrollRaf = 0;
      const rect = root.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const span = Math.max(vh * SCRUB_SPAN, 1);
      const p = Math.min(1, Math.max(0, -rect.top / span));
      setVar('--fc-p', p.toFixed(4));
      if (!latched && p >= CLIMAX_P) {
        latched = true;
        root.dataset.fcClimax = '1';
      }
    };

    const onScroll = () => {
      if (!inView || scrollRaf) return;
      scrollRaf = requestAnimationFrame(compute);
    };

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

    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView) {
          compute();
          window.addEventListener('scroll', onScroll, { passive: true });
        } else {
          window.removeEventListener('scroll', onScroll);
        }
      },
      { threshold: 0 },
    );
    observer.observe(root);

    // Hand off from the no-JS "arrived" default to the live scrub.
    root.dataset.fcJs = '1';
    compute();
    window.addEventListener('resize', onScroll, { passive: true });
    root.addEventListener('pointermove', onPointerMove, { passive: true });
    root.addEventListener('pointerleave', recenterPointer, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      root.removeEventListener('pointermove', onPointerMove);
      root.removeEventListener('pointerleave', recenterPointer);
      if (scrollRaf) cancelAnimationFrame(scrollRaf);
      if (pointerRaf) cancelAnimationFrame(pointerRaf);
      delete root.dataset.fcJs;
    };
  }, []);

  return anchorRef;
}

export default useFirstContact;
