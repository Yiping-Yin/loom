# Capability Graph + Compounding Structure — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax. Each task = one fresh subagent; verify (`npm run test:contracts` → `# fail 0`, `npm run typecheck` → exit 0) + commit before the next. Visuals (Task 5) are tuned live in the preview by the controller.

**Goal:** Turn the beginner Digital Me into a living, compounding, evidence-backed capability map (the "star-river" + comets) auto-derived from the user's own profile + artifacts.

**Architecture:** A pure data layer (`lib/capability/`) derives `BeginnerCapability[]` from a `BeginnerProfile` — heuristically (offline-safe) or via an LLM route (web/keyed). The result is cached on the profile. A client component (`CapabilityMap.tsx`) renders an SVG star-river (stars = capabilities, magnitude = evidence strength, comets = `strong`/standout) over capability cards (status ring · evidence chips with "Open →" · growth nudge). It mounts as the centerpiece of `BeginnerDigitalMe`. Faithful generalization of the owner Role-OS (`DigitalMeClaimNode`: label + evidenceStatus + evidenceIds).

**Tech Stack:** Next 16 / React 19, TypeScript, CSS modules + tokens in `globals.css`, `node:test`/`tsx` contracts, `lib/anthropic-http.ts` (LLM), `lib/artifact/artifact-store.ts` (artifact open).

**Brand tokens:** `--signature-cyan` #4bc5de / `--signature-cyan-hi` #6ce7f2, `--display`/`--serif`, `--fs-*`, `--space-*`, `--dur-*`/`--ease-*`. Assets: `public/brand/loom_lunar_comet_icon.svg`, the moon orb, the cosmic field. Restraint: active = luminance/hairline, never a color fill; `prefers-reduced-motion` gated.

---

## File structure
- `lib/capability/capability-graph.ts` — types + `computeStatus` + `deriveCapabilitiesHeuristic` + `normalizeCapabilities` (pure, no IO).
- `lib/capability/derive-capabilities.ts` — client orchestration: try the route, fall back to heuristic.
- `app/api/derive-capabilities/route.ts` — LLM derivation (server; shelved in static export).
- `lib/profile/beginner-profile.ts` — add `capabilities?` field + normalize.
- `components/CapabilityMap.tsx` + `components/CapabilityMap.module.css` — the star-river + cards.
- `app/digital-me/BeginnerDigitalMe.tsx` — mount the Capabilities section + build/refresh action.
- Tests: `tests/capability-graph.test.ts`, `tests/derive-capabilities.test.ts`, `tests/capability-map-render.test.tsx`, `tests/derive-capabilities-route.test.ts`.

---

## Task 1: Capability data model + heuristic derivation + status

**Files:**
- Create: `lib/capability/capability-graph.ts`
- Modify: `lib/profile/beginner-profile.ts` (add `capabilities?`, normalize, `emptyBeginnerProfile`)
- Test: `tests/capability-graph.test.ts` (+ register in `package.json` `test:contracts`)

**Contract (define exactly these):**
```ts
export type CapabilityStatus = 'strong' | 'partial' | 'direction';
export type CapabilityEvidence = { kind: 'education'|'experience'|'work'|'artifact'; refId: string; label: string };
export type BeginnerCapability = { id: string; label: string; status: CapabilityStatus; evidence: CapabilityEvidence[]; note?: string; growth?: string };
export function computeStatus(evidence: CapabilityEvidence[]): CapabilityStatus; // strong = >=2 evidence AND >=1 kind 'artifact'; partial = >=1; direction = 0
export function deriveCapabilitiesHeuristic(profile: BeginnerProfile): BeginnerCapability[]; // deterministic: candidate labels from work titles + experience roles + a skill-keyword scan of bullets/works/about; map evidence by token overlap to edu/exp/work/artifact refs; status via computeStatus; cap ~8; stable ids like `cap-<slug>`
export function normalizeCapabilities(raw: unknown): BeginnerCapability[]; // drop no-label, cap count 12, cap label 80 / note 240 / growth 160, status fallback 'direction', evidence cap 8
```
- [ ] **Step 1: failing tests** — `computeStatus` (strong/partial/direction by the rule); `deriveCapabilitiesHeuristic(sampleProfile)` returns ≥1 capability with evidence refs that exist in the profile + a status; `normalizeCapabilities` drops no-label + caps. Also: `emptyBeginnerProfile().capabilities` is `[]`; `normalizeBeginnerProfile` keeps a valid `capabilities` and coerces a non-array to `[]`.
- [ ] **Step 2: run → fail** (`npm run test:contracts`).
- [ ] **Step 3: implement** `capability-graph.ts` per the contract; add `capabilities?: BeginnerCapability[]` to `BeginnerProfile`, `capabilities: []` to `emptyBeginnerProfile`, and `normalizeCapabilities(input.capabilities)` into `normalizeBeginnerProfile`.
- [ ] **Step 4: run → pass**; `npm run typecheck` → 0.
- [ ] **Step 5: commit** `feat(capability): data model + heuristic derivation + status`.

