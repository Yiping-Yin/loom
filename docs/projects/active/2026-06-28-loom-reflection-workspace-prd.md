# Loom Reflection Workspace PRD

**Date:** 2026-06-28
**Status:** Active product and implementation standard
**Owner:** Current Codex thread
**Target surface:** Native macOS Reflection workspace and `/reflection` web parity
**Related contracts:**

- `2026-06-27-loom-product-definition-user-stories.md`
- `2026-06-27-loom-reflection-workspace-layout-contract.md`
- `docs/canon/LOOM_DESIGN_DISCIPLINE.md`
- `tests/new-loom-skeleton-contract.test.ts`

## Why This PRD Exists

The Reflection workspace has been drifting because product intent, visual
grammar, proportion, and acceptance were not written as one product standard.
That made each UI pass local: a button could be moved, a pane could be resized,
or glass could be added without an explicit rule saying whether the change made
Loom more coherent.

This PRD is the control layer. It defines what the product is, which jobs each
area owns, what standards implementation must preserve, and how a build is
accepted or rejected.

Implementation rule: no Reflection UI change ships without a matching PRD or
contract line. If a change cannot be tied to this PRD or the layout contract,
the change is product noise until the standard is updated.

## Product Thesis

Loom is an external learning and thinking layer for original files.

More precisely, Loom is a local cognitive version-control layer. It does not
try to read the user's brain, replace the original file app, or become another
notes database. It preserves the user's repeated passes over real material and
shows how raw exposure became understanding, how understanding became thinking,
and how thinking became a reusable system.

The original file remains the primary surface. A PDF stays a PDF, Excel stays
Excel, Word stays Word, and macOS remains available for Translate, Look Up,
Copy, Writing Tools, Summarize, Services, search, zoom, page layout, and file
specific workflows. Loom sits outside that surface and records what the user
learns, notices, asks, translates, struggles with, and later wants to organize.

Reflection is the second pass. During the first pass, the user may be learning
language before learning domain knowledge: word meaning, pronunciation, phrase,
sentence pattern, grammar, idiom, translation, or page-level gist. During the
second pass, Loom helps turn those anchored traces into structured
understanding, product judgment, summaries, confirmed principles, or reusable
thinking.

For product work, Loom Reflection helps product builders turn real work into
better judgment. That is one vertical of the larger product principle:

`original file activity -> anchored learning commit -> user-confirmed principle -> reusable thinking`

The product is not:

- a general notes app
- a chat app
- a portfolio or Digital Me surface
- a KaaS wrapper
- a skill showcase
- a generic AI writing surface
- a replacement PDF, Excel, or Word viewer
- a passive notebook that merely stores highlights

The product must preserve two modes:

1. In-file learning pass: the user works inside the native file surface while
   Loom captures anchored traces without taking over.
2. Loom synthesis pass: the user returns to Loom to organize traces into
   language learning, domain understanding, reflection, or judgment memory.

Operational cleanliness is part of preservation. The user's original learning
folders are not a scratchpad. Real-file verification, screenshots, generated
packets, sidecar fixtures, helper scripts, and temporary app bundles must live
under Loom-controlled workspace paths such as `.codex/` or be deleted after
use. Native GUI validation must clean stale `/private/tmp/loom-*` artifacts and
LaunchServices registrations so macOS Services menus are testing the current
Loom app, not an old temporary build.

## Target User

Primary v1 user: a Mac user who learns from real local documents and wants the
learning record to stay attached to the original file.

This includes:

- a Chinese-native learner reading English PDFs who first needs meaning,
  pronunciation, phrase, sentence, grammar, idiom, and translation traces
- a student or researcher learning from PDFs, spreadsheets, slides, and docs
  without abandoning the native file workflow
- founder or indie builder reviewing launches, onboarding, pricing, retention,
  or user feedback
- product-minded student or researcher turning projects into judgment
- operator using real outcomes to improve future decisions

The first version should prove this with PDF first. Excel and Word are product
targets, but they should not be implemented as separate cloned editors before
the native file sidecar model is correct.

The first version does not need to serve teams, enterprise review flows,
portfolio viewers, public identity consumers, or full replacement editors.

## Core User Stories

1. As a learner, I can open the original PDF in its native reading surface so
   that I keep the file's existing functions and do not need to learn a weaker
   Loom copy of the file.

2. As a Chinese-native learner reading English material, I can record that a
   word, pronunciation, phrase, sentence pattern, grammar point, idiom,
   translation, or page meaning mattered on a specific page or selection so
   that my first-pass learning trace stays anchored to the source.

3. As a learner, I can finish reading and later return to Loom for a second
   pass so that scattered language and knowledge traces become organized
   understanding instead of raw notes.

4. As a product builder, I can create a reflection case from a real product
   event so that the work starts from actual material, not an abstract template.

5. As a product builder, I can write what happened, what I assumed, what I
   decided, and what happened afterward so that the episode becomes inspectable.

6. As a product builder, I can attach or inspect source evidence beside the
   reflection so that judgment stays grounded in material.

7. As a product builder, I can import local files into the current reflection
   so that real product materials become inspectable sources and concrete Input
   without leaving the workbench.

8. As a learner or product builder, I can open a PDF source in the native app
   so that Preview keeps reading, zoom, search, page navigation, table of
   contents, annotations, and one-page or two-page viewing while Loom remains
   available as a sidecar record.

9. As a Mac user reading a PDF, I can select text and use system actions such
   as Look Up, Translate, Copy, Writing Tools, Summarize, and Services so that
   Loom benefits from macOS instead of replacing it with a weaker reader.

10. As a product builder, I can see the reflection thread and composer as the
   primary center of gravity so that the app feels like a working surface, not a
   dashboard.

11. As a product builder, I can collapse left navigation or Sources from the
   titlebar so that the workspace adapts without introducing duplicate controls.

12. As a product builder, I can hover near the left edge after collapsing the
   sidebar so that I can temporarily peek navigation without changing the
   permanent workspace state.

13. As a product builder, I can reuse the final judgment memory later so that
   each reflection compounds into future product decisions.

14. As a product builder, I can delete an obsolete reflection case from its left
   sidebar row so that the case list stays clean without turning deletion into a
   global toolbar action.

## Product Objects

