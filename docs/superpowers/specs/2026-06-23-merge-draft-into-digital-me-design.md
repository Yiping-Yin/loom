# Merge the Draft Studio into Digital Me — remove the standalone /draft surface

**Status:** Design / approved (brainstorm 2026-06-23)
**Date:** 2026-06-23
**Owner direction:** "直接把 draft 重合进去,而不是单独一个功能" → the Studio editor should BE part of Digital Me, not a separate page you navigate to. Chosen form: **彻底合并、去掉 /draft**, with `/draft` kept as a **redirect stub** (safe path — owner-confirmed).

This supersedes the slice-1 approach (a Studio section that *links out* to `/draft`). The `BeginnerDocuments` document list is reused, but its links now drive an in-page edit mode rather than a route change.

## Context (from codebase exploration 2026-06-23)

- **`/digital-me` gate:** `app/digital-me/page.tsx` (server) → `DigitalMeGate.tsx` (`'use client'`) → `IdentityEmptyState` (no profile) or `BeginnerDigitalMe` (has profile). `BeginnerDigitalMe` renders `<main className={shell.page}>` with `loom-cosmic-field` + `LandingNav` + stacked sections (incl. the slice-1 `BeginnerDocuments`).
- **`/draft`:** `app/draft/page.tsx` (server, reads `?draftType`) → `DraftClient.tsx` (`'use client'`, ~1900 lines). DraftClient renders its OWN full-screen layout `<main className="new-loom-draft …">` (rail · editor · inspector), **no cosmic field, no nav** (we removed it), with the "← Digital Me" back link. It reads query params from `window.location.search` (`referencesFromLocation`, `?draftType`, `?d`, `?draftRecord`, `?view`).
- **Native app risk is LOW:** the macOS wrapper navigates the SPA via **pushState** (not full-page `loom://` loads); `DraftBridgeHandler`/`NavigationBridgeHandler` are **route-agnostic** — changing routes does not break the bridge. Residual risks: `ContentView` persists the last-visited path (restart could resurrect `/draft`), the static export writes `/draft.html` (old bookmarks/external links), and several alias routes `redirect('/draft')`. **A redirect stub neutralizes all of these** — no Swift changes needed.
- **Latent bug to fix:** `DraftClient` loads `listDrafts()[0]` (the newest draft), NOT the draft named by `?d=<id>`. So slice-1's `?d=<id>` cards only *appeared* to work (the seeded doc was newest). The merge fixes this with real by-id loading.
- **Entry points to `/draft`** (the full migration surface): `LoomGlobalNav` `LOOM_WORKSPACE_NAV` (Draft → /draft); `BeginnerDocuments.tsx` (3 hrefs); `SystemClient.tsx`, `ConnectionsClient.tsx`, `YearClient.tsx`, `HourClient.tsx`, `help/page.tsx`, `DraftsClient.tsx` (empty-state); alias `redirect('/draft')` routes — `atelier`, `coworks`, `palimpsest`, `diagrams`, `letter`, `workbench`, `soan` (`?view=board`); `draft-records.ts` default `draftUrl`. Tests referencing `/draft`: `loom-personal-positioning`, `draft-records`, `beginner-documents-render`, `phase3-cta-alignment`, `canonical-hotpaths`, `draft-library`.

## Goal

Make the Draft editor a **mode of `/digital-me`** driven by an `edit` URL search param, remove `/draft` as a real surface (replace with a redirect stub), and re-point every entry. Editing now happens *inside* Digital Me; there is no separate Draft page.

**Success:** `/digital-me?edit=<id>` shows the editor for that document; `/digital-me?edit=new` starts a fresh document; `/digital-me` (no param) shows the identity view (incl. the Studio doc list, whose cards now set `?edit=<id>`). `/draft?…` redirects to the equivalent `/digital-me?edit=…`. The macOS app, old bookmarks, and alias routes all still land in the editor. By-id loading works. All tests pass (with the deliberately-updated ones noted).

## Architecture

### Mode switch — mutually exclusive render under `/digital-me`

The page renders **either** the editor **or** the identity gate — never nested — so there are no layout conflicts (no double `<main>`, no double cosmic field, no double nav).

- `app/digital-me/DigitalMeGate.tsx` (already `'use client'`) reads the `edit` search param. Mechanism: read it client-side consistent with how DraftClient already reads `window.location.search`. To get it on first client render without a flash, use `useSearchParams()` (wrap the gate usage in a `<Suspense>` boundary in `page.tsx`, the Next 15/16 requirement) **or** an initial `window.location.search` read in `useState`. Decision: **`useSearchParams()` + `Suspense`** (idiomatic, SSR/export-safe).
- When `edit` is present (`<id>` or `new`): render `<DraftClient editId={editParam} />` (full-screen, nav-less — its existing layout). Do NOT render `loom-cosmic-field`, `LandingNav`, or `BeginnerDigitalMe`.
- When `edit` is absent: render the existing gate logic (`IdentityEmptyState` / `BeginnerDigitalMe`) unchanged.

### `DraftClient` changes (minimal)

