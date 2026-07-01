# Loom Design Discipline

**Status:** Canon
**Locked:** 2026-06-28
**Scope:** Reflection, native-file sidecar, Understanding Version Flow, exports,
and any future learning / review surface.

This document exists because Loom cannot be designed by adding whatever the
last complaint suggested. The product is only differentiated if every change is
forced through critique, choice, refusal, and evidence.

## Core Claim

Loom is not a note app, PDF reader, AI chat wrapper, NotebookLM clone, LaTeX
renderer, Circle-style packet builder, dashboard, or mind map.

Loom is a local cognitive version-control layer around original work. It keeps
the original file and native app in charge, then records how the user's
understanding changes across repeated use.

The product test is:

`native work -> anchored capture -> understanding version -> second-pass synthesis -> reusable thinking -> export`

If a design does not improve this chain, it is not a Loom design.

## Discipline Stack

Loom has three layers of requirements. They must not be mixed.

| Layer | Question | Rule |
| --- | --- | --- |
| Preservation | What must the user not lose? | Keep native file and macOS capabilities intact. |
| Baseline | What can mature tools already do well? | Match or integrate it quietly; do not call it the moat. |
| Differentiation | What should only Loom own? | Version the user's understanding across repeated use. |

Most wrong Loom designs happen when a baseline is mistaken for
differentiation. A clean A4 PDF, a study guide, a source-grounded summary, a
Q&A view, a PDF page mode, an Excel table preview, or a Word-like review panel
can be required without being the product's reason to exist.

The discipline is:

`preserve mature tools -> satisfy baseline output -> spend Loom surface area only on understanding versions`

If a proposal skips the first step, it damages user trust. If it skips the
second, Loom feels worse than existing AI tools. If it skips the third, Loom is
not differentiated.

## Non-Negotiable Requirements

1. **The original file stays primary.** PDF, Word, Excel, browser, Finder, and
   macOS own their native capabilities.
2. **Loom must not steal mature features.** Translate, Look Up, Copy, Writing
   Tools, Summarize, search, zoom, page mode, formulas, comments, review,
   version history, and file editing stay in the original app unless Loom adds
   an understanding version on top.
3. **Use a capability ladder before building.** Ask what the original app,
   macOS, browser, AI source tool, or file format already provides. Preserve the
   strongest existing capability, then add the smallest Loom-owned layer needed
   for understanding versions, review, synthesis, or memory.
4. **Use an evidence ladder when information is missing.** Prefer selected text
   or structured file parse; then native document metadata; then Accessibility
   app/window/page context; then Services or pasteboard; then Loom-owned
   appshot/OCR/Vision/model extraction; then user-confirmed manual anchor. Every
   fallback must carry a precision label.
5. **The simplest truthful path wins.** If sandboxing, permissions, unavailable
   APIs, or source-app behavior blocks a precise path, degrade honestly before
   building a larger Loom feature. A small receipt plus a weak-but-labeled anchor
   is better than a fake precise workflow.
6. **Structured rich output is table stakes.** A4 PDF, Markdown, Word/PPT
   packet, dynamic HTML dossier, video/scripted walkthrough, study sheet,
   glossary, Q&A, timeline, briefing, source-grounded summary, and
   `loom-notes`-style active recall packets are baseline outputs, not the moat.
   The floor is a Circle-style course packet plus a fill-in study packet:
   title, source/provenance, learning objectives, key concepts, agenda,
   sections, readable typography, a spine, fill-in prompts or review gaps, and
   page-aware review.
7. **NotebookLM-style richness is baseline.** Source aggregation and generated
   study artifacts are required, but Loom differentiates only when those
   artifacts include the user's learning trail and thinking evolution.
8. **The center is Understanding Version Flow.** It exists to show how
   understanding changed, not to list notes, show a transcript, render a mind
   map, expose debug provenance, or split learning and review into separate
   products.
9. **The right pane is Evidence Inspector first.** It proves the current
   understanding version with source anchor, original file, page or region, pass,
   focus, and trace type. Source Collection is secondary; it is not a generic
   GPT/Claude project file drawer.
10. **Appshots are visual evidence, not the product object.** A capture-triggered
   screenshot can strengthen a weak anchor when sandboxing blocks precise
   cross-app document context, but it cannot replace selected text, user meaning,
   source precision labels, or native-file ownership.
11. **Native translation is only one example of preserved native actions.** macOS
   Translate, pronunciation, Look Up, Copy Translation, and Writing Tools own the
   immediate language help. Loom may capture a translation receipt only after the
   user explicitly commits it, and the receipt must preserve original text,
   translated text when available, source anchor, native tool, pass, and user
   meaning.