| Object | Meaning | Product responsibility |
|---|---|---|
| Original file | The user's PDF, spreadsheet, document, slide, image, or code file | Remain primary; never become only an AI attachment |
| Native surface | Preview, Excel, Word, PowerPoint, browser, Finder, or another system file viewer | Preserve platform functions and user muscle memory |
| Anchor | A verified source handle at the highest available precision: selected text, file URL, document title, page, region, sheet/cell, window title, app, timestamp, or user-confirmed location | Bind learning traces to source context without pretending to have more precision than the platform exposes |
| Source disambiguation | The step that proves which native document, page, paragraph, sheet, cell, or region the user meant when multiple windows or documents are open | Prevent frontmost app identity from being mistaken for source truth |
| Visual appshot anchor | A capture-triggered screenshot or crop of the native app state, stored only inside Loom | Provide visual recall when sandboxing or source apps prevent precise file/page/cell anchors |
| Native translation receipt | A user-committed record of a macOS Translate, Look Up, pronunciation, or Copy Translation event | Preserve original text, translated text when available, native tool, language pair, source anchor, pass, and user meaning without rebuilding translation UI |
| Structured visual extraction | OCR, Vision, or multimodal extraction from a Loom-owned appshot | Produce candidate text, table, figure, layout, or emphasis evidence with confidence labels; never pretend it is a precise source anchor by itself |
| Learning trace | A captured moment of understanding, confusion, translation, vocabulary, grammar, question, or insight | Record what the user learned while using the file |
| Learning pass | A first-pass language pass, domain pass, review pass, or synthesis pass over the same file | Keep repeated learning layers distinct without splitting them into separate products |
| Understanding object | A reviewed semantic unit such as a word, phrase, sentence, concept, question, correction, or principle, backed by one or more traces | Consolidate raw captures into the object the user should actually review; larger objects absorb component traces when they explain the same source context |
| Loom sidecar | The external companion layer beside or over the native file | Capture, classify, and retrieve traces without taking focus from the file |
| Understanding Version Flow | A versioned center record of how the user's interpretation changed | Make learning and review continuous like source control for understanding, not a chat transcript or note feed |
| Synthesis | Second-pass organization across traces | Prepare structured understanding, explanation, summary, reflection, or principle candidates; memory requires user confirmation |
| Thinking system | Reusable models, principles, corrections, and judgment formed after repeated passes | Convert understanding into future thinking, not just recall |
| Reflection case | One product episode under review | Preserve status, title, source set, trace, and judgment |
| Input | What actually happened | Stay concrete and sourced when possible |
| Assumption | What had to be true | Make hidden beliefs explicit |
| Decision Trace | Why a path won | Record evidence, tradeoffs, and rejected alternatives |
| Outcome | What reality returned | Separate result from intention |
| Reflection | What changed in judgment | Name the lesson without overgeneralizing |
| Judgment Memory | What should be reused | Compact the reusable principle |
| Source | Evidence attached to the case | Remain inspectable beside the thread |
| Native file session | A source opened in its original app while Loom records beside it | Preserve native material affordances while Loom frames thinking around it |

## Product Architecture

Loom should be designed as an external companion, not as a replacement
workspace.

The first surface is the original file. The user reads, selects, translates,
looks up, searches, annotates, changes page mode, edits, or navigates using the
capabilities they already know. Loom's role is to make small, anchored captures:
"I learned this word", "this phrase means X", "this sentence pattern matters",
"I do not understand this paragraph", "this page is the first-pass gist", "this
decision evidence belongs to Input".

The second surface is Loom. After the reading or working pass, the user opens
Loom to review the captured traces by file, page, pass, topic, language issue,
domain concept, or product reflection object. This is where Loom can summarize,
cluster, explain, compare passes, and prepare principle candidates. Memory is
formed only after the user confirms a second-pass principle.

The center pane is not a chat, not a mind map, and not a generic notes feed.
Its differentiated job is Understanding Version Flow, the first concrete form
of Loom's broader cognitive version-control layer:

- Word has document version history.
- GitHub has repository history, commits, diffs, issues, and blame.
- Loom has understanding history: source anchor, first-pass interpretation,
  correction, second-pass synthesis, and user-confirmed principles.

This means each capture behaves more like a small version commit than a
message. The default center view should show the human-readable change first:
selected word, phrase, sentence, question, correction, or principle. Source
app, file path, trace type, pass, and raw machine metadata belong behind an
audit trail, because they are required for traceability but should not dominate
reading.

The center pane must therefore answer a question no native file app answers:
what changed in the user's understanding across passes? Word can show document
versions. GitHub can show code versions. Loom must show cognition versions:
selected material -> first interpretation -> correction -> reflection ->
system principle. If the center pane only lists notes, it is not differentiated
enough to justify Loom.

The key product rule: Loom records the user's learning around the file; it does
not convert the file into a subordinate source for chat.

Frontmost app identity is not source truth. Preview, Word, Excel, and browsers
can have many open documents, and automation can observe the wrong window. Loom
may use app/window/time as weak context, but a trace is promoted to file/page,
file/paragraph, or file/cell only when Service invocation, selected text plus
file URL, source-app metadata, structured parse, capture-triggered appshot, or
user confirmation disambiguates the source. Wrong-window evidence is still
useful as a warning and review cue, but it cannot become memory or export
citation until confirmed.

The input is not a chat composer and, in learning mode, it is not a fixed bottom
bar. In review mode it is a compact commit affordance attached to the current
understanding object. Its target must be inferable before the user types:
meaning, question, correction, synthesis, principle, or a specific
product-reflection stage. In learning mode the default shape is a quiet
document-edge note field: one short user-language input plus icon-only submit,
placed as a small affordance near the understanding page rather than a toolbar
that cuts the center pane into another region. Type, page, file, and assist
controls stay hidden unless the target is ambiguous or the user opens details.
The full anchor stays available in tooltip, accessibility text, the right
evidence pane, or audit trail; it should not repeat the filename and metadata in
the primary writing row. If Loom cannot name the target, the input should not be
visible.

The center pane's default learning state is the organized understanding object,
not the process ledger. Show the user's current understanding as a readable
document first: title hierarchy, paragraphs, selective evidence quotes,
consolidated inline terms, and footnote-like anchors. It should feel like a
well-typeset Word / Markdown / LaTeX-quality page in spirit, not a dashboard or
trace list. Version counts, capture receipts, raw evidence labels, and
automation scaffolding stay behind Capture trail or Details. Internal categories
can organize the model, but visible labels such as `01 Current understanding`,
`Understanding objects`, `Meaning`, `Language`, or `Principles` cannot become a
template column or default section system in the reading page.

### Center And Right Pane Contract

GPT Projects and Claude Projects organize around conversation plus attached
files. That is not enough for Loom. Loom organizes around the user's
understanding versions plus the evidence that proves where each version came
from.

The center pane owns **Understanding Version Flow**. It shows the user's
current chain of understanding: selected material, first interpretation,
correction, open question, second-pass synthesis, and reusable principle. It
should answer: "How did my understanding change and where can it compound next?"

The right pane owns **Evidence Inspector**. It does not own the learning record
and it is not merely a project file drawer. It shows the selected or latest
thinking version's source anchor, original file, page or region, pass, focus,
trace type, and supporting source collection. It should answer: "Why is this
version grounded?"

Center and right pane interaction is explicit: selecting a thinking version in
the center updates the Evidence Inspector on the right. If no version is
selected, the right pane inspects the latest version. The center never expands
into a source drawer, and the right pane never becomes a second note feed.

The right pane may include a Source Collection, but that collection is
secondary. Source Collection is secondary: its job is to let the user return to
the original file or inspect related material. It must not become the main
object, because that would reduce Loom to a GPT/Claude-style file context
product.

Refusal: do not make the center a chat transcript while the right pane becomes a
file list. That is already solved by generic AI project products. Loom's
distinct pair is `thinking version -> evidence inspector`.

### Output benchmark

Loom still needs the baseline strengths of a LaTeX document, a Circle-to-PDF
study packet, `loom-notes`-style fill-in study notes, NotebookLM-style source
collections, and current AI chat exports: fast assembly, complete source
coverage, readable structure, good-enough layout, source-grounded summaries,
Q&A, study guides, active recall scaffolds, and rich review formats. Those are
table stakes, not the moat. A user should never feel that choosing Loom means
giving up the simple ability to produce a clean A4 PDF, Markdown article, study
sheet, source summary, active-recall packet, or review guide from the materials
they collected.

