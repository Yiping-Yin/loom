# Loom Visual System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the whole Loom visual system to the cool-black "Evidence Desk" design — luminance-layered structure, watch-hand gold, real optical glass, four scene light-environments — across every surface, keeping the contract suite green.

**Architecture:** One shared foundation layer of CSS custom properties + glass/light mixins lives in `app/globals.css :root`. Each route's existing root class (`.lcv` home, `.vd-section-page` archive, `.roleOsPage` Digital Me, the support pages, the QBook replica) becomes a *scene* that consumes the foundation and overrides only base-ink / accent-budget / ambient-glow / material-strength. No class renames; visual values only; theme/colour assertions updated in lockstep.

**Tech Stack:** Next.js + CSS (globals + CSS modules), the Vite QBook replica, `sharp` for icons, `pptxgenjs` for the deck. Contract tests via `npm run test:contracts`; gate every task on `npm run typecheck` + the relevant test file.

**Spec:** `docs/superpowers/specs/2026-06-11-loom-visual-system-design.md` — read it; this plan implements it exactly. The banned anti-patterns (solid gold fills, saturated discs, fake glass) are hard constraints.

**Sequencing:** Do NOT start until the in-flight QBook round-2 workflow (wf_18e194b1) has fully finished — it edits the same files. Verify it is done first.

---

### Task 0: Confirm clean starting state

- [ ] **Step 1:** `cd "/Users/yinyiping/Desktop/Private Wiki/LOOM" && npm run test:contracts 2>&1 | grep -E "ℹ (tests|pass|fail)"` — record baseline (expect 0 fail). `npm run typecheck` — must be clean (round-2 fixed the ask-yiping regression; if not clean, fix per spec before proceeding).
- [ ] **Step 2:** Confirm the QBook round-2 workflow is finished (no agent editing globals.css / modules / replica).

---

### Task 1: Foundation token layer (the shared contract)

**Files:** Modify `app/globals.css` (`:root` + add a `/* === Loom Visual System v1 === */` block near the top, after existing resets); Modify theme tests `tests/night-chrome-theme.test.ts`, `tests/globals-compatibility.test.ts`, `tests/quiet-horizon-layout.test.tsx` in lockstep.

- [ ] **Step 1:** Add the foundation custom properties to `:root` (cool-black, a hair of blue undertone — NOT neutral, NOT navy):
```css
:root{
  --ink-0:#07090C; --ink-1:#0A0D11; --ink-2:#0F1318; --ink-3:#161B22;
  --ink-4:#1E242D; --ink-5:#2A323D; --line:#232A33; --line-soft:#1A1F27;
  --text-1:#E6E9EE; --text-2:#9BA3AE; --text-3:#5E6671;
  --gold:#C8A24A; --gold-hi:#E3C56A; --cyan:#4BC5DE; --up:#3FB37A; --down:#E06A6A;
  --serif:'Cormorant Garamond',Georgia,serif; --mono:ui-monospace,'JetBrains Mono',Menlo,monospace;
  /* key light, top-left */
  --keylight: inset 0 1px 0 rgba(255,255,255,0.05);
  --float-1: 0 12px 30px rgba(0,0,0,0.45);
  --float-2: 0 24px 60px rgba(0,0,0,0.55);
}
```
- [ ] **Step 2:** Add reusable utility classes/mixins (glass = real optics; material card; gold-mark):
```css
.loom-glass{ background:rgba(16,20,26,0.55); -webkit-backdrop-filter:blur(28px) saturate(110%); backdrop-filter:blur(28px) saturate(110%);
  border:1px solid var(--line); border-radius:14px;
  box-shadow: var(--keylight), var(--float-2), inset 0 -1px 0 rgba(0,0,0,0.35); }
.loom-material{ background:linear-gradient(180deg,var(--ink-4),var(--ink-3)); border:1px solid var(--line); box-shadow:var(--keylight),var(--float-1); }
.loom-gold-mark{ color:var(--gold); } /* text/stroke only — never a fill */
.loom-num{ font-family:var(--mono); font-variant-numeric:tabular-nums; color:var(--text-1); }
```
- [ ] **Step 3:** Update `body`/`.layout`/`.loom-grain`/`.loom-vignette` to the cool-black base + a single top-center ambient (very faint cool glow), removing any warm/champagne canvas.
- [ ] **Step 4:** Update theme tests: grep each of the three test files for the old hex tokens (champagne `#C8A24A`? no — old were `#C9A15C`/`#FCD535`/`#9E7C3E`/`#0B0B0B` etc.) and re-point colour/theme assertions to the new tokens. Keep structural assertions.
- [ ] **Step 5:** `npm run test:contracts` (0 fail) + `npm run typecheck` (clean). Commit: `style(loom): cool-black Evidence-Desk foundation tokens + glass/light mixins`.

