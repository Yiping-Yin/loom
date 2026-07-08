# Loom — Product Rules & Engineering Protocol

> **Read this BEFORE starting any work on Loom.**
> This document captures the accumulated product decisions, hard vetoes, and design rules made over many design sessions with the product owner. It exists so any AI assistant (Codex, GPT, Gemini, etc.) — and any human collaborator — can pick up the work without re-litigating settled questions.
>
> ⚠️ **Vocabulary status (2026-06-27 · v1.2 §III.7):** For **user-visible UI copy** the canonical naming source is now [`docs/loom.md`](docs/loom.md) §III.7 and the active product-definition note. The current shipped user-visible model uses `Sources`, `Studio`, and `Digital Me`. `Draft` may remain in route names, storage APIs, tests, and older docs when it means the Studio-compatible document engine, but it is not the primary user-facing product noun. Superseded 2026-05 vocabulary such as `Sources / Draft` and `Collect / Organize / Draft` is historical only, and the *kesi* metaphor (`Shuttle / Weaves / Sōan / Pursuits / Patterns / weaver / panel`) is not user-visible copy. V12 below has been amended to retract the prior grandfathering of `weave / panel`. Architecture and engineering protocol in this file remain authoritative; only feature-naming has shifted.
>
> **This is a living document.** Update it after every session in which a meaningful decision is made or a recurring feedback pattern emerges. Do not delete past entries; mark them superseded.
>
> **Maintained by:** the AI assistant currently working on Loom. The product owner approves substantive additions; small clarifications and decision-log entries can be added unilaterally.

---

## 1. What Loom Is — In One Paragraph

Loom is a local context-to-form workspace. It helps anyone turn scattered
sources, learning paths, projects, drafts, and AI conversations into
source-backed forms: portfolio explanations people can inspect, knowledge
artifacts people can trust, and a Digital Me that answers from the real archive.
Yiping's Loom is the first reference instance, not the product boundary.

Loom is a macOS-native thinking surface that treats the **screen as a replacement for paper** wherever source-grounded work needs to become durable identity. University-level study is Yiping's first reference use case, not the product boundary. The user picks folders or creates pages; Loom shows source files (PDFs, etc.) natively, lets the user select passages and respond in writing or via AI dialogue, and stores everything in portable Markdown the user owns. The app's job is to remove operation friction (no syncing, no organizing) and concept friction (AI summoned for explanation, translation, dialogue) so the user spends time *thinking* rather than *managing*.

Loom is **not** a Notion clone, Notability replacement, or research-management tool. It is a *thinking surface anchored to sources*.

---

## 2. North Star Principles

Each principle is load-bearing. When a feature contradicts a principle, the feature is wrong, not the principle.

1. **Learn, don't organize.** Notes are byproducts of learning, not the object. The system MUST NOT reward collection-as-an-end. Adding small intentional friction (e.g. "did you have a thought about this?") is a feature, not a bug.

2. **Source is authority.** The user's source files (PDFs, .docx, folders) are READ-ONLY. Loom never writes into the user's picked folders. Loom-managed data lives separately in `LoomFileStore`.

3. **No workspace pollution.** Loom work must not leave generated files,
   screenshots, temp PDFs, verifier fixtures, or helper scripts in the user's
   original folders such as `Private Wiki`. Temporary artifacts either live
   under the Loom repo's `.codex/` workspace or are deleted immediately after
   use. Native GUI verification must also clean old `/private/tmp/loom-*`
   bundles and unregister stale temporary `Loom.app` Services so macOS menus do
   not drift.

4. **Loom = pages.** The page (a `ContentRoot`) is the primary unit of meaning. Pages contain notes. Notes are anchored fragments. Pages are addressable, notes are not (until promoted).

5. **AI is summoned.** AI is summoned, never always-visible chrome. Curiosity-led - the user asks AI; AI never quizzes the user. Any future review, practice, or testing surface needs an explicit product contract before it can appear.

6. **One primitive over many.** When two surfaces overlap functionally, collapse to one with progressive paths inside, even if it costs an extra click. Mental clarity > click count.

7. **Lean on macOS.** The system already provides Translate, Look Up, Writing Tools, Speech, Share via right-click on selected text. Loom adds only what macOS doesn't. Do not duplicate system features.

8. **Source fidelity.** Loom's sidebar mirrors the Finder tree the user picked. No auto-clustering, no silent flattening, no smart folders. The user already paid the organizing cost.

9. **Extract, don't author.** If information is in the source (syllabus, slides), AI extracts at ingest. The user corrects inline. Loom is not a Notion-style block editor.

10. **Apple-native aesthetic.** macOS feel: NavigationSplitView, native context menus, system materials, system fonts. Triangulate against (a) Loom's product philosophy, (b) Apple aesthetic, (c) App Store distribution goal — all three must agree.

11. **Markdown files the user owns.** All Loom-managed data is plain Markdown in a known location. Future iCloud sync friendly. No proprietary database.

---

## 2b. Reflection / Sidecar Design Discipline (Locked 2026-06-28)

Canonical detailed discipline lives in
[`LOOM_DESIGN_DISCIPLINE.md`](LOOM_DESIGN_DISCIPLINE.md). This section is the
compressed operating rule for day-to-day product work.

This section governs the current Loom direction: external learning sidecar,
Understanding Version Flow, and repeated-pass review. It does not erase earlier
source-grounded substrate rules; it tightens how new design work is chosen.

Every Loom design change must be written as a choice under constraint, not as a
feature addition. Before implementing, answer:

1. **What already exists?** macOS, Preview, Word, Excel, browsers,
   NotebookLM-style source collections, AI chat, LaTeX, Circle-style packet
   builders, and `loom-notes`-style active recall packets already solve many
   parts of the workflow.
2. **What baseline must Loom match?** Users must not lose speed,
   completeness, native file functions, structured readable output,
   source-grounded summaries, Q&A, glossary, timeline, briefing, study guide,
   clean PDF / Markdown export, Word/PPT packet, dynamic HTML dossier, or
   video/scripted walkthrough when that form fits the job.
3. **What is Loom's unique job?** Preserve anchored learning traces,
   pass history, understanding diff, correction history, judgment memory, and
   reusable thinking formed from repeated use. Learning and review are one
   compounding flow, not two disconnected ledgers.
4. **What are we refusing?** Reject weaker clones of Preview, Word, Excel,
   NotebookLM, AI chat, static note apps, dashboards, mind maps, and debug logs.
5. **What proves it worked?** The user can keep using the original app while
   Loom records a replayable understanding version that can continue into
   correction, review, synthesis, memory, and export without switching into a
   separate product mode.

Loom requirements have three layers and the layers must not be confused:

- **Preservation:** keep native file and macOS capabilities intact.
- **Baseline:** match or integrate mature outputs such as clean A4 PDF,
  Markdown, Word/PPT packets, dynamic HTML dossiers, video/scripted
  walkthroughs, study guides, Q&A, glossary, timeline, briefing,
  `loom-notes`-style active recall packets, and source-grounded summaries. The
  floor is a Circle-style course packet plus a fill-in study packet: title,
  source/provenance, learning objectives, key concepts, agenda, sections,
  readable typography, spine, fill-in prompts or review gaps, and page-aware
  review.
- **Differentiation:** spend Loom surface area only on the user's understanding
  versions, pass history, corrections, judgment memory, and reusable thinking.
  Learning and review are one compounding flow, not two disconnected ledgers.

If Loom skips preservation, it breaks trust. If it skips baseline output, it
feels weaker than existing AI tools. If it skips differentiation, it becomes a
clone.

The atomic Loom unit is **understanding version**, not note. A valid capture or
manual entry preserves source anchor, pass, trace type, user meaning, and state.
Raw metadata may exist for audit, but the visible object must read like a human
learning or judgment record.

