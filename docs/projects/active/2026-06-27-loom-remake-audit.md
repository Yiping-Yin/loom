# Loom Remake Audit - 2026-06-27

Status: product/architecture audit, not a completion claim.
Checkout: `/Users/yinyiping/dev/LOOM`
Branch: `loom-usability-and-craft`

Follow-up contract: `2026-06-27-loom-product-definition-user-stories.md`

## Why this audit exists

The current Loom repo contains at least three overlapping product stories:

1. The May "new Loom" story: a local `Sources / Draft` product with legacy surfaces isolated.
2. The June "Digital Me" story: a verified identity/dossier product, with Studio merged into `/digital-me`.
3. The native app story: a macOS shell that now appears to mount the web dossier while retaining older native Sources/Draft workbench code.

These stories are not inherently incompatible, but they are currently treated as if they are all canonical at once. That makes product judgment, UI craft, tests, and native packaging drift in different directions.

The remake should choose one product loop and make every surface serve it.

## Theory anchor

The Henrik Karlsson / Christopher Alexander "unfolding" frame is the best product anchor for Loom:

- Good form is discovered from context, not imposed from an imagined blueprint.
- The context contains more information than the user can hold in working memory.
- The product should increase the rate and resolution of feedback from context.
- The product should make the next small action cheap enough that thinking can keep moving.
- The final form should remember the experiments, sources, and fit decisions that produced it.

Product implication: Loom should not be "AI notes" and should not be a static profile generator. Loom should be a context-to-form workbench.

Working product equation:

`sources -> context resolution -> studio form -> represented self/work -> feedback -> sources`

## Current verified state

Commands run:

- `npm run status:buckets`: passed.
- `npm run typecheck`: passed. It triggered a Next build because artifacts were missing, and the build passed.
- `npm run test:contracts`: failed.
- `git diff --check`: passed.

Dirty files observed after the final status check:

- `app/onboarding/profile/ProfileWizardClient.tsx`
- `macos-app/Loom/Sources/ContentView.swift`
- `macos-app/Loom/Sources/LoomApp.swift`
- `macos-app/Loom/Sources/ShuttleView.swift`
- `next-env.d.ts`
- `scripts/loom-screenshots.mjs`
- `tsconfig.json`
- `docs/projects/active/2026-06-27-loom-remake-audit.md` (this audit)

Notes:

- This audit added only the markdown file above.
- `app/onboarding/profile/ProfileWizardClient.tsx` appeared in the final status snapshot as a small Digital Me onboarding change that clears stale capabilities before saving a beginner profile. It should be reviewed with the Digital Me work, but it is not part of this audit edit.

Known verification blocker:

- `tests/new-loom-skeleton-contract.test.ts:2201` still expects `Button("Connect Reader Notes...")` in `macos-app/Loom/Sources/LoomApp.swift`.
- The current dirty diff removed the `WeavePanelsMenuItem` / reader-notes menu path from `LoomApp.swift`.
- This should not be fixed mechanically until the product contract is chosen:
  - If native Reader Notes commands are retired, update the contract tests.
  - If native Reader Notes commands are still part of Loom, restore the menu item.

Build warnings worth tracking:

- Next file tracing warns that dynamic server paths are matching thousands of files, especially around reference artifacts and server config. This is not the current blocker, but it is a packaging and build-time smell.

Not run:

- `npm run smoke`
- `npm run app:check-project -- --require-tracked`
- installed-app acceptance checks

Reason: the contract test already isolates a product-contract mismatch.

## Product truth in the codebase

### Web product

Current web truth is closer to `Digital Me + embedded Studio` than to pure `Sources / Draft`.

Evidence:

- `app/draft/page.tsx` is now a redirect stub, not the active Draft surface.
- `lib/new-loom/draft-routing.ts` maps `/draft` links to `/digital-me?edit=...`.
- `app/digital-me/DigitalMeGate.tsx` renders `DraftClient` when `edit` is present.
- `components/verified-dossier/LoomGlobalNav.tsx` removes Draft from the main workspace nav and treats Draft as part of Digital Me.

