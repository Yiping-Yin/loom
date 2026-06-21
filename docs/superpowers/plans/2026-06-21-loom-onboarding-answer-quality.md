# Onboarding Answer Quality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Catch "乱七八糟" onboarding answers (gibberish / too-short / off-topic / wrong-field) with an offline deterministic floor everywhere plus an optional LLM smart layer on the keyed web deploy, and gently coach the user once — never blocking.

**Architecture:** A pure `assessAnswer` floor (`lib/onboarding/assess-answer.ts`) runs in every deploy. A `/api/validate-answer` route adds an LLM judge (accept/clean/reask) on the keyed web deploy, failing open to `accept`. The chat onboarding runs floor → smart layer on submit and nudges once via a quiet LOOM bubble; the form runs the floor on Next as a quiet inline hint. Both never block and converge on `normalizeBeginnerProfile`.

**Tech Stack:** TypeScript, Next.js (App Router, `nodejs` runtime routes), React client components, `node:test` + `tsx` contract tests, existing `runAnthropicHttp` transport.

**Spec:** `docs/superpowers/specs/2026-06-21-loom-onboarding-answer-quality-design.md`

---

## File Structure

- **Create** `lib/onboarding/assess-answer.ts` — pure floor: `assessAnswer(field, text)`, `AnswerField`, types. No React, no network.
- **Create** `app/api/validate-answer/route.ts` — LLM smart layer + exported `parseValidation` seam.
- **Create** `lib/onboarding/validate-answer-client.ts` — `validateAnswerRemote(field, question, answer)`: thin fetch wrapper, fails open to `{verdict:'accept'}`.
- **Create** `tests/assess-answer.test.ts`, `tests/validate-answer-route.test.ts`.
- **Modify** `app/onboarding/profile/ConversationalOnboardingClient.tsx` — gate inside `handleSubmit` (floor → smart), one nudge per step.
- **Modify** `app/onboarding/profile/ProfileWizardClient.tsx` + `ProfileWizard.module.css` — floor hint under HOME name/headline on Next (non-blocking).
- **Modify** `package.json` — register the two new tests in `test:contracts`.

---

## Task 1: Deterministic floor (`assessAnswer`)

**Files:**
- Create: `lib/onboarding/assess-answer.ts`
- Test: `tests/assess-answer.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/assess-answer.test.ts`:

```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { assessAnswer } from '../lib/onboarding/assess-answer';

test('empty answer is bad', () => {
  assert.equal(assessAnswer('name', '   ').level, 'bad');
});

test('keyboard-mash / gibberish is bad', () => {
  assert.equal(assessAnswer('name', 'asdfgh').level, 'bad');
  assert.equal(assessAnswer('name', 'sdfghjkl').level, 'bad'); // no vowels
  assert.equal(assessAnswer('summary', 'aaaaaaa').level, 'bad'); // repeat run
});

test('name with a URL or all-digits is bad', () => {
  assert.equal(assessAnswer('name', 'http://x.com').level, 'bad');
  assert.equal(assessAnswer('name', '12345').level, 'bad');
});

test('name that reads like a sentence/question is weak', () => {
  assert.equal(assessAnswer('name', 'what should I put here?').level, 'weak');
});

test('headline that is chatty / a question is weak', () => {
  assert.equal(
    assessAnswer('headline', 'im doing great. do u have any recommadation for tdy?').level,
    'weak',
  );
  assert.equal(assessAnswer('headline', '你能推荐点什么吗').level, 'weak');
});

test('plausible values are ok', () => {
  assert.equal(assessAnswer('name', 'Lin Wei').level, 'ok');
  assert.equal(assessAnswer('headline', 'Finance student · Python & derivatives').level, 'ok');
  assert.equal(assessAnswer('summary', 'Recent CS graduate who builds small data tools.').level, 'ok');
});

test('bad/weak results carry a hint; ok does not', () => {
  assert.ok(assessAnswer('name', 'asdfgh').hint);
  assert.equal(assessAnswer('name', 'Lin Wei').hint, undefined);
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx tsx --test tests/assess-answer.test.ts`
Expected: FAIL — `Cannot find module '../lib/onboarding/assess-answer'`.

