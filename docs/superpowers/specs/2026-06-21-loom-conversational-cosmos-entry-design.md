# Conversational Cosmos Entry — Design Spec (audit-grounded)

**Date:** 2026-06-21
**Status:** Direction approved + grounded against a full audit of the current code. Owner confirmed all resolutions. Ready for writing-plans.

## Goal

Replace LOOM's front door so opening the app is right for *who you are*:
- **New users (no profile)** → a calm, conversation-first cosmic cover: one living prompt that starts a dialogue, your identity forming as a constellation. Interface recedes; no cards/toolbar/taglines.
- **Returning users (profile in localStorage)** → straight into their usable LOOM at `/digital-me` — use it, ask it, keep building.

It promotes LOOM's existing conversational onboarding to the front door in the star-river cosmology, reusing what already ships — an AI-era entry, not a card/tool workspace.

## Current reality (from audit `wf_6931adff-161`)

- The macOS app always cold-opens `loom://bundle/index.html` → the `/` route → `app/HomeGate.tsx`. There is **no server route decision and no redirect**; `/` is the canonical place the entry decision must live.
- `HomeGate` is a client two-phase SSR-safe gate: SSR/first paint → `HomeLanding` (marketing splash: nav + headline + Gather→Build→Represent loop + 2 CTAs); after mount, if a profile exists in localStorage key `loom:beginner-profile`, it swaps **in place** to `HomeProfileView` at `/`. So returning users do NOT reach `/digital-me` on cold open today.
- The conversation engine already exists (`ConversationalOnboardingClient`) but lives one click away at `/onboarding/profile`; on save it already does `router.push('/digital-me')`.
- `/digital-me` (`DigitalMeGate` → `BeginnerDigitalMe`) is a genuinely usable hub (identity + capability star-river + journey + proof + grounded AskYiping, all AI-off resilient) — but on first paint it flashes the stranger `IdentityEmptyState`, its star-river is empty until a manual "Build capability map" click, and there's no "keep building" CTA.
- `tests/home-gate-redirect.test.ts` hard-locks the current HomeGate: **must NOT use `useRouter`**, and asserts the exact `HomeLanding` / `HomeProfileView` branches.
- `loom-cosmic-field`, the cyan/serif tokens, the moon marks, and `CapabilityMap`'s deterministic star-river (FNV-1a, no `Math.random`, two-tier reduced-motion) all already ship and are reusable. Token is `--signature-cyan-hi` (#8AF7E6); `#6CE7F2` is only a stray literal — don't reuse it.

## Resolved decisions (owner-confirmed)

