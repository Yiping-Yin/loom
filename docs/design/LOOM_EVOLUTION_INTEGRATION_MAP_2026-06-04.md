# Loom Evolution Integration Map

Status: active integration guide
Date: 2026-06-04
Scope: homepage, product history, history assets, source-backed personal IA

This note treats earlier Loom versions as idea work, visual research, and
product evidence. They should be integrated into the current version through
clear decisions, not preserved as competing products.

For the deeper concept layer, read
`docs/design/LOOM_PRODUCT_PHILOSOPHY_FOR_DESIGN_ENGINEERING_2026-06-04.md`.
That file preserves the old Library / Eyes / Memory, loom-as-time-structure,
source-is-sacred, AI-not-protagonist, panel/weave/pattern, and Thought Map
concepts as design and engineering constraints.

For the long-term personal direction, read
`docs/design/LOOM_PERSONAL_GROWTH_MODEL_2026-06-04.md`. That file defines Loom
as a system for making personal growth inspectable through source, attention,
question, judgment, practice, draft, output, identity, and next source.

For the full product-system view, read
`docs/design/LOOM_PRODUCT_SYSTEM_ARCHITECTURE_2026-06-04.md`. That file separates
the public identity surface from the evidence layer, growth layer, cognitive
structuring layer, and AI production layer.

## Current Product Thesis

Loom is a personal knowledge identity platform.

Yiping's Loom is the first reference instance. The current public surface should
present a real person, real learning, real work, and a Digital Me layer that can
answer from the same source archive. Loom itself remains the trust mechanism:
Sources hold the material, Draft turns material into inspectable work, and
Digital Me answers with evidence.

The deeper product is not a static identity page. It is personal growth made
inspectable: how sources change judgment, how practice becomes capability, how
outputs prove that capability, and how Digital Me can explain the path.

Therefore Loom should be designed as a layered system, not a showcase:

1. public identity surface
2. evidence and source layer
3. growth and capability layer
4. cognitive structuring layer
5. AI and production layer

## What To Keep From Earlier Versions

### 1. Atmosphere

Early Loom had a stronger sense of atmosphere than many later prototypes. Keep:

- a composed first viewport
- sparse and precise text
- strong rhythm between object, text, and empty space
- restrained contrast
- a feeling of reading and thinking, not administration

Do not copy:

- black-theme dependence
- manifesto-first copy
- purely poetic product explanation
- decorative cosmic imagery without product evidence

### 2. One Dominant Object

The best early and mid-stage directions avoided equal-weight dashboard modules.
The current homepage should recover that discipline.

Acceptable dominant objects:

- a verified personal evidence surface
- a Digital Me capability canvas
- a course/work artifact cluster with real source previews
- a product history plate inside the Loom history route

Avoid:

- grids where every card has the same weight
- file-browser dumps
- repeated metadata labels appended to file names
- product feature blocks that explain instead of showing

### 3. Source-Bound Thinking

The durable idea from all versions is not "portfolio" alone. It is source-bound
identity:

- a claim should point to source material
- a course should show coursework and process, not only a logo
- a project should expose artifacts, not only a title
- Digital Me should cite and replay process, not only chat

### 4. Literal Public Vocabulary

The older metaphor vocabulary belongs in history and internal design notes, not
primary UI copy. User-visible product copy should stay literal:

- Sources
- Draft
- Add files
- ADDED
- No files added yet.

Metaphor terms such as weave, panel, shuttle, atlas, and weaver may appear in
historical context only when the page is explicitly explaining the evolution of
Loom.

### 5. Cognitive Ontology

The older concept work is still useful as product ontology:

- Library / Eyes / Memory describe knowledge moving through time.
- Loom is a machine for holding tension, not a blank canvas.
- Source is sacred; source-reading contexts should keep the source foregrounded.
- AI is summoned structural help, not the protagonist.
- Panel, weave, and pattern are cognitive states, not decorative cards.
- Thought Map is the verifier for emerging understanding, not a secondary
  feature.

These concepts should shape data models, interaction flows, and history
storytelling. They should not automatically become visible labels in the public
homepage.

### 6. Personal Growth Spine

The current personal IA should be organized around growth, not only category.

The durable loop is:

Source -> Attention -> Question -> Judgment -> Practice -> Draft -> Output ->
Identity -> Next source

This loop lets About, Education, Experience, and Digital Me become one system:

- About shows the current person and direction.
- Education shows learning growth.
- Experience shows applied growth.
- Digital Me explains, cites, and replays growth from the archive.
- Loom history shows the product's own growth.

## Current Information Architecture

Primary public navigation:

- About
- Education
- Experience
- Digital Me

Secondary Loom entry:

- the Loom wordmark
- a compact Built with Loom entry
- `/product-history` or `/loom`

