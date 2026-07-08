import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  NEW_LOOM_LEGACY_ROUTES,
  NEW_LOOM_INTERNAL_ROUTES,
  NEW_LOOM_INTERNAL_ROUTE_PREFIXES,
  NEW_LOOM_PRIMARY_ROUTES,
  NEW_LOOM_ROUTE_CLASSIFICATION,
  NEW_LOOM_RUNTIME_ROUTES,
  NEW_LOOM_SUPPORT_ROUTES,
} from '../lib/new-loom/product-shell';

const repoRoot = path.resolve(__dirname, '..');

function read(relativePath: string) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function assertTextContains(haystack: string, needle: string) {
  assert.match(normalizeText(haystack), new RegExp(escapeRegExp(normalizeText(needle))));
}

function cssRulesContaining(css: string, selector: string) {
  const rules = css.match(/[^{}]+{[^{}]*}/g) ?? [];
  const matchingRules = rules.filter((rule) => rule.slice(0, rule.indexOf('{')).includes(selector));

  assert.ok(matchingRules.length > 0, `${selector} should have at least one CSS rule`);

  return matchingRules.join('\n');
}

function exactCssRule(css: string, selector: string) {
  const rules = css.match(/[^{}]+{[^{}]*}/g) ?? [];
  const matchingRules = rules.filter((rule) => rule.slice(0, rule.indexOf('{')).trim() === selector);

  assert.ok(matchingRules.length > 0, `${selector} should have an exact CSS rule`);

  return matchingRules.join('\n');
}

function listPageRoutes(dir: string = path.join(repoRoot, 'app')): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const routes: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      routes.push(...listPageRoutes(fullPath));
    } else if (/^page\.(tsx|mdx)$/.test(entry.name)) {
      const relative = path.relative(path.join(repoRoot, 'app'), fullPath);
      const route = relative.replace(/\/page\.(tsx|mdx)$/, '').replace(/^page\.(tsx|mdx)$/, '');
      routes.push(route ? `/${route}` : '/');
    }
  }

  return routes.sort();
}

// ---------------------------------------------------------------------------
// Web-retirement reconciliation (2026-07-09): the tests that pinned the
// retired web surfaces (Draft board, /help, /system, /reflection mirror,
// /collect, onboarding, product-history, loom-render) and the culled native
// islands (ContentView, LoomMinimalRootView, CapturesView, Examiner/
// Rehearsal, LoomDraftView…) died with their subjects, per the same-commit
// law. What remains below pins the LIVE skeleton only.
// ---------------------------------------------------------------------------

test('new Loom web shell exposes the owner-dossier + Sources loop', () => {
  // Post-retirement loop (owner rulings 2026-07-08): `/` IS the owner
  // dossier, Sources is the one workspace surface; Studio / web Digital Me
  // / Draft are retired and must stay retired.
  const home = read('app/HomeClient.tsx');
  const productShell = read('lib/new-loom/product-shell.ts');

  assert.match(productShell, /label:\s*'Sources'/);
  assert.match(productShell, /'\/sources'/);
  assert.doesNotMatch(productShell, /label:\s*'Studio'|label:\s*'Draft'|label:\s*'Collect'|label:\s*'Organize'/);
  assert.doesNotMatch(productShell, /href:\s*'\/studio'|href:\s*'\/digital-me'/);
  assert.match(home, /NEW_LOOM_CAPABILITIES/);
  assert.match(home, /data-capability=\{capability\.id\}/);

  for (const legacy of [
    'Atelier',
    'Weaves',
    'Patterns',
    'Pursuits',
    'Sōan',
    'Workbench',
    'Constellation',
    'Atlas',
  ]) {
    assert.doesNotMatch(home, new RegExp(`>${legacy}<|["']${legacy}["']`));
  }
});

