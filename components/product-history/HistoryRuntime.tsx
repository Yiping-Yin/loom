'use client';

import { useEffect } from 'react';

import styles from './HistoryDossier.module.css';

/**
 * Client-only enhancements for /product-history. Renders nothing — it wires
 * behaviour onto server-rendered DOM via data-attributes:
 *   - [data-reveal]      staggered scroll reveal (IntersectionObserver)
 *   - [data-parallax]    gentle scroll parallax on the fixed star/nebula layers
 *   - [data-earth-open]  opens the "Earth in the visor" modal
 *   - [data-earth-modal] / [data-earth-close]  the modal + its close affordances
 *
 * Everything degrades to a clean, fully-visible page with no JS, and all
 * motion is disabled under prefers-reduced-motion. Nothing is hidden on the
 * server, so content never gets stuck blank.
 */
export function HistoryRuntime() {
  useEffect(() => {
    const reduce =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const cleanups: Array<() => void> = [];

    // ---- Scroll reveal -------------------------------------------------
    if (!reduce && typeof IntersectionObserver !== 'undefined') {
      const isFlow = (el: Element) => {
        if (el.getAttribute('aria-hidden') === 'true') return false;
        const cs = getComputedStyle(el);
        return cs.position !== 'absolute' && cs.position !== 'fixed' && cs.display !== 'none';
      };
      const unitsFor = (el: Element): HTMLElement[] => {
        const out: HTMLElement[] = [];
        Array.from(el.children)
          .filter(isFlow)
          .forEach((child) => {
            const inner = Array.from(child.children).filter(isFlow);
            const cs = getComputedStyle(child);
            const isGroup =
              inner.length >= 2 && (cs.display === 'grid' || cs.display === 'flex' || /^(ul|ol)$/i.test(child.tagName));
            if (isGroup) inner.forEach((c) => out.push(c as HTMLElement));
            else out.push(child as HTMLElement);
          });
        return out.length ? out : [el as HTMLElement];
      };

      const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
      const unitMap = new WeakMap<Element, HTMLElement[]>();
      const vh = window.innerHeight || 800;

      sections.forEach((section) => {
        const units = unitsFor(section);
        unitMap.set(section, units);
        const alreadyVisible = section.getBoundingClientRect().top < vh * 0.9;
        if (alreadyVisible) return; // above the fold: leave visible, no flash
        units.forEach((u) => {
          u.style.opacity = '0';
          u.style.transform = 'translateY(22px)';
          u.style.filter = 'blur(6px)';
          u.style.transition =
            'opacity 0.78s cubic-bezier(0.2,0.8,0.2,1), transform 0.78s cubic-bezier(0.2,0.8,0.2,1), filter 0.78s cubic-bezier(0.2,0.8,0.2,1)';
        });
      });

      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const units = unitMap.get(entry.target) ?? [entry.target as HTMLElement];
            units.forEach((u, i) => {
              window.setTimeout(() => {
                u.style.opacity = '1';
                u.style.transform = 'none';
                u.style.filter = 'none';
              }, Math.min(i, 8) * 85);
            });
            io.unobserve(entry.target);
          });
        },
        { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
      );
      sections.forEach((s) => io.observe(s));
      cleanups.push(() => io.disconnect());
    }

    // ---- Parallax ------------------------------------------------------
    if (!reduce) {
      const layers = Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'));
      if (layers.length) {
        let ticking = false;
        const apply = () => {
          ticking = false;
          const y = window.scrollY || 0;
          layers.forEach((layer) => {
            const kind = layer.getAttribute('data-parallax');
            if (kind === 'limb') {
              // The origins moon-limb drifts relative to its own viewport
              // position; preserve its base scaleX(-1) flip.
              const rect = layer.getBoundingClientRect();
              const off = rect.top + rect.height / 2 - (window.innerHeight || 0) / 2;
              layer.style.transform = `scaleX(-1) translate3d(0, ${(off * -0.05).toFixed(1)}px, 0)`;
              return;
            }
            const rate = kind === 'nebula' ? -0.045 : -0.022;
            layer.style.transform = `translate3d(0, ${(y * rate).toFixed(1)}px, 0)`;
          });
        };
        const onScroll = () => {
          if (!ticking) {
            ticking = true;
            requestAnimationFrame(apply);
          }
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        apply();
        cleanups.push(() => window.removeEventListener('scroll', onScroll));
      }
    }

    // ---- Earth-in-the-visor modal --------------------------------------
    const modal = document.querySelector<HTMLElement>('[data-earth-modal]');
    if (modal) {
      const openers = Array.from(document.querySelectorAll<HTMLElement>('[data-earth-open]'));
      const closers = Array.from(modal.querySelectorAll<HTMLElement>('[data-earth-close]'));

      const open = () => {
        modal.classList.add(styles.earthOpen);
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden'; // lock background scroll while the modal is open
        const focusTarget = modal.querySelector<HTMLElement>('[data-earth-close]');
        focusTarget?.focus();
      };
      const close = () => {
        modal.classList.remove(styles.earthOpen);
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      };
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') close();
      };

      openers.forEach((o) => o.addEventListener('click', open));
      closers.forEach((c) => c.addEventListener('click', close));
      window.addEventListener('keydown', onKey);
      cleanups.push(() => {
        openers.forEach((o) => o.removeEventListener('click', open));
        closers.forEach((c) => c.removeEventListener('click', close));
        window.removeEventListener('keydown', onKey);
        document.body.style.overflow = '';
      });
    }

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}

export default HistoryRuntime;