The wordmark should open Loom's own story: what Loom is, how it evolved, why the
current profile is source-backed, and what the latest reference instance is.
It should not open another source dashboard.

## Page-Level Integration Decisions

### Home

Home is the reference instance, not a product dashboard.

It should show Yiping first, then proof. The first viewport should have one
clear visual hierarchy:

1. identity
2. evidence object
3. one or two next actions
4. small Loom trust signal

The page should not explain every Loom concept. It should make the profile
credible by showing real assets: profile photo, institution marks, source
documents, certificates, project artifacts, and cited outputs.

### Product History

Product history is where the early Loom versions belong.

It should show:

- early manifesto and visual thesis
- mark and frontispiece explorations
- movement toward real profile assets
- verified source dossier
- evidence workbench
- current personal IA

This route may use richer historical language because its job is to explain the
product lineage. It must still distinguish history from the current live UI.

### Education

Education should not start at ECON 3202. It should start at UNSW as an
institution, then reveal course folders such as ECON 3202, MATH 2991, FINS 3666,
and other real coursework.

QuantNet, WQU, and Claude Certificate can sit inside Education when they are
learning or credential evidence. They can also be cross-linked from Experience
if a certificate or course directly supports a project.

### Experience

Experience should show work, projects, competitions, and built systems through
visible artifacts and process evidence. Loom itself can appear here as a built
product, but the homepage should not become a Loom marketing page.

### Digital Me

Digital Me is the capability layer.

It should demonstrate:

- grounded answering
- citation-backed explanation
- source retrieval
- learning-path walkthroughs
- project and coursework walkthroughs
- draft generation from evidence
- process replay

It should not be only an ask box.

## Functional Reuse And Innovation

The old versions should also be mined for product behavior. A mature Loom should
reuse working primitives, retire confusing surfaces, and innovate only where the
current personal identity product needs a new capability.

### Reuse Existing Functional Primitives

| Earlier function or prototype | Current reuse | Boundary |
| --- | --- | --- |
| Source shelf and folder mirroring | Education and Experience evidence layers | Do not expose a raw folder browser as the homepage. |
| Immutable source folders | Trust contract for all real files | User source folders remain read-only. |
| Source file previews | Asset-backed proof objects | Use thumbnails, metadata, and source path intentionally. |
| Anchored note / passage logic | Citation-backed Digital Me answers and source jump-backs | Use exact anchors when available; do not fake passage precision. |
| Ask AI on source passage | Digital Me grounded answer mode | AI answers from attached sources and shows citations. |
| Sources to Draft workflow | Draft generation, preview, answer handoff, and process replay | Draft is a production state, not a top-level public category. |
| Panel / weave / pattern thinking | Internal model for process nodes, canvases, and product history | Do not use these as primary public labels. |
| Frontispiece / plates | Product-history presentation system | Use for Loom's own history, not for every page. |
| Web capture and native importer work | Future source acquisition layer | Do not claim completion until real importer acceptance is closed. |
| Command palette / AskAI / background pass role split | Long-term AI surface architecture | Keep AI summoned or contextual; avoid always-visible AI chrome. |

### Current Code Assets To Reuse

The current repository already contains reusable functional material. Future UI
work should compose these rather than duplicate parallel data:

- `VERIFIED_DOSSIER_ARTIFACTS`: real profile, course, certificate, and document
  assets with file kind, source path, metadata, and thumbnails.
- `VERIFIED_DOSSIER_PRESENTATION_CATEGORIES`: About, Education, Experience, and
  Digital Me as the public IA.
- `VERIFIED_DOSSIER_ASSET_MANIFEST`: profile, institution, document, course, and
  process asset families.
- `UNSW_SHELF_*`: institution-first UNSW course and source model.
- `buildDraftUrlFromArtifacts`: source artifact to Draft/Digital Me handoff.
- `draft-storage`, `draft-records`, and `draft-answer-preview`: local Draft
  records, answer previews, references, and source labels.
- `EvidenceWorkbench`: reusable proof mechanics for active source shelf, source
  graph, and Sources to Draft to Answer chain.

### Innovation Targets

These are the places where the current version should move beyond earlier
attempts instead of merely reusing them.

#### 1. Loom Intro From The Wordmark

The Loom wordmark should open a compact product-history / intro layer. It should
explain how the current profile is built, show the evolution from early idea to
reference instance, and keep the visitor inside the personal profile flow.

It should not be a blocking onboarding modal or a full homepage replacement.

#### 2. Digital Me As Capability Canvas

Digital Me should turn a question into a visible state:

- answer with citations
- canvas for a topic
- portfolio case view
- process replay
- action or draft output