12. **Visual extraction is a fallback and enrichment path.** OCR, Vision, and
   multimodal models may structure an appshot into text, table, figure, layout,
   or emphasis candidates, but the output must carry confidence and precision
   labels. It cannot silently upgrade a screenshot into a file/page/cell anchor.
13. **Frontmost app is not source truth.** In a multi-window native app,
   `Preview` or `Word` being frontmost does not prove which file, page,
   paragraph, sheet, or cell the user meant. Service-triggered selected text,
   explicit file URL, source-app metadata, capture-triggered appshot, or user
   confirmation must disambiguate the source before Loom promotes a trace.
14. **Wrong-window evidence must downgrade the anchor.** If validation sees a
   different Preview / Word / Excel document than the target learning file,
   Loom must record the event as `app/window/time` or `visual context only`,
   not as file/page/cell. The right pane may show the ambiguity; memory and
   export cannot use it until confirmed.
15. **The composer is a commit affordance, not a bottom bar.** It commits or
   revises a specific understanding version. It is not a generic chat input and
   it must not cut the center pane into a third zone. In learning mode it should
   read as a quiet document-edge note field: one line of user
   language and icon-only submit. Type choice, compact source anchor, and assist
   controls stay hidden unless the target is ambiguous, focused, or opened
   through details. Full metadata belongs in evidence or audit, not beside the
   writing row.
16. **The center pane shows the understanding object first.** For learning
   cases, default to the user's current understanding as a readable document:
   title hierarchy, paragraphs, selective evidence quotes, consolidated inline
   terms, and footnote-like anchors. Version counts, capture receipts, and raw
   automation evidence belong behind Capture trail or Details. Internal
   categories can organize the model, but visible labels such as `01 Current
   understanding`, `Understanding objects`, `Meaning`, `Language`, or
   `Principles` cannot become a template column or default section system in the
   reading page.
17. **Learning traces mature into semantic objects.** A PDF learning pass may
   capture `market`, `making`, and `market making` as separate moments because
   the user learned them at different times. That is only one example of the
   rule. A complex problem may start as words, phrases, sentence translations,
   formulas, tables, figures, claims, examples, questions, or corrections. The
   review page must not leave those as independent final notes when the source
   context proves they belong together. Larger objects show the useful review
   fields first, then compact supporting traces; raw events remain available
   only as audit evidence.
18. **Every visible surface has one owner.** If two surfaces own the same job,
   the design is already drifting.
19. **Every accepted choice carries a refusal.** The refusal is part of the
   requirement because it prevents the same mistake from returning.
20. **User wording is evidence, not instruction.** Treat every comparison,
   screenshot, or complaint as a symptom that still needs product judgment.
19. **Do not ship a concept without a path.** A design is not accepted until it
    describes the real user path before, during, and after the Loom action.
20. **Do not ship a path without a review object.** The captured object must be
    reviewable later as an understanding version, not only stored as text.
21. **Do not ship a review object without reuse.** The second pass must be able
    to produce a synthesis, correction, principle, memory candidate, or export.
22. **Do not pollute user folders or macOS Services.** Generated artifacts,
    fixtures, screenshots, helper scripts, and temporary exports must stay
    under the Loom repo `.codex/` area or be deleted. Native GUI tests must
    clean `/private/tmp/loom-*` files, old temporary Loom build bundles, and
    stale LaunchServices registrations so Preview / Word / Excel context menus
    reflect the current app rather than old test builds.
23. **Synthetic evidence cannot upgrade anchors.** Report-only fixtures,
    snapshot-only data, app names, and window titles may preserve context, but
    they cannot promote a trace to `file+page`, `file+cell`, paragraph, or
    region precision. That promotion requires a real native file URL, helper
    result, structured selection, appshot/OCR result with confidence label, or
    explicit user confirmation.
24. **Liquid Glass light is interaction feedback, not background decoration.**
    White light and tiny red / gold / blue refraction may appear on commit
    fields, submit buttons, loading dots, saved receipts, or status transitions.
    Sidebar, center reading surface, right evidence surface, and document
    content cannot become animated color backgrounds. The visible hierarchy
    stays: native file first, Loom understanding record second, optical feedback
    only at the moment of action. The effect must be short-lived, local, and
    ignorable; if it continuously attracts attention, it is visual noise.
    Center and right panes may use frosted material, but they cannot own prism
    light, moving glare, or persistent glow. Those effects belong only to action
    controls.

## Current Hard Requirements From Critique

The current Loom requirements came from repeated objections, not from feature
brainstorming. Keep these as the working product discipline until a newer
canon decision replaces them.

