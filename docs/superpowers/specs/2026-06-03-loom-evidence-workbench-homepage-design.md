# Loom Evidence Workbench Homepage Design

Status: approved design direction, pending implementation plan
Updated: 2026-06-03
Approved direction: A / Evidence workbench
Visual companion: `http://localhost:60458`

## 1. Decision

The next Loom homepage upgrade should move beyond replacing text marks with picture assets.

The approved direction is **Evidence workbench**: the first viewport should prove Loom's product value by showing how real source material becomes Draft output and cited answers.

The homepage should no longer read as a source-card gallery. It should read as a working surface:

- identity and verified memberships establish whose Loom this is
- an active evidence story shows real local source material
- a source graph makes relationships visible
- a provenance chain shows `Sources -> Draft -> Answer`
- an answer inspector shows the cited output and the artifacts behind it

The existing real assets remain important, but they become evidence nodes inside the workflow instead of decorative proof that brands exist.

## 2. Product Goal

The homepage should answer four questions immediately:

1. Who is this Loom for?
2. What real source material is inside it?
3. How does Loom turn source material into work?
4. Can the output be inspected back to source artifacts?

The primary user impression should be:

> This is a real personal knowledge workspace. The files, institutions, drafts, and answers are inspectable.

This is more important than adding more logos, more screenshots, or more explanatory copy.

## 3. Current V5 Assessment

The current v5 homepage is a strong improvement:

- the UNSW mark is real
- QuantNet, WQU, Claude, and About have real image-backed assets
- the first viewport visibly changed from a draft layout
- the `Source Dossier` board is clearer and less text-heavy
- `Source index` is more restrained than the earlier repeated knowledge cards

Remaining gap:

- the top source board still behaves mostly like a directory
- the right answer panel is still text-first
- the homepage does not yet make the source-to-output relationship visually inevitable
- the real assets do not yet form a narrative chain
- the page still needs a sharper product moment than "here are my sources"

The next upgrade should preserve what works, but reorganize the homepage around an active evidence story.

## 4. Non-Goals

This design does not require:

- a multi-user SaaS landing page
- account, sync, billing, or cloud features
- claiming live provider-output acceptance is complete
- claiming real installed-app importer acceptance is complete
- replacing the current `Sources / Draft` vocabulary
- adding decorative hero imagery unrelated to real files
- adding fake metrics, fake charts, or generic dashboard filler

The homepage can look polished, but credibility must come from real source artifacts and visible provenance.

## 5. First Viewport Anatomy

### 5.1 Navigation

Keep the current quiet app navigation:

- Loom wordmark
- Sources
- Draft
- UNSW / ECON3202
- QuantNet
- WQU
- Claude
- History
- search field
- profile avatar

The active state remains `Sources` for this implementation.

### 5.2 Identity Rail

Keep the left identity rail, but make it support the workbench instead of competing with it.

Visible content:

- real profile photo
- `Yiping Yin`
- `Student · Builder · Learner`
- `Sydney, Australia`
- profile links
- verified memberships
- `Open Sources`
- `Open recent Draft`
- activity summary

Membership rows should stay image-backed and real:

- UNSW Sydney
- WorldQuant University
- QuantNet

Copy stays literal and concrete. Do not introduce metaphor-heavy language.

### 5.3 Main Headline

Replace the current passive dossier framing with a workflow claim.

Recommended headline:

`Sources become cited work`

Supporting label:

`Verified source workspace`

This is intentionally more active than `Source Dossier`. It explains the product behavior in the first screen.

### 5.4 Active Evidence Story

The main proof case should be **UNSW / ECON3202** because it currently has the strongest real source depth:

- `Problem Set 02.pdf`
- `W8 A Concave-Functions.pdf`
- `W8 C Suggested Exercises.pdf`
- `Problem2.pdf`

This module replaces the equal-weight top source board as the hero's primary evidence unit.

It should show:

- UNSW mark
- `UNSW / ECON3202`
- status such as `Active evidence story`
- count such as `4 files`
- two larger document previews
- two compact supporting file rows
- link to open the UNSW shelf

The module should feel like an active case file, not a category card.

### 5.5 Source Graph

Add a source graph beside the active evidence story.

Purpose:

- make source relationships visible
- show that documents, notes, and answer artifacts are connected
- make Loom feel like a knowledge system rather than a file list

Graph nodes should map to real artifact types:

- source PDF
- lecture deck / note
- draft summary
- answer artifact

The graph can be static for the first implementation. It should still feel deliberate:

- no fake analytics
- no random network visualization
- no labels that imply unsupported live graph computation
- no decorative node clouds

### 5.6 Provenance Chain

Keep the `Sources -> Draft -> Answer` chain, but make it tighter and closer to the hero evidence story.

The three steps:

1. `Sources`
   - `4 ECON3202 files`
   - course materials, weekly PDFs, exercises, problem-set work
2. `Draft`
   - `Concavity and optimisation summary.md`
   - working note created from lecture, exercise, and answer evidence
3. `Answer`
   - `Grounded explanation`
   - cited back to source artifacts

This chain is the product explanation. It should replace most explanatory paragraphs.

### 5.7 Answer Inspector

Upgrade the right panel from `Ask this profile` into an **Answer inspector**.

It should still contain:

- the seed question
- the grounded answer
- cited sources
- follow-up input

But its visual priority changes:

- add a clear status such as `Grounded`
- show citation cards as the main proof, not an afterthought
- keep answer copy short and readable
- make citation thumbnails and metadata visually stronger
- expose the source-to-answer relationship through layout, not explanatory text

