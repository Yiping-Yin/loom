# Loom Personal Home IA Design

Date: 2026-06-04
Status: Approved for implementation planning

## Decision

The Loom homepage should move from an internal source-library navigation model to a personal
presentation model.

Loom is the underlying product and trust mechanism. The visible first-level navigation should
present Yiping Yin, not Loom's internal system vocabulary.

Primary navigation:

- About
- Education
- Experience
- Digital Me

Loom should not become a primary navigation item. The Loom wordmark remains the brand/home
entry and can open a lightweight intro explaining how the profile is built.

## Product Framing

The homepage should answer this question first:

What can a visitor understand about Yiping Yin, and how can they verify it?

Loom answers the verification layer:

- Sources hold real files, courses, certificates, project materials, and evidence.
- Draft turns source material into inspectable outputs.
- Digital Me answers from the same archive, cites sources, explains work, and shows process.

This means Loom is both present and restrained. It should create credibility without becoming
the main subject of the page.

## Navigation Responsibilities

### About

Purpose: identity and self-introduction.

Content:

- profile photo and name
- concise self-introduction
- current direction and interests
- location and public links
- a small trust signal that the profile is source-backed

Do not use About as a long Loom product explanation page.

### Education

Purpose: learning history, course work, and credential-backed evidence.

Content:

- UNSW as a top-level education institution
- UNSW course folders such as ECON 3202, MATH 2991, FINS 3666, and other real course folders
- coursework outputs and process artifacts
- certificates and structured learning records
- QuantNet, WQU, and Claude Certificate records where they are learning or credential evidence

Education should show the work, process, source files, and outputs. It should not read like a
plain folder index.

### Experience

Purpose: professional work, projects, competitions, and built artifacts.

Content:

- real projects
- work records
- competitions
- built systems such as Loom and Private Wiki when they are presented as work evidence
- project process and outcome artifacts

Experience should make the work inspectable. It should connect visible outcomes to source
material and process records when available.

### Digital Me

Purpose: demonstrate the digital-person layer as a capability, not only an ask box.

Content:

- grounded question answering
- citation-backed answers
- source retrieval
- explanation of learning paths
- project and coursework walkthroughs
- draft generation from evidence
- process replay
- personal judgment or style simulation where it is backed by the archive

Digital Me is the strongest product differentiator. It should show what the profile can do when
the underlying source archive is connected to an AI-facing layer.

## Loom Intro Layer

Loom should be explained through a lightweight intro layer, not a full-screen onboarding flow.

Entry points:

- the Loom wordmark
- a small `Built with Loom` affordance near the first viewport or footer
- contextual explanation inside Digital Me

The intro should say:

1. Sources are the real material.
2. Draft turns material into inspectable work.
3. Digital Me answers, cites, explains, and shows process from the same archive.

Behavior:

- no blocking first-run modal
- no forced tutorial
- no heavy product marketing page before the personal content
- optional non-blocking first-visit hint is acceptable if it does not cover or delay the homepage
- the intro can be a compact panel, popover, or dedicated secondary page

Recommended implementation: a compact Loom intro panel opened from the wordmark or `Built with
Loom`. The page should still load directly into the personal profile experience.

## Homepage Composition

The first viewport should read as a personal, source-backed profile.

Recommended first viewport:

- top nav: About, Education, Experience, Digital Me
- wordmark: Loom
- profile signal: photo, name, concise positioning
- primary visual object: a verified personal evidence surface, not a generic product demo
- secondary proof: one education example and one Digital Me answer preview

The page should avoid:

- feature-heavy explanations
- internal folder taxonomy as the main story
- large tutorial blocks
- repeated source labels that trail after file names
- product copy that competes with the person

## Route Mapping

Likely route mapping:

- `/about` -> About
- `/education` -> Education overview
- `/knowledge/unsw` remains the UNSW education detail route
- `/experience` -> Experience overview
- `/digital-me` -> Digital Me capability page
- `/product-history` or `/loom` -> secondary Loom product explanation

Existing source routes should remain available. The top-level navigation can point to new
personal categories while source-library routes remain the evidence layer underneath.

## Data Model Impact

The current source sections can be reclassified without deleting source data.

Current shelves:

- About
- UNSW
- Quantnet
- WQU
- Claude

New presentation categories:

- About: profile and self-introduction
- Education: UNSW, QuantNet, WQU, Claude Certificate, course work, certificates
- Experience: projects, work, competitions
- Digital Me: AI-facing capabilities backed by sources and drafts

This is a presentation reclassification, not a source migration.

## Component Impact

Expected affected areas:

- `VERIFIED_DOSSIER_TOP_NAV`
- homepage hero copy
- profile sidebar copy
- source section grouping
- `AboutClient`
- new Education, Experience, and Digital Me routes or route aliases
- homepage tests that currently assert `Sources / Draft / UNSW / Quantnet / WQU / Claude / History`

The internal product vocabulary `Sources` and `Draft` remains valid inside the intro layer,
workflows, and deeper source/draft pages. It should not dominate top-level visitor navigation.

## Error Handling And Edge Cases

- If a category has no mature content yet, show fewer stronger examples rather than placeholder
  cards.
- If Digital Me cannot answer with real citations, the UI should say that no grounded answer is
  available.
- If source thumbnails fail, the UI should still show file names, type badges, and source paths.
- If the intro panel is dismissed, the dismissal should not hide personal content or break
  navigation.

## Testing

Update tests to assert:

- top navigation contains About, Education, Experience, Digital Me
- top navigation does not expose source shelves as primary nav items
- Loom wordmark still links home and/or opens the intro affordance
- Loom intro explains Sources, Draft, and Digital Me without blocking the homepage
- Education includes UNSW course folders and learning credentials
- Digital Me is more than an ask box and includes grounded capabilities
- old source routes remain reachable
- no horizontal overflow at desktop or mobile widths

## Non-Goals

- Do not delete source routes.
- Do not migrate source files.
- Do not turn the homepage into a product marketing landing page.
- Do not make a blocking onboarding flow.
- Do not remove Sources and Draft from deeper product workflows.

## Acceptance Criteria

The redesign is acceptable when:

1. A first-time visitor sees Yiping Yin first, not an internal knowledge-system dashboard.
2. The primary navigation reads as personal presentation: About, Education, Experience, Digital Me.
3. Loom is visible as the trust mechanism, but not competing as a primary content category.
4. Education shows real course and credential evidence.
5. Experience has a clear place for work, projects, and competitions.
6. Digital Me demonstrates grounded capabilities beyond simple asking.
7. The Loom intro is discoverable, lightweight, and non-blocking.
8. Existing source and draft functionality remains reachable.
