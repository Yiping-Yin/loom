# LOOM Beginner Profile — Phase 1 (Schema + Persistence) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the data foundation for beginner-input identity — a `BeginnerProfile` schema, local file persistence, and a `/api/profile` route — so later phases (graceful page rendering, wizard) have a tested store to build on.

**Architecture:** A pure schema/normalizer module (`lib/profile/beginner-profile.ts`), a file-backed store mirroring `lib/coworks-store.ts` (`lib/profile/profile-store.ts`, JSON under `loomUserDataRoot()`), and a Next route handler mirroring `app/api/content-root/route.ts`. Validation lives in the pure normalizer so it's unit-testable without the filesystem.

**Tech Stack:** Next 16 / React 19, Node fs, `node:test` + `node:assert/strict` contract tests run via `tsx --test` (`npm run test:contracts`).

Spec: `docs/superpowers/specs/2026-06-19-loom-beginner-profile-onboarding-design.md`. This plan is **Phase 1 only**; P2 (graceful page rendering) and P3 (wizard UI) get their own plans after P1 lands (they need P1's types + per-page reading).

---

## File map
- Create: `lib/profile/beginner-profile.ts` — types + `emptyBeginnerProfile()` + pure `normalizeBeginnerProfile(raw)`.
- Create: `lib/profile/profile-store.ts` — `profileStorePath()`, `readBeginnerProfile(file?)`, `writeBeginnerProfile(p, file?)`.
- Create: `app/api/profile/route.ts` — `GET` (read) + `POST` (normalize + write).
- Create: `tests/beginner-profile.test.ts` — normalizer unit tests + store round-trip + route source-contract.
- Modify: `package.json` — add the new test file to the `test:contracts` script.

---

## Task 0: Branch + baseline
**Files:** none (git)
- [ ] **Step 1: Branch**
```bash
cd ~/dev/LOOM
git checkout -b loom-beginner-profile
```
- [ ] **Step 2: Baseline green**

Run: `npm run typecheck` → expect exit 0. (If it needs a build first per repo norms, run `npm run build` then typecheck.) Don't build on red.

---

## Task 1: Schema + normalizer (`lib/profile/beginner-profile.ts`)

**Files:**
- Create: `lib/profile/beginner-profile.ts`
- Test: `tests/beginner-profile.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/beginner-profile.test.ts`:
```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { emptyBeginnerProfile, normalizeBeginnerProfile } from '../lib/profile/beginner-profile';

test('emptyBeginnerProfile is a valid empty shape', () => {
  const p = emptyBeginnerProfile();
  assert.equal(p.version, 1);
  assert.deepEqual(p.education, []);
  assert.deepEqual(p.about.links, []);
});

test('normalize coerces garbage to safe defaults', () => {
  assert.deepEqual(normalizeBeginnerProfile(null), emptyBeginnerProfile());
  assert.deepEqual(normalizeBeginnerProfile('nope'), emptyBeginnerProfile());
  const p = normalizeBeginnerProfile({ home: { name: 5 }, education: 'x', about: { links: 'y' } });
  assert.equal(p.home.name, '');
  assert.deepEqual(p.education, []);
  assert.deepEqual(p.about.links, []);
});

test('normalize preserves valid data and drops empty entries', () => {
  const p = normalizeBeginnerProfile({
    home: { name: 'Ada', headline: 'Engineer' },
    about: { summary: 'hi', links: [{ label: 'GitHub', href: 'https://x' }, { href: '' }] },
    education: [{ institution: 'UNSW', qualification: 'BSc' }, {}],
    experience: [{ role: 'Dev', organization: 'Acme', bullets: ['shipped', 7] }, { bullets: [] }],
  });
  assert.equal(p.home.name, 'Ada');
  assert.equal(p.about.links.length, 1);
  assert.equal(p.education.length, 1);
  assert.equal(p.experience.length, 1);
  assert.deepEqual(p.experience[0].bullets, ['shipped']);
});
```

- [ ] **Step 2: Run it, verify it fails**

Run: `npx tsx --test tests/beginner-profile.test.ts`
Expected: FAIL (cannot find module `../lib/profile/beginner-profile`).

- [ ] **Step 3: Implement `lib/profile/beginner-profile.ts`**
```ts
export type ProfileLink = { label: string; href: string };
export type EducationEntry = {
  institution: string; qualification: string;
  field?: string; start?: string; end?: string; notes?: string;
};
export type ExperienceEntry = {
  role: string; organization: string;
  start?: string; end?: string; location?: string; bullets: string[];
};
export type BeginnerProfile = {
  version: 1;
  home: { name: string; headline: string };
  about: { summary: string; links: ProfileLink[] };
  education: EducationEntry[];
  experience: ExperienceEntry[];
};

export function emptyBeginnerProfile(): BeginnerProfile {
  return {
    version: 1,
    home: { name: '', headline: '' },
    about: { summary: '', links: [] },
    education: [],
    experience: [],
  };
}

const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const optStr = (v: unknown): string | undefined =>
  typeof v === 'string' && v.trim() ? v : undefined;

export function normalizeBeginnerProfile(raw: unknown): BeginnerProfile {
  if (!raw || typeof raw !== 'object') return emptyBeginnerProfile();
  const r = raw as Record<string, unknown>;
  const home = (r.home && typeof r.home === 'object' ? r.home : {}) as Record<string, unknown>;
  const about = (r.about && typeof r.about === 'object' ? r.about : {}) as Record<string, unknown>;
  const links = Array.isArray(about.links) ? (about.links as unknown[]) : [];
  const education = Array.isArray(r.education) ? (r.education as unknown[]) : [];
  const experience = Array.isArray(r.experience) ? (r.experience as unknown[]) : [];
  return {
    version: 1,
    home: { name: str(home.name), headline: str(home.headline) },
    about: {
      summary: str(about.summary),
      links: links
        .map((l) => (l && typeof l === 'object' ? (l as Record<string, unknown>) : {}))
        .filter((l) => str(l.href))
        .map((l) => ({ label: str(l.label) || 'Link', href: str(l.href) })),
    },
    education: education
      .map((e) => (e && typeof e === 'object' ? (e as Record<string, unknown>) : {}))
      .filter((e) => str(e.institution) || str(e.qualification))
      .map((e) => ({
        institution: str(e.institution), qualification: str(e.qualification),
        field: optStr(e.field), start: optStr(e.start), end: optStr(e.end), notes: optStr(e.notes),
      })),
    experience: experience
      .map((x) => (x && typeof x === 'object' ? (x as Record<string, unknown>) : {}))
      .filter((x) => str(x.role) || str(x.organization))
      .map((x) => ({
        role: str(x.role), organization: str(x.organization),
        start: optStr(x.start), end: optStr(x.end), location: optStr(x.location),
        bullets: (Array.isArray(x.bullets) ? (x.bullets as unknown[]) : [])
          .filter((b) => typeof b === 'string' && b.trim()) as string[],
      })),
  };
}
```

- [ ] **Step 4: Run it, verify pass**

Run: `npx tsx --test tests/beginner-profile.test.ts` → Expected: PASS (3 tests).

- [ ] **Step 5: Commit**
```bash
git add lib/profile/beginner-profile.ts tests/beginner-profile.test.ts
git commit -m "feat(loom): BeginnerProfile schema + pure normalizer (P1)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: File store (`lib/profile/profile-store.ts`)

**Files:**
- Create: `lib/profile/profile-store.ts`
- Test: append to `tests/beginner-profile.test.ts`

- [ ] **Step 1: Add the failing store test** (append to `tests/beginner-profile.test.ts`):
```ts
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { readBeginnerProfile, writeBeginnerProfile } from '../lib/profile/profile-store';

test('store round-trips a profile and returns null when missing', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'loom-profile-'));
  const file = path.join(dir, 'beginner-profile.json');
  try {
    assert.equal(await readBeginnerProfile(file), null);
    await writeBeginnerProfile(
      normalizeBeginnerProfile({ home: { name: 'Ada', headline: 'Eng' } }),
      file,
    );
    const back = await readBeginnerProfile(file);
    assert.equal(back?.home.name, 'Ada');
    assert.equal(back?.version, 1);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
```

- [ ] **Step 2: Run it, verify it fails**

Run: `npx tsx --test tests/beginner-profile.test.ts` → Expected: FAIL (cannot find `../lib/profile/profile-store`).

- [ ] **Step 3: Implement `lib/profile/profile-store.ts`** (mirrors `lib/coworks-store.ts`):
```ts
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { loomUserDataRoot } from '../paths';
import { normalizeBeginnerProfile, type BeginnerProfile } from './beginner-profile';

export function profileStorePath(): string {
  return path.join(loomUserDataRoot(), 'beginner-profile.json');
}

export async function readBeginnerProfile(
  file: string = profileStorePath(),
): Promise<BeginnerProfile | null> {
  try {
    const raw = await fs.readFile(file, 'utf-8');
    return normalizeBeginnerProfile(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function writeBeginnerProfile(
  profile: BeginnerProfile,
  file: string = profileStorePath(),
): Promise<void> {
  const normalized = normalizeBeginnerProfile(profile);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(normalized, null, 2), 'utf-8');
}
```

- [ ] **Step 4: Run it, verify pass**

Run: `npx tsx --test tests/beginner-profile.test.ts` → Expected: PASS (4 tests).

- [ ] **Step 5: Commit**
```bash
git add lib/profile/profile-store.ts tests/beginner-profile.test.ts
git commit -m "feat(loom): file-backed BeginnerProfile store (P1)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: API route (`app/api/profile/route.ts`) + register tests

**Files:**
- Create: `app/api/profile/route.ts`
- Modify: `package.json` (add test to `test:contracts`)
- Test: append a source-contract to `tests/beginner-profile.test.ts`

- [ ] **Step 1: Add the failing route source-contract test** (append):
```ts
import fs from 'node:fs';
test('api/profile route wires GET+POST to the store and normalizer', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'app/api/profile/route.ts'), 'utf8');
  assert.match(src, /export async function GET/);
  assert.match(src, /export async function POST/);
  assert.match(src, /readBeginnerProfile/);
  assert.match(src, /writeBeginnerProfile/);
  assert.match(src, /normalizeBeginnerProfile/);
  assert.match(src, /runtime = ['"]nodejs['"]/);
});
```

- [ ] **Step 2: Run it, verify it fails**

Run: `npx tsx --test tests/beginner-profile.test.ts` → Expected: FAIL (route file missing).

- [ ] **Step 3: Implement `app/api/profile/route.ts`** (mirrors `app/api/content-root/route.ts`):
```ts
import { NextResponse } from 'next/server';
import { normalizeBeginnerProfile } from '../../../lib/profile/beginner-profile';
import { readBeginnerProfile, writeBeginnerProfile } from '../../../lib/profile/profile-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const profile = await readBeginnerProfile();
  return NextResponse.json({ profile });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 });
  }
  const source =
    body && typeof body === 'object' && 'profile' in (body as Record<string, unknown>)
      ? (body as Record<string, unknown>).profile
      : body;
  const profile = normalizeBeginnerProfile(source);
  try {
    await writeBeginnerProfile(profile);
    return NextResponse.json({ ok: true, profile });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
```

- [ ] **Step 4: Run it, verify pass**

Run: `npx tsx --test tests/beginner-profile.test.ts` → Expected: PASS (5 tests).

- [ ] **Step 5: Register the test in the suite**

In `package.json`, find the `"test:contracts"` script (a `tsx --test` list) and append ` tests/beginner-profile.test.ts` to the file list.

- [ ] **Step 6: Run the suite + typecheck**

Run: `npm run test:contracts` → Expected: the full suite incl. the new file passes.
Run: `npm run typecheck` → Expected: exit 0.

- [ ] **Step 7: Commit**
```bash
git add app/api/profile/route.ts package.json tests/beginner-profile.test.ts
git commit -m "feat(loom): GET/POST /api/profile + register profile contract tests (P1)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-review notes
- **Spec coverage (P1 slice):** schema → Task 1; persistence (store under `loomUserDataRoot()`, mirrors coworks) → Task 2; `/api/profile` GET/POST → Task 3. P2/P3 explicitly deferred to their own plans.
- **Placeholders:** none — every code step is complete and runnable.
- **Type consistency:** `BeginnerProfile`/`normalizeBeginnerProfile`/`emptyBeginnerProfile` defined in Task 1 and used verbatim in Tasks 2–3; store fns `readBeginnerProfile`/`writeBeginnerProfile` defined in Task 2 and referenced by the route in Task 3.
- **Testability:** fs validation tested via the pure normalizer (no fs) + the store round-trip uses a real tmp dir (the optional `file` param avoids touching `loomUserDataRoot()`).
