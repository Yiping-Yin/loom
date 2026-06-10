# Digital Me Role Operating System Design

Status: approved direction
Date: 2026-06-05
Scope: `/digital-me`, role-specific proof path, interactive artifacts, evidence boundaries

## Product Definition

Digital Me is not a personal homepage, a chat box, a dashboard, or a card grid.
It is a role-specific operating system for turning a person's real archive into
an evidence-bound, interactive performance.

Core sentence:

> Digital Me turns personal evidence into role-specific capability.

Long form:

> Digital Me takes Education, Experience, projects, drafts, certificates, code,
> files, and source material, then compiles them through a selected target role
> into an inspectable proof path with interactive artifacts and clear evidence
> boundaries.

The default first role is:

**Quant Researcher / Trader**

## Why The Previous Directions Were Not Enough

The first mockups still treated Digital Me as a static interface:

- cards of capabilities
- a three-column evidence layout
- a flow diagram
- a map artifact shown beside a chat thread

Those are useful fragments, but they do not capture the deeper product role.
Digital Me should not ask the visitor to browse modules. It should receive an
intent, understand the target identity, and assemble a credible proof
performance from the archive.

## Core Experience

The primary user intent is not:

> What files does Yiping have?

The primary intent is:

> Show why Yiping is becoming a Quant Researcher / Trader.

Digital Me answers by building a live proof path:

1. **Role Lens** - choose the target identity and evaluation criteria.
2. **Role Thesis** - state the current position in one grounded sentence.
3. **Claim Engine** - generate capability claims that can be proved or challenged.
4. **Evidence Graph** - connect each claim to Education, Experience, projects,
   certificates, drafts, code, and source files.
5. **Artifact Runtime** - render interactive outputs that answer the user's
   intent directly.
6. **Boundary And Gap** - show what is strong, partial, directional, or missing.
7. **Next Growth Action** - suggest what evidence or project should be created
   next to strengthen the role.

This experience is more like a generated role presentation than a normal AI
conversation. Conversation remains the input and control layer; the output is a
structured, interactive proof path.

## Default Quant Role Lens

The Quant Researcher / Trader lens should search the archive for evidence of:

- mathematical reasoning
- optimisation thinking
- probability and statistics
- programming foundations
- Python and C++ implementation
- market structure understanding
- trading logic
- risk thinking
- research process
- execution discipline

The first version should not claim all of these are complete. It should classify
them honestly:

- **Strong evidence** - multiple sources and outputs support the claim.
- **Partial evidence** - some real source support exists, but proof is thin.
- **Direction only** - the archive suggests intent, not demonstrated ability.
- **Missing proof** - the role needs evidence that does not yet exist.

This honesty is part of the product quality. A credible Digital Me must be able
to say "not enough evidence yet."

## Page Model

The `/digital-me` page should be organized around one active role performance,
not a generic grid.

### 1. Role Lens Header

The top of the page identifies the active lens:

- Quant Researcher / Trader
- current role thesis
- evidence strength summary
- controls for changing lens later

The first version may show other lenses as inactive future options, but the live
experience should stay focused on Quant.

### 2. Proof Path Stage

The central surface is the proof path. It should read as one continuous
argument, not separate cards.

Required proof path order:

1. Role thesis
2. Capability claims
3. Evidence trail
4. Generated artifact
5. Boundary and gaps
6. Next action

Each section should feel like the next step in a presentation. It should be
possible to scan the whole path, then expand specific claims.

### 3. Claim Nodes

A claim is not a badge. It is a testable statement.

Example claim:

> Yiping has developing evidence of mathematical reasoning through UNSW
> economics coursework and problem-set work.

Each claim needs:

- claim text
- role relevance
- evidence status
- source count
- linked evidence nodes
- generated artifact actions
- gap note when proof is incomplete

### 4. Evidence Graph

Evidence comes from existing Loom data rather than invented demo content.

Initial sources should be composed from:

- `VERIFIED_DOSSIER_ARTIFACTS`
- `VERIFIED_DOSSIER_PRESENTATION_CATEGORIES`
- `UNSW_SHELF_*`
- Draft records and answer preview data where available
- document thumbnails, file badges, source paths, and metadata

The graph should connect evidence to claims by meaning, not only by location in
a folder. For example:

- `Problem Set 02.pdf` supports mathematical reasoning and optimisation
  context.
- `W8 A Concave-Functions.pdf` supports optimisation and economics theory.
- `Python Foundations.pdf` supports programming foundations.
- certificates support learning evidence, but should not be treated as final
  capability proof unless tied to work or output.

### 5. Artifact Runtime

An artifact is the answer when the user asks for something that should be
operated on, not merely described.

Supported first-version artifact modes:

