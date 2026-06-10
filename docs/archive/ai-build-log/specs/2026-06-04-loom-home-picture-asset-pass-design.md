# Loom Home Picture Asset Pass Design

## Goal

Upgrade the Loom home page from a text-marked structure into a presentation-quality personal homepage. The page should show Yiping through real visual evidence first, then use concise UI modules to reveal the source-backed system behind it. Text remains as labels and captions only; it should not carry the design.

## Current Problem

The current homepage has the right information architecture: About, Education, Experience, and Digital Me. The visible surface is still too dependent on mark text:

- Category cards explain rather than show.
- Education and proof areas rely on file names and counts instead of recognizable visual evidence.
- Loom is described in prose instead of appearing as a compact trust mechanism.
- Digital Me is conceptually stronger, but still needs UI assets that demonstrate answer, canvas, portfolio, process, and action modes.

## Design Direction

Use a three-layer upgrade sequence:

1. Picture assets: real images, source thumbnails, certificate previews, school/course visuals, project visuals, and profile photos.
2. UI assets: reusable visual modules such as source shelves, artifact strips, certificate rails, project proof tiles, answer cards, and canvas previews.
3. Presentation composition: arrange those assets so the homepage reads as a credible personal identity interface, not an internal product dashboard.

## Homepage Structure

### First Viewport

The first viewport should be a personal presentation stage:

- Left: profile photo, name, role/location, profile links, primary action to Digital Me, secondary action to Sources.
- Right: four visual entry modules for About, Education, Experience, and Digital Me.
- Each entry module must include at least one visual asset or UI asset, not just a text card.
- Loom appears through the wordmark and a compact trust layer below the first viewport, not as a separate product pitch.

### About Module

Show identity with visual evidence:

- Profile photo or portrait crop.
- About document preview or identity note preview.
- Short caption: identity, public context, direction.

### Education Module

Show learning through recognizable assets:

- UNSW crest, WQU logo, QuantNet logo, Claude certificate mark.
- Course shelf preview with at least UNSW as the primary shelf and course folders underneath.
- One or two real document thumbnails from ECON3202 or other course material.

### Experience Module

Show work and process:

- Project artifact preview, code/project screenshot, or process output preview.
- If no final work image exists, use a structured process UI asset made from real files and source paths.
- Avoid generic project claims without proof.

### Digital Me Module

Show capability as UI:

- A compact answer card with cited sources.
- A topic-to-canvas preview, preferably using Trading as the first example.
- A mode strip for Answer, Canvas, Portfolio, Process, and Action.

## Asset Rules

- Use real local assets whenever available.
- Store all Loom-specific source assets inside the Loom folder, preferably under `public/`, `resources/`, or an archive/source folder with a clear name.
- Do not leave temporary screenshots in `/Users/yinyiping/Desktop/Private Wiki`.
- Generated QA screenshots belong under `LOOM/archive/screenshots/...` and should remain ignored.
- Temporary `/tmp` assets should be deleted after use unless needed for inspection.

## UI Asset Inventory

Create or reuse these visual modules:

- `ProfileVisual`: portrait plus identity metadata.
- `EducationShelfPreview`: school logos plus course-folder strip.
- `ArtifactPreviewRail`: 2-4 real source thumbnails.
- `ExperienceProofTile`: project/process visual with source-backed caption.
- `DigitalMePreview`: answer card plus canvas route preview.
- `LoomTrustStrip`: Sources -> Draft -> Digital Me, compact and secondary.

## Copy Rules

- Keep visible text short.
- No long lists of filenames on homepage cards.
- File names may appear inside proof rails, source previews, or detailed pages.
- Use labels such as `source files`, `course folders`, `cited answer`, `canvas`, and `process`.
- Avoid in-app tutorial language and product explanation paragraphs on the homepage.

## Implementation Boundaries

The next implementation pass should focus only on the homepage and directly supporting data/assets:

- `components/verified-dossier/VerifiedDossierHome.tsx`
- `app/globals.css`
- `lib/new-loom/verified-dossier-home.ts`
- focused homepage contract tests
- new assets under Loom-owned folders only

Do not rewrite all section pages in this pass. Digital Me can receive small support changes only if needed to make the homepage preview honest.

## Verification

Run:

- targeted homepage contract tests
- Digital Me contract tests if touched
- `npm run typecheck -- --pretty false`
- browser verification at desktop and mobile widths

Visual checks must confirm:

- first viewport has real visual assets, not just text cards
- no horizontal overflow on mobile
- no clipped labels
- no scattered `loom*` files in `/Users/yinyiping/Desktop/Private Wiki`
- QA screenshots are inside ignored Loom archive folders

## Out Of Scope

- Full source importer acceptance.
- Live provider-output acceptance.
- Rebuilding the Mac app.
- A new public marketing page.
- Figma or generated-image concepting unless explicitly requested as a separate visual exploration.
