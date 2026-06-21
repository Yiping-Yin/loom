# Conversational Cosmos Entry — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/` the right front door for who you are — new users get a conversation-first cosmic cover; returning users go straight into their usable LOOM at `/digital-me`.

**Architecture:** Both doors live inside `app/HomeGate.tsx` at `/` (a component swap + a client redirect — NOT a new route). The onboarding conversation is extracted into a reusable pure core (`lib/onboarding/steps.ts`) + a `useConversation()` hook so the existing onboarding view and the new cover render the same engine with no forked logic. A lightweight deterministic constellation forms from answers. The returning hub `/digital-me` is cleaned so landing there is instant and usable.

**Tech Stack:** Next.js App Router (client components, static export via `loom://bundle`), React hooks, `node:test` + `tsx` contract tests, existing cosmic design system (`loom-cosmic-field`, `--signature-cyan-hi`, `--display`, `CapabilityMap` star-river recipe).

**Spec:** `docs/superpowers/specs/2026-06-21-loom-conversational-cosmos-entry-design.md`

---

## File Structure

- **Create** `lib/onboarding/steps.ts` — pure step core moved out of the component: `applyAnswer`, `stepPrompt`, `progressOf`, `TOTAL_STEPS` (+ re-export `ConvoStep` from `chat-gate`). No React/CSS.
- **Create** `lib/onboarding/useConversation.ts` — the conversation runtime hook (state + handlers), framework-agnostic of presentation.
- **Create** `lib/onboarding/constellation.ts` — pure mapping `profile/answered-areas → stars[] + comet?`.
- **Create** `app/ConstellationField.tsx` (+ `ConstellationField.module.css`) — decorative `aria-hidden` SVG field, reduced-motion safe.
- **Create** `app/HomeConversationalCover.tsx` (+ `HomeConversationalCover.module.css`) — the new-user cover; renders `useConversation()` + `ConstellationField`.
- **Modify** `app/HomeGate.tsx` — two-door switch (no profile → cover; profile → `replace('/digital-me')`).
- **Modify** `app/onboarding/profile/ConversationalOnboardingClient.tsx` — becomes a thin view over `useConversation()`.
- **Modify** `app/digital-me/DigitalMeGate.tsx` — neutral self-skeleton first paint (no stranger flash).
- **Modify** `app/digital-me/BeginnerDigitalMe.tsx` — auto-build+persist capabilities on entry; add a "keep building" CTA.
- **Rewrite** `tests/home-gate-redirect.test.ts` — to the two-door intent.
- **Create** `tests/onboarding-steps.test.ts`, `tests/constellation.test.ts`; **register both** in `package.json` `test:contracts`.

