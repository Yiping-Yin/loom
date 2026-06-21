'use client';
import type { Constellation } from '../lib/onboarding/constellation';
import styles from './ConstellationField.module.css';

export function ConstellationField({ data }: { data: Constellation }) {
  return (
    <svg
      className={styles.field}
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {data.stars.map((s) => (
        <circle
          key={s.id}
          cx={s.x}
          cy={s.y}
          r={s.magnitude >= 2 ? 0.9 : 0.6}
          className={s === data.comet ? styles.comet : styles.star}
        />
      ))}
    </svg>
  );
}
