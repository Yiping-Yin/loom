'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { OWNER_PROFILE } from '../../lib/profile/owner-profile';
import { emptyBeginnerProfile } from '../../lib/profile/beginner-profile';
import { writeBeginnerProfileLocal } from '../../lib/profile/profile-storage';
import styles from './me.module.css';

type Status = 'idle' | 'error' | 'reset';

/**
 * One-click loader for the owner profile. "Load my profile" persists OWNER_PROFILE
 * to localStorage and navigates into the live Digital Me; "Reset to empty" clears
 * it back to a blank profile (for testing the stranger flow). No login, no server.
 */
export function MeLoader() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('idle');

  const load = () => {
    const ok = writeBeginnerProfileLocal(OWNER_PROFILE);
    if (!ok) {
      setStatus('error');
      return;
    }
    router.push('/digital-me');
  };

  const reset = () => {
    const ok = writeBeginnerProfileLocal(emptyBeginnerProfile());
    setStatus(ok ? 'reset' : 'error');
  };

  return (
    <main className={styles.shell}>
      <section className={styles.card} aria-labelledby="me-title">
        <p className={styles.eyebrow}>Loom · Owner</p>
        <h1 id="me-title" className={styles.title}>
          Load my profile
        </h1>

        <p className={styles.identity}>
          <span className={styles.name}>{OWNER_PROFILE.home.name}</span>
          <span className={styles.headline}>{OWNER_PROFILE.home.headline}</span>
        </p>

        <p className={styles.lede}>
          This loads your real profile into the live product on this device —
          Digital Me, About, Education, Experience, Studio and Ask all become you.
          No login. Your data stays in this browser.
        </p>

        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={load}>
            Load my profile
          </button>
          <button type="button" className={styles.ghost} onClick={reset}>
            Reset to empty
          </button>
        </div>

        {status === 'reset' && (
          <p className={styles.note} role="status">
            Cleared. This device now shows the empty (stranger) profile.
          </p>
        )}
        {status === 'error' && (
          <p className={styles.noteError} role="status">
            Couldn&rsquo;t write to this browser&rsquo;s storage (private mode or
            quota). Try a normal window.
          </p>
        )}
      </section>
    </main>
  );
}
