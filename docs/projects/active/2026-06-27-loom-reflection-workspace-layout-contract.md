# Loom Reflection Workspace Layout Contract

**Date:** 2026-06-27
**Status:** Active native shell contract
**Scope:** Native macOS Reflection workspace only. This contract does not redefine Sources, Studio, or Digital Me.

## Product Split

Loom Reflection v1 is the second-pass workspace for a broader sidecar-first
product. Loom is not the primary file viewer. It is an external learning and
thinking layer that attaches traces to original files while preserving native
PDF, Excel, Word, and macOS capabilities.

This shell contract covers the Loom synthesis and reflection surface. When the
user is actively reading a file, the original file remains the main surface and
Loom must stay visually subordinate.

It is not a skill surface, portfolio, KaaS page, Digital Me profile, or cloned
document editor. The product loop for product reflection is:

1. Input - what happened.
2. Assumption - what had to be true.
3. Decision Trace - why a path won.
4. Outcome - what reality returned.
5. Reflection - what changed in judgment.
6. Judgment Memory - what should be reused.

## Functional Zones

The app shell has four zones with non-overlapping jobs:

| Zone | Job | Must not do |
|---|---|---|
| Titlebar | Window-level status, current case, source count, sidebar and Sources toggles | Own pane-specific content or large tool pills |
| Left sidebar | Reflection list, search, new reflection, local status | Show source evidence or main reasoning |
| Center workspace | Reflection trace, composer, and sidecar record for the current original file | Become a dashboard, marketing page, or low-fidelity PDF clone |
| Right Sources pane | Local import, Sources, source filters, selected source preview | Become a second editor, decorative dashboard, or permanent reader companion |

## Codex Reference Reading

The reference image is not a generic three-column layout. Its product logic is:

1. Left rail: persistent navigation, project memory, account state. It is visually rich but functionally lightweight.
2. Center workstream: the live reasoning/log surface, active input, or currently promoted material. It carries the user's current task.
3. Right material pane: concrete files, document context, and source preview in Reflection Mode.
4. Top chrome: native traffic lights plus small workspace controls. It does not become a full-width toolbar block.

For Loom this maps to:

1. Left rail: reflection cases and local state.
2. Center workstream: the six-part judgment trace, composer, and current sidecar record. The original file lives in its native app.
3. Right material pane: Sources evidence, filters, and selected source preview in Reflection Mode.
4. Top chrome: window state, case identity, source count, and pane toggles only.

Local import is a Sources-pane action. It should create source evidence for the
current reflection case, select that source, and append a concrete Input trace
entry. It must not open a separate dashboard, create a second editor, or change
pane collapse behavior.

Sidecar Mode is the exception to the old "Sources stays on the side" rule. When
a PDF or local source becomes the current subject, Loom opens the original file
in its native app and hides nonessential Loom panes so the file remains
dominant. Loom must preserve Preview, Excel, Word, browser, and macOS document
affordances rather than rebuilding weaker custom viewers.

The Sidecar Mode hierarchy is file first, Loom second. The PDF page,
spreadsheet, document, slide, or browser content must receive the most space and
the clearest visual weight in its own app. Loom sidecars act like contextual
memory affordances: capture word, pronunciation, phrase, grammar, idiom,
translation, page gist, question, concept, product evidence, or reflection
trace. They must not become permanent panes that compete with the file.

For native macOS, Sidecar Mode means `NSWorkspace` opens the original file in
the user's default app. Preview/default PDF apps own table of contents,
thumbnails, highlights, bookmarks, contact sheets, one-page/two-page states,
continuous scroll, Look Up, Translate, Copy, Writing Tools, Summarize, Services,
search, zoom, page layout, annotation, share/open, and selection. If Loom uses
`SourceFileView` for a legacy or fallback route, it must keep the PDFView responder chain and system context menu intact.
Loom actions may be added beside system menu items only if `super.menu(for:)`
remains the source of the menu.

Native selection capture enters Loom through macOS Services and the system
pasteboard. The Service label is "Capture Selection in Loom"; it appends the
selected passage to the current sidecar Input trace. It must not install a custom PDF reader,
intercept Preview's responder chain, or hide the original Look Up, Translate,
Copy, Writing Tools, Summarize, Services, search, zoom, and page layout actions.

## Proportion Standard

Baseline desktop window: 1320 x 860 pt. Reflection workspace minimum: 1184 x 720 pt. File Sidecar minimum: 560 x 620 pt. The layout must still feel correct when wider.

Codex reference image measured at 3456 x 2048 px, or roughly 1728 x 1024 pt on Retina. Its major vertical pane seams are about x=240 pt and x=1140 pt, giving a left navigation rail near 240 pt, a center work/conversation area near 900 pt, and a right material/file area near 575 pt. Loom should preserve that functional weighting rather than copying every pixel: the left rail is navigation, the center is the thinking thread, and Sources deserves a real material area instead of a narrow auxiliary strip.