- Accept an optional `editId?: string` prop (the value of `?edit=`). Today it reads `?draftType`/`?d` from `window.location.search`; keep that for the stub-redirect compatibility path, but when `editId` is provided, it wins.
- **By-id load (bug fix):** in the draft-load effect, if `editId` is a real id, load that draft (`listDrafts(adapter).find(d => d.id === editId)`); if `editId === 'new'` or not found, create/none (current `[0]`/fresh behaviour). This replaces the unconditional `listDrafts()[0]`.
- **Back link:** `"← Digital Me"` href changes from `/digital-me` to a param-clear — navigate to `/digital-me` (no `edit`). A plain `<a href="/digital-me">` is fine (returns to identity view). Keep it.
- Everything else (block editor, references, AI, save, native bridge) is unchanged — the bridge is route-agnostic.

### `/draft` redirect stub

- `app/draft/page.tsx` becomes a tiny `'use client'` redirect: on mount, read `window.location.search`, map `?d=X`→`edit=X` (and `?draftType`, `?draftRecord`, `?view`, plus any `ref…` params passed through), default to `edit=new` when no `d`, and `router.replace('/digital-me?edit=…')`. Render nothing (or a minimal "Opening…"). A client redirect (not server `redirect()`) is required for the static export. `DraftClient` is no longer imported here.

### Entry-point migration

- `LoomGlobalNav` `LOOM_WORKSPACE_NAV`: `Draft → /digital-me?edit=new`.
- `BeginnerDocuments.tsx`: New document + empty CTA → `/digital-me?edit=new`; card → `/digital-me?edit=${doc.id}`.
- `SystemClient`, `ConnectionsClient`, `YearClient`, `HourClient`, `help/page`, `DraftsClient` empty-state: `/draft…` → `/digital-me?edit=new` (DraftsClient keeps `draftType=ai-answer` as `&draftType=ai-answer`).
- Alias `redirect()` routes (`atelier`/`coworks`/`palimpsest`/`diagrams`/`letter`/`workbench`): `redirect('/digital-me?edit=new')`. `soan`: `redirect('/digital-me?edit=new&view=board')`.
- `draft-records.ts`: default `draftUrl` / new-draft links → `/digital-me?edit=new` (keep the published-record `draftRecordDetailHref` `?draftRecord=` path as-is — that's a different, existing flow).

## Data flow

`/digital-me?edit=<id>` → gate reads `edit` → renders `DraftClient editId="<id>"` → DraftClient loads that draft by id → edit/save (unchanged). "← Digital Me" → `/digital-me` (identity view, Studio list reflects the saved doc). Studio card click sets `?edit=<id>`. `/draft?d=<id>` → stub → `router.replace('/digital-me?edit=<id>')`.

## Error handling / edge cases

- **`edit=<id>` not found** (deleted/garbage): fall back to a fresh/empty editor (don't crash); the gate still renders the editor mode.
- **`edit=new`:** fresh document (current new-draft behaviour).
- **No profile but `edit` present:** still render the editor (drafts are independent of the beginner profile). Without `edit`, unchanged gate (empty state).
- **Static export / SSR:** the param is read client-side (`useSearchParams` under `Suspense`); identity view is the SSR/first-paint default, editor mounts on the client when `edit` is set (acceptable — matches the existing client-data pattern).
- **Native restart restoring `/draft`:** the stub redirects seamlessly to `/digital-me?edit=…`.
- **Double redirect:** alias routes point straight at `/digital-me?edit=new` (not through `/draft`) to avoid a redirect hop.

## Testing

- **Mode switch (new, `tests/digital-me-edit-mode.test.tsx`):** `DigitalMeGate` (or a small extracted decision helper) renders the editor when `edit` is present and the identity gate when absent; assert mutual exclusivity (editor mode does NOT render `loom-cosmic-field` / `LandingNav`).
- **By-id load:** a `DraftClient` test (or a pure `selectDraftById(records, editId)` helper, preferred for testability) that returns the matching draft, falls back for `new`/missing.
- **`/draft` stub redirect:** assert `app/draft/page.tsx` maps `?d=X`→`/digital-me?edit=X` and bare → `/digital-me?edit=new` (test the pure mapping function `draftStubTarget(search)`).
- **Update existing tests** (deliberate): `beginner-documents-render` (`/digital-me?edit=`), `loom-personal-positioning` (nav Draft href), `phase3-cta-alignment` + `canonical-hotpaths` (`soan`→`/digital-me?edit=new&view=board`), `draft-records` (default url), `draft-library` (verify still green), and `draft-workspace-composition` (DraftClient still has the back link; `editId` prop wired).
- Full suite + `npm run typecheck` green; preview `/digital-me` (identity), `/digital-me?edit=<id>` (editor loads that doc), Studio card round-trip, `/draft?d=<id>` redirect; rebuild app + smoke (confirms the static export + stub).

## Out of scope (deferred)

- **Documents → evidence/Ask flow** (still the next slice).
- **De-branding the editor's identity rail** (it still shows the owner profile card — a separate cleanup).
- A hard delete of `/draft` (we chose the stub) + any native Swift changes.
- `/drafts` published-records library overhaul (only its one outbound link is re-pointed).
- Multi-draft switcher inside the editor (switching stays in the Studio list).

## Risks

- `DigitalMeGate` gaining `useSearchParams` needs a `Suspense` boundary (Next 15/16) — without it, build/runtime errors. The plan pins this.
- `DraftClient` is large; the change is additive (an `editId` prop + a by-id branch in one effect) — do not refactor it broadly.
- Missing one entry point leaves a dead `/draft` link → it still works via the stub, but audit the migration list; the stub is the safety net, not an excuse to skip entries.