Learning captures are not append-only notes. The review surface must consolidate
smaller traces into larger understanding objects when the source context proves
they belong together. Example: if a user first captures `market`, then `making`,
then `market making` from the same PDF passage, the visible object is `market
making`; the single-word translations become absorbed evidence, not three
competing final notes. This is a method example, not a translation feature.
The same rule applies to sentence translations, grammar patterns, formulas,
tables, figures, claims, examples, questions, corrections, concepts, and
reusable principles. Each object exposes only the user-facing fields needed for
review, plus a compact supporting trace line.

Surface duties are strict:

- Original file app owns reading, editing, page modes, search, zoom,
  Translate, Look Up, Copy, Writing Tools, Summarize, Services, annotation,
  formulas, comments, and file-specific workflows.
- Loom Companion owns lightweight confirmation and return paths; it must remain
  subordinate to the original file.
- Center workspace owns Understanding Spine inside Understanding Version Flow;
  it must not become a generic notes list, transcript, mind map, static PDF
  replacement, provenance log, Agent operation log, or split learning/review
  ledger. Codex records what an agent did: read file, searched code, edited
  file. Loom records how the user's understanding changed: source contact,
  first meaning, question, correction, synthesis, principle, judgment change.
- Learning center defaults to the organized understanding object, not the
  process ledger. Show the user's current understanding as a readable document:
  title hierarchy, paragraphs, selective evidence quotes, consolidated inline
  terms, and footnote-like source anchors. Version counts, capture receipts, raw
  evidence labels, and automation scaffolding stay behind Capture trail or
  Details. Internal categories may organize the data model, but visible labels
  such as `01 Current understanding`, `Understanding objects`, `Meaning`,
  `Language`, or `Principles` must not become a left-hand template column or
  default section system in the reading page.
  Grouped objects mean semantic consolidation, not a
  flat vocabulary or evidence list: larger phrases, sentences, formulas, tables,
  figures, concepts, or problems absorb their component traces when the anchors,
  pass, and user meaning show they describe the same learning object.
- Composer owns committing the next understanding version; it must not become a
  generic chat box without a version target or a fixed bottom toolbar. In
  learning mode the default shape is a quiet document-edge note field: one line
  of user language and icon-only submit. Type choice, source anchor, and assist
  controls stay hidden unless the target is ambiguous, focused, or opened
  through details. Full source metadata belongs in tooltip, aria-label,
  Evidence, or audit.
- Glass is a material system; light is momentary feedback. Center and right
  panes may use stable frosted material, but Siri-like white/prism light belongs
  only to input focus, commit, loading, saved, or short status transitions.
- Rich summaries, Q&A, glossaries, study guides, and A4 exports are baseline
  outputs. `loom-notes`-style active recall packets are baseline outputs too.
  They become differentiated only when generated from Loom's cognition trail,
  not only from uploaded files.
- The user's FINS3666 Circle packet is already fast, complete, and reviewable.
  Loom must match that Learning Output Packet floor before claiming value, then
  expose which source anchors, passes, corrections, and principles produced it.
- A rich source dossier is a baseline review / export view, not the center
  workspace. It must include source collection, generated artifacts, source
  claims, and return navigation; it becomes Loom-specific only when those
  artifacts also expose learning trail, versioned understanding, and reuse
  state.

Capability discipline:

- **Capability Ladder:** before adding a Loom feature, ask what the original app,
  macOS, or an existing AI/source tool already does better. Preserve that path
  first. Loom may add surface area only for the remaining Loom-only job:
  anchored understanding, pass history, correction, synthesis, reusable thinking,
  or export from the cognition trail.
- **Evidence Ladder:** use the strongest available evidence, then degrade
  honestly: selected text / structured file parse -> native app document
  metadata -> Accessibility app/window/page context -> Services or pasteboard ->
  Loom-owned appshot / OCR / Vision / multimodal extraction -> user-confirmed
  manual anchor. Never present a lower rung as a higher one.
- **Simplest Path Rule:** if a mature capability plus a thin Loom receipt solves
  the problem, do not build a new Loom surface. If the first approach is blocked
  by sandboxing, permissions, unavailable APIs, or source-app behavior, choose
  the smallest truthful fallback before inventing a larger product feature.
- **Missing Information Handling:** when Loom cannot obtain a file, page,
  paragraph, region, sheet, or cell directly, it must probe in order: native
  selection/structured parse, file metadata, Accessibility metadata, Services or
  pasteboard, appshot/OCR/Vision/model extraction, then user confirmation. The
  result must state its precision (`file+page`, `file`, `file+cell`,
  `visual context only`, or `manual anchor`) and confidence. Loom may use a
  clever fallback, but it may not convert missing provenance into a fake precise
  anchor.
- **Sandbox honesty:** a sandboxed Service capture may only prove selected text,
  source app, and source file. Page labels, sheet/cell labels, or paragraph
  labels are not precise anchors until an allowed AX helper, structured parser,
  appshot/OCR/Vision pass, or user confirmation supplies that evidence.
- **Source disambiguation:** frontmost app identity is not source truth. When
  Preview, Word, Excel, or a browser has multiple windows or documents, Loom
  must treat the observed app/window as weak context until Service invocation,
  file URL, source-app metadata, capture-triggered appshot, structured parse, or
  user confirmation identifies the intended file and location.
- **Wrong-window downgrade:** if a verifier or capture path observes a different
  document than the target learning file, the trace stays at `app/window/time`
  or `visual context only`. It cannot become memory or export citation until the
  user or a stronger evidence rung confirms the source.

Engineering discipline: if a UI change cannot state the existing capability it
leans on, the Loom-only gap it fills, the refusal it enforces, and the
acceptance signal, it is product noise.

Design decisions use this protocol:

`symptom -> critique -> choice -> rule -> acceptance evidence`

The user's wording is evidence, not an implementation order. First translate the
feedback into a product failure, then decide which surface owns the repair.
Every request must be classified as one of: invariant, baseline,
differentiator, refusal, or open question. Baselines are integrated or
preserved; differentiators may add Loom surface area; refusals are written down
so the same mistake does not return.

The required questioning loop is:

`request -> symptom -> objection -> baseline -> Loom-only gap -> owner -> rule -> evidence`

The objection step is mandatory. If the team cannot argue against the literal
request, it has not earned the right to implement it.

Requirements are not accepted as feature orders. Convert each request into a
decision record before building:

`observed failure -> user example -> bad literal fix -> existing capability -> chosen owner -> discipline added -> acceptance evidence`

If the record cannot name a bad literal fix, the request has not been
questioned enough. If it cannot name an existing capability, Loom is likely
about to clone a mature tool. If it cannot name one chosen owner, the UI will
split into overlapping surfaces. Every accepted choice must carry a matching
refusal, because the refusal is what keeps Loom differentiated on the next
iteration.

Every implementation pass must also preserve this shorter product record:

`classification -> preserved capability -> baseline matched -> Loom-only value -> surface owner -> refusal -> acceptance path`

"Cleaner", "more native", "more like Codex", "more like Preview", "more
NotebookLM", and "more glass" are symptoms, not requirements. They cannot be
implemented until the preserved capability, baseline, Loom-only value, owner,
refusal, and acceptance path are named.

Requirement writing is itself a product discipline. Screenshots, comparisons,
and user wording are evidence, not specs. A requirement is accepted only after
it has six parts:

`symptom -> critique -> choice -> owner -> refusal -> acceptance`

Do not start a Loom design from material, color, glass, layout, animation, or a
copied interface. Start from the job and owner:

`job -> owner -> user path -> proportion -> material -> copy -> evidence`

Vague requests such as "make it cleaner", "make it like Codex", "add Liquid
glass", "support PDF", "make NotebookLM-like output", or "add a chat box" are
not implementation-ready. They must first be rewritten into a concrete failure,
a rejected literal fix, one chosen owner, and a measurable path. This protects
Loom from becoming attractive fragments instead of a coherent product.

