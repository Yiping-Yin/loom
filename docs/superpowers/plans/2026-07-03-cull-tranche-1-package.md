# Cull Tranche 1 — Verified Package (agent-audited 2026-07-02 night)

Status: READY TO EXECUTE (deferred behind workbench shell / principle store /
export per the all-stages-today sequencing). Keep-list contract test lands
first (tests/native-keep-list-contract.test.ts). Totals: native ~19.5k lines
deleted + ~170 extracted, native tests −2,156 lines, web −~1.7k lines.

## VETOES (prior audit wrong — DO NOT CULL)
- ContentRootStore.swift — LIVE via CaptureSheet:1703+, SecurityScopedFolderStore, LoomEmbeddingStore, DataSettingsView, CaptureWebView:230
- DevServerPreflight.swift — LIVE via DevServer:346,353,373 (keep its tests)
- MigrationBridgeHandler.swift — DataSettingsView:181,432 reads statusDefaultsKey ("loom.migration.v1.status"); inline the constant first, then cull

## EXTRACT-FIRST (same commit as the deletion)
- ContentView.swift (3,675): extract WindowConfigurator (1261–1423 → live file; used by LoomReflectionRootView:210) + LoomWebView.Coordinator payload builders buildSoan/Weaves/Pursuits/Pursuit/Panels/Panel/RecentRecords Payload (2443–2840; called by LIVE LoomURLSchemeHandler:466–478; web /panel depends — /panel is NOT a shim, PanelDetailClient.tsx:110 fetches loom://native/panel/<id>.json)
- LoomDraftStore.swift (541): extract LoomDraftArtifactState (lines 3–9; used by CaptureSheet/AskAIWindow/LoomEmbeddingStore); delete rest + Tests/LoomDraftStoreTests.swift (1,941)
- SourceLibraryBridgeHandler.swift: delete ONLY class lines 17–38; enum SourceLibraryNativeStore is LIVE (LoomURLSchemeHandler:480)
- CapturesView.swift (1,348): KEEP CaptureEntry(26–75)+CapturesIndex(76–600)+BookmarkletDragPill(1163–1256); DELETE CapturesView(601–962)+CaptureReaderView(963–1162)+WebCaptureSetupView(1257–1348); keep CapturesIndex tests

## CLEAN CULLS
LoomDraftView 3,308 · FirstRunProviderSheet 418 (+its test 74) · DraftBridgeHandler 193 · LoomDossierRootView 156 · LoomPursuitHideBridgeHandler 108 · EmbeddingBridgeHandler 41

## SECOND-ORDER ORPHANS
SourceFileView 2,736 · LoomFolderHomeView 2,212 · KnowledgeSidebarView 1,963 · LoomMinimalRootView 1,068 · LoomLibraryView 441 · NavigationBridgeHandler 383 · CaptureWebView 301 · AIStreamBridgeHandler 268 · LoomAIBar 224 · EmbeddingClient 104 (+test 90) · AIBridgeHandler 84 · LoomCommandScripts 52 (+test 34) · LoomWebViewInteractionPolicy 11 (+test 17)

FALSE-POSITIVE DO-NOT-TOUCH: DataSettingsRows, ReflectionModel, LoomDataModel, Ingest/StructuredOutputClient, Views/Ingest/IngestViewSupport, LoomSchemaBridgeHandler, LoomExtractorAnchorsBridgeHandler (+ Ingest/Bridge chain)

## Notification.Name decl gotchas (compile breaks)
- LoomFolderHomeView:2211 declares .loomRefreshActivePage; LIVE LoomReflectionRootView:774 POSTS it → delete that post line same commit
- KnowledgeSidebarView:1958 .loomIngestFileDropped: prune observers IngestionView:70 + LoomApp:2136–2138 (or move decl)
- KnowledgeSidebarView:1962 .loomRescanLibrary: prune LoomApp:194 button
- NavigationBridgeHandler:366–372 decls .loomOpenAbout/KeyboardHelp/Shuttle/EveningWindow: prune LoomApp observers 2124–2144 quartet (menu items use openWindow directly)

## LoomApp.swift prune list (verified observer mapping)
Buttons 144–145(⌘E) 156–167(⌘/ ⌘R ⌘⇧O ⌘[ ⌘]) ~177–196(zoom trio + Reload Sources); menu structs HoldQuestion/AddSoanCard/ConnectSoanCards/Examiner/Ingestion/Reconstructions (+decls 2254/2258/2262/2233–2235; also prune live poster ShuttleView:545); WindowOpener observers 2124–2132, 2136–2138, 2142–2144; dead decl 2214. KEEP: .loomNewTopic/.loomCaptureFromURL/.loomOpenExternalFiles/.loomCaptureExternalSelection/Rehearsal/AskAI/loomExport/loomImport/WorkspaceShortcutsCommands. FLAG (owner decision): .loomShuttleNavigate posts into the void already (⌘1/⌘2/⌘3, ShuttleView, AboutView).

## Web tranche
- app/panels/[id]/page.tsx (19-line replace shim) → CULL whole app/panels/
- app/panel/ NOT a shim — separate product decision, keep
- 16 unreferenced components: DocNotes 197, LoomDiagram 167 (remove from globals-compatibility.test.ts:24), WeaveKindBadge 151, LearningTargetQueueState 141, BatchRunner 130, LearningStatusInline 126 (skeleton test :2685 reads it), ExaminerOverlay 125 (delete tests/examiner-overlay-console-contract.test.ts), Toast 125, RehearsalOverlay 102, RecursingOverlay 70, AnchorDebugOverlay 67, DevStatusBadge 67, LoomLogo 53, SWRegister 52, QuietSceneIntro 47, LearningTargetStateBadge 21
- Do NOT sweep MDX-used components (Callout/AttentionHeatmap/... used by app/wiki/*.mdx); subdirs not swept

## Web contract tests reading culled Swift files (update surface)
new-loom-skeleton-contract.test.ts dominant (reads most culled files — ENOENT before assertions). Also: static-doc-entry, native-detail-endpoints, window-titlebar-tabbing, native-mirror-authority, native-web-theme-sync, extractor-anchors, night-chrome-theme, knowledge-home-source-library, schema-bridge, app-store-assets, captures-landing-refresh-contract, sidebar-no-webcapture-row, loom-mature-platform-contract, native-sidebar-source-row-fallback.

Build note: xcodegen regenerate + npm run app:check-project in same commit.