| Measure | Standard | Reason |
|---|---:|---|
| Default window | 1320 x 860 pt | Product screenshots and first-run windows use one baseline instead of restored accidental sizes. |
| Reflection minimum window | 1184 x 720 pt | Keeps the fixed rails and a readable center work area from collapsing into each other. |
| File Sidecar minimum | 560 x 620 pt | Lets Loom stay visually subordinate beside a native PDF, Word, Excel, or browser window instead of covering the source. |
| Titlebar height | 52 pt | Matches the Codex-like hidden-toolbar shell and clears native traffic lights. |
| Titlebar controls | 16 x 16 pt | Same visual scale as macOS traffic lights; no independent pill background. |
| Titlebar control center line | 16 pt | The sidebar toggle, center title cluster, and Sources toggle share the native traffic-light center height. |
| Titlebar control top inset | 8 pt | Derived from the 16 pt center line and 16 pt control size; do not tune this independently. |
| Traffic-light clearance | 88 pt | Keeps the left titlebar toggle after the native traffic-light cluster without touching the green button. |
| Left sidebar width | 240 pt | Fixed desktop navigation rail matching the Codex reference weight; the left rail must not become a primary content column. |
| Right Sources width | 400 pt default, drag-resizable 320–560 pt (persisted) | Sources is a material/evidence area, so it needs more width than a narrow inspector while staying smaller than the center work area; the seam between the center and the Evidence pane drags to resize, and the width persists per user. |
| Center workspace | Flexible remainder | The middle owns all extra width after fixed rails. In Sidecar Mode it owns the Loom record while the native app owns the file. |
| Thread max width | 720 pt | The reasoning column and composer share one reading axis close to Codex chat density. |
| Sidebar body top inset | 72 pt | The sidebar material begins at the window edge, while the first action clears the traffic-light/titlebar row. |
| Thread body top inset | 76 pt | The reasoning column starts below the overlaid titlebar without creating a separate header band. |
| Inspector body top inset | 74 pt | Sources search starts below the overlaid titlebar without a pane header. |

Derived baseline at 1320 pt wide:

| Column | Width | Share |
|---|---:|---:|
| Left sidebar | 240 pt | 18.2% |
| Center workspace | 680 pt | 51.5% |
| Right Sources pane | 400 pt | 30.3% |

At wider desktop sizes the fixed rails stay stable and the center workspace absorbs the extra width. The thread remains centered inside the center workspace and never stretches past 720 pt.

In Sidecar Mode, the left sidebar and fixed right Sources pane may collapse so
the original file app has enough width and visual priority. This is not a pane
toggle exception; it is a subject change from reflection trace to source
reading. Loom records should stay in the Loom window or a future lightweight
sidecar surface. They should never force another permanent pane over the
document.

Single-page, continuous, two-page, zoom, translate, lookup, copy, writing
tools, and services are file-reader states or macOS services, not Loom feature
clones. The layout may use available margin space in future, but it must not
cover the page, replace Preview/default app controls, or force another
permanent Loom pane when the document needs the space.

During native-file learning, the main Loom workspace stays parked after the
companion appears. The acceptable visible state is the original app's window
plus a compact Loom Companion panel. Review in Loom is the explicit transition
back to the full workspace.

The companion must keep the original file as the primary continuation path.
Back to Source restores the originating native app/process when possible; Open
Source opens the original file with the system-default app after import. Review
in Loom remains the explicit second-pass route and should not be the only
visible action.

Each capture must be anchorable back to the original file context: file URL or
content identity, page or region when available, selected text when available,
learning pass, trace type, and user meaning. Unanchored notes are allowed only
as fallback; they are not the core Loom interaction.

Verified v7 screenshot `/tmp/loom-reflection-window-v7-proportions.png`: inner window width is about 1320 pt, pane seams land at about 240.5 pt and 918.5 pt, yielding roughly 240 / 678 / 401 pt. This is within the intended reference-derived target.

## Collapse Standard

Sidebar and Sources toggles live only in the titlebar. There are no floating rail buttons, bottom bars, or duplicate pane headers.

When the left sidebar is collapsed:

- Sidebar width becomes 0.
- The left titlebar toggle remains after the 88 pt traffic-light clearance.
- The center workspace uses the newly available width.
- The thread and composer remain centered inside the available workspace.
- Hovering near the left edge may temporarily overlay the sidebar at 240 pt as
  a peek, without changing the permanent collapsed state.
- While the pointer remains inside the slid-out sidebar, the sidebar stays
  visible. When the pointer leaves the sidebar, it returns to collapsed.