- [ ] **Step 3: Implement `lib/onboarding/assess-answer.ts`**

```ts
/**
 * Deterministic, offline answer-quality floor for onboarding. Pure — no network,
 * no React — so it runs in every deploy (incl. the static macOS export) and is
 * unit-tested directly. Catches obvious garbage; the LLM smart layer
 * (/api/validate-answer) handles semantic off-topic on the keyed web deploy.
 */

export type AnswerField =
  | 'name'
  | 'headline'
  | 'summary'
  | 'institution'
  | 'qualification'
  | 'role'
  | 'organization'
  | 'highlight'
  | 'work_title'
  | 'work_description'
  | 'generic';

export type AnswerLevel = 'ok' | 'weak' | 'bad';
export type AnswerAssessment = { level: AnswerLevel; hint?: string };

const MIN_LEN: Partial<Record<AnswerField, number>> = {
  name: 2,
  headline: 4,
  summary: 20,
  institution: 2,
  qualification: 2,
  role: 2,
  organization: 2,
  work_title: 2,
  highlight: 8,
  work_description: 8,
};
const DEFAULT_MIN = 2;

/** Obvious non-language garbage, field-independent. */
function isGibberish(text: string): boolean {
  const lower = text.toLowerCase();
  if (/(.)\1{4,}/.test(lower)) return true; // 'aaaaaa'
  if (/asdf|qwer|zxcv|hjkl|qwerty|asdfgh|zxcvbn/.test(lower)) return true; // keyboard mash
  for (const tok of lower.split(/\s+/)) {
    const alpha = tok.replace(/[^a-z]/g, '');
    if (alpha.length >= 6 && !/[aeiou]/.test(alpha)) return true; // long, no vowels
  }
  const symbols = (text.match(/[^\p{L}\p{N}\s]/gu) ?? []).length;
  if (text.length >= 4 && symbols / text.length > 0.5) return true; // mostly symbols
  return false;
}

function gibberishHint(field: AnswerField): string {
  if (field === 'name') return "That doesn't look like a name — e.g. 'Lin Wei'.";
  if (field === 'headline')
    return "That doesn't look like a headline — e.g. 'Finance student · Python & derivatives'.";
  return "That doesn't look quite right — could you rephrase?";
}

export function assessAnswer(field: AnswerField, raw: string): AnswerAssessment {
  const text = raw.trim();
  if (!text) return { level: 'bad', hint: "This one can't be empty." };
  if (isGibberish(text)) return { level: 'bad', hint: gibberishHint(field) };

  if (field === 'name') {
    if (/https?:\/\/|@|www\./i.test(text) || /^\d+$/.test(text)) {
      return { level: 'bad', hint: "Just your name — e.g. 'Lin Wei'." };
    }
    if (text.split(/\s+/).length >= 7 || text.includes('?')) {
      return { level: 'weak', hint: "Just your name — e.g. 'Lin Wei'." };
    }
  }

  if (field === 'headline') {
    const chatty =
      text.includes('?') ||
      /\b(do you|can you|could you|recommend|i'?m doing|i am doing)\b/i.test(text) ||
      /你能|推荐|怎么|帮我/.test(text);
    if (chatty) {
      return {
        level: 'weak',
        hint: "A headline is a short line about what you do — e.g. 'Finance student · Python & derivatives'.",
      };
    }
    if (text.length > 140) {
      return { level: 'weak', hint: 'Keep the headline short — a phrase, not a paragraph.' };
    }
  }

  const min = MIN_LEN[field] ?? DEFAULT_MIN;
  if (text.length < min) return { level: 'weak', hint: 'A little more detail would help.' };

  return { level: 'ok' };
}
```

