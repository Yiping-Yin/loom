# LOOM Mature Product Landing — Design Spec

**Date:** 2026-06-22
**Status:** Approved (direction + 3 decisions confirmed by owner via mockup review)

## Goal
Turn the new-user front door from a single input floating in a cosmic void (reads as a *demo*) into a **real product landing** that reads as a *mature product* — without re-cluttering into a card-wall or pasting marketing prose.

## Owner-approved decisions
1. **Direction:** a real landing — top nav + editorial hero + product showcase + footer.
2. **Hero copy:** keep ONE poetic headline ("Everything you know, woven into one self.") — not a SaaS tagline, not bare.
3. **Showcase content:** a FICTIONAL sample persona (Maya Chen), so a stranger sees a finished LOOM without exposing the owner's data.

## The three levers (all combined)
- **Structure:** real chrome (nav with a Begin CTA, footer) + a "What you're weaving" section that *shows a finished LOOM* (identity + capability star-river). Substance via showing the product, not prose.
- **Aesthetic:** leave the generic dark-cosmic-glow template — left-aligned editorial hero, the photoreal moon used boldly as a real object, structured sections, a true type hierarchy (mono eyebrow → serif display → input). Bar: Linear/Stripe structure × Apple product cinematics.
- **Craft:** photoreal moon at scale (soft cast glow), the showcase panel *dimensionally staged* (perspective + grounding shadow + glare + cyan atmosphere, per the staging principle), real micro-detail, reduced-motion-safe.

## Architecture — two modes on one component
`app/HomeConversationalCover.tsx` (rendered by `HomeGate` for no-profile visitors) gains a mode switch over the SAME `useConversation()` engine:
- **Landing mode** (`messages.length === 0 && step.id !== 'review'`): the full page — `LandingNav` + hero (big moon + eyebrow + poetic headline + the live conversational prompt + the answer input + whisper links + résumé import) + `LandingShowcase` + `LandingFooter`.
- **Conversation/review mode** (otherwise): the existing focused cover — thread + input OR review/Save — **unchanged behavior** (keeps the test-locked Save flow). Once the visitor answers the first prompt, the page collapses to this focused surface so an active chat never shares the page with marketing sections.

The answer-input form, whisper nav, and hidden résumé-file-input are factored into shared render fragments used by both modes (DRY, no forked conversation logic).

## File structure
- `lib/onboarding/showcase-persona.ts` (NEW) — `SHOWCASE_PERSONA` + `SHOWCASE_CAPABILITIES: BeginnerCapability[]` (fictional; pure data; never persisted).
- `app/LandingNav.tsx` + `.module.css` (NEW) — lightweight landing nav (moon+LOOM · History `/product-history` · Example `/example` · **Begin** focuses the hero input). NOT the heavy `LoomGlobalNav` workspace pill.
- `app/LandingShowcase.tsx` + `.module.css` (NEW) — decorative product showcase: identity card + a self-contained, deterministic (FNV-1a, no Math.random) star-river SVG fed the fictional capabilities. Adapts the star/comet math from `components/CapabilityMap.tsx` but drops all interactivity / IndexedDB / cards. `aria-hidden` SVG; reduced-motion-gated twinkle.
- `app/LandingFooter.tsx` + `.module.css` (NEW) — quiet footer (moon+LOOM · © 2026 · History/Example/Help).
- `app/HomeConversationalCover.tsx` (MODIFY) — add the mode switch + landing markup; keep conversation/review markup intact.
- `app/HomeConversationalCover.module.css` (MODIFY) — add `.landing/.hero/.heroMoon/.heroInner/.heroEyebrow/.heroHeadline/.heroPrompt` + a hero cyan bloom; keep all conversation classes.
- `tests/home-cover.test.tsx` (MODIFY) — first-paint now renders landing mode: assert nav + poetic headline + input + showcase (persona) + footer; keep review-branch (conversation-mode) assertions.

## Tokens & constraints
- Reuse only existing tokens: `--display` (Cormorant), `--serif` (New York), `--mono`, `--fs-*`, `--space-*`, `--r-*`, `--text-1/2/3`, `--ink-0`, `--line`, `--signature-cyan(-hi)`, `--mat-*`, `--dur-*`, `--ease*`. No new design system.
- Static-export safe (no /api, all client/presentational). WebKit app → `-webkit-backdrop-filter` where blur is used.
- All motion under `@media (prefers-reduced-motion: no-preference)`; reduced motion gets the rested state.
- Nav/footer links point only to real routes (`/example`, `/product-history`, `/help`).

## Verification
`npm run test:contracts` (620 baseline + updated home-cover) and `npm run typecheck` (build → compiles CSS modules) both green; visual preview before landing. Then PR + macOS app rebuild.