Before implementation, the work item must answer: what native or mature
capability is preserved, what baseline is matched, what Loom-only
thinking-history value is added, what surface owns it, what is refused, what
object is created or revised, how it will be reviewed later, how it can become
synthesis / memory / export, and what evidence proves acceptance.

Current requirement discipline from the PDF / Word / GitHub / Circle /
NotebookLM critique:

- Do not make Loom a better PDF, Word, or Excel app. Preserve native file
  functions and add understanding versions beside them.
- Do not make the center a note surface. The center exists only as
  Understanding Version Flow: first interpretation, correction, synthesis, open
  issue, and reusable principle.
- Do not keep the composer if it cannot name the next commit target. Meaning,
  question, correction, synthesis, principle, or reflection stage must be known
  before typing.
- Do not claim static or rich output as the moat. Clean A4 PDF, Markdown,
  Word/PPT packet, dynamic HTML dossier, video/scripted walkthrough, study
  sheet, Q&A, glossary, briefing, and source-grounded summary are baseline.
- Do not turn the center workspace into a LaTeX worksheet editor.
  No turning the center workspace into a LaTeX worksheet editor.
  `loom-notes`-style active recall is a baseline output pattern; Fill-in
  prompts trace back to source anchors, learning pass, correction, or memory
  candidate.
- Do not stop at NotebookLM-style source richness. Rich artifacts become Loom
  only when they also expose source anchors, learning trail, understanding diff,
  pass history, and reuse state.
- Do not convert every capture into memory. Memory is user-confirmed reusable
  thinking after second-pass review.
- Do not explain the product in the main surface. User-facing entries should
  look like compact human learning records; metadata and product logic belong
  in audit trail, PRD, or documentation.

Every serious design pass leaves a design choice ledger:

`observed issue -> chosen rule -> refusal -> acceptance signal`

If the ledger is missing, the change is not yet a Loom requirement.

The current design constitution:

- The original file is the subject; Loom is the learning and reflection layer
  around it.
- A native capability is cheaper than a Loom clone unless Loom adds an
  understanding version on top.
- When information cannot be obtained directly, Loom follows the Evidence Ladder:
  preserve the strongest evidence available, label the precision, and ask for
  user confirmation rather than pretending.
- The simplest path wins. A thin capture receipt over a mature native feature is
  usually better than a custom Loom clone.
- The center workspace earns its existence only by showing how understanding
  changed across passes: source contact -> first meaning -> question /
  correction -> second-pass synthesis -> reusable principle.
- A capture is valid only when it preserves anchor, pass, trace type, user
  meaning, and state.
- The composer is not a chat box; it commits or revises the next understanding
  version.
- Static output and NotebookLM-style richness are baseline exports. Loom's edge
  is rich source aggregation plus the user's learning trail and thinking
  evolution.
- Source collection plus generated artifacts is baseline; source collection
  plus generated artifacts plus understanding evolution is Loom.
- A design that cannot be tested through a real user path is an illustration,
  not a product improvement.
- Every roadmap item must name both the baseline it protects and the Loom-only
  moat it advances.

Source precision is part of the baseline trust contract. A native app with many
open documents can keep all its own functions and still give Loom ambiguous
context. Loom does not fail by being uncertain; it fails only if it pretends
uncertainty is a precise anchor.

The center workspace presents **Understanding Review** (`理解复盘`) backed by
**Understanding Version Flow** (`理解版本流`). It must show the current review
focus and compact human learning / judgment records first, with provenance
behind an audit trail. "Learning version" and "review version" are not separate
products; they are neighboring commits in the same flow. The document-edge
composer appears only when it has a version target: meaning, question,
correction, synthesis, principle, or a specific product-reflection stage. A
generic free-form chat box is rejected unless it is inside an explicitly labeled
AI conversation trace.

Current precedent:

- PDF learning uses Preview / native PDF apps as the reader. Loom captures
  anchored learning versions; it does not rebuild page modes, Translate,
  Look Up, Copy, Writing Tools, Summarize, Services, search, zoom, or
  annotation.
- Center workspace quality is judged by whether the user can see the continuous
  path from first understanding to review to reusable thinking.
- The composer is a commit affordance. Before typing, the user must know which
  understanding version the text will revise or become.
- Exports must be fast, complete, and readable, but must also preserve source
  claim, learning trail, understanding diff, and reusable principle when those
  exist.
- Excel, Word, and other native files keep their own editing, formulas,
  comments, review, and version tools. Loom records why a file state mattered
  to learning or judgment.
- If exact source metadata is blocked by sandboxing, source-app APIs, or
  permissions, Loom falls back to app/window/time, appshot/OCR/Vision/model
  candidates, or user-confirmed anchors with explicit precision labels. It does
  not fake file/page/cell certainty.

---

## 3. Hard Vetoes (Never Do)

These are absolute. If you find yourself building one of these, stop and re-read this section.

| # | Veto | Why |
|---|------|-----|
| V1 | **Never write to user-picked folders.** | Source is authority; user's files are read-only. All Loom data lives in `LoomFileStore` (`~/Library/Containers/com.yinyiping.loom/Data/Documents/Loom Data/`). |
| V2 | **No keyboard shortcuts for low-frequency operations.** | Visible buttons or menu items beat invisible shortcuts. ⌘[ / ⌘] for back/forward and ⌘↩ for save-in-popover are the only acceptable shortcuts as of 2026-04-26. |
| V3 | **No always-visible AI chrome.** | AI is summoned per action, never sitting in the UI waiting. |
| V4 | **No quizzing the user.** | Direction is user→AI, not AI→user. Quiz/SRS modes are reserved for a future practice/review feature with an explicit product contract. |
| V5 | **No automatic clustering, tagging, or smart folders.** | The user's manual organization IS the organization. |
| V6 | **No proprietary file formats or databases.** | Markdown only, in plain files. |
| V7 | **No silent failures.** | Every action shows a toast, error, or visible state change. Empty quiet failure is forbidden. |
| V8 | **No `## Notes` / `## Threads` / `## Pursuits` separation.** | Activity is grouped **per book** (per source file), not per activity-type. One section per source, all activity inline. |
| V9 | **No `List + .listStyle(.sidebar)` for the sidebar.** | Use `ScrollView + LazyVStack` always. List eats button clicks after the first selection. |
| V10 | **No automatic page-promotion thresholds.** | Promotion (note → standalone page) is always a deliberate one-click action. The system never decides for the user. |
| V11 | **No duplicate UI for the same outcome.** | If a feature exists in the system right-click menu (Translate, Look Up, Speech), do not also add it as a Loom menu item. |
| V12 | **No metaphor-laden feature names.** | Labels and status copy are literal. **Updated 2026-05-12 by `docs/loom.md` §III.7**: the prior grandfathering of `weave / panel` is **RETRACTED**. All *kesi*-metaphor vocabulary (`Shuttle / Weaves / Sōan / Pursuits / Patterns / weaver / panel`) is now deprecated for user-visible copy. Internal code module names (e.g. `InterlaceInstaller`) are unaffected. |

---

## 4. Architecture (As of 2026-04-26)

### Data model

```
ContentRoot {
  id: UUID
  displayName: String
  description: String
  externalFolderBookmark: Data?   // nil = pure page; non-nil = folder root
  parentID: UUID?                 // nil = top-level; non-nil = nested sub-page (legacy)
  addedAt, updatedAt
}
```

- **Folder root**: user picked a folder via `+ Folder`. `externalFolderBookmark` non-nil. Loom shows its file tree.
- **Pure page**: user created via `+ Page`. `externalFolderBookmark` nil. Just a Markdown page.
- **Sub-page (legacy)**: created via the now-removed Extend gesture. `parentID` non-nil. Renders nested in sidebar.
- **Promoted page**: created via "Promote to new page…" on an inline note. **Top-level** (parentID nil), not nested.

### File layout