Visible panel title:

`Answer inspector`

The old `Ask this profile` wording can remain only as an accessibility label or test bridge if required. It should not be the visible module title in the upgraded homepage.

## 6. Lower Page Rhythm

After the first viewport, the page should not repeat the same proof in larger card grids.

Recommended order:

1. `Source index`
   - compact directory for About, QuantNet, WQU, Claude
   - secondary, not hero
   - one thumbnail or mark per row/card, not large repeated galleries

2. `Workflow history`
   - compact history strip
   - Original Loom
   - Private Wiki
   - Knowledge identity
   - Real-file workflow

3. `Recent Drafts` stays out of this implementation
   - current scope does not render this section
   - do not fake populated drafts

## 7. Mobile Behavior

Mobile should not simply stack the desktop sidebar after many source cards.

Mobile priority:

1. top navigation
2. headline: `Sources become cited work`
3. active evidence story
4. provenance chain
5. answer inspector / cited sources
6. source index
7. identity and memberships
8. history

The source graph becomes a simplified stacked relation card on mobile.

Mobile must avoid:

- horizontal page overflow
- huge whitespace from desktop spanning cards
- buried cited sources
- unreadable file paths
- long explanatory blocks before evidence

## 8. Visual System

Continue the current Verified Dossier visual system:

- near-white background
- deep ink text
- forest green accent
- cool neutral borders
- small radii, 8px or less
- real document thumbnails
- restrained shadows
- serif for identity/headlines
- sans-serif for UI chrome and metadata

Refinements for this phase:

- fewer repeated cards
- stronger first-viewport hierarchy
- more open space around the active evidence story
- graph lines and nodes should be calm and precise
- citation cards should feel inspectable and clickable
- UI controls need deliberate type size and weight

Avoid:

- decorative blobs
- bento filler
- fake charts
- generic stock-like panels
- excessive beige warmth
- one-note green-only styling
- large paragraphs explaining the product

## 9. Components

The implementation should keep components small and purposeful.

Recommended component additions or refactors:

- `ActiveEvidenceStory`
  - renders the hero proof case
  - takes a section and selected artifacts
  - owns large and compact preview layout

- `SourceGraph`
  - static first version
  - consumes real artifact IDs and labels
  - renders semantic nodes and relationships

- `ProvenanceChain`
  - extracts current inline chain into a reusable component
  - keeps `Sources / Draft / Answer` copy stable

- `AnswerInspector`
  - refactors the current right panel
  - emphasizes citations and grounded status

- `SourceIndex`
  - keeps lower source directory compact
  - avoids duplicating the hero board

Existing components should be reused where they fit:

- `DocumentPreviewCard`
- `ArtifactCitationCard`
- `FileBadge`
- `InstitutionMark`

## 10. Data And Assets

Use current real data in `lib/new-loom/verified-dossier-home.ts`.

No fake new datasets are required.

The first implementation should use:

- `econ-ps2`
- `econ-slides`
- `econ-tutorial`
- `econ-notes`
- `about-doc`
- `quantnet-cpp-course`
- `quantnet-python-foundations`
- `wqu-index`
- `claude-certificate`

Assets already organized under `public/brand`, `public/profile`, and `public/verified-sources` should stay there.

If new generated preview thumbnails are created later, they should be stored in the same organized source-preview structure, not scattered at the repo root.

## 11. Accessibility And Interaction

Required behavior:

- all navigation remains keyboard reachable
- graph nodes are not only decorative if they communicate source relationships
- citation cards remain links to inspectable artifacts
- images keep meaningful surrounding text even if `alt=""` is used for decorative previews
- controls have focus states
- mobile touch targets stay large enough
- reduced-motion users should not lose information

Hover states can add polish, but the design must read correctly without hover.

## 12. Testing And Verification

Implementation should update focused tests around:

- first-paint text
- canonical `Sources / Draft` vocabulary
- real artifact IDs and thumbnails
- no stale generic product copy
- no Chinese text in the English app surface
- component rendering for any new workbench components

Verification should include:

- `npx tsx --test` for focused homepage/component tests
- `npm run typecheck`
- `npm run build`
- `git diff --check`
- rendered desktop screenshot
- rendered mobile screenshot
- image-load audit
- overflow audit

Browser/IAB should be preferred for visual verification. If the in-app browser profile remains locked, isolated Playwright is an acceptable fallback and the reason should be stated in the final handoff.

## 13. Acceptance Criteria

The redesign is acceptable when:

- first viewport clearly communicates `Sources become cited work`
- active evidence story is stronger than the directory cards
- source graph makes the page feel like a knowledge workspace
- answer inspector is visibly citation-first
- real UNSW / QuantNet / WQU / Claude / About assets remain visible but not decorative
- explanatory copy is reduced rather than expanded
- mobile presents evidence before sidebar identity
- no horizontal overflow exists on desktop or mobile
- all images load
- build and focused tests pass

The page should feel more true because it shows the work, not because it describes the work.

## 14. Open Implementation Notes

The current homepage already has many of the required raw materials. The implementation should be a targeted restructuring rather than a full rewrite.

Likely file touch points:

- `components/verified-dossier/VerifiedDossierHome.tsx`
- `app/globals.css`
- `lib/new-loom/verified-dossier-home.ts` only if data shape needs a small helper
- focused tests under `tests/`

The implementation should avoid broad unrelated route rewrites.