| Pressure / critique | Wrong shortcut | Loom requirement |
| --- | --- | --- |
| Native PDF already has Translate, Look Up, page mode, selection, search, and Services. | Rebuild a PDF reader inside Loom. | Use the native file app as the reading surface; Loom captures anchored understanding beside it. |
| Word and GitHub already have version history for documents and code. | Show a generic timeline, note list, or debug provenance table. | The center shows cognition versions: what the user understood, corrected, synthesized, and reused. |
| Circle / LaTeX / AI chat can already make fast readable packets. | Compete mainly on static formatting. | Clean A4 / Markdown / study packet output is baseline; Loom adds source anchors, learning trail, understanding diff, and reusable principle. |
| The user's FINS3666 Circle packet is already fast, complete, and reviewable. | Treat a polished static PDF as Loom's final value. | Loom must first match that Learning Output Packet floor, then expose which source anchors, passes, corrections, and principles produced it. |
| NotebookLM-style tools already create rich source summaries and study artifacts. | Copy a source hub and call it the product. | Rich source dossier is baseline; Loom becomes different only when generated artifacts expose the user's learning history. |
| The input box has no meaning when it accepts anything. | Keep a generic chat composer because AI products do. | The composer is visible only when it commits or revises a named understanding version. |
| Explanatory text makes the prototype feel like a product memo. | Add more onboarding copy to justify the interface. | The visible object should look like a human learning record; product logic moves into audit trail, docs, or empty-state hints. |
| Capture feedback became too large and explanatory. | Show a modal-style card with preview, selected text, source metadata, trace explanation, or review copy. | Loom Companion is a small transient saved receipt only: Loom, Saved, source title, Back to Source / Open Source, Review in Loom, and close. |
| The user may first learn language, then learn the subject. | Treat every capture as one kind of note. | Capture pass and trace type explicitly: word, pronunciation, phrase, sentence, grammar, idiom, translation, gist, question, concept, correction, or principle. |
| The same source context produces word, phrase, and sentence captures. | Show all captures as independent final notes. | Larger semantic objects absorb smaller traces when they explain the same passage; the review page shows the mature object, while audit keeps the raw sequence. |
| macOS Translate already gives high-quality translation, pronunciation, and Copy Translation. | Rebuild translation, dictionary, or pronunciation UI inside Loom. | Loom captures a native translation receipt only when the user explicitly commits it into an understanding version. |
| Sandbox or source apps may block file/page/cell precision. | Pretend OCR or appshots prove exact source structure. | Visual appshot extraction may add text, table, figure, layout, and emphasis candidates, but every result carries precision and confidence labels. |
| Multiple Preview / Word / Excel windows can confuse automation or Accessibility reads. | Treat the frontmost app name as proof of the target source. | Frontmost app is not source truth; Loom must disambiguate with Service context, file URL, appshot, or user confirmation before promoting the anchor. |
| Loom is meant to become a thinking service / future brain interface. | Store everything as permanent memory. | Memory is only user-confirmed reusable thinking; raw captures remain reviewable traces until promoted. |

These are not UI suggestions. They are product constraints. Any future feature
must either preserve one of these requirements or explicitly replace it with a
better rule and evidence.

## Design Choice Ledger

Every serious design pass should leave a ledger entry. The ledger prevents
Loom from becoming a set of copied product fragments.