But there is stale counter-evidence:

- `lib/new-loom/product-shell.ts` still defines primary routes as `/`, `/sources`, `/draft`.
- Older active docs still frame the product as canonical `Sources / Draft`.
- Some tests still assert `/draft` behavior.

### Studio product

The Studio direction is the strongest current product component.

Good:

- `DraftClient` has shifted toward a centered writing surface.
- `StudioStarters` implements the approved "Add to your Digital Me" entry.
- `DraftBlockEditor` gives the product an actual form-making substrate, not just a note textarea.
- Source grounding is still present.

Still too complex:

- The default writing toolbar still exposes too many controls: `Include in Digital Me`, `@ Reference`, `Import`, `Save draft`.
- The Details drawer still reads like an internal inspector: `Sources, Edit, Board`.
- The raw markdown bridge is still visible behind Details.

Diagnosis: the engine is useful, but the product surface has not fully absorbed the June simplification decision.

### Sources product

`/sources` currently reads as a proof library and shelf system. That can support Digital Me, but it is not yet a strong "unfolding" cockpit.

The remake should make Sources answer:

- What context do I have?
- What does it say?
- What claims, tensions, examples, gaps, and quotes matter?
- What is ready to become a Studio block?
- What did reality teach me since the last version?

If Sources is only a library, Loom becomes a better storage system. If Sources resolves context into usable pieces, Loom becomes a thought tool.

### Native product

The native app has an unresolved split:

- `LoomApp.swift` now mounts `LoomDossierRootView`, suggesting the macOS app is a full-window web identity product.
- `LoomMinimalRootView.swift`, `LoomLibraryView.swift`, and `LoomDraftView.swift` still preserve an older native Sources/Draft shell.
- Contract tests still assert parts of the older native command model.

This is a strategic fork:

1. Web-first native app: native app is a wrapper around the current web product, with native import/open/shortcut affordances only.
2. Native-first workbench: native app owns Sources and Studio directly, and web identity is secondary.

Keeping both as "current" will keep producing drift.

## Main product diagnosis

Loom is closest to a real product when it helps the user transform evidence into a durable form.

It is weakest when it presents the result first:

- a profile,
- a dossier,
- a proof shelf,
- an AI note,
- or a generic knowledge dashboard.

The profile is valuable only after the user has built grounded forms. The note is valuable only if it is part of a loop that changes what the user sees, writes, and represents.

Therefore the remake should not start from "build Digital Me". It should start from "make thought unfold from sources into forms". Digital Me should be one output of that loop.

## Recommended remake contract

North star:

> Loom helps your work and identity unfold from the sources you actually have.

Primary loop:

1. `Sources`: collect and inspect context.
2. `Resolve`: extract claims, quotes, examples, contradictions, and open questions.
3. `Studio`: shape those pieces into blocks, drafts, explanations, proofs, and artifacts.
4. `Digital Me`: publish or present selected forms as a living representation.
5. `Feedback`: ask, test, revise, and feed new context back into Sources.

Recommended top-level IA:

- `Sources`
- `Studio`
- `Digital Me`

Optional later:

- `Today` can remain if it is a work queue, not another product center.

Route policy:

- Keep `/draft` as compatibility redirect only.
- Pick a canonical user-facing name: `Studio`, not `Draft`, if the product is now block-based and representation-oriented.
- Internally `/digital-me?edit=...` can survive, but the user should not feel that the workbench is hidden inside a profile.

Native policy:

- Decide whether the active native app is web-first or native-first.
- If web-first, stop contract tests from asserting retired native workbench commands.
- If native-first, restore native Sources/Studio as active and make the web app secondary.

## What to build next

### Phase 0 - lock the contract

Goal: make docs, routes, tests, and nav say the same thing.

Files to reconcile:

- `docs/projects/active/README.md`
- `docs/projects/active/2026-05-15-new-loom-acceptance-status.md`
- `lib/new-loom/product-shell.ts`
- `components/verified-dossier/LoomGlobalNav.tsx`
- `tests/new-loom-skeleton-contract.test.ts`
- `macos-app/Loom/Sources/LoomApp.swift`