This is the main product innovation. It turns the source archive from passive
proof into an interactive personal interface.

#### 3. Source-Backed Portfolio Object

A course, project, certificate, or competition should become an inspectable
object:

1. source files
2. work process
3. draft/output
4. cited answer or presentation

This is stronger than a resume card because it lets a viewer inspect how the
claim was made.

#### 4. Process Replay

The strongest current workflow is:

Sources -> Draft -> Answer -> Digital Me

Future pages should show this as a compact replayable proof trail, not as a long
explanation. A visitor should be able to see which files were attached, what
draft or answer came from them, and where the final output is shown.

#### 5. Asset-Aware UI Primitives

UI components should be reusable assets, not one-off cards:

- profile asset
- institution mark
- file badge
- document preview
- course row
- process step
- citation strip
- knowledge canvas node

The innovation is not decoration. It is consistent proof rendering across
About, Education, Experience, Digital Me, and Loom history.

#### 6. Cross-Shelf Intelligence

The long-term personal AI should connect sources across shelves. For example, a
trading question can draw from UNSW mathematics, QuantNet programming, WQU
finance context, and project records.

This should be shown through a Digital Me canvas before it becomes a complex
global graph product.

#### 7. Growth Thread

The next major product object should be a growth thread: a long-running line of
personal development that connects sources, questions, practice, output,
capability proof, and next direction.

Examples:

- mathematical economics
- trading systems
- programming for quantitative finance
- AI-assisted learning
- product design
- Loom itself

Growth threads prevent the product from becoming a static portfolio. They make
personal development visible over time.

## Asset Classification

### Active Product Source

These define the current product or active implementation:

- `docs/canon/LOOM.md`
- `docs/canon/LOOM_RULES.md`
- `docs/design/LOOM_VISUAL_UPGRADE_PRINCIPLES_2026-06-04.md`
- `docs/archive/ai-build-log/specs/2026-06-04-loom-personal-home-ia-design.md`
- `docs/archive/ai-build-log/specs/2026-06-04-loom-asset-led-upgrade-design.md`
- `lib/new-loom/`
- `components/verified-dossier/`
- `public/verified-sources/`
- `public/profile/`
- `public/brand/`

### Curated History Assets

These are selected assets promoted from idea work into the current product
history:

- `resources/loom-history/early-version/`
- `resources/loom-history/evolution/`
- `public/loom/history/early-version/`
- `public/loom/history/evolution/`

The `resources` copy is the source/reference copy. The `public` copy is only the
served app copy.

### Source Material To Mine For Principles

These files should be read for decisions, not surfaced wholesale:

- `docs/design/LOOM_PRODUCT_SYSTEM_ARCHITECTURE_2026-06-04.md`
- `docs/design/LOOM_PERSONAL_GROWTH_MODEL_2026-06-04.md`
- `docs/design/LOOM_PRODUCT_PHILOSOPHY_FOR_DESIGN_ENGINEERING_2026-06-04.md`
- `docs/process/LOOM_STAGE_REVIEW_2026-04-15.md`
- `docs/archive/ai-build-log/specs/2026-04-17-loom-logo-wordmark-design.md`
- `docs/archive/ai-build-log/specs/2026-04-17-loom-negative-space-wordmark-design.md`
- `docs/archive/ai-build-log/specs/2026-04-17-home-foreground-workbench-design.md`
- `docs/design/LOOM_VISUAL_GRAMMAR.md`
- `docs/design/LOOM_PANEL_SYSTEM_PLAN.md`
- `docs/design/LOOM_EPISTEMIC_GRAMMAR.md`
- `docs/design/MATERIAL_ARCHIVE_DIRECTION.md`

### Archive Only

These preserve evidence but should not shape active scans unless explicitly
needed:

- `archive/screenshots/`
- `archive/snapshots/`
- `archive/backups/`

Screenshots in archive should be promoted into `resources/loom-history/` before
they are used in public UI.

### Generated Or Regenerable

These are not source:

- `node_modules/`
- `.next/`
- `.next-build/`
- `public/pagefind/`
- `tmp/`
- `tsconfig*.tsbuildinfo`
- `.DS_Store`

They can be deleted and regenerated. They should not be included in Loom history
or design reasoning.

## Cleanup Rules

1. Keep Loom assets under Loom-specific folders.
2. Keep source/reference assets in `resources/`.
3. Keep public app copies in `public/`.
4. Keep generated output out of active source scans.
5. Promote only representative history assets; do not expose every screenshot.
6. Preserve backup snapshots only when they carry unrecovered source context.
7. Remove Finder duplicates, build info, and generated search indexes promptly.

## Next Design Standard

Every new Loom page should pass this question:

Does the screen make real source-backed identity visible, or does it merely
arrange labels around assets?