- **User's source folders**: untouched. Loom uses security-scoped bookmarks to read.
- **Loom-managed data**: `LoomFileStore.loomMDURL(for: rootID)` → `<file-store>/<root-id>/Loom.md`.
- **Loom.md structure**: `## Resources` (auto-folder listing) + one `## <filename>` section per source containing all activity for that source.

### Routing

- `loom://content/<uuid>` — page home (root or sub-page)
- `loom://content/<uuid>/<sub-path>/` — folder home (trailing slash)
- `loom://content/<uuid>/<file>` — source file viewer
- `loom://anchor?src=<source-loomURL>&page=N&rect=x,y,w,h&text=<excerpt>` — jump to a PDF passage

### Key files

- `LoomMinimalRootView.swift` — main window root, sidebar, navigation history
- `LoomFolderHomeView.swift` — page renderer (Markdown + actions)
- `SourceFileView.swift` — PDF / file viewer + Note popover + Ask AI panel
- `ContentRootStore.swift` — page registry, security-scoped bookmark management
- `LoomFileStore.swift` — Loom-managed data location
- `LoomAI.swift` — single AI entry point, routes to user-selected provider

---

## 5. Reading & Capture Model (Locked 2026-04-26)

### One menu item per selection

When the user right-clicks selected text in a PDF, Loom adds **exactly one item** to the system context menu:

> **Note this passage…**

Underneath sit the system items: Look Up, Translate, Search With Google, Copy, Share, Speech, Writing Tools. Loom does not duplicate any of them.

### Inside the Note popover

- Quote pre-filled at top (read-only)
- Textarea below (focused on open)
- Header has a **`✦ Ask AI`** escape hatch — switches to the AI side panel seeded with the same passage; popover dismisses without saving
- **Save** (⌘↩):
  - Empty body → saves a quote-only entry
  - With body → saves a note (quote + thought)
- A small hint reads "Save with empty body to keep the quote only."

### Inside the Ask AI panel

- Quote pinned at top
- Input pre-filled with an AI-suggested first question (heuristic on passage type: equation / definition / claim / general)
- ⌘↩ to send
- Tray-down icon archives the conversation under the parent page; X discards
- Conversation is saved as a thread inside the per-book section

### Lifecycle of a note

1. **Create**: right-click → Note → Save (empty or with body) → lands inline on parent page under `## <filename>`
2. **View**: parent page shows it as `*p.N · timestamp*` + quote + body. Quote is tappable to jump back to the PDF passage.
3. **Edit**: enter whole-page edit mode (click empty area, edit Markdown directly). Per-note edit not yet built.
4. **Delete**: right-click on inline note → Delete note → confirm → entry removed from Markdown
5. **Promote**: right-click on inline note → Promote to new page… → enter title → new top-level page created with `*from <parent>*` back-link + the note's content; inline note replaced with `→ [<title>](url)`

### Self-healing Markdown

`SourceFileView.restructure()` runs on every save AND on every page load (`LoomFolderHomeView.reload`). It:

- Parses the file into sections + entries
- Routes orphan `### entries` (legacy or floating) into per-book sections
- Coalesces multiple entries for the same source under one `## <filename>` heading
- Folds legacy `## Notes` / `## Threads` / `## Pursuits` content into per-book sections
- Drops legacy `## Source` / `## Thoughts` headings on sub-pages (purely a render-side hide for legacy structure)

The file gradually heals itself; no destructive migration script needed.

---

## 6. UI / UX Rules

### Layout

- **Back/forward chevrons live in the NSWindow titlebar** via `.toolbar { ToolbarItem(placement: .navigation) { ... } }`. Never a custom row eating vertical space below the titlebar.
- **Two-finger trackpad swipe** triggers back/forward via `NSEvent.trackSwipeEvent` + a global local `NSEvent.addLocalMonitorForEvents(.scrollWheel)` monitor. Convention: swipe right = back, swipe left = forward.
- **Sidebar** uses `ScrollView + LazyVStack`. Each row is a Button with its own selection background. **Never** `List + .listStyle(.sidebar)`.
- **Page body** uses native serif typography. Editable inline (click empty area to enter edit mode).
- **Page title (h1)** — 28pt serif semibold, editable inline by clicking. Only renameable at the root, never inside a subfolder.

### Interaction

- **Right-click is the primary discovery surface for actions.** All Loom actions on PDF selections, inline notes, and sidebar items live in native NSMenu / SwiftUI `.contextMenu`.
- **Promote / Delete / future Edit** appear on inline-note context menus only.
- **Sidebar rename** via right-click → Rename, or by clicking the inline page title at top of folder view. Both write through `ContentRootStore.update`; `liveRootName` keeps display in sync.
- **Cascade on remove** — removing a folder root cascades to all descendants in `ContentRootStore.remove(id:)`.
- **Toast** for confirmations: `.regularMaterial in: Capsule()`, ~1.5s fade. Used for "Quote saved", "Note saved to <page>", "Couldn't save", etc.

### Don't

- **Don't add chrome.** Floating panels appear only when summoned. No always-visible margin columns, no permanent toolbars beyond the back/forward chevrons.
- **Don't separate by activity type.** A book's notes, AI threads, and pursuit links all live under that book's section.
- **Don't show a feature inline in the page that already exists in the system menu** (e.g., Translate).
- **Don't create per-action toolbars in the page body.** Buttons appear on context menu, not always visible.

---

## 7. Visual / Typography (Locked 2026-04-26)

### Markdown rendering hierarchy (in `LoomMarkdownView`)

| Element | Style |
|---------|-------|
| Page title (h1, separately rendered) | 28pt serif semibold, editable inline at root |
| Body h1 (legacy or user-authored) | 20pt serif semibold |
| h2 (`## <filename>` per-book section) | 14pt serif semibold, primary color, 22pt top padding |
| h3 (legacy subsections) | 12pt medium, secondary color, 14pt top padding |
| Italic-only paragraph (`*p.N · ts*`) | 10pt serif italic, **tertiary** — eyebrow style |
| Jump-back paragraph (`[📍 ...](loom://anchor?...)`) | 11pt secondary |
| Quote (with anchor) | 13pt serif italic, primary at 75% opacity, accent-colored 2px left bar, ↗ glyph at top-right; **whole quote is the click target** |
| Quote (no anchor) | Same but secondary-colored bar, no glyph |
| Body paragraph | 14pt system, 2pt line-spacing |
| List item | 13pt system |
| Code | 12pt monospace, secondary background |

### Block spacing

- Outer VStack between blocks: **6pt**
- Per-block top padding adds the gap only at section/entry boundaries (h2: +22pt, h3: +14pt)

### Per-book section heading

- Saved as `## [<filename>](<source-loomURL>)` — the filename is a clickable link that opens the source file directly
- Both legacy (plain text) and new (linked) shapes resolve to the same subsection during heal

### "Jump to passage" UX

- The standalone `[📍 Jump to passage](...)` link is folded into the preceding quote at render time
- Quote becomes the click target; a small ↗ glyph hints at the action
- Hover help: "Jump to source passage"

---

## 7.5. Substrate / Editable Render / AI Surface Pattern — v4.1 (rewritten 2026-05-02)

> **v4.0 of this section** had Loom positioned as "no AI panel anywhere; AI = invisible plumbing globally." User clarified next turn: "在阅读层面 Ask AI 我觉得是有用的; 在写作层面 [substrate] 是另一种形式." v4.0 was over-推generalized. **v4.1 corrects** via Cursor-pattern adaptation: unimodal Loom + 3 AI surfaces split by **role** not by mode. See `docs/canon/LOOM.md` §1.5 (rewritten v4.1) and `tmp/loom-correction-log.md` entry-009/010/011.

### The thesis (50 words, user-confirmed 2026-05-02 with role-scope)

> **Loom = paper canon 可编辑文档（unimodal）+ 3 个 AI surface 按 role 分：⌘K 一次性 invocation、AskAI 持续对话窗口、background passes 无形整理（structural-only，never generative）。无 mode 切换。LoomAIBar + distill panel 删除（被 ⌘K palette 替代）。AskAIWindow 保留。外部 AI 通过 Loom CLI 联动。**

