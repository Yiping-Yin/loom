# LOOM Backend Phase 1 — Auth + Profile Sync — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Supabase-backed email/password auth and per-user cloud sync of the `BeginnerProfile`, so signing in on one device shows your Digital Me on another — while signed-out LOOM stays 100% local.

**Architecture:** Local-first. localStorage stays authoritative; signing in enables an additive sync layer. `@supabase/supabase-js` runs in-page on both the web build and the static macOS app (the `loom://` CSP/ATS already permit HTTPS). A narrow gateway interface wraps Supabase so the sync engine is unit-testable with a fake. When `NEXT_PUBLIC_SUPABASE_*` env vars are absent, the whole layer is inert and the app behaves exactly as today.

**Tech Stack:** TypeScript, React 19, Next 16, `@supabase/supabase-js`, `node:test` + `tsx` (test runner). Spec: `docs/superpowers/specs/2026-06-24-loom-backend-phase1-auth-profile-sync-design.md`.

**Conventions to follow (from the codebase):**
- Tests run via `tsx --test` and are registered in the `test:contracts` script in `package.json`. Browser globals are stubbed with an in-memory `MemStorage` and a `globalThis.window` shim (see `tests/today-jots.test.ts`).
- Typecheck: `npm run typecheck`. It mutates `tsconfig.json`/`next-env.d.ts`; **always run `git checkout -- tsconfig.json next-env.d.ts` afterward.**
- Client storage modules read `typeof window` at call time (SSR-safe), never at import time.
- Browser change-events use a named const + `CustomEvent` (see `lib/ai-cli.ts`).
- New app routes must be classified in `lib/new-loom/product-shell.ts` or the route-classification contract test (`tests/new-loom-skeleton-contract.test.ts`) fails.
- Client-generated UUIDs; the backend accepts client ids, never reassigns.

**Version-clock model (shared by Tasks 3,5,7 — read once):**
The local profile has no timestamp today. We add a single **local version clock** `localUpdatedAt` (ms, a localStorage number) that is bumped to `Date.now()` on every local profile change. The Postgres row's `updated_at` stores **that same client ms** (sent explicitly on upsert as ISO — we never let the DB default it, or the clocks would diverge). Sync compares `localUpdatedAt` vs `Date.parse(row.updated_at)`: higher wins (LWW); on apply-remote we set `localUpdatedAt = remoteMs` so it converges and won't re-push. Clock skew across the owner's own devices is an accepted v1 limitation.

---

## Task 1: Supabase client singleton (inert when unconfigured)

**Files:**
- Modify: `package.json` (add dependency + register new test)
- Create: `lib/supabase/client.ts`
- Test: `tests/supabase-client.test.ts`

- [ ] **Step 1: Add the dependency**

Run: `npm install @supabase/supabase-js@^2`
Expected: `package.json` gains `"@supabase/supabase-js": "^2.x"` under dependencies; lockfile updates.

- [ ] **Step 2: Write the failing test**

Create `tests/supabase-client.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';

// No NEXT_PUBLIC_SUPABASE_* in the test env → the module must be inert.
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase/client';

test('isSupabaseConfigured is false when env vars are absent', () => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  assert.equal(isSupabaseConfigured(), false);
});

test('getSupabaseClient returns null when unconfigured (no throw)', () => {
  assert.equal(getSupabaseClient(), null);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx tsx --test tests/supabase-client.test.ts`
Expected: FAIL — `Cannot find module '../lib/supabase/client'`.

- [ ] **Step 4: Implement the client**

Create `lib/supabase/client.ts`:

```ts
/**
 * The ONLY place that reads NEXT_PUBLIC_SUPABASE_*. Returns a singleton browser
 * Supabase client, or null when unconfigured — so the whole backend layer is
 * inert in builds/tests without env (LOOM then runs 100% local, as today).
 *
 * The anon key is public by design; Row-Level Security is the real protection.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null | undefined;

function readEnv(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return { url, key };
}

export function isSupabaseConfigured(): boolean {
  return readEnv() !== null;
}

export function getSupabaseClient(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  const env = readEnv();
  cached = env ? createClient(env.url, env.key) : null;
  return cached;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx tsx --test tests/supabase-client.test.ts`
Expected: PASS (2/2).