1. **Routing:** both doors live inside `HomeGate` at `/` — a **component swap + a client redirect**, not a new route. Returning → `useRouter().replace('/digital-me')` (the `home-gate-redirect` contract test is rewritten to the new intent, permitting the router). No `/cover` route (it's a legacy stub) and no new `app/` route (avoids product-shell classification + static-404 risk).
2. **Make the returning door actually clean** — in scope: `/digital-me` gets (a) a neutral self-skeleton SSR/first-paint (no stranger flash), (b) auto-build + persist of the capability star-river on entry (populated on arrival, not empty-until-click), (c) a discoverable "keep building" CTA → `/onboarding/profile`.
3. **No fork:** extract the conversation's pure core into `lib/onboarding/steps.ts` (`applyAnswer`, `stepPrompt`, `progressOf`, `TOTAL_STEPS` — the latter two are currently un-exported / internal) and lift the runtime into a `useConversation()` hook. Both `ConversationalOnboardingClient` and the cover render the same hook. (Also removes the CSS-import shim in `tests/conversational-onboarding.test.tsx`.)
4. **Form wizard:** keep a quiet "prefer a form?" secondary on the cover, not foregrounded.
5. **Sign in:** NOT on the cover in v1 (no accounts backend; single-tenant localStorage — a no-op control is noise). Re-add when accounts ship.

## Architecture / components

1. **`app/HomeGate.tsx` — the two-door switch.** Keep the existing `mounted`/`profile` `useEffect` machinery; change the branches: SSR/first paint + no-profile → render the new cover; after mount + profile present → `useRouter().replace('/digital-me')` (render nothing / a minimal cosmic placeholder during the redirect beat — instant under reduced motion). `readBeginnerProfileLocal()` stays the only discriminator.

2. **`app/HomeConversationalCover.tsx` (+ `.module.css`) — the new-user cover.** Not a route — a component HomeGate renders. Built from shipped parts: `loom-cosmic-field` backdrop, `var(--display)` serif headline (minimal/no tagline), `var(--signature-cyan-hi)` pill CTA, a moon mark, the conversation (via the hook), the v1 constellation, and a quiet "prefer a form?" link + "See an example" → `/example`. Clean copy only (prompt + button/whisper labels). New CSS Module — do not grow `globals.css`.

3. **`lib/onboarding/steps.ts` + `lib/onboarding/useConversation.ts` — the shared engine (extraction first).** `steps.ts` holds the pure step logic (move + export `applyAnswer`, `stepPrompt`, `progressOf`, `TOTAL_STEPS`; no React/CSS). `useConversation()` holds the runtime (message model, current step, submit → floor/`decideChatGate` → optional smart layer/`resolveRemote` → advance, résumé import/paste, save→`/digital-me` with the write-failure guard). `ConversationalOnboardingClient` becomes a thin view over the hook; the cover is a second thin view. The just-shipped answer-quality floor + fail-open smart layer ride along unchanged.

4. **`lib/onboarding/constellation.ts` (pure) + `app/ConstellationField.tsx` (decorative).** v1: a deterministic mapping from answered onboarding areas → a small set of stars (+ a comet for a standout), reusing `CapabilityMap`'s deterministic layout idiom. `ConstellationField` renders them as `aria-hidden` SVG. The "assembling as answers arrive" choreography is net-new, gated behind `@media (prefers-reduced-motion: no-preference)`; under `reduce` it's an instant static field. Full `derive-capabilities` integration stays out of scope.

5. **`/digital-me` cleanup (returning door).** `DigitalMeGate`: change the SSR/pre-mount branch from the stranger `IdentityEmptyState` to a neutral self-skeleton. `BeginnerDigitalMe`: auto-build + persist capabilities on entry (so the star-river is populated on arrival; reuse the existing build path, guard the write boolean). Add a "keep building" CTA → `/onboarding/profile` (it already preloads the profile and returns to `/digital-me`).

## Data flow / degradation

- `localStorage` `loom:beginner-profile` stays the single source; the conversation writes it via the existing save (check the write boolean before routing). No backend.
- Works in the static `loom://bundle` app: the cover needs no `/api`; the smart layer stays optional + fail-open (mirror `runExtraction`). No new route → no missing-`.html`/404 risk.
- Accept a one-frame cover flash before the returning-user redirect (instant under reduced motion); the cover is the SSR/first-paint default (no localStorage at render).

## Clean-design constraints

- AI-era: interface recedes; one prompt + one input is the locus; no card grid/toolbar.
- Minimal copy: only guidance (prompt, button/whisper labels). No taglines/explanatory prose.
- Cosmology + tokens: `loom-cosmic-field`, moon marks, star-river/comet; `var(--signature-cyan-hi)`, `var(--display)`; restrained glass. Preserve existing terminology (Digital Me, Capabilities, star-river).
- A11y: the input is a labeled field; the constellation is `aria-hidden` + reduced-motion safe; whisper items are real links.

## Testing

- **`tests/home-gate-redirect.test.ts` — rewrite** to the new intent: no profile → renders the cover (never `HomeProfileView`/`HomeLanding`); profile present → redirects to `/digital-me` (permit `useRouter`).
- **Extraction:** unit-test `lib/onboarding/steps.ts` (pure `applyAnswer`/`stepPrompt`/`progressOf`/`TOTAL_STEPS`) — the existing onboarding contract tests must stay green after the move; both views assert they consume the shared hook (no forked logic).
- **Constellation:** unit-test the pure `lib/onboarding/constellation.ts` mapping (answers → stars/comet) at boundaries.
- **/digital-me:** assert the self-skeleton first-paint branch (not the stranger empty state) and that the keep-building CTA renders for a profile.
- **Degradation:** renders with no profile, with profile, offline (no `/api`); reduced-motion = static.
- Existing onboarding + answer-quality + capability tests stay green; route-classification contract stays satisfied (no new route).

## Build slices (for the plan)

1. **Extraction (refactor, no behavior change):** `lib/onboarding/steps.ts` + `useConversation()` hook; `ConversationalOnboardingClient` becomes a thin view; drop the test CSS shim. Verify full suite green.
2. **Constellation:** pure `lib/onboarding/constellation.ts` + `ConstellationField` (+ reduced-motion) + tests.
3. **Cover:** `app/HomeConversationalCover.tsx` (+ CSS module) — cosmic surface, prompt + input via the hook, v1 constellation, quiet "prefer a form?" / "See an example". Render test.
4. **Wire the two doors:** `HomeGate` → no profile = cover; profile = `replace('/digital-me')`; rewrite `home-gate-redirect` test.
5. **Clean the returning door:** `/digital-me` self-skeleton first paint + auto-build/persist capabilities + keep-building CTA; tests.
6. **Verify:** full `test:contracts` + typecheck green; push; CI. Merge/deploy owner-gated.

Each slice ships independently and CI-green.
