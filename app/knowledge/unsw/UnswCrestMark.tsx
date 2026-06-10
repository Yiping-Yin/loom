import styles from './UnswDossier.module.css';

export function UnswCrestMark() {
  return (
    <span className={styles.unswMark} aria-label="UNSW Sydney">
      <img src="/brand/unsw/unsw-crest.png" alt="" draggable={false} />
    </span>
  );
}
