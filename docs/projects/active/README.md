# Active Workstreams

Use this folder for current work that is being implemented, reviewed, or validated.

## Current Reading Order / Current new Loom continuation reading order

Start current Loom continuation work from the sidecar/reflection standard. Use
older acceptance and migration notes only as compatibility evidence:

1. `2026-06-28-loom-reflection-workspace-prd.md`
2. `2026-06-27-loom-reflection-workspace-layout-contract.md`
3. `2026-06-27-loom-product-definition-user-stories.md`
4. `2026-06-27-loom-remake-audit.md`
5. `2026-05-15-new-loom-acceptance-status.md`
6. `2026-05-09-new-loom-completion-audit.md`
7. `2026-05-09-legacy-surface-migration-plan.md`

The current product direction is:

```text
original file activity -> anchored learning trace -> second-pass synthesis -> reusable memory
```

Loom should behave as an external learning and thinking layer around original
files. Reflection is one second-pass workspace, not the whole product and not a
replacement PDF, Excel, or Word editor.

## Compatibility And History Boundary

Treat older 2026-05-08 skeleton notes as historical reference only. Any old
Phase 1, `Collect / Organize`, `Sources / Studio / Digital Me`, or `Draft`
snippet must be translated into the current sidecar-first model before acting.
Keep old names only when the code path is explicitly a compatibility layer,
storage engine, or migration record.

`npm run verify:product` is the safe non-approval product gate. It must not be
used as proof that either approval-bound gate is closed.

Open approval-bound gates:

- Real user-file installed-app importer acceptance.
- Live provider-output Compile/Draft acceptance, now interpreted as the
  Studio/Draft compatibility engine accepting a real provider result.

Do not mark new Loom complete until those two gates have current evidence, or
the user explicitly removes them from the objective.

## Filing Rule

Add a new active note only when it changes the current implementation standard
or acceptance criteria. Short observations, screenshots, and temporary QA
evidence belong in `captures/` or `archive/`, not in this folder.

Suggested filename format:

```text
YYYY-MM-DD-short-workstream-name.md
```

Each active note should include:

- owner or current thread
- target surface
- source folders touched
- acceptance checks
- current status
- links to specs, audits, or reference material
