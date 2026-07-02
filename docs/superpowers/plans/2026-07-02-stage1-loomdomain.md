# Stage 1 — LoomDomain Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax. Spec = framework doc §3 + §Stage 1 (`docs/projects/active/2026-07-02-loom-workbench-upgrade-framework.md`). Owner directive: all stages autonomous, no approval gates.

**Goal:** Typed, versioned trace records + hardened persistence + lossless migration of real data — UI pixel-identical (that IS the acceptance).

**Architecture:** Behavior-preserving extraction of model/store/parser out of the 4,288-line root view, then an additive snapshot v2 (`traceRecords` per case) derived by a one-time migration that reuses the existing parsers, with dual-write at the two ingest sites. Store gains savedAt/newer-wins/logging/backup. English strings remain rendered-and-stored for UI compatibility until Stage 2's BOOK renders records directly (records become authoritative then).

**Tech Stack:** Swift 5.9 (xcodegen project — regenerate after adding files), LoomTests (XCTest), web contract suite as the doc-code gate.

## Global Constraints

- UI pixel/behavior-identical; contracts (1,027) + LoomTests (351) green after every task; commit per task on `loom-usability-and-craft`.
- Frozen boundary untouched (capture chain, XPC helper, relays).
- Real user data: migration is additive; pre-migration backup written once (defaults key `loom.reflectionWorkspaceSnapshot.backup-v1` + mirror `.backup-v1.json`); never delete/rewrite the legacy blob in place.
- Two web contract tests slice `LoomReflectionRootView.swift` by VIEW-struct markers (ReflectionTopBar/Sidebar/Composer/SourceInspector) — views stay put; only model/store/parser move. If an assertion pins a moved string, update the test's read target (lockstep maintenance).

---

### Task 1: Behavior-preserving extraction (pure move)

**Files:** Create `Sources/ReflectionModel.swift`, `Sources/ReflectionLearningTrace.swift`, `Sources/ReflectionWorkspaceStore.swift`; shrink `Sources/LoomReflectionRootView.swift`.

Move table (line ranges in the pre-move file; strip `private ` from moved top-level decls — module-internal visibility keeps root references compiling):

| Segment | Lines | → File |
| --- | --- | --- |
| `reflectionLearningEvidenceMarker` | 26 | ReflectionModel.swift |
| `reflectionLearningInputFingerprint` | 28-40 | ReflectionModel.swift |
| `ReflectionLearningEvidence` | 2700-2707 | ReflectionModel.swift |
| `ReflectionLearningTrace` | 2735-3029 | ReflectionLearningTrace.swift (imports SwiftUI for Color/LoomTokens) |
| `ReflectionWorkspaceSnapshot` | 3864-3868 | ReflectionModel.swift |
| `ReflectionWorkspaceStore` | 3870-4060 | ReflectionWorkspaceStore.swift |
| `ReflectionCase/Step/Source/SourceAnchor/Message` | 4062-4288 | ReflectionModel.swift (SourceAnchor de-privatized; needs SwiftUI for Color in ReflectionSource.iconColor) |

- [ ] Extract, `xcodegen generate` in macos-app/Loom, build, LoomTests green, contracts green, commit.

### Task 2: `ReflectionTraceRecord` + round-trip (TDD)

**File:** Create `Sources/ReflectionTraceRecord.swift`; Test `Tests/ReflectionTraceRecordTests.swift`.

```swift
struct ReflectionTraceRecord: Identifiable, Codable, Equatable {
    var schemaVersion: Int = 1
    let id: String                 // UUID
    var kind: String               // captured | manual
    var traceType: String
    var sourceAnchor: String
    var focus: String
    var text: String
    var evidence: [ReflectionTraceEvidence]   // {label, value} Codable twin of ReflectionLearningEvidence
    var createdAt: Date?
    var legacyItem: String         // the exact rendered English input line (round-trip anchor)
}
```

- `ReflectionTraceRecord.fromLegacyItem(_:sourceLabel:)` — delegates to the SAME parsing logic as `ReflectionLearningTrace.parseCaptured/parseLegacyManual` (expose those as internal static helpers returning a shared parse result).
- `renderLegacyItem()` returns `legacyItem` verbatim (byte-faithful round trip by construction).
- `ReflectionLearningTrace.from(records:)` overload building view-models from records; `from(_ case:)` prefers `traceRecords` when non-empty, else parses items (legacy path intact).
- Tests: round-trip fixtures — captured PDF/Word/Excel lines with evidence tails, Chinese meaning text, user text containing the literal "\nEvidence:" (documented corruption class: assert parser behavior identical between string-path and record-path), manual note lines, non-trace lines (synthesis narration) excluded by both paths identically.

### Task 3: Snapshot v2 + migration + store hardening (TDD)

- `ReflectionCase.traceRecords: [ReflectionTraceRecord] = []` (Codable-additive; legacy decodes get []).
- `ReflectionWorkspaceSnapshot.schemaVersion: Int? / savedAt: Date?`.
- `ReflectionWorkspaceStore.load`: decode both defaults + mirror, prefer NEWER by savedAt (nil = epoch); if any learning case has empty `traceRecords` but parseable input items → migrate (derive records), write pre-migration backup ONCE (both domains), then save v2. Every silent `try?`/empty catch → `os.Logger(subsystem: "com.yinyiping.loom", category: "workspace-store")` error logs; defaults blob size logged when > 512 KB.
- Tests (injected scratch defaults + temp mirror, existing pattern): legacy v1 blob → migrated counts identical (cases/messages/step items unchanged; records count == parseable input items); backup key exists and equals original bytes; newer-wins both directions; mirror-only recovery; corrupted-defaults + healthy-mirror recovery.

### Task 4: Ingest dual-write

- `submitMaterial` (~L454) and `handleExternalSelectionCapture` (~L717): alongside `steps[0].items.append(line)`, append `ReflectionTraceRecord.fromLegacyItem(line, sourceLabel:)` (with `createdAt: Date()`) to `cases[index].traceRecords`.
- Test: ingest simulation via store-level fixture (append line + record, reload, records survive and match parse-of-items).

### Task 5: Shared workspace session (dual-mount fix)

- `final class ReflectionWorkspaceSession: ObservableObject` — `@Published var cases/selectedCaseID/selectedSourceID`, `static let shared`, load in init, `persist()` centralizing ReflectionWorkspaceStore.save.
- Root view: `@State` quartet → `@ObservedObject private var session = ReflectionWorkspaceSession.shared`; mechanical reference rewrite (`cases` → `session.cases` etc.) — the compiler is the checklist. Both mount points now share one store; last-writer-wins across two live windows eliminated.
- If the rewrite ripple exceeds ~150 sites or breaks view identity semantics, fallback: keep @State but back it with the shared session via `.onChange` sync — record the deviation here.

### Task 6: Stage exit

- Full matrix: contracts + LoomTests + lint + typecheck:fast + `npm run verify:native-sidecar -- --preflight` (static integration 10/10) + build installed-app smoke (`npm run app`).
- Live-data proof: run the app binary once locally against a COPY of the real container defaults in an injected suite (never the live domain) via the migration test fixture harvested from the real snapshot (copy blob → fixture file, gitignored).
- Push; CI green; framework doc Stage 1 marked landed; memory updated.
