# Loom Verified Dossier Design

Status: written for review
Updated: 2026-06-02

## 1. Product Definition

Loom 把一个人的资料、学习路径、作品、过程记录和 AI 对话，织成一个可展示、可追溯、可交流的个人知识身份。

It is simultaneously:

- a personal postcard
- a portfolio
- a knowledge base
- a process record
- a source-grounded virtual personal AI

The first real instance is Yiping Yin's Loom. The product boundary is broader: Loom should eventually support anyone who wants to turn their materials, learning, projects, and conversations into an inspectable personal knowledge identity.

## 2. Canonical Copy

### Primary Chinese Copy

**Headline**

一个可展示、可追溯、可交流的个人知识身份。

**Body**

Loom 将资料、学习路径、作品、过程记录和 AI 对话织成一个真实的个人知识档案。它既是作品集，也是知识库，最终也是一个基于本人知识的虚拟个人 AI。

### Primary English Copy

**Headline**

A knowledge profile people can inspect and ask.

**Body**

Sources, drafts, projects, and conversations become a public record with evidence behind every answer.

### Short Product Definition

Loom turns your sources, learning path, work, process records, and AI conversations into an inspectable personal knowledge identity.

## 3. Design Language

The approved design direction is **Verified Dossier / Artifact-first knowledge identity**.

The product should not feel like a decorative portfolio template, a LinkedIn clone, a generic SaaS dashboard, or a toy demo. Its quality should come from real artifacts:

- profile photos
- institution marks
- course materials
- PDFs, Word documents, PowerPoint decks, Excel files, Markdown notes
- source citations
- process records
- portfolio outputs
- AI answers grounded in sources

This matches the user's restaurant-menu analogy: clear structure plus real, desirable, concrete material is stronger than decorative design.

## 4. Visual System

### Palette

- Background: true white or very near-white.
- Text: deep ink, not warm brown.
- Accent: restrained forest green for trust, links, active state, and citation status.
- Border: cool neutral hairlines.
- File colors:
  - PDF: red
  - Word: blue
  - PowerPoint: orange
  - Excel: green
  - Markdown/Text: neutral gray

Avoid beige parchment, purple gradients, decorative blobs, one-note palettes, and playful toy colors.

### Typography

- Large identity and page headlines use an elegant serif.
- UI controls, navigation, labels, file names, and metadata use a precise sans-serif.
- Labels should be compact, readable, and deliberate.
- Letter spacing is normal; do not use negative tracking.
- Page text must remain readable on desktop and mobile.

### Shape And Surface

- Radius should be 8px or less.
- Use hairline separators, rails, lanes, rows, and file surfaces.
- Avoid nested cards and repeated bento grids.
- Shadows should only appear where real objects overlap, such as document previews or file stacks.

## 5. Core Screen Anatomy

Every major Loom surface should share the same design grammar:

1. **Top Navigation**
   - Loom wordmark
   - About
   - Sources
   - UNSW
   - Quantnet
   - WQU
   - Claude
   - History
   - Search
   - Profile photo

2. **Identity Dossier**
   - Real profile photo
   - Name
   - roles
   - location
   - links
   - memberships

3. **Evidence Canvas**
   - artifact lanes
   - document previews
   - source rows
   - featured knowledge stories
   - portfolio outputs

4. **AI Provenance Inspector**
   - user question
   - source-grounded answer
   - cited sources
   - follow-up input
   - confidence / verified status

5. **History Strip**
   - Original Loom
   - Private Wiki
   - Knowledge identity
   - Platform for everyone

## 6. Home Composition

The Home page should become the front page of a professional personal knowledge dossier.

It should include:

- top navigation
- identity rail for Yiping Yin
- the primary headline and product copy
- a featured UNSW / ECON3202 evidence story
- compact evidence lanes for About, Quantnet, WQU, and Claude
- an Ask this profile inspector
- a compact Loom history strip

The page should not use the phrase `Yiping's Loom` as the main headline because it repeats the brand and does not explain the product.

### Featured Story: UNSW / ECON3202

UNSW / ECON3202 should be the first strong proof case because it connects sources, learning path, problem sets, drafts, and AI explanation.

Visible artifacts should include:

- `ECON3202 Problem Set 2.pdf`
- `Lecture 8 Slides.pptx`
- `Tutorial 3 Solutions.pdf`
- `Lecture 8 Notes.pdf`

The UI should show a source-to-answer chain:

`Sources -> Draft -> Answer`

### Ask This Profile

The AI module must feel like a provenance inspector, not a generic chatbot.

Seed question:

What is the Phillips Curve and how is it used in ECON3202?

Seed answer should explain:

- short-run trade-off between inflation and unemployment
- aggregate demand
- expectations
- supply shocks
- source grounding through ECON3202 files

## 7. Page System

The same visual language should extend across:

- Home
- About
- Sources
- UNSW
- Quantnet
- WQU
- Claude
- History

Each section can use different content, but the primitives should stay consistent:

- identity blocks
- evidence lanes
- file chips
- document previews
- source rows
- process records
- AI provenance panels

## 8. Vocabulary Rules

Keep Loom's working vocabulary literal and concrete.

Use:

- Sources
- Draft
- Add files
- ADDED
- No files added yet.

Avoid returning to metaphor-heavy or legacy workflow language for primary UI.

## 9. Concept References

The current accepted visual direction is represented by these concept images:

- Design language board: `/Users/yinyiping/.codex/generated_images/019e7a4e-8992-7622-911b-b38bed66557e/ig_0ba7867c8dc3e2f0016a1eadfb66a88191a074c4eaa142330b.png`
- Home final composition: `/Users/yinyiping/.codex/generated_images/019e7a4e-8992-7622-911b-b38bed66557e/ig_0ba7867c8dc3e2f0016a1eaf29b3308191ab28a01f050c9c77.png`

These images are design references, not production assets. Production implementation must use real, licensed, user-provided, or code-native assets for institution marks and file icons.

## 10. Implementation Boundary

This spec is intentionally limited to the design language and first unified product surface.

It does not attempt to complete:

- multi-user accounts
- public SaaS launch flows
- live AI provider acceptance
- installed-app importer acceptance
- cloud sync
- payments
- App Store readiness

The next implementation plan should focus on the visible web surface first, then extend the same system to deeper pages.

## 11. Acceptance Criteria

The implementation is acceptable when:

- the Home page no longer looks like a toy, demo, card grid, or generic workbench
- the product definition is visible and concrete
- real-looking artifacts drive the design
- the five main sections are still recognizable
- Sources and Draft remain the canonical app vocabulary
- the AI panel visibly cites source artifacts
- the system can extend naturally to About, Sources, UNSW, Quantnet, WQU, Claude, and History
- desktop and mobile layouts remain readable without overflow