- [ ] **Step 4: Run the test to confirm it passes**

Run: `npx tsx --test tests/assess-answer.test.ts`
Expected: PASS (all cases).

- [ ] **Step 5: Register the test + run the suite**

Edit `package.json`: append ` tests/assess-answer.test.ts` to the end of the `test:contracts` script's file list.
Run: `npm run test:contracts`
Expected: PASS, total count = previous + 7.

- [ ] **Step 6: Commit**

```bash
git add lib/onboarding/assess-answer.ts tests/assess-answer.test.ts package.json
git commit -m "feat(onboarding): deterministic answer-quality floor (assessAnswer)"
```

---

## Task 2: Wire the floor into the chat onboarding

**Files:**
- Modify: `app/onboarding/profile/ConversationalOnboardingClient.tsx`

Adds a per-step "re-asked once" guard, a step→field map, a `nudge()` helper, and a floor check at the top of `handleSubmit`. The smart layer (Task 3) plugs into the same gate.

- [ ] **Step 1: Add the field map + step key (module scope, near `isSkip`/`isYes` at lines 129–130)**

```ts
/** Map a chat step to the floor's AnswerField, or null for non-free-text steps. */
function fieldOf(step: ConvoStep): import('../../../lib/onboarding/assess-answer').AnswerField | null {
  switch (step.id) {
    case 'name': return 'name';
    case 'headline': return 'headline';
    case 'summary': return 'summary';
    case 'edu_institution': return 'institution';
    case 'edu_qualification': return 'qualification';
    case 'exp_role': return 'role';
    case 'exp_organization': return 'organization';
    case 'exp_highlight': return 'highlight';
    case 'work_title': return 'work_title';
    case 'work_description': return 'work_description';
    default: return null; // years / *_more / work_link / review — not free-text-judged
  }
}

/** Stable key per step occurrence (entryIdx disambiguates repeated edu/exp/work). */
function stepKey(step: ConvoStep): string {
  return 'entryIdx' in step ? `${step.id}:${step.entryIdx}` : step.id;
}
```

Add the import at the top with the other lib imports:

```ts
import { assessAnswer } from '../../../lib/onboarding/assess-answer';
```

- [ ] **Step 2: Add the re-asked state (after the other `useState` calls, near line 352)**

```ts
const [reasked, setReasked] = useState<Set<string>>(() => new Set());
```

- [ ] **Step 3: Add a `nudge()` helper (next to `appendMessages`, ~line 378)**

```ts
/** Show the user's answer + one quiet LOOM coaching bubble, without advancing. */
const nudge = (userText: string, hint?: string) => {
  setInput('');
  setMessages((prev) => [...prev, { from: 'user', text: userText }]);
  const text = hint ?? "That doesn't look quite right — mind trying again?";
  const delay = prefersReducedMotion() ? 0 : 500;
  if (delay === 0) {
    setMessages((prev) => [...prev, { from: 'loom', text }]);
  } else {
    setIsTyping(true);
    setTimeout(() => {
      setMessages((prev) => [...prev, { from: 'loom', text }]);
      setIsTyping(false);
    }, delay);
  }
};
```

- [ ] **Step 4: Gate `handleSubmit` with the floor (modify lines 392–402)**

Replace the start of `handleSubmit` so the floor runs before `applyAnswer`. Keep the rest (the user bubble + timing block) unchanged:

```ts
const handleSubmit = (answerOverride?: string) => {
  const answer = (answerOverride ?? input).trim();
  if (!answer || isTyping) return;

  // Answer-quality gate (free-text steps only; skip answers + already-reasked pass through)
  const field = fieldOf(step);
  const key = stepKey(step);
  if (field && !isSkip(answer) && !reasked.has(key)) {
    const floor = assessAnswer(field, answer);
    if (floor.level === 'bad') {
      setReasked((s) => new Set(s).add(key));
      nudge(answer, floor.hint);
      return;
    }
  }

  const userMsg: ChatMessage = { from: 'user', text: answer };
  const { next, profile: nextProfile } = applyAnswer(profile, step, answer);
  // ...unchanged: setProfile/setStep/setInput, append user bubble, timing block...
```

