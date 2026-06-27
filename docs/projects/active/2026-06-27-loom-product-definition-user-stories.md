# Loom Product Definition, Theory References, And User Stories - 2026-06-27

Status: canonical product definition for the next remake slice.
Owner: current Codex thread.
Supersedes: current user-facing `Sources / Draft` framing.
Keeps: `Draft` as a route, storage, test, and compatibility name for the Studio document engine.

## Theory Reference Shelf

Loom's product theory should stay explicit. This is not a decorative book list;
it is the reasoning base for deciding what to show, hide, name, store, and
automate.

The unified research stack is:

`context-driven design + sensemaking workflow + external cognition + attributable generation`

The shortest useful reading path is:

1. Donald Schon, "Designing as Reflective Conversation with the Materials of a Design Situation" - why making is a conversation with material, not plan execution.
2. Pirolli and Card, "The Sensemaking Process and Leverage Points for Analyst Technology" - why the core product is sensemaking, not note-taking.
3. Lewis et al., "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks" plus Rashkin et al., "Measuring Attribution in Natural Language Generation Models" - why Studio/Digital Me generation must stay grounded in Sources and attribution.

### A. Context-Driven Design And Situated Action

| Reference | Product reading | Loom rule |
|---|---|---|
| Christopher Alexander, [Notes on the Synthesis of Form](https://books.google.com/books/about/Notes_on_the_Synthesis_of_Form.html?id=Kh3T3XFUfPQC); Henrik Karlsson, [Everything that turned out well in my life followed the same design process](https://www.henrikkarlsson.xyz/p/unfolding) | Good form is not imposed from a fantasy blueprint. It unfolds when form keeps fitting context through small steps and feedback. | Studio forms should grow from Sources context. Loom should make the next situated step cheap, not ask the user to invent the whole structure upfront. |
| Donald Schon, [Designing as Reflective Conversation with the Materials of a Design Situation](https://link.springer.com/article/10.1007/BF01580516) | Design/writing is a reflective conversation with material: try, see what the material says back, reframe, try again. | Sources and Studio must support iteration, revision, weak claims, and material feedback rather than a one-shot "generate draft" flow. |
| Lucy Suchman, [Plans and Situated Actions](https://books.google.com/books/about/Plans_and_Situated_Actions.html?id=AJ_eBJtHxmsC) | Plans are resources for action, not the action itself. Human action unfolds in concrete situations. | Loom should not force a rigid workflow. It should expose the current source/form state and make one real next action obvious. |

### B. Sensemaking And Data-Frame Loops

| Reference | Product reading | Loom rule |
|---|---|---|
| Russell, Stefik, Pirolli, and Card, [The Cost Structure of Sensemaking](https://dl.acm.org/doi/10.1145/169059.169209) / [PDF](https://www.markstefik.com/wp-content/uploads/2014/04/1993-Cost-Structure-of-Sensemaking1.pdf) | Sensemaking converts information into representations that answer task questions; the cost is not storage, but encoding, restructuring, and using representations. | Sources must reduce the cost from source material to claims, quotes, examples, contradictions, gaps, and questions. Studio must reduce the cost from those pieces to a usable form. |
| Pirolli and Card, [The Sensemaking Process and Leverage Points for Analyst Technology](https://andymatuschak.org/files/papers/Pirolli%2C%20Card%20-%202005%20-%20The%20sensemaking%20process%20and%20leverage%20points%20for%20analyst%20technology%20as.pdf) | Sensemaking moves through information foraging and schema/mental-model construction. | Sources is not a shelf; it is foraging and evidence triage. Studio is schema/output construction. Digital Me is a selected representation, not the whole process. |
| Klein, Moon, and Hoffman, [Making Sense of Sensemaking 2: A Macrocognitive Model](https://www.computer.org/csdl/magazine/ex/2006/05/x5088/13rRUxASurh) and [Data-Frame Theory](https://www.gary-klein.com/data-frame) | Data and frame co-evolve: data changes the frame, and the frame guides what data to seek next. | Loom's feedback loop is source-grounded drafting: forms reveal missing evidence; missing evidence sends the user back to Sources. |

### C. External Cognition And Epistemic Action

| Reference | Product reading | Loom rule |
|---|---|---|
| Clark and Chalmers, [The Extended Mind](https://www.jstor.org/stable/3328150) | Reliable notes, tools, and environments can become part of the cognitive system. | Sources, context pieces, Studio forms, and Digital Me answers are not separate piles. Together they are the user's extended thinking environment. |
| Kirsh and Maglio, [On Distinguishing Epistemic from Pragmatic Action](https://onlinelibrary.wiley.com/doi/10.1207/s15516709cog1804_1) | Some actions are done to make a problem easier to think about, not to directly finish the task. | Marking a passage, splitting a claim, attaching a source, and surfacing a gap are first-class epistemic actions, not clerical metadata chores. |

### D. Source Attribution And Human-AI Co-Writing

| Reference | Product reading | Loom rule |
|---|---|---|
| Lewis et al., [Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks](https://arxiv.org/abs/2005.11401) | Generation should retrieve external knowledge instead of relying only on model memory. | Studio AI must use Sources context and inline references. Digital Me must answer from the archive, not generic model memory. |
| Rashkin et al., [Measuring Attribution in Natural Language Generation Models](https://aclanthology.org/2023.cl-4.2/) | Generated claims should be attributable to identifiable source material. | Every strong Studio/Digital Me claim needs an inspectable source path or an explicit unsupported/gap state. |
| Asai et al., [Self-RAG](https://arxiv.org/abs/2310.11511) | Retrieval and critique should be conditional, reflective, and grounded in evidence quality. | Loom should know when to retrieve, when to mark missing evidence, and when to refuse confident synthesis. |
| Lee, Liang, and Yang, [CoAuthor](https://coauthor.stanford.edu/) / [arXiv](https://arxiv.org/abs/2201.06796) | AI in writing is a collaborator inside a human writing process, not an autonomous author. | AI is summoned inside Studio to continue, revise, or structure with the user; authorship and final judgment stay with the user. |

### Theory Compression

Loom is Alexander/Karlsson's unfolding applied to a personal source archive,
Schon/Suchman situated action applied to writing, Pirolli/Card/Klein
sensemaking applied to Sources and Studio, Clark/Chalmers/Kirsh/Maglio external
cognition applied to everyday operations, and RAG/AIS/co-writing research
applied to AI that is useful because it stays attributable.

The practical rule is simple: do not begin from a profile, a note, or an AI
answer. Begin from the real context the user has, resolve what it can support,
shape the strongest parts into forms, and let only those forms represent the
user.

## Product Definition

Loom is a local context-to-form workspace.

It helps a person bring real source material into one owned archive, resolve
that material into usable context, shape the context into source-backed forms,
and let the strongest forms represent them.

The core object is not a note, a chat, a shelf, or a profile. The core object is
the transformation:

`source material -> resolved context -> source-backed form -> represented self/work -> feedback`

The product is not an AI note app. A note is useful only when it participates in
a loop that changes what the user sees, writes, decides, and can later stand
behind.

The product is not primarily a profile generator. Digital Me is valuable only
after the user has source-backed forms worth representing.

The product is not a generic writing app. Studio matters because it keeps the
source trail attached while the user makes a form.

### Product Objects

| Object | Definition | Must preserve |
|---|---|---|
| Source | The original material the user encountered: local file, web capture, note, AI conversation, certificate, project record, screenshot, or process artifact. | origin, timestamp, content or original path, capture/extraction metadata |
| Context piece | A resolved unit extracted from source material: claim, quote, example, contradiction, gap, question, artifact state, or decision. | source pointer, confidence, relation to nearby pieces |
| Form | A user-facing composition made in Studio: block document, cited answer, proof artifact, process page, project explanation, essay, or public writeup. | references, revision path, visible argument |
| Representation | A selected, evidence-backed way the user or the user's work can be presented in Digital Me. | supporting forms, source citations, honest gaps |
| Feedback | A signal that changes the next version: question asked, weak answer, missing evidence, review comment, real-world outcome, or newly added source. | what failed or improved, where it should feed back |

If a proposed feature does not strengthen one of these objects or a transition
between them, it is probably product noise.

## Product Philosophy

1. Forms unfold from context.
   Loom should not ask the user to declare the perfect structure upfront. It
   should expose enough source truth that the next form can emerge from what is
   actually present.

2. Source comes before synthesis.
   A confident answer without a traceable source path is not a Loom answer. It
   is an unsupported statement.

3. Representation is earned.
   Digital Me should become richer only when Studio forms and source-backed
   claims exist. Thin evidence should produce a quiet surface, not fake depth.

4. AI is summoned, not resident.
   AI may help resolve context, continue writing, restructure a form, or answer
   from evidence when the user asks. It should not become permanent chrome or
   the protagonist of the product.

5. Provenance is part of the form.
   A Studio document is not done if its source trail has been detached. The
   reference path is part of the argument.

6. Absence is a product state.
   Empty panels, speculative proof, and placeholder identity surfaces should
   stay hidden until source/form state can support them.

7. One foreground object beats a control room.
   Sources foregrounds the source or resolved context piece. Studio foregrounds
   the block document. Digital Me foregrounds the represented claim, answer, or
   artifact. Secondary controls recede.

8. Feedback is the engine.
   Questions, uncertainty, weak claims, and missing evidence are not failure
   states. They are how the next cycle knows what to collect and resolve.

9. Literal language lowers the tax.
   User-facing copy uses `Sources`, `Studio`, `Digital Me`, and concrete verbs.
   Metaphor can explain history internally; it must not block first use.

## Product Loop

1. `Sources`
   - Bring in local files, rich web captures, notes, AI conversations, project evidence, coursework, certificates, and process records.
   - Resolve material into claims, quotes, examples, contradictions, gaps, questions, and artifact states.
   - Preserve provenance and exact references.

2. `Studio`
   - Shape resolved source pieces into block documents.
   - Produce cited answers, process pages, proof artifacts, portfolio explanations, and public writeups.
   - Keep references attached to the form instead of turning sources into detached summaries.

3. `Digital Me`
   - Represent selected Studio forms and source-backed claims as a living identity surface.
   - Answer from the user’s actual sources and forms, with citations.
   - Stay quiet when the profile is thin instead of pretending to know more than the archive supports.

4. `Feedback`
   - Questions, missing evidence, weak claims, and real-world review feed back into Sources.
   - The next version unfolds from the context already present, not from an imagined blueprint.

## Surface Contract

### Sources

User-facing promise:

> Bring the real context in. Resolve what it says.

Primary jobs:

- import local files
- capture rich web pages
- preserve originals
- find and inspect source material
- mark claims, quotes, examples, contradictions, gaps, questions, and artifact states
- send resolved pieces into Studio
- show what changed since the last useful form

Not its job:

- become a dashboard of shelves
- summarize everything by default
- show empty panels just because the system has a possible feature
- ask the user to organize before there is a reason

### Studio

User-facing promise:

> Shape source context into a form you can stand behind.

Primary jobs:

- write and revise block documents
- keep source references attached
- help the user continue, rewrite, or structure with AI when asked
- expose provenance without making the default surface a control panel
- publish selected forms into Digital Me
- keep weak or unsupported claims visibly unresolved

Not its job:

- be a generic note editor
- show every power tool by default
- make the user manage source plumbing before writing
- turn all source material into a summary

### Digital Me

User-facing promise:

> Let selected evidence-backed forms represent you.

Primary jobs:

- show source-backed claims
- expose cited answers
- surface artifacts and proof paths
- make gaps honest
- represent the user only where there is enough support
- make the route from claim to source inspectable

Not its job:

- be the first place the user does all work
- fabricate a confident profile from thin evidence
- hide the Studio process that created the representation

## User Stories

### P0. Learner Turns Course Material Into Understanding

As a learner, I import lecture slides, PDFs, notes, and screenshots into Sources
so I can see the actual context of a topic instead of relying on memory or a
generic answer.

I mark definitions, worked examples, unclear steps, contradictions, and open
questions. When enough context is resolved, I send the pieces into Studio and
write a sourced explanation.

When the explanation is strong, I include it in Digital Me so future questions
about that topic can be answered with citations to my own work.

Acceptance:

- imported files keep origin metadata
- marked passages remain traceable
- Studio form links back to exact source references
- Digital Me only uses the explanation if it is explicitly included or supported
- weak areas remain visible as questions or gaps

Non-acceptance:

- a generated study note with no source trail
- a course shelf that never becomes a sourced explanation

### P0. Builder Turns Project Work Into Proof

As a builder, I bring project notes, code explanations, screenshots, design
decisions, terminal logs, and demo artifacts into Sources so I can reconstruct
why the project works.

I resolve the evidence into claims such as "I built a market-making simulator",
examples such as screenshots or logs, and gaps such as missing evaluation.

In Studio, I shape those pieces into a process page or proof artifact. Digital
Me can then answer questions about the project by citing the source files and
Studio form instead of repeating portfolio copy.

Acceptance:

- project claims require source-backed evidence
- artifact links open the real proof path
- Digital Me distinguishes proven claims from gaps
- process pages can explain decisions, tradeoffs, and failures, not only outcomes

Non-acceptance:

- a portfolio claim that is stronger than the evidence
- a proof shelf that cannot explain why the work matters

### P0. Candidate Builds A Cited Identity

As a candidate, I want Digital Me to answer questions about my skills without
sounding like a resume generator.

I use Sources to collect certificates, transcripts, project records, coursework,
and work examples. I use Studio to create concise explanations of what each
evidence group proves.

Digital Me answers only from those sources and forms, citing real evidence and
exposing weak areas honestly.

Acceptance:

- thin profiles do not show fake depth
- every strong claim has a source or Studio form
- answer citations open inspectable evidence
- Studio is visible as the workbench that created the representation

Non-acceptance:

- an impressive profile assembled from unsupported claims
- an answer that hides the evidence path

### P1. Writer Turns Research Into A Form

As a writer, I collect essays, papers, quotes, prior notes, and AI conversations
into Sources.

I mark tensions, supporting examples, counterexamples, and unresolved questions.
Studio helps me arrange them into a structure, write from references, and revise
a section without losing provenance.

Digital Me is optional; the valuable object may be the essay itself.

Acceptance:

- sources can be referenced from the writing surface
- AI assistance is summoned by the user, not always-on
- edits preserve attached references or make missing provenance visible
- the final form can exist without being published to Digital Me

Non-acceptance:

- a generic AI draft that merely sounds plausible
- a saved chat log treated as finished thinking

### P1. User Turns An AI Conversation Into Durable Context

As a user, I import a useful AI conversation into Sources so the insight does
not remain trapped in a chat product.

I resolve the conversation into claims, questions, examples, and decisions, then
attach each important point to source material or mark it as unsupported.

Studio can turn the supported pieces into a form; unsupported pieces become
questions for the next source pass.

Acceptance:

- imported chat keeps origin metadata and timestamp
- unsupported AI claims are visibly different from sourced claims
- Studio output cites real sources when available and marks gaps when not
- Digital Me does not answer from unsupported AI conversation residue

Non-acceptance:

- treating AI output as a source of truth by default
- hiding that a claim came from a model response rather than evidence

### P1. Returning User Continues From Reality

As a returning user, I want Loom to show me what changed in my context since last time.

Sources shows new material, unresolved questions, and weak claims. Studio shows forms that need revision. Digital Me shows where answers are strong, weak, or missing.

I can take one small next step without rebuilding the whole plan in my head.

Acceptance:

- the default surface has one foreground object
- empty panels stay hidden
- the next action is based on real source/form state
- feedback routes back to the exact source, context piece, or Studio form it affects

Non-acceptance:

- a dashboard of abstract metrics
- a startup screen that asks the user to plan from scratch every time

## Product Copy Rules

- Say `Sources`, `Studio`, and `Digital Me` for the user-facing loop.
- Say `Draft` only when referring to compatibility routes, storage objects, or older tests/docs.
- Do not use `Collect`, `Organize`, `Pursuit`, `Panel`, `Weave`, `Sōan`, `Rehearsal`, or `Examiner` in default-visible product copy.
- Prefer concrete actions: `Add files`, `Mark passage`, `Help me write`, `Include in Digital Me`, `Open source`.
- Do not describe Loom as "AI notes"; the note is not the product.

## Implementation Implications

- `lib/new-loom/product-shell.ts` should expose `Sources`, `Studio`, and `Digital Me`.
- `/draft` should remain a compatibility route into the Studio editor.
- `/digital-me?edit=...` can continue to host the editor, but user-facing IA must still make Studio legible as the workbench.
- Sources needs context-resolution affordances, not only shelf management.
- Studio default state should remain calm: title, block document, quiet grounding line, one AI assist, Details closed.
- Digital Me should appear rich only when there is enough source-backed substance.
- Context pieces need a durable schema before Sources can become more than a library.
- AI conversation import must distinguish model output from source-backed evidence.
- Tests should assert the loop and provenance behavior, not only route labels.
