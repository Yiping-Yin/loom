# LOOM Capability Graph + Compounding Structure — design

**Date:** 2026-06-21
**Status:** approved (brainstorm) → ready for implementation plan
**Branch:** `loom-beginner-profile`

## Goal
Upgrade the beginner Digital Me from a flat profile (about / education / experience / works / artifacts) into a **living, compounding, evidence-backed capability map** — auto-generated from the user's own data, faithfully generalizing the owner's Role-OS (claims ← evidence, with status + growth). This delivers the original goal's *复利作品集* (compounding portfolio) + *可视化的能力流程展示* (visualized capability/process display) for any user, and builds directly on the moat (M1 extraction + M2 artifacts).

This is a structural upgrade, not polish: a new data model + derivation + a brand-native visualization.

## 1 · Data model (`lib/capability/capability-graph.ts`)
```
type CapabilityStatus = 'strong' | 'partial' | 'direction';
type CapabilityEvidence = {
  kind: 'education' | 'experience' | 'work' | 'artifact';
  refId: string;     // index/id into the profile section or ArtifactRef.id
  label: string;     // human label for the chip
};
type BeginnerCapability = {
  id: string;
  label: string;             // the capability, e.g. "Data analysis"
  status: CapabilityStatus;  // the compounding signal (see §2)
  evidence: CapabilityEvidence[];
  note?: string;             // one-line rationale
  growth?: string;           // "add X to strengthen this"
};
```
Cached on the profile as `capabilities?: BeginnerCapability[]` (derived, not hand-typed). Faithful to the owner's `DigitalMeClaimNode` (`label` + `evidenceStatus` + `evidenceIds`). `normalizeBeginnerProfile` sanitizes/caps it (cap count ~12, label/note/growth lengths, drop entries with no label).

## 2 · Derivation (`lib/capability/derive-capabilities.ts` + `app/api/derive-capabilities/route.ts`)
Input: the profile's experience bullets, works (title+description), education, and artifact `extractedText`.
- **Web / keyed →** LLM (Sonnet, same JSON-parse discipline as `/api/extract-profile`): derive 4–8 capabilities, map each to its supporting evidence refs, and suggest a growth action. Strict JSON, normalized server-side, no invented evidence (only refs that exist in the profile).
- **Offline / no key (static app) →** a deterministic **heuristic fallback**: extract candidate capabilities from explicit skills/keywords in bullets/works + map evidence by token overlap. Cruder but always works.
- **Status = the compounding signal:** `strong` = ≥2 evidence incl. ≥1 artifact · `partial` = ≥1 evidence · `direction` = asserted/thin. Recomputed whenever the profile/artifacts change → the map strengthens as the user adds proof.
- **Trigger + cache:** an explicit "Build / refresh capability map" action runs derivation and caches `capabilities` on the profile (localStorage); the route is shelved in the static app, so there it uses the heuristic. Never auto-derive on every load (the LLM call is intentional).

## 3 · Visualization (`components/CapabilityMap.tsx`) — the capability 星河
Brand-native, reusing the existing cosmology (History scenes + `loom_lunar_comet_icon` / `lunar-comet-ledger` assets + the cosmic field):
- **Star-river (银河):** an SVG cosmic band; each capability is a **star** whose magnitude (size + glow) = evidence strength. As proof compounds, the star brightens — the river brightens as the user backs themselves up. Positioned as a flowing band (the *流程* sense).
- **Comets (彗星) = standout / "vertical" capabilities:** a capability at `strong` (or top-by-evidence) renders as a **comet** (reuse `loom_lunar_comet_icon` + a drawn tail) streaking through the river — the eye goes to what's most proven.
- **Moon (Memory)** anchors the scene as the identity center; the **Library / Earth-horizon** reads as the grounding line. Narrative: *identity (moon) → capabilities (star-river) → standout (comets) → grounded in library/proof.*
- **Capability cards** below: each capability = a card with a status ring, **evidence chips** that link to the backing entry/artifact (artifacts get "Open →" via the M2 store), and the **growth nudge**. Clicking a star/comet highlights its card.
- Cyan-only, restraint ported from `EvidenceSignal` (active = luminance/hairline, never a color fill), **`prefers-reduced-motion` gated** (no streaking/twinkle when reduced).

## 4 · Compounding
A summary line ("6 capabilities · 4 backed by proof"); statuses + star magnitudes recompute as entries/artifacts are added; growth nudges drive the add-more loop (ties to M3). This is the "复利" made visible.

## 5 · Integration
- New **Capabilities** section on the beginner Digital Me (`app/digital-me/BeginnerDigitalMe.tsx`), placed as the centerpiece above the Journey, with the "Build / refresh capability map" action.
- The owner Digital Me (`DigitalMeRoleOSClient`) is **untouched** (it has its real hand-authored Role-OS).
- The map **reuses evidence already in the ask corpus** (edu/exp/works/artifacts), so answers stay grounded; *capability-as-its-own-citation* is a deliberate later extension.

## 6 · Verification
- Unit-testable (no LLM/IndexedDB needed): the heuristic derivation, `status` computation from evidence, normalization caps, and the card + constellation render (with a given capability array). Match `node:test` style; register in `test:contracts`. Keep `npm run typecheck` green.
- The LLM derivation **quality** (faithful capabilities, correct evidence mapping) needs a keyed manual run — out of scope for unit tests.

## Scope / YAGNI (explicitly deferred for v1)
Capability editing/reordering by hand · capabilities on the shareable postcard · capability-as-its-own-citation in answers · the heuristic competing with the LLM (LLM wins when keyed). The owner Role-OS is the reference, not a shared component (the beginner map is its own, simpler module).

## Disposition / dependencies
Builds on: `lib/profile/beginner-profile.ts` (schema), `lib/artifact/artifact-store.ts` (artifact evidence + Open→), `lib/new-loom/beginner-ask-corpus.ts` (evidence already grounded), `app/api/extract-profile/route.ts` (the LLM/JSON-parse pattern to mirror), the owner `lib/new-loom/digital-me-role-os.ts` (the model to generalize).