(Leave everything from `const userMsg` onward exactly as-is.)

- [ ] **Step 5: Add a render test**

Edit `tests/conversational-onboarding.test.tsx`: add a test that rendering the client, typing `asdfgh` into the name input and submitting, shows a coaching bubble and stays on the name step (does not advance to the headline prompt). Use the file's existing render/utility imports and the existing query patterns; assert the LOOM nudge text appears and the headline prompt does not. **No fetch mock needed:** the floor-`bad` path (`asdfgh`) short-circuits in `handleSubmit` before any `validateAnswerRemote` call, so it stays synchronous.

```tsx
test('a gibberish name is gently re-asked, not accepted', async () => {
  // render <ConversationalOnboardingClient /> (mirror the existing render helper in this file)
  // type 'asdfgh' into the answer input, submit
  // assert: a bubble containing "doesn't look like a name" is present
  // assert: the headline prompt text is NOT yet present (step did not advance)
});
```

- [ ] **Step 6: Run tests + typecheck**

Run: `npm run test:contracts`  → Expected: PASS (new render test green).
Run: `npm run typecheck`       → Expected: EXIT 0. Restore `git checkout -- tsconfig.json next-env.d.ts` after.

- [ ] **Step 7: Commit**

```bash
git add app/onboarding/profile/ConversationalOnboardingClient.tsx tests/conversational-onboarding.test.tsx
git commit -m "feat(onboarding): chat floor — nudge once on a bad answer, never block"
```

---

## Task 3: Smart layer — `/api/validate-answer` + chat integration

**Files:**
- Create: `app/api/validate-answer/route.ts`, `lib/onboarding/validate-answer-client.ts`, `tests/validate-answer-route.test.ts`
- Modify: `app/onboarding/profile/ConversationalOnboardingClient.tsx`, `package.json`

- [ ] **Step 1: Write the failing route test**

Create `tests/validate-answer-route.test.ts`:

```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { POST, parseValidation } from '../app/api/validate-answer/route';

async function withoutCreds(fn: () => Promise<void>) {
  const k = process.env.ANTHROPIC_API_KEY;
  const t = process.env.ANTHROPIC_AUTH_TOKEN;
  const b = process.env.LOOM_LLM_BACKEND;
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_AUTH_TOKEN;
  delete process.env.LOOM_LLM_BACKEND;
  try { await fn(); } finally {
    if (k !== undefined) process.env.ANTHROPIC_API_KEY = k;
    if (t !== undefined) process.env.ANTHROPIC_AUTH_TOKEN = t;
    if (b !== undefined) process.env.LOOM_LLM_BACKEND = b;
  }
}

function post(body: unknown): Promise<Response> {
  return POST(new Request('http://localhost/api/validate-answer', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  }));
}

test('no credential → {configured:false}', async () => {
  await withoutCreds(async () => {
    const res = await post({ field: 'name', question: 'Name?', answer: 'asdfgh' });
    assert.equal(res.status, 200);
    assert.equal(((await res.json()) as { configured?: boolean }).configured, false);
  });
});

test('oversize body → 413', async () => {
  await withoutCreds(async () => {
    const res = await POST(new Request('http://localhost/api/validate-answer', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ field: 'name', question: 'q', answer: 'x'.repeat(8 * 1024 + 1) }),
    }));
    assert.equal(res.status, 413);
  });
});

test('invalid JSON → 400, missing answer → 400', async () => {
  const bad = await POST(new Request('http://localhost/api/validate-answer', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: '{not json',
  }));
  assert.equal(bad.status, 400);
  await withoutCreds(async () => {
    assert.equal((await post({ field: 'name', question: 'q', answer: '  ' })).status, 400);
  });
});

test('parseValidation: accept/clean/reask + fail-open', () => {
  assert.equal(parseValidation('{"verdict":"accept"}').verdict, 'accept');
  assert.deepEqual(parseValidation('```json\n{"verdict":"clean","cleaned":"Lin Wei"}\n```'),
    { verdict: 'clean', cleaned: 'Lin Wei' });
  assert.equal(parseValidation('{"verdict":"reask","hint":"Just your name."}').hint, 'Just your name.');
  assert.equal(parseValidation('not json').verdict, 'accept');           // fail open
  assert.equal(parseValidation('{"verdict":"clean"}').verdict, 'accept'); // clean w/o cleaned → accept
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx tsx --test tests/validate-answer-route.test.ts`
Expected: FAIL — `Cannot find module '../app/api/validate-answer/route'`.