| Observed issue | Chosen rule | Refusal | Acceptance signal |
| --- | --- | --- | --- |
| PDF use lost native capability. | Original app owns reading and file-specific tools. | No cloned PDF/Word/Excel editor as the primary path. | User can use native context menu and capture into Loom without losing the file workflow. |
| Middle pane lacked a job. | Center is Understanding Version Flow. | No generic notes feed, mind map, transcript, dashboard, provenance-first table, or split learning/review ledger. | User can answer: first understanding, correction, open issue, synthesis, reusable principle. |
| Right pane looked like a generic project file drawer. | Right pane is Evidence Inspector for the current thinking version; Source Collection is secondary. | No GPT/Claude-style "files beside chat" as the main relationship. | User can answer why the current version is grounded: source, anchor, page or region, pass, focus, trace type. |
| Input box lacked a target. | Composer is a document-edge commit affordance. | No always-visible "ask anything" box, no fixed bottom toolbar, and no default mode toolbar in learning mode. | The target is inferred from the selected understanding object; type and source details appear only on focus, ambiguity, tooltip, or Evidence. |
| Output could be done by AI chat / Circle / LaTeX. | Static output is baseline; cognition trail is the Loom layer. | No claim that clean formatting or source aggregation is the moat. | Export shows source claim plus the user's learning trail and understanding diff. |
| `loom-notes` already makes beautiful fill-in study notes. | Spine plus active recall is output baseline. | No turning the center workspace into a LaTeX worksheet editor. | Fill-in prompts trace back to source anchors, learning pass, correction, or memory candidate. |
| NotebookLM comparison exposed expected richness. | Source dossier is a review / export baseline. | No NotebookLM clone as the center workspace. | Rich artifacts also show which learning versions and anchors shaped them. |
| Too much explanation cluttered the product. | User-facing UI shows compact human records. | No developer-facing metadata as the first visible layer. | Metadata is available under audit; the default reads like editable learning notes. |
| Companion looked like a small app window. | Capture receipt stays tiny, transient, and optional. | No preview table, raw quote, source metadata block, explanatory paragraph, or persistent side window in the receipt. | The user can ignore it and continue using the original file without losing focus. |
| Native testing left old Loom apps and generated files around the user's machine. | Verification artifacts stay inside Loom `.codex/` or are removed, and stale temp app Services are unregistered. | No helper scripts, screenshots, packets, or temp apps in source folders or unmanaged `/private/tmp` leftovers. | `npm run clean:native-temp:dry` reports only Loom temp targets before cleanup, and Preview / Word / Excel Services do not show stale builds. |
| Computer-use can observe a different Preview document than the user's intended learning file. | Use the observed app/window as a precise file/page anchor. | No anchor promotion from app identity alone. | The readback records `app/window/time` or `visual context only` until source identity is confirmed. |
| Report-only learning packets looked more certain than the source evidence. | Synthetic evidence preserves context but does not upgrade anchor precision. | No `file+page` or `file+cell` claims from snapshot-only fixtures, app names, or window titles. | Report-only traces remain `file`, `window+page`, `window+time`, or weaker until a native helper, structured selection, visual extraction, or user confirmation proves stronger precision. |
| macOS 27 Siri / Liquid Glass looks alive through white light and slight color separation. | Turn Loom into a colorful glass theme. | No animated color wash on sidebars, document backgrounds, center records, right evidence panes, or every hover state. | Optical light appears only as a short, local point of emphasis on input, commit, loading, saved, or status feedback; the reading and evidence surfaces stay stable. |
| Center/right material can be frosted but not visually alive. | Use the same moving light treatment everywhere. | No prism light, moving glare, or persistent glow on the workbench or evidence pane. | Middle and right panes read as stable paper/inspector surfaces; only action controls produce short-lived light feedback. |

The ledger is not optional. If a proposal cannot fill these four columns, it is
still a symptom, not a design decision.

## Questioning Loop

Every request must pass this loop before implementation:

`request -> symptom -> objection -> baseline -> Loom-only gap -> owner -> rule -> evidence`

1. **Request.** What did the user ask for or compare against?
2. **Symptom.** What failure does that reveal in the current product?
3. **Objection.** What is wrong with the most literal implementation?
4. **Baseline.** Which existing product, native app, system feature, or AI flow
   already solves part of it?
5. **Loom-only gap.** What remains unsolved because existing tools do not track
   the user's learning, correction, judgment, or repeated passes?
6. **Owner.** Which one Loom surface owns the repair?
7. **Rule.** What durable discipline is added?
8. **Evidence.** What real path or artifact proves the rule held?

The objection step is mandatory. If the team cannot argue against the user's
literal request, it has not earned the right to implement it.

## Decision Gate

No Loom design change ships until this record is written:

| Field | Required answer |
| --- | --- |
| Observed failure | What is actually broken in the user path? |
| User example | What did the user compare against or point to? |
| Bad literal fix | What would we build if we copied the example too directly, and why would it weaken Loom? |
| Existing capability | Which native app, macOS feature, AI product, source-summary tool, or packet builder already solves part of this? |
| Chosen owner | Which one surface owns the repair: native app, Loom Companion, center workspace, Sources, composer, export, or memory? |
| Discipline added | What rule prevents this failure from returning? |
| Acceptance evidence | What human path, screenshot, contract, native-app behavior, or export proves the choice worked? |

If the record cannot name a bad literal fix, the request has not been
questioned enough.

If it cannot name an existing capability, Loom is probably about to clone a
mature tool.

If it cannot name one chosen owner, the UI will split into overlapping
surfaces.

## Implementation Record

Every implementation pass must leave a short product record in the PRD,
contract, or change note. This record is required even for visual polish,
because most Loom failures have come from unclear ownership rather than
missing pixels.

Use this form:

`classification -> preserved capability -> baseline matched -> Loom-only value -> surface owner -> refusal -> acceptance path`

| Field | Required answer |
| --- | --- |
| Classification | Is this invariant, baseline, differentiator, refusal, or open question? |
| Preserved capability | Which native app, macOS function, mature AI flow, or packet-builder function remains in charge? |
| Baseline matched | What expected output or workflow must still be fast, complete, readable, and familiar? |
| Loom-only value | What understanding version, pass history, correction, judgment memory, or reusable thinking is added? |
| Surface owner | Which one surface owns the interaction? |
| Refusal | What tempting clone, extra pane, generic chat, debug view, or visual treatment is rejected? |
| Acceptance path | What real user path, screenshot, contract, native behavior, or export proves this without hand-waving? |