- **Capability Map** - shows claims, evidence strength, and gaps.
- **Learning Timeline** - connects Education and Experience over time.
- **Source Graph** - shows how files support a claim.
- **Portfolio Case** - turns a proof path into a presentable case study.
- **Interview Answer** - generates a concise role-specific answer with
  citations.
- **Gap Roadmap** - recommends missing projects or evidence.

Map artifacts are valid when the user asks location-based questions. A future
version can use a real Google Maps integration. The first version can model the
runtime shape and use a constrained embed only when it is genuinely part of the
answer.

### 6. Conversation Control

The conversation should control the proof path, not dominate the page.

Useful prompts:

- "Show why Yiping is becoming a Quant Researcher / Trader."
- "Only show evidence related to trading."
- "Expand the C++ proof."
- "Turn this into a recruiter version."
- "Which claims are weak?"
- "Generate a portfolio case from this path."
- "Show the learning timeline behind this role."

The UI should make follow-up actions visible as commands, not as decorative
chips. Each action should change the proof path or artifact state.

## Data Objects

The first implementation should introduce or emulate these product objects:

### RoleLens

Fields:

- id
- label
- thesis
- evaluation criteria
- preferred evidence kinds
- role-specific prompts

### EvidenceNode

Fields:

- id
- title
- kind
- source path
- date or modified date
- source section
- thumbnail or file badge
- supported capabilities
- source href

### ClaimNode

Fields:

- id
- role lens id
- claim text
- relevance
- evidence status
- evidence node ids
- gap note
- artifact actions

### ProofPath

Fields:

- role lens id
- role thesis
- claim ids
- selected claim id
- active artifact mode
- boundary summary
- next growth actions

### ArtifactState

Fields:

- mode
- title
- source claim ids
- source evidence ids
- render payload
- available follow-up actions

## Interaction Requirements

The first `/digital-me` build should support these interactions with local
state:

1. Select a claim and update the evidence detail.
2. Switch artifact mode for the selected proof path.
3. Show a boundary/gap explanation tied to the selected claim.
4. Trigger at least three follow-up actions that visibly change the state:
   capability map, interview answer, and gap roadmap.
5. Keep citation/evidence detail attached to generated output.

The page does not need a live model call in the first version. It needs a
credible, deterministic role lens demo backed by real local artifact metadata.

## Visual And UX Principles

- Do not use a generic dashboard layout.
- Do not stack capability cards as the main product idea.
- Do not make Digital Me a plain ask box.
- Do not expose a raw folder browser as the primary surface.
- Keep one active proof path in focus.
- Use lists, rails, staged sections, and artifact surfaces instead of repeated
  cards.
- Let evidence appear as support for claims, not as the whole page.
- Make gaps and boundaries visible enough to increase trust.
- Keep source authority above AI self-display.

The page should feel like a role presentation being generated from evidence,
not a product marketing page.

## Non-Goals

- No full multi-role operating system in this slice.
- No real Google Maps API requirement in this slice.
- No live AI provider requirement in this slice.
- No automatic parsing of every user file in this slice.
- No claim that Quant capability is complete where evidence is still partial.
- No redesign of About, Education, or Experience in this slice.

## Acceptance Criteria

The first implementation is acceptable when:

1. `/digital-me` defaults to the Quant Researcher / Trader role lens.
2. The page communicates Digital Me as a role-specific proof system, not a
   generic chatbot.
3. At least five role claims are present and classified by evidence status.
4. Claims connect to real Loom evidence assets, source paths, thumbnails, or
   file metadata.
5. Selecting claims updates evidence and boundary information.
6. Artifact modes produce distinct visible outputs, not just renamed panels.
7. The page includes clear gap and next-action logic.
8. The main layout avoids card-grid presentation as the core structure.
9. Desktop and mobile render without overflow or text overlap.
10. Tests protect the role lens, claim evidence status, artifact runtime, and
    anti-chatbox positioning.

## Testing Plan

Add contract coverage before implementation:

- `/digital-me` includes `Quant Researcher / Trader`.
- The source contains `Role Lens`, `Evidence Graph`, `Claim Engine`,
  `Artifact Runtime`, `Boundary`, and `Next Growth Action`.
- At least one claim has strong evidence, one has partial evidence, and one has
  missing or directional evidence.
- Real artifact ids from the verified dossier are used by the proof path.
- The page does not present Digital Me as only an ask box or card grid.
- Artifact actions include capability map, interview answer, and gap roadmap.

Browser verification after implementation:

- desktop `/digital-me`
- mobile `/digital-me`
- select claim interaction
- switch artifact mode interaction
- no horizontal overflow
- no console/resource errors

## Implementation Boundary

This spec only authorizes the first Role Operating System slice for
`/digital-me`. Future work can add live model calls, real map embeds, source
anchor precision, multi-role switching, and generated shareable artifacts after
the deterministic role-lens demo is stable.