---

### Task 2: Cover / Home scene (`.lcv`) — still, luxe

**Files:** Modify `app/globals.css` (`.lcv*` block); Modify `components/verified-dossier/VerifiedDossierHome.tsx` only if a fill needs removing; Modify `tests/home-client-first-paint.test.tsx`, `tests/loom-personal-positioning.test.tsx`, `tests/loom-mature-platform-contract.test.tsx` in lockstep.

- [ ] **Step 1:** Re-point `.lcv` vars to the foundation: base `--ink-0`, max whitespace, accent budget = gold ~2 touches (active nav underline + one numeral mark), NO cyan. Replace every literal champagne/#FCD535/#C8A24A-as-fill with token references; ensure NO gold fill anywhere (active nav = 1px gold underline only; row numbers = `--text-2` mono, not gold pills).
- [ ] **Step 2:** Make the hero artifacts real: the CV panel = real-paper sheet with `--float-1` shadow + slight perspective (`transform: perspective(1200px) rotateY(...)` subtle); education logos on neutral `--ink-4` chips (no white); experience cards = `.loom-material` (no flat colour fill, no Optiver-blue/UNSW-gold blocks → neutral material + small brand mark). 
- [ ] **Step 3:** Screenshot `http://localhost:3000/` at 1488 + 1920; verify against spec §3 Cover row (deepest black, ~2 gold touches, real artifacts, zero fills). Fix deviations.
- [ ] **Step 4:** `npm run test:contracts` + `npm run typecheck`; commit `style(loom): Cover scene — Evidence Desk`.

---

### Task 3: Archive scene (`.vd-section-page`) — restrained, document-forward

**Files:** Modify `app/globals.css` (`.vd-section-page*`); Modify `tests/loom-verified-dossier-home-contract.test.ts` if it pins colours.

- [ ] **Step 1:** Re-point `.vd-section-page` vars: base `--ink-2` (lifted), neutral, material strength DOWN, gold only on verified marks (stroke, not fill). Documents/evidence read clearly. Keep the unified nav (1px gold active underline).
- [ ] **Step 2:** Screenshot `/education` + `/experience` (1488); verify restrained/credible. Commit `style(loom): Archive scene`.

---

### Task 4: Digital Me + Ask Yiping scene (`.roleOsPage`) — alive, signal

**Files:** Modify `app/digital-me/DigitalMeRoleOS.module.css`, `components/verified-dossier/AskYiping.module.css`.

- [ ] **Step 1:** Re-point `--role-*` to the foundation: base `--ink-1` + faint cool ambient glow; cyan `--cyan` for data-signal (active capability indicator, the Sources→Draft→Answer flow line as a thread-of-light, "thinking" state); gold ONLY on the active tab/row as a 1px left-border or underline + dark text — NOT a filled yellow tab. Kill the yellow-fill active states.
- [ ] **Step 2:** Add the thread-of-light: a thin `--cyan` gradient line connecting question → cited sources on the Ask answer (CSS only, subtle). The Live Market Room (now QBook) keeps its perspective screenshot.
- [ ] **Step 3:** Screenshot `/digital-me` (1488); verify signal/alive, cyan-on-data, gold sparse. `npm run test:contracts` (digital-me-role-os) + typecheck; commit `style(loom): Digital Me scene — signal`.

---

### Task 5: Support pages — adopt the foundation

**Files:** Modify the per-page styles for `app/loom` (via `app/product-history/HistoryDossier.module.css`), `app/system`, `app/discipline`, `app/hour`, `app/connections`, `app/colophon`, `app/year`, and check `app/help`, `app/knowledge`.

- [ ] **Step 1:** For each, re-point to the foundation tokens (Archive-scene defaults), unified nav, dark-image framing (dark images on `.loom-material` with `--line` border + shadow). Use `--cyan` for data affordances (the year/hour/connections data) where it reads better than gold.
- [ ] **Step 2:** Screenshot each; verify no cream/champagne leftovers. Commit `style(loom): support pages adopt foundation`.