Do not implement from an adjective. "Cleaner", "more native", "more like
Preview", "more like Codex", "more NotebookLM", "more glass", and "more
powerful" are not implementation records. They are symptoms waiting to be
converted into a choice.

Do not count a feature as progress unless the record names both the baseline it
protects and the Loom-only value it advances. A baseline-only feature may still
be necessary, but it must remain small and subordinate. A differentiator that
breaks baseline trust is also rejected.

The implementation record is the product discipline that keeps Loom from
becoming a pile of copied features. If the team cannot write the record in
three minutes, the design is not ready to build.

## Requirement Writing Discipline

Loom requirements are not feature wishes. A requirement is valid only when it
has been converted from a symptom into an enforceable product rule.

Screenshots, analogies, and user wording are evidence, not specs. A screenshot
can reveal broken hierarchy, proportion, material, copy, or ownership, but it
does not decide the implementation. A comparison to Preview, Word, GitHub,
Codex, NotebookLM, LaTeX, Circle, or AI chat is useful only after Loom names
what those tools already do well and what they still do not own.

Every written requirement must include six parts:

`symptom -> critique -> choice -> owner -> refusal -> acceptance`

| Part | Required answer |
| --- | --- |
| Symptom | What concrete user-path failure appeared? |
| Critique | What literal fix would be tempting but wrong? |
| Choice | Which product direction is chosen instead? |
| Owner | Which one surface owns the chosen behavior? |
| Refusal | What related feature, clone, or visual move is now rejected? |
| Acceptance | What real path proves the rule held? |

If a requirement only says "make it cleaner", "make it like Codex", "add
Liquid glass", "support PDF", "make NotebookLM-like output", or "add a chat
box", it is not yet a Loom requirement. It must be rewritten into:

Common invalid requirement phrases: make it cleaner; make it like Codex; add Liquid glass; support PDF; make NotebookLM-like output; add a chat box.

`observed failure -> critique -> chosen owner -> refusal -> measurable path`

Examples:

- "Make the PDF better" becomes: preserve Preview's responder chain and system
  context menu; Loom only records anchored understanding versions from the side.
- "Make the middle useful" becomes: the center owns Understanding Version Flow,
  so its default object is an editable understanding version rather than a note
  feed, debug log, mind map, transcript, or split learning/review ledger.
- "Make the input box useful" becomes: the composer is shown only when it can
  name the commit target and resulting understanding version.
- "Make the output exceed a packet" becomes: Loom must match clean A4 / Markdown
  / study-guide output, then add source anchors, learning trail,
  understanding diff, and reusable principle.

The order of design work is fixed:

`job -> owner -> user path -> proportion -> material -> copy -> evidence`

Do not start with material, color, glass, animation, or layout. Those are
solutions after the product job and surface owner are clear. If this order is
reversed, Loom will keep producing attractive fragments that do not form a
product.

## Material Discipline

Liquid Glass is allowed across Loom only when it clarifies surface ownership.
It is not a theme to pour over every pane.

For Reflection:

- **Left sidebar:** transparent navigation glass. It can reveal the desktop or
  original file context behind the window because its job is navigation, not
  reading.
- **Center workspace:** matte/frosted workbench. It can have glass depth, but it
  must keep the understanding version more legible than the material.
- **Right pane:** quieter frosted inspector glass. It proves evidence for the
  selected version without becoming a second reader or a debug dump.

Refusal: no hand-painted blue slabs, dark gradients, decorative radial glows, or
one-effect-for-everything glass. Use native macOS material (`NSVisualEffectView`,
SwiftUI material, or platform Liquid Glass controls), restrained tints, hairline
seams, and adaptive foregrounds. A subtle one-direction specular highlight is
allowed only when it reads as glass thickness or edge refraction; it must not
become a colored decorative gradient. If the material makes the product feel
like a demo instead of a learning/review surface, the material is wrong.

## Product Discipline Checklist

Before implementation, the designer or agent must answer this checklist in the
work item, PRD, or contract:

1. What native or mature capability are we preserving?
2. What baseline output or workflow must Loom match?
3. What Loom-only thinking-history value are we adding?
4. What surface owns it?
5. What are we refusing to build?
6. What does the user do before, during, and after the Loom action?
7. What object is created or revised?
8. How can the object be reviewed later?
9. How can it become synthesis, memory, or export?
10. What test, screenshot, native path, or artifact proves acceptance?

If any answer is missing, the work is not ready. If the answer to item 3 is
weak, the feature may still be required as baseline, but it must not be treated
as Loom's differentiation.

## Request Triage

Every new request is classified before implementation:

| Class | Meaning | Allowed action |
| --- | --- | --- |
| Invariant | A rule Loom must always preserve | Add canon / PRD / contract coverage before or with implementation |
| Baseline | A mature capability users already expect | Preserve, integrate, or match it; do not call it differentiation |
| Differentiator | A job only Loom should own | Add Loom surface area only if it produces understanding versions |
| Refusal | A tempting direction that weakens Loom | Write it down and do not build it |
| Open question | A real uncertainty | Run a real user-path test or prototype before committing |

## Surface Ownership

| Surface | Owns | Must refuse |
| --- | --- | --- |
| Native file app | Reading, editing, selecting, translating, lookup, search, zoom, page mode, formulas, comments, review, version tools | Becoming subordinate to Loom |
| Loom Companion | Briefly confirming capture, staying near the file, returning to source, opening review | Becoming the main workspace, previewing content, explaining the capture, staying open as a persistent sidecar, or programmatically stealing key-window focus |
| Left sidebar | Current case and local memory selection | Becoming source review or a file browser clone |
| Center workspace | Understanding Spine inside Understanding Version Flow: source contact, first meaning, question, correction, synthesis, principle, judgment change | Agent operation log, notes feed, chat transcript, mind map, debug log, static packet, split learning/review products |
| Right Sources pane | Inspecting attached material when Loom is the active workspace | Replacing the native app during reading |
| Composer | Committing or revising the next understanding version | Generic "ask anything" chat |
| Export | Readable A4 PDF, Markdown, study sheet, packet, briefing, Q&A, glossary, timeline after review | Pretending static output is the product core |
| Memory | User-confirmed reusable thinking | Auto-saving every capture as permanent knowledge |

## Parallel Codex Work

Parallel Codex work is allowed only after ownership is explicit. Split by
stable product contracts first, then by files.

Good split:

- **Shared contract:** types, version model, anchor model, and refusal rules.
- **Frontend shell:** route, layout grid, responsive behavior, and shared
  tokens.
- **Left sidebar:** case list, search, create/delete, local state, and
  collapsed/peek behavior.
- **Center workspace:** Understanding Version Flow only.
- **Right pane:** Evidence Inspector plus secondary Source Collection.
- **Backend / persistence:** APIs, local storage, import records, and generated
  artifacts.
- **Native sidecar:** Preview / Word / Excel capture, companion receipt,
  Accessibility / Services integration, and native verification.

Bad split: three agents all editing the same screen because one "owns UI",
another "owns learning", and another "owns reflection". That recreates the
learning/review split the product is rejecting.

Parallel work rules:

- Do not let two agents edit the same file unless one is explicitly doing a
  mechanical merge.
- Prefer separate git worktrees or named branches for parallel Codex sessions.
- Keep a small handoff note for each task: owner, files touched, shared
  contract assumptions, tests run, and remaining blockers.
- `Private Wiki` is source material, not a scratch workspace. Generated
  screenshots, build artifacts, temp apps, and helper scripts belong inside
  the Loom repo's `.codex/` area or must be deleted.
- Cross-surface work must name the contract it changes before editing
  implementation files. If a left-sidebar task needs to change the
  Understanding Version Flow model, it is no longer a left-sidebar-only task.

## Baseline vs Moat Rules

Loom must be strong at baseline outputs, but baseline outputs are not the moat.

| Existing strength | Loom baseline requirement | Loom moat requirement |
| --- | --- | --- |
| Preview / native PDF apps | preserve reading, selection, context menu, Translate, Look Up, Copy, search, zoom, page modes, annotations, and sharing | remember what the user understood, misunderstood, translated, corrected, and reused from exact pages or selections |
| Word / Excel / PowerPoint | preserve editing, formulas, tables, comments, review, version history, and familiar file workflows | capture why a paragraph, cell, table, sheet, version, or edit changed the user's understanding |
| AI chat | answer, explain, translate, draft, and summarize quickly | tie answers to the user's anchored learning trail and require user confirmation before memory |
| NotebookLM-style tools | produce source summaries, Q&A, timelines, glossaries, briefings, study guides, and cited views | show the user's own learning trail and understanding diff across repeated passes |
| LaTeX / Circle-style packet builders | produce fast, complete, readable PDF or Markdown packets | compile the reviewed path from original material to user understanding to reusable thinking |

If Loom lacks the baseline column, users will reject it as inconvenient. If it
only builds the baseline column, users will replace it with tools that already
exist. Every roadmap item must therefore name both: the baseline it protects and
the moat it advances.

## Rich Dossier Discipline

A rich source dossier is required, but it is not the center workspace and it is
not the product moat by itself.

The dossier is the baseline source-summary layer Loom must be able to produce:

- source collection: files, pages, passages, sheets, paragraphs, links, and
  regions in the current case
- generated artifacts: summary, Q&A, glossary, timeline, briefing, study guide,
  cited review view, and exportable packet
- source claim: which artifact statement came from which original material
- navigation: a fast way to return from an artifact to the original file or
  anchored capture

