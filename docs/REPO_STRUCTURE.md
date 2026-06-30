# Loom Repo Structure

**Status:** Active organization standard

This file defines where Loom work belongs. It exists because the repo contains
several product generations: the original Sources / Studio / Digital Me stack,
the newer Reflection workspace, native macOS shell work, local archives, and
generated build outputs.

## Current Product Entry

Start current Loom work from:

1. `docs/projects/active/2026-06-28-loom-reflection-workspace-prd.md`
2. `docs/projects/active/2026-06-27-loom-reflection-workspace-layout-contract.md`
3. `docs/projects/active/README.md`

The current direction is sidecar-first: original files stay primary, and Loom
records anchored learning or reflection traces around them.

## Top-Level Folders

| Path | Role | Rule |
|---|---|---|
| `app/` | Next.js routes and route-level clients | Keep only user-visible routes or compatibility redirects here. New product experiments need an active PRD. |
| `components/` | Shared React components | Components must be reusable across routes or clearly owned by a product area. Route-only components should stay near their route. |
| `lib/` | Shared product, runtime, AI, capture, sync, and data logic | Business logic belongs here, not inside route files. Avoid adding new top-level namespaces unless there is an owner doc. |
| `macos-app/` | Native Loom macOS app | Native shell and platform integration live here. Preserve AppKit/PDFKit/QuickLook behavior instead of cloning macOS features in web code. |
| `tests/` | Contract, unit, and render tests | Product structure changes need tests here before large moves. |
| `docs/` | Product, design, process, project, and history records | Current standards go in `docs/projects/active/`; durable canon goes in `docs/canon/`; old direction goes in `docs/history/` or `docs/projects/archive/`. |
| `scripts/` | Build, verify, archive, and migration scripts | Scripts should be idempotent and named by job. |
| `knowledge/` | Local knowledge ingestion source and generated cache boundary | Generated cache stays ignored under `knowledge/.cache/`. |
| `public/` | Static assets used by the app | Generated search, RAG, pagefind, and knowledge exports stay ignored. |
| `archive/` | Local archived outputs and historical snapshots | Keep large screenshots/build snapshots out of active docs. |
| `captures/` | Local screenshots and reference captures | Use for QA evidence. Do not put screenshots in the repo root. |
| `resources/` | Local design resources and non-runtime references | Keep private design resources ignored. |

## Root Directory Rule

The repo root should stay boring. It should contain package/config files,
license/security/contribution files, and the project README only.

Allowed root files:

- `README.md`
- `package.json` and lockfiles
- framework config files
- license/security/contribution files
- `.env.example`

Do not add to the root:

- screenshots
- build outputs
- one-off plans
- duplicated docs
- Finder duplicate files such as `* 2` or `* 3`

Private local copies of root Loom docs belong in ignored
`docs/local-private/`. The tracked canonical documents live under
`docs/canon/`.

## Generated And Local-Only Folders

These are not product structure and should not be used as source locations:

- `.next/`
- `.next-app-dev/`
- `.next-build/`
- `.next-export/`
- `.next-export-shelf/`
- `node_modules/`
- `tsconfig*.tsbuildinfo`
- `.playwright-cli/`
- `.superpowers/`
- `captures/`
- ignored `archive/` subfolders
- `docs/local-private/`

If a generated folder grows large, delete only the generated folder. Do not run
`git clean -X` in this repo because `.env.local` and private local references
are intentionally ignored too.

Use `npm run clean:workspace:dry` to preview generated clutter and
`npm run clean:workspace` to remove the safe generated set. The cleaner does
not remove `.next/` or the active `.next-app-dev/` dev cache by default.

## Current Implementation Map

| Product concern | Primary files |
|---|---|
| Sidecar Reflection PRD | `docs/projects/active/2026-06-28-loom-reflection-workspace-prd.md` |
| Native layout contract | `docs/projects/active/2026-06-27-loom-reflection-workspace-layout-contract.md` |
| Web Reflection prototype | `app/reflection/` |
| Native Reflection shell | `macos-app/Loom/Sources/LoomReflectionRootView.swift` |
| Native file reader | `macos-app/Loom/Sources/SourceFileView.swift` |
| Product shell routing | `lib/new-loom/product-shell.ts` |
| Product contracts | `tests/new-loom-skeleton-contract.test.ts` |

## Move Policy

Before moving code:

1. Check whether a contract test reads the path directly.
2. Update the active PRD or layout contract if the move changes product
   ownership.
3. Move the smallest set of files.
4. Run the focused contract test.

Do not use directory moves to hide unresolved product conflict. If two product
models disagree, write the boundary first, then move code.
