# Onboarding Answer Quality — Design Spec

**Date:** 2026-06-21
**Status:** Approved (direction + scope A/B), pending spec review → writing-plans.

## Goal

Stop "乱七八糟" onboarding answers (gibberish, too-short, off-topic, wrong-field)
from flowing verbatim into the profile and becoming the user's "Verified. Cited."
Digital Me. Catch them with an offline deterministic floor everywhere, plus an
optional LLM smart layer on the keyed web deploy — and **gently coach, never
block**.

## Problem (current state)

`applyAnswer` (chat) and `ProfileWizardClient` (form) store each free-text answer
verbatim (`name: trimmed`, `headline: trimmed`, …). Only skip/yes-no/year-range
steps parse anything; `normalizeBeginnerProfile` caps length + drops empty
entries but never judges quality. So `asdfgh` for a name, or `im doing great. do
u have any recommadation for tdy?` for a headline (real example), become the
public identity.

## Non-goals (deferred to v2)

- Echo-understanding confirmation ("我记下了:名字=…,对吗?").
- Downstream down-weighting of `weak` fields in the capability graph.
- Smart (LLM) layer on the **form** (form gets the floor only in v1).
- Per-keystroke validation; whole-answer/multi-field batch validation.

## Design principle

Per the global clean/clear directive: a nudge is **one quiet inline line** — a
single LOOM chat bubble (chat) or muted helper text under the field (form). No
error banners, no red, no modals, no added chrome. Reuse existing styles.

## Architecture — pure core + two layers + graceful degradation

1. **`lib/onboarding/assess-answer.ts` (offline floor, pure):**
   `assessAnswer(field: AnswerField, text: string) → { level: 'ok' | 'weak' | 'bad'; hint?: string }`.
   Deterministic, no network, runs in every deploy (incl. static macOS export),
   unit-tested directly.
2. **`/api/validate-answer` (online smart layer):**
   `POST { field, question, answer } → { verdict: 'accept' | 'clean' | 'reask'; cleaned?: string; hint?: string }`.
   Uses `runAnthropicHttp` (x-api-key / OAuth / `--cli` backend already
   supported). No credential / static export → `{ configured: false }`; the
   client then uses the floor only.
3. **Integration:** chat runs floor → (if configured) smart layer, on submit;
   form runs floor on Next (non-blocking inline hint). Both converge on the same
   `normalizeBeginnerProfile(profile)`.

`AnswerField` (shared kind, mapped from both chat step ids and form fields):
`'name' | 'headline' | 'summary' | 'institution' | 'qualification' | 'role' | 'organization' | 'highlight' | 'work_title' | 'work_description' | 'generic'`.

## The floor — deterministic rules

Called only for **required free-text** answers (optional/skip handled by the step
machine). Returns the worst level that matches.

**Generic (every field):**
- empty after trim → `bad`.
- below a per-field min length → `weak` (or `bad` if also gibberish).
- gibberish → `bad`, any of:
  - a long alpha run (≥6 chars) with **no vowels** (`sdfghjkl`);
  - low unique-character ratio / long single-char run (`aaaaaa`);
  - keyboard-mash substrings (`asdf`, `qwer`, `zxcv`, `hjkl`, `qwerty`);
  - mostly non-alphanumeric (symbol ratio > ~0.5).

**Field-specific (added to generic):**
- `name`: contains URL / `@` / `http`, or is all digits → `bad`
  (hint: "Just your name — e.g. 'Lin Wei'."); reads like a sentence (≥7 words,
  or contains `?`) → `weak`.
