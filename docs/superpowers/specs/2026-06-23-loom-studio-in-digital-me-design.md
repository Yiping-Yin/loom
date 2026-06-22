# LOOM Studio — Phase 3 (slice 1): house the Studio in Digital Me

**Status:** Design / approved (brainstorm 2026-06-23)
**Date:** 2026-06-23
**Owner direction:** "draft 这个功能应该在 Digital Me … QBook 有一个类似 VSCode 的，Draft 也应该有一个对应的." Phase 3 = give the Studio a home inside Digital Me. This slice is **placement + home only**; wiring documents into evidence/Ask is the **next** slice.

## Context (from codebase exploration 2026-06-23)

- **Digital Me is monolithic per user-type.** `/digital-me` → `DigitalMeGate` renders one view: beginners (a localStorage profile) get `app/digital-me/BeginnerDigitalMe.tsx` — a stacked, scroll-reveal page (identity header → capability star-river → journey → proof upload → Ask widget). The owner showcase (`/example/digital-me` → `DigitalMeRoleOSClient`) is a separate demo. **We target the live `BeginnerDigitalMe`.**
- **The Studio (`/draft`) is a full route but stranded.** `app/draft/DraftClient.tsx` edits one working draft at a time; working drafts live in `localStorage` under `loom.new.drafts.v1`, read via `listDrafts()` (`lib/new-loom/draft-storage.ts`). The global nav's Workspace menu still links to `/draft` *from other pages*, but the page itself now has **no nav** (we removed `LoomGlobalNav` in PR #75) — no way back, no way to switch documents. There is no in-editor draft picker. A separate `/drafts` route lists *published answer records* (a different concept — out of scope here).
- **QBook is the "app under Digital Me" template** (a staged showcase + launch), but it's owner-only and a static SPA; we are **not** mirroring its staged-device aesthetic — a working tool wants a working surface, not a demo device.
- **Reusable patterns in `BeginnerDigitalMe`:** scroll-reveal (`data-reveal` + `IntersectionObserver`, CSS fail-safe, `prefers-reduced-motion` guard), glass cards (`--role-glass*`), status badges (`--evidence-*`), `draftWordCount(body)`, `draftSourceTilesFromReferences(references)`, SSR-safe read-after-mount (drafts are `localStorage`).

## Goal

Surface the block-document Studio as a first-class **"Studio"** section inside the live `/digital-me`, and give the `/draft` editor a quiet **"← Digital Me"** home link — so the Studio is reachable, at-home, and switchable, without restoring the full nav.

**Success:** From `/digital-me`, a user sees a **Studio** section listing their working documents (open one → the editor) and a **New document** action; from inside the editor, one click returns to Digital Me. No document-data-flow, no `/drafts` changes, no owner showcase.

## Architecture

### Component: `BeginnerDocuments` (new)

- **Files:** `app/digital-me/BeginnerDocuments.tsx` (+ `app/digital-me/BeginnerDocuments.module.css`).
- **Responsibility:** render the user's working documents as a Digital Me section. One clear job: list documents + entry actions. No editing, no persistence writes.
- **Props:** `{ documents: StudioDocumentSummary[] }` — a pure, presentational component (the parent owns the data read so the component stays SSR-test-friendly).
- **`StudioDocumentSummary`** (a small view-model, derived in the parent):
  `{ id: string; title: string; sourceCount: number; wordCount: number; updatedAt: string }`.
- **Markup:**
  - `<section className="beginner-documents" data-reveal aria-labelledby="beginner-documents-title">` with a header: `<h2 id="beginner-documents-title">Studio</h2>` + a one-line guidance subhead + a **"New document"** action (`<a href="/draft">`).
  - **Populated:** a list of document cards, each `<a href={`/draft?d=${id}`} className="beginner-documents__card">` showing title, a meta row ("Grounded by N source(s)" · "N words" · relative updated-time), reusing the glass-card + status chrome.
  - **Empty (no documents):** a single guidance card — "Turn your work into a grounded document." + **"Start a document"** CTA (`<a href="/draft">`). (Per the clean-copy memory: empty-state guidance is a keeper; populated cards stay terse.)
- **Accessibility:** the section is keyboard-navigable (cards are links); reduced-motion respected via the shared reveal CSS.