## Task 2: LLM derivation route

**Files:**
- Create: `app/api/derive-capabilities/route.ts`
- Test: `tests/derive-capabilities-route.test.ts` (register)

**Contract:** POST `{ profile: BeginnerProfile }`. Mirror `app/api/extract-profile/route.ts` exactly: `runtime='nodejs'`, `dynamic='force-dynamic'`, cap body (≤256KB → 413), bad JSON → 400. `!isAnthropicConfigured()` → `{ configured:false }`. Else call `runAnthropicHttp` (Sonnet) with a strict prompt: "from this profile derive 4–8 capabilities; for each return label, evidence as an array of {kind,refId,label} that MUST reference existing profile entries (education[i]→refId 'edu-i', experience[i]→'exp-i', works[i]→'work-i', artifacts[i]→the ArtifactRef.id), an optional one-line note, and a growth suggestion. JSON only." Parse defensively (strip fences, JSON.parse), drop any evidence ref that doesn't resolve to a real profile entry, run through `normalizeCapabilities`, recompute `status` via `computeStatus`, return `{ ok:true, capabilities }`; malformed/throw → `{ ok:false }`.
- [ ] **Step 1: failing tests** — no key → `{configured:false}`; oversize → 413; given a stubbed valid-JSON Anthropic response, returns normalized capabilities with only resolvable evidence refs; malformed model output → `{ok:false}`.
- [ ] **Step 2: run → fail.**
- [ ] **Step 3: implement** the route.
- [ ] **Step 4: pass + typecheck 0.**
- [ ] **Step 5: commit** `feat(capability): LLM derivation route with evidence-ref validation`.

## Task 3: Client derivation orchestration

**Files:**
- Create: `lib/capability/derive-capabilities.ts`
- Test: `tests/derive-capabilities.test.ts` (register)

**Contract:** `export async function buildCapabilities(profile: BeginnerProfile): Promise<BeginnerCapability[]>` — POST the profile to `/api/derive-capabilities`; if `{ok:true}` use `capabilities`; on `{configured:false}` / non-OK / 404 (static export) / thrown fetch / `{ok:false}` → return `deriveCapabilitiesHeuristic(profile)`. Never throw.
- [ ] **Step 1: failing tests** (mock `fetch`) — `{ok:true,capabilities}` → returns them; `{configured:false}` → returns heuristic; thrown fetch → heuristic; 404 → heuristic.
- [ ] **Step 2: run → fail.**
- [ ] **Step 3: implement.**
- [ ] **Step 4: pass + typecheck 0.**
- [ ] **Step 5: commit** `feat(capability): client derivation orchestration with heuristic fallback`.

## Task 4: CapabilityMap — capability cards

**Files:**
- Create: `components/CapabilityMap.tsx`, `components/CapabilityMap.module.css`
- Test: `tests/capability-map-render.test.tsx` (register)