NotebookLM-style tools already cover much of this. Loom must match that
richness because users now expect it, but Loom must not stop there. A Loom
dossier becomes differentiated only when it is generated from both source
material and the user's cognition trail:

- learning trail: selected words, phrases, sentences, tables, formulas,
  questions, corrections, and synthesis passes
- versioned understanding: first interpretation, misunderstanding, correction,
  second-pass synthesis, and user-confirmed principle
- reuse state: what remains open, what is confirmed, and what can become memory

Design rule: **source collection plus generated artifacts is baseline;
source collection plus generated artifacts plus understanding evolution is
Loom.**

The center workspace still remains Understanding Version Flow. The rich dossier
is a review / export / source-synthesis view that can be opened from the flow,
not a replacement for the flow. If it appears first, Loom risks
becoming a weaker NotebookLM. If it cannot be exported, users lose the baseline
value they already get from AI chat or packet builders.

Acceptance evidence: from the same case, the user can generate a rich summary,
Q&A, glossary, or study guide, then inspect which source anchors and which user
learning versions shaped the result.

## Current Design Choices

### Native File Sidecar

Choice: Loom stays outside Preview, Word, Excel, and browser reading / editing
surfaces.

Refusal: do not rebuild PDF view modes, Translate, Look Up, Copy, Writing
Tools, formulas, comments, review tools, or browser reading functions inside
Loom.

Acceptance evidence: the user can keep using the original app and system
context menus after capturing into Loom.

### Understanding Version Flow

Choice: the center workspace shows the user's evolving interpretation.

Refusal: do not show raw capture metadata as the default reading layer.
Do not split learning and review into separate products; review is the next
state of the same understanding version.

Acceptance evidence: a center entry reads like a human editable learning record:
selected material, meaning / question / correction, review / synthesis /
principle, pass, state, and collapsed source anchor.

### Composer

Choice: the composer appears only when the next commit target is known.

Refusal: do not show a generic bottom chat box in learning cases.

Acceptance evidence: the UI can state whether the next entry is meaning,
question, correction, synthesis, principle, or product-reflection evidence.

### Rich Output

Choice: Loom must eventually match fast, complete static output and rich
source-summary products. "Rich" means structurally strong, readable, and able
to become the right artifact form for the job: static PDF, Word, PPT, Markdown,
dynamic HTML, interactive review surface, audio/video script, or narrated
walkthrough.

Refusal: do not confuse baseline output with the moat.

Acceptance evidence: an export can show both the source-grounded artifact and
the path from source use to user understanding. The artifact is rejected if it
is beautiful but cannot reveal the source anchors, learning versions,
corrections, and reusable principles that shaped it.

## Current Debate Resolutions

These examples are not UI specs. They are precedent for how future choices
should be judged.

### PDF Learning

Symptom: building PDF content inside Loom removed or weakened native PDF
functions.

Bad literal fix: recreate Preview controls, page modes, context menus, and
selection actions inside Loom.

Choice: Preview or the native PDF app owns reading. Loom captures anchored
learning versions from the side.

Rule: Loom may touch PDF content only through native selection, file anchors,
page anchors, screenshots, Services, pasteboard, or explicit imports. A custom
PDF surface is rejected unless it preserves the native responder chain and adds
a Loom-only understanding version.

Native Translation rule: the user should keep using the macOS Translate bubble
for word meaning, pronunciation, and Copy Translation. Loom does not compete with
that surface. If the user commits the event, Loom stores a translation receipt:
original text, translated text when available, language pair when available,
native tool, source app/window/file/page when available, pass, trace type, user
meaning, and review state.

Appshot rule: screenshots are allowed only as capture-triggered visual anchors.
They are useful when App Sandbox or a source app blocks precise Accessibility
metadata, but they must be stored inside Loom, remain collapsed by default, and
carry an explicit precision label such as `visual context only`.

Visual extraction rule: OCR, Vision, and multimodal models can structure an
appshot into candidate text, tables, figures, regions, and emphasis. Those
candidates are evidence for review, not source truth. They can enrich a weak
anchor, but cannot replace selected text, PDFKit/imported file extraction, or a
user-confirmed source location.

Acceptance evidence: the user can still use Translate, Look Up, Copy, Writing
Tools, Summarize, Services, search, zoom, one-page mode, and two-page mode while
Loom records and later reviews the learning pass.

### Center Workspace

Symptom: a center pane that lists captured items feels like notes, metadata, or
a debug log.

Bad literal fix: make it prettier as a card list, timeline, mind map, or chat
transcript.

Choice: the center is Understanding Review backed by Understanding Version
Flow. The user-facing object is a reviewable understanding record; the version
flow is the audit and compounding mechanism underneath it.

