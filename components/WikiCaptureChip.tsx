'use client';
import { useEffect, useState } from 'react';

type WebkitBridge = {
  webkit?: {
    messageHandlers?: {
      loomNavigate?: { postMessage: (msg: unknown) => void };
    };
  };
};

/**
 * Wiki-migration step 5: the quiet in-page capture affordance for bundled
 * wiki chapters. Select a passage → a small "Capture" chip appears near the
 * selection → click posts `captureWikiSelection` through the native
 * navigation bridge (NavigationBridgeHandler) with an HONEST section-level
 * anchor: the nearest preceding heading + its fragment id.
 *
 * Gated on the webkit handler: in a plain browser this renders nothing and
 * installs no listeners beyond the initial capability check.
 */
export function WikiCaptureChip({ slug, articleTitle }: { slug: string; articleTitle: string }) {
  const [chip, setChip] = useState<{ x: number; y: number; text: string } | null>(null);

  useEffect(() => {
    const bridge = (window as unknown as WebkitBridge).webkit?.messageHandlers?.loomNavigate;
    if (!bridge) return; // web browser: not our surface

    const onSelectionSettled = () => {
      const sel = window.getSelection();
      const text = sel?.toString().trim() ?? '';
      if (!sel || sel.isCollapsed || text.length < 8) {
        setChip(null);
        return;
      }
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      setChip({
        x: rect.left + rect.width / 2 + window.scrollX,
        y: rect.top + window.scrollY - 34,
        text,
      });
    };

    document.addEventListener('mouseup', onSelectionSettled);
    document.addEventListener('keyup', onSelectionSettled);
    return () => {
      document.removeEventListener('mouseup', onSelectionSettled);
      document.removeEventListener('keyup', onSelectionSettled);
    };
  }, []);

  if (!chip) return null;

  const capture = () => {
    const bridge = (window as unknown as WebkitBridge).webkit?.messageHandlers?.loomNavigate;
    if (!bridge) return;
    // Nearest preceding heading = the section this selection lives in.
    const sel = window.getSelection();
    let heading: { text: string; id: string } | null = null;
    if (sel && sel.rangeCount > 0) {
      const node = sel.getRangeAt(0).startContainer;
      const el = node instanceof Element ? node : node.parentElement;
      let cursor: Element | null = el;
      while (cursor && !heading) {
        let sibling: Element | null = cursor.previousElementSibling;
        while (sibling) {
          if (/^H[1-4]$/.test(sibling.tagName)) {
            heading = { text: sibling.textContent?.trim() ?? '', id: sibling.id ?? '' };
            break;
          }
          sibling = sibling.previousElementSibling;
        }
        cursor = cursor.parentElement;
      }
    }
    bridge.postMessage({
      action: 'captureWikiSelection',
      selection: chip.text,
      slug,
      articleTitle,
      sectionHeading: heading?.text || null,
      fragment: heading?.id || null,
    });
    setChip(null);
    window.getSelection()?.removeAllRanges();
  };

  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={capture}
      aria-label="Capture selection to Loom"
      style={{
        position: 'absolute',
        left: chip.x,
        top: chip.y,
        transform: 'translateX(-50%)',
        zIndex: 60,
        padding: '3px 10px',
        borderRadius: 999,
        border: '0.5px solid var(--mat-border, rgba(127,127,127,0.35))',
        background: 'var(--surface-2, rgba(30,30,30,0.92))',
        color: 'var(--fg-secondary, #ddd)',
        font: '11px/1.6 var(--mono, ui-monospace)',
        letterSpacing: '0.04em',
        cursor: 'pointer',
      }}
    >
      Capture
    </button>
  );
}
