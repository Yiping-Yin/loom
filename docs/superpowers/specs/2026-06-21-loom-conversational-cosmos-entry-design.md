# Conversational Cosmos Entry — Design Spec

**Date:** 2026-06-21
**Status:** Direction approved (brainstorm). Spec for review → writing-plans.

## Goal

Replace LOOM's front door so opening the app never dumps you onto raw profile info. The entry becomes a calm, **conversation-first cosmic surface**: one living prompt that starts a dialogue, from which your identity forms as a constellation. It promotes LOOM's existing conversational onboarding to the front door, dressed in the star-river cosmology — an AI-era entry, not a card/tool workspace.

## Problem (current)

`app/page.tsx` → `app/HomeGate.tsx`: SSR/first paint renders `HomeLanding`; after mount, if `localStorage` `loom:beginner-profile` exists it swaps to `HomeProfileView` (the saved profile, rendered raw). So any device that has onboarded once opens straight onto someone's information — confusing "from the user's role," and there is no welcoming, understandable cover. New users get `HomeLanding`, but it doesn't show what a finished LOOM looks like.

## What we're building

A new entry surface at `/` — the front door, shown **first, always** — that:
- Presents one calm cosmic surface: brand (moon + LOOM), one conversational prompt + a single input, and recede-to-whisper chrome only (Sign in, See an example, Continue as [name]). No cards, no toolbar.
- Starts a dialogue: the first input begins the conversation that *is* onboarding, continuing on the same surface (reusing the existing step machine + the just-shipped answer-quality floor/smart-layer).
- Forms a constellation live: as answers arrive, capability "stars" appear (ambient star-river response; standouts = comets).
- Routes by who you are: NEW (no profile) → the welcome cover that builds their LOOM; RETURNING (profile exists) → **straight into their usable LOOM (`/digital-me`)** to keep using and building it — no intermediate "welcome back" screen. The cover (new users only) also offers "See an example" → `/example` and a stubbed "Sign in".

## Non-goals (later phases)

- Real authentication / accounts / server-side per-user pages. "Sign in" is a visible-but-stubbed affordance now (the cover is *designed* for accounts; the backend is a separate, later project — the roadmap's last item).
- Deep generative constellation tied to the full capability-derivation pipeline. v1 constellation is a lightweight, deterministic ambient response (a star per answered area); full `derive-capabilities` integration is a later fold.
- Voice input.
- Removing the form wizard (`/onboarding/profile/form`) — it stays as a quiet alternate path, just not the front door.

## Architecture / components

1. **Entry routing — `app/HomeGate.tsx`.** Branch on profile existence: **no profile → render the welcome cover** (the new entry surface); **profile exists → go straight to the user's usable LOOM (`/digital-me`)** — no cover, no "welcome back" launchpad. (`readBeginnerProfileLocal()` decides client-side; SSR first paint can render the cover, then redirect to `/digital-me` once a profile is found.) `HomeProfileView` is retired as the `/` default; `/digital-me` (BeginnerDigitalMe — Ask + capability star-river + keep-building) is the returning hub. The cover is therefore a **new-user-only** surface.

2. **The entry surface — new `app/home-cover/ConversationalCosmosEntry.tsx` (+ `.module.css`).** Renders: the cosmic backdrop (moon, soft glow, sparse star field, a faint forming constellation), the brand lockup, the prompt line, the single input, and the whisper chrome. Uses the existing brand tokens (signature cyan `#4BC5DE` / data cyan `#6CE7F2`, dark cover, restrained liquid-glass). Client component (reads localStorage, hosts the conversation).

3. **Conversation engine reuse.** The surface does NOT reimplement onboarding. The input's first submit feeds the existing deterministic step machine (`applyAnswer` + `decideChatGate`/`resolveRemote` from `lib/onboarding/`), and the conversation continues on the same surface using the existing message model. The answer-quality floor + optional smart layer apply unchanged. Decision: extract the conversation's view-agnostic core enough that both the existing `ConversationalOnboardingClient` and this cosmic surface render the same machine (shared hook/state), rather than forking the logic. If that extraction proves heavy, v1 may re-skin `ConversationalOnboardingClient` directly — but no logic duplication.

4. **Live constellation — `app/home-cover/ConstellationField.tsx` + a pure `lib/onboarding/constellation.ts`.** A pure mapping turns the current profile/answered-steps into a small set of stars (+ a comet for a standout); the field renders them as SVG. v1 is deterministic and offline (each completed area → a star); reduced-motion safe; decorative (`aria-hidden`). Deeper capability-derivation integration deferred.

5. **Whisper chrome (cover, new users only).** `Sign in` (stub: a quiet "coming soon" affordance / no-op for now) and `See an example` (`<Link href="/example">`). No "Continue as [name]" — returning users never see the cover; they're routed straight to `/digital-me`.

## Data flow / degradation

- `localStorage` `loom:beginner-profile` stays the single source. The entry reads it for the returning state; the conversation writes it via the existing onboarding save. No backend.
- Works in the static macOS app (`loom://bundle`, no Node): the entry needs no `/api`; the answer-quality smart layer stays optional + fail-open.

## Clean-design constraints

- AI-era: the interface recedes; one prompt + one input is the locus; no card grid/toolbar.
- Minimal copy: only guidance (the prompt, button/whisper labels). No taglines or explanatory prose — fewer fixed words so the layout stays flexible.
- Cosmology: moon, star-river, comet; cyan on dark; restrained liquid-glass per existing tokens.
- Accessibility: the input is a properly labeled field; the constellation is decorative (`aria-hidden`) and reduced-motion safe; whisper items are real links/buttons.

## Testing

- **Routing (`HomeGate`):** no profile → renders the welcome cover (never `HomeProfileView`); profile present → routes to `/digital-me` (cover not shown). (Render/contract test, static-harness friendly — assert the rendered branch / redirect target.)
- **Conversation reuse:** the entry's first submit drives the existing step machine — covered by the existing pure `applyAnswer` / gate tests; assert the entry calls the shared core (no forked logic).
- **Constellation:** the pure `lib/onboarding/constellation.ts` mapping (profile → stars/comet) unit-tested at boundaries.
- **Degradation:** renders correctly with no profile, with a profile, and offline (no `/api`).
- Existing onboarding + answer-quality + capability tests stay green.

## Open decisions (resolve in review)

1. **Resolved (owner direction):** returning users go **directly to `/digital-me`** to keep using their LOOM — no "welcome back" launchpad, and they never see the cover. The cover is new-user-only.
2. **Form wizard from the entry** — keep a quiet "prefer a form?" secondary, or drop it from the front door entirely. Proposed: keep it as a quiet secondary, not on the cover.
3. **Constellation depth in v1** — proposed lightweight ambient (one star per completed onboarding area, comet for a flagged standout), not the full capability graph.

## Build slices (preview for the plan)

1. `lib/onboarding/constellation.ts` (pure mapping) + `ConstellationField` SVG + tests.
2. `ConversationalCosmosEntry` static surface (brand, prompt, input, whisper chrome) + CSS + render test.
3. Wire the conversation (reuse the step machine; first submit → dialogue on the surface).
4. Re-route `HomeGate` to the entry; returning "Continue as [name]"; verify profile / no-profile / offline; full suite + typecheck green.

Each slice ships independently and CI-green; merge/deploy stays owner-gated.
