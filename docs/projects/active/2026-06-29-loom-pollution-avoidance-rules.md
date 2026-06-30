# LOOM Pollution-Avoidance Rules

**Date:** 2026-06-29
**Status:** Active engineering + product rule. Applies to every Reflection change and every test pass.
**Purpose:** "避免污染" — keep three things clean: the user's **original files**, the **working tree / concurrent workstream**, and the **repo**. A change that violates any rule below is rejected regardless of how good the feature looks.

## 1. Original-file integrity (product rule — non-negotiable)

- LOOM **never** modifies, moves, renames, re-encodes, or writes back into a user's original file (PDF, Word, Excel, slide, image, code). The original is read-only material.
- All captures, anchors, meanings, learning passes, and recall state live **only** in LOOM's own on-device store, keyed by a reference to the original. Uninstalling LOOM must leave every original byte-identical.
- Capture-triggered appshots are allowed only as Loom-owned visual evidence.
  They must be stored in Loom's own data area, bounded by retention/cleanup
  rules, and never written into the original file's folder, Desktop, Downloads,
  or unmanaged temporary locations.
- The native surface stays primary. The macOS Service capture only **adds** a route from a selection into LOOM; it must not replace the native app's context menu, Look Up, Translate, Copy, Writing Tools, Services, zoom, selection, page layout, or annotation behavior.
- Sidecar means *beside*, not *instead of*: LOOM must not silently shadow, cache-and-diverge, or re-render the file as a weaker copy that the user might mistake for the source.

## 2. Working-tree & concurrent-workstream hygiene

- A parallel Codex workstream is actively editing the same Reflection files (`macos-app/Loom/Sources/LoomReflectionRootView.swift`, `LoomApp.swift`, `app/reflection/*`). **Do not edit a file Codex is actively changing without coordination.** Prefer isolated or new files; never revert Codex's intentional edits.
- **Never commit concurrent WIP that isn't mine.** Commits stay scoped to my own isolated changes, and only when the owner asks.
- **Build to a scratch DerivedData path**, never the repo and never Codex's DerivedData. A build or test must not dirty the tree or leave generated artifacts under version control.

## 3. Test-artifact hygiene

- Test inputs (sample PDFs / Word / Excel) and experiment outputs live **only** in the session scratchpad, never committed to the repo and never dropped into the user's `Documents`/`Downloads` permanently.
- Computer-use tests run against a **scratch-built** app instance; quit launched instances when done; leave no test files in the repo or the user's real folders.

## 4. Verify-before-claim

- Native integration is "done" only after a **real end-to-end run observed via computer-use on a real file** — never from source code or a screenshot of sample data alone.
- A trace that persists without declaring its anchor precision is a **FAILURE**,
  not a pass. Report the anchor-resolution mix: file/page/cell, app/window/time,
  visual appshot only, or user-confirmed manual anchor.
- Computer-use or Accessibility observing a Preview / Word / Excel window is
  not enough to claim the target file. Multi-window native apps can expose a
  different document than the user's learning file. If that happens, record the
  result as a wrong-window / weak-anchor finding and do not promote it to
  file/page/cell evidence.

## 5. Don't drift (scope pollution)

- Every change must serve the one loop: **native file stays primary → anchored capture → meaning → recall**. A change that adds a surface because it is possible, or revives a second vertical, is scope pollution and is rejected.
