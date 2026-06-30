# Docs

This directory is organized into clear areas. Each subdirectory holds one kind of document.

Start with [Repo Structure](REPO_STRUCTURE.md) when deciding where a file,
spec, screenshot, or generated artifact belongs.

| Area | Path | What lives here |
| --- | --- | --- |
| **Canon** | [`canon/`](canon/) | The product constitution — what Loom is, the rules it must obey, who it is for, and the canonical design system. Source of truth; everything else defers to these. |
| **Design** | [`design/`](design/) | Working design specs, visual/epistemic grammar, panel system, capture/canvas specs, and the design-memory operating model. |
| **Process** | [`process/`](process/) | Engineering process — commit plans, stage reviews, ship audits, drift-audit templates and runs. |
| **Projects** | [`projects/`](projects/) | Active project plans, area ownership maps, backlog, and the project archive. |
| **History** | [`history/`](history/) | The product story and superseded roadmaps/phase plans kept for narrative continuity. |
| **Archive** | [`archive/`](archive/) | Frozen records. `archive/ai-build-log/` holds the dated specs + plans produced during AI-assisted build sessions. |

The lowercase [`loom.md`](loom.md) at the top of `docs/` is a separate running build/decision log (distinct from `canon/LOOM.md`).
Ignored private root-doc copies live in `local-private/`; tracked product truth
lives in `canon/` and `projects/active/`.

## Canon

- [Loom — Product Definition](canon/LOOM.md) — what Loom is (vision, framing, architecture, moat).
- [Loom Rules](canon/LOOM_RULES.md) — invariants, vetoes, North Star principles, decision log.
- [Loom Design Discipline](canon/LOOM_DESIGN_DISCIPLINE.md) — critique, choice, refusal, surface ownership, and acceptance gates for Reflection / sidecar design.
- [Loom User Profile](canon/LOOM_USER_PROFILE.md) — who Loom is for (audience, habits, working patterns).
- [Project Map](canon/PROJECT_MAP.md) — top-level map of the repo's projects.
- [Design System](canon/design-system.md) — canonical token/design-system reference.
- [Current Design Canon](canon/CURRENT_DESIGN_CANON.md) — the current authoritative design canon (wins on conflict).

## Design

- [Design Onboarding](design/DESIGN_ONBOARDING.md)
- [Design Memory](design/DESIGN_MEMORY.md)
- [Design Memory Operating Model](design/DESIGN_MEMORY_OPERATING_MODEL.md)
- [Design Memory Index](design/DESIGN_MEMORY_INDEX.md)
- [Design Review Checklist](design/DESIGN_REVIEW_CHECKLIST.md)
- [Loom Visual Grammar](design/LOOM_VISUAL_GRAMMAR.md)
- [Loom Epistemic Grammar](design/LOOM_EPISTEMIC_GRAMMAR.md)
- [Loom Panel System Plan](design/LOOM_PANEL_SYSTEM_PLAN.md)
- [Material Archive Direction](design/MATERIAL_ARCHIVE_DIRECTION.md)
- [Capture Spec](design/CAPTURE_SPEC.md)
- [Canvas Spec (Historical)](design/CANVAS_SPEC.md)
- [Logo Brief](design/LOGO_BRIEF.md)

## Process

- [Commit Plan](process/COMMIT_PLAN.md)
- [Commit Messages](process/COMMIT_MESSAGES.md)
- [Loom Stage Review · 2026-04-15](process/LOOM_STAGE_REVIEW_2026-04-15.md)
- [Design Memory Drift Audit Template](process/DESIGN_MEMORY_DRIFT_AUDIT_TEMPLATE.md)
- [Design Memory Drift Audit · 2026-04-13](process/DESIGN_MEMORY_DRIFT_AUDIT_2026-04-13.md)
- [Design Memory Drift Audit Follow-up · 2026-04-13](process/DESIGN_MEMORY_DRIFT_AUDIT_2026-04-13_FOLLOWUP.md)
- [GitHub Pull Request Template](../.github/pull_request_template.md)

## Projects

- [Projects Index](projects/README.md)
- [Active](projects/active/) · [Areas](projects/areas/) · [Backlog](projects/backlog/) · [Archive](projects/archive/)

## History

- [Product History](history/product-history.md)
- [Loom v5 Roadmap](history/loom-v5-roadmap.md)
- [Loom v5 Phase 3 Plan](history/loom-v5-phase3-plan.md)

## Archive

- [AI Build Log — Specs](archive/ai-build-log/specs/)
- [AI Build Log — Plans](archive/ai-build-log/plans/)