### Operating rules (v4.1 — split by AI role)

**Substrate (document) rules — unchanged from v4.0:**

1. **Paper canon stays sealed**. Adding editability or AI surfaces does NOT change vellum / measure / page-on-deck / drop-cap / oldstyle / hanging / KaTeX / zero-texture rules from §7. CSS rules are immutable.
2. **`contenteditable` is the editing affordance, not a separate "edit mode"**. The reader page IS editable. No mode-switch button. No source/preview split. **Loom is unimodal.**
3. **Source folder remains immutable**. Edits + AI surfaces route through `LoomFileStore` per existing immutable-source principle (memory: `feedback_loom_source_folder_immutable`).
4. **Source materials remain read-only**. External PDFs, web captures' source pages, ingested originals — substrate editing does not apply. Editable surface is for ARTIFACTS Loom / AI generates (drafts, distillations, articles, notes).
5. **Bi-directional binding**: DOM is rendered FROM `.md`; user edits DOM; diff writes back to `.md`. `.md` is single source of truth.
6. **Block versioning auto-on** (M4 deferred — only ship if M2 user data justifies).

**AI Surface 1: ⌘K Palette (NEW v4.1, M6 spec, M7 ship)**

7. ⌘K is the universal **summoned generative invocation**. Triggers via keystroke; opens a small floating prompt anchored to context.
8. **Hard cap: ≤7 distinct actions** in the palette. Prevents feature-pile drift. As of v4.1: rewrite, expand, distill, translate, cite-source, restructure, ask. No more without docs/canon/LOOM.md amendment.
9. ⌘K **output is contextual**: selection → in-place edit (margin-marked); document → write/restructure (margin-marked); ask-prefix → answer in popover (no doc modification).
10. ⌘K **does NOT replace AskAIWindow**. Long Q&A sessions go through AskAIWindow (⌘⇧E). ⌘K is one-shot only.

**AI Surface 2: AskAIWindow (KEPT, no v4.1 changes)**

11. **AskAIWindow is preserved at 957 lines (`macos-app/Loom/Sources/AskAIWindow.swift`)**. Triggered by ⌘⇧E. Threaded conversation surface for deep Q&A.
12. **Don't merge AskAIWindow into ⌘K**. They serve different roles (one-shot vs threaded). User explicitly confirmed both have value.

**AI Surface 3: Background Passes (NEW v4.1, M4.5)**

13. **Background passes run on idle (3-5s) + on document open + manual ⌘↩**. NOT continuous-while-typing (deferred to v4.2+ opt-in).
14. **Background passes are STRUCTURAL or REFERENTIAL ONLY. NEVER generative.** Hard rule:
    - ✓ Allowed: typeset (rearrange / heading detection / list formatting), structure (5 shapes detection), link (cross-reference to other Loom docs), cite (external citation lookup via DOI / Crossref / etc.)
    - ❌ Forbidden: rewriting prose, suggesting follow-up content, generating alt text, auto-translating, expanding bullets, auto-completing sentences, ANY form of content generation
15. **AI-touched content is margin-marked**. Right-margin bronze dot indicates "AI touched this span." Hover reveals diff + revert. Subtle enough to not pollute read; visible enough that user retains authorial control.
16. **Background passes contract test**: M4.5 ships a `tests/loom-ai-passes-non-generative.test.ts` that verifies no pass function generates new content. Failing this test blocks the commit.

**External AI integration:**

17. **External AI (Codex / Claude Code / API) integrates via files + CLI**. LoomFileStore is plain markdown + frontmatter; any AI can read/write directly. Loom CLI exposes substrate operations (`loom capture/search/open/related/render/write`). No Loom-specific API.
18. **MCP server is v4.2+ deferred work**. CLI is the v4.1 standard.

**Cross-cutting:**

19. **Wiki-scale AI** (cross-document auto-link, auto-cluster, library indexing) is DEFERRED to v4.2+. v4.1 ships single-document AI surfaces only.
20. **Sunset rule for replacements**: when v4.1 deletes existing UI (LoomAIBar, distill panel), the deletion ships ONLY AFTER the replacement (⌘K palette M6) ships and proves it. Deletion timeline = M7 (after M6 PASS). NO simultaneous delete-without-replace.

### What's banned (substrate purity, v4.1 rules)

- ❌ Don't add a separate "Edit" button that toggles edit mode. Editing is in-place, always.
- ❌ Don't replicate paper canon CSS for an "editable variant" — there is one canon, applied identically.
- ❌ Don't ship invariant guard via runtime alerts ("Are you sure?"). Either prevent silently via CSS or undo via MutationObserver. No friction prompts.
- ❌ Don't expose markdown source in the UI (no split-pane). Bi-directional binding is internal plumbing.
- ❌ **Don't add an always-visible AI bar / sidebar / panel.** All AI surfaces are summoned (⌘K, ⌘⇧E) or invisible (background passes). LoomAIBar's right-edge always-visible pattern is what v4.1 deletes.
- ❌ **Don't add /ai inline command palette inside the document.** ⌘K is the one summoning gesture. Inline /ai = redundant + feature-pile.
- ❌ **Don't make background passes generative.** Per rule #14. The contract test enforces this.
- ❌ **Don't add AI agent-loop in Loom internal AI.** ⌘K is single-step (one API call per invocation). Multi-step / spawn / cross-file work goes through external AI calling Loom CLI.
- ❌ **Don't continuous-render AI** (every keystroke triggers AI). Distracting. v4.1 model is idle 3-5s + on open + manual. Continuous is v4.2+ opt-in.
- ❌ **Don't expand wiki-scale work in v4.1**. Single-document only.
- ❌ **Don't add ⌘K palette actions beyond cap of 7.** Each addition needs docs/canon/LOOM.md amendment + user approval.
- ❌ **Don't merge AskAIWindow into ⌘K palette.** They serve different roles.
- ❌ **Don't delete LoomAIBar / distill panel before M6 ⌘K palette ships.** Delete-without-replace = user loses functionality.

### Phased shipping (v4.1 — updated milestones)

- **M1 (filed 2026-05-02)**: thesis docs only — this section + docs/canon/LOOM.md §1.5 + §6.5 + §6.7 + plans + design doc + correction-log entries 007/009/010/011.
- **M2 (~5 days, gated on user GO)**: Article shape contenteditable + naïve MD roundtrip. **Modules (a)+(b) only — was 4 modules, scope cut**. NO AI surfaces yet.
- **M3**: decision gate after 1 week M2 user data.
- **M4 (~5-7 days, gated on M3 PASS)**: editable render hardening — add modules (d) invariant guard + (e) versioning IF M2 data justified.
- **M4.5 (~5-7 days, gated on M4)**: background passes per `plans/loom-ai-passes.md` (with non-generative contract test).
- **M5 (~3-4 weeks, gated on M4.5)**: multi-shape (List/Passage/Conversation/Syllabus) + mobile + a11y.
- **M6 (~5-7 days, parallelizable with M4)**: ⌘K palette per `plans/loom-cmd-k-palette.md` (NEW v4.1).
- **M7 (~2-3 days, gated on M6 PASS)**: delete LoomAIBar + distill panel; verify ⌘K palette covers their functionality.
- **M8 (~3-5 days, parallelizable with M6)**: Loom CLI per `plans/loom-cli.md`.
- **W.M1 (DEFERRED v4.2+)**: wiki-scale AI work.

### Cross-references