**Repo gotchas (every task):** run a single test with `npx tsx --test tests/X.test.ts`; `npm run typecheck` runs a Next build and dirties `tsconfig.json` + `next-env.d.ts` — restore with `git checkout -- tsconfig.json next-env.d.ts` after (if it hangs >5 min, `rm -rf .next-build.lock`, retry once). Do NOT push (controller pushes after review). Do NOT touch the foreign `git stash@{0}`. Use the token `var(--signature-cyan-hi)` (#8AF7E6), never the `#6CE7F2` literal. New CSS goes in a CSS Module, never `globals.css`.

---

## Task 1: Extract the conversation core (refactor, no behavior change)

**Goal:** Move the onboarding's pure step logic into `lib/onboarding/steps.ts` and lift its runtime into `lib/onboarding/useConversation.ts`, so the cover can reuse the exact same engine. `ConversationalOnboardingClient` becomes a thin view. No user-facing behavior changes.

**Files:**
- Create: `lib/onboarding/steps.ts`, `lib/onboarding/useConversation.ts`, `tests/onboarding-steps.test.ts`
- Modify: `app/onboarding/profile/ConversationalOnboardingClient.tsx`, `tests/conversational-onboarding.test.tsx`, `package.json`

- [ ] **Step 1: Read the source.** Read `app/onboarding/profile/ConversationalOnboardingClient.tsx` in full. Identify: `TOTAL_STEPS` (~line 47), `stepPrompt` (~49, currently un-exported), `progressOf` (~94, un-exported), `applyAnswer` (~123, exported), the component state block (~324: `profile, step, messages, input, importMode, uploadStatus, uploadError, extracting, saving, saveError, isTyping, checking, reasked` + refs `inputRef, bottomRef, submitting`), and the handlers (`handleSubmit`, `nudge`, `runExtraction`/`handleFileUpload`/`handlePasteResume`, `handleSave`, `goToForm`) through ~line 876. Note `prefersReducedMotion()` (~312) and the `/digital-me` save navigation (~649–665).

- [ ] **Step 2: Write `lib/onboarding/steps.ts`.** Move `applyAnswer`, `stepPrompt`, `progressOf`, `TOTAL_STEPS` here verbatim and `export` all four (add exports for `stepPrompt`/`progressOf`). Import `ConvoStep` from `./chat-gate` and re-export the type. Keep it pure — no React, no CSS import. The module must import only from `./chat-gate`, `./assess-answer`, `../profile/*` (types).

- [ ] **Step 3: Write `tests/onboarding-steps.test.ts`** asserting the moved pure functions still behave:

```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { applyAnswer, stepPrompt, progressOf, TOTAL_STEPS } from '../lib/onboarding/steps';
import { emptyBeginnerProfile } from '../lib/profile/beginner-profile';

test('TOTAL_STEPS is a positive integer', () => {
  assert.ok(Number.isInteger(TOTAL_STEPS) && TOTAL_STEPS > 0);
});
test('first step asks for the name and applyAnswer stores it', () => {
  const start = { id: 'name' } as const;
  assert.match(stepPrompt(start), /name/i);
  const { profile, next } = applyAnswer(emptyBeginnerProfile(), start, 'Lin Wei');
  assert.equal(profile.home.name, 'Lin Wei');
  assert.notDeepEqual(next, start);
});
test('progressOf advances from name to a later step', () => {
  assert.ok(progressOf({ id: 'name' }) <= progressOf({ id: 'review' }));
});
```

Adjust the exact step ids/fields to the real `ConvoStep`/profile shape you read in Step 1. Register `tests/onboarding-steps.test.ts` in `package.json` `test:contracts`.

- [ ] **Step 4: Write `lib/onboarding/useConversation.ts`.** A `'use client'`-free-where-possible hook (it uses React, so mark `'use client'` at the top of the file is NOT needed for a hook module imported by client components — but it must only run client-side; it will be called from client components). Move the component's state + handlers here. Export:

```ts
export type ConversationApi = {
  profile: BeginnerProfile;
  step: ConvoStep;
  messages: ChatMessage[];
  input: string; setInput: (v: string) => void;
  isTyping: boolean; checking: boolean; saving: boolean;
  progress: number; totalSteps: number;
  uploadStatus: 'idle' | 'reading' | 'extracting'; uploadError: string; saveError: string;
  promptText: string;                 // stepPrompt(step)
  handleSubmit: (answerOverride?: string) => Promise<void>;
  handleFileUpload: (file: File) => Promise<void>;
  handlePasteResume: (text: string) => Promise<void>;
  handleSave: () => Promise<void>;    // writes + router.push('/digital-me') with the write-failure guard
  goToForm: () => void;
};
export function useConversation(): ConversationApi { /* moved runtime */ }
```

Keep the `router`/`prefersReducedMotion`/`reasked`/`submitting` internals inside the hook. `ChatMessage` type moves here (or to `steps.ts` if pure). The save handler keeps its existing write-boolean guard before `router.push('/digital-me')`.

- [ ] **Step 5: Make `ConversationalOnboardingClient` a thin view.** Replace its internal state/handlers with `const c = useConversation();` and render the existing JSX against `c.*`. Keep all existing markup/CSS/classes and the résumé import UI — only the data source changes. Remove now-dead local copies of the moved functions; import `stepPrompt`/`progressOf`/`applyAnswer`/`TOTAL_STEPS` from `lib/onboarding/steps` where still referenced.

- [ ] **Step 6: Drop the CSS shim from the onboarding test.** In `tests/conversational-onboarding.test.tsx`, if its pure-logic assertions now import from `lib/onboarding/steps` (no CSS), remove the `require.extensions['.css']` shim (lines ~19–29) and point imports at `lib/onboarding/steps`. If any assertion still needs the component, keep the minimum shim.

- [ ] **Step 7: Verify + commit (no push).**

Run: `npm run test:contracts` → Expected: all green (≈ +3 from `onboarding-steps`).
Run: `npm run typecheck` → Expected: EXIT 0; then `git checkout -- tsconfig.json next-env.d.ts`.
Manually confirm `/onboarding/profile` still renders + advances (read the diff; the view is unchanged in output).

```bash
git add lib/onboarding/steps.ts lib/onboarding/useConversation.ts tests/onboarding-steps.test.ts \
  app/onboarding/profile/ConversationalOnboardingClient.tsx tests/conversational-onboarding.test.tsx package.json
git commit -m "refactor(onboarding): extract pure steps.ts + useConversation() hook (no behavior change)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: The constellation (pure mapping + decorative field)

**Files:**
- Create: `lib/onboarding/constellation.ts`, `tests/constellation.test.ts`, `app/ConstellationField.tsx`, `app/ConstellationField.module.css`
- Modify: `package.json`

- [ ] **Step 1: Write the failing test** `tests/constellation.test.ts`:

```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { constellationFor } from '../lib/onboarding/constellation';
import { emptyBeginnerProfile } from '../lib/profile/beginner-profile';

test('empty profile yields no stars', () => {
  assert.deepEqual(constellationFor(emptyBeginnerProfile()).stars, []);
});
test('a named profile with one area yields at least one star with stable coords', () => {
  const p = emptyBeginnerProfile();
  p.home.name = 'Lin Wei';
  p.home.headline = 'Finance student';
  const a = constellationFor(p);
  const b = constellationFor(p);
  assert.ok(a.stars.length >= 1);
  assert.deepEqual(a, b); // deterministic, no Math.random
  for (const s of a.stars) { assert.ok(s.x >= 0 && s.x <= 100 && s.y >= 0 && s.y <= 100); }
});
```

- [ ] **Step 2: Run it, confirm it fails** (`Cannot find module '../lib/onboarding/constellation'`): `npx tsx --test tests/constellation.test.ts`

- [ ] **Step 3: Implement `lib/onboarding/constellation.ts`** — pure, deterministic (FNV-1a hash for placement, mirroring `CapabilityMap`'s idiom; NO `Math.random`):

```ts
import type { BeginnerProfile } from '../profile/beginner-profile';

export type Star = { id: string; label: string; x: number; y: number; magnitude: number };
export type Constellation = { stars: Star[]; comet: Star | null };

function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}
function place(seed: string): { x: number; y: number } {
  const h = hash(seed);
  return { x: 8 + (h % 84), y: 8 + ((h >>> 8) % 84) };
}