test('native ingestion persists local origin metadata for imported files', () => {
  const ingestionView = read('macos-app/Loom/Sources/Workspace/Capture/IngestionView.swift');

  assert.match(ingestionView, /struct LocalFileOrigin: Codable, Equatable/);
  assert.match(ingestionView, /kind: "local-pdf"/);
  assert.match(ingestionView, /kind: "local-pptx"/);
  assert.match(ingestionView, /kind: "local-key"/);
  assert.match(ingestionView, /kind: "local-pages"/);
  assert.match(ingestionView, /kind: "local-image"/);
  assert.match(ingestionView, /originalPath/);
  assert.match(ingestionView, /originalMtime/);
  assert.match(ingestionView, /importedAt/);
  assert.match(ingestionView, /mimeHint/);
  assert.match(ingestionView, /pageRanges/);
  assert.match(ingestionView, /sourceDocId[\s\S]*ingested-file:/);
  assert.match(ingestionView, /origin: LocalFileOrigin\?/);
  assert.match(ingestionView, /event\["origin"\] = origin\.eventPayload\(\)/);
  assert.match(ingestionView, /SlideDeckExtractor\.parsePPTXText\(at: url\)/);
  assert.match(ingestionView, /imageImportText\(url:/);
});

test('native iWork import preserves Keynote and Pages package metadata', () => {
  const ingestionView = read('macos-app/Loom/Sources/Workspace/Capture/IngestionView.swift');
  const slideDeckExtractor = read('macos-app/Loom/Sources/Shared/Ingest/SlideDeckExtractor.swift');
  const slideDeckTests = read('macos-app/Loom/Tests/SlideDeckExtractorTests.swift');
  const fixtureGenerator = read(
    'macos-app/Loom/Tests/fixtures/slide-deck/generate_slide_deck_fixtures.py',
  );
  const loomDoc = read('docs/loom.md');

  assert.match(ingestionView, /"key", "pages"/);
  assert.match(
    ingestionView,
    /ext == "pptx" \|\| ext == "ppt" \|\| ext == "key" \|\| ext == "pages"/,
  );
  assert.match(ingestionView, /if ext == "key" \{ return "local-key" \}/);
  assert.match(ingestionView, /if ext == "pages" \{ return "local-pages" \}/);

  assert.match(slideDeckExtractor, /iWork path:/);
  assert.match(slideDeckExtractor, /Metadata\/\*\.plist/);
  assert.match(slideDeckExtractor, /parseIWorkArchiveText/);
  assert.match(slideDeckExtractor, /extractIWorkMetadataText/);
  assert.match(slideDeckExtractor, /extractIWorkBodyText/);
  assert.match(slideDeckExtractor, /extractIWorkPreviewPDFText/);
  assert.match(slideDeckExtractor, /extractUTF8TextRuns/);
  assert.match(slideDeckExtractor, /extractUTF16LETextRuns/);
  assert.match(slideDeckExtractor, /iWork metadata/);
  assert.match(slideDeckExtractor, /iWork body text/);
  assert.match(slideDeckExtractor, /QuickLook preview/i);
  assert.match(slideDeckExtractor, /PDFExtraction\.extract/);
  assert.match(slideDeckExtractor, /path\.hasSuffix\("\/preview\.pdf"\)/);

  assert.match(slideDeckTests, /testParseKeynoteIWorkArchiveIncludesDocumentMetadata/);
  assert.match(slideDeckTests, /testParsePagesIWorkArchiveIncludesDocumentMetadata/);
  assert.match(slideDeckTests, /testParseKeynoteIWorkArchiveIncludesIWAStringBodyText/);
  assert.match(slideDeckTests, /testParsePagesIWorkArchiveIncludesIWAStringBodyText/);
  assert.match(slideDeckTests, /testParseKeynoteIWorkArchiveDropsDuplicateStandaloneSlideMarkers/);
  assert.match(slideDeckTests, /testParsePagesIWorkArchiveDropsDuplicateStandalonePageMarkers/);
  assert.match(slideDeckTests, /testParsePagesIWorkArchiveExtractsNestedQuickLookPreviewPDF/);
  assert.match(slideDeckTests, /metadata\.key/);
  assert.match(slideDeckTests, /metadata\.pages/);
  assert.match(slideDeckTests, /body\.key/);
  assert.match(slideDeckTests, /body\.pages/);
  assert.match(slideDeckTests, /body-duplicate-marker\.key/);
  assert.match(slideDeckTests, /body-duplicate-marker\.pages/);
  assert.match(slideDeckTests, /preview-nested\.pages/);
  assert.match(slideDeckTests, /Nested QuickLook preview evidence/);
  assert.match(slideDeckTests, /第 3 页：机制设计例子/);
  assert.match(slideDeckTests, /第 3 页：先理解再自测/);

  assert.match(fixtureGenerator, /metadata\.key/);
  assert.match(fixtureGenerator, /metadata\.pages/);
  assert.match(fixtureGenerator, /body\.key/);
  assert.match(fixtureGenerator, /body\.pages/);
  assert.match(fixtureGenerator, /body-duplicate-marker\.key/);
  assert.match(fixtureGenerator, /body-duplicate-marker\.pages/);
  assert.match(fixtureGenerator, /preview-nested\.pages/);
  assert.match(fixtureGenerator, /Nested QuickLook preview evidence/);
  assert.match(fixtureGenerator, /IWORK_PROPERTIES_PLIST/);
  assert.match(fixtureGenerator, /第 3 页：机制设计例子/);
  assert.match(fixtureGenerator, /第 3 页：先理解再自测/);

  assert.match(
    loomDoc,
    /active checkout has PDF \/ PPTX \/ Keynote \/ Pages \/ Markdown \/ text\s+\/\s+DOCX \/ RTF \/ image/,
  );
  assert.match(
    loomDoc,
    /\| \*\*PPTX \/ Keynote \/ Pages\*\* \| 逐页\/页组结构抽取 \+ iWork 元数据 \+ IWA 正文文本 \+ QuickLook 预览文本 \+ marker 去重 \+ 保留原档 \| \*\*P0\*\* \|/,
  );
  assert.match(
    loomDoc,
    /\| \*\*PPTX \/ Keynote \/ Pages\*\* \| [^\n]*QuickLook 预览文本[^\n]*marker 去重[^\n]* \| \*\*P0\*\* \|/,
  );
  assert.doesNotMatch(loomDoc, /\| DOCX \/ Pages \| Pandoc 转 MD \+ 保留原档 \|/);
});

test('native image import uses Vision OCR while preserving visual provenance fallback', () => {
  const ingestionView = read('macos-app/Loom/Sources/Workspace/Capture/IngestionView.swift');
  const typedExtractorTests = read('macos-app/Loom/Tests/TypedExtractorMatchTests.swift');

  assert.match(ingestionView, /import Vision/);
  assert.match(ingestionView, /struct LocalImageImportText/);
  assert.match(ingestionView, /LocalImageImportText\.build\(/);
  assert.match(ingestionView, /VNRecognizeTextRequest/);
  assert.match(ingestionView, /VNImageRequestHandler\(url: url, options: \[:\]\)/);
  assert.match(ingestionView, /recognizedText:\s*recognizedText/);
  assert.match(
    ingestionView,
    /images keep OCR, semantic labels, and visual provenance/,
  );
  assert.match(ingestionView, /No text was recognized by OCR\./);
  assert.doesNotMatch(ingestionView, /OCR is not available yet/);

  assert.match(
    typedExtractorTests,
    /testLocalImageImportTextIncludesRecognizedOCRTextWhenAvailable/,
  );
  assert.match(
    typedExtractorTests,
    /testLocalImageImportTextKeepsVisualFallbackWhenOCRFindsNoText/,
  );
});

test('native image import adds semantic Vision labels beyond OCR metadata', () => {
  const ingestionView = read('macos-app/Loom/Sources/Workspace/Capture/IngestionView.swift');
  const typedExtractorTests = read('macos-app/Loom/Tests/TypedExtractorMatchTests.swift');

  assert.match(ingestionView, /VNClassifyImageRequest/);
  assert.match(ingestionView, /recognizeImageVisualDescriptions\(url:/);
  assert.match(ingestionView, /visualDescriptions:\s*visualDescriptions/);
  assert.match(ingestionView, /imageSummary\(recognizedText:/);
  assert.match(ingestionView, /Image summary:/);
  assert.match(ingestionView, /visual signals:/);
  assert.match(ingestionView, /recognized text:/);
  assert.match(ingestionView, /Visual description:/);

  assert.match(
    typedExtractorTests,
    /testLocalImageImportTextIncludesSemanticVisualDescriptionsBeyondOCR/,
  );
  assert.match(typedExtractorTests, /testLocalImageImportTextAddsReadableImageSummary/);
  assert.match(typedExtractorTests, /visualDescriptions:/);
});

test('real user file importer verifier is executable and opt-in', () => {
  const packageJson = read('package.json');
  const verifier = read('scripts/verify-real-file-importer.mjs');
  const swiftVerifier = read('scripts/verify-real-file-importer.swift');
  const audit = read('docs/projects/active/2026-05-09-new-loom-completion-audit.md');
  const handoff = read('docs/projects/active/2026-05-09-new-loom-handoff.md');

  assert.match(
    packageJson,
    /"verify:real-files-importer":\s*"node scripts\/verify-real-file-importer\.mjs"/,
  );
  assert.match(verifier, /LOOM_REAL_FILE_ROOT/);
  assert.match(verifier, /Real-file importer root is required/);
  assert.doesNotMatch(verifier, /Knowledge System\/UNSW/);
  assert.match(verifier, /FINS3616 Week 2_Updated\.pptx/);
  assert.match(verifier, /coverage:\s*summarizeSupportedFiles\(scanned\)/);
  assert.match(verifier, /iWorkPackages/);
  assert.match(verifier, /scanned\.deckPackages,\s*5/);
  assert.match(verifier, /scanned\.iWorkPackages,\s*5/);
  assert.match(verifier, /swiftc/);
  assert.match(verifier, /PDFExtraction\.swift/);
  assert.match(verifier, /CleanText\.swift/);
  assert.match(verifier, /PageRange\.swift/);

  assert.match(swiftVerifier, /RealFileImporterManifest/);
  assert.match(swiftVerifier, /RealFileImporterCoverage/);
  assert.match(swiftVerifier, /manifest\.coverage/);
  assert.match(swiftVerifier, /PDFExtraction\.extract/);
  assert.match(swiftVerifier, /NSImage\(contentsOf:/);
  assert.match(swiftVerifier, /import Vision/);
  assert.match(swiftVerifier, /VNRecognizeTextRequest/);
  assert.match(swiftVerifier, /VNClassifyImageRequest/);
  assert.match(swiftVerifier, /VNImageRequestHandler\(url: imageURL, options: \[:\]\)/);
  assert.match(swiftVerifier, /image: .*ocr=/);
  assert.match(swiftVerifier, /visualDescriptions=/);
  assert.match(swiftVerifier, /summary:\s*String\?/);
  assert.match(swiftVerifier, /imageSummary\(recognizedText:/);
  assert.match(swiftVerifier, /summary=/);
  assert.match(swiftVerifier, /NSAttributedString\(url:/);
  assert.match(swiftVerifier, /extractPPTXText/);
  assert.match(swiftVerifier, /skippedDeckEvidence/);
  assert.match(swiftVerifier, /for deckPath in manifest\.deckPackages\.prefix\(5\)/);
  assert.match(swiftVerifier, /catch \{/);
  assert.match(swiftVerifier, /extractIWorkPackageText/);
  assert.match(swiftVerifier, /skippedIWorkEvidence/);
  assert.match(swiftVerifier, /for iWorkPath in manifest\.iWorkPackages\.prefix\(5\)/);
  assert.match(swiftVerifier, /ppt\/slides\/slide/);
  assert.match(swiftVerifier, /iwork: none found in real corpus/);
  assert.match(swiftVerifier, /real-file importer evidence ok/);

  assert.match(audit, /npm run verify:real-files-importer/);
  assert.match(handoff, /npm run verify:real-files-importer/);
});

test('prompt-to-artifact completion checklist names current evidence and open product gates', () => {
  const audit = read('docs/projects/active/2026-05-09-new-loom-completion-audit.md');

  assert.match(audit, /## Prompt-To-Artifact Checklist/);
  assert.match(audit, /The user objective is \*\*完整彻底实现新 Loom，而不只是 phase 1\*\*/);
  assert.match(audit, /Full-product acceptance means these surfaces must work together as one installed product loop/);
  assert.doesNotMatch(audit, /In concrete Phase 1 terms/);
  assert.match(audit, /`npm run test:contracts` 572\/572/);
  assert.match(audit, /`npm run verify:compile-quality` passed all five manual quality case/);
  assert.match(audit, /`npm run verify:product` completed with exit code 0/);
  assert.match(audit, /Update at 2026-05-11 10:20 AEST/);
  assert.match(audit, /final (?:`npm run verify:product` installed|strict) Draft chrome gate[\s\S]*passed against pid `\d+`, window `\d+`, with\s+`sidebarTopPt: \d+\.\d` and `detailTopPt: \d+\.\d`/);
  assert.match(audit, /final strict installed Draft chrome gate passed against installed pid\s+`69380`, window `36905`, with `sidebarTopPt: 73\.8` and `detailTopPt: 67\.3`/);
  assert.match(audit, /fallback main-window creation path now both insert `\.fullScreenPrimary` into\s+`window\.collectionBehavior`/);
  assert.match(audit, /standardWindowButton\(\.toolbarButton\)/);
  assert.match(audit, /sidebarToggleGlyphTopPt/);
  assert.match(audit, /standard macOS sidebar-toggle glyphs/);
  assert.match(audit, /static export now publishes with in-place `rsync --delete`/);
  assert.match(audit, /native provider\s+stub verification runs Xcode from a temporary rsynced workspace/);
  assert.match(audit, /production builds use\s+`\.next-build-current` instead of the corrupted historical `\.next-build`/);
  assert.match(audit, /`rootToolbarHeight: 28`/);
  assert.match(audit, /The root shell now owns one 28pt toolbar and one 8pt body-start rhythm/);
  assert.match(audit, /`loom-installed-draft-chrome-\d+\.png`(?: is| at) `2936x1910`/);
  assert.match(audit, /NSWindow\.didEnterFullScreenNotification/);
  assert.match(audit, /LoomMinimalRootView\.swift` now owns the shell with `HStack\(spacing: 0\)` and `rootSplitHairline` instead of system `NavigationSplitView` or `HSplitView`/);
  assert.match(audit, /inline `@references` now resolve unique short aliases across attached references and selected corpus hits/);
  assert.match(audit, /Draft references preserve `sourceTitle`, `category`, `sourcePath`, `excerpt`/);
  assert.match(audit, /Source detail delete action is visible but destructive delete was not clicked/);
  assert.match(audit, /Strict latest-binary installed Draft chrome acceptance/);
  assert.match(audit, /Real user-file installed-app importer acceptance/);
  assert.match(audit, /Live provider-output Compile\/Draft acceptance/);
  assert.match(audit, /Do not mark the full new Loom goal complete until these gates are closed/);
});

test('native PDF extraction falls back to Vision OCR when PDFKit text is empty', () => {
  const pdfExtraction = read('macos-app/Loom/Sources/Shared/Ingest/PDFExtraction.swift');
  const cleanTextTests = read('macos-app/Loom/Tests/CleanTextParityTests.swift');

  assert.match(pdfExtraction, /import Vision/);
  assert.match(pdfExtraction, /import AppKit/);
  assert.match(
    pdfExtraction,
    /catch PDFExtractionError\.empty[\s\S]{0,180}recognizeScannedText\(document: document\)/,
  );
  assert.match(
    pdfExtraction,
    /static func extract\(\s*pageTexts: \[String\],\s*ocrPageTexts: \[\[String\]\]/,
  );
  assert.match(pdfExtraction, /let ocrPages = ocrPageTexts\.map/);
  assert.match(pdfExtraction, /pageLines\.joined\(separator: "\\n"\)/);
  assert.match(
    pdfExtraction,
    /private static func recognizeScannedText\(document: PDFDocument\) -> \[\[String\]\]/,
  );
  assert.match(pdfExtraction, /page\.thumbnail\(of: thumbnailSize\(for: page\), for: \.mediaBox\)/);
  assert.match(pdfExtraction, /VNRecognizeTextRequest/);
  assert.match(pdfExtraction, /VNImageRequestHandler\(cgImage: cgImage, options: \[:\]\)/);

  assert.match(cleanTextTests, /testPDFExtractionFallsBackToOCRPageTextWhenPDFKitTextIsEmpty/);
  assert.match(cleanTextTests, /ocrPageTexts:\s*\[/);
  assert.match(cleanTextTests, /demand curve shifts right/);
  assert.match(cleanTextTests, /consumer surplus/);
});

test('native PPTX extraction preserves embedded shape and image alt text', () => {
  const slideDeckExtractor = read('macos-app/Loom/Sources/Shared/Ingest/SlideDeckExtractor.swift');
  const slideDeckTests = read('macos-app/Loom/Tests/SlideDeckExtractorTests.swift');
  const fixtureGenerator = read(
    'macos-app/Loom/Tests/fixtures/slide-deck/generate_slide_deck_fixtures.py',
  );

  assert.match(slideDeckExtractor, /cNvPr/);
  assert.match(slideDeckExtractor, /attributeDict\["title"\]/);
  assert.match(slideDeckExtractor, /attributeDict\["descr"\]/);
  assert.match(slideDeckExtractor, /appendAltText\(from:/);
  assert.match(
    slideDeckExtractor,
    /shape\/image title and\s+\/\/\/ description attributes on `cNvPr`/,
  );

  assert.match(slideDeckTests, /testParsePPTXIncludesShapeAndImageAltText/);
  assert.match(slideDeckTests, /alt-text\.pptx/);
  assert.match(slideDeckTests, /Revenue chart/);
  assert.match(slideDeckTests, /Line chart showing revenue increasing from Q1 to Q4/);
  assert.match(slideDeckTests, /Warning callout: churn risk remains elevated/);

  assert.match(fixtureGenerator, /ALT_TEXT_SLIDE/);
  assert.match(fixtureGenerator, /title="Revenue chart"/);
  assert.match(fixtureGenerator, /descr="Line chart showing revenue increasing from Q1 to Q4"/);
  assert.match(fixtureGenerator, /descr="Warning callout: churn risk remains elevated"/);
});

test('fallback main Loom window uses the same full-size chrome contract as the scene window', () => {
  const loomApp = read('macos-app/Loom/Sources/App/Shell/LoomApp.swift');
  const reflectionRoot = read('macos-app/Loom/Sources/Workspace/Shell/LoomReflectionRootView.swift');

  assert.match(loomApp, /private func createFallbackMainWindow\(\)/);
  assert.match(loomApp, /LoomReflectionRootView\(\)[\s\S]{0,140}\.background\(WindowOpener\(\)\)/);
  assert.match(loomApp, /let rootView = LoomReflectionRootView\(\)/);
  assert.doesNotMatch(loomApp, /let rootView = LoomDossierRootView\(\)/);
  assert.match(reflectionRoot, /ReflectionTopBar\(/);
  assert.doesNotMatch(reflectionRoot, /ReflectionBottomStatusStrip/);
  assert.match(
    loomApp,
    /styleMask:\s*\[\.titled,\s*\.closable,\s*\.miniaturizable,\s*\.resizable,\s*\.fullSizeContentView\]/,
    'fallback minimal windows should match the scene window: full-size content plus explicit in-window top guards',
  );
});

test('hosted XCTest runs do not materialize a second visible Loom room', () => {
  const loomApp = read('macos-app/Loom/Sources/App/Shell/LoomApp.swift');
  const mainStart = loomApp.indexOf('Window("Loom", id: MainWindow.id)');
  const settingsStart = loomApp.indexOf('Settings {', mainStart);
  const delegateStart = loomApp.indexOf('class AppDelegate: NSObject, NSApplicationDelegate');
  const newTopicStart = loomApp.indexOf('struct NewTopicMenuItem', delegateStart);

  assert.ok(mainStart >= 0 && settingsStart > mainStart, 'main Loom Window scene block must be bounded');
  assert.ok(delegateStart >= 0 && newTopicStart > delegateStart, 'AppDelegate block must be bounded');

  const mainScene = loomApp.slice(mainStart, settingsStart);
  const delegate = loomApp.slice(delegateStart, newTopicStart);

  assert.match(
    mainScene,
    /if isRunningInXCTestHost \{[\s\S]{0,120}EmptyView\(\)/,
    'hosted unit tests should not mount the product root view and create a second visible Loom surface',
  );
  assert.match(
    delegate,
    /private var isRunningInXCTestHost: Bool[\s\S]{0,320}XCTestConfigurationFilePath[\s\S]{0,160}XCTestBundlePath/,
    'the app delegate must detect hosted XCTest so verification does not activate a second Loom.app',
  );
  assert.doesNotMatch(
    delegate,
    /private var isRunningInXCTestHost: Bool[\s\S]{0,260}NSClassFromString\("XCTestCase"\)/,
    'normal Debug launches may load XCTest symbols; hosted-test detection must use environment markers only',
  );
  assert.match(
    delegate,
    /override init\(\)[\s\S]{0,260}guard !isRunningInXCTestHost else \{ return \}/,
    'AppDelegate init should not schedule main-window repair while the app is only an XCTest host',
  );
  assert.match(
    delegate,
    /func applicationDidFinishLaunching[\s\S]{0,260}guard !isRunningInXCTestHost else \{ return \}[\s\S]{0,80}configureLaunchIfNeeded\(\)/,
    'XCTest launches should not configure or present the main Loom room',
  );
  assert.match(
    delegate,
    /func applicationDidBecomeActive[\s\S]{0,320}guard !isRunningInXCTestHost else \{ return \}[\s\S]{0,320}configureLaunchIfNeeded\(\)/,
    'XCTest activation should not re-open the visible main Loom room',
  );
  assert.match(
    delegate,
    /private func ensureMainWindowVisible\(\)[\s\S]{0,220}guard !isRunningInXCTestHost else \{ return \}/,
    'all remaining repair paths should no-op in XCTest to prevent duplicate Loom windows',
  );
});

test('main-window fallback promotes off-active scene windows and hidden windows', () => {
  const loomApp = read('macos-app/Loom/Sources/App/Shell/LoomApp.swift');
  const materializeStart = loomApp.indexOf('private func materializeFallbackMainWindow(');
  const createStart = loomApp.indexOf('private func createFallbackMainWindow()', materializeStart);

  assert.ok(materializeStart >= 0 && createStart > materializeStart, 'fallback materialization block must be bounded');

  const materialize = loomApp.slice(materializeStart, createStart);
  assert.match(
    materialize,
    /private func materializeFallbackMainWindow\(ignoreHiddenWindow: Bool = false\)/,
    'fallback materialization should support a second pass that ignores an unrecoverable hidden scene window',
  );
  assert.match(
    materialize,
    /if let window = fallbackMainWindow, window\.isVisible \{[\s\S]{0,120}presentWindowOnActiveSpace\(window\)[\s\S]{0,80}return/,
    'visible fallback windows should be promoted rather than replaced',
  );
  assert.match(
    materialize,
    /if let window = existingMainWindow\(includeHidden: false, requireActiveSpace: true\) \{[\s\S]{0,120}presentWindowOnActiveSpace\(window\)[\s\S]{0,80}return/,
    'visible scene windows should only be promoted when they are on the active Space',
  );
  assert.match(
    materialize,
    /if let window = existingMainWindow\(includeHidden: false\) \{[\s\S]{0,180}materializeFallbackMainWindow: promoting off-active window[\s\S]{0,180}presentWindowOnActiveSpace\(window\)[\s\S]{0,80}return/,
    'off-active scene windows should be moved forward instead of destroyed during launch Space transitions',
  );
  assert.match(
    materialize,
    /if !ignoreHiddenWindow, let window = existingMainWindow\(includeHidden: true\) \{[\s\S]{0,180}materializeFallbackMainWindow: promoting hidden window[\s\S]{0,180}presentWindowOnActiveSpace\(window\)[\s\S]{0,80}return/,
    'hidden scene windows should be promoted before a fallback host is created',
  );
  const ensureStart = loomApp.indexOf('private func ensureMainWindowVisible()');
  const reconcileStart = loomApp.indexOf('@MainActor\n    private func reconcileDuplicateMainWindows', ensureStart);
  const presentStart = loomApp.indexOf('@MainActor\n    private func presentWindowOnActiveSpace', reconcileStart);
  assert.ok(ensureStart >= 0 && reconcileStart > ensureStart, 'ensureMainWindowVisible block must be bounded');
  assert.ok(presentStart > reconcileStart, 'duplicate main-window reconciliation block must be bounded');
  const ensureBlock = loomApp.slice(ensureStart, reconcileStart);
  const reconcileBlock = loomApp.slice(reconcileStart, presentStart);
  assert.match(
    ensureBlock,
    /using visible window=[\s\S]*presentWindowOnActiveSpace\(window\)[\s\S]*return/,
    'active visible windows should be reused and promoted',
  );
  assert.match(
    ensureBlock,
    /if let window = existingMainWindow\(includeHidden: false\) \{[\s\S]*ensureMainWindowVisible: promoting off-active window[\s\S]*presentWindowOnActiveSpace\(window\)[\s\S]*return/,
    'off-active visible windows should be promoted without closing them',
  );
  assert.match(
    ensureBlock,
    /if let window = existingMainWindow\(includeHidden: true\) \{[\s\S]*ensureMainWindowVisible: promoting hidden window[\s\S]*presentWindowOnActiveSpace\(window\)[\s\S]*return/,
    'hidden scene windows should be promoted without closing them',
  );
  assert.match(loomApp, /requireActiveSpace: Bool = false/);
  assert.match(loomApp, /requireActiveSpace && !window\.isOnActiveSpace/);
  assert.doesNotMatch(loomApp, /closeOffActiveSpaceMainWindows/);
  assert.match(loomApp, /promoting off-active window/);
  assert.doesNotMatch(
    ensureBlock,
    /closeMainWindow\(window\)/,
    'main-window launch repair must not close windows while AppKit is still settling Spaces',
  );
  assert.match(
    ensureBlock,
    /reconcileDuplicateMainWindows\(\)/,
    'launch repair should first collapse accidental duplicate main rooms before presenting one',
  );
  assert.match(
    reconcileBlock,
    /if let fallbackMainWindow,[\s\S]{0,180}windows\.contains\(where: \{ \$0 !== fallbackMainWindow \}\)[\s\S]{0,240}closeMainWindow\(fallbackMainWindow\)/,
    'duplicate reconciliation may close the AppKit fallback once the real SwiftUI scene exists',
  );
  assert.match(
    reconcileBlock,
    /for window in windows where window !== keeper \{[\s\S]{0,240}closeMainWindow\(window\)/,
    'duplicate reconciliation may close extra visible main rooms after choosing a keeper',
  );
  assert.match(loomApp, /presentationBehavior\.insert\(\.canJoinAllSpaces\)/);
  const presentBlock = loomApp.slice(presentStart, loomApp.indexOf('/// Materialize a fallback main window', presentStart));
  assert.doesNotMatch(presentBlock, /\.insert\(\.moveToActiveSpace\)/);
  assert.doesNotMatch(loomApp, /mainPresentationRestore/);
});

test('DevServer publishes SwiftUI observable state from the main thread', () => {
  // Post-shrink DevServer (audit A3): a static shell over the loom://
  // scheme — no node child, no retry machinery. The one @Published write
  // must still hop to main, and the legacy API surface stays honest.
  const devServer = read('macos-app/Loom/Sources/App/Runtime/DevServer.swift');

  assert.match(
    devServer,
    /func markReadyForStaticBundle\(\) \{[\s\S]{0,200}guard Thread\.isMainThread else \{[\s\S]{0,120}DispatchQueue\.main\.async \{ \[weak self\] in[\s\S]{0,80}self\?\.markReadyForStaticBundle\(\)/,
    'static-bundle ready must hop back to main before publishing @Published state',
  );
  assert.match(devServer, /func start\(\) \{[\s\S]{0,60}markReadyForStaticBundle\(\)/);
  // Kept-for-callers no-op (in-flight Settings panes still call it).
  assert.match(devServer, /func reloadFromKeychain\(\) \{\}/);
  assert.match(devServer, /loom:\/\/bundle\/index\.html/);
});

test('AppDelegate reasserts reflection main-window hidden-toolbar chrome', () => {
  const loomApp = read('macos-app/Loom/Sources/App/Shell/LoomApp.swift');
  const appDelegateStart = loomApp.indexOf('class AppDelegate');
  const terminateStart = loomApp.indexOf('func applicationShouldTerminateAfterLastWindowClosed', appDelegateStart);

  assert.ok(appDelegateStart >= 0, 'AppDelegate must exist');
  assert.ok(terminateStart > appDelegateStart, 'AppDelegate block must be bounded');

  const appDelegate = loomApp.slice(appDelegateStart, terminateStart);

  assert.match(
    appDelegate,
    /private func configureMainWindowChrome\(_ window: NSWindow\)/,
    'main-window chrome repair should not rely only on the SwiftUI WindowConfigurator background view',
  );
  assert.match(appDelegate, /window\.titlebarAppearsTransparent = true/);
  assert.match(appDelegate, /window\.titleVisibility = \.hidden/);
  assert.match(appDelegate, /window\.styleMask\.insert\(\.fullSizeContentView\)/);
  assert.match(appDelegate, /window\.toolbar = nil/);
  assert.match(appDelegate, /clearTitlebarAccessories\(window\)/);
  assert.doesNotMatch(
    appDelegate,
    /window\.titlebarAccessoryViewControllers = \[\]/,
    'direct titlebarAccessoryViewControllers assignment crashes before route acceptance can run',
  );
  assert.match(appDelegate, /window\.standardWindowButton\(\.toolbarButton\)\?\.isHidden = true/);
  assert.match(
    appDelegate,
    /private func clearTitlebarAccessories\(_ window: NSWindow\)[\s\S]{0,220}Selector\(\("setTitlebarAccessoryViewControllers:"\)\)/,
    'titlebar accessory cleanup must stay guarded when AppDelegate repairs the main window',
  );
  assert.match(
    appDelegate,
    /applicationDidBecomeActive[\s\S]{0,900}if let window = existingMainWindow\(includeHidden: false, requireActiveSpace: true\) \{[\s\S]{0,180}configureMainWindowChrome\(window\)/,
    'returning to Loom should repair any titlebar chrome macOS restored while inactive',
  );
  assert.match(
    appDelegate,
    /private func presentWindowOnActiveSpace\(_ window: NSWindow\) \{[\s\S]{0,420}configureMainWindowChrome\(window\)/,
    'every reopen/URL-routing path should repair the existing main window before it is shown',
  );
  assert.match(
    appDelegate,
    /presentationBehavior\.remove\(\.moveToActiveSpace\)[\s\S]{0,120}presentationBehavior\.insert\(\.canJoinAllSpaces\)[\s\S]{0,120}window\.collectionBehavior = presentationBehavior/,
    'reopen/URL-routing presentation should keep restored windows visible on the current Space',
  );
  assert.match(
    appDelegate,
    /DispatchQueue\.main\.asyncAfter\(deadline: \.now\(\) \+ 1\.0\) \{ \[weak self, weak window\] in[\s\S]{0,220}configureMainWindowChrome\(window\)/,
    'space transitions need a delayed repair after AppKit finishes moving the window',
  );
});

test('legacy migration plan covers the product route classification map', () => {
  const plan = read('docs/projects/active/2026-05-09-legacy-surface-migration-plan.md');
  const productShell = read('lib/new-loom/product-shell.ts');

  assert.match(productShell, /NEW_LOOM_PRIMARY_ROUTES/);
  assert.match(productShell, /NEW_LOOM_RUNTIME_ROUTES/);
  assert.match(productShell, /NEW_LOOM_LEGACY_ROUTES/);

  for (const route of [
    ...NEW_LOOM_PRIMARY_ROUTES,
    ...NEW_LOOM_RUNTIME_ROUTES,
    ...NEW_LOOM_LEGACY_ROUTES,
  ]) {
    assert.match(
      plan,
      new RegExp(`\`${escapeRegExp(route)}\``),
      `${route} should be classified in the migration plan`,
    );
  }

  for (const route of NEW_LOOM_LEGACY_ROUTES) {
    assert.doesNotMatch(
      plan,
      new RegExp(`\\|\\s*\`${escapeRegExp(route)}\`\\s*\\|\\s*Primary\\s*\\|`),
    );
  }
});

test('legacy route deletion review blocks removal until every checklist item has evidence', async () => {
  const reviewPath = path.join(repoRoot, 'lib/new-loom/legacy-route-deletion.ts');
  assert.ok(
    fs.existsSync(reviewPath),
    'legacy deletion review registry should be executable, not prose-only',
  );

  const {
    NEW_LOOM_LEGACY_ROUTE_DELETION_REVIEWS,
    getLegacyRouteDeletionReview,
    listLegacyRoutesReadyForDeletion,
  } = await import('../lib/new-loom/legacy-route-deletion');
  const plan = read('docs/projects/active/2026-05-09-legacy-surface-migration-plan.md');
  const audit = read('docs/projects/active/2026-05-09-new-loom-completion-audit.md');

  const reviewRoutes = NEW_LOOM_LEGACY_ROUTE_DELETION_REVIEWS.map((review) => review.route).sort();
  assert.deepEqual(reviewRoutes, [...NEW_LOOM_LEGACY_ROUTES].sort());
  assert.deepEqual(listLegacyRoutesReadyForDeletion(), []);

  for (const route of NEW_LOOM_LEGACY_ROUTES) {
    const review = getLegacyRouteDeletionReview(route);
    assert.ok(review, `${route} should have a deletion review record`);
    assert.ok(
      review.replacementEvidence.length > 0,
      `${route} should name replacement or retirement evidence`,
    );
    assert.ok(
      review.blockers.length > 0,
      `${route} should stay blocked until release-cycle evidence exists`,
    );
    assert.equal(
      review.readyForDeletion,
      Object.values(review.checklist).every(Boolean) && review.blockers.length === 0,
      `${route} deletion readiness should be derived from checklist evidence`,
    );
    assert.equal(
      review.checklist.hiddenForOneReleaseCycle,
      false,
      `${route} has not shipped hidden for one release cycle`,
    );
    assert.equal(
      review.readyForDeletion,
      false,
      `${route} should not be deleted in the current slice`,
    );
  }

  assert.match(
    getLegacyRouteDeletionReview('/uploads')!.replacementEvidence.join('\n'),
    /\/sources[\s\S]*Add files/,
  );
  assert.match(
    getLegacyRouteDeletionReview('/knowledge')!.replacementEvidence.join('\n'),
    /\/sources/,
  );
  assert.match(getLegacyRouteDeletionReview('/desk')!.replacementEvidence.join('\n'), /\/sources/);
  assert.match(
    getLegacyRouteDeletionReview('/notes')!.replacementEvidence.join('\n'),
    /\/sources#reader-notes/,
  );
  assert.match(getLegacyRouteDeletionReview('/coworks')!.replacementEvidence.join('\n'), /\/draft/);
  assert.match(
    getLegacyRouteDeletionReview('/diagrams')!.replacementEvidence.join('\n'),
    /\/draft/,
  );

  assert.match(plan, /NEW_LOOM_LEGACY_ROUTE_DELETION_REVIEWS/);
  assert.match(audit, /legacy route deletion review registry/);
});

test('compatibility and migration-source route rows are classified as legacy routes', () => {
  const plan = read('docs/projects/active/2026-05-09-legacy-surface-migration-plan.md');
  const legacyRoutes = new Set<string>(NEW_LOOM_LEGACY_ROUTES);
  const routeRows = plan
    .split('\n')
    .filter((line) => /^\|\s*`\/[^`]+`/.test(line))
    .filter((line) => /\|\s*(Compatibility|Migration source)\s*\|/.test(line));

  assert.ok(
    routeRows.length > 0,
    'migration plan should include compatibility and migration-source rows',
  );

  for (const row of routeRows) {
    const routeCell = row.split('|')[1] ?? '';
    const routes = [...routeCell.matchAll(/`(\/[^`]+)`/g)].map((match) => match[1]!);
    for (const route of routes) {
      if (route.includes('*')) continue;
      assert.ok(
        legacyRoutes.has(route),
        `${route} should be classified as a legacy route because plan row is ${row}`,
      );
    }
  }
});

test('every web route page is classified for primary runtime legacy support or internal use', () => {
  const classifiedRoutes = new Set<string>(
    Object.values(NEW_LOOM_ROUTE_CLASSIFICATION).flatMap((routes) => [...routes]),
  );
  const unclassified = listPageRoutes().filter((route) => {
    if (classifiedRoutes.has(route)) return false;
    return !NEW_LOOM_INTERNAL_ROUTE_PREFIXES.some(
      (prefix) => route === prefix || route.startsWith(`${prefix}/`),
    );
  });

  assert.deepEqual(unclassified, []);
});

test('/knowledge is classified as a Sources compatibility alias, not a primary product route', () => {
  const knowledgePage = read('app/knowledge/page.tsx');
  const plan = read('docs/projects/active/2026-05-09-legacy-surface-migration-plan.md');
  const primaryRoutes = new Set<string>(NEW_LOOM_PRIMARY_ROUTES);

  assert.ok(
    !primaryRoutes.has('/knowledge'),
    '/knowledge should not compete with /sources as a primary route',
  );
  assert.ok(
    NEW_LOOM_LEGACY_ROUTES.includes('/knowledge'),
    '/knowledge should remain available as a compatibility alias',
  );
  assert.match(knowledgePage, /redirect\('\/sources'\)/);
  assert.match(plan, /\| `\/knowledge` \| Compatibility \| Sources \| Redirect to `\/sources`/);
});

test('Sources reader notes block anchors reader-note redirects', () => {
  const sourceIndex = read('app/knowledge/KnowledgeHomeStatic.tsx');

  assert.match(
    sourceIndex,
    /<SourceBlock id="reader-notes" title="Reader notes" empty="No reader notes yet\.">/,
  );
  assert.match(sourceIndex, /id\?: string/);
  assert.match(sourceIndex, /<section id=\{id\} className="loom-source-block">/);
  assert.match(sourceIndex, /New group/);
  assert.match(sourceIndex, /Move this source group/);
  assert.match(sourceIndex, /function sourceStateTags/);
  assert.match(sourceIndex, /Has draft/);
});

test('source document fallback uses Sources instead of Desk-era breadcrumbs', () => {
  const docClient = read('app/DocClient.tsx');
  const plan = read('docs/projects/active/2026-05-09-legacy-surface-migration-plan.md');

  assert.match(docClient, /import \{ ArrowRight \} from 'lucide-react'/);
  assert.match(docClient, /Open Sources\s*<ArrowRight className="loom-empty-state-action-icon"/);
  assert.match(docClient, /<Link href="\/sources" className="loom-empty-state-action">/);
  assert.match(docClient, /<Link href="\/sources">Sources<\/Link>/);
  assert.doesNotMatch(docClient, />\s*Organize\s*<\/Link>|>\s*Collect\s*<\/Link>/);
  assert.doesNotMatch(
    docClient,
    /href="\/desk"|href="\/uploads"|href="\/collect"|>Desk<\/Link>|>Intake<\/Link>|Open Organize →/,
  );
  assert.match(plan, /\/doc` source reader fallback uses Sources breadcrumbs/);
});

test('active detail fallbacks do not link back to retired writing routes', () => {
  const sampleSources = [read('app/PanelDetailClient.tsx')].join('\n');

  assert.match(sampleSources, /href="\/sources#reader-notes"/);
  assert.doesNotMatch(
    sampleSources,
    /href="\/patterns"|href="\/workbench"|Patterns →|Open Patterns|Workbench →/,
  );
});

test('panel and component reader-note links point at Sources, not legacy routes', () => {
  const reviewThoughtMap = read('components/ReviewThoughtMap.tsx');
  const refreshCoach = read('components/RefreshCoach.tsx');
  const liveArtifact = read('components/LiveArtifact.tsx');

  assert.doesNotMatch(
    reviewThoughtMap,
    /router\.push\([^)]*\/patterns|router\.push\([^)]*\/weaves|window\.location\.assign\(`\/weaves/,
  );
  assert.doesNotMatch(
    refreshCoach,
    /router\.push\([^)]*\/patterns|Open panel in Patterns|re-finalized in your patterns/,
  );
  assert.doesNotMatch(
    liveArtifact,
    /router\.push\([^)]*\/patterns|router\.push\([^)]*\/weaves|Settled into Patterns|Open this panel in Patterns|finalized in Patterns|Crystallize this panel into your Patterns/,
  );
  assert.match(reviewThoughtMap, /\/sources#reader-notes/);
  assert.match(refreshCoach, /\/sources#reader-notes/);
  assert.match(liveArtifact, /\/sources#reader-notes/);
  assert.match(read('macos-app/Loom/Sources/Workspace/Navigation/ShuttleView.swift'), /userInfo: \["path": "\/sources#reader-notes"\]/);
  assert.doesNotMatch(read('macos-app/Loom/Sources/Workspace/Navigation/ShuttleView.swift'), /\/weaves\?weaveId/);
});

test('learning-target relation work enters Reader notes instead of legacy Graph', () => {
  const learningTargets = read('lib/learning-targets.ts');

  assert.doesNotMatch(learningTargets, /\/graph\?focus=|Open graph/);
  assert.match(learningTargets, /href: '\/sources#reader-notes'/);
  assert.match(learningTargets, /target\.kind === 'weave' \? 'Open reader notes' : 'Open source'/);
  assert.doesNotMatch(learningTargets, /router\.push\(`\/graph/);
});

test('support and detail fallback routes share the global Loom navigation', () => {
  const docClient = read('app/DocClient.tsx');
  const panelPage = read('app/panel/page.tsx');
  const panelDetail = read('app/PanelDetailClient.tsx');
  const globals = read('app/globals.css');

  assert.match(docClient, /LoomGlobalNav/);
  assert.match(docClient, /ariaLabel="Source document navigation"/);
  assert.match(panelPage, /metadata = \{ title: 'Reader note · Loom' \}/);
  assert.match(panelPage, /<PanelPageClient \/>/);
  assert.match(panelPage, /import PanelPageClient from '\.\/PanelPageClient'/);
  assert.match(panelDetail, /LoomGlobalNav/);
  assert.match(panelDetail, /ariaLabel="Reader note navigation"/);
  assert.match(panelDetail, /<div className="loom-panel-detail-back">/);
  assert.doesNotMatch(panelDetail, /<nav className="loom-panel-detail-back">/);
  assert.doesNotMatch(panelDetail, /#9E7C3E/);
  assert.match(globals, /\.loom-panel-detail\s*\{[\s\S]*padding-top:\s*5rem/);
  assert.match(globals, /@media \(max-width:\s*760px\)\s*\{[\s\S]*\.loom-panel-detail\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(globals, /\.loom-panel-detail-title\s*\{[\s\S]*overflow-wrap:\s*anywhere/);
});

test('native Data settings labels old storage buckets with new Loom vocabulary', () => {
  const dataSettings = read('macos-app/Loom/Sources/App/Settings/DataSettingsView.swift');
  const dataRows = read('macos-app/Loom/Sources/App/Settings/DataSettingsRows.swift');
  const visibleSources = [dataSettings, dataRows].join('\n');

  for (const retired of [
    /label: "Pursuits"/,
    /label: "Panels"/,
    /label: "Sōan"/,
    /label: "Weaves"/,
    /emptyCopy: "No pursuits/,
    /emptyCopy: "No reading panels/,
    /emptyCopy: "No Sōan/,
    /emptyCopy: "No weaves/,
    /return "pursuit"/,
    /return "panel"/,
    /return "Sōan card"/,
    /return "weave"/,
  ]) {
    assert.doesNotMatch(visibleSources, retired);
  }

  assert.match(dataSettings, /label: "Questions"/);
  assert.match(dataSettings, /emptyCopy: "No questions saved yet\."/);
  assert.match(dataSettings, /label: "Reader notes"/);
  assert.match(dataSettings, /emptyCopy: "No reader notes saved yet\."/);
  assert.match(dataSettings, /label: "Draft cards"/);
  assert.match(dataSettings, /emptyCopy: "No draft cards yet\."/);
  assert.match(dataSettings, /label: "Note connections"/);
  assert.match(dataSettings, /emptyCopy: "No note connections yet\."/);
  assert.match(dataSettings, /noteConnectionKindLabel\(w\.kind\)/);
  assert.match(dataSettings, /case "supports": return "Supports"/);
  assert.match(dataSettings, /case "contradicts": return "Contradicts"/);
  assert.match(dataSettings, /case "elaborates": return "Adds detail"/);
  assert.match(dataSettings, /case "echoes": return "Related"/);
  assert.doesNotMatch(dataSettings, /return "\\\(w\.kind\):/);

  assert.match(dataRows, /case \.pursuit: return "question"/);
  assert.match(dataRows, /case \.panel:\s+return "reader note"/);
  assert.match(dataRows, /case \.soan:\s+return "draft card"/);
  assert.match(dataRows, /case \.weave:\s+return "note connection"/);
});

test('native fragment destination picker uses new Loom vocabulary', () => {
  const picker = read('macos-app/Loom/Sources/Workspace/Capture/Ingest/FragmentDestinationPicker.swift');
  const schemaView = read('macos-app/Loom/Sources/Workspace/Capture/Ingest/FragmentSchemaView.swift');
  const ingestionView = read('macos-app/Loom/Sources/Workspace/Capture/IngestionView.swift');
  const visibleSources = [picker, schemaView, ingestionView].join('\n');

  for (const retired of [
    /sectionHeader\("Pursuits"/,
    /sectionHeader\("Panels"/,
    /No pursuits yet/,
    /\(untitled panel\)/,
    /Pick a Pursuit, a Panel/,
    /Attached to Pursuit/,
    /Attached to Panel/,
    /New Pursuit:/,
    /Panel \\\(id\\\) has no docId/,
    /"Panel \\\(id\\\)"/,
  ]) {
    assert.doesNotMatch(visibleSources, retired);
  }

  assert.match(picker, /sectionHeader\("Questions", count: pursuits\.count\)/);
  assert.match(picker, /Text\("No questions yet\. Start a new question below\."\)/);
  assert.match(picker, /sectionHeader\("Reader notes", count: panels\.count\)/);
  assert.match(picker, /Text\(row\.title\.isEmpty \? "\(untitled reader note\)" : row\.title\)/);
  assert.match(picker, /"Pick a question, a reader note, or start a new question\."/);

  assert.match(schemaView, /return "Attached to Question ·/);
  assert.match(schemaView, /return "Attached to Reader note ·/);
  assert.match(schemaView, /return "New question: \\?\(text\)"/);
  assert.ok(ingestionView.includes('"Reader note \\(id) has no source document; cannot attach."'));
  assert.ok(ingestionView.includes('panel.title.isEmpty ? "Reader note \\(id)" : panel.title'));
});

test('web product shell native bridge forwards capability actions instead of swallowing them', () => {
  const home = read('app/HomeClient.tsx');
  const productShell = read('lib/new-loom/product-shell.ts');
  const bridge = read('macos-app/Loom/Sources/Shared/Bridge/NavigationBridgeHandler.swift');

  // HomeClient is now a static profile surface with no callNativeBridge; it
  // still exposes each capability as a real link the native WebView can
  // intercept, so the bridge forwards (rather than swallows) the action.
  assert.match(home, /data-capability=/);
  assert.match(home, /href=\{capability\.href\}/);
  assert.doesNotMatch(productShell, /nativeAction:\s*'startCapture'/);
  assert.match(bridge, /case "navigate":\s*\n\s*handleNavigate\(body: payload\)/);
  assert.match(bridge, /case "startCapture":\s*\n\s*postProductNavigation\("\/sources"\)/);
  assert.match(bridge, /private func handleNavigate\(body: \[String: Any\]\)/);
  assert.match(bridge, /guard let href = body\["href"\] as\? String/);
  assert.match(bridge, /NotificationCenter\.default\.post\(\s*\n\s*name: \.loomShuttleNavigate/);
});

test('web Draft AI stream bridge audits provider body and routes Apple Foundation explicitly', () => {
  const streamBridgeHandler = read('macos-app/Loom/Sources/Shared/Bridge/AIStreamBridgeHandler.swift');

  assert.match(streamBridgeHandler, /LoomAIRequestAudit\.record\(/);
  assert.match(streamBridgeHandler, /surface:\s*"web-ai-stream"/);
  assert.match(streamBridgeHandler, /case \.appleFoundation:/);
  assert.match(streamBridgeHandler, /AppleFoundationClient\.send\(prompt: prompt, options: opts\)/);
  assert.doesNotMatch(
    streamBridgeHandler,
    /default:\s*[\s\S]{0,260}AnthropicClient\.send\(prompt: prompt, options: opts\)/,
  );
});

test('native SourceFileView wires the Compile button through LoomAI streaming and per-source writeback', () => {
  const sourceFileView = read('macos-app/Loom/Sources/Workspace/Reader/SourceFileView.swift');
  const swiftTests = read('macos-app/Loom/Tests/LoomDraftStoreTests.swift');
  const compilePlan = read('plans/compile-pipeline-mvp.md');

  assert.match(sourceFileView, /enum LoomCompilePipeline/);
  assert.match(sourceFileView, /@State private var compileDraft: String = ""/);
  assert.match(sourceFileView, /@State private var isCompiling: Bool = false/);
  assert.match(sourceFileView, /@State private var compileReplaceWarningPending: Bool = false/);
  assert.match(sourceFileView, /@State private var compilePulseDismissed: Bool = false/);
  assert.match(sourceFileView, /@State private var compilePulseActive: Bool = false/);
  assert.match(sourceFileView, /@State private var compileContextNotice: String\? = nil/);
  assert.match(sourceFileView, /private var compileActionPanel: some View/);
  assert.match(sourceFileView, /SourceFileView\.compilePreviewArtifact\(markdown: compileDraft\)/);
  assert.match(sourceFileView, /private var compilePreviewSummary: some View/);
  assert.match(sourceFileView, /struct CompilePreviewArtifact: Equatable/);
  assert.match(sourceFileView, /let notice: String\?/);
  assert.match(sourceFileView, /let unsupportedCount: Int/);
  assert.match(sourceFileView, /let contradictionCount: Int/);
  assert.match(sourceFileView, /let annotations: \[String\]/);
  assert.match(sourceFileView, /Unsupported claim/);
  assert.match(sourceFileView, /Contradictory thinking/);
  assert.match(sourceFileView, /user noted both/);
  assert.match(sourceFileView, /Output rendered without typesetting\./);
  assert.match(sourceFileView, /compilePreviewCleanInlineCode/);
  assert.match(sourceFileView, /compilePreviewCleanMarkdownLinks/);
  assert.match(sourceFileView, /compilePreviewCleanMarkdownEmphasis/);
  assert.match(sourceFileView, /compilePreviewCleanMarkdownListMarker/);
  assert.match(sourceFileView, /compilePreviewCleanMarkdownBlockquoteMarker/);
  assert.match(sourceFileView, /compilePreviewCleanMarkdownCodeFenceMarker/);
  assert.match(sourceFileView, /compilePreviewContradictionAnnotationBody/);
  assert.match(sourceFileView, /private var compileErrorBanner: some View/);
  assert.match(sourceFileView, /private var compileContextNoticeBanner: some View/);
  assert.match(sourceFileView, /private var compileFirstPulseDot: some View/);
  assert.match(sourceFileView, /SourceFileView\.compileSourceNotice\(sourceExcerpt:/);
  assert.match(sourceFileView, /Source file unavailable; compiled from notes only\./);
  assert.match(sourceFileView, /SourceFileView\.shouldShowFirstCompilePulse/);
  assert.match(sourceFileView, /compilePulseDismissed = true/);
  assert.match(sourceFileView, /\.repeatForever\(autoreverses: true\)/);
  // W0-A accent migration: the compile pulse is interactive chrome — it
  // follows the system accent, never the reserved anchor cyan.
  assert.match(sourceFileView, /Color\.accentColor/);
  assert.match(sourceFileView, /Button\("Compile"\)/);
  assert.match(sourceFileView, /\.disabled\(!hasCompilableScratch \|\| isCompiling\)/);
  assert.match(sourceFileView, /private func startCompile\(\)/);
  assert.match(sourceFileView, /SourceFileView\.hasCompiledSection\(file: displayName/);
  assert.match(sourceFileView, /!compileReplaceWarningPending/);
  assert.match(
    sourceFileView,
    /showToast\("Edits to the compiled section will be replaced\. Compile anyway\?"\)/,
  );
  assert.match(sourceFileView, /compileReplaceWarningPending = true/);
  assert.match(sourceFileView, /compileReplaceWarningPending = false/);
  assert.match(sourceFileView, /LoomAI\.sendStream\(\s*prompt: LoomCompilePipeline\.buildPrompt/);
  assert.match(sourceFileView, /var compileStreamDraft = ""/);
  assert.match(sourceFileView, /compileStreamDraft \+= chunk/);
  assert.match(sourceFileView, /compileDraft \+= chunk/);
  assert.match(sourceFileView, /SourceFileView\.upsertCompiledSection/);
  assert.match(sourceFileView, /partial:\s*true/);
  assert.match(sourceFileView, /Compile interrupted; partial output saved/);
  assert.match(sourceFileView, /SourceFileView\.compileErrorMessage\(error\)/);
  assert.match(
    sourceFileView,
    /AI provider rate-limited\. Try a different provider in Settings, or wait\./,
  );
  assert.match(sourceFileView, /### Compiled ·/);
  assert.match(sourceFileView, /showToast\("Compiled to/);

  assert.match(swiftTests, /testCompilePromptMirrorsScratchLanguageAndBoundsContext/);
  assert.match(swiftTests, /testCompileWritebackReplacesPerSourceCompiledSection/);
  assert.match(swiftTests, /testCompileDetectionIsScopedToSourceSection/);
  assert.match(swiftTests, /testCompileErrorMessageNormalizesRateLimitAndKeepsProviderSetupErrors/);
  assert.match(swiftTests, /testCompileFirstPulseRequiresFiftyWordsAndNoCompiledSection/);
  assert.match(swiftTests, /testCompileSourceNoticeOnlyAppearsWhenSourceUnavailable/);
  assert.match(swiftTests, /testCompilePreviewConsumesRevealMarkersAndSummarizesShape/);
  assert.match(swiftTests, /testCompilePreviewMalformedStructuredOutputFallsBackToPlainMarkdown/);
  assert.match(swiftTests, /testCompilePreviewTurnsUnsupportedMarkersIntoInlineAnnotations/);
  assert.match(compilePlan, /SourceFileView Compile UI\/native streaming is wired/);
});