- `docs/canon/LOOM.md` §1.5 — Loom positioning (re-rewritten v4.1)
- `docs/canon/LOOM.md` §6.5 — Camp C editable render (M2 scope cut to a+b in v4.1)
- `docs/canon/LOOM.md` §6.7 — input surface + AI passes (scope corrected v4.1)
- `docs/canon/LOOM.md` §7 — Compile Pipeline (background pass scope clarified)
- `plans/loom-camp-c-editable-render.md` — M2 scope cut; updated milestones
- `plans/loom-ai-passes.md` — internal AI passes engineering spec; v4.1 adds non-generative hard rule
- `plans/loom-cmd-k-palette.md` — ⌘K palette engineering spec (NEW v4.1)
- `plans/loom-cli.md` — external AI integration spec
- `docs/design/PRISM_VS_NOTES_VS_LOOM_2026-05-01.md` — design rationale
- `docs/design/LOOM_AI_SURFACE_PATTERN_2026-05-02.md` — Option ε v2 full design rationale (NEW v4.1)
- `tmp/loom-correction-log.md` entry-007 — v4.0 substrate reframe (partially superseded)
- `tmp/loom-correction-log.md` entry-009/010/011 — v4.1 corrections + meta-lessons

---

## 8. Decision Log

Reverse-chronological. Date in YYYY-MM-DD.

### 2026-04-29 — Web Capture extension shipped

**Decision:** Loom now ships a Safari Web Extension at `macos-app/Loom/LoomWebExtension/` paired with a native host (`Sources/Capture{Shape,Sheet,View,WebView}.swift`, `LoomURLSchemeHandler.swift` capture-bridge additions). The extension surfaces a toolbar action + three context menu items (page / selection / link) and emits one of two URL shapes: `loom://capture?payload=<json>` for small payloads or `loom://capture?via=clipboard` (short URL + clipboard JSON) for multi-MB rich-media payloads. Manifest declares `clipboardWrite`. `background.js` uses `scripting.executeScript({world: 'MAIN'})` to bypass page CSP for the `loom://` href click.
**Rationale:** Source files (Notion-style web pages, articles, HN threads) were second-class citizens — the only way to "save" one was to bookmark in the browser and rely on the user to revisit. Web Capture brings them under the same per-folder `Loom.md` substrate as PDFs. The two URL shapes exist because URL-encoded JSON truncates around ~2MB on multi-image captures; clipboard fallback tolerates anything the OS clipboard accepts.
**Coverage:** Atlas-compatible (the extension provides context menu items even when the toolbar action is hidden). Tested against `flipdisc.io` as the golden case fixture (long article + YouTube embed + Vimeo embed + composite SVG/canvas blocks + image gallery + code blocks).
**Reference:** `docs/process/WEB_CAPTURE_GOLDEN_CASE_2026-04-29.md` documents 11 failure modes (SVG layout attrs as black blocks, re-sign without entitlements, theme resolver gaps, validation locality, provider video fallback, extension-not-injected detection, etc.) + 13 product rules (never re-sign with bare codesign, source folder remains read-only, capture from live DOM not detached cloneNode for media-rich docs, screenshots as media sidecars not inline base64, etc.).
**Open caveat:** YouTube returns `Error 153` in `loom://` WKWebView origin; capture data and source link are present but provider playback requires trusted HTTPS origin. Vimeo plays fine.

### 2026-04-28 — Loom Design System v1.0 spec

**Decision:** Canonical visual-token source filed at `lib/loom-design-system.ts`. CSS twin staging at `app/globals-v2.css`. Swift mirror is `LoomTokens.swift` (existing, will be brought into alignment in tranche 2+). Primitives shipped at `components/loom/*` (Body, Display, Eyebrow, HairlineRule, LayoutArticle, LayoutGallery, LayoutIndex, LayoutMagazine, LayoutSnapshot, Stack, Surface).
**Rationale:** Loom had drifted into 15 font sizes, 5 expressions of the same bronze accent (`#9E7C3E` / `#C4A468` / `#B98E3F` / `#D4B478` / `#7A5E2E`), no spacing scale, no motion scale, and 4 rendering paths each with its own CSS. Per-feature improvisation was ratcheting inconsistency upward with every patch. The plan diagnoses 10 constitutional rules (no `backdrop-filter` on sticky/scroll-aware elements, hover may only change color/opacity/border, all `useEffect` must list real dependencies, scroll-spy callbacks read-only or 1Hz hysteresis-throttled, no `position: fixed` + `transform`, no inline `<style>` blocks, no new font sizes/colors/spacings outside the system, etc.).
**Migration:** 4 nights of disciplined work per `plans/loom-design-system-v1.md`. Inventory of 67 hex literals + ~40 more mapped to tokens at `plans/design-system-migration-inventory.md`. Tranche 1 (commit `e4c57c0`) collapsed 7 hexes in `components/{GradientDescent,NeuralNetCanvas}` to `color.{thread,paperDeep,ink1,ink3,paperUp,paperCard}`. Tranche 2 will require expanding the DS lib's tint family (sage/plum/indigo/umber/rose) and a light-mode token set (currently dark-only).

### 2026-04-27 — Phase C presentation layer (体面 OUT)

**Decision:** Filed `plans/phase-c-presentation-layer.md` for the 体面 OUT half of Loom (the rendering layer — Phase A handled 顺手 IN, capture-into-substrate). The plan establishes 4 content shapes (List / Article / Passage / Conversation; Syllabus deferred), each detected by heuristic content shape and rendered by a per-shape view. Source of truth remains `.md` files; renders are derived; AI distill (Phase C2) is the only path to write back to source as a tagged section.
**Rationale:** A perfectly-extracted markdown document still reads as raw source code in iA Writer / Xcode / wherever the user's default markdown viewer is. The unit of "体面" is rendered output, not extracted text. Phase A's optimization track (mini-Defuddle, sr-only stripping, HN tuple extractor) was the wrong ladder — even perfect extraction doesn't ship presentation.
**Status:** M1/Path B (in-Loom capture renderer at `app/loom-render/capture/page.tsx`) is partially shipped — explicit phase comment in the file. M2/M3/M4 (List / Article / Passage / Conversation renderers as a content-shape selector) not started.
**Constitutional rules:** Source folder remains immutable; `.md` is canonical; content-shape-aware (one renderer per detected shape, not user choice); no AI-generated rewriting at render time (render is deterministic given source); user retains full editing power on the rendered surface; no in-Loom AI chat (external LLMs do thinking, Loom does archive + presentation).

### 2026-04-27 — Source folder is immutable (LoomFileStore enforced)

**Decision:** Loom-managed data writes go through `LoomFileStore` (sandbox container at `~/Library/Containers/com.yinyiping.loom/Data/Documents/Loom Data/`). Zero automated writes to the user's external folder. `Loom.md`, sidecars, caches all live in the sandbox; the user's source folder is read-only.
**Rationale:** Source authority (V1 in §3) is one of Loom's two load-bearing trust contracts. Any automated mutation of the user's folder breaks the contract. Hiding artifacts inside the user folder isn't a fix — redirect the writes. Don't auto-migrate or auto-delete legacy artifacts either; only humans modify the source folder.
**Coverage:** All capture writes go via `LoomFileStore.loomMDURL(for: rootID, subPath:)`. Tests `tests/source-authority-contract.test.ts` and `tests/web capture routing never falls back to broad or source-mutating paths` enforce.

### 2026-04-27 — Ingest-to-learning-loop bridge

**Decision:** Storage P0 + routing P1 of `plans/ingest-to-learning-loop-bridge.md` shipped. Schema-bound extractors land their structured output where the learning-loop surfaces (CourseContextStrip, Pursuits, extractor anchors) can read it. Folder-fallback resolver fires when the folder name lacks a course code AND there's exactly one syllabus sibling — eyebrow shows "folder fallback"; otherwise muted dismissible hint guides the user to drop a syllabus PDF and Extract.
**Rationale:** Ingest extractor refactor (Phases 0-7.4 plus 6 hardening commits) produced typed extractor lanes; without a bridge, the structured output sat unused. The bridge connects the schema layer to the reading-page surfaces so users see typed metadata without manual reconciliation.

### 2026-04-26 — Apple Foundation Models as default provider