NotebookLM-style source collections are a baseline review object, not the
center workspace.

Source-grounded summaries, Q&A, study guides, and rich review formats are
baseline outputs. The older wording remains intentional: Loom still needs
source-grounded summaries, Q&A, study guides, and rich review formats before it
can claim a stronger thinking-history layer.

Loom output should beat static packets and rich source-summary products where
Loom has a structural advantage. It should not compete mainly on static
typesetting, page layout, the speed of gathering multiple sources into one clean
document, or generic source-grounded Q&A. Existing tools already do those well,
and AI chat can already produce acceptable static summaries.

A compiled course packet can answer: what material was collected, in what order,
and with what presentation quality? NotebookLM-style tools can answer: what do
these sources say, what can I ask about them, and what study artifacts can be
generated from them? Loom must answer a different and harder question: how did
the user's understanding change while using that material across native apps and
multiple passes?

[`loom-notes`](https://github.com/Polaris-Aeterna/loom-notes) answers another
baseline question well: what is the spine of this source, and how can the final
notes alternate between readable exposition and active recall? Loom should
absorb that standard. A study output should be able to expose a single
organizing spine, preserve a readable layer, and add fill-in prompts or
proof/meaning gaps at high-value thinking points. But Loom must not stop there.
The source is not only an answer key for a generated worksheet; the source plus
the user's native-file actions form the evidence trail for how understanding
changed.

NotebookLM-style richness is a baseline product requirement, not the final Loom
shape. Loom should be able to produce a source hub with summaries, questions,
glossaries, timelines, study guides, and cited review artifacts. But those
artifacts are generated from Loom's cognition trail, not only from uploaded
files. The richer view should therefore expose:

- source collection: the documents, sheets, pages, passages, and external links
  in the learning case
- generated artifacts: summary, Q&A, glossary, timeline, briefing, study guide,
  and exportable packet
- learning trail: the user's selected words, phrases, sentences, formulas,
  questions, corrections, and synthesis passes
- versioned understanding: what was first misunderstood, what was corrected, and
  what became reusable thinking

If Loom only offers the first two, it is a weaker NotebookLM clone. If it offers
the last two without the first two, it feels too manual and static. The product
standard is both: rich source aggregation plus reviewable thinking evolution.

The minimum bar for a Loom learning output has two layers.

The concrete reference baseline is the user's `FINS3666 Week 1 Quantitative
Trading Algorithmic Trading.pdf`: a 25-page A4 packet generated from a
Circle-style source, with a clear title, author/time/source line, learning
objectives, key concepts, agenda, sectioned body, readable typography, page
numbers, and enough completeness to review without reopening every source. Loom
must at least produce this class of Learning Output Packet after a study pass.
This is not the moat; it is the minimum quality floor.

Baseline output:

- fast enough to assemble during normal study or review
- complete enough to preserve the important collected sources
- readable enough to export as A4 PDF, Markdown, or a study sheet with title,
  source/provenance, learning objectives, key concepts, agenda, sections, and
  page-aware citations
- rich enough to generate source-grounded summaries, Q&A, glossary, timeline,
  briefing, or study guide views
- active enough to include `loom-notes`-style spine, readable layer, and
  fill-in prompts or review gaps where the user should recall rather than reread
- simple enough that the user does not need to learn a new editor just to get a
  clean packet

Differentiated output:

- anchored source trail: exact file, page, selection, region, sheet, or paragraph
- understanding trail: which first-pass word, phrase, sentence, question,
  correction, or concept produced the final note
- active recall trail: which gaps came from user confusion, confirmed meaning,
  or second-pass synthesis rather than generic AI-generated exercises
- native use trail: what happened inside Preview, Word, Excel, browser, or other
  original tools while their own functions stayed available
- pass history: first language pass, domain pass, correction pass, synthesis pass
- understanding diff: what the user thought before, what changed, and why
- unresolved queue: words, phrases, sentences, formulas, or concepts still open
- synthesis: a user-reviewable explanation, map, glossary, or principle candidate
- reflection memory: what changed in judgment after repeated use, not only what
  the sources contain
- export: a clean article, PDF, Markdown, or study sheet that can show which
  claims came from the original material and which came from the user's
  corrected understanding

Static output is downstream. Loom's differentiated output is the reviewable path
from raw material to understanding to reusable thinking. If Loom only produces a
well-formatted packet from multiple sources, it is not differentiated enough.

This is the main critique of the current prototype: if the center pane displays
too much explanatory provenance, it becomes a debug log; if the composer asks
for generic text or splits the page into a third toolbar region, it becomes a
chat box; if captured selections are shown as independent notes, Loom becomes
another note app. The visible unit must be a thinking version: the smallest
reviewable change in understanding. Metadata is kept for replay and audit, but
it is secondary to the user's actual learning change.

## Design Discipline

The canonical design discipline is
`docs/canon/LOOM_DESIGN_DISCIPLINE.md`. This PRD applies that discipline to the
Reflection workspace and native-file sidecar.

Loom design must proceed through critique and choice, not through feature
accumulation. Every proposed change must answer five questions before
implementation:

1. What mature capability already exists in macOS, Preview, Word, Excel,
   browsers, NotebookLM-style tools, AI chat, LaTeX, or Circle-style packet
   builders?
2. What baseline must Loom match so the user does not lose speed, completeness,
   readability, source coverage, or native muscle memory?
3. What gap remains that only Loom should own: anchored learning trail,
   understanding diff, pass history, judgment memory, or reusable thinking?
4. What tempting implementation is being refused because it would make Loom a
   weaker clone, debug log, note app, chat app, dashboard, or custom reader?
5. What acceptance signal proves the user can still work in the original file
   while Loom improves the second-pass review?

The answer should be written as a product rule, not as an explanation after the
UI has already been changed. If a feature cannot name the existing capability it
leans on and the Loom-only gap it fills, it should not ship.

### Current Requirement Decisions

These decisions summarize the current critique and should guide implementation
until replaced by stronger evidence.

1. **Do not make Loom a better PDF app.** The product direction is to preserve
   Preview / default PDF app behavior and capture learning around it. Rebuilding
   page mode, table of contents, search, Translate, Look Up, Copy, Writing
   Tools, Summarize, or annotation inside Loom is a regression unless the
   native responder chain remains intact and Loom adds an understanding version.

2. **Do not make the center pane a note surface.** The center pane exists
   because native file apps, Word version history, GitHub history, NotebookLM,
   and AI chat do not show the user's cognition versions. The center must show
   selected material, first interpretation, correction, second-pass synthesis,
   open issue, and reusable principle. If it only shows notes or source
   metadata, it has failed.

3. **Do not keep a composer without a commit target.** The input is not a chat
   box and must not become a fixed bottom toolbar in learning mode. It appears
   only when the current action can say what will be created or revised:
   meaning, question, correction, synthesis, principle, Input, Assumption,
   Decision Trace, Outcome, Reflection, or Judgment Memory.

4. **Do not confuse clean output with differentiation.** Fast A4 PDF,
   Markdown, study sheet, glossary, Q&A, briefing, and source-grounded summary
   are required baseline. Loom exceeds a Circle / LaTeX / AI-chat packet only
   when the output also includes source anchors, pass history, learning trail,
   understanding diff, and reusable thinking.

5. **Do not confuse NotebookLM-style richness with the final product.** A rich
   source dossier is required because users expect source collections,
   summaries, questions, glossaries, timelines, and study guides. It becomes
   Loom only when those artifacts also expose the user's own learning trail and
   cognition changes across native-file use.

6. **Do not turn every capture into memory.** Loom is a thinking service, not a
   permanent clipboard. Raw captures stay as reviewable traces. Memory is
   formed only when the user confirms a reusable principle, correction, or
   judgment after second-pass review.

7. **Do not explain the product in the main surface.** User-facing UI should
   look like compact human records: selected word, phrase, sentence, page gist,
   question, correction, or principle. Long product explanations, source app
   metadata, trace type, raw pasteboard content, and debug provenance belong in
   audit trail or documentation.

### Design Choice Ledger

Every implementation pass that changes product behavior, layout, or copy must
record the choice in this form:

`observed issue -> chosen rule -> refusal -> acceptance signal`

| Observed issue | Chosen rule | Refusal | Acceptance signal |
|---|---|---|---|
| Native file capability is at risk. | Native app owns the original work. | No cloned primary PDF / Word / Excel editor. | Native menu, selection, page mode, search, and editing still work. |
| Center surface feels decorative or unclear. | Center owns Understanding Version Flow. | No decorative sections, note feed, mind map, transcript, dashboard, provenance-first table, or split learning/review ledgers. | User can review first meaning, correction, open issue, synthesis, and reusable principle. |
| Composer feels like generic AI chat. | Composer is a document-edge commit affordance. | No always-visible "ask anything" input, fixed bottom toolbar, or mode strip in learning mode. | UI names the target before typing, and details stay folded. |
| Output could be made elsewhere. | Static output is baseline; cognition trail is Loom. | No moat claim based only on formatting, source aggregation, or summary quality. | Export shows source claim, learning trail, understanding diff, and reuse state. |
| NotebookLM comparison raises the quality bar. | Rich dossier is review / export baseline. | No NotebookLM clone as the default center workspace. | Generated artifact exposes source anchors and the learning versions that shaped it. |
| UI copy is too explanatory. | Default entry reads like an editable human learning record. | No developer-facing metadata as the first visible layer. | Audit details are available only when requested. |

### Decision Protocol

Every Loom design decision must move through the same sequence:

`symptom -> critique -> choice -> rule -> acceptance evidence`

The user's feedback is evidence, not an instruction to copy literally. A
complaint such as "this feels weird", "the PDF lost native functions", or "the
center pane has no purpose" must first be translated into the actual product
failure. The failure may be visual hierarchy, native-app preservation, surface
ownership, proportion, terminology, output quality, or lack of differentiated
value. Only after the failure is named can a design choice be made.

The decision protocol:

1. **Name the symptom.** What did the user notice or struggle with?
2. **Challenge the proposed fix.** Would the obvious fix create a weaker clone,
   louder Loom chrome, a generic note flow, a chat box, or a custom reader?
3. **Choose the product owner.** Exactly one surface owns the job: native file
   app, Loom Companion, center workspace, right Sources pane, composer, or
   export surface.
4. **Write the rule.** Convert the choice into a durable product rule that can
   be checked later.
5. **Add evidence.** Define the screenshot, user-path test, native-app test,
   document contract, or product contract that proves the rule held.

Do not ship a design change because it makes one screenshot look better. A
valid change must improve the user path without weakening the original file
workflow, the second-pass review, or the future memory system.

### Requirement Writing Standard

The Reflection workspace is not designed from interface references alone. A
reference image, native app screenshot, user phrase, or competitor comparison
must be rewritten before it can become implementation work.

The required form is:

`symptom -> critique -> choice -> owner -> refusal -> acceptance`

For this product, the most common bad requirements are:

- "Make it cleaner" without naming which user path is unclear.
- "Make it like Codex" without naming whether the issue is window grammar,
  pane ownership, control alignment, or density.
- "Use Liquid glass" without naming which surface should be visually
  subordinate or persistent.
- "Support PDF" without preserving Preview, selection, context menus,
  Translate, Look Up, Copy, Writing Tools, search, zoom, and page modes.
- "Make NotebookLM-like output" without separating source-summary baseline
  from Loom's thinking-history layer.
- "Add chat" without naming the anchor, pass, state, and version target.

The required order of work is:

`job -> owner -> user path -> proportion -> material -> copy -> evidence`

This order is part of the PRD. The job and owner decide whether a pane, button,
composer, or output should exist. Proportion and material are applied after the
surface duty is clear. Copy is written after the object it creates or revises is
known. Evidence comes from a real user path, not from a static screenshot alone.

### Requirement Triage

Every new Loom request must be classified before implementation:

| Classification | Meaning | Action |
|---|---|---|
| Invariant | A rule Loom must preserve every time | Add or update canon/PRD/test coverage |
| Baseline | A capability mature tools already provide | Preserve, match, or integrate it; do not claim it as differentiation |
| Differentiator | A job only Loom should own | Design the primary interaction around it |
| Refusal | A tempting direction that would make Loom weaker | Write the refusal explicitly so it does not return later |
| Open question | A real uncertainty that needs evidence | Run a user-path test, screenshot comparison, or prototype experiment |

If a request cannot be classified, it is not ready for implementation. If a
request is only a baseline, the design should lean on the mature tool and keep
Loom thin. If a request is a differentiator, Loom may add surface area, but only
when the new surface produces a reviewable understanding version.

### Capability And Evidence Ladder

The Translate example is not a translation requirement. It is an operating
pattern for every native or mature capability Loom touches.

Before adding a Loom feature, the implementation must ask:

1. What does the original app or macOS already do well?
2. What can Loom observe without weakening that native path?
3. What cannot be observed because of sandboxing, permissions, unavailable APIs,
   source-app limits, or user privacy?
4. What is the smallest truthful fallback that still creates a reviewable
   understanding version?

Use this evidence ladder for source context:

1. selected text, copied translation, structured file parse, or imported file
   metadata
2. native document metadata such as file URL, document title, page, sheet, cell,
   paragraph, or region when available
3. Accessibility app/window/page context when sandboxing permits it
4. Services, pasteboard, share sheet, or explicit import handoff
5. Loom-owned appshot plus OCR, Vision, or multimodal extraction
6. user-confirmed manual anchor

The product rule is degradation with honesty. If Loom only has app/window/time,
say `app/window/time`. If it only has visual evidence, say `visual context only`.
If OCR or a model guessed a table, figure, formula, or highlighted region, store
it as a candidate with confidence, not as source truth. Never upgrade weak
evidence into file/page/cell certainty for the sake of a cleaner UI.

The simplest path wins. A system feature plus a thin Loom receipt is usually
better than a custom Loom clone. Build a new Loom surface only when the existing
path cannot produce anchored understanding, review, synthesis, memory, or
export from the cognition trail.

### Questioning And Choice Discipline

Loom requirements are not accepted as features. They are converted into
disciplines through repeated questioning. The product owner may describe a
symptom, example, analogy, or desired interaction; the implementation must first
decide whether that request exposes a product law, a baseline expectation, a
real differentiator, or a misleading shortcut.

Before adding any control, pane, copy, animation, capture type, export, or AI
behavior, write a short decision record with these fields:

1. **Observed failure.** What is actually wrong in the user path?
2. **User example.** What did the user point to or compare against?
3. **Bad literal fix.** What would we build if we copied the example too
   directly, and why would that weaken Loom?
4. **Existing capability.** Which native app, system feature, AI tool, packet
   builder, or source-summary product already solves part of this?
5. **Evidence fallback.** If the strongest context is unavailable, which lower
   rung of the evidence ladder is acceptable, and what precision label will the
   user see?
6. **Chosen owner.** Which surface owns the fix: original file app, Loom
   Companion, center workspace, Sources, composer, export, or memory?
7. **Discipline added.** What rule now prevents the same mistake returning?
8. **Acceptance evidence.** What human path, screenshot, contract, or native
   app behavior proves the rule?

If the decision record cannot identify a bad literal fix, the team has not
questioned the request deeply enough. If it cannot identify an existing
capability, Loom is probably about to clone something mature. If it cannot name
one chosen owner, the UI will drift into overlapping surfaces.

Every accepted design choice must also carry a refusal. Example: "Use Preview
as the PDF reader" carries the refusal "do not rebuild PDF page mode, search,
Translate, Look Up, or annotation inside Loom." "Center workspace is
Understanding Spine inside Understanding Version Flow" carries the refusal "do not render a generic note feed,
transcript, mind map, or debug provenance table." The refusal is part of the
requirement, not commentary.

Every implementation pass must also write or preserve an implementation record:

`classification -> preserved capability -> baseline matched -> Loom-only value -> surface owner -> refusal -> acceptance path`

This record is required for visual changes as well as functional changes.
"Cleaner", "more native", "more like Codex", "more like Preview", "more
NotebookLM", and "more glass" are symptoms, not requirements. They become
requirements only after the record names the preserved mature capability, the
baseline Loom must still match, the Loom-only understanding-history value, the
one surface that owns the change, and the refusal that prevents feature drift.

This is how Loom avoids becoming a bundle of familiar apps. Baseline
capabilities are preserved or integrated; Loom surface area is reserved for
understanding versions, pass history, corrections, synthesis, and reusable
thinking.

### Design Constitution

These are the operating laws for the current Loom direction:

1. The original file is the subject; Loom is the learning and reflection layer
   around it.
2. A native capability is always cheaper than a Loom clone unless Loom adds an
   understanding version on top.
3. The center pane earns its existence only by showing how understanding changed
   across passes.
4. A capture is not complete until it has an anchor, pass, trace type, user
   meaning, and state.
5. The composer is not a chat box; it commits or revises the next understanding
   version.
6. Static output is a baseline export, not the product's core value.
7. Rich source summaries are baseline; Loom's edge is rich summaries plus the
   user's learning trail and thinking evolution.
8. A design that cannot be tested through a real user path is an illustration,
   not a product improvement.
9. UI polish must follow functional hierarchy: native file first during
   reading, Loom first during synthesis.
10. No visible surface may exist without a single product duty.

### Center Workspace Discipline

The center workspace should be presented to the user as **Understanding Review**
(`理解复盘`) and backed by **Understanding Version Flow** (`理解版本流`). The
review object is what the user works with; the version flow is the traceability
and compounding mechanism underneath it. This is more precise than "notes",
"mind map", or "workspace" because the center's job is to show the user's
evolving interpretation across first pass, review, synthesis, and reuse.

Its visual grammar starts with the current review focus and a compact stage
line: `Capture -> Meaning -> Review -> Memory`. The version spine then shows
the evidence-backed changes that produced that focus. Loom may borrow the
useful part of Codex's activity stream: continuity, lightweight rows, and quick
inspection of linked evidence. Loom must reject Codex's actual job: Codex
records what an agent did, while Loom records how a user's understanding
changed. A center row is not "read file" or "edited file"; it is source contact,
first meaning, language gap, corrected understanding, synthesis, or reusable
thought.

For source-learning cases, the center should default to compact human records:

- selected word, phrase, sentence, table cell, page region, or passage
- user meaning, question, correction, or principle
- pass, review state, and reuse state
- source anchor
- collapsed audit trail

It should not default to long explanatory metadata. Metadata is necessary for
traceability, but it belongs behind an audit disclosure. The visible record
should feel editable by a person and useful in a second pass: the user can see
what they did not understand, what they later understood, what still needs work,
and what can become reusable thinking.

The center must consolidate learning traces into semantic objects. A first pass
may capture `market`, `making`, and `market making` separately because the user
encountered them separately. That example defines the method, not a translation
feature. The review result should not remain a flat list of notes when the
source context proves the traces belong together. A larger object may be a
phrase, sentence, formula, table, figure, claim, example, question, correction,
concept, or reusable principle. It must show the fields useful for review first
and collapse raw capture order, source events, OCR/appshot candidates, and
automation metadata into supporting evidence or audit.

For product cases, Input, Assumption, Decision Trace, Outcome, Reflection, and
Judgment Memory are stage labels inside the same version flow. They should not
be treated as a separate "reflection mode" that breaks the learning/review
continuum.

### Composer Discipline

The document-edge input exists only if it has a version target. Before showing a
composer, the product must know what the next commit will become:

- add meaning to the current unresolved word, phrase, sentence, formula, or
  passage
- ask a question tied to an anchor
- correct a previous interpretation
- promote a second-pass synthesis
- commit a reusable principle
- add concrete Input, Assumption, Decision Trace, Outcome, Reflection, or
  Judgment Memory to a product case

If the composer cannot name one of these targets, it should be hidden or scoped
until the user selects an object. A generic "ask or type anything" box is not a
Loom primitive; it belongs only inside an explicitly labeled AI conversation
trace.

### Output Discipline

Loom must eventually produce outputs that match the speed, completeness,
structure, readability, and rich presentation of AI chat, Circle-style packets,
LaTeX/PDF exports, NotebookLM-style study views, Word/PPT documents, dynamic
HTML dossiers, and video or narrated walkthrough formats. But output is
downstream of review.

The correct sequence is:

`native use -> anchored captures -> understanding versions -> second-pass synthesis -> export`

An export may become an A4 PDF, Markdown article, Word document, slide deck,
dynamic HTML artifact, video/script outline, study sheet, glossary, briefing,
Q&A set, or source-grounded summary. It is valid only if the user can trace
important claims back to the original file and see which parts came from their
own learning, correction, or judgment. If the output cannot show that path, it
is just another static or rich AI-generated packet.

Rich output has four requirements:

- structural strength: the artifact has a spine, sections, hierarchy, and a
  deliberate review path
- readability: the artifact is concise enough to study from and polished enough
  to share
- media fitness: static PDF/PPT/Word and dynamic HTML/video are chosen for the
  use case, not because Loom needs more surfaces
- replayability: the artifact can expose source anchors, learning versions,
  corrections, open questions, and reusable principles behind the final result

### Baseline vs Differentiation

Do not confuse a baseline feature with product differentiation.

| Existing strength | Loom baseline requirement | Loom-only requirement |
|---|---|---|
| Preview/default PDF apps | preserve native reading, page modes, search, zoom, Translate, Look Up, Copy, Writing Tools, Summarize, Services, annotation, and sharing | capture what the user learned from a page, selection, or region and return to it later |
| Word/Excel/PowerPoint | preserve editing, formulas, sheets, comments, review/version tools, and familiar menus | record why a passage, cell, table, version, or edit mattered to the user's thinking |
| NotebookLM-style tools | generate summaries, Q&A, glossaries, timelines, briefings, study guides, and cited review views | show how the user's own understanding changed across native-file use and repeated passes |
| AI chat | answer questions and draft readable explanations quickly | ground answers in the user's anchored learning trail and require user confirmation before memory |
| LaTeX/Circle-style packets | produce clean A4 PDF, Markdown, or study sheets quickly | compile only after preserving the path from source material to understanding to system thinking |
| `loom-notes` fill-in notebooks | find a spine, write readable exposition, and add active recall gaps | make each gap traceable to a source anchor, learning pass, correction, or memory candidate |

This table is a design filter. If Loom merely copies the middle column, it is
late to the market. If Loom ignores the middle column, it feels worse than tools
users already have. The product has to do both: meet the baseline and own the
thinking-history layer.

### Surface Duties

Each visible surface has one primary obligation.

- Native file surface: keep the original work alive and fully functional.
- Loom Companion: confirm a capture, keep the user near the file, and offer a
  route back to second-pass review. It is a receipt, not a card: it shows saved
  state and navigation actions only, then gets out of the way. It never shows
  preview content, raw metadata, or explanation.
- Native translation receipt: preserve the result of a system language action
  after the user commits it; never replace the macOS Translate, pronunciation,
  Look Up, or Copy Translation surface.
- Visual extraction: enrich weak or visual-only anchors with OCR, layout, table,
  figure, and emphasis candidates; never claim higher precision than the source
  app, sandbox, or user confirmation provides.
- Left sidebar: choose the current case; never become source review.
- Center workspace: show Understanding Version Flow; never become a generic
  notes list, transcript, mind map, or split learning/review ledger.
- Right Sources pane: inspect material; never become a second editor.
- Composer: commit the next understanding version; never become an open-ended
  chat prompt unless the product object is explicitly an AI conversation trace.
- Export surface: produce readable packets after review; never replace the
  review path itself.

### Commit Rule

The atomic Loom unit is not "note". It is "understanding version".

Each capture or manual entry should preserve:

- source anchor: selected text plus the highest verified source context available
  (file/page/region/cell when available; app/window/time as an honest v1 fallback)
- optional visual appshot anchor: a small screenshot or crop captured at the same
  moment, only when the user has granted screen capture permission and only as
  visual context, not as a replacement for source metadata
- native tool receipt: system action name, copied translation or lookup result
  when available, language pair when available, and explicit user confirmation
  that this event should survive the reading pass
- extraction confidence: when OCR, Vision, or a multimodal model interprets a
  screenshot, the candidate text/table/figure/region must carry a confidence or
  precision label such as `visual context only`
- pass: first language pass, domain pass, correction pass, synthesis pass, or
  product reflection pass
- type: word, pronunciation, phrase, sentence, grammar, idiom, translation,
  page gist, question, concept, evidence, decision, correction, or principle
- user meaning: what the user understood, misunderstood, corrected, or wants to
  reuse
- state: needs meaning, needs interpretation, open question, corrected,
  committed, or memory candidate

Raw metadata can exist, but it must not be the main reading layer. The visible
entry should feel like a human learning record that can be edited, corrected,
and later compiled.

### Refusal Rules

Reject the design if it does any of the following:

- rebuilds a native PDF/Word/Excel function instead of preserving the original
  app
- treats uploaded files only as RAG attachments for AI answers
- treats rich source summaries as the final product rather than a baseline view
- makes the center pane a static mind map, note feed, or debug provenance log
- makes the composer a generic chat input with no version target
- makes Loom visually louder than the original file during reading
- stores material without enough anchor data to replay the learning moment
- produces an export without preserving what changed in the user's
  understanding
- adds controls without assigning them to a single surface duty
- calls a feature complete before checking the user can still use native
  Translate, Look Up, Copy, Writing Tools, Summarize, Services, page modes,
  search, zoom, and editing where the original app supports them
- rebuilds translation, pronunciation, dictionary, or screenshot OCR UI that
  macOS already handles, instead of turning those native actions into reviewable
  understanding versions
- stores OCR / model output from an appshot as if it were exact PDF text, a
  precise table, or a verified page anchor without confidence and precision
  labeling

## Functional Zones

Reflection has four zones. Each zone has one job.

| Zone | Job | Rejection signal |
|---|---|---|
| Titlebar | Window-level navigation, current case, status, source count, pane toggles | Looks like a separate toolbar row or has controls on different vertical axes |
| Left sidebar | Case list, search, create reflection, delete obsolete reflection, local state | Becomes a source browser, content pane, destructive dashboard, or second content pane |
| Center workspace | Understanding Spine inside Understanding Version Flow; source-learning and product-reflection use different stage labels inside the same flow | Becomes chat, an agent operation log, a mind map, a dashboard, a note feed, split learning/review ledgers, or a low-fidelity PDF replacement |
| Right Sources pane | Source import, source list, filter, selected source preview | Becomes a second editor, decorative inspector, or permanent reader companion |

### Code Ownership Target

The current prototype may still contain large files, but the target split is:

- `reflection/types`: case, source, anchor, capture, and understanding-version
  contracts.
- `reflection/lib`: version parsing, anchor inference, import normalization,
  and persistence helpers.
- `reflection/left-sidebar`: case navigation, search, create/delete, collapse,
  and peek behavior.
- `reflection/center-flow`: Understanding Spine / Understanding Version Flow, row selection,
  audit disclosure, and commit target display.
- `reflection/right-evidence`: Evidence Inspector, Source Collection, import,
  and selected-source preview.
- `reflection/native-sidecar`: Preview / Word / Excel open/capture bridge,
  companion receipt, Services, Accessibility, and native verification.
- `reflection/backend`: API routes, local file records, generated artifacts,
  and cleanup/verifier scripts.

Parallel Codex sessions should claim one owner at a time. A task that changes
the shared type, anchor, or version contract is not a left/middle/right-only
task; it must be treated as a shared-contract task first.

For learning cases, a center entry must look like a thinking version, not a
machine log. Its first visible layer is:

- version number
- version type: selected word, phrase, sentence, passage, data, user meaning,
  correction, question, or principle
- state: needs meaning, needs interpretation, committed, corrected, open
  question, or memory candidate
- human-readable material: original selection or committed understanding
- source anchor

Raw source app, trace type, window title, file path, and unprocessed capture text
belong behind `Audit trail`.

## UX And Visual Standards

### Titlebar

Titlebar controls share one center line with the native traffic lights.

The sidebar toggle, center case identity, status, source count, and Sources
toggle must feel like one macOS titlebar control family. They must not be
implemented as separate rows, cards, or pane headers.

Required:

- 52 pt titlebar height
- 16 x 16 pt titlebar controls
- 16 pt titlebar control center line
- top inset derived from center line and control size
- no custom titlebar material strip
- no full-width hard bottom rule
- no large pill-shaped titlebar controls

### Materials

The whole Reflection workspace may use macOS Liquid Glass, but the materials
must be differentiated by job.

- Left sidebar: true transparent navigation glass. It may reveal the desktop or
  source app behind the window, and its text/icons must adapt to light or dark
  mode.
- Center workspace: matte/frosted workbench. It may have depth, blur, and
  paper-like translucency, but it must remain the clearest reading and review
  surface on the screen. It cannot own prism light, moving glare, persistent
  glow, or animated color wash.
- Right Sources pane: quieter frosted inspector glass. It supports evidence
  inspection without becoming a second source reader or a debug panel. It can
  use depth and blur, but it must stay visually quieter than the center
  understanding object and cannot use action-light effects as decoration.

Glass is a system material, not a painted gradient. Do not use decorative
linear/radial gradients to fake translucency. A narrow one-direction specular
highlight is allowed only when it reads as glass edge thickness or refraction.
If a surface becomes visually louder than the original file or the understanding version, the material is
wrong even if it looks more "liquid".

Optical light is reserved for moments of action: input focus, commit, loading,
saved, or short status transition. The Siri-like white/prism effect is a point
of emphasis, not the workspace theme.

### Proportion

Baseline desktop window: 1320 x 860 pt.

Fixed rails:

- left sidebar: 240 pt
- right Sources pane: 400 pt
- center workspace: flexible remainder
- thread max width: 720 pt

The left rail is navigation. The center owns the active thinking. The right
pane owns evidence. Proportion changes must preserve that product hierarchy.

### Collapse

Pane collapse belongs only in the titlebar.

No floating rail buttons, duplicate sidebar toggles, bottom status bars, or
secondary pane headers are allowed. When a pane collapses, the center workspace
absorbs the available width and the thread remains centered.

Temporary sidebar peek is allowed only as a collapsed-state hover affordance.
Hover near the left edge may slide the sidebar out as an overlay. While the
pointer remains inside the slid-out sidebar, the sidebar stays visible. When
the pointer leaves the sidebar, it returns to collapsed. This must not change
the permanent sidebar state, center/right pane proportions, pane seams, titlebar
layout, or add a second sidebar toggle. In overlay mode, the sidebar glass uses
the center workspace background as its transparent material base instead of
reusing the permanent left-rail material. Its internal controls also shift
to center-pane hierarchy: search, new reflection, selected rows, row metadata,
and delete controls must feel like a temporary workspace overlay, not the
permanent left rail stretched across the content.

### Local Import

Import means attach the original local file to Loom memory. It should not copy
the user's workflow into a weak Loom viewer. A local import must add the file to
the current memory context, keep a direct file reference when possible, open the
file through the default native app, and create an initial trace so the file
enters the learning or reflection workflow immediately.

In product-reflection mode, that initial trace may append a concrete Input
line. In learning mode, that initial trace may record the file, page count,
first-pass purpose, language, or learning pass. The basic version may show a
text preview for readable local files and a filename/type/size summary for
binary files, but preview metadata is not the product value; anchored traces
are.

### Sidecar Mode

When the active source is a PDF or another local file, Loom opens that source
in the user's native app instead of rendering it inside Loom. In
Sidecar Mode, the original app is the current subject and keeps its own
affordances: table of contents, thumbnails, page layout, search, zoom,
annotation, Translate, Look Up, Copy, Writing Tools, Summarize, Services,
sharing, and file-specific workflows. Loom does not rebuild a weaker PDF,
Excel, Word, or PowerPoint surface.

Sidecar Mode keeps Loom around the material:

- native app: the original PDF, spreadsheet, document, slide deck, browser
  page, or other file surface
- Loom sidecar: reflection case, learning pass, trace list, and capture tools
- anchored capture: language, pronunciation, phrase, sentence, grammar, idiom,
  translation, page gist, confusion, concept, product evidence, or reflection
  trace tied back to file, page, region, selection, pass, and user meaning

Entering Sidecar Mode may collapse Loom's left sidebar and Sources pane so the
file remains dominant. This is allowed because the active subject has changed
from reflection synthesis to original-file learning.

Native macOS is the acceptance target for PDF reading. Imported PDFs should
open in Preview or the user's default PDF app. Loom may retain an internal
preview as a fallback for historical routes, but the product path must not
depend on cloned controls for one-page/two-page view, annotations, search,
translation, or page navigation. Those are native file-reader states, not Loom
features.

Any internal fallback preview must not block the responder chain or replace the system menu.
Loom can add a capture action only after preserving native Look Up, Translate,
Copy, Writing Tools, Summarize, Services, zoom, selection, and page layout
behavior.

The first native bridge is a macOS Services capture. When the user selects text
inside Preview, Word, Excel, a browser, or another document surface, the Service
named "Capture Selection in Loom" reads the system pasteboard and appends that
selection to the current Loom sidecar as an anchored Input trace. The Service
must not replace the original app's contextual menu; it only adds a route from
native selection to Loom memory.

The web `/reflection` surface is a parity prototype for layout and workflow,
not the final file capability surface. In the browser, the default PDF path
should prefer the browser's own PDF viewer. PDF.js, canvas rendering, or image
rendering are fallback previews only; they are not acceptable as the primary
Mac product path because they lose native file and macOS services.

One-page and two-page viewing are PDF layout states, not Loom features. The fixed right Sources pane is hidden in Sidecar Mode.
Loom should not cover the PDF page or force another permanent pane when the
document needs the space.

When Loom is acting as an external companion, the main Loom workspace should
stay parked. The visible arrangement should be the native file surface plus a
small Loom Companion panel. The full Loom workspace returns only when the user
chooses Review in Loom, reopens Loom intentionally, or starts the second-pass
synthesis.

The companion is intentionally smaller than a note card and transient. Runtime
feedback should work like Appshots-style capture confirmation: title, saved
state, Back to Source, Review in Loom, close, then auto-dismiss. Do not show CSV
previews, extracted quotes, source metadata, trace explanation, or second-pass
summary in this layer.

The companion's first action should preserve the original work surface. A
selection capture should offer Back to Source and restore the originating
Preview, Word, Excel, browser, or document app when that process is still
available. A file import should offer Open Source and open the original file
with the system-default app. Review in Loom is the secondary action for
second-pass synthesis, not the default continuation of reading.

The companion copy should be a light confirmation, not a product explanation.
It can show Loom, Saved, the source title, Back to Source / Open Source, Review
in Loom, and close. It must not show the selected material, extracted quote,
source metadata, trace explanation, or second-pass status; those belong in
Understanding Version Flow and Evidence Inspector after the user intentionally
opens review. It should not repeat developer-facing reassurance like "Preview
stays primary"; that rule belongs in the product contract, not in the user's
reading flow.

### Learning Trace Capture

The smallest valuable capture is not a note. It is:

`file + anchor + pass + trace type + user meaning`

Captures preserve file, page or region, pass, trace type, and user meaning.

Examples:

- file: `Week 1 Notes.pdf`
- source anchor: file, page, region, sheet/cell, selection, or user-confirmed
  location; never imply more precision than the native app and permissions
  actually provide
- anchor: page 3, selected phrase, or page region
- pass: first language pass
- trace type: word, pronunciation, phrase, sentence pattern, grammar, idiom,
  translation, page gist, question, concept, or product evidence
- user meaning: the user's Chinese explanation, question, correction, or
  understanding
- consolidation: `market` and `making` may start as word traces, but when
  `market making` is captured from the same passage, the phrase becomes the
  visible review object and the word traces become evidence

The UI should make this cheap. A selected PDF passage can use macOS Translate
or Look Up first, then Loom records the useful result and the user's own
interpretation. Loom must capture the learning state without forcing the user
to leave the PDF or duplicate what macOS already does well.

Second-pass synthesis is allowed to be richer: group all unknown words on a
page, separate language traces from knowledge traces, compare pass 1 and pass
2, build a glossary, produce a Chinese explanation, or turn product evidence
into Input/Assumption/Decision Trace.

When a learning case reaches `Second pass ready`, the center workspace should
continue the same Understanding Version Flow rather than switch products. It
should show compact understanding versions first, then review, correction,
synthesis, and principle candidates in the same chain. Raw six-part
product-reflection scaffolding belongs to product cases as stage labels, not as
a separate workbench. The center is a return surface for reviewing how
understanding changed, not a replacement reader, chat answer, note feed, or
duplicate PDF/Word/Excel pane.

Manual text typed into a learning case is an understanding version, not a
product event and not a generic note. It should be committed into Thinking
Version History as user meaning, question, correction, or principle, and only
explicit principles can become memory candidates.
When possible, manual meaning should attach to the most recent unresolved
source anchor so the user's second-pass meaning stays linked to the selected
word, phrase, page, paragraph, or data region that caused it.

### Deletion

Delete reflection belongs to the left sidebar row.

Deleting a reflection must not live in the titlebar or bottom status area. The
delete control is scoped to the case row because it acts on that case, not the
whole workspace. Deleting the selected case should select a neighboring case.
Deleting the final case should leave one empty reflection so the workbench never
has an invalid center state.

### Copy

Visible language must stay literal:

- Reflection
- Sources
- Input
- Assumption
- Decision Trace
- Outcome
- Reflection
- Judgment Memory
- Add files

Do not use metaphor names for primary navigation or first-run workflow.

## Product Acceptance Standard

A Reflection build is acceptable only when all of these are true:

1. Product intent is visible: Loom reads as an external learning and thinking
   layer around original files, not a generic chat, notes, dashboard, or
   portfolio surface.
2. The original file remains primary when the user is reading or working in a
   file.
3. Captures preserve selected text, pass, trace type, user meaning, and an
   anchor-precision label. File/page/region/cell precision is preferred, but v1
   may honestly fall back to app/window/time precision when sandboxed native apps
   do not expose cross-app document context.
4. Anchor precision is user-facing evidence, not hidden debug metadata. A trace
   with only app/window/time context must say so explicitly instead of implying
   file/page/cell certainty. Weak fallback labels such as `window+page`,
   `window+time`, `app+time`, and `unknown` require a short `anchor note` that
   says why the anchor is weaker than file/page/cell precision.
5. Appshots may strengthen weak anchors, but they are capture-triggered evidence,
   not continuous surveillance, not a replacement reader, and not a claim of
   exact file/page precision unless the screenshot itself or another source
   proves that precision.
6. The four zones have non-overlapping jobs.
7. The titlebar controls share one center line with the native traffic lights.
8. Left navigation glass, center matte workbench glass, and right frosted
   inspector glass join cleanly at pane seams without turning the workspace into
   one repeated translucent slab.
9. The layout does not split into six boxed regions.
10. In Reflection Mode, the center thread and composer stay centered at the
   baseline window size and after pane collapse.
11. In Sidecar Mode, a PDF or local file opens in its native app while Loom stays
   a subordinate record layer.
11. Native file reading preserves macOS system actions: Look Up, Translate, Copy,
   Writing Tools, Summarize, Services, selection, search, zoom, page layout,
   annotation, share/open, and the normal PDF context menu.
12. A macOS Services capture can send selected text from the native file surface
   into Loom as a concrete Input trace without replacing the native menu.
13. A native Translate, Look Up, pronunciation, or Copy Translation event can
   become a translation receipt only after the user explicitly commits it; Loom
   must not shadow or replace the macOS bubble.
14. A Loom-owned appshot can be OCR / Vision / model processed into candidate
   text, table, figure, layout, and emphasis evidence, but the row must say
   `visual context only` unless a stronger source anchor is also verified.
15. The center review page consolidates word, phrase, sentence, and concept
   captures into understanding objects; raw capture order remains audit
   evidence, not the default reading surface.
16. Sources remains inspectable as material, not merely metadata.
17. Local import creates a current-case source and concrete Input trace entry
    or learning trace.
18. The implementation is backed by a contract test or explicit visual
   acceptance note.
18. Reflection deletion is row-scoped in the left sidebar and preserves a valid
   selected case after deletion.
19. Collapsed left sidebar supports temporary hover peek without changing
    permanent sidebar state or center/right pane proportions.
20. Temporary hover peek uses center-backed glass so the overlay visually
    belongs to the pane it covers.
21. Native sidecar acceptance includes a human path: Computer Use or a human
    verifies Preview/Word/Excel are still inspectable native windows, PDF
    context menu actions such as Look Up, Copy, Translate, page layout, and
    Services remain available, Loom appears only as a transient saved receipt,
    and Review in Loom shows anchored understanding versions after capture.

Reject PRD drift if:

- a change adds UI because it is possible rather than because a product object
  needs it
- a pane starts doing another pane's job
- visual polish hides the reflection loop
- a control is aligned by feel instead of by a named standard
- a destructive row action moves into the titlebar or becomes permanent chrome
- a PDF is converted into a canvas, image, or custom reader as the primary Mac
  experience and loses Translate, Look Up, Writing Tools, or Services
- Loom captures unanchored notes without declaring anchor precision, or pretends
  app/window-level evidence is file/page-level evidence
- appshots are captured continuously, stored outside Loom, shown as the main
  learning object, or used to fake precision that was not actually available
- reading mode makes Loom visually louder than the original file
- web and native versions diverge without a documented reason

## Engineering Contract

Every Reflection implementation pass should update or verify all relevant
layers:

1. PRD or product definition if the user-facing product changes.
2. Layout contract if proportions, materials, or chrome behavior change.
3. SwiftUI native implementation.
4. Web `/reflection` parity when the same product rule applies.
5. Contract test for stable standards.
6. Screenshot or live app inspection for visual claims.

Do not call a visual change complete from source code alone.

Do not call a product change complete from a screenshot alone.

## Current V1 Scope

In scope:

- native macOS Reflection workspace
- web `/reflection` parity
- native file sidecar model that opens Preview/default apps and preserves macOS
  system services
- anchored learning traces for PDF page or selection
- fixed left/center/right workbench
- collapsible left sidebar and Sources pane
- row-level reflection deletion in the left sidebar
- six-part reflection trace
- local sample reflection cases
- Sources list and selected source preview
- composer for adding material into Input

Out of scope for this PRD:

- team collaboration
- publishing
- Digital Me identity pages
- full provider-backed AI reflection
- full source importer acceptance
- cloned Excel or Word editors
- replacing Preview, default PDF apps, Excel, Word, or macOS document menus
- cross-device sync

Those can be added only after the core reflection workbench has a stable
product standard.
