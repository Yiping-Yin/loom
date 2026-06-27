# Active Workstreams

Use this folder for current work that is being implemented, reviewed, or validated.

## Current new Loom continuation reading order

Start new Loom continuation work from the current product definition and remake
audit, then use the older acceptance/migration notes only as historical gate and
compatibility evidence:

1. `2026-06-27-loom-product-definition-user-stories.md`
2. `2026-06-27-loom-remake-audit.md`
3. `2026-05-15-new-loom-acceptance-status.md`
4. `2026-05-09-new-loom-completion-audit.md`
5. `2026-05-09-legacy-surface-migration-plan.md`

Treat older 2026-05-08 skeleton notes as historical reference only. Any old
Phase 1 or `Collect / Organize` snippet must be translated into the current
`Sources / Studio / Digital Me` product model before acting. `Draft` remains a
compatibility/storage word for the Studio document engine, not the primary
user-facing product noun.

`npm run verify:product` is the safe non-approval product gate. It must not be
used as proof that either approval-bound gate is closed.

Open approval-bound gates:

- Real user-file installed-app importer acceptance.
- Live provider-output Compile/Draft acceptance, now interpreted as the
  Studio/Draft compatibility engine accepting a real provider result.

Do not mark new Loom complete until those two gates have current evidence, or
the user explicitly removes them from the objective.

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