- `headline`: looks like chat/question — contains `?`, or matches
  `do you|can you|recommend|i'm doing|i am doing|你能|推荐|怎么|帮我` → `weak`
  (hint: "A headline is a short line about what you do — e.g. 'Finance student ·
  Python & derivatives'."); length > 140 → `weak`.
- `summary`: < ~20 chars → `weak`.
- `institution | organization | qualification | role | work_title`: short or
  gibberish → `weak`.
- `highlight | work_description`: gibberish → `bad`; very short → `weak`.

Thresholds are constants at the top of the module (tunable). `years` parsing and
`links` `safeHref` are untouched.

## The smart layer (LLM, web + credential only)

`/api/validate-answer` mirrors the existing route conventions
(`/api/extract-profile`, `/api/derive-capabilities`):
- `runtime = 'nodejs'`, `dynamic = 'force-dynamic'`.
- Read `request.text()`, reject `> MAX_BYTES` (e.g. 8 KB) with **413** before
  `JSON.parse` (text-first, like derive-capabilities); invalid JSON → **400**.
- `isAnthropicConfigured()` false → `{ configured: false }` (200).
- Prompt: a static system instruction ("Judge whether ANSWER is a plausible,
  on-topic value for FIELD given QUESTION. Reply with ONLY a JSON object …") +
  the delimited field/question/answer, sent via `runAnthropicHttp`.
- **`parseValidation(text)` (exported, unit-testable seam):** strip a markdown
  fence, locate the JSON object, `JSON.parse` defensively, validate `verdict`
  against the enum, clamp `cleaned`/`hint` length. **Fails open** — any parse
  failure returns `{ verdict: 'accept' }` so a bad model response never blocks
  onboarding.
- Verdicts: `accept` (store as-is) / `clean` (store `cleaned`, surfaced to the
  user) / `reask` (one tailored `hint`).

## Behavior — nudge once, never block

State: a per-step/per-field attempt counter in the client (e.g.
`reaskedFields: Set<stepId>`), so **at most one re-ask per field** (floor + smart
combined).

**Chat (`ConversationalOnboardingClient.handleSubmit`):**
1. `floor = assessAnswer(kind(step), answer)`.
2. If `floor.level === 'bad'` and not yet re-asked → append one LOOM nudge bubble
   (`floor.hint` or a default), mark re-asked, **do not advance**.
3. Else, if configured, `POST /api/validate-answer`:
   - `reask` and not yet re-asked → nudge bubble + mark, hold.
   - `clean` → `applyAnswer` with `cleaned`, advance.
   - `accept` / `{configured:false}` / fetch error → `applyAnswer` with original,
     advance.
4. Second submit of the same step always advances (floor `weak` never blocks;
   only one `bad`/`reask` hold is allowed).

**Form (`ProfileWizardClient`, Next):** run `assessAnswer` on the section's
required fields; render a quiet helper line under any `weak`/`bad` field; **Next
still advances** (non-blocking). Smart layer on the form = v2.

Rationale for never-block: avoids trapping real but unusual names/abbreviations
(false positives), and keeps the flow frictionless.

## Data flow / degradation

- web + credential: floor → smart layer → accept/clean/reask.
- web no key / static macOS export: floor only.
- Both paths end at the same `normalizeBeginnerProfile(profile)` and `handleSave`.

## Error handling

- Route fails open (`parseValidation` → `accept` on any failure).
- Client falls back to the floor result on fetch error / timeout / `{configured:false}`.
- The LLM layer can never stall or block onboarding.

## Testing

All offline-runnable; LLM output quality validated separately via `npm run
llm:smoke` (CLI backend).

- **`tests/assess-answer.test.ts`** (new, registered in `test:contracts`):
  per-field cases — gibberish/empty/URL-in-name/headline-as-question/normal →
  expected `level`; thresholds at boundaries.
- **`tests/validate-answer-route.test.ts`** (new, registered): no-key →
  `configured:false`; oversize body → 413; invalid JSON → 400;
  `parseValidation` accept/clean/reask branches + fail-open default.
- **Chat render** (extend `tests/conversational-onboarding.test.tsx`): a `bad`
  answer appends exactly one nudge and does not advance; resubmit advances.
- **Form render** (extend `tests/profile-wizard.test.tsx`): a `bad` field shows
  the helper line; Next still advances.

## File structure

- **Create:** `lib/onboarding/assess-answer.ts`, `app/api/validate-answer/route.ts`,
  `tests/assess-answer.test.ts`, `tests/validate-answer-route.test.ts`.
- **Modify:** `app/onboarding/profile/ConversationalOnboardingClient.tsx`
  (+ reuse existing bubble styles), `app/onboarding/profile/ProfileWizardClient.tsx`
  (+ `ProfileWizard.module.css` muted helper line), `package.json` (register the
  two new tests in `test:contracts`).

## MVP slices (build order)

1. `lib/onboarding/assess-answer.ts` + `tests/assess-answer.test.ts`.
2. Wire the floor into chat: attempt counter + one nudge bubble + hold-once.
3. `/api/validate-answer` + `parseValidation` + route tests; wire the smart layer
   into chat (fail-open, floor fallback).
4. Wire the floor into the form (non-blocking inline helper).

Each slice is independently shippable and CI-green; merge to main remains the
owner's call.
