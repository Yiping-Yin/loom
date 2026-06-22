# LOOM Studio — Phase 1: Draft becomes a block document

**Status:** Design / for review
**Date:** 2026-06-22
**Owner direction:** Fuse "writing work" and "development work" into one workbench ("工作台"). Chosen unit of fusion: a **block canvas** (text / code / artifact / source-cite are all first-class blocks). Phasing approved. This spec is **Phase 1 only**.

---

## Goal

Evolve the existing `/draft` "Evidence Desk" from a single-`<textarea>` writing surface into a **block document**: an ordered list of typed blocks the author creates and reorders. Phase 1 ships three block types — **text**, **code** (highlighted, not executed), and **source-cite** — while preserving everything Draft already does (source grounding, references, provenance, AI compose/inline-edit, output types, save-as-evidence). No code execution, no embedded live artifacts, no Digital Me re-housing — those are later phases.

**Success:** an author can build a draft as a sequence of text + code + cite blocks, reorder/add/delete them, and the draft still saves, grounds in sources, shows provenance, and round-trips losslessly. All existing draft features keep working; all contract tests pass (with the deliberately-updated ones noted below).

---

## Why this scope (the constraint that shapes everything)

Today the draft is `NewLoomDraftRecord.body: string` (markdown). A large machinery operates on that string + char offsets: `draftBlocksFromBody()` (read-only derivation), reference @-mention insertion, `draftProvenanceMatches()`, AI compose/inline-edit prompts, and the AI-Answer "publish preview" extractor (`lib/new-loom/draft-storage.ts`). Rewriting all of that to be block-native would be a large, risky change.

**Decision:** authored **blocks become the canonical edit model**, and **`body` stays as a derived markdown serialization kept in sync**. The block editor reads/writes `blocks[]`; on every change we serialize `blocks → body` so the existing body-based machinery (references, provenance, AI, answer-preview, persistence, native bridge) keeps working unchanged. This is the smallest seam that delivers a real authored block document.

---

## Architecture

### Block model (`lib/new-loom/draft-storage.ts`)

Extend the existing read-only `NewLoomDraftBlock` into an **authored** model. Phase-1 kinds:

```ts
export type NewLoomDraftBlockKind = 'text' | 'code' | 'cite';
// (the legacy derived kinds heading/paragraph/quote/list collapse into 'text';
//  see migration. 'code' gains a language; 'cite' is new.)

export type NewLoomDraftDocBlock =
  | { id: string; kind: 'text'; text: string }                          // markdown-ish prose (one or more paragraphs/headings/lists)
  | { id: string; kind: 'code'; text: string; lang?: string }           // a fenced code block, highlighted, NOT run
  | { id: string; kind: 'cite'; href: string; label: string; excerpt?: string }; // a source citation, resolved from references
```

- IDs are stable (`crypto.randomUUID()` client-side / a deterministic counter fallback for SSR/tests).
- `cite` blocks reference an entry in `draft.references` by `href` (the existing `NewLoomDraftReference`), so citations stay grounded in the real source corpus.

### Source of truth + serialization

- **Canonical:** `NewLoomDraftRecord.blocks: NewLoomDraftDocBlock[]` (new field).
- **Derived/synced:** `NewLoomDraftRecord.body: string` — produced by `blocksToBody(blocks)` and kept in sync on every edit.
  - `text` → the text as-is.
  - `code` → a fenced block: ` ```lang\n…\n``` `.
  - `cite` → a markdown quote + the existing @-token/citation form so `draftProvenanceMatches()` + reference logic still see it.
- **Migration (back-compat):** `bodyToBlocks(body, references)` reuses the existing `draftBlocksFromBody()` parser, mapping legacy kinds → `text`/`code` (+ deriving `cite` blocks from reference @-tokens). A record loaded with `body` but no `blocks` is migrated on load; round-trip `blocks → body → blocks` must be idempotent.

### Persistence (`lib/new-loom/draft-storage.ts`)

- Add `blocks` to `NewLoomDraftRecord`, `createDraft()`, and `updateDraft()` (storage key `loom.new.drafts.v1` unchanged; native bridge unchanged — it still persists `body`, which we keep synced).
- `updateDraft(adapter, id, patch)` accepts `{ blocks }`; when present, recompute `body = blocksToBody(blocks)` before persist so old + native readers still work.
- Autosave (the existing 400ms debounce + "Saved" indicator in `DraftClient.tsx`) now triggers on block edits.

---

## Components (`app/draft/DraftClient.tsx`)

Keep the contract-locked **3-column shell** (identity rail · main · inspector), the document header (title, proof-strip, output-type selector), the inspector (Sources/Edit/Board), references, provenance, AI, save. **Only the center editor changes** from a single textarea to a block editor.

