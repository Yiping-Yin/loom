# Loom Product System Page Design

Date: 2026-06-05
Status: Pending user review
Route: `/loom` and `/product-history`

## Decision

Upgrade the Loom wordmark destination into a Product System page.

The page should not be a shallow history page, a marketing landing page, or a
simple introduction modal. It should explain Loom as a deep product system:
source-bound cognition, personal growth, evidence, Draft, Digital Me, and the
evolution from early concept work into the current reference instance.

The homepage remains personal-first. `/loom` carries the product philosophy and
system explanation.

## Product Role

The page answers:

What is Loom, why does it exist, how did the earlier concept work become the
current product, and why is Yiping's profile more than a normal personal
showcase?

It must make clear that Loom is:

- a cognitive structuring system
- a personal growth system
- a source-backed identity system
- an AI-assisted production system
- a product that emerged from many design and functional experiments

## Non-Goals

This pass does not:

- redesign the homepage
- redesign About, Education, Experience, or Digital Me
- claim live importer or provider-output acceptance is closed
- turn old metaphor terms into primary public navigation
- create a blocking onboarding tutorial
- add large amounts of explanatory text to the homepage
- make Loom look like a generic SaaS landing page

## Information Architecture

The Product System page should follow this order.

### 1. Opening Thesis

The first viewport should say, in restrained English, that Loom is a system for
turning source-backed thinking into personal growth, evidence, output, and
Digital Me.

The hero should use one strong historical or system visual object, not many
equal cards.

### 2. Library / Eyes / Memory

This section should reinterpret the early LOOM concept as time structure:

- Library: past material reaches the present
- Eyes: present attention becomes judgment
- Memory: judged understanding reaches the future

This should be conceptually strong but visually concise. It should not read like
an acronym gimmick.

### 3. Human / System / AI Division

This section should define the strict role split:

- human: attention, question, judgment, relation choice
- system: anchoring, organization, connection, preservation
- AI: inference acceleration, draft assistance, explanation, process replay

The section should explicitly avoid AI-as-protagonist language.

### 4. Source Is Sacred

This section should show why source remains foreground in source-reading
contexts:

- source remains authority
- notes and AI do not permanently invade the source body
- controls appear when needed and recede when not needed
- evidence assets support public claims

Use real source assets from the verified dossier rather than abstract copy.

### 5. Personal Growth Loop

This is the key new depth layer.

Visualize the loop:

Source -> Attention -> Question -> Judgment -> Practice -> Draft -> Output ->
Identity -> Next source

This section should explain that Loom is not only showing who Yiping is now. It
is showing how sources, practice, drafts, and outputs change capability over
time.

### 6. Five Product Layers

Render the system architecture as five layers:

1. Public identity surface
2. Evidence and source layer
3. Growth and capability layer
4. Cognitive structuring layer
5. AI and production layer

This section should make the product feel deep without becoming a dashboard.

### 7. Functional Reuse And Innovation

Show how old versions become current capabilities:

- source shelf -> Education and Experience evidence
- anchors -> citation-backed Digital Me answers
- Ask AI on passages -> grounded answer mode
- Sources to Draft -> process replay and output production
- panel/weave/pattern -> internal cognitive ontology
- web capture/native importer -> future source acquisition layer
- command palette role split -> long-term AI interaction architecture

This should be a concise matrix or editorial ledger, not a dense table that
overwhelms the page.

### 8. Product Evolution

Keep the existing evolution assets, but reposition them as evidence of product
learning:

- early manifesto
- Library / Eyes / Memory mark study
- source-bound reading
- structural wordmark
- frontispiece
- personal Loom
- verified dossier
- evidence workbench
- current reference instance

Each stage should answer:

- what was learned
- what was kept
- what was changed

### 9. Real Evidence Assets

End with real source-backed assets:

- About document
- UNSW/ECON 3202 source deck
- QuantNet Python Foundations
- Claude Certificate

The final impression should be that the philosophy is attached to real files,
not only beautiful copy.

## Visual Direction

Use a restrained editorial/product-system style.

Keep from early Loom:

- atmosphere
- tension
- sparse rhythm
- large negative space
- one dominant visual object
- dark historical plates where useful

Keep from current Loom:

- real profile and source assets
- verified document thumbnails
- institution marks
- asset-led proof
- literal public labels

Avoid:

- heavy dashboard panels
- generic bento grids
- long manifesto paragraphs
- repeated file-card rows
- always-visible AI assistant chrome
- making every concept a card
- making the page too dark to connect with the current personal profile

## Component And Data Reuse

Reuse existing data and components where possible:

- `VERIFIED_DOSSIER_ARTIFACTS`
- `VERIFIED_DOSSIER_ASSET_MANIFEST`
- `VERIFIED_DOSSIER_TOP_NAV`
- `PERSONAL_PLATFORM_STACK`
- `FileBadge`
- `DocumentPreviewCard`
- `InstitutionMark`
- curated history assets under `public/loom/history/`

New page-local data is acceptable for:

- product thesis blocks
- time-structure items
- human/system/AI role split
- growth loop stages
- functional reuse ledger

Do not duplicate existing artifact metadata manually if it already exists in the
verified dossier manifest.

## Interaction Model

The page should be mostly readable and scroll-based.

Allowed interactions:

- nav links back to About, Education, Experience, Digital Me
- source asset links to existing evidence routes
- history asset display
- lightweight internal anchor links if they improve scanning

Not included in this pass:

- modal onboarding
- animated walkthrough
- live Digital Me chat
- editable product map
- new data persistence

## Copy Rules

Visible copy should be English.

Use old metaphor terms only in historical or philosophical context. Do not make
Panel, Weave, Pattern, Atlas, or Weaver primary public labels.

Prefer short, exact copy. The page may be conceptually deep, but the visible UI
should not feel like a long essay.

## Testing

Update or add tests to verify:

- `/loom` and `/product-history` expose the Product System framing
- the page includes Library / Eyes / Memory as time structure
- the page includes the personal growth loop
- the page includes the five product layers
- the page includes functional reuse and innovation
- the page still links to About, Education, Experience, and Digital Me
- the page uses curated history assets under `public/loom/history/`
- source assets come from the verified dossier manifest
- homepage top navigation remains personal-first and does not absorb the full
  product explanation

Run:

- targeted product-history/page tests
- `git diff --check`
- a local browser check at `http://localhost:3000/loom`

If full `npm run typecheck` stalls again at idle `tsc --noEmit`, isolate the
typecheck config before treating it as a source failure.

## Definition Of Done

The pass is done when `/loom` clearly reads as the deep product-system entry:

- it explains Loom without crowding the homepage
- it integrates old concepts as ontology and history
- it shows personal growth as the deeper product layer
- it connects philosophy to real source assets
- it presents functional reuse and innovation concretely
- it preserves the personal public IA: About, Education, Experience, Digital Me

The result should make Loom feel like a serious, long-term product rather than a
simple personal showcase.
