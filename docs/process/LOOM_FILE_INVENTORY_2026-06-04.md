# Loom File Inventory - 2026-06-04

Scope: `/Users/yinyiping/Desktop/Private Wiki/LOOM`

This inventory separates active source, curated assets, generated output,
archives, worktree snapshots, and temporary clutter.

## Summary

- Git-tracked files: 1,013
- Visible untracked files: 97
- Active source/resource files excluding `.git`, `node_modules`, `.next`,
  `.next-build`, `archive`, `.worktrees`, `tmp`, and `public/pagefind`: 1,269
- Largest top-level directories:
  - `node_modules`: 1.0G, dependency install, generated
  - `archive`: 220M, local screenshots and backup material
  - `.next`: 78M, generated dev/build cache
  - `.git`: 44M, repository metadata
  - `public`: 31M, served public assets
  - `resources`: 13M, source/reference assets

## Active Project Shape

Current active files by top-level area, excluding generated and archive folders:

- `macos-app`: 249 files
- `app`: 192 files
- `lib`: 169 files
- `components`: 121 files
- `public`: 114 files
- `resources`: 105 files
- `tests`: 96 files
- `docs`: 92 files
- `scripts`: 49 files
- `.app-store`: 23 files
- `plans`: 12 files

Main active file types:

- TypeScript: 293 `.ts`
- React: 240 `.tsx`
- Markdown: 182 `.md`
- Swift: 142 `.swift`
- JSON: 86 `.json`
- Images: 66 `.png`, 50 `.jpg`, 22 `.svg`
- MDX: 48 `.mdx`
- Scripts: 36 `.mjs`, 4 `.sh`, 4 `.py`

## Loom History Assets

The current history assets are now correctly separated into public copies and
source copies:

- Public route assets: `public/loom/history/`
- Source/reference copies: `resources/loom-history/`

Current curated sets:

- `early-version`: 9 uploaded early Loom screenshots
- `evolution`: 6 representative iteration checkpoints

This is the correct model: `public` serves the app, while `resources` preserves
the source/reference material.

## Archive Situation

`archive` is large but mostly understandable:

- `archive/screenshots`: 169M, 134 screenshots
- `archive/backups`: 50M, old untracked backup and archived worktree snapshots
- `archive/snapshots`: small repository snapshots

Screenshot concentration:

- `verification-20260604`: 38 files, 48M
- `verified-dossier-20260603`: 33 files, 41M
- `home-redesign-20260603`: 10 files, 23M

The issue is not that archive exists. The previous issue was that
`archive/backups` contained old dependency/build material such as nested
`node_modules` and `.next-build` files. Those generated subdirectories have now
been removed from the preserved backup.

## Generated And Ignored Material

These are generated or ignored and should not be treated as product source:

- `node_modules/`
- `.next/`
- `.next-build/`
- `public/pagefind/`
- `tmp/`
- `tsconfig*.tsbuildinfo`
- `.DS_Store`

The repository already ignores these categories.

## Cleanup Performed

Tier 1 cleanup removed ignored temporary or Finder duplicate files from the
active project and generated dependency layer:

- `app/product-history/page 2.tsx`
- `lib/new-loom/personal-platform 2.ts`
- `public/brand/loom_app_icon 2.svg`
- `public/icon 2.svg`
- `public/icon-mono 2.svg`
- `.loom-typecheck.tsconfig 3.json`
- `tsconfig 3.tsbuildinfo`
- `tsconfig 4.tsbuildinfo`
- `tsconfig 5.tsbuildinfo`
- `tsconfig.tsbuildinfo`
- `tmp/`
- duplicate `public/pagefind/* 2.*` and `public/pagefind/* 3.*` generated files
- duplicate top-level `node_modules/* 2.*` and `node_modules/* 3.*` generated
  dependency entries
- `.DS_Store` files outside preserved backup snapshots

After pruning `.git`, `node_modules`, `.next`, `.next-build`,
`archive/backups`, and `.worktrees`, no active duplicate `* 2.*`,
`* 3.*`, temporary build-info, or `.DS_Store` files remain.

Tier 2 cleanup then isolated old snapshot material:

- moved root `.worktrees` into `archive/backups/worktrees-20260604/`
- kept `archive/backups/untracked-20260601-1018/` as a source snapshot
- removed generated subdirectories from that snapshot:
  - `node_modules`
  - `.next`
  - `.next-build`
  - `.next-export`
  - `.next-export-shelf`
- removed generated `public/pagefind` folders inside backup snapshots
- removed `.DS_Store` and `tsconfig.tsbuildinfo` files inside backup snapshots

Tier 3 cleanup removed generated output from the active project root:

- `.next-build/`
- `public/pagefind/`

`.next/` remains because the local development server may be using it. It is
still generated output, not product source.

## Clutter Remaining In Preserved Snapshots

The scan may still find duplicate source-like files inside preserved snapshot
layers:

- `archive/backups/worktrees-20260604/branch-collect`
- `archive/backups/worktrees-20260604/collect-capture-bug`
- `archive/backups/untracked-20260601-1018`

These were not deleted because they are historical source snapshots. They are
not current product source and should be excluded from normal product scans.

## Cleanup Priority

1. Keep `public/loom/history` and `resources/loom-history`; they are now useful
   curated history assets.
2. Treat `.next`, `.next-build`, `node_modules`, and `public/pagefind` as
   regenerable build output. `.next-build` and `public/pagefind` are currently
   removed from the active checkout.
3. Decide later whether `archive/backups/untracked-20260601-1018` should be
   deleted entirely or kept as a historical source snapshot. It no longer
   contains the old dependency/build subdirectories.
4. Decide later whether `archive/backups/worktrees-20260604/branch-collect`
   and `archive/backups/worktrees-20260604/collect-capture-bug` are still useful.
   They are ignored local snapshots, not current product source.
5. Keep `archive/screenshots` only as a dated verification archive. For product
   pages, promote only selected representative assets into
   `resources/loom-history` and `public/loom/history`.
