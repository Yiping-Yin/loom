# Loom Mature Web And App Design

Status: proposed design direction
Updated: 2026-05-31

## 1. Decision

Loom will become Yiping's personal knowledge display platform.

The product should present a mature web and app experience for:

- personal profile and About content
- study paths
- source libraries
- portfolio outputs
- process records

The first mature version should keep the existing personal top-level structure:

- About
- UNSW
- Quantnet
- WQU
- Claude

Each section should use the same internal content model:

- Overview
- Path
- Sources
- Process
- Outputs

`Sources` and `Draft` remain the core app primitives. `Sources` is the trusted material layer. `Draft` is the workspace for producing essays, reports, notes, portfolio pages, and public-facing artifacts from those sources.

## 2. Problem

The current Loom repositioning is directionally correct but still too thin for a mature personal platform.

The current visible surface has several gaps:

- the root Private Wiki page is a simple entry page, not yet a full personal platform home
- the Loom web home explains the idea but does not yet show enough personal structure, progress, or output
- the five private sections exist as navigation targets, but they do not yet share a consistent template
- the app surface still needs tighter alignment around `Sources` and `Draft`
- legacy product language can still leak into older routes, docs, or native app surfaces
- current build verification is partially blocked by remote Google Fonts fetch behavior

If this is not resolved, Loom will feel like a renamed product page rather than a mature home for Yiping's learning, materials, work, and process.

## 3. Product Goal

Loom should feel like a private operating surface for one person.

It should answer these questions immediately:

1. Who is this for?
2. What is being learned or built?
3. Which sources support it?
4. What process has happened?
5. What outputs or portfolio artifacts exist?
6. What can be opened next?

The platform should support both modes:

- **web display**: a polished personal website for knowledge, paths, and portfolio presentation
- **app workspace**: a focused tool for collecting sources and producing drafts from them

The first screen must be an actual usable personal platform, not a marketing landing page.

## 4. Scope

### 4.1 Phase 1 Scope

Phase 1 should deliver a coherent mature shell across:

- `/Users/yinyiping/Desktop/Private Wiki/index.html`
- `/Users/yinyiping/Desktop/Private Wiki/LOOM/app/HomeClient.tsx`
- `/Users/yinyiping/Desktop/Private Wiki/LOOM/app/about/AboutClient.tsx`
- `/Users/yinyiping/Desktop/Private Wiki/LOOM/app/help/page.tsx`
- `/Users/yinyiping/Desktop/Private Wiki/LOOM/lib/new-loom/product-shell.ts`
- `/Users/yinyiping/Desktop/Private Wiki/LOOM/macos-app/Loom/Sources/LoomMinimalRootView.swift`
- focused tests and local verification scripts

Phase 1 should add enough structure that the platform reads as mature without requiring a database, authentication, sync service, or complete native rebuild.

### 4.2 Out Of Scope For Phase 1

Phase 1 should not attempt:

- public multi-user SaaS positioning
- account systems
- cloud sync
- payments
- App Store release completion
- live AI provider-output acceptance
- full installed-app importer acceptance
- large legacy route rewrites unrelated to the new personal platform shell

These can be planned later after the personal platform IA is stable.

## 5. Information Architecture

### 5.1 Top-Level Private Wiki

The top-level Private Wiki home should keep the five requested primary entries:

- About
- UNSW
- Quantnet
- WQU
- Claude

It can also show portfolio and process signals, but those should be presented as modules inside the home and section templates rather than adding extra primary navigation items that compete with the five requested entries.

### 5.2 Section Template

Each primary section should eventually have the same internal structure.

**Overview**

The short identity of the section:

- what this area is
- why it matters
- current status
- next useful action

**Path**

The learning or build sequence:

- current module
- completed checkpoints
- next milestone
- dependencies between topics

**Sources**

The trusted material base:

- official pages
- course pages
- PDFs
- local notes
- certificate portals
- files brought into Loom

**Process**

The work trail:

- decisions made
- problem sets attempted
- drafts written
- experiments run
- blockers and corrections

**Outputs**

The portfolio layer:

- essays
- notes
- project pages
- certificates
- code artifacts
- public posts

### 5.3 App Workspace

The app should stay simpler than the website IA.

The primary app vocabulary remains:

- Sources
- Draft

Section context should be visible as metadata, filters, or page context. It should not become five separate competing app workspaces in the first phase.

## 6. Web Experience

### 6.1 Private Wiki Home 2.0

The root page should become a mature personal platform entry.

It should include:

- clear Loom identity and personal positioning in the first viewport
- five section entries with status, purpose, and next action
- a recent progress strip
- a compact portfolio/output area
- a process timeline
- consistent footer links
- responsive mobile behavior without horizontal overflow

The first viewport should signal the product and the person immediately. It should not feel like a generic SaaS homepage.

### 6.2 Loom Web App Home

The Next.js home should become the fuller app-facing version of the same platform.

It should include:

- platform headline
- section dashboard
- Sources and Draft command surfaces
- recent work or process items
- output previews
- clear next actions

The page should use data-driven section content instead of hard-coded one-off cards where practical.