- **`DraftBlockEditor`** (new component) replaces the `.new-loom-draft__body` textarea region:
  - Renders `blocks[]` in order. Each block is an editable row with a left "kind" affordance + a hover/focus toolbar (move up / move down / delete / change type).
  - **Add-block control** between/after blocks: text · code · cite (a `+` menu).
  - **text block:** an auto-growing `<textarea>`/contenteditable line(s) (markdown-ish; keeps Draft's serif reading measure from the document refinement). Enter at the end of a text block can split into a new text block (P1: a simple add-block is enough; smart splitting optional).
  - **code block:** a monospace `<textarea>` + a language tag. Phase-1 decision: render **plain monospace** (no syntax highlighting) to avoid any dependency question; adopt highlighting only if a highlighter already exists in the dependency tree, otherwise it is deferred. No new highlighting dependency in Phase 1.
  - **cite block:** rendered from a chosen reference (reuses the `@`-reference picker — selecting a source inserts a `cite` block instead of an inline token). Shows label + excerpt, links to the source.
  - Reorder in P1 = up/down buttons (keyboard-accessible). Drag-and-drop is deferred (polish).
- **Reuse, don't rebuild:**
  - **Reference picker / @-mention:** the existing picker now offers "insert as citation block" (cite) in addition to inline mention; `insertDraftReferenceCandidateIntoDraft` stays for inline mentions inside text blocks.
  - **Output-type starters:** the 5 output types' `starterBody` templates seed an initial `blocks[]` (parse the starter markdown via `bodyToBlocks`).
  - **AI compose / inline-edit / answer-preview:** unchanged — they operate on the synced `body`. (Per-block AI is a later phase.)
  - **Provenance + source tiles:** unchanged — recomputed from the synced `body`.

---

## Data flow

edit a block → update `blocks[]` (React state) → `blocksToBody(blocks)` → set `body` → debounced `updateDraft({ blocks })` (persists blocks + synced body) → references/provenance/proof-strip recompute from `body` exactly as today.

---

## Error handling / edge cases

- **Legacy record (body, no blocks):** migrate via `bodyToBlocks` on load; never lose content. If migration somehow yields empty, fall back to a single `text` block holding the raw body.
- **Empty document:** render one empty `text` block with the output-type placeholder.
- **code block, no language:** allowed; render plain mono, no highlight.
- **cite block, missing/removed reference:** render a quiet "source removed" state; never crash; it still serializes to a plain quote in `body`.
- **Round-trip safety:** `blocks → body → blocks` idempotency is a tested invariant; if a future block kind can't serialize losslessly, it must degrade to `text` in `body`.

---

## Testing

- **`tests/draft-blocks.test.ts` (new):** `blocksToBody`/`bodyToBlocks` round-trip idempotency; legacy `body`-only migration; cite-block serialization keeps provenance matchable; each kind serializes/parses.
- **Persistence:** `createDraft`/`updateDraft` persist + restore `blocks`; native/body-only readers still get a valid `body`.
- **Render:** `DraftBlockEditor` renders text/code/cite; add/reorder/delete update `blocks[]`.
- **Contract updates (deliberate):** `tests/draft-workspace-composition.test.ts` — the center editor is no longer a single `.new-loom-draft__body` textarea; update its assertion to the block editor while KEEPING the locked 3-col grid (`minmax(14rem,17rem) minmax(0,1fr) minmax(21rem,27rem)`), identity rail, inspector, proof-strip copy ("Answer grounded by", "Provenance"), and nav. `draft-reference-insertion.test.ts` + `draft-answer-preview.test.ts` must stay green (they operate on `body`, which we keep synced) — verify, don't rewrite.
- Full suite stays green (`npm run test:contracts`) + `npm run typecheck`; preview /draft with a seeded draft (block editing, reorder, cite, save round-trip).

---

## Out of scope (later phases — do NOT build now)

- **Phase 2:** `artifact` block — embed a live running thing (QBook `/optibook` iframe first, then any artifact) inside the document.
- **Phase 3:** live code execution (sandbox, e.g. JS / Pyodide) so `code` blocks run with captured output.
- **Phase 4:** house the Studio as a first-class app under Digital Me (Role-OS); documents flow to evidence/Ask; rename/IA.
- Drag-and-drop block reordering (P1 = up/down buttons), per-block AI, collaborative/multi-doc.

---

## Risks

- The body-based machinery is large; the serialization seam (`blocksToBody`/`bodyToBlocks`) is the load-bearing piece — its round-trip fidelity is the main correctness risk (covered by tests).
- The `.new-loom-draft__body` contract test + the workspace-composition contract intentionally change; keep every OTHER locked property (grid, rail, inspector, copy) intact so the change is surgical.
- Code-highlighting: only adopt a highlighter already in the dependency tree (or render plain mono) — no heavy new dependency in Phase 1.