**Decision:** New `AIProviderKind.appleFoundation` case wired through `AppleFoundationClient` (wraps the macOS 27+ `FoundationModels` framework). Set as the default for new installs / first-run. Streams natively via snapshot diffing. Graceful `notAvailable` failure with actionable banner when on unsupported hardware/OS.
**Rationale:** Removes the configuration barrier that was blocking testing — the user couldn't try shipped AI features without configuring a CLI binary or paying for an API key. Apple Intelligence works out-of-the-box on supported hardware. Aligns with V11 (lean on macOS for things macOS provides) and V1-class privacy (on-device, never leaves the machine).
**Coverage:** `LoomAI.send` and `LoomAI.sendStream` both route to `AppleFoundationClient`. `StructuredOutputClient` falls back to disabled for now (guided generation not yet wired). `FirstRunProviderSheet` treats it as credential-free.
**File:** `Sources/AppleFoundationClient.swift`, registered in pbxproj.

### 2026-04-26 — Bidirectional Note ↔ AI

**Decision:** Each AI reply in the Ask panel gets a `↓ Save as note` capsule. Click → closes the Ask panel and opens the Note popover pre-filled with the AI's text as the body and the original passage as the quote. User reviews/edits before saving — the saved note is theirs, not a raw AI dump.
**Rationale:** Tier 1 made AI READ user's notes. This shipping step makes AI replies become user's notes. Closes the loop: AI helps draft, user owns the takeaway. Aligns with curiosity-led — AI assists, user curates.
**Three capture granularities** from an AI conversation now coexist:
- Type your own + ⏎ → pure user note
- `↓ Save as note` on an AI message → AI-drafted, user-edited, anchored
- `📥` archive (top of panel) → full conversation transcript saved as thread
**Implementation:** `saveAIMessageAsNote(_:)` tears down Ask state and seeds the Note popover with the same selection (anchor preserved) + the AI text as `noteDraft`. Saves through the normal `commitNote` path so the note lands in the per-book section like any other.

### 2026-04-26 — Streaming Ask AI

**Decision:** Ask AI responses stream token by token via `LoomAI.sendStream(prompt:systemPrompt:onChunk:)`. Empty placeholder message appears immediately on Send; chunks append as they arrive from the provider's SSE feed. "thinking…" indicator clears when stream completes.
**Rationale:** Felt latency was getting worse with Tier 1 prior-notes context (more tokens = longer wait). Streaming makes the AI panel feel responsive again — user sees progress, not a wait spinner. Standard pattern across modern AI tools.
**Provider coverage:** OpenAI + Anthropic stream natively. Custom endpoint / Ollama / CLI runtimes fall back to one-shot (single chunk on complete) so the UX doesn't break — they just don't stream.
**Implementation:** `OpenAIClient.Options.onChunk` and `AnthropicClient.Options.onChunk` already existed; `LoomAI.sendStream` is the new unified entry. `AskMessage` got a public `id` parameter so streaming can mutate the placeholder in place.

### 2026-04-26 — Source-aware Ask AI (Tier 1 of substrate AI)

**Decision:** Ask AI now automatically includes the user's existing notes on the same PDF as context in every call. System prompt instructs the model to reference prior notes when relevant (e.g., "your earlier note on p.3..."). No UI change — invisible by default, qualitatively transforms responses.
**Rationale:** Loom's unique substrate is the user's accumulated per-passage notes. No other PDF+AI tool (Adobe AI Assistant, NotebookLM, Readwise) knows your prior thinking on a specific document. Using it elevates Ask AI from "fresh AI per passage" to "AI that's been reading along with you."
**Implementation:** `SourceFileView.gatherPriorNotesFromPage()` reads the parent's `Loom.md`, finds the per-book section matching the current PDF, strips jump-link lines, caps at 8000 chars (most-recent tail when truncated), passes as `priorNotes:` to `buildAskPrompt`.
**Aligns with:** `docs/canon/LOOM_USER_PROFILE.md` §8 ("AI can act on the user's accumulated record"). First concrete step toward the broader substrate vision.
**Tier 2 deferred:** AI-generated suggested questions above the input field — defer until Tier 1 has been validated in actual reading sessions.

### 2026-04-26 — Two creation paths only (drop "+ Add note")

**Decision:** Removed the "+ Add note" button at the bottom of folder home. There are now exactly two ways to create content on a page:
1. **Free-form prose** — click the empty page area → edit mode → save. Lands at the top of `Loom.md` in the prose region.
2. **Anchored note** — right-click PDF selection → `Note this passage…` → save. Lands in the per-book `## <filename>` section.
**Rationale:** "+ Add note" was a third path writing to a legacy `## Notes` section, which `restructure()` would then re-route into a per-book section if there was one (surprising). Two orthogonal paths matches "one primitive per intent" (V8) and removes the confusion.

### 2026-04-26 — Note lifecycle complete + heal-on-load restored

**Decision:** Three updates landed together:
1. **Heal-on-load re-enabled.** `LoomFolderHomeView.reload` runs `SourceFileView.healLoomMD` on every page open and writes back when changed. The earlier regression's root cause was `isAtRoot` mismatching `/var` vs `/private/var`, not heal itself. Resources is no longer in the heal pipeline since it's now a synthesized view.
2. **Sidebar flattened.** `ContentRootStore.flattenLegacySubpages()` runs in `activateAtLaunch` and sets every `parentID` to nil. Legacy sub-pages (from removed ⌘L Extend) become top-level alongside new Promoted pages — eliminating the two-shapes-coexist inconsistency.
3. **Per-note Edit added.** Right-click any quote → menu now has Edit / Promote / Delete. Edit opens a sheet pre-filled with the existing body; eyebrow + quote + jump-link are preserved verbatim, only the body region is rewritten. Lifecycle (Create → Edit / Promote / Delete) is now complete.

**Rationale:** All three were ranked top in the global state analysis. Heal-on-load closes the gap where files only self-heal on save (a read-only user would never get migration). Sidebar flatten removes the inconsistency the product owner flags as "duplicates X". Edit was the missing verb on the note lifecycle.

### 2026-04-26 — Prose vs auto-managed split

**Decision:** A page's `Loom.md` is split conceptually into two regions: **user-authored prose** (everything before the first `## ` section) and **auto-managed sections** (Resources synthesized live, per-book `## <filename>` containing notes/threads/pursuits). Edit mode shows ONLY the prose; auto-managed sections are preserved verbatim on save and never exposed in the textarea.
**Rationale:** Auto-managed content is full of `[Name](url)` boilerplate, percent-encoded URLs, and rigid formatting that adds cognitive burden when the user just wants to write a thought. Loom owns those sections; the user shouldn't have to navigate around them.
**Implementation:** `extractProse(from:pageName:)` returns just the prose for the textarea; `mergeProse(_:into:pageName:)` reattaches it before the first `## ` boundary on save. Per-note actions (edit individual note / delete) need a different surfacing mechanism (TODO — was reverted from the entryGroups context menu attempt).
**Side effect:** `## Resources` is no longer persisted to disk at all — it's a live render from the folder scan. New folder roots get an empty `Loom.md`. Existing files with `## Resources` baked in have it stripped at render and dropped at next save.

### 2026-04-26 — Refresh action + live Resources

