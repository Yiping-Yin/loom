'use client';

/**
 * useFirstContact — engine hook for the History hero.
 *
 * STATIC VERSION: renders the resting "arrived" frame directly (no approach /
 * climax / comet auto-play). It only:
 *   - pins --fc-p to 1 and marks the section arrived, and
 *   - keeps the always-on pointer channel (--fc-px/--fc-py) for the subtle
 *     visor tilt toward the cursor.
 *
 * The full cinematic timeline (IntersectionObserver + rAF eased approach +
 * latched climax burst) is preserved in git history; restore it here to bring
 * the motion sequence back. No work happens during render, so the host stays
 * static-export safe; everything tears down on unmount.
 */
import { useEffect, useRef } from 'react';

export function useFirstContact() {
  const anchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const anchor = anchorRef.current;
    const root = anchor?.closest('section') as HTMLElement | null;
    if (!root) return;

    const setVar = (name: string, value: string) => root.style.setProperty(name, value);

    // Resting frame — full helmet, premium-black scene, no auto-play. NOTE: we
    // intentionally do NOT set data-fc-arrived, because its `.helmet { transform }`
    // rule would re-create a stacking context that traps the helmet's lighten
    // blend (preventing it from melting into the page). --fc-p:1 alone gives the
    // resting look.
    setVar('--fc-p', '1');
    root.dataset.fcJs = '1';

    // Pointer channel (always on): subtle visor tilt toward the cursor.
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
      root.removeEventListener('pointermove', onPointerMove);
      root.removeEventListener('pointerleave', recenterPointer);
      if (pointerRaf) cancelAnimationFrame(pointerRaf);
      delete root.dataset.fcJs;
    };
  }, []);

  return anchorRef;
}

export default useFirstContact;
