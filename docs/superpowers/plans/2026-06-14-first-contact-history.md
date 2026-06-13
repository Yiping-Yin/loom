# First Contact — History hero interaction · Implementation Plan

> Executed via superpowers:subagent-driven-development on branch `feat/first-contact`.
> Design spec: `../specs/2026-06-14-first-contact-spec.md`. Steps use `- [ ]`.

**Goal:** Turn the History hero into the cinematic "First Contact" interaction — cold-open "History" flicker → stylized astronaut helmet approaches from the dark → a comet ignites a monochrome→color climax + moon waxes full + the curved visor reveals the LOOM wordmark + explanation → settles to cool-black.

**Architecture (from Plan subagent, codebase-verified):**
- Extend the EXISTING `.heroStudy` CSS visor in `components/product-history/`; do NOT use Three.js for the helmet. CSS/SVG layers + ONE lazy 2D `<canvas>` for the comet + path color-reveal only.
- Single normalized progress `--fc-p` (0→1) written once/frame by a `useFirstContact` hook (IntersectionObserver gate + passive rAF scroll-scrub). All layers interpolate from `--fc-p` in CSS. Climax+settle = one-shot latched timeline. Pointer is a separate always-on channel (`--fc-px/--fc-py`).
- `'use client'` wrapper composed into the hero WITHOUT touching pinned nodes. Static/no-JS/reduced-motion render = the clean S3 "arrived" frame.

**Hard constraints:** product-history is in the static export bundle → client-only, export-safe, static fallback. Contract pins must survive: `<h1 id="history-title">History</h1>`, `<p className={styles.heroLead}>{HERO_STATEMENT}</p>`, "Source-backed self. Living archive.", Library/Eyes/Memory annotations, "Touch or focus to read the Loom mark", `.hero { contain: paint; overflow: clip }`, NO `var(--gold)`. Gate every task with `npm run test:contracts` (259/0). WCAG flash safety on the flicker. Cool-black + signature cyan only (gold retired).

**Files:** new `components/product-history/first-contact/{FirstContact.tsx, FirstContact.module.css, useFirstContact.ts, ColdOpen.tsx, VisorText.tsx, CometCanvas.tsx, constants.ts}`; minimal additive edit to `ProductHistoryPage.tsx`.

---

## Tasks

- [ ] **T0 — Wire Fraunces wordmark font.** Add Fraunces via `next/font/google` as `--font-wordmark`; apply to the LOOM wordmark (visor wordmark; and the `LoomGlobalNav` wordmark for consistency — verify no pin/contract breakage). Honors the locked Fraunces decision. Accept: Fraunces renders for the wordmark; contracts 259/0; build clean.
- [ ] **T1 — Scaffold + static "arrived" fallback.** Create `first-contact/{FirstContact.tsx,.module.css,constants.ts}`; add one `<FirstContact/>` layer into the hero (no pinned-node edits). Render S3 resting layers (cool moon from `public/brand/loom_lunar_orb.png`, cool-black, visor-text slot) — no motion. `'use client'` boundary. Accept: page renders richer at rest; no-JS shows helmet+moon (not blank); contracts 259/0.
- [ ] **T2 — Curved visor text (SVG textPath + falloff).** `VisorText.tsx`: convex `<textPath>` LOOM (Fraunces) + eyebrow `LIBRARY · EYES · MEMORY` + explanation `A living, source-backed identity that can answer for you`; per-letter opacity/scale/blur falloff; perspective container. Render at resting lit state (= fallback). Accept: arced legible text at rest; copy exact; contracts pass.
- [ ] **T3 — `useFirstContact` hook.** IO gate + passive rAF scroll→`--fc-p`; reduced-motion/reduced-data short-circuit to arrived; teardown on leave. Accept: `--fc-p` advances 0→1 on scroll; stops off-screen; reduced-motion → arrived.
- [ ] **T4 — S0→S1 approach (CSS, `--fc-p`).** Helmet scale/translate/turn, rim-light widen, moon wax+parallax+sharpen, first cyan points — GPU transforms/opacity only. Accept: smooth approach 0→0.9 at 60fps; reduced-motion rests at arrived; contracts pass.
- [ ] **T5 — Cold-open flicker (`ColdOpen.tsx`).** Client-only "History" serif overlay; ≤3 low-contrast dips; once/session via sessionStorage; skip on reduced-motion; never on SSR/first-paint. Accept: first visit flickers→fades→S0; reload skips; reduced-motion skips; no full-screen strobe.
- [ ] **T6 — Comet + color-reveal (`CometCanvas.tsx`) + color/god-ray layers.** Lazy 2D canvas comet arc (M→moon) + path-following grayscale→color reveal; god-rays; photographic palette (warm `#E0A24A` / earth `#2E6E8E`/`#3A6B54` + cyan); self-clean. Accept: burst plays once, color ignites along trail (not global flash); reduced-motion none; contracts pass.
- [ ] **T7 — S2 climax + S3 settle (latch).** One-shot burst at `--fc-p≥~0.92`: comet, color/god-ray peak, moon full+bright, wordmark even→M-enlarged, visor reveal center→edges; then settle to cool-black leaving LOOM lit. Idempotent (no re-strobe). Accept: fires once; settles to clean arrived; back-scroll no replay; contracts pass.
- [ ] **T8 — Pointer channel.** Throttled pointermove → `--fc-px/--fc-py`: visor highlight parallax, curved-text rotateY, restrained ripple (~0.4s, no splash). Accept: tilt+highlight on move; subtle ripple; works pre/post settle; off under reduced-motion/touch.
- [ ] **T9 — Fallback + a11y + perf hardening.** Verify no-JS/SSR/reduced-motion all land on identical clean S3 frame; will-change/contain discipline; IO teardown; aria-hidden on decorative layers, pinned semantics intact; export build succeeds. Accept: no CLS, no long tasks, export emits arrived frame, contracts 259/0.

**Parallelizable:** T1 → {T2,T3,T5} → T4(needs T3), T6(needs T2+T4) → T7 → T8 → T9. (Subagent-driven runs them sequentially with review.)