Rule: the first visible layer is the user's understanding change. Provenance is
collapsed unless the user is auditing, citing, or debugging.

Interaction rule: the center may borrow Codex's spine grammar, but not its
operation-log job. Codex records what an agent did: read file, searched code,
edited file. Loom records how a user's understanding changed: source contact,
first meaning, language gap, corrected understanding, synthesis, and reusable
thought. The visible structure starts with the **current review focus** and the
continuous stages `Capture -> Meaning -> Review -> Memory`; the version spine
remains underneath for traceability. This keeps learning and review as one
flow, without turning the center into a note list or a debug history.

Acceptance evidence: a user can answer "what did I understand first, what did I
correct, what is still open, and what can be reused?" without reading raw
capture metadata.

### Composer

Symptom: a generic input box has unclear meaning.

Bad literal fix: label it as chat, ask, note, or command and let it accept
anything.

Choice: the composer is a document-edge commit affordance.

Rule: it appears only when the next commit target is known: meaning, question,
correction, synthesis, principle, product Input, Assumption, Decision Trace,
Outcome, Reflection, or Judgment Memory.

Layout rule: the commit target stays attached to the input field as a compact
preface. Do not restore a separate explanatory column or a generic full-width
chat bar; the user should see "what this will become" before typing, without
losing the center review object.

Acceptance evidence: before typing, the user knows what kind of understanding
version the text will become.

### Output

Symptom: users can already produce usable PDFs, summaries, and study packets
with AI chat, LaTeX, Circle, or NotebookLM-style tools.

Bad literal fix: compete mainly on formatting, summary quality, or source
aggregation.

Choice: Loom matches those outputs as baseline and differentiates by preserving
the thinking path behind them. Output quality must be high enough that the user
would actually study from it or share it: clear structure, readable prose,
appropriate visual density, and format fit.

Rule: every export must be able to show source claim, user learning trail,
understanding diff, and reusable principle when those exist. Format is an
output decision, not the product core: PDF, PPT, Word, HTML, video, or another
rich medium is valid only when it carries the cognition trail forward.

Acceptance evidence: the same source collection can produce a clean packet and
a replayable account of how the user's understanding changed.

### Excel / Word / Other Native Files

Symptom: Loom summaries of spreadsheets or documents risk becoming weak clones
of file-specific tools.

Bad literal fix: rebuild formulas, sheet navigation, comments, Track Changes,
or document versions inside Loom.

Choice: native apps own manipulation; Loom owns why a file state mattered.

Rule: Loom captures cells, ranges, paragraphs, comments, versions, or selected
text as anchored understanding versions. It does not become the editor of record.

Acceptance evidence: the user can keep using Excel formulas and Word review /
version tools while Loom records the learning or judgment reason attached to
the file event.

## Acceptance Discipline

A Loom change is not accepted from source code alone.

A visual change is not accepted from a screenshot alone.

A product change is accepted only when the real path proves:

- the native app still owns its native capabilities
- Loom records an anchored understanding version
- the center view makes the change in understanding reviewable
- the composer has a target or stays hidden
- output remains possible without losing the thinking trail
- the refusal is still true after the implementation

Before declaring acceptance, write the final check in this form:

`preserved capability -> baseline met -> Loom-only value -> refusal still true -> evidence path`

Example:

`Preview context menu preserved -> clean study packet remains possible -> selected sentence became a first-pass meaning version -> Loom did not become a PDF reader -> tested in native Preview + Loom companion`

## Rejection Examples

- "Add a PDF reader inside Loom" is rejected unless it preserves native PDF
  functions or adds a new understanding-version capability the native app cannot
  provide.
- "Make it like NotebookLM" is rejected as a differentiator; it is accepted
  only as a baseline output requirement.
- "Make the center more visual" is rejected until the visual form explains a
  change in understanding better than version history.
- "Auto appshot everything" is rejected. Appshots are accepted only when tied to
  an explicit capture, source app/window/time, user meaning, and retention rule.
- "Build Loom Translate" is rejected. Loom keeps macOS Translate primary and
  captures only the translation receipt plus the user's meaning.
- "Use screenshot OCR as the anchor" is rejected. Visual extraction is an
  enrichment layer with confidence labels unless a precise source anchor is also
  available or user-confirmed.
- "Add a chat box" is rejected unless the chat is itself a trace type with an
  anchor, pass, state, and review path.
- "Export a beautiful packet" is accepted as baseline, but rejected as the
  product moat unless it preserves the user's thinking evolution.
- "Make Loom pop forward after capture" is rejected; the companion can become
  visible, but the original file remains the active subject unless the user
  explicitly opens review in Loom.

## Operating Rule

When in doubt, choose the mature existing tool for the original work and make
Loom smaller. Loom becomes larger only where it captures, compares, corrects,
synthesizes, or reuses understanding.
