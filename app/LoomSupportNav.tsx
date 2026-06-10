import Link from 'next/link';
import styles from './loom-support-page.module.css';

/**
 * LoomSupportNav — the unified top nav shared by the six Loom product
 * support pages (/system, /discipline, /hour, /connections, /colophon,
 * /year). One source for the nav row so the active-underline treatment
 * (single 1px var(--gold) hairline underline; inactive var(--text-3) →
 * hover var(--text-1)) stays consistent across all of them.
 */

export type LoomSupportNavKey =
  | '/system'
  | '/discipline'
  | '/year'
  | '/hour'
  | '/connections'
  | '/colophon';

const SUPPORT_LINKS: ReadonlyArray<{ href: LoomSupportNavKey; label: string }> = [
  { href: '/system', label: 'System' },
  { href: '/discipline', label: 'Discipline' },
  { href: '/year', label: 'The Year' },
  { href: '/hour', label: 'The Hour' },
  { href: '/connections', label: 'Connections' },
  { href: '/colophon', label: 'Colophon' },
];

export function LoomSupportNav({ active }: { active: LoomSupportNavKey }) {
  return (
    <nav className={styles.nav} aria-label="Loom support surfaces">
      <Link href="/loom" className={styles.navWordmark} aria-label="Open Loom product">
        Loom
      </Link>
      <div className={styles.navLinks}>
        {SUPPORT_LINKS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={styles.navLink}
            aria-current={item.href === active ? 'page' : undefined}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
