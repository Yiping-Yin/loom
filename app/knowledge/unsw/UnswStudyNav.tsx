import { UNSW_ECON3202_PROBLEM_SETS } from '../../../lib/new-loom/unsw-shelf';
import styles from './UnswDossier.module.css';

type UnswStudyNavActive = 'unsw' | 'econ3202' | string;

export function UnswStudyNav({ active }: { active: UnswStudyNavActive }) {
  return (
    <nav aria-label="UNSW course navigation" className={styles.courseRail}>
      <a href="/knowledge/unsw" className={styles.brand} aria-current={active === 'unsw' ? 'page' : undefined}>
        UNSW
      </a>
      <div className={styles.navGroup}>
        <NavLink href="/sources" label="Sources" active={active === 'sources'} />
        <NavLink href="/knowledge/unsw/econ3202" label="ECON3202" active={active === 'econ3202'} />
      </div>
      <div aria-label="Problem-set navigation" className={styles.problemGroup}>
        {UNSW_ECON3202_PROBLEM_SETS.map((set) => (
          <NavLink
            key={set.slug}
            href={`/knowledge/unsw/econ3202/${set.slug}`}
            label={set.label}
            active={active === set.slug}
          />
        ))}
      </div>
    </nav>
  );
}

function NavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <a
      href={href}
      aria-current={active ? 'page' : undefined}
      className={[
        label.startsWith('PS') ? styles.problemLink : styles.navLink,
        active ? (label.startsWith('PS') ? styles.activeProblem : styles.activeLink) : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {label}
    </a>
  );
}