- [ ] **Step 6: Register the test** in `package.json` `test:contracts` — append ` tests/supabase-client.test.ts` to the end of the test list (before the closing quote).

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json lib/supabase/client.ts tests/supabase-client.test.ts
git commit -m "feat(supabase): client singleton, inert when unconfigured"
```

---

## Task 2: Profile change-notification seam

**Files:**
- Create: `lib/profile/profile-events.ts`
- Modify: `lib/profile/profile-storage.ts` (emit on successful write)
- Test: `tests/profile-events.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/profile-events.test.ts`:

```ts
import test, { before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

class MemStorage implements Storage {
  private store = new Map<string, string>();
  get length() { return this.store.size; }
  key(i: number) { return [...this.store.keys()][i] ?? null; }
  getItem(k: string) { return this.store.get(k) ?? null; }
  setItem(k: string, v: string) { this.store.set(k, v); }
  removeItem(k: string) { this.store.delete(k); }
  clear() { this.store.clear(); }
}

let mem: MemStorage;
let target: EventTarget;

before(() => {
  mem = new MemStorage();
  target = new EventTarget();
  // window shim with localStorage + event dispatch/subscribe
  // @ts-ignore test environment
  globalThis.window = {
    localStorage: mem,
    dispatchEvent: (e: Event) => target.dispatchEvent(e),
    addEventListener: (t: string, cb: EventListenerOrEventListenerObject) => target.addEventListener(t, cb),
    removeEventListener: (t: string, cb: EventListenerOrEventListenerObject) => target.removeEventListener(t, cb),
  };
});

beforeEach(() => mem.clear());

test('writeBeginnerProfileLocal emits the change event on success', async () => {
  const { writeBeginnerProfileLocal } = await import('../lib/profile/profile-storage');
  const { BEGINNER_PROFILE_CHANGE_EVENT } = await import('../lib/profile/profile-events');
  let fired = 0;
  const handler = () => { fired += 1; };
  target.addEventListener(BEGINNER_PROFILE_CHANGE_EVENT, handler);
  const ok = writeBeginnerProfileLocal({
    version: 1, home: { name: 'A', headline: 'B' },
    about: { summary: '', links: [] }, education: [], experience: [], works: [],
    artifacts: [], capabilities: [],
  });
  target.removeEventListener(BEGINNER_PROFILE_CHANGE_EVENT, handler);
  assert.equal(ok, true);
  assert.equal(fired, 1);
});

test('notifyBeginnerProfileChanged is a no-op under SSR (no window)', async () => {
  const { notifyBeginnerProfileChanged } = await import('../lib/profile/profile-events');
  const saved = globalThis.window;
  // @ts-ignore
  delete globalThis.window;
  assert.doesNotThrow(() => notifyBeginnerProfileChanged());
  // @ts-ignore
  globalThis.window = saved;
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/profile-events.test.ts`
Expected: FAIL — `Cannot find module '../lib/profile/profile-events'`.

- [ ] **Step 3: Create the events module**

Create `lib/profile/profile-events.ts`:

```ts
/**
 * Change-notification for the beginner profile. The sync layer subscribes to
 * this; profile-storage emits it on every successful local write. One-way: the
 * sync layer depends on storage, never the reverse.
 */
export const BEGINNER_PROFILE_CHANGE_EVENT = 'loom:beginner-profile:changed';

/** Emit the change event. SSR-safe no-op when there is no window. */
export function notifyBeginnerProfileChanged(): void {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent(BEGINNER_PROFILE_CHANGE_EVENT));
  } catch {
    // dispatch can throw in exotic embeddings; never let it break a write.
  }
}

/** Subscribe to profile changes. Returns an unsubscribe fn. SSR-safe. */
export function onBeginnerProfileChange(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(BEGINNER_PROFILE_CHANGE_EVENT, cb);
  return () => window.removeEventListener(BEGINNER_PROFILE_CHANGE_EVENT, cb);
}
```

- [ ] **Step 4: Emit from the storage write**

In `lib/profile/profile-storage.ts`, add the import at the top (after the existing import):

```ts
import { notifyBeginnerProfileChanged } from './profile-events';
```

Then in `writeBeginnerProfileLocal`, replace the success path:

```ts
  try {
    store.setItem(BEGINNER_PROFILE_KEY, JSON.stringify(normalized));
    notifyBeginnerProfileChanged();
    return true;
  } catch {
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx tsx --test tests/profile-events.test.ts`
Expected: PASS (2/2).

- [ ] **Step 6: Guard against regressions** — run the existing profile tests:

Run: `npx tsx --test tests/profile-wizard.test.tsx tests/owner-profile.test.ts`
Expected: PASS (unchanged).

- [ ] **Step 7: Register + commit**

Append ` tests/profile-events.test.ts` to `test:contracts` in `package.json`.

```bash
git add lib/profile/profile-events.ts lib/profile/profile-storage.ts tests/profile-events.test.ts package.json
git commit -m "feat(profile): emit change event on local write (sync dirty-trigger)"
```

---

## Task 3: Last-write-wins merge (pure)

**Files:**
- Create: `lib/sync/merge.ts`
- Test: `tests/sync-merge.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/sync-merge.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { pickWinner } from '../lib/sync/merge';

const L = { value: 'local', updatedAt: 100 };
const R = { value: 'remote', updatedAt: 200 };

test('higher updatedAt wins', () => {
  assert.deepEqual(pickWinner(L, R), { value: 'remote', updatedAt: 200, source: 'remote' });
  assert.deepEqual(pickWinner(R, L), { value: 'remote', updatedAt: 200, source: 'local' });
});

test('tie prefers local (do not clobber a fresh local edit)', () => {
  const a = { value: 'local', updatedAt: 100 };
  const b = { value: 'remote', updatedAt: 100 };
  assert.equal(pickWinner(a, b)!.source, 'local');
});

test('null sides', () => {
  assert.deepEqual(pickWinner(L, null), { value: 'local', updatedAt: 100, source: 'local' });
  assert.deepEqual(pickWinner(null, R), { value: 'remote', updatedAt: 200, source: 'remote' });
  assert.equal(pickWinner(null, null), null);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/sync-merge.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `lib/sync/merge.ts`:

```ts
/**
 * Last-write-wins by millisecond timestamp. Pure, no I/O. Tie prefers local so a
 * just-made local edit is never clobbered by an equal-stamp remote.
 */
export type Stamped<T> = { value: T; updatedAt: number };
export type Winner<T> = { value: T; updatedAt: number; source: 'local' | 'remote' };

export function pickWinner<T>(local: Stamped<T> | null, remote: Stamped<T> | null): Winner<T> | null {
  if (local && remote) {
    return remote.updatedAt > local.updatedAt
      ? { ...remote, source: 'remote' }
      : { ...local, source: 'local' };
  }
  if (local) return { ...local, source: 'local' };
  if (remote) return { ...remote, source: 'remote' };
  return null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/sync-merge.test.ts`
Expected: PASS (3/3).

- [ ] **Step 5: Register + commit**

Append ` tests/sync-merge.test.ts` to `test:contracts`.

```bash
git add lib/sync/merge.ts tests/sync-merge.test.ts package.json
git commit -m "feat(sync): last-write-wins merge primitive"
```

---

## Task 4: Profile ↔ row mapper (normalize-on-ingest)

**Files:**
- Create: `lib/sync/profile-mapper.ts`
- Test: `tests/profile-mapper.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/profile-mapper.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { rowToProfile, profileToRow, type ProfileRow } from '../lib/sync/profile-mapper';
import type { BeginnerProfile } from '../lib/profile/beginner-profile';

const profile: BeginnerProfile = {
  version: 1, home: { name: 'Yiping', headline: 'Quant' },
  about: { summary: 'hi', links: [] }, education: [], experience: [], works: [],
  artifacts: [], capabilities: [],
};

test('profileToRow carries user id + ISO updated_at', () => {
  const row = profileToRow(profile, 'user-1', 1_700_000_000_000);
  assert.equal(row.user_id, 'user-1');
  assert.equal(row.updated_at, new Date(1_700_000_000_000).toISOString());
  assert.equal((row.data as BeginnerProfile).home.name, 'Yiping');
});

test('rowToProfile normalizes (drops an unsafe href) and parses updatedAt', () => {
  const row: ProfileRow = {
    user_id: 'user-1',
    updated_at: new Date(1_700_000_000_000).toISOString(),
    data: { ...profile, about: { summary: 'hi', links: [{ label: 'x', href: 'javascript:alert(1)' }] } },
  };
  const { profile: out, updatedAt } = rowToProfile(row);
  assert.equal(updatedAt, 1_700_000_000_000);
  assert.equal(out.about.links.length, 0); // unsafe href dropped by normalize
});

test('rowToProfile on garbage data returns an empty-but-valid profile', () => {
  const { profile: out } = rowToProfile({ user_id: 'u', updated_at: new Date(0).toISOString(), data: 42 });
  assert.equal(out.version, 1);
  assert.equal(out.home.name, '');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/profile-mapper.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `lib/sync/profile-mapper.ts`:

```ts
/**
 * Maps between the BeginnerProfile and the Postgres `profiles` row. Every
 * server→client ingest runs normalizeBeginnerProfile as the trust boundary
 * (caps fields, drops unsafe hrefs) — server data is never trusted raw.
 */
import { normalizeBeginnerProfile, type BeginnerProfile } from '../profile/beginner-profile';

export type ProfileRow = { user_id: string; data: unknown; updated_at: string };

export function profileToRow(profile: BeginnerProfile, userId: string, updatedAtMs: number): ProfileRow {
  return { user_id: userId, data: profile, updated_at: new Date(updatedAtMs).toISOString() };
}

export function rowToProfile(row: ProfileRow): { profile: BeginnerProfile; updatedAt: number } {
  const updatedAt = Date.parse(row.updated_at);
  return {
    profile: normalizeBeginnerProfile(row.data),
    updatedAt: Number.isNaN(updatedAt) ? 0 : updatedAt,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/profile-mapper.test.ts`
Expected: PASS (3/3).

- [ ] **Step 5: Register + commit**

Append ` tests/profile-mapper.test.ts` to `test:contracts`.

```bash
git add lib/sync/profile-mapper.ts tests/profile-mapper.test.ts package.json
git commit -m "feat(sync): profile<->row mapper with normalize-on-ingest"
```

---

## Task 5: Local-store port (profile + version clock)

**Files:**
- Create: `lib/sync/local-store-port.ts`
- Test: `tests/local-store-port.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/local-store-port.test.ts`:

```ts
import test, { before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

class MemStorage implements Storage {
  private store = new Map<string, string>();
  get length() { return this.store.size; }
  key(i: number) { return [...this.store.keys()][i] ?? null; }
  getItem(k: string) { return this.store.get(k) ?? null; }
  setItem(k: string, v: string) { this.store.set(k, v); }
  removeItem(k: string) { this.store.delete(k); }
  clear() { this.store.clear(); }
}
let mem: MemStorage;
before(() => { mem = new MemStorage(); /* @ts-ignore */ globalThis.window = { localStorage: mem, dispatchEvent: () => true }; });
beforeEach(() => mem.clear());

test('port reads/writes the profile and the local version clock', async () => {
  const { localStorageProfilePort } = await import('../lib/sync/local-store-port');
  const port = localStorageProfilePort();
  assert.equal(port.read(), null);
  assert.equal(port.getLocalUpdatedAt(), 0);

  const ok = port.write({
    version: 1, home: { name: 'A', headline: 'B' },
    about: { summary: '', links: [] }, education: [], experience: [], works: [],
    artifacts: [], capabilities: [],
  });
  assert.equal(ok, true);
  assert.equal(port.read()!.home.name, 'A');

  port.setLocalUpdatedAt(12345);
  assert.equal(port.getLocalUpdatedAt(), 12345);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/local-store-port.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `lib/sync/local-store-port.ts`:

```ts
/**
 * The narrow seam the sync engine uses to touch local state, so the engine never
 * imports localStorage directly (keeps it unit-testable + decoupled). Wraps the
 * existing profile store and adds the local version clock (see plan header).
 */
import {
  readBeginnerProfileLocal,
  writeBeginnerProfileLocal,
} from '../profile/profile-storage';
import type { BeginnerProfile } from '../profile/beginner-profile';

export const LOCAL_UPDATED_AT_KEY = 'loom:beginner-profile:local-updated-at';

export interface ProfileLocalPort {
  read(): BeginnerProfile | null;
  write(profile: BeginnerProfile): boolean;
  getLocalUpdatedAt(): number;
  setLocalUpdatedAt(ms: number): void;
}

function ls(): Storage | null {
  if (typeof window === 'undefined') return null;
  try { return window.localStorage ?? null; } catch { return null; }
}

export function localStorageProfilePort(): ProfileLocalPort {
  return {
    read: () => readBeginnerProfileLocal(),
    write: (p) => writeBeginnerProfileLocal(p),
    getLocalUpdatedAt: () => {
      const raw = ls()?.getItem(LOCAL_UPDATED_AT_KEY);
      const n = raw ? Number(raw) : 0;
      return Number.isFinite(n) ? n : 0;
    },
    setLocalUpdatedAt: (ms) => {
      try { ls()?.setItem(LOCAL_UPDATED_AT_KEY, String(ms)); } catch { /* quota */ }
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/local-store-port.test.ts`
Expected: PASS.

- [ ] **Step 5: Register + commit**

Append ` tests/local-store-port.test.ts` to `test:contracts`.

```bash
git add lib/sync/local-store-port.ts tests/local-store-port.test.ts package.json
git commit -m "feat(sync): local-store port with version clock"
```

---

## Task 6: Auth client (null-safe wrapper)

**Files:**
- Create: `lib/auth/auth-client.ts`
- Test: `tests/auth-client.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/auth-client.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';

// Unconfigured env → every method returns the typed unconfigured result.
import { signIn, getSession, onAuthChange } from '../lib/auth/auth-client';

test('signIn returns unconfigured when Supabase is absent', async () => {
  const r = await signIn('a@b.com', 'pw');
  assert.deepEqual(r, { ok: false, error: 'unconfigured' });
});

test('getSession returns null when unconfigured', async () => {
  assert.equal(await getSession(), null);
});

test('onAuthChange returns a no-op unsubscribe when unconfigured', () => {
  const off = onAuthChange(() => {});
  assert.equal(typeof off, 'function');
  assert.doesNotThrow(off);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/auth-client.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `lib/auth/auth-client.ts`:

```ts
/**
 * Thin, null-safe wrapper over Supabase Auth (email/password). Every method
 * degrades to an 'unconfigured' result when Supabase isn't set up, so callers
 * (and the static app without env) never crash.
 */
import { getSupabaseClient } from '../supabase/client';

export type AuthSession = { userId: string; email: string | null } | null;
export type SignInResult =
  | { ok: true; session: AuthSession }
  | { ok: false; error: string };

export async function signIn(email: string, password: string): Promise<SignInResult> {
  const sb = getSupabaseClient();
  if (!sb) return { ok: false, error: 'unconfigured' };
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };
  const u = data.user;
  return { ok: true, session: u ? { userId: u.id, email: u.email ?? null } : null };
}

export async function signOut(): Promise<void> {
  await getSupabaseClient()?.auth.signOut();
}

export async function getSession(): Promise<AuthSession> {
  const sb = getSupabaseClient();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  const u = data.session?.user;
  return u ? { userId: u.id, email: u.email ?? null } : null;
}

/** Subscribe to auth changes. Returns unsubscribe. No-op when unconfigured. */
export function onAuthChange(cb: (s: AuthSession) => void): () => void {
  const sb = getSupabaseClient();
  if (!sb) return () => {};
  const { data } = sb.auth.onAuthStateChange((_evt, session) => {
    const u = session?.user;
    cb(u ? { userId: u.id, email: u.email ?? null } : null);
  });
  return () => data.subscription.unsubscribe();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/auth-client.test.ts`
Expected: PASS (3/3).

- [ ] **Step 5: Register + commit**

Append ` tests/auth-client.test.ts` to `test:contracts`.

```bash
git add lib/auth/auth-client.ts tests/auth-client.test.ts package.json
git commit -m "feat(auth): null-safe Supabase email/password wrapper"
```

---

## Task 7: Profile sync engine (pull / push / migrate)

**Files:**
- Create: `lib/sync/profile-gateway.ts` (gateway interface + Supabase impl)
- Create: `lib/sync/profile-sync.ts` (the engine)
- Test: `tests/profile-sync.test.ts`

- [ ] **Step 1: Write the failing test** (drives BOTH new files)

Create `tests/profile-sync.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { ProfileSync } from '../lib/sync/profile-sync';
import type { ProfileGateway } from '../lib/sync/profile-gateway';
import type { ProfileLocalPort } from '../lib/sync/local-store-port';
import type { BeginnerProfile } from '../lib/profile/beginner-profile';

function mkProfile(name: string): BeginnerProfile {
  return {
    version: 1, home: { name, headline: 'h' },
    about: { summary: '', links: [] }, education: [], experience: [], works: [],
    artifacts: [], capabilities: [],
  };
}

function fakePort(initial?: BeginnerProfile, ts = 0): ProfileLocalPort & { _p: BeginnerProfile | null; _ts: number } {
  return {
    _p: initial ?? null, _ts: ts,
    read() { return this._p; },
    write(p) { this._p = p; return true; },
    getLocalUpdatedAt() { return this._ts; },
    setLocalUpdatedAt(ms) { this._ts = ms; },
  };
}
function fakeGateway(row?: { data: unknown; updated_at: string } | null): ProfileGateway & { _row: any; _upserts: number } {
  return {
    _row: row ?? null, _upserts: 0,
    async fetch() { return this._row; },
    async upsert(r) { this._row = { data: r.data, updated_at: r.updated_at }; this._upserts += 1; },
  };
}

test('migration: server empty + local present → push (upsert), no local change', async () => {
  const port = fakePort(mkProfile('Local'), 500);
  const gw = fakeGateway(null);
  const status = await new ProfileSync(gw, port).syncOnce('u1');
  assert.equal(gw._upserts, 1);
  assert.equal(port.read()!.home.name, 'Local');
  assert.equal(status, 'synced');
});

test('pull: server newer → local overwritten + clock advanced', async () => {
  const port = fakePort(mkProfile('Local'), 100);
  const gw = fakeGateway({ data: mkProfile('Remote'), updated_at: new Date(900).toISOString() });
  await new ProfileSync(gw, port).syncOnce('u1');
  assert.equal(port.read()!.home.name, 'Remote');
  assert.equal(port.getLocalUpdatedAt(), 900);
  assert.equal(gw._upserts, 0); // did not push back
});

test('push: local newer → upsert with local clock', async () => {
  const port = fakePort(mkProfile('Local'), 900);
  const gw = fakeGateway({ data: mkProfile('Remote'), updated_at: new Date(100).toISOString() });
  await new ProfileSync(gw, port).syncOnce('u1');
  assert.equal(gw._upserts, 1);
  assert.equal(Date.parse(gw._row.updated_at), 900);
  assert.equal(port.read()!.home.name, 'Local');
});

test('error path → status "error", local untouched', async () => {
  const port = fakePort(mkProfile('Local'), 900);
  const gw: ProfileGateway = { async fetch() { throw new Error('network'); }, async upsert() {} };
  const status = await new ProfileSync(gw, port).syncOnce('u1');
  assert.equal(status, 'error');
  assert.equal(port.read()!.home.name, 'Local');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/profile-sync.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement the gateway**

Create `lib/sync/profile-gateway.ts`:

```ts
/**
 * Narrow Postgres seam the sync engine depends on (NOT the full Supabase client),
 * so the engine is testable with an in-memory fake. The real impl wraps the
 * `profiles` table; returns null when Supabase is unconfigured.
 */
import { getSupabaseClient } from '../supabase/client';
import { type ProfileRow } from './profile-mapper';

export interface ProfileGateway {
  fetch(userId: string): Promise<{ data: unknown; updated_at: string } | null>;
  upsert(row: ProfileRow): Promise<void>;
}

/** Real gateway, or null when Supabase isn't configured. */
export function supabaseProfileGateway(): ProfileGateway | null {
  const sb = getSupabaseClient();
  if (!sb) return null;
  return {
    async fetch(userId) {
      const { data, error } = await sb
        .from('profiles')
        .select('data, updated_at')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
    async upsert(row) {
      const { error } = await sb.from('profiles').upsert(row, { onConflict: 'user_id' });
      if (error) throw error;
    },
  };
}
```

- [ ] **Step 4: Implement the engine**

Create `lib/sync/profile-sync.ts`:

```ts
/**
 * Orchestrates one profile sync: fetch remote, LWW-merge against local, then
 * apply remote OR push local. Local-first — any failure leaves local untouched
 * and reports 'error' (never throws to the UI).
 */
import { pickWinner } from './merge';
import { rowToProfile, profileToRow } from './profile-mapper';
import type { ProfileGateway } from './profile-gateway';
import type { ProfileLocalPort } from './local-store-port';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error';

export class ProfileSync {
  constructor(private gateway: ProfileGateway, private port: ProfileLocalPort) {}

  async syncOnce(userId: string): Promise<SyncStatus> {
    try {
      const row = await this.gateway.fetch(userId);
      const remote = row ? rowToProfile(row) : null;
      const localProfile = this.port.read();
      const local = localProfile
        ? { value: localProfile, updatedAt: this.port.getLocalUpdatedAt() }
        : null;
      const remoteStamped = remote ? { value: remote.profile, updatedAt: remote.updatedAt } : null;

      const winner = pickWinner(local, remoteStamped);
      if (!winner) return 'synced'; // nothing anywhere

      if (winner.source === 'remote') {
        this.port.write(winner.value);
        this.port.setLocalUpdatedAt(winner.updatedAt);
      } else {
        // local wins (newer, tie, or remote absent) → push
        await this.gateway.upsert(profileToRow(winner.value, userId, winner.updatedAt));
      }
      return 'synced';
    } catch {
      return 'error';
    }
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx tsx --test tests/profile-sync.test.ts`
Expected: PASS (4/4).

- [ ] **Step 6: Register + commit**

Append ` tests/profile-sync.test.ts` to `test:contracts`.

```bash
git add lib/sync/profile-gateway.ts lib/sync/profile-sync.ts tests/profile-sync.test.ts package.json
git commit -m "feat(sync): profile sync engine (pull/push/migrate, LWW)"
```

---

## Task 8: Sync lifecycle hook

**Files:**
- Create: `lib/sync/use-profile-sync.ts`
- Test: `tests/use-profile-sync.test.ts`

The hook glues auth + the change event + the engine. The pure clock helper `nextLocalClock` is exported + unit-tested; the React wiring is thin.

- [ ] **Step 1: Write the failing test**

Create `tests/use-profile-sync.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { nextLocalClock } from '../lib/sync/use-profile-sync';

test('nextLocalClock advances monotonically even if the wall clock is equal/backwards', () => {
  assert.equal(nextLocalClock(100, 100), 101); // equal → +1
  assert.equal(nextLocalClock(100, 90), 101);  // backwards → prev+1
  assert.equal(nextLocalClock(100, 250), 250); // forward → wall clock
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/use-profile-sync.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `lib/sync/use-profile-sync.ts`:

```ts
'use client';

import { useEffect, useRef, useState } from 'react';
import { onAuthChange, getSession, type AuthSession } from '../auth/auth-client';
import { onBeginnerProfileChange } from '../profile/profile-events';
import { localStorageProfilePort } from './local-store-port';
import { supabaseProfileGateway } from './profile-gateway';
import { ProfileSync, type SyncStatus } from './profile-sync';

/** Monotonic version clock: never returns ≤ prev, so equal/backwards wall clocks still advance. */
export function nextLocalClock(prev: number, wall: number): number {
  return wall > prev ? wall : prev + 1;
}

/**
 * Drives profile sync for the signed-in user: sync on sign-in, debounced push on
 * local change, pull on window focus. Inert when Supabase is unconfigured or
 * signed out. Returns the current session + sync status for the UI.
 */
export function useProfileSync(): { session: AuthSession; status: SyncStatus } {
  const [session, setSession] = useState<AuthSession>(null);
  const [status, setStatus] = useState<SyncStatus>('idle');
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;
    const port = localStorageProfilePort();
    const gateway = supabaseProfileGateway();
    const engine = gateway ? new ProfileSync(gateway, port) : null;

    const run = async (userId: string) => {
      if (!engine) return;
      setStatus('syncing');
      const s = await engine.syncOnce(userId);
      if (active) setStatus(s);
    };

    getSession().then((s) => { if (active) { setSession(s); if (s) run(s.userId); } });

    const offAuth = onAuthChange((s) => {
      if (!active) return;
      setSession(s);
      if (s) run(s.userId); else setStatus('idle');
    });

    const offChange = onBeginnerProfileChange(() => {
      port.setLocalUpdatedAt(nextLocalClock(port.getLocalUpdatedAt(), Date.now()));
      if (debounce.current) clearTimeout(debounce.current);
      debounce.current = setTimeout(() => {
        getSession().then((s) => { if (s) run(s.userId); });
      }, 1200);
    });

    const onFocus = () => { getSession().then((s) => { if (s) run(s.userId); }); };
    if (typeof window !== 'undefined') window.addEventListener('focus', onFocus);

    return () => {
      active = false;
      offAuth(); offChange();
      if (debounce.current) clearTimeout(debounce.current);
      if (typeof window !== 'undefined') window.removeEventListener('focus', onFocus);
    };
  }, []);

  return { session, status };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/use-profile-sync.test.ts`
Expected: PASS.

- [ ] **Step 5: Register + commit**

Append ` tests/use-profile-sync.test.ts` to `test:contracts`.

```bash
git add lib/sync/use-profile-sync.ts tests/use-profile-sync.test.ts package.json
git commit -m "feat(sync): lifecycle hook (sign-in/change/focus) + monotonic clock"
```

---

## Task 9: /account route — sign-in UI + sync status

**Files:**
- Create: `app/account/page.tsx` (server, metadata)
- Create: `app/account/AccountClient.tsx` (client)
- Create: `app/account/account.module.css`
- Modify: `lib/new-loom/product-shell.ts` (classify `/account` internal)
- Test: `tests/account-route.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `tests/account-route.test.tsx`:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (p: string) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8');
const client = read('../app/account/AccountClient.tsx');
const page = read('../app/account/page.tsx');

test('account client wires auth + sync + sign-out', () => {
  assert.match(client, /useProfileSync/);
  assert.match(client, /signIn\(/);
  assert.match(client, /signOut\(/);
});

test('account client surfaces the unconfigured (cloud off) state', () => {
  assert.match(client, /isSupabaseConfigured/);
});

test('account page sets a title and renders the client', () => {
  assert.match(page, /metadata/);
  assert.match(page, /AccountClient/);
});

test('/account is classified as an internal route', () => {
  const shell = read('../lib/new-loom/product-shell.ts');
  assert.match(shell, /'\/account'/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/account-route.test.tsx`
Expected: FAIL — files not found.

- [ ] **Step 3: Classify the route**

In `lib/new-loom/product-shell.ts`, add `'/account',` to the `NEW_LOOM_INTERNAL_ROUTES` array (keep it alphabetical — before `'/demo'`).

- [ ] **Step 4: Create the page**

Create `app/account/page.tsx`:

```tsx
import { AccountClient } from './AccountClient';

export const metadata = { title: 'Account · Loom' };

/** /account — sign in to enable cloud sync of your Digital Me across devices. */
export default function AccountPage() {
  return <AccountClient />;
}
```

- [ ] **Step 5: Create the client**

Create `app/account/AccountClient.tsx`:

```tsx
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
            <p className={styles.lede}>{session.email}</p>
            <p className={styles.status} role="status">{STATUS_LABEL[status] ?? status}</p>
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
```

- [ ] **Step 6: Create the styles**

Create `app/account/account.module.css` (reuses real tokens — same set the `/me` loader uses):

```css
.shell { min-height: 100dvh; display: grid; place-items: center; padding: var(--space-6); }
.card {
  width: min(28rem, 100%); display: flex; flex-direction: column; gap: var(--space-4);
  padding: var(--space-8); border: 1px solid var(--line); border-radius: 14px; background: var(--bg-elevated);
}
.eyebrow { margin: 0; font-size: 0.72rem; letter-spacing: var(--tracking-eyebrow); text-transform: uppercase; color: var(--muted); }
.title { margin: 0; font-family: var(--font-cormorant), serif; font-size: clamp(1.8rem, 4vw, 2.3rem); font-weight: 500; color: var(--fg); }
.lede { margin: 0; font-size: 0.95rem; line-height: 1.55; color: var(--fg-secondary); }
.status { margin: 0; font-size: 0.8rem; color: var(--muted); }
.form { display: flex; flex-direction: column; gap: var(--space-3); margin-top: var(--space-2); }
.input { font: inherit; padding: 0.7em 0.9em; border: 1px solid var(--line); border-radius: 10px; background: transparent; color: var(--fg); }
.input:focus-visible { outline: 2px solid var(--signature-cyan); outline-offset: 1px; }
.primary, .ghost { font: inherit; font-size: 0.95rem; padding: 0.7em 1.3em; border-radius: 10px; cursor: pointer; }
.primary { border: 1px solid var(--signature-cyan); background: var(--signature-cyan); color: #0b1416; font-weight: 600; }
.primary:disabled { opacity: 0.6; cursor: default; }
.ghost { border: 1px solid var(--line); background: transparent; color: var(--fg-secondary); align-self: flex-start; }
.ghost:hover { color: var(--fg); border-color: var(--fg-secondary); }
.error { margin: 0; font-size: 0.85rem; color: #b4453a; }
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npx tsx --test tests/account-route.test.tsx`
Expected: PASS (4/4).

- [ ] **Step 8: Register + commit**

Append ` tests/account-route.test.tsx` to `test:contracts`.

```bash
git add app/account lib/new-loom/product-shell.ts tests/account-route.test.tsx package.json
git commit -m "feat(account): /account sign-in UI + sync status (inert when cloud off)"
```

---

## Task 10: Discreet account entry + full verification + setup doc

**Files:**
- Modify: `app/IdentityEmptyState.tsx` (add a quiet "Sign in to sync" link)
- Create: `docs/supabase-setup.md` (owner setup checklist + schema SQL)
- Test: extend `tests/account-route.test.tsx`

- [ ] **Step 1: Add a discreet account entry on the empty state**

In `app/IdentityEmptyState.tsx`, directly below the existing `Owner? Load your profile →` paragraph, add a second muted link:

```tsx
        <p style={{ marginTop: 'var(--space-3)', fontSize: '0.8rem' }}>
          <a href="/account" style={{ color: 'var(--muted)' }}>
            Sign in to sync →
          </a>
        </p>
```

- [ ] **Step 2: Add the assertion to the route test**

Append to `tests/account-route.test.tsx`:

```ts
test('the identity empty state links to /account', () => {
  const empty = read('../app/IdentityEmptyState.tsx');
  assert.match(empty, /href="\/account"/);
});
```

Run: `npx tsx --test tests/account-route.test.tsx`
Expected: PASS (5/5).

- [ ] **Step 3: Write the owner setup doc**

Create `docs/supabase-setup.md`:

````markdown
# Supabase setup (owner, one-time)

LOOM Phase 1 cloud sync needs a Supabase project. Until these steps are done in a
build, that build runs fully local (cloud sync shows "off").

1. Create a project at supabase.com (free tier).
2. SQL editor → run:

```sql
create table public.profiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "own profile - select" on public.profiles for select using (auth.uid() = user_id);
create policy "own profile - insert" on public.profiles for insert with check (auth.uid() = user_id);
create policy "own profile - update" on public.profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

3. Authentication → Providers → Email: enable; Authentication → Sign-ups: **disable** new sign-ups (owner-only).
4. Authentication → Users → Add user: create your account (email + password).
5. Project settings → API: copy the Project URL and the `anon` public key.
6. Set env (web/Vercel AND the static-export build):
   - `NEXT_PUBLIC_SUPABASE_URL=<project url>`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>`
7. Rebuild. Open `/account`, sign in — your local Digital Me uploads on first sync;
   sign in on another device to pull it down.
````

- [ ] **Step 4: Full suite**

Run: `npm run test:contracts`
Expected: all pass (≈730 prior + new ≈ 749), 0 fail.

- [ ] **Step 5: Typecheck (and restore config)**

Run: `npm run typecheck; git checkout -- tsconfig.json next-env.d.ts`
Expected: exit 0, no `error TS`.

- [ ] **Step 6: Confirm the static export still builds with the new dep**

Run: `rm -rf .next-build.lock; LOOM_NEXT_OUTPUT=export LOOM_DIST_DIR=.next-export-check npm run build`
Expected: build completes (supabase-js is client-safe). Then `rm -rf .next-export-check`.

- [ ] **Step 7: Commit**

```bash
git add app/IdentityEmptyState.tsx docs/supabase-setup.md tests/account-route.test.tsx
git commit -m "feat(account): empty-state entry + owner Supabase setup doc; verify build"
```

---

## Self-Review (done by the plan author)

**Spec coverage:** auth (T6,T9) ✓; profiles table/RLS (T10 doc + spec SQL) ✓; in-page supabase-js + inert mode (T1,T9) ✓; profile-only sync + LWW (T3,T4,T7) ✓; migration (T7 server-empty branch) ✓; change-trigger seam (T2) ✓; normalize-on-ingest (T4) ✓; route classification (T9) ✓; static-export still builds (T10) ✓; testing via fakes (T3–T8) ✓; owner setup prerequisites (T10 doc) ✓.

**Type consistency:** `ProfileRow`, `ProfileGateway`, `ProfileLocalPort`, `Stamped/Winner`, `SyncStatus`, `AuthSession`, `SignInResult` are defined once and imported; `nextLocalClock`/`pickWinner`/`rowToProfile`/`profileToRow` signatures match their call sites.

**Out of scope (later phases):** artifact blobs, Studio drafts, traces/panels/weaves, public signup, the Swift Keychain bridge.
