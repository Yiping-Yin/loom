# Loom Asset-Led Upgrade Design

Date: 2026-06-04

## Purpose

Loom has reached a structural prototype stage: the product model is clear, but the interface still relies too much on text markers. The next upgrade should move Loom from a text-described dossier into an asset-led personal knowledge identity. Real pictures, file previews, institution marks, document thumbnails, and reusable UI assets should carry more meaning than explanatory copy.

This design covers the first asset-led pass for the web product, focused on Home and Digital Me. It does not claim the full Loom product is complete.

## Product Direction

The approved direction is Route A: Asset-First Upgrade.

Loom should mature in this order:

1. Mark text: keep only necessary labels and navigation.
2. Picture assets: show real profile, institution, document, certificate, course, and project visuals.
3. Evidence assets: show source path, file kind, date, folder, thumbnail, and citation state.
4. UI assets: create reusable, consistent visual primitives.
5. Interaction assets: let Digital Me convert questions into canvases, process trails, proof views, and output flows.
6. Professional polish: reduce repetition and let assets, spacing, hierarchy, and state do the explanatory work.

## Scope

### Included

- Create an asset manifest layer for real Loom assets.
- Upgrade Home to reduce text repetition and present real proof objects.
- Upgrade Digital Me from a text explanation page into an asset-led interactive identity surface.
- Preserve the top-level personal IA: About, Education, Experience, Digital Me.
- Preserve Sources and Draft as Loom's underlying trust and production layers.
- Keep all visible product copy in English.

### Not Included

- No full About, Education, or Experience redesign in this pass.
- No new AI provider behavior.
- No live importer acceptance claim.
- No full design-system rewrite for every legacy Loom surface.
- No claim that approval-bound Loom completion gates are closed.

## Asset Manifest v1

Add a typed asset manifest near the verified dossier data, or extend the existing verified dossier data if that is cleaner.

The manifest should group assets into these families:

### Profile Assets

- Profile photo.
- Short identity label.
- Location.
- Public link assets for LinkedIn, GitHub, and personal website.

### Institution Assets

- UNSW crest.
- WorldQuant University mark.
- QuantNet mark.
- Claude/Anthropic certificate mark.

These should use existing public assets where possible:

- `/brand/unsw/unsw-crest.png`
- `/brand/wqu/wqu-icon.png`
- `/brand/wqu/wqu-logo.svg`
- `/brand/quantnet/quantnet-icon.png`
- `/brand/quantnet/quantnet-logo.png`
- `/brand/claude/claude-icon.png`

### Document Assets

Each document asset should include:

- `id`
- `label`
- `kind`
- `shelf`
- `href`
- `sourcePath`
- `thumbnailSrc`
- `pageCount`
- `fileSize`
- `modifiedAt`
- `role`

The existing `VERIFIED_DOSSIER_ARTIFACTS` already provides most of this contract. The upgrade should make those assets more visually central instead of treating them as metadata behind text cards.

### Course Assets

Each course should have:

- Course code.
- Source folder.
- Institution.
- Representative files.
- File count.
- Visual state: active, connected, incomplete, or reference-only.

For the first pass, use ECON 3202 as the featured proof case, with FINS 3666 and MATH 2991 available inside the Trading canvas.

### Process Assets

Process assets should represent state transitions rather than paragraphs:

- Sources collected.
- Draft created.
- Answer published.
- Digital Me canvas generated.

These should become compact, reusable flow rows or nodes.

## Home Composition

Home should become a proof-rich profile front page, not a text-heavy explanation page.

### Layout

- Top nav: Loom, About, Education, Experience, Digital Me.
- Left identity area: profile image, name, role, location, public links, memberships.
- Main area: visual proof grid with real source assets.
- Right or lower area: active proof case, using document previews and process nodes.

### Required Changes

- Reduce long explanatory sentences in the hero.
- Replace repeated text cards with asset-backed rows.
- Show 3-5 high-value proof objects:
  - About me document.
  - ECON 3202 problem set.
  - ECON 3202 lecture deck.
  - QuantNet Python Foundations.
  - Claude certificate or WQU record.
- Keep Loom history compact and secondary.
- Keep Draft visible only as a production state or recent artifact, not as top-level navigation.

### Success Criteria