---

### Task 6: QBook replica — cold, dense terminal

**Files:** Modify `optibook-replica/src/styles.css` (+ `src/App.jsx`/`src/data.js` only for the leaderboard rank/avatar markup); then rebuild + reintegrate into `LOOM/public/optibook/`.

- [ ] **Step 1:** Re-point the replica palette to cool-black foundation (bg `--ink-0`, panels `--ink-3`, hairlines `--line`). **KILL the yellow-fill leaderboard pills** (the rejected "1 · S"): rank = a quiet `.loom-num` numeral in `--text-2` (rank 1 may get a single tiny gold mark), team avatar = a neutral monogram on `--ink-4` (NOT a saturated green/coloured disc).
- [ ] **Step 2:** Colour only on data: order book + PnL + ticker use `--up`/`--down` (small), price-graph sparklines + chart lines use `--cyan`; gold only on the active control. Structure stays achromatic.
- [ ] **Step 3:** `cd optibook-replica && npm run build`; `rm -rf "../LOOM/public/optibook"/* && cp -R dist/. "../LOOM/public/optibook/"`. Confirm QBook wordmark + new palette at `http://localhost:3000/optibook/index.html`.
- [ ] **Step 4:** `cd LOOM && npm run test:contracts` (0 fail). Commit (replica repo) `style(qbook): cool-black terminal, kill yellow-fill pills`.

---

### Task 7: App icon — watch-hand re-cut

**Files:** Modify `public/icon.svg`; regenerate via the icon script.

- [ ] **Step 1:** Re-cut the icon to the discipline: the flat bold yellow "L" is a toy. New: a finer **gold hairline** woven-L mark (thinner stroke, ~24/512 not 48), more cool-black luminance/depth in the tile (a subtle top key-light sheen), the cyan weft as a single thin thread; gold area minimal. Keep it legible at 32px.
- [ ] **Step 2:** Regenerate all sizes (the `/tmp/gen2.mjs` approach via `sharp` from `public/icon.svg` → `public/icon.png` 512, `apple-touch-icon.png` 180, `favicon.ico`, the 7 `AppIcon.appiconset` PNGs, brand sources).
- [ ] **Step 3:** `npx tsx --test tests/app-store-assets.test.ts` (pass); view the 512 + 32 renders; iterate once if toy-ish. Commit `style(loom): app icon re-cut to watch-hand discipline`.

---

### Task 8: Refresh README screenshots + deck

**Files:** Re-capture `docs/images/product/*.png` from the new pages; regenerate `docs/deck/loom.pptx` (palette → cool-black/gold per `docs/deck/build-loom-deck.mjs`).

- [ ] **Step 1:** Re-screenshot cover/digital-me/education/experience/optibook(QBook) at 1488 deviceScaleFactor 2 into `docs/images/product/`.
- [ ] **Step 2:** Update `docs/deck/build-loom-deck.mjs` palette to the foundation tokens (cool-black, champagne gold, cyan), rebuild `loom.pptx`. Update README copy where it says Optibook→QBook.
- [ ] **Step 3:** Commit `docs(loom): refresh product screenshots + deck to v1 system`.

---

### Task 9: Final verification

- [ ] **Step 1:** `npm run test:contracts` (0 fail), `npm run typecheck` (clean), `npm run build` (succeeds); replica `npm run build` (succeeds).
- [ ] **Step 2:** Screenshot every route at 1488 + 1920; judge each against spec §3 (right scene mood, gold <5% & never filled, no saturated discs, real glass/material/light, no cream/champagne leftovers). Use a fresh subagent for visual QA (fresh eyes).
- [ ] **Step 3:** Fix any spec deviations found; re-verify only affected surfaces. Stop after one fix cycle unless a user-visible defect remains.

---

## Self-review notes
- Spec coverage: foundation (Task 1) ✓; 4 scenes (Tasks 2–5) ✓; QBook + yellow-fill ban (Task 6) ✓; icon (Task 7) ✓; README/deck (Task 8) ✓; anti-patterns enforced in Tasks 2/4/6; contract-test safety in every task.
- Tokens are defined once in Task 1 and referenced by name everywhere — no divergent hexes.
- No placeholders: foundation CSS is given in full; per-surface tasks specify exact files, the rule, and the verify step.