### Wiring into `BeginnerDigitalMe`

- In `app/digital-me/BeginnerDigitalMe.tsx`, after mount (the existing localStorage-read effect pattern), read `listDrafts(browserDraftStorage)` and map each `NewLoomDraftRecord` → `StudioDocumentSummary` via `{ id, title: title || 'Untitled document', sourceCount: references.length, wordCount: draftWordCount(body), updatedAt }`. Sort by `updatedAt` desc; cap the rendered list at a small N (e.g. 6) with the rest reachable by opening the Studio (no silent over-truncation — if capped, the "New document"/header still leads in).
- Place `<BeginnerDocuments documents={studioDocuments} />` in the work/evidence cluster: **after the Proof section, before the Ask widget.**
- Progressive disclosure: the section **always renders** (even empty) — it's an entry point, not gated content; the empty state is the nudge. (Do not fold it into the `strongCount`/proof gating.)

### Editor home link in `DraftClient`

- In `app/draft/DraftClient.tsx`, add a single quiet back affordance at the top-left of the workbench (inside `<main className="new-loom-draft …">`, before/above the identity rail or as the first child of the main column): `<a className="new-loom-draft__home" href="/digital-me">← Digital Me</a>`.
- Style it in `app/draft/draft-evidence-desk.module.css` (`.surface :global(.new-loom-draft__home)`) as a muted text link (mono/eyebrow tracking, `--text-3`, hover → `--text-1`); `:focus-visible` ring; it must not reintroduce nav-pill chrome.
- No in-editor draft switcher (switching is the Studio section's job).

## Data flow

`/digital-me` mount → `listDrafts()` → map to `StudioDocumentSummary[]` → `<BeginnerDocuments>` renders cards → click `/draft?d=<id>` (DraftClient already loads a draft by `?d=` — verified in preview) → edit → "← Digital Me" returns. New document → `/draft` (fresh). No new storage, no new persistence.

## Error handling / edge cases

- **No drafts / storage unavailable:** render the empty-state CTA (never crash; `listDrafts` returns `[]` on a missing/garbage key).
- **Untitled draft:** show "Untitled document".
- **A draft with zero sources:** "Grounded by 0 sources" (honest; it's a nudge to add sources).
- **SSR / first paint:** documents are read after mount (localStorage), like the rest of `BeginnerDigitalMe`; the section renders its header immediately and fills cards on hydration (no SSR/runtime mismatch).
- **Large lists:** cap rendered cards (N≈6), newest first; the cap is a display choice, not data loss (all drafts remain in storage and openable).

## Testing

- **`tests/beginner-documents-render.tsx` (new):** `BeginnerDocuments` renders (1) populated — cards with title, "Grounded by", a word count, and `href="/draft?d=<id>"`; (2) empty — the "Start a document" CTA with `href="/draft"`. Uses the established CSS-module-proxy + `renderToStaticMarkup` pattern (see `tests/digital-postcard-render.tsx`).
- **`tests/draft-workspace-composition.test.ts` (extend):** `/draft` includes the `new-loom-draft__home` back link to `/digital-me`; still `doesNotMatch(/LoomGlobalNav/)`.
- **Beginner Digital Me render test (extend the existing one):** `BeginnerDigitalMe` mounts the `beginner-documents` section.
- Full suite (`npm run test:contracts`) + `npm run typecheck` green; preview `/digital-me` (Studio section, populated + empty) and `/draft` (back link works), screenshot; rebuild the app.

## Out of scope (explicitly deferred)

- **Documents → evidence / Ask flow** (the next Phase-3 slice): published documents becoming citable corpus sources / capability evidence.
- Changes to the existing `/drafts` published-records library.
- Owner Role-OS Studio showcase (`/example/digital-me`).
- Internal Digital-Me tabs/scenes; in-editor draft switcher; server persistence / sharing.
- Live artifact embed (that's Phase 2).

## Risks

- `BeginnerDigitalMe.tsx` is already large (~1582 lines); keep the new logic in `BeginnerDocuments` and add only the small read+map+placement in the parent. Don't restructure the file.
- The naming overlaps with `/drafts` (published records) — the section is titled **"Studio"** and lists *working documents* to keep the distinction clear; do not merge with `/drafts` in this slice.