- The peek overlay must not move the center workspace, the right Sources pane,
  the pane seams, or the titlebar layout.
- The peek overlay glass must use the center workspace background as its
  transparent material base. It must not reuse the permanent left-rail material
  as the visible backing.
- The peek overlay's internal chrome must also use center-pane hierarchy:
  buttons, search, selected rows, row metadata, and delete affordances should
  read as a temporary layer over the workspace, not as the permanent rail
  stretched over the center.

When the right Sources pane is collapsed:

- Inspector width becomes 0.
- The right titlebar toggle remains at the trailing edge.
- The center workspace uses the newly available width.
- No empty right gutter remains.

## Material Standard

The whole workbench may use Liquid Glass, but not as one repeated effect. The
left sidebar is transparent navigation glass, the center workspace is a
matte/frosted review surface, and the right Sources pane is quieter frosted
inspector glass. All three follow the system color scheme.

The workbench materials start at the window edge and run behind the titlebar:

- The titlebar is a control overlay, not a layout row.
- The left sidebar glass runs behind the titlebar from top to bottom.
- The center matte surface and right frosted surface run behind the titlebar
  from top to bottom.
- Pane seams align without turning the workbench into six boxed regions. No inner rounded content shell.
- The titlebar must not draw its own material background, internal vertical separators, or a full-width hard bottom rule. Pane boundaries belong to the continuous body surfaces and remain subtle.
- Do not use decorative gradients to imitate glass; use system materials,
  restrained tints, blur, hairlines, and real surface hierarchy. A single
  restrained specular highlight may be used only to express glass edge thickness
  or refraction.
- macOS 27-style white light and small red/gold/blue separation belong to
  interaction feedback: commit fields, submit buttons, loading dots, saved
  receipts, and status transitions. They must not become sidebar wallpaper,
  center-pane wash, right-pane wash, or document-background animation. They are
  one-shot points of emphasis, not a persistent visual language applied to
  every hover state.
- The center workspace may be matte/frosted, but it cannot own prism light,
  moving glare, persistent glow, or animated color wash. It must remain the
  stable review surface.
- The right Sources pane may be frosted inspector glass, but it cannot own
  action-light effects as decoration. It stays quieter than the current
  understanding object.
- Optical light is reserved for moments of action, not the workspace theme.
- The learning center default is the organized understanding object, not the
  process name. Show the selected word, phrase, sentence, data point, user
  meaning, question, correction, or principle first; show source position as a
  quiet anchor; keep capture receipts, version counts, and raw evidence labels
  folded behind the capture trail or details.
- The learning composer is a quiet document-edge note field, not a message box,
  not a fixed bottom bar, and not a second toolbar. The default state shows one short input
  and icon-only submit near the document boundary. Type choice (`Meaning`,
  `Ask`, `Fix`, `Keep`), source anchor, and assist controls appear only when
  ambiguous, focused, or opened through details. Full source metadata belongs in
  tooltip, aria-label, Evidence, or audit details, not repeated beside the text
  field.

## Rejection Tests

Reject a build if any of these appear:

- A second pane header below the shared titlebar.
- A bottom status bar duplicating titlebar state.
- Large pill-shaped titlebar controls.
- Center content stuck to the left when side panes collapse.
- Glass material on the center workspace or right Sources pane.
- A black top strip sitting above the sidebar glass.
- Full-width titlebar rules that split the workbench into six visible rectangles.
- A titlebar background view that creates a separate top row.
- Animated colored light across the sidebar, center workspace, right evidence
  pane, or document content instead of on input/loading/status feedback.
- Persistent glow on normal selection rows, source rows, or review content that
  makes the record compete with the original file.
- Visible learning-default copy such as `Receipts`, `Needs human meaning`,
  `Understanding Version Flow`, or `Evidence Inspector` when the same state can
  be expressed by the content, a source icon, a quiet status dot, or folded
  details.
- A learning composer that repeats the full filename, page metadata, assist
  explanation, or a worded `Commit` button in the primary row when the same job
  can be handled by a compact anchor, tooltip, aria-label, and submit icon.
- A learning composer that is fixed to the bottom edge and visually splits the
  center pane into a third region.
- A custom PDF canvas/image reader replacing Preview or the user's default file
  app as the primary macOS surface.
- A Loom PDF context menu that omits `super.menu(for:)` and therefore loses
  Translate, Look Up, Writing Tools, Services, Copy, search, zoom, or page
  layout behavior.
- A selection-capture route that bypasses macOS Services/pasteboard and asks
  users to relearn document selection inside Loom.
- A reading surface where Loom sidebars or cards visually dominate the original
  document.
- A learning capture that cannot return to the file, page, selected text,
  region, pass, or trace type.