/** One ambient star per completed identity area; the strongest area becomes a comet. */
export function constellationFor(p: BeginnerProfile): Constellation {
  const areas: { id: string; label: string; filled: boolean; weight: number }[] = [
    { id: 'name', label: p.home.name || 'You', filled: !!p.home.name, weight: 1 },
    { id: 'headline', label: p.home.headline || 'Focus', filled: !!p.home.headline, weight: 1 },
    { id: 'about', label: 'About', filled: !!p.about?.summary, weight: 1 },
    { id: 'education', label: 'Education', filled: (p.education?.length ?? 0) > 0, weight: 2 },
    { id: 'experience', label: 'Experience', filled: (p.experience?.length ?? 0) > 0, weight: 2 },
  ];
  const stars: Star[] = areas
    .filter((a) => a.filled)
    .map((a) => ({ id: a.id, label: a.label, ...place(a.id + ':' + a.label), magnitude: a.weight }));
  const comet = stars.length ? stars.reduce((m, s) => (s.magnitude > m.magnitude ? s : m), stars[0]) : null;
  return { stars, comet };
}
```

Adjust the `areas` field reads to the real `BeginnerProfile` shape (read `lib/profile/beginner-profile.ts` first; use the actual keys).

- [ ] **Step 4: Run the test, confirm it passes.** `npx tsx --test tests/constellation.test.ts` → PASS. Register `tests/constellation.test.ts` in `package.json` `test:contracts`.

- [ ] **Step 5: Implement `app/ConstellationField.tsx`** — a decorative SVG over a `Constellation`:

```tsx
'use client';
import type { Constellation } from '../lib/onboarding/constellation';
import styles from './ConstellationField.module.css';