- [ ] **Step 3: Implement `app/api/validate-answer/route.ts`**

```ts
import { isAnthropicConfigured, runAnthropicHttp } from '../../../lib/anthropic-http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 8 * 1024;

export type ValidateVerdict = 'accept' | 'clean' | 'reask';
export type ValidateResult = { verdict: ValidateVerdict; cleaned?: string; hint?: string };

const SYSTEM = [
  "You judge whether a user's onboarding ANSWER is a plausible, on-topic value for the",
  'given FIELD (QUESTION is what was asked). Reply with ONLY a JSON object, no prose:',
  '{"verdict":"accept"|"clean"|"reask","cleaned":"...","hint":"..."}',
  '- accept: a reasonable value for the field.',
  '- clean: basically right but messy (casing, a filler prefix like "i think", an obvious typo)',
  '  — return the cleaned value in "cleaned".',
  '- reask: off-topic, a question back to you, gibberish, or empty — return a short, friendly',
  '  "hint" with a concrete example.',
].join('\n');

/** Defensive parse. Fails open to {verdict:'accept'} so a bad model reply never blocks onboarding. */
export function parseValidation(text: string): ValidateResult {
  if (typeof text !== 'string') return { verdict: 'accept' };
  let raw = text.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(raw);
  if (fence) raw = fence[1].trim();
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return { verdict: 'accept' };
  let parsed: unknown;
  try { parsed = JSON.parse(raw.slice(start, end + 1)); } catch { return { verdict: 'accept' }; }
  if (!parsed || typeof parsed !== 'object') return { verdict: 'accept' };
  const o = parsed as Record<string, unknown>;
  const verdict: ValidateVerdict =
    o.verdict === 'clean' || o.verdict === 'reask' ? o.verdict : 'accept';
  if (verdict === 'clean') {
    const cleaned = typeof o.cleaned === 'string' ? o.cleaned.trim() : '';
    return cleaned ? { verdict: 'clean', cleaned: cleaned.slice(0, 300) } : { verdict: 'accept' };
  }
  if (verdict === 'reask') {
    const hint = typeof o.hint === 'string' ? o.hint.trim() : '';
    return { verdict: 'reask', hint: hint ? hint.slice(0, 200) : undefined };
  }
  return { verdict: 'accept' };
}

export async function POST(request: Request): Promise<Response> {
  let body: { field?: unknown; question?: unknown; answer?: unknown };
  try {
    const rawBody = await request.text();
    if (rawBody.length > MAX_BODY_BYTES) {
      return Response.json({ error: 'Request body is too large.' }, { status: 413 });
    }
    body = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const field = typeof body.field === 'string' ? body.field : '';
  const question = typeof body.question === 'string' ? body.question : '';
  const answer = typeof body.answer === 'string' ? body.answer.trim() : '';
  if (!answer) return Response.json({ error: 'A non-empty answer is required.' }, { status: 400 });

  if (!isAnthropicConfigured()) return Response.json({ configured: false }, { status: 200 });

  const prompt = `${SYSTEM}\n\nFIELD: ${field}\nQUESTION: ${question}\nANSWER: ${answer}`;
  try {
    const text = await runAnthropicHttp(prompt, { maxTokens: 300 });
    return Response.json(parseValidation(text), { status: 200 });
  } catch {
    return Response.json({ verdict: 'accept' } satisfies ValidateResult, { status: 200 });
  }
}
```