**Decision:** Added a refresh path with three triggers: ↻ button in the titlebar toolbar (after back/forward), ⌘R keyboard shortcut (universal browser/Finder convention — qualifies as exempt from V2 since it's globally known), and automatic refresh on `NSApplication.didBecomeActiveNotification`. Each refresh also re-scans the source folder and rewrites the `## Resources` block in `Loom.md` so new files / new subfolders surface live.
**Rationale:** User often updates folder structure in Finder externally. Without refresh, Loom would show a stale tree until restart. Without live Resources, the sub-folder list inside a page would never reflect Finder changes (it was scaffolded once on first visit and frozen).
**Implementation:** `LoomMinimalRootView.refreshActive()` reloads sidebar roots and posts `.loomRefreshActivePage`. `LoomFolderHomeView.reload` runs heal-on-load + `refreshResources(in:entries:)` which replaces the existing `## Resources` block (or inserts one) with a fresh scan. Writes back only when the live list differs from disk.

### 2026-04-26 — Single capture primitive

**Decision:** Collapsed three right-click menu items (Quote / Note / Ask AI) into one (**Note this passage…**). The Note popover handles all three paths via empty body (= quote), filled body (= note), or `Ask AI` button (= conversation in side panel).
**Rationale:** Quote and Note had functional overlap (Quote = empty Note). Ask AI is rarer; it deserves to be summoned from inside the note surface, not as a peer menu item. Aligns with V11 (no duplicate UI for same outcome) and the "Learn, don't organize" principle (small friction at capture-time prompts engagement).
**Tradeoff:** +1 click per pure quote vs old 1-click Quote. Accepted because it nudges the user toward engagement.

### 2026-04-26 — Drop ⌘L Extend → Page

**Decision:** Removed the "Extend to new page" gesture from the PDF right-click menu and the `extendToPage` handler entirely. Replaced with **Promote to new page…** on inline notes (right-click on parent-page note).
**Rationale:** Sub-pages and inline notes had ~80% functional overlap (both: anchored response to a passage). Forcing the choice upfront (Note vs Extend) was the friction. Promotion now happens after the note has grown enough to need its own home, not before.
**Migration:** Existing sub-pages keep working (still nested in sidebar). New promoted notes are top-level.

### 2026-04-26 — Per-book sections (not per-activity)

**Decision:** Loom.md is structured as `## Resources` + one `## <filename>` section per source. All activity for a source (notes, AI threads, pursuit links) lives inline under that source's heading. No `## Notes` / `## Threads` / `## Pursuits` separation.
**Rationale:** User mental model is "what have I done with this book?", not "what are all my notes across all books?".
**Heal-on-load:** `restructure()` migrates legacy structure on every save and load.

### 2026-04-26 — Right-click as primary action surface

**Decision:** All Loom actions on selected text (PDF) and inline notes (parent page) live in native context menus. Removed all keyboard shortcuts (⌘T/D/E/K/L) for these actions. Removed the visual shortcut hints in the file header.
**Rationale:** User feedback: minimize shortcuts, leverage Apple-native patterns, prefer "stacked windows" (single context menu) over scattered surfaces.
**Kept shortcuts:** ⌘[ / ⌘] (back/forward), ⌘↩ (save-in-popover). Universally known.

### 2026-04-26 — Trackpad swipe back/forward

**Decision:** Added native two-finger horizontal trackpad swipes for navigation via `NSEvent.trackSwipeEvent` + global scroll-wheel monitor.
**Rationale:** Matches Safari/Finder. The MBP's primary input is the trackpad.

### 2026-04-26 — Heal Markdown on read

**Decision:** `LoomFolderHomeView.reload` runs `SourceFileView.healLoomMD(_:)` on every page load and writes back if changed.
**Rationale:** User saw stale legacy structure not reorganizing. Heal-on-save alone wasn't enough; opening a page also fixes it.

### 2026-04-26 — Title and source name in sync (live)

**Decision:** Editable page title at top of folder view. `liveRootName` state is refreshed on every `.loomContentRootsChanged` notification, so renaming via sidebar OR page title updates both surfaces immediately.

### 2026-04-26 — Drop legacy ContentView, ship "minimal mode"

**Decision:** `LoomMinimalRootView` is the default UI (`UserDefaults` flag `loom.minimal.enabled` defaults to true). The legacy webview-based ContentView remains accessible via the flag but is not maintained.
**Rationale:** Clean rebuild, no legacy chrome (Desk / Reference / Coworks / Patterns / Weaves / Pursuits surfaces are gone in minimal mode).

### Earlier — Architecture inversion

**Decision:** Loom shifted from "Next.js in WKWebView" to "Swift-primary Mac app, webview renders MDX only".
**Rationale:** Sandboxing, simpler distribution, native feel.
**Status:** Inversion mostly complete; some Vellum-era webview surfaces still exist for `/wiki` content but minimal mode bypasses them.

---

## 8b. The Three-Substrate Model (Aspirational)

Loom is being built toward a vision where AI can act *as the user would*, not just *as told*. This requires three substrates working together:

1. **`docs/canon/LOOM_RULES.md`** — what Loom is (product invariants, vetoes, architecture). Constrains AI from violating product principles.
2. **`docs/canon/LOOM_USER_PROFILE.md`** — who the user is (observed habits, preferences, working patterns). Tells AI how to fit the user's grain.
3. **`LoomFileStore` data** — what the user has done (notes, pages, anchors, AI conversation history). The actual substrate AI acts on.

(1) and (2) constrain. (3) is the material. Together they make autonomous task completion possible.

**First autonomous task to attempt** (when ready): *Cross-source surfacing* — when the user opens a PDF, surface their own past notes from other books that engaged with similar passages. Low-stakes (just suggestions), high-value (impossible without the substrate), uses all three layers.

**Architectural implication**: when Loom-the-app eventually adds personalization features, they MUST read `docs/canon/LOOM_USER_PROFILE.md` (either copied into `LoomFileStore` on launch or read via a known path). Do not duplicate the profile inside the app — keep one source of truth.

## 9. Open Questions / In Flight

- **Edit a single inline note.** Currently the only way to edit is whole-page Markdown edit. A right-click → Edit on a note (popover with body in textarea) would close the loop with Promote / Delete.
- **Sidebar nesting consistency.** Legacy sub-pages render nested; new promoted pages are top-level. Decide: flatten all or keep both?
- **Pages library view.** When you click "Pages" in the sidebar, the library shows root cards. Could become a recent-activity dashboard.
- **Anchor durability.** `loom://anchor?src=...&rect=...` includes a text excerpt for fallback search if rect drifts. Untested at scale (large PDFs, replaced PDFs).
- **Free-form notes (no source).** Currently land in `## Notes`. With per-book grouping as the primary structure, these are second-class. Consider: a top-level page for free notes?
- **AI provider settings reachability.** The user selects provider in Settings. New users on first launch get `disabled` and a confused error. Surface a clearer "AI not configured" path.
- **Figures / images.** Selection-driven capture is text-only. Academic PDFs are full of figures. Worth a rectangular drag → image quote eventually.

---

## 10. How to Maintain This Document

### When to update

Update **this file in the same commit** as the corresponding code change. Specifically:

1. **A hard veto emerges** from user feedback ("never do X"). Add to §3.
2. **A design decision is made** that pivots an architectural shape, UX flow, or user-facing model. Add to §8 with date and rationale.
3. **A feature ships** that changes the reading / capture / promotion model. Update §5.
4. **A visual rule locks in** (typography, spacing, color). Update §7.
5. **An open question is resolved.** Move from §9 to §8.

### How to update

- Don't delete past entries. Mark superseded with strikethrough or a "**Superseded:** ..." note.
- Be specific. Cite file paths and function names where they help (e.g., `SourceFileView.restructure()`).
- Use dates (YYYY-MM-DD) on all decision-log entries.
- Write so a fresh AI assistant with no prior context can ingest the doc and act correctly.

### Tone

This document is **not** marketing copy. It is engineering protocol. State decisions plainly. Prefer "MUST NOT" / "MUST" / "SHOULD" framing. Show tradeoffs honestly.

### When in doubt

If you (the AI assistant) are about to make a design decision that contradicts something here, **stop and ask the product owner**. Do not silently override.

---

*Last meaningful update: 2026-06-30. §2b now points to `LOOM_DESIGN_DISCIPLINE.md` as the canonical Reflection / sidecar discipline and keeps the compressed symptom→critique→choice→rule→evidence protocol, request triage, Understanding Version Flow, composer targeting, output discipline, baseline vs differentiation, native-app leverage, understanding-version commits, parallel Codex ownership, and refusal rules for NotebookLM/chat/note/custom-reader drift.*