export function ConstellationField({ data }: { data: Constellation }) {
  return (
    <svg className={styles.field} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {data.stars.map((s) => (
        <circle key={s.id} cx={s.x} cy={s.y} r={s.magnitude >= 2 ? 0.9 : 0.6}
          className={s === data.comet ? styles.comet : styles.star} />
      ))}
    </svg>
  );
}
```

- [ ] **Step 6: Implement `app/ConstellationField.module.css`** using the two-tier reduced-motion recipe from `components/CapabilityMap.module.css` (twinkle only under `no-preference`; `reduce` forces `animation: none`). Stars use `fill: var(--signature-cyan-hi)`; the field is `position: absolute; inset: 0; pointer-events: none;`. Reference the existing recipe; do not invent new animation.

- [ ] **Step 7: Verify + commit (no push).** `npm run test:contracts` (green) + `npm run typecheck` (EXIT 0, then restore churn).

```bash
git add lib/onboarding/constellation.ts tests/constellation.test.ts app/ConstellationField.tsx app/ConstellationField.module.css package.json
git commit -m "feat(entry): pure constellation mapping + decorative ConstellationField

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: The new-user cover

**Files:**
- Create: `app/HomeConversationalCover.tsx`, `app/HomeConversationalCover.module.css`
- (Reference the approved mockup `loom_conversational_cosmos_entry` for the visual target.)

- [ ] **Step 1: Implement `app/HomeConversationalCover.tsx`.** A client component that renders the cosmic cover and hosts the conversation via the hook. Structure:

```tsx
'use client';
import Link from 'next/link';
import { useConversation } from '../lib/onboarding/useConversation';
import { constellationFor } from '../lib/onboarding/constellation';
import { ConstellationField } from './ConstellationField';
import styles from './HomeConversationalCover.module.css';

export function HomeConversationalCover() {
  const c = useConversation();
  const constellation = constellationFor(c.profile);
  return (
    <main className={styles.cover}>
      <div className="loom-cosmic-field" aria-hidden />
      <ConstellationField data={constellation} />
      <div className={styles.brand}>{/* moon mark + LOOM wordmark */}</div>
      <section className={styles.locus}>
        {c.messages.length === 0 && <p className={styles.prompt}>{c.promptText}</p>}
        {/* render c.messages as cosmic bubbles when present */}
        <form onSubmit={(e) => { e.preventDefault(); void c.handleSubmit(); }} className={styles.inputRow}>
          <input className={styles.input} value={c.input} onChange={(e) => c.setInput(e.target.value)}
            disabled={c.checking} placeholder="Tell me about yourself…" aria-label="Your answer" />
          <button type="submit" className={styles.send} disabled={!c.input.trim() || c.isTyping || c.checking} aria-label="Send">→</button>
        </form>
        <nav className={styles.whisper}>
          <Link href="/example">See an example</Link>
          <button type="button" className={styles.formLink} onClick={c.goToForm}>Prefer a form?</button>
        </nav>
      </section>
    </main>
  );
}
```

NO sign-in (v1). Minimal copy only. Reuse the moon mark asset (`MoonOrb` inline SVG from `ConversationalOnboardingClient`, or `public/brand/loom_lunar_comet_icon.svg`). The conversation continues on this surface (messages render as cosmic bubbles); on save the hook navigates to `/digital-me`. When `c.messages.length > 0`, render the running dialogue; mirror the existing onboarding's progress/typing affordances minimally.