- [ ] **Step 4: Implement the client wrapper `lib/onboarding/validate-answer-client.ts`**

```ts
import type { ValidateResult } from '../../app/api/validate-answer/route';
import type { AnswerField } from './assess-answer';

/** Calls /api/validate-answer; fails open to {verdict:'accept'} (no key, 404, network, parse). */
export async function validateAnswerRemote(
  field: AnswerField,
  question: string,
  answer: string,
): Promise<ValidateResult> {
  try {
    const res = await fetch('/api/validate-answer', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ field, question, answer }),
    });
    if (!res.ok) return { verdict: 'accept' };
    const data = (await res.json().catch(() => null)) as
      | { configured?: boolean; verdict?: string; cleaned?: string; hint?: string }
      | null;
    if (!data || data.configured === false) return { verdict: 'accept' };
    if (data.verdict === 'clean' && typeof data.cleaned === 'string') {
      return { verdict: 'clean', cleaned: data.cleaned };
    }
    if (data.verdict === 'reask') return { verdict: 'reask', hint: data.hint };
    return { verdict: 'accept' };
  } catch {
    return { verdict: 'accept' };
  }
}
```

- [ ] **Step 5: Wire the smart layer into `handleSubmit`**

Make `handleSubmit` async and extend the gate from Task 2 (after the floor `bad` check) with the smart layer. The full gate block:

```ts
const handleSubmit = async (answerOverride?: string) => {
  let answer = (answerOverride ?? input).trim();
  if (!answer || isTyping) return;

  const field = fieldOf(step);
  const key = stepKey(step);
  if (field && !isSkip(answer) && !reasked.has(key)) {
    const floor = assessAnswer(field, answer);
    if (floor.level === 'bad') {
      setReasked((s) => new Set(s).add(key));
      nudge(answer, floor.hint);
      return;
    }
    const remote = await validateAnswerRemote(field, stepPrompt(step), answer);
    if (remote.verdict === 'reask') {
      setReasked((s) => new Set(s).add(key));
      nudge(answer, remote.hint);
      return;
    }
    if (remote.verdict === 'clean' && remote.cleaned) answer = remote.cleaned;
  }

  const userMsg: ChatMessage = { from: 'user', text: answer };
  const { next, profile: nextProfile } = applyAnswer(profile, step, answer);
  // ...unchanged tail...
```

Add the import:

```ts
import { validateAnswerRemote } from '../../../lib/onboarding/validate-answer-client';
```

Update the `<form onSubmit>` handler to not pass the event into the now-async `handleSubmit` (it already calls `handleSubmit()` with no args — confirm it ignores the returned promise: `onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }}`).

- [ ] **Step 6: Register the route test + run suites**

Edit `package.json`: append ` tests/validate-answer-route.test.ts` to `test:contracts`.
Run: `npm run test:contracts` → Expected: PASS (+5 route/parse cases).
Run: `npm run typecheck` → Expected: EXIT 0 (then restore `tsconfig.json`/`next-env.d.ts`).

- [ ] **Step 7: Commit**

```bash
git add app/api/validate-answer/route.ts lib/onboarding/validate-answer-client.ts \
  tests/validate-answer-route.test.ts app/onboarding/profile/ConversationalOnboardingClient.tsx package.json
git commit -m "feat(onboarding): /api/validate-answer smart layer + chat integration (fail-open)"
```

---