**Contract:** `CapabilityMap({ capabilities, profile }: { capabilities: BeginnerCapability[]; profile: BeginnerProfile })`. For v1 this task renders ONLY the cards list (Task 5 adds the SVG above). Each card: status ring (class by `status`), `label`, optional `note`, **evidence chips** (one per `evidence`: education/experience/work chips link to `/education`/`/experience`/`/works`; an `artifact` chip is a button that opens the blob via `getArtifactObjectUrl(refId)` — mirror `VerifiedArtifactCard`'s open + "file unavailable" fallback), and the `growth` nudge line. Empty `capabilities` → a calm "Build your capability map" prompt. Tokens only; hover/focus-visible per the shared recipe; reduced-motion gated.
- [ ] **Step 1: failing test** — renders a card per capability with label + status class + an evidence chip per evidence; artifact chip is a button; empty → the prompt.
- [ ] **Step 2: run → fail.**
- [ ] **Step 3: implement** cards.
- [ ] **Step 4: pass + typecheck 0.**
- [ ] **Step 5: commit** `feat(capability): capability cards (status, evidence chips, growth)`.

## Task 5: CapabilityMap — star-river + comets (SVG)

**Files:**
- Modify: `components/CapabilityMap.tsx`, `components/CapabilityMap.module.css`
- Test: extend `tests/capability-map-render.test.tsx`

**Contract:** Add an SVG **star-river** above the cards: one star per capability, radius/glow scaled by evidence count + status; capabilities with `status==='strong'` (or top-2 by evidence) render as **comets** (reuse `/brand/loom_lunar_comet_icon.svg` + an SVG tail). A subtle moon anchor (existing moon asset) + a faint baseline ("library/horizon"). Each star/comet is a focusable control (`role=button`, aria-label) that, on activate, highlights its card (e.g. sets a `data-active`/scrolls). Pure SVG (no canvas), `prefers-reduced-motion` removes twinkle/streak. Deterministic star layout (no `Math.random` at render — derive positions from index/hash).
- [ ] **Step 1: failing test** — N capabilities → N star nodes; a `strong` capability yields a comet marker (assert the comet class/asset); reduced-motion class present; each node has an aria-label.
- [ ] **Step 2: run → fail.**
- [ ] **Step 3: implement** the SVG star-river + comets + node→card focus.
- [ ] **Step 4: pass + typecheck 0.**
- [ ] **Step 5: commit** `feat(capability): star-river + comets visualization`.

## Task 6: Integration on Digital Me + build/refresh + compounding summary

**Files:**
- Modify: `app/digital-me/BeginnerDigitalMe.tsx`
- Test: extend `tests/beginner-digital-me-render.test.tsx`

**Contract:** Add a **Capabilities** section (eyebrow "CAPABILITIES", heading, `data-reveal`) above the Journey, rendering `<CapabilityMap capabilities={profile.capabilities ?? []} profile={profile} />`. Add a **"Build / refresh capability map"** button: on click, `setBuilding(true)`, `const caps = await buildCapabilities(profile)`, write `{...profile, capabilities: caps}` via `writeBeginnerProfileLocal`, update local state, `setBuilding(false)`; disabled + "Building…" while running. A summary line above the map: `"{caps.length} capabilities · {N strong/partial-with-artifact} backed by proof"`. Preserve all existing Digital Me content + the de-branded Ask.
- [ ] **Step 1: failing test** — with a profile that has `capabilities`, the Digital Me renders the Capabilities section + the map; the build button is present; summary count correct.
- [ ] **Step 2: run → fail.**
- [ ] **Step 3: implement.**
- [ ] **Step 4: pass + typecheck 0.**
- [ ] **Step 5: commit** `feat(digital-me): capability map section + build/refresh + summary`.

## Task 7: Full verification + preview visual tune

- [ ] **Step 1:** `npm run test:contracts` → `# fail 0` (full suite); `npm run typecheck` → exit 0.
- [ ] **Step 2:** controller drives the preview (seed Maya + an artifact), clicks "Build capability map" (heuristic, no key needed), screenshots the star-river + comets + cards; tunes the SVG (star magnitude, comet tail, glow, spacing) live until premium vs `/example`.
- [ ] **Step 3:** confirm owner `/digital-me` + `/example/digital-me` unchanged; reduced-motion check.
- [ ] **Step 4: commit** any visual-tune CSS `style(capability): tune star-river visuals`.
- [ ] **Step 5:** NOTE in handoff: LLM derivation quality needs a keyed run (heuristic verified offline).

---

## Self-review
- **Spec coverage:** §1 data model→T1; §2 derivation (LLM+heuristic+status)→T1/T2/T3; §3 viz (cards + star-river + comets + moon/horizon + reduced-motion)→T4/T5; §4 compounding (status recompute + summary)→T1/T6; §5 integration→T6; §6 verification→every task + T7. Covered.
- **Placeholders:** none — interfaces, evidence-ref scheme (`edu-i`/`exp-i`/`work-i`/artifact id), status rule, and test contracts are concrete.
- **Type consistency:** `BeginnerCapability`/`CapabilityEvidence`/`computeStatus`/`deriveCapabilitiesHeuristic`/`normalizeCapabilities`/`buildCapabilities` names used consistently T1→T6.