- [ ] **Step 2: Implement `app/HomeConversationalCover.module.css`.** Full-viewport centered shell (mirror `HomeLanding.module.css`'s `.page`: `min-height: 100dvh; display: grid; place-items: center; isolation: isolate;`). `--display` serif for the prompt; `--signature-cyan-hi` for the send/active. The cover sits above `loom-cosmic-field` + `ConstellationField`. Whisper links are muted (`--color-text-secondary` equivalent token). No card chrome, no top nav. Reduced-motion safe. Tokens via `var()` only.

- [ ] **Step 3: Verify it renders + typechecks.** `npm run typecheck` → EXIT 0 (restore churn). (It isn't routed yet — Task 4 wires it; this task just builds + typechecks the component.) Build is the check here; no new test file (it's wired+tested in Task 4).

- [ ] **Step 4: Commit (no push).**

```bash
git add app/HomeConversationalCover.tsx app/HomeConversationalCover.module.css
git commit -m "feat(entry): conversation-first cosmic cover (new-user front door)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Wire the two doors in HomeGate + rewrite the contract test

**Files:**
- Modify: `app/HomeGate.tsx`
- Rewrite: `tests/home-gate-redirect.test.ts`

- [ ] **Step 1: Rewrite `tests/home-gate-redirect.test.ts`** to the two-door intent (replace the whole file body of tests; keep the `read`/imports helpers at the top):

```ts
test('app/page.tsx renders HomeGate and does not redirect to /onboarding', () => {
  const page = read('app/page.tsx');
  assert.match(page, /<HomeGate \/>/);
  assert.doesNotMatch(page, /redirect\('\/onboarding'\)/);
});

test('HomeGate renders the cosmic cover as the no-profile SSR/first paint (not the owner dossier, not HomeProfileView)', () => {
  const gate = read('app/HomeGate.tsx');
  assert.match(gate, /HomeConversationalCover/, 'no-profile branch must render the cosmic cover');
  assert.doesNotMatch(gate, /HomeClient/, 'must not render the owner dossier');
  assert.doesNotMatch(gate, /HomeProfileView/, 'HomeProfileView is retired as the / default');
});

test('HomeGate routes a returning user (profile present) to /digital-me', () => {
  const gate = read('app/HomeGate.tsx');
  assert.match(gate, /if \(mounted && profile\)/, 'must check mounted + profile');
  assert.match(gate, /\/digital-me/, 'returning users are routed to /digital-me');
  assert.match(gate, /useRouter|redirect/, 'a redirect mechanism is now expected');
});
```

- [ ] **Step 2: Run it, confirm it fails** against the current HomeGate: `npx tsx --test tests/home-gate-redirect.test.ts` → FAIL (HomeGate still renders HomeLanding/HomeProfileView, no `/digital-me`).

- [ ] **Step 3: Rewrite `app/HomeGate.tsx`:**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HomeConversationalCover } from './HomeConversationalCover';
import { readBeginnerProfileLocal } from '../lib/profile/profile-storage';

/**
 * Two-door entry at `/` (the guaranteed cold-open target):
 * - No profile (new user) → the conversation-first cosmic cover.
 * - Profile present (returning) → straight into their usable LOOM at /digital-me.
 * SSR/first paint always renders the cover (localStorage is invisible server-side);
 * after mount, a returning user is redirected. Brief cover flash is acceptable
 * (instant under reduced motion). HomeProfileView is retired as the / default.
 */
export function HomeGate() {
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (readBeginnerProfileLocal()) {
      setRedirecting(true);
      router.replace('/digital-me');
    }
  }, [router]);

  if (redirecting) return <div className="loom-cosmic-field" aria-hidden />;
  return <HomeConversationalCover />;
}
```

- [ ] **Step 4: Run the test, confirm it passes.** `npx tsx --test tests/home-gate-redirect.test.ts` → PASS.

- [ ] **Step 5: Full verify.** `npm run test:contracts` → all green (check no OTHER test still asserts old HomeGate/HomeLanding-as-home behavior; if a render/route test references `HomeLanding` at `/`, update it to the cover). `npm run typecheck` → EXIT 0 (restore churn).

- [ ] **Step 6: Commit (no push).**

```bash
git add app/HomeGate.tsx tests/home-gate-redirect.test.ts
git commit -m "feat(entry): HomeGate two-door — new→cosmic cover, returning→/digital-me

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Make the returning door clean (/digital-me)

**Files:**
- Modify: `app/digital-me/DigitalMeGate.tsx`, `app/digital-me/BeginnerDigitalMe.tsx`

- [ ] **Step 1: Self-skeleton first paint in `DigitalMeGate.tsx`.** Returning users must not flash the stranger `IdentityEmptyState`. Change the pre-mount/no-profile render so that BEFORE mount it shows a neutral cosmic skeleton (not the "Build your Loom" stranger CTA), and only shows `IdentityEmptyState` if, after mount, there is genuinely no profile:

```tsx
export function DigitalMeGate() {
  const [profile, setProfile] = useState<BeginnerProfile | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setProfile(readBeginnerProfileLocal()); setMounted(true); }, []);

  if (!mounted) return <div className="loom-cosmic-field" aria-hidden />;   // neutral skeleton, no stranger flash
  if (profile) return <BeginnerDigitalMe profile={profile} />;
  return (
    <IdentityEmptyState section="Digital Me" activeHref="/digital-me" titleId="digital-me-title" exampleHref="/example/digital-me" />
  );
}
```

(If a richer skeleton is wanted, render a minimal cosmic placeholder component; the key requirement is: no `IdentityEmptyState` before mount.)

- [ ] **Step 2: Auto-build + persist capabilities on entry in `BeginnerDigitalMe.tsx`.** Read the component; find the existing manual "Build capability map" path (`handleBuildCapabilities` per project memory) and the capability state. Add a mount effect that, if the profile has no persisted capabilities yet, runs the existing build path once and persists it (reuse the existing builder + the write-boolean guard — do NOT duplicate logic). The star-river must be populated on arrival, not empty-until-click. Guard against re-running if capabilities already exist.

- [ ] **Step 3: Add a "keep building" CTA in `BeginnerDigitalMe.tsx`** — a visible link/button to `/onboarding/profile` (it already preloads the profile and returns to `/digital-me`). Place it near the identity header or journey; use existing button styles + established copy ("Keep building"). This is the returning user's forward path.

- [ ] **Step 4: Verify.** `npm run test:contracts` → green (update any BeginnerDigitalMe/DigitalMeGate render test that asserted the old pre-mount stranger state). `npm run typecheck` → EXIT 0 (restore churn). Read the diff to confirm: no stranger flash branch before mount; capabilities auto-build guarded; CTA renders.

- [ ] **Step 5: Commit (no push).**

```bash
git add app/digital-me/DigitalMeGate.tsx app/digital-me/BeginnerDigitalMe.tsx
git commit -m "feat(entry): clean returning door — /digital-me self-skeleton + auto-built star-river + keep-building CTA

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Final verification