Home should feel like a real profile with inspectable evidence. A viewer should understand Loom's credibility through visible files, logos, thumbnails, and process states before reading long descriptions.

## Digital Me Composition

Digital Me should become the product's interactive identity surface, not a page that explains what Digital Me is.

### Layout

- Hero: compact title and one-line definition.
- Mode rail or segmented control: Answer, Canvas, Portfolio, Process, Action.
- Main active canvas: show Trading as the first example.
- Evidence side: show source files, course links, and document previews that ground the active canvas.
- Output area: show the cited answer sample and its source badges.

### Trading Canvas

The first canvas should connect:

- Trading Knowledge:
  - FINS 3666
  - MATH 2991
  - ECON 3202
- Programming:
  - Python
  - C++
- Experience and Process:
  - Problem-set reasoning
  - Source-to-answer workflow
  - Personal direction

This should render as a visual map or structured canvas, not as a paragraph list.

### Success Criteria

Digital Me should show that a topic can turn into a structured presentation from the user's knowledge and experience. It should not read like a chatbot panel or a static About page.

## UI Asset Components

Create or refine these reusable primitives:

- `ProfileAsset`: renders a real profile photo with identity metadata.
- `InstitutionBadge`: renders real institution marks and labels.
- `FileBadge`: keeps file extension visible for PDF, Word, PPT, Excel, HTML, Markdown, and text.
- `DocumentPreviewAsset`: renders thumbnail, file badge, metadata, and source path.
- `CourseAssetRow`: renders course code, institution, folder, file count, and active proof.
- `KnowledgeCanvasNode`: renders a topic node with linked source assets.
- `ProcessStepAsset`: renders Sources, Draft, Answer, and Digital Me states.
- `CitationAssetStrip`: renders cited source files with compact thumbnails and file badges.

These should avoid nested cards. Use rows, strips, panels, dividers, and real assets before adding decorative surfaces.

## Data Flow

The first pass should reuse existing verified dossier data where possible:

- `VERIFIED_DOSSIER_PROFILE`
- `VERIFIED_DOSSIER_ARTIFACTS`
- `VERIFIED_DOSSIER_PRESENTATION_CATEGORIES`
- `VERIFIED_DOSSIER_DIGITAL_ME_MODES`
- `VERIFIED_DOSSIER_DIGITAL_ME_CANVASES`
- `VERIFIED_DOSSIER_WORKBENCH`

If a new manifest is needed, it should be derived from or composed with this data, not duplicated manually across pages.

## Visual Rules

- Real assets first, decoration last.
- Avoid repeated explanatory copy.
- Avoid cards inside cards.
- Use true file and institution visuals wherever possible.
- Use source path, file metadata, and thumbnails as proof.
- Keep typography restrained and product-like.
- Keep all visible UI copy in English.
- Avoid making Loom feel like a toy demo.

## Testing

Add or update tests to verify:

- Home and Digital Me render asset-backed components, not only text markers.
- Top nav remains About, Education, Experience, Digital Me.
- Draft does not return as a top-level nav item.
- Each featured document asset has a file kind, source path or href, and visible badge.
- Digital Me Trading canvas renders course, programming, and process asset groups.
- No Chinese characters appear in the rendered Home or Digital Me copy.
- Browser smoke test on `http://127.0.0.1:3000/` and `/digital-me` shows no framework overlay and no console errors.

## Implementation Order

1. Add asset manifest helpers or extend existing verified dossier data.
2. Build reusable asset primitives.
3. Replace Home text-heavy category cards with asset-backed proof composition.
4. Replace Digital Me explanatory sections with mode-driven canvas and evidence assets.
5. Tighten CSS and responsive behavior.
6. Run targeted tests, typecheck, and in-app browser verification.

## Open Decisions

All decisions below are intentionally resolved for this pass:

- Use existing real assets before generating new images.
- Use ECON 3202 as the featured proof case.
- Use Trading as the first Digital Me canvas.
- Keep About, Education, Experience, and Digital Me as the primary public IA.
- Keep Sources and Draft as underlying product layers, not top-level homepage categories.

## Definition of Done

The pass is done when Home and Digital Me visibly rely on real assets, not long explanatory text. The user should be able to recognize Loom as a serious personal knowledge identity product from the first viewport, with proof objects and source-backed visuals carrying the product story.