Decision to make:

- Is the current canonical product `Sources / Studio / Digital Me`, or is it still `Sources / Draft`?

Recommendation:

- Move to `Sources / Studio / Digital Me`.
- Treat `Draft` as a compatibility name and route, not the primary product noun.

### Phase 1 - simplify Studio for real

Goal: make Studio feel like a calm workbench, not a control panel.

Default surface:

- title
- block document
- quiet grounding line
- one primary AI assist control
- Details closed by default

Move behind Details or menus:

- import
- reference picker
- include in Digital Me
- board
- raw markdown body
- provenance editor
- advanced source selection

Files:

- `app/draft/DraftClient.tsx`
- `app/draft/DraftBlockEditor.tsx`
- `app/draft/StudioStarters.tsx`
- `app/draft/draft-editor.css`

### Phase 2 - rebuild Sources as context resolution

Goal: make Sources generate usable building blocks for Studio.

Add or emphasize:

- claims
- quotes
- examples
- contradictions
- gaps
- open questions
- "send to Studio" actions

De-emphasize:

- shelf dashboards as the first read
- generic metrics unless they drive action
- proof-only framing before the user has a form to prove

Files:

- `app/knowledge/KnowledgeHomeStatic.tsx`
- `app/knowledge/KnowledgeHomeClient.tsx`
- `lib/new-loom/source-to-draft.ts`
- source artifact and reference binding code

### Phase 3 - make Digital Me an output, not the center

Goal: Digital Me should be generated from selected Studio forms and source-backed claims.

Rules:

- Empty profiles should stay quiet.
- Thin profiles should not show fake capability.
- Every strong claim should trace back to a source, block, or artifact.
- The Ask surface should appear only when enough substance exists.

Files:

- `app/digital-me/*`
- `components/verified-dossier/*`
- profile/proof tests under `tests/`

### Phase 4 - choose the native shell

Goal: eliminate the current native/web split.

If web-first:

- Keep `LoomDossierRootView` active.
- Retire or quarantine `LoomMinimalRootView`, `LoomLibraryView`, and `LoomDraftView` tests that assert inactive behavior.
- Keep native-only value in import, file open, app menu, shortcuts, and OS integration.

If native-first:

- Restore native Sources/Studio as active.
- Make `/digital-me` a web-rendered representation surface.
- Align Shuttle, menus, and tests with native route truth.

Files:

- `macos-app/Loom/Sources/LoomApp.swift`
- `macos-app/Loom/Sources/ShuttleView.swift`
- `macos-app/Loom/Sources/LoomMinimalRootView.swift`
- `macos-app/Loom/Sources/LoomLibraryView.swift`
- `macos-app/Loom/Sources/LoomDraftView.swift`
- native contract tests

### Phase 5 - repair verification gates

After the contract is chosen:

1. Fix stale tests or restore intentionally retained native menu items.
2. Run `npm run status:buckets`.
3. Run `npm run typecheck`.
4. Run `npm run test:contracts`.
5. Run `npm run smoke`.
6. Run `npm run app:check-project -- --require-tracked` if the native shell is in scope.
7. Only then attempt installed-app real-file importer and live provider-output acceptance.

## What not to build

- Do not build a generic AI note app.
- Do not build a static personal website generator as the core.
- Do not build more dashboards before the source-to-form loop is clear.
- Do not let `Digital Me` hide the workbench that creates it.
- Do not keep two separate canonical products in native and web.

## Immediate next action

Make a product-contract edit before touching more UI:

1. Rename the canonical model to `Sources / Studio / Digital Me`.
2. Update `lib/new-loom/product-shell.ts` and active docs to match.
3. Update contract tests for `/draft` as a redirect stub and Studio as the real workbench.
4. Decide the native shell strategy and fix the `Connect Reader Notes...` assertion accordingly.

Until this is done, further polishing will keep improving individual screens while the product remains split.
