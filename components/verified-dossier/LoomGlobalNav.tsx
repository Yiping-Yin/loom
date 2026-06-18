'use client';

import { Search } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

import { VERIFIED_DOSSIER_TOP_NAV } from '../../lib/new-loom/verified-dossier-home';
import styles from './LoomGlobalNav.module.css';

type LoomGlobalNavProps = {
  activeHref?: string;
  ariaLabel?: string;
  brandCurrent?: boolean;
};

const HIDE_AFTER_PX = 96;
const DELTA_PX = 8;
const LOOM_WORKSPACE_NAV = [
  { label: 'Sources', href: '/sources' },
  { label: 'Draft', href: '/draft' },
];

export function LoomGlobalNav({
  activeHref,
  ariaLabel = 'Loom navigation',
  brandCurrent = false,
}: LoomGlobalNavProps) {
  const [hidden, setHidden] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const navMotionFrameRef = useRef<number | null>(null);
  const navScrollFrameRef = useRef<number | null>(null);
  const previousScrollYRef = useRef(0);
  const hiddenRef = useRef(false);
  const menuRef = useRef<HTMLDetailsElement>(null);
  const searchOpenRef = useRef(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    previousScrollYRef.current = window.scrollY;

    const setNavHidden = (nextHidden: boolean) => {
      if (hiddenRef.current === nextHidden) return;

      hiddenRef.current = nextHidden;
      setHidden(nextHidden);
    };

    const updateFromScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - previousScrollYRef.current;

      if (currentY <= HIDE_AFTER_PX / 2) {
        setNavHidden(false);
        previousScrollYRef.current = currentY;
        return;
      }

      if (Math.abs(delta) >= DELTA_PX) {
        setNavHidden(delta > 0 && currentY > HIDE_AFTER_PX);
        previousScrollYRef.current = currentY;
      }
    };

    const queueScrollUpdate = (event?: Event) => {
      if (event && 'deltaY' in event && typeof event.deltaY === 'number') {
        const currentY = window.scrollY;
        const projectedY = Math.max(0, currentY + event.deltaY);

        if (Math.abs(event.deltaY) >= DELTA_PX) {
          setNavHidden(event.deltaY > 0 && projectedY > HIDE_AFTER_PX);
        }
      }

      if (navScrollFrameRef.current !== null) {
        window.cancelAnimationFrame(navScrollFrameRef.current);
      }

      navScrollFrameRef.current = window.requestAnimationFrame(() => {
        navScrollFrameRef.current = null;
        updateFromScroll();
      });
    };
    const interval = window.setInterval(updateFromScroll, 90);

    window.addEventListener('scroll', queueScrollUpdate, { passive: true });
    window.addEventListener('wheel', queueScrollUpdate, { passive: true });
    document.addEventListener('wheel', queueScrollUpdate, { capture: true, passive: true });
    return () => {
      if (navScrollFrameRef.current !== null) {
        window.cancelAnimationFrame(navScrollFrameRef.current);
        navScrollFrameRef.current = null;
      }

      window.clearInterval(interval);
      document.removeEventListener('wheel', queueScrollUpdate, { capture: true });
      window.removeEventListener('wheel', queueScrollUpdate);
      window.removeEventListener('scroll', queueScrollUpdate);
    };
  }, []);

  useEffect(() => {
    searchOpenRef.current = searchOpen;
    if (!searchOpen) return;
    focusSearchInput();
  }, [searchOpen]);

  useEffect(() => {
    return () => {
      if (navMotionFrameRef.current === null) return;
      window.cancelAnimationFrame(navMotionFrameRef.current);
    };
  }, []);

  useEffect(() => {
    function closeNavPopoversOnOutsidePointerDown(event: PointerEvent) {
      const menuOpen = menuRef.current?.open ?? false;

      if (!searchOpenRef.current && !menuOpen) return;

      const target = event.target;

      if (target instanceof Node && navRef.current?.contains(target)) return;

      if (searchOpenRef.current) {
        closeSearch({ blur: true, clearQuery: true });
      }

      if (menuOpen) {
        closeMenu();
      }
    }

    document.addEventListener('pointerdown', closeNavPopoversOnOutsidePointerDown, { capture: true });
    return () => {
      document.removeEventListener('pointerdown', closeNavPopoversOnOutsidePointerDown, { capture: true });
    };
  }, []);

  function focusSearchInput() {
    const focusInput = () => {
      const input = searchInputRef.current;

      if (!input) return;

      input.focus({ preventScroll: true });
      const cursor = input.value.length;
      input.setSelectionRange(cursor, cursor);
    };

    focusInput();
    window.requestAnimationFrame(focusInput);
    window.setTimeout(focusInput, 0);
  }

  function openSearch() {
    closeMenu();

    if (!searchOpenRef.current) {
      searchOpenRef.current = true;
      flushSync(() => {
        setSearchOpen(true);
      });
    }

    focusSearchInput();
  }

  function closeSearch({ blur = false, clearQuery = false } = {}) {
    searchOpenRef.current = false;
    setSearchOpen(false);

    if (clearQuery) {
      setSearchQuery('');
    }

    if (blur) {
      searchInputRef.current?.blur();
    }
  }

  function closeMenu() {
    if (!menuRef.current?.open) return;

    menuRef.current.open = false;
    setMenuOpen(false);
  }

  function resetNavOptics() {
    const nav = navRef.current;

    if (!nav) return;

    if (navMotionFrameRef.current !== null) {
      window.cancelAnimationFrame(navMotionFrameRef.current);
      navMotionFrameRef.current = null;
    }

    nav.style.setProperty('--nav-glint-x', '18%');
    nav.style.setProperty('--nav-glint-y', '0%');
    nav.style.setProperty('--nav-glint-shift', '0rem');
    nav.style.setProperty('--nav-tilt-x', '0deg');
    nav.style.setProperty('--nav-tilt-y', '0deg');
  }

  function onNavPointerMove(event: React.PointerEvent<HTMLElement>) {
    if (event.pointerType === 'touch' || hidden) return;

    const nav = navRef.current;

    if (!nav) return;

    const rect = nav.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));

    if (navMotionFrameRef.current !== null) {
      window.cancelAnimationFrame(navMotionFrameRef.current);
    }

    navMotionFrameRef.current = window.requestAnimationFrame(() => {
      nav.style.setProperty('--nav-glint-x', `${Math.round(x * 100)}%`);
      nav.style.setProperty('--nav-glint-y', `${Math.round(y * 100)}%`);
      nav.style.setProperty('--nav-glint-shift', `${((x - 0.5) * 1.8).toFixed(2)}rem`);
      nav.style.setProperty('--nav-tilt-x', `${((0.5 - y) * 1.15).toFixed(2)}deg`);
      nav.style.setProperty('--nav-tilt-y', `${((x - 0.5) * 1.8).toFixed(2)}deg`);
      navMotionFrameRef.current = null;
    });
  }

  function onNavBlur(event: React.FocusEvent<HTMLElement>) {
    if (!searchOpenRef.current) return;

    const nextFocus = event.relatedTarget;

    if (nextFocus instanceof Node && event.currentTarget.contains(nextFocus)) return;

    closeSearch({ clearQuery: true });
  }

  function onNavKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key !== 'Escape' || !menuRef.current?.open) return;

    event.stopPropagation();
    closeMenu();
  }

  function onMenuToggle() {
    const nextMenuOpen = menuRef.current?.open ?? false;
    setMenuOpen(nextMenuOpen);

    if (!nextMenuOpen || !searchOpenRef.current) return;

    closeSearch({ clearQuery: true });
  }

  function getSubmittedSearchQuery(form?: HTMLFormElement | null) {
    const field = form?.elements.namedItem('search');

    if (field && 'value' in field && typeof field.value === 'string') {
      return field.value.trim();
    }

    return (searchInputRef.current?.value ?? searchQuery).trim();
  }

  function submitSearch(query: string) {
    const params = new URLSearchParams({ search: query });
    window.location.assign(`/sources?${params.toString()}`);
  }

  function onSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const submittedQuery = getSubmittedSearchQuery(event.currentTarget);

    if (!submittedQuery) {
      searchInputRef.current?.focus({ preventScroll: true });
      return;
    }

    submitSearch(submittedQuery);
  }

  function onSearchButtonClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();

    if (!searchOpenRef.current) {
      openSearch();
      return;
    }

    const submittedQuery = getSubmittedSearchQuery(event.currentTarget.form);

    if (!submittedQuery) {
      focusSearchInput();
      return;
    }

    submitSearch(submittedQuery);
  }

  function onSearchButtonPointerDown() {
    openSearch();
  }

  function onSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      closeSearch({ blur: true, clearQuery: true });
      return;
    }

    if (event.key !== 'Enter') return;

    event.preventDefault();

    const submittedQuery = getSubmittedSearchQuery(event.currentTarget.form);

    if (!submittedQuery) {
      searchInputRef.current?.focus({ preventScroll: true });
      return;
    }

    submitSearch(submittedQuery);
  }

  return (
    <div className={`${styles.slot} loom-global-nav-slot`}>
      <nav
        ref={navRef}
        className={`${styles.nav} loom-global-nav ${hidden ? `${styles.navHidden} loom-global-nav--hidden` : ''} ${
          searchOpen ? `${styles.navSearching} loom-global-nav--searching` : ''
        } ${
          menuOpen ? `${styles.navMenuOpen} loom-global-nav--menu-open` : ''
        }`}
        aria-label={ariaLabel}
        data-hidden={hidden ? 'true' : 'false'}
        onBlur={onNavBlur}
        onKeyDown={onNavKeyDown}
        onPointerMove={onNavPointerMove}
        onPointerLeave={resetNavOptics}
        style={
          hidden
            ? {
                opacity: 0,
                pointerEvents: 'none',
                transform: 'translate(-50%, calc(-100% - 1.6rem))',
              }
            : undefined
        }
      >
        <form
          className={`${styles.searchForm} loom-global-nav__search`}
          action="/sources"
          method="get"
          role="search"
          aria-label="Search Loom knowledge"
          data-open={searchOpen ? 'true' : 'false'}
          onSubmit={onSearchSubmit}
        >
          <button
            className={`${styles.searchButton} loom-global-nav__search-button`}
            type="button"
            aria-label={searchOpen ? 'Submit Loom search' : 'Open Loom search'}
            aria-controls="loom-global-search-input"
            aria-expanded={searchOpen}
            onPointerDown={onSearchButtonPointerDown}
            onClick={onSearchButtonClick}
          >
            <Search aria-hidden="true" strokeWidth={1.9} />
          </button>
          <input
            id="loom-global-search-input"
            ref={searchInputRef}
            className={`${styles.searchInput} loom-global-nav__search-input`}
            name="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            onKeyDown={onSearchKeyDown}
            placeholder="Search sources"
            aria-label="Search sources"
            autoComplete="off"
            inputMode="search"
            enterKeyHint="search"
            tabIndex={searchOpen ? 0 : -1}
          />
        </form>
        <a
          className={`${styles.brand} loom-global-nav__brand`}
          href="/loom"
          aria-label="Open Loom product"
          aria-current={brandCurrent ? 'page' : undefined}
        >
          <span className={`${styles.iconOrb} loom-global-nav__icon-orb`} aria-hidden="true">
            <img
              className={`${styles.icon} loom-global-nav__icon`}
              src="/brand/loom_lunar_orb.png"
              alt=""
              draggable={false}
            />
          </span>
          <span>Loom</span>
        </a>
        <details
          ref={menuRef}
          className={`${styles.menu} loom-global-nav__menu`}
          onToggle={onMenuToggle}
        >
          <summary aria-label="Open Loom menu" aria-expanded={menuOpen}>
            <span className={styles.menuLabel}>Menu</span>
            <span className={styles.menuChevron} aria-hidden="true" />
          </summary>
          <div className={`${styles.menuPanel} loom-global-nav__menu-panel`}>
            <div className={`${styles.menuGroup} loom-global-nav__menu-group`}>
              <span className={`${styles.menuGroupLabel} loom-global-nav__menu-group-label`}>
                Identity
              </span>
              <div className={`${styles.menuGroupLinks} loom-global-nav__menu-group-links`}>
                {VERIFIED_DOSSIER_TOP_NAV.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    aria-current={item.href === activeHref ? 'page' : undefined}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
            <div className={`${styles.menuGroup} loom-global-nav__menu-group`}>
              <span className={`${styles.menuGroupLabel} loom-global-nav__menu-group-label`}>
                Workspaces
              </span>
              <div className={`${styles.menuGroupLinks} loom-global-nav__menu-group-links`}>
                {LOOM_WORKSPACE_NAV.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    aria-current={item.href === activeHref ? 'page' : undefined}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </details>
      </nav>
    </div>
  );
}