- [ ] **Step 1:** `npm run test:contracts` — all green. Note the final count.
- [ ] **Step 2:** `npm run typecheck` — EXIT 0; then `git checkout -- tsconfig.json next-env.d.ts`.
- [ ] **Step 3:** Sanity-read the route-classification contract (`tests/new-loom-skeleton-contract.test.ts`) still passes — we added NO new route, so it should be untouched.
- [ ] **Step 4:** Controller pushes `loom-conversational-cosmos-entry`; confirm CI (`verify` + `macos-app-smoke`) green. Open a PR. Merge/deploy stays owner-gated.

---

## Notes for the implementer

- **No new route, no `/cover`.** The cover is a component HomeGate renders at `/`. `app/cover/page.tsx` (legacy redirect to `/sources`) stays untouched.
- **Fail-open everywhere.** Any LLM call inside the conversation (extract/validate) must degrade silently exactly like the existing `runExtraction` — the `loom://bundle` app has no `/api` and no SPA fallback.
- **Reduced motion.** Every animation (constellation twinkle/assembly, cover entrance) lives under `@media (prefers-reduced-motion: no-preference)`; the `reduce` path is an instant static render.
- **Tokens + terminology.** `var(--signature-cyan-hi)`, `var(--display)`; keep "Digital Me", "Capabilities", "star-river". Clean/minimal copy — prompt + button/whisper labels only.