### 6.3 About Page

The About page should explain Yiping's Loom as a personal knowledge platform.

It should show:

- personal positioning
- current learning/building areas
- how sources become drafts
- how process becomes portfolio evidence

It should avoid public SaaS and generic productivity claims.

## 7. App Experience

### 7.1 macOS Minimal Root

The native app shell should keep the mature minimal structure:

- Sources
- Draft

The copy should make clear that Loom serves Yiping's personal learning, portfolio, and process archive.

The app should avoid older public-product labels unless they are still required for compatibility inside legacy surfaces.

### 7.2 Sources

Sources should represent:

- official course materials
- certificate portals
- local PDFs
- notes
- imported files
- references used to build outputs

Sources must remain distinct from generated summaries and drafts.

### 7.3 Draft

Draft should represent:

- synthesized notes
- essays
- reports
- portfolio pages
- public post drafts
- study summaries

Draft output should always be traceable back to sources when possible.

## 8. Content Model

Phase 1 can start with a small local section config.

Each section record should support:

- `id`
- `label`
- `href`
- `summary`
- `status`
- `nextAction`
- `pathSteps`
- `sourceGroups`
- `processItems`
- `outputs`

The static root page can begin with duplicated simple content. The Next.js app should move toward a shared typed config under `lib` once the section shape is stable.

The five initial section records are:

- About: identity, profile, current direction, platform purpose
- UNSW: course pages, official materials, ECON3202, study notes, problem sets
- Quantnet: quant learning path, coding practice, finance math, projects
- WQU: WorldQuant University study track, notes, assignments, certificates
- Claude: Claude learning, certificate artifacts, prompt/process notes, AI workflow

## 9. Visual Direction

The interface should feel personal, mature, and operational.

Use:

- restrained typography
- clear hierarchy
- dense but readable sections
- calm neutral surfaces with selective accent colors
- stable card dimensions
- responsive grids
- visible current progress

Avoid:

- generic marketing hero layouts
- oversized decorative gradients
- one-note purple, beige, dark slate, or brown palettes
- nested cards
- visible instructional text about how to use the UI
- vague claims that do not point to real personal work

## 10. Verification

Phase 1 should verify:

- the root page contains Loom personal platform positioning
- the five requested primary entries remain present
- each section has the template concepts represented
- app-facing copy still centers `Sources` and `Draft`
- old public SaaS language does not appear on the updated surfaces
- mobile has no horizontal overflow
- focused React tests pass
- root page static verifier passes
- browser verification passes through a temporary local static server

The current `npm run typecheck` route may fail before TypeScript due remote Google Fonts fetch errors. The implementation should either remove that remote dependency for local verification or document the remaining external fetch blocker separately from application type errors.

## 11. Risk Controls

### 11.1 Dirty Worktree

The current worktree contains existing changes. Implementation must avoid reverting unrelated user work.

Every edit should be scoped to the Loom personal-platform surfaces and tests.

### 11.2 Legacy Loom Surfaces

Legacy routes and native app files may still contain older product vocabulary.

Phase 1 should update surfaces that the user sees first. It should not perform a broad legacy rewrite without separate acceptance criteria.

### 11.3 Completion Claims

The project should not be called complete merely because focused tests pass.

For Phase 1, completion requires:

- updated root page
- updated Loom web home
- updated relevant About/Help/product-shell copy
- updated app shell copy
- focused tests
- static verifier
- browser verification

Provider-output acceptance and installed-app importer acceptance remain separate gates.

## 12. Acceptance Criteria

Phase 1 is accepted when:

1. `/Users/yinyiping/Desktop/Private Wiki/index.html` reads as a mature Loom personal knowledge platform home.
2. The five primary entries are exactly represented as About, UNSW, Quantnet, WQU, and Claude.
3. The home surface shows the section pattern: Overview, Path, Sources, Process, and Outputs.
4. `/Users/yinyiping/Desktop/Private Wiki/LOOM/app/HomeClient.tsx` presents the same mature personal platform direction.
5. `Sources` and `Draft` remain the app's core operating model.
6. Updated copy avoids public SaaS positioning and App Store-first claims.
7. Focused tests and static verification pass.
8. Browser verification confirms the root page and app-facing surface are readable on desktop and mobile without horizontal overflow.

## 13. Implementation Order

Implementation should proceed in this order after this design is reviewed:

1. Create or update the shared section content shape.
2. Redesign the root Private Wiki home around the five-section platform model.
3. Redesign the Loom web app home using the same section model.
4. Align About, Help, and product-shell copy with the mature platform direction.
5. Align the minimal macOS app shell copy.
6. Add or update focused tests and static verification.
7. Run local static browser verification for desktop and mobile.
8. Run focused test commands and record any remaining external build blocker.

## 14. Future Phases

Later phases can add:

- real per-section pages with full content
- source ingestion per section
- generated process timelines
- portfolio export pages
- local search across sections
- native app section filters
- sync and backup
- deployment to `fanpu.io` or another public/private host

Those phases should wait until the mature personal-platform shell is coherent.