## Task 4: Form floor (non-blocking inline hint on HOME)

**Files:**
- Modify: `app/onboarding/profile/ProfileWizardClient.tsx`, `app/onboarding/profile/ProfileWizard.module.css`

Scope (v1): assess the HOME step's `name` + `headline` on Next; render one quiet helper line under a `weak`/`bad` field. Never blocks `goNext`.

- [ ] **Step 1: Add floor state + assess-on-Next (in `ProfileWizardClient`)**

Add import + state + a wrapped Next handler. The HOME fields are `profile.home.name` / `profile.home.headline` (rendered in `HomeStep`, lines ~305/319).

```ts
import { assessAnswer } from '../../../lib/onboarding/assess-answer';

// inside the component:
const [homeHints, setHomeHints] = useState<{ name?: string; headline?: string }>({});

const goNextChecked = () => {
  if (currentStep === 'home') {
    const nameA = assessAnswer('name', profile.home.name);
    const headA = assessAnswer('headline', profile.home.headline);
    const next: { name?: string; headline?: string } = {};
    if (nameA.level !== 'ok') next.name = nameA.hint;
    if (headA.level !== 'ok') next.headline = headA.hint;
    setHomeHints(next);
  }
  goNext(); // never blocked — hints are advisory
};
```

Change the Next button's `onClick={goNext}` (line ~255) to `onClick={goNextChecked}`.

- [ ] **Step 2: Render the hints under the HOME fields**

Pass `homeHints` into `HomeStep` and render a muted line under each input:

```tsx
// HomeStep props: add `hints?: { name?: string; headline?: string }`
// under the name <input>:
{hints?.name && <p className={styles.fieldHint}>{hints.name}</p>}
// under the headline <input>:
{hints?.headline && <p className={styles.fieldHint}>{hints.headline}</p>}
```

Update the `<HomeStep ... />` call site (line ~202) to pass `hints={homeHints}`.

- [ ] **Step 3: Add the quiet hint style**

Append to `app/onboarding/profile/ProfileWizard.module.css`:

```css
.fieldHint {
  margin: 0.4rem 0 0;
  font-family: var(--serif);
  font-size: 0.82rem;
  font-style: italic;
  color: var(--fg-secondary);
}
```

- [ ] **Step 4: Add a render test**

Edit `tests/profile-wizard.test.tsx`: render the wizard, set the name field to `asdfgh`, click Next, assert (a) a hint line is shown, (b) the step advanced (About step content is present) — i.e. Next is not blocked.

```tsx
test('home floor shows a hint for a bad name but still advances', () => {
  // render <ProfileWizardClient />, type 'asdfgh' into the name input, click Next
  // assert: a hint matching /name/ is shown
  // assert: the About step is now visible (advanced — not blocked)
});
```

- [ ] **Step 5: Run suites + typecheck**

Run: `npm run test:contracts` → Expected: PASS.
Run: `npm run typecheck` → Expected: EXIT 0 (restore `tsconfig.json`/`next-env.d.ts`).

- [ ] **Step 6: Commit**

```bash
git add app/onboarding/profile/ProfileWizardClient.tsx app/onboarding/profile/ProfileWizard.module.css tests/profile-wizard.test.tsx
git commit -m "feat(onboarding): form floor — quiet inline hint on HOME, never blocks Next"
```

---

## Final verification

- [ ] `npm run test:contracts` — all green (≈ +14 new cases).
- [ ] `npm run typecheck` — EXIT 0; restore `tsconfig.json` + `next-env.d.ts`.
- [ ] Optional keyed quality check of the smart layer: `npm run llm:smoke -- --cli` is unrelated; to exercise validate-answer specifically, hit the route from a keyed shell or eyeball in `/onboarding/profile` with a credential.
- [ ] Push `loom-beginner-profile`; confirm CI (`verify` + `macos-app-smoke`) green. Merge to main is the owner's call.
```
