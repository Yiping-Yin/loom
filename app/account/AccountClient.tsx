'use client';

import { useState } from 'react';
import { isSupabaseConfigured } from '../../lib/supabase/client';
import { signIn, signOut } from '../../lib/auth/auth-client';
import { useProfileSync } from '../../lib/sync/use-profile-sync';
import styles from './account.module.css';

const STATUS_LABEL: Record<string, string> = {
  idle: 'Not syncing', syncing: 'Syncing…', synced: 'Synced', offline: 'Offline', error: 'Sync error',
};

export function AccountClient() {
  const configured = isSupabaseConfigured();
  const { session, status } = useProfileSync();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    const r = await signIn(email.trim(), password);
    setBusy(false);
    if (!r.ok) setError(r.error === 'unconfigured' ? 'Cloud sync is not configured.' : r.error);
  };

  if (!configured) {
    return (
      <main className={styles.shell}>
        <section className={styles.card}>
          <p className={styles.eyebrow}>Loom · Account</p>
          <h1 className={styles.title}>Cloud sync is off</h1>
          <p className={styles.lede}>
            This build has no backend configured, so LOOM is running fully on this
            device. Everything still works locally.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.shell}>
      <section className={styles.card} aria-labelledby="account-title">
        <p className={styles.eyebrow}>Loom · Account</p>
        {session ? (
          <>
            <h1 id="account-title" className={styles.title}>Signed in</h1>
            <dl className={styles.fields}>
              <div className={styles.field}>
                <dt className={styles.fieldLabel}>Account</dt>
                <dd className={styles.fieldValue}>{session.email}</dd>
              </div>
              <div className={styles.field}>
                <dt className={styles.fieldLabel}>Sync</dt>
                <dd className={styles.fieldValue} role="status">
                  <span className={styles.syncDot} data-status={status} aria-hidden="true" />
                  {STATUS_LABEL[status] ?? status}
                </dd>
              </div>
            </dl>
            <button type="button" className={styles.ghost} onClick={() => signOut()}>Sign out</button>
          </>
        ) : (
          <>
            <h1 id="account-title" className={styles.title}>Sign in</h1>
            <p className={styles.lede}>Sync your Digital Me across your devices.</p>
            <form className={styles.form} onSubmit={onSubmit}>
              <input className={styles.input} type="email" autoComplete="email"
                placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <input className={styles.input} type="password" autoComplete="current-password"
                placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button className={styles.primary} type="submit" disabled={busy}>
                {busy ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
            {error && <p className={styles.error} role="status">{error}</p>}
          </>
        )}
      </section>
    </main>
  );
}
