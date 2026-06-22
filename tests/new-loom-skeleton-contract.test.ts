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

function cssRulesContaining(css: string, selector: string) {
  const rules = css.match(/[^{}]+{[^{}]*}/g) ?? [];
  const matchingRules = rules.filter((rule) => rule.slice(0, rule.indexOf('{')).includes(selector));

  assert.ok(matchingRules.length > 0, `${selector} should have at least one CSS rule`);

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

test('new Loom web shell exposes the two primary workspaces', () => {
  const home = read('app/HomeClient.tsx');
  const productShell = read('lib/new-loom/product-shell.ts');

  for (const label of ['Sources', 'Draft']) {
    assert.match(productShell, new RegExp(`label:\\s*'${label}'`));
  }
  assert.doesNotMatch(productShell, /label:\s*'Collect'|label:\s*'Organize'/);
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

test('/collect is a compatibility alias into Sources', () => {
  const productShell = read('lib/new-loom/product-shell.ts');
  const primaryRoutes = new Set<string>(NEW_LOOM_PRIMARY_ROUTES);
  const collectPage = read('app/collect/page.tsx');
  const collectionPage = read('app/collection/page.tsx');

  assert.ok(
    fs.existsSync(path.join(repoRoot, 'app/collect/page.tsx')),
    'app/collect/page.tsx should remain as a compatibility route',
  );
  assert.equal(
    fs.existsSync(path.join(repoRoot, 'app/collect/page 2.tsx')),
    false,
    'stale duplicate Collect pages should not keep the old three-surface product model alive',
  );
  assert.equal(
    fs.existsSync(path.join(repoRoot, 'app/help/page 2.tsx')),
    false,
    'ignored numbered page copies should not preserve stale IA evidence or old product copy',
  );
  assert.doesNotMatch(productShell, /id:\s*'collect'[\s\S]{0,180}href:\s*'\/collect'/);
  assert.match(collectPage, /redirect\('\/sources'\)/);
  assert.match(collectionPage, /redirect\('\/sources'\)/);
  assert.doesNotMatch(collectionPage, /CollectionClient|CollectionPage/);
  assert.ok(primaryRoutes.has('/sources'), '/sources should be the primary source workspace');
  assert.ok(!primaryRoutes.has('/collect'), '/collect should not be a primary route');
  assert.ok(!primaryRoutes.has('/collection'), '/collection should not be a primary route');
  assert.ok(NEW_LOOM_LEGACY_ROUTES.includes('/collect'), '/collect should remain classified as legacy compatibility');
  assert.ok(
    NEW_LOOM_LEGACY_ROUTES.includes('/collection'),
    '/collection should remain classified as legacy compatibility',
  );
});

test('product bundle does not keep Finder-numbered duplicate artifacts', () => {
  const numberedDuplicateArtifacts = [
    'app/collect/page 2.tsx',
    'app/help/page 2.tsx',
    '.loom-typecheck.tsconfig 2.json',
    'macos-app/Loom/Info 2.plist',
    'scripts/build-install-loom-app 2.mjs',
    'public/brand/loom_app_icon 2.svg',
    'public/icon 2.svg',
    'public/icon-mono 2.svg',
  ];

  for (const artifact of numberedDuplicateArtifacts) {
    assert.equal(
      fs.existsSync(path.join(repoRoot, artifact)),
      false,
      `${artifact} should not remain in the product tree; keep the canonical file and remove Finder-numbered copies`,
    );
  }

  const numberedDynamicRouteCopies: string[] = [];
  const visit = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);

      if (!entry.isDirectory()) continue;

      if (/\[[^\]]+\] \d+$/.test(entry.name)) {
        numberedDynamicRouteCopies.push(path.relative(repoRoot, fullPath));
      }

      visit(fullPath);
    }
  };

  visit(path.join(repoRoot, 'app'));

  assert.deepEqual(
    numberedDynamicRouteCopies,
    [],
    'dynamic app routes should not keep Finder-numbered copies such as [problemSet] 2',
  );
});

test('retired cover and frontispiece clients are removed after routes redirect to Sources', () => {
  const globals = read('app/globals.css');
  const legacyRoutes = new Set<string>(NEW_LOOM_LEGACY_ROUTES);
  const internalRoutes = new Set<string>(NEW_LOOM_INTERNAL_ROUTES);

  assert.ok(legacyRoutes.has('/cover'), '/cover should be a legacy compatibility route');
  assert.ok(
    legacyRoutes.has('/frontispiece'),
    '/frontispiece should be a legacy compatibility route',
  );
  assert.ok(!internalRoutes.has('/cover'), '/cover should not remain an internal sample route');
  assert.ok(
    !internalRoutes.has('/frontispiece'),
    '/frontispiece should not remain an internal sample route',
  );
  assert.equal(
    fs.existsSync(path.join(repoRoot, 'app/CoverClient.tsx')),
    false,
    'the old source cover page client should not stay in the product tree',
  );
  assert.equal(
    fs.existsSync(path.join(repoRoot, 'components/CoverPlate.tsx')),
    false,
    'the retired Cover plate component should not stay in the product tree',
  );
  assert.equal(
    fs.existsSync(path.join(repoRoot, 'app/FrontispieceClient.tsx')),
    false,
    'the old product identity page client should not stay in the product tree',
  );
  assert.doesNotMatch(globals, /\.loom-cover/);
  assert.doesNotMatch(globals, /\.loom-frontispiece/);
  assert.doesNotMatch(globals, /second voice/);
});

test('retired View preset experiment is removed from the new Loom product tree', () => {
  const retiredViewFiles = [
    'lib/view/index.ts',
    'lib/view/types.ts',
    'lib/view/presets.ts',
    'lib/view/render.ts',
    'lib/view/filters.ts',
  ];
  const noteStore = read('lib/note/store.ts');
  const bucketLib = read('scripts/bucket-lib.mjs');

  for (const file of retiredViewFiles) {
    assert.equal(
      fs.existsSync(path.join(repoRoot, file)),
      false,
      `${file} should not keep the old Questioning/Producing/Examiner preset model alive`,
    );
  }

  assert.doesNotMatch(noteStore, /appendRehearsal|loom-rehearsal-root|RehearsalPanel/);
  assert.doesNotMatch(bucketLib, /lib\/view/);
});

test('learning status copy uses literal reader note language', () => {
  const statusInline = read('components/LearningStatusInline.tsx');
  const refreshCoach = read('components/RefreshCoach.tsx');
  const learningTargets = read('lib/learning-targets.ts');
  const visibleCopySources = [statusInline, refreshCoach, learningTargets].join('\n');

  for (const retired of [
    /Woven/,
    /Asked/,
    /Marked/,
    /warm the panel/,
    /deepen the understanding/,
    /Panel is contested/,
    /Panel has gone cold/,
    /Panel is ready to verify/,
    /Panel should be reviewed/,
    /Keep this panel warm/,
    /case 'examine': return 'Ask'/,
  ]) {
    assert.doesNotMatch(visibleCopySources, retired);
  }

  assert.match(statusInline, /Noted/);
  assert.match(statusInline, /Reviewed/);
  assert.match(statusInline, /Current/);
  assert.match(refreshCoach, /Open reader notes and update the source context/);
  assert.match(learningTargets, /Reader note is ready to review/);
});

test('Sources owns capture handoff instead of a separate Collect surface', () => {
  const page = read('app/collect/page.tsx');
  const library = read('macos-app/Loom/Sources/LoomLibraryView.swift');

  assert.match(page, /redirect\('\/sources'\)/);
  assert.doesNotMatch(page, /['"]\/loom-render\/captures['"]/);
  assert.match(library, /WorkColumn\(title: "Incoming material"\)/);
  assert.match(library, /WorkGroup\(title: "Recent captures"/);
  assert.match(library, /\.onReceive\(NotificationCenter\.default\.publisher\(for: \.loomSourcesAddFiles\)\)/);
  assert.match(library, /private func pickFilesForIngestion\(\)/);
});

test('native Draft inspector is a writing tool with separate context', () => {
  const draftView = read('macos-app/Loom/Sources/LoomDraftView.swift');

  assert.match(draftView, /case context = "Sources"/);
  assert.match(draftView, /case edit = "Edit"/);
  assert.match(draftView, /case board = "Board"/);
  assert.doesNotMatch(draftView, /case write = "Write"|case sources = "Sources"/);
  assert.match(draftView, /@State private var inspectorMode: LoomDraftInspectorMode = \.context/);
  assert.match(draftView, /case \.context:\s*draftNextActionPanel[\s\S]{0,160}draftContextPanel/);
  assert.match(draftView, /case \.edit:\s*inlineEditInspectorPanel[\s\S]{0,180}draftStructurePanel/);
  assert.match(draftView, /private var draftInlineEditNeedsAttention: Bool/);
  assert.match(draftView, /private let draftDocumentMeasureWidth: CGFloat = 820/);
});

test('Sources absorbs legacy file intake before uploads becomes a compatibility route', () => {
  const uploadsPage = read('app/uploads/page.tsx');
  const globals = read('app/globals.css');
  const nativeSources = read('macos-app/Loom/Sources/LoomLibraryView.swift');
  const plan = read('docs/projects/active/2026-05-09-legacy-surface-migration-plan.md');

  assert.equal(
    fs.existsSync(path.join(repoRoot, 'app/uploads/UploadButton.tsx')),
    false,
    'legacy UploadButton should be removed once Sources owns file intake',
  );
  assert.equal(
    fs.existsSync(path.join(repoRoot, 'app/collect/CollectClient.tsx')),
    false,
    'legacy CollectClient should be removed once /collect redirects to Sources',
  );
  assert.equal(
    fs.existsSync(path.join(repoRoot, 'app/uploads/UploadsClient.tsx')),
    false,
    'legacy UploadsClient fallback should be removed once /uploads redirects to Sources',
  );
  assert.doesNotMatch(globals, /\.loom-uploads\b/);

  assert.match(nativeSources, /private func pickFilesForIngestion\(\)/);
  assert.match(nativeSources, /panel\.prompt = "Add files"/);
  assert.match(nativeSources, /name: \.loomShowInspectorTab/);
  assert.match(nativeSources, /userInfo: \["surface": "ingestion"\]/);

  assert.match(uploadsPage, /import \{ redirect \} from 'next\/navigation'/);
  assert.match(uploadsPage, /redirect\('\/sources'\)/);
  assert.doesNotMatch(uploadsPage, /UploadsClient|knowledgeUploadRoot|resolveContentRoot/);
  assert.match(plan, /\| `\/uploads` \| Compatibility \| Sources \| Redirect to `\/sources`/);
});

test('native Sources Add files opens a local-file importer instead of a static ingestion shortcut', () => {
  const nativeSources = read('macos-app/Loom/Sources/LoomLibraryView.swift');
  const ingestionView = read('macos-app/Loom/Sources/IngestionView.swift');

  assert.match(nativeSources, /private func pickFilesForIngestion\(\)/);
  assert.match(nativeSources, /let panel = NSOpenPanel\(\)/);
  assert.match(nativeSources, /panel\.allowsMultipleSelection = true/);
  assert.match(nativeSources, /panel\.allowedContentTypes = nativeFileImporterContentTypes\(\)/);
  assert.match(nativeSources, /IngestionContext\.shared\.pendingFileURLs = panel\.urls/);
  assert.match(nativeSources, /NotificationCenter\.default\.post\(name: \.loomIngestFileDropped/);
  assert.match(
    nativeSources,
    /NotificationCenter\.default\.post\([\s\S]*name: \.loomShowInspectorTab[\s\S]*userInfo: \["surface": "ingestion"\]/,
  );
  assert.doesNotMatch(
    nativeSources,
    /Button \{\s*NotificationCenter\.default\.post\([\s\S]*name: \.loomShowInspectorTab[\s\S]*\)\s*\} label: \{\s*Label\("Add files"/,
  );

  assert.match(ingestionView, /func nativeFileImporterContentTypes\(\) -> \[UTType\]/);
  assert.match(ingestionView, /UTType\(filenameExtension: "pptx"\)/);
  assert.match(ingestionView, /UTType\.image/);
  assert.match(ingestionView, /panel\.allowedContentTypes = nativeFileImporterContentTypes\(\)/);
});

test('native Sources drag-to-import works from the main Loom window', () => {
  const contentView = read('macos-app/Loom/Sources/ContentView.swift');
  const loomApp = read('macos-app/Loom/Sources/LoomApp.swift');
  const ingestionView = read('macos-app/Loom/Sources/IngestionView.swift');
  const keyboardHelp = read('macos-app/Loom/Sources/KeyboardHelpView.swift');
  const loomDoc = read('docs/loom.md');

  assert.match(
    contentView,
    /private func handleDroppedFileURLs\(_ providers: \[NSItemProvider\]\) -> Bool/,
  );
  assert.match(
    contentView,
    /\.onDrop\(of: \[\.fileURL\], isTargeted: nil, perform: handleDroppedFileURLs\)/,
  );
  assert.match(contentView, /IngestionContext\.shared\.pendingFileURLs = urls/);
  assert.match(contentView, /NotificationCenter\.default\.post\(name: \.loomIngestFileDropped/);
  assert.doesNotMatch(contentView, /Plain text only/);

  assert.match(loomApp, /Window\("Add files", id: IngestionWindow\.id\)/);
  assert.match(
    loomApp,
    /\.onReceive\(NotificationCenter\.default\.publisher\(for: \.loomIngestFileDropped\)\) \{ _ in\s*openWindow\(id: IngestionWindow\.id\)/,
  );

  assert.match(ingestionView, /\.onAppear \{[\s\S]{0,120}IngestionContext\.shared\.consume\(\)/);
  assert.match(
    ingestionView,
    /\.onReceive\(NotificationCenter\.default\.publisher\(for: \.loomIngestFileDropped\)\) \{ _ in[\s\S]{0,140}IngestionContext\.shared\.consume\(\)/,
  );
  assert.match(
    ingestionView,
    /Text\(isDragging \? "Drop to read" : "Drop Markdown, PDF, DOCX, slides, Pages, or images"\)/,
  );
  assert.match(
    ingestionView,
    /PDFKit extracts PDF · PPTX\/Keynote\/Pages preserve metadata and text · images keep OCR, semantic labels, and visual provenance/,
  );
  assert.match(ingestionView, /func nativeFileImporterContentTypes\(\) -> \[UTType\]/);
  assert.match(ingestionView, /UTType\.image/);
  assert.match(ingestionView, /UTType\(filenameExtension: "pptx"\)/);
  assert.match(
    ingestionView,
    /"md", "mdx", "markdown", "docx", "doc", "rtfd", "ppt", "key", "pages"/,
  );

  assert.match(keyboardHelp, /Drop files into Sources/);
  assert.match(keyboardHelp, /Add files — drop or pick PDFs, DOCX, slides, Pages, Markdown, and images/);
  assert.doesNotMatch(
    keyboardHelp,
    /Drag-drop \.md\/\.txt files|Ingestion — drop files for AI summary/,
  );

  assert.match(loomDoc, /Drag-to-import[\s\S]{0,220}main Loom window/);
});

test('Sources recent captures expose a visible Delete control', () => {
  const sourceIndex = read('macos-app/Loom/Sources/LoomLibraryView.swift');

  assert.match(sourceIndex, /destructiveLabel: publicWorkingMode \? nil : "Delete"/);
  assert.match(
    sourceIndex,
    /destructiveHelp: publicWorkingMode \? nil : "Delete this capture from Loom\.md"/,
  );
  assert.match(sourceIndex, /Label\(destructiveLabel, systemImage: "trash"\)/);
  assert.match(
    sourceIndex,
    /VStack\(alignment: \.leading, spacing: 5\) \{[\s\S]{0,420}primaryButton[\s\S]{0,320}actionControls[\s\S]{0,120}\.padding\(\.leading, actionIndent\)/,
    'capture rows must render Draft and Delete in a stable second-row action tray instead of hiding destructive controls at the trailing edge',
  );
  assert.match(sourceIndex, /private var actionIndent: CGFloat/);
  assert.doesNotMatch(
    sourceIndex,
    /if let destructiveLabel, let destructiveAction \{[\s\S]{0,260}Image\(systemName: "trash"\)[\s\S]{0,220}\.frame\(width: 23, height: 20\)/,
  );
});

test('Draft attached references expose visible remove controls', () => {
  const draftView = read('macos-app/Loom/Sources/LoomDraftView.swift');

  assert.match(draftView, /private func removeReference\(_ reference: LoomDraftReference\)/);
  assert.match(draftView, /compactIconButton\([\s\S]{0,120}systemName: "trash"[\s\S]{0,180}label: "Remove source tile: \\\(tile\.label\)"/);
  assert.doesNotMatch(draftView, /label: "Remove reference: \\\(reference\.label\)"/);
  assert.match(draftView, /\.accessibilityLabel\(Text\(label\)\)/);
});

test('native ingestion persists local origin metadata for imported files', () => {
  const ingestionView = read('macos-app/Loom/Sources/IngestionView.swift');

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
  const ingestionView = read('macos-app/Loom/Sources/IngestionView.swift');
  const slideDeckExtractor = read('macos-app/Loom/Sources/Ingest/SlideDeckExtractor.swift');
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
  const ingestionView = read('macos-app/Loom/Sources/IngestionView.swift');
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
  const ingestionView = read('macos-app/Loom/Sources/IngestionView.swift');
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
  const pdfExtraction = read('macos-app/Loom/Sources/Ingest/PDFExtraction.swift');
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
  const slideDeckExtractor = read('macos-app/Loom/Sources/Ingest/SlideDeckExtractor.swift');
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

test('new Loom native root exposes Sources and Draft as first-level destinations', () => {
  const source = read('macos-app/Loom/Sources/LoomMinimalRootView.swift');

  assert.match(source, /case sources/);
  assert.match(source, /case draft/);
  assert.doesNotMatch(source, /case collect|case organize/);

  for (const label of ['Sources', 'Draft']) {
    assert.match(source, new RegExp(`title:\\s*"${label}"`));
  }

  assert.doesNotMatch(source, /sectionEyebrow\("Workspaces"/);
  assert.doesNotMatch(source, /title:\s*"Sources"[\s\S]{0,220}rowID:\s*"__pages"/);
  assert.doesNotMatch(source, /title:\s*"Captures"[\s\S]{0,220}rowID:\s*"__captures"/);
  assert.doesNotMatch(source, /title:\s*"Web Capture"[\s\S]{0,220}rowID:\s*"__webcapture"/);
});

test('native primary surfaces share one root toolbar instead of separate pane chrome', () => {
  const minimalRoot = read('macos-app/Loom/Sources/LoomMinimalRootView.swift');

  assert.match(minimalRoot, /private let rootToolbarHeight: CGFloat = 28/);
  assert.match(
    minimalRoot,
    /private var rootToolbarClearance: CGFloat \{\s*rootToolbarHeight\s*\}/,
    'Sources and Draft must share one compact root-owned toolbar instead of pane-specific titlebar offsets',
  );
  assert.doesNotMatch(minimalRoot, /minimalDetailToolbarHeight|minimalSidebarToolbarHeight/);
  assert.doesNotMatch(minimalRoot, /minimalDefaultDetailToolbarClearance|minimalDraftDetailToolbarClearance/);
  assert.doesNotMatch(minimalRoot, /selection == \.draft \? minimalDraftDetailToolbarClearance/);
  assert.doesNotMatch(minimalRoot, /mainWindowIsFullScreen|MinimalWindowFullScreenObserver/);
  assert.doesNotMatch(
    minimalRoot,
    /\.toolbar\s*\{/,
    'minimal mode should not use the system toolbar for Draft chrome because it creates a second top band beside the sidebar',
  );
  assert.doesNotMatch(
    minimalRoot,
    /ToolbarItem/,
    'minimal mode should render navigation, title, capture, and source actions in-window instead of through macOS toolbar slots',
  );
  assert.match(minimalRoot, /HStack\(spacing: 0\)\s*\{/);
  assert.match(minimalRoot, /sidebar[\s\S]{0,420}rootSplitHairline[\s\S]{0,160}VStack\(spacing: 0\)\s*\{/);
  assert.match(minimalRoot, /VStack\(spacing: 0\)\s*\{[\s\S]{0,160}rootChrome[\s\S]{0,140}rootToolbarHairline[\s\S]{0,160}detailContent/);
  assert.match(
    minimalRoot,
    /private var surfaceChromeActions: some View/,
    'the shared toolbar should own page-specific actions instead of leaving a blank chrome band above each page',
  );
  assert.match(
    minimalRoot,
    /case \.sources, \.webCaptureSetup:[\s\S]{0,260}NotificationCenter\.default\.post\(name: \.loomSourcesAddFiles/,
    'Sources should put Add files in the shared toolbar while the surface keeps the file importer implementation',
  );
  assert.match(
    minimalRoot,
    /case \.sources, \.webCaptureSetup:[\s\S]{0,1200}NotificationCenter\.default\.post\(name: \.loomShowHoldQuestionDialog/,
    'Sources should put Add Question in the shared toolbar instead of burying the primary action in a card',
  );
  assert.match(
    minimalRoot,
    /case \.draft:[\s\S]{0,220}title: "Add source"[\s\S]{0,360}\.loomDraftShowReferencePicker[\s\S]{0,520}\.loomDraftContinueWithAI[\s\S]{0,520}\.loomDraftSave/,
    'Draft should expose Add source, Continue, and Save in the shared toolbar',
  );
  assert.doesNotMatch(
    minimalRoot,
    /case \.draft:[\s\S]{0,360}title: "Reference"/,
    'Draft chrome should use a direct Add source action instead of the abstract Reference label',
  );
  assert.match(
    minimalRoot,
    /WindowConfigurator\(title: "Loom", isNight: usesNightPalette, contentExtendsUnderTitlebar: true, removesSystemToolbar: true\)/,
    'minimal mode keeps a transparent full-size window but must reserve compact in-window chrome above Draft content',
  );
  assert.match(
    minimalRoot,
    /\.ignoresSafeArea\(\.container, edges: \.top\)[\s\S]{0,360}\.background\(rootCanvasBackground\.ignoresSafeArea\(\)\)/,
    'the split shell itself must enter the full-size titlebar; otherwise macOS adds a hidden safe-area band above Sources and Draft',
  );
  assert.match(
    minimalRoot,
    /private var detailContent: some View/,
    'raw destination switching should stay separate from the in-window chrome wrapper',
  );
  assert.match(
    minimalRoot,
    /case \.draft:\s*primarySurfaceSlot \{\s*LoomDraftView\(\)\s*\}\s*case \.folderHome/,
    'Draft should mount in the same shell-owned post-chrome primary surface slot as Sources',
  );
  assert.doesNotMatch(
    minimalRoot,
    /case \.draft:\s*LoomDraftView\(\)\s*\.padding\(\.top, minimalDetailTopClearance\)/,
    'Draft must not add a second page-level top clearance after the shared detail chrome already reserved it',
  );
});

test('Sources and Draft align to the same primary surface rhythm', () => {
  const minimalRoot = read('macos-app/Loom/Sources/LoomMinimalRootView.swift');
  const captureSetup = read('macos-app/Loom/Sources/CapturesView.swift');
  const library = read('macos-app/Loom/Sources/LoomLibraryView.swift');
  const draft = read('macos-app/Loom/Sources/LoomDraftView.swift');

  assert.match(
    minimalRoot,
    /private let primarySurfaceTopInset: CGFloat = 8/,
    'the app shell should own one compact body-start inset so Sources and Draft cannot drift independently or create a blank band under the toolbar',
  );
  assert.match(
    minimalRoot,
    /private func primarySurfaceSlot<Content: View>\(@ViewBuilder content: \(\) -> Content\) -> some View/,
    'primary pages should mount through one shell-owned slot instead of carrying page-local top clearance',
  );
  assert.match(
    minimalRoot,
    /private func sidebarSurfaceSlot<Content: View>\(@ViewBuilder content: \(\) -> Content\) -> some View/,
    'the sidebar should use the same root-owned body rhythm instead of a separate toolbar spacer',
  );
  assert.match(
    minimalRoot,
    /private let sidebarTopInset: CGFloat = rootToolbarHeight \+ primarySurfaceTopInset/,
    'the sidebar should clear the same compact toolbar height without inheriting the detail toolbar as a visible sidebar band',
  );
  assert.match(
    minimalRoot,
    /case \.sources:\s*primarySurfaceSlot \{\s*LoomLibraryView\(publicWorkingMode: publicWorkingMode\)\s*\}/,
    'Sources should mount inside the shared primary surface slot',
  );
  assert.match(
    minimalRoot,
    /case \.draft:\s*primarySurfaceSlot \{\s*LoomDraftView\(\)\s*\}/,
    'Draft should mount inside the shared primary surface slot',
  );
  assert.doesNotMatch(
    minimalRoot,
    /case \.(sources|draft):[\s\S]{0,260}\.padding\(\.top, 20\)/,
    'primary page routing must not add ad hoc top padding per destination',
  );

  assert.doesNotMatch(
    captureSetup,
    /struct WebCaptureSetupView[\s\S]*?\.padding\(\.top, 20\)[\s\S]*?\.padding\(\.bottom, 28\)/,
    'legacy capture setup should not own the top body-start inset; the root primary surface slot owns it',
  );
  assert.match(
    captureSetup,
    /struct WebCaptureSetupView[\s\S]*?toolColumnDivider[\s\S]*?HStack\(alignment: \.top, spacing: 0\)[\s\S]*?fileIntakeCard[\s\S]*?extensionInstallCard[\s\S]*?installCard[\s\S]*?toolColumnDivider[\s\S]*?captureFlowCard/,
    'capture setup should lay capture tools out as one continuous product workbench with a primary tool lane and inspector status lane',
  );
  assert.doesNotMatch(
    captureSetup,
    /LazyVGrid\(columns: setupGridColumns/,
    'capture setup should not present setup as a grid of independent cards on the desktop',
  );
  assert.doesNotMatch(
    captureSetup,
    /\.frame\(maxWidth: 720, alignment: \.topLeading\)/,
    'capture setup should not constrain the whole app surface to a narrow 720pt document column',
  );
  assert.match(
    captureSetup,
    /struct WebCaptureSetupView[\s\S]*?\.padding\(\.bottom, 28\)/,
    'capture setup should keep its bottom breathing room while root owns the top rhythm',
  );
  assert.doesNotMatch(
    library,
    /LazyVGrid\(columns:/,
    'Sources should not spread work queues as adaptive dashboard cards across the desktop',
  );
  assert.match(
    library,
    /WorkColumn\(title: "Incoming material"\)[\s\S]*WorkColumn\(title: "Read \/ review"\)[\s\S]*WorkColumn\(title: "Draft queue"\)/,
    'Sources should group work into stable product lanes instead of many independent cards',
  );
  assert.doesNotMatch(
    library,
    /struct LoomLibraryView[\s\S]*?\.padding\(\.top, 20\)/,
    'Sources should not own the top body-start inset; the root primary surface slot owns it',
  );
  assert.match(
    library,
    /\.padding\(\.horizontal, 28\)[\s\S]{0,220}\.frame\(maxWidth: \.infinity, alignment: \.topLeading\)/,
    'Sources should align to the same left-reading edge as Draft instead of floating centered in the detail pane',
  );
  assert.doesNotMatch(
    library,
    /\.frame\(maxWidth: 960, alignment: \.leading\)/,
    'Sources should not use the old narrow dashboard width that leaves half the window blank',
  );
  assert.doesNotMatch(
    library,
    /Text\("Organize Work Surface"\)/,
    'Sources should not repeat page-mode eyebrow copy below the toolbar; the root chrome already owns page context and actions',
  );
  assert.match(
    library,
    /Text\("Sources"\)/,
    'Sources should use the canonical product name instead of the old Source Index surface title',
  );
  assert.doesNotMatch(
    library,
    /Text\("Source Index"\)|sourceIndexSurfaceName|Organize Work Surface/,
    'the installed Sources page should not render the old Collect/Organize-era page title or eyebrow',
  );
  assert.doesNotMatch(
    library,
    /\.frame\(maxWidth: \.infinity, alignment: \.center\)/,
    'Sources must not center the whole workbench because it makes the shell feel unrelated to Draft',
  );
  const sourceMetricStart = library.indexOf('private struct SourceMetric');
  const workColumnStart = library.indexOf('private struct WorkColumn');
  const captureMetadataStart = library.indexOf('private struct CaptureMetadataState', workColumnStart);
  assert.ok(sourceMetricStart >= 0 && workColumnStart > sourceMetricStart, 'SourceMetric must be bounded before WorkColumn');
  assert.ok(captureMetadataStart > workColumnStart, 'WorkColumn must be bounded before following structs');
  assert.doesNotMatch(
    library.slice(sourceMetricStart, workColumnStart),
    /RoundedRectangle/,
    'Sources metrics should read as a compact status strip, not dashboard cards',
  );
  assert.doesNotMatch(
    library.slice(workColumnStart, captureMetadataStart),
    /RoundedRectangle/,
    'Sources queues should read as product lists, not separate rounded cards spread across the canvas',
  );
  assert.doesNotMatch(
    draft,
    /\.padding\(\.horizontal, DSSpace\.lg\.value\)[\s\S]{0,80}\.padding\(\.bottom, DSSpace\.lg\.value\)[\s\S]{0,80}\.padding\(\.top, 20\)[\s\S]{0,120}\.frame\(minWidth: 520, maxWidth: \.infinity, maxHeight: \.infinity, alignment: \.topLeading\)/,
    'Draft main editor should not own the top body-start inset; the root primary surface slot owns it',
  );
  assert.doesNotMatch(
    draft,
    /\.padding\(\.horizontal, DSSpace\.lg\.value\)[\s\S]{0,80}\.padding\(\.bottom, DSSpace\.lg\.value\)[\s\S]{0,80}\.padding\(\.top, 20\)[\s\S]{0,120}\.frame\(minWidth: 240, maxWidth: 320, alignment: \.topLeading\)/,
    'Draft inspector should not own the top body-start inset; the root primary surface slot owns it',
  );
  assert.doesNotMatch(
    draft,
    /VStack\(alignment: \.leading, spacing: DSSpace\.md\.value\) \{\s*Text\("Draft"\)/,
    'Draft should not render a redundant page-mode eyebrow below the toolbar',
  );
});

test('/collect deep-links into Sources instead of mounting a third primary surface', () => {
  const minimalRoot = read('macos-app/Loom/Sources/LoomMinimalRootView.swift');

  assert.doesNotMatch(minimalRoot, /@State private var collectSurfaceResetID/);
  assert.doesNotMatch(minimalRoot, /private func showCollectSurface/);
  assert.doesNotMatch(minimalRoot, /case \.collect|case \.organize/);
  assert.match(minimalRoot, /case "\/", "\/collect", "\/sources", "\/knowledge":\s*\n\s*navigate\(\.sources\)/);
  assert.match(minimalRoot, /private var sourcesRow: some View/);
  assert.match(minimalRoot, /rowID: "__sources"[\s\S]{0,220}title: "Sources"/);
  assert.match(minimalRoot, /case \.webCaptureSetup:\s*primarySurfaceSlot \{\s*LoomLibraryView\(publicWorkingMode: publicWorkingMode\)\s*\}/);
});

test('native Draft keeps its inspector bounded inside the shared detail chrome', () => {
  const draft = read('macos-app/Loom/Sources/LoomDraftView.swift');
  const selectableEditor = read('macos-app/Loom/Sources/SelectableTextEditor.swift');
  const bodyStart = draft.indexOf('var body: some View');
  const firstHelperStart = draft.indexOf('private var draftRailHairline', bodyStart);

  assert.ok(bodyStart >= 0, 'native Draft body must exist');
  assert.ok(firstHelperStart > bodyStart, 'native Draft body block must be bounded');

  const body = draft.slice(bodyStart, firstHelperStart);

  assert.doesNotMatch(
    body,
    /HSplitView\s*\{/,
    'Draft must not nest a native HSplitView inside the already-split Loom shell; nested split views can escape the shared detail toolbar and clip the sidebar/titlebar',
  );
  assert.match(
    body,
    /HStack\(alignment: \.top, spacing: 0\) \{/,
    'Draft should use a bounded horizontal layout inside the parent detail slot',
  );
  assert.match(
    body,
    /\.frame\(minWidth: 520, maxWidth: \.infinity, maxHeight: \.infinity, alignment: \.topLeading\)/,
    'the editor column should fill the post-chrome detail slot instead of driving native split layout',
  );
  assert.match(
    draft,
    /private let draftDocumentMeasureWidth: CGFloat = 820/,
    'Draft should constrain the writing measure so the main surface reads like a document, not a full-window form field',
  );
  assert.match(
    draft,
    /private let draftEmptyWritingSurfaceHeight: CGFloat = 300/,
    'An empty Draft should start as a compact work surface instead of a giant blank form field',
  );
  assert.match(
    draft,
    /private let draftWritingSurfaceMinHeight: CGFloat = 360/,
    'Draft should keep a deliberate document height once writing begins without turning the empty state into a full-page text box',
  );
  assert.match(
    draft,
    /private let draftWritingSurfaceMaxHeight: CGFloat = 560/,
    'Draft should stop the empty editor from stretching into a giant full-window input field',
  );
  assert.match(
    body,
    /\.frame\(maxWidth: draftDocumentMeasureWidth, maxHeight: \.infinity, alignment: \.topLeading\)[\s\S]{0,180}\.frame\(minWidth: 520, maxWidth: \.infinity, maxHeight: \.infinity, alignment: \.topLeading\)/,
    'Draft should use an intentional document column inside the shared detail slot',
  );
  assert.match(
    draft,
    /\.frame\(width: 286, alignment: \.topLeading\)[\s\S]{0,80}\.frame\(maxHeight: \.infinity, alignment: \.topLeading\)/,
    'the inspector should be a fixed-width right rail bounded by the same post-chrome detail slot',
  );
  assert.match(
    body,
    /draftStatusLine[\s\S]{0,180}draftWritingSurface/,
    'Draft main body should keep the writing path direct: title, compact state, then the writing canvas',
  );
  assert.doesNotMatch(
    body,
    /draftDocumentBar|draftSourceContextStrip|draftContextInlineSummary/,
    'Draft page-local tool strips should move into the shared toolbar and right inspector',
  );
  assert.doesNotMatch(
    body,
    /Text\(status\)/,
    'Draft should not leave a loose Saved label at the bottom of the writing surface; save state belongs in the compact status line',
  );
  assert.match(
    draft,
    /private var draftWritingSurface: some View[\s\S]{0,520}SelectableTextEditor/,
    'Draft should wrap the AppKit editor in a named borderless writing surface',
  );
  assert.match(
    draft,
    /private var draftWritingSurfacePreferredHeight: CGFloat[\s\S]{0,180}draftIsEffectivelyEmpty \? draftEmptyWritingSurfaceHeight : draftWritingSurfaceMaxHeight/,
    'Draft should size the editor from the writing state so an empty Untitled draft does not become a full-height blank page',
  );
  assert.match(
    draft,
    /private var draftWritingSurface: some View[\s\S]{0,1200}\.frame\(\s*maxWidth: \.infinity,\s*minHeight: draftWritingSurfacePreferredHeight,\s*idealHeight: draftWritingSurfacePreferredHeight,\s*maxHeight: draftWritingSurfaceMaxHeight,\s*alignment: \.topLeading\s*\)/,
    'Draft writing should occupy a bounded document canvas and let the empty state stay compact',
  );
  assert.doesNotMatch(
    draft,
    /private var draftWritingSurface: some View[\s\S]{0,1200}\.frame\(maxWidth: \.infinity, maxHeight: \.infinity, alignment: \.topLeading\)/,
    'Draft writing surface must not consume the full available height like a form field',
  );
  assert.match(
    body,
    /referenceAutocompletePanel[\s\S]{0,120}Spacer\(minLength: 0\)/,
    'extra vertical room should belong to the canvas background after the document editor, not to the text input itself',
  );
  assert.match(
    draft,
    /private var draftStatusLine: some View[\s\S]{0,420}draftDocumentMetric/,
    'Draft should keep word/source/selection state in a compact status line instead of a toolbar-like card',
  );
  assert.doesNotMatch(
    draft,
    /private var draftContextInlineSummary: some View/,
    'source attachment belongs in the toolbar and the right inspector, not as another strip above the writing canvas',
  );
  assert.doesNotMatch(
    draft,
    /SelectableTextEditor\([\s\S]{0,260}\)\s*[\s\S]{0,220}\.overlay\(alignment: \.top\)/,
    'Draft editor should not draw form-like top and bottom borders around the writing canvas',
  );
  assert.match(
    body,
    /draftRailHairline[\s\S]{0,120}draftInspector/,
    'Draft should use Loom hairline chrome between editor and inspector; the system Divider draws a hard black seam in the installed app',
  );
  assert.doesNotMatch(
    body,
    /aiDraftPanel|inlineEditPanel|AI draft|AI edit/,
    'Draft writing surface should stay focused on the document; AI and edit tools belong in the right inspector',
  );
  assert.match(
    selectableEditor,
    /scroll\.borderType = \.noBorder[\s\S]{0,140}scroll\.drawsBackground = false[\s\S]{0,120}textView\.drawsBackground = false/,
    'the AppKit editor should be a transparent writing surface, not a bordered system form field',
  );
  assert.match(
    selectableEditor,
    /scroll\.focusRingType = \.none[\s\S]{0,180}textView\.focusRingType = \.none/,
    'the writing canvas should not draw a native focus ring that makes it look like one huge form field',
  );
  assert.match(
    selectableEditor,
    /scroll\.hasVerticalScroller = false[\s\S]{0,80}scroll\.hasHorizontalScroller = false/,
    'Draft should avoid persistent system scroll chrome inside the writing canvas',
  );
});

test('native Draft inspector is action-first and separates source edit and board tools', () => {
  const draft = read('macos-app/Loom/Sources/LoomDraftView.swift');

  assert.match(draft, /private enum LoomDraftInspectorMode: String, CaseIterable, Identifiable/);
  assert.match(draft, /case context = "Sources"/);
  assert.match(draft, /case edit = "Edit"/);
  assert.match(draft, /case board = "Board"/);
  assert.doesNotMatch(draft, /case write = "Write"|case sources = "Sources"/);
  assert.match(draft, /@State private var inspectorMode: LoomDraftInspectorMode = \.context/);
  assert.match(draft, /private var inspectorSwitcher: some View/);
  assert.match(draft, /ForEach\(LoomDraftInspectorMode\.allCases\)/);
  assert.match(draft, /private func inspectorModeButton\(_ mode: LoomDraftInspectorMode\) -> some View/);
  assert.match(draft, /private func inspectorBody\(thinkingBlocks: \[LoomThinkingDraftBlock\]\) -> some View/);
  assert.match(
    draft,
    /case \.context:[\s\S]{0,180}draftNextActionPanel[\s\S]{0,180}draftContextPanel/,
    'the default inspector mode should lead with the next action and source context',
  );
  assert.match(
    draft,
    /case \.edit:[\s\S]{0,160}inlineEditInspectorPanel[\s\S]{0,160}draftStructurePanel/,
    'editing tools should be separated from source context so the inspector remains actionable',
  );
  assert.match(
    draft,
    /case \.board:[\s\S]{0,120}draftBoard/,
    'draft-card controls should be isolated behind the Board inspector mode',
  );
});

test('native Draft treats Untitled plus empty body as an empty writing state', () => {
  const draft = read('macos-app/Loom/Sources/LoomDraftView.swift');

  assert.match(draft, /private var draftBodyIsBlank: Bool/);
  assert.match(draft, /private var draftIsEffectivelyEmpty: Bool/);
  assert.match(
    draft,
    /cleanTitle\.isEmpty \|\| cleanTitle == "Untitled draft"/,
    'the default persisted title must not make an empty Draft look like a started draft',
  );
  assert.match(
    draft,
    /private var draftPrimaryActionTitle: String[\s\S]{0,260}if draftIsEffectivelyEmpty \{ return "Draft with sources" \}/,
    'after sources are attached, a blank Untitled draft should offer source-grounded drafting, not generic continuation',
  );
  assert.match(
    draft,
    /private var draftNextActionTitle: String[\s\S]{0,260}if draftIsEffectivelyEmpty \{ return "Start from the attached sources" \}/,
    'the inspector next step should distinguish a blank draft from an in-progress draft',
  );
  assert.match(
    draft,
    /private var draftNextActionDetail: String[\s\S]{0,360}if draftIsEffectivelyEmpty \{[\s\S]{0,80}source context ready/,
    'the inspector should explain the concrete next state when an empty draft already has source context',
  );
  assert.doesNotMatch(
    draft,
    /private var draftPrimaryActionTitle: String[\s\S]{0,260}if draftIsEmpty \{ return "Draft with sources" \}/,
    'generic title/body emptiness is too narrow for the default Untitled draft state',
  );
});

test('minimal sidebar participates in the same root toolbar and body rhythm', () => {
  const minimalRoot = read('macos-app/Loom/Sources/LoomMinimalRootView.swift');

  assert.match(minimalRoot, /private let minimalSidebarWidth: CGFloat = 112/);
  assert.match(
    minimalRoot,
    /private let sidebarRowHeight: CGFloat = 24/,
    'the left rail should be a compact navigation rail, not a wide document column',
  );
  assert.match(
    minimalRoot,
    /private let sidebarIconSlotWidth: CGFloat = 14/,
    'sidebar icons should align in a tight fixed slot so labels do not drift',
  );
  assert.match(
    minimalRoot,
    /private let rootChromeHorizontalInset: CGFloat = 8/,
    'toolbar controls should sit in a compact app-chrome lane instead of a wide titlebar band',
  );
  assert.match(
    minimalRoot,
    /private let chromeButtonSize: CGFloat = 24/,
    'toolbar icon buttons should be compact enough to avoid a heavy top strip',
  );
  assert.match(
    minimalRoot,
    /private func sidebarLabelFont\(isSelected: Bool\) -> Font/,
    'sidebar rows should use a small system chrome font rather than large reading-surface serif type',
  );
  assert.doesNotMatch(
    minimalRoot,
    /private func sidebarEyebrowFont\(\) -> Font/,
    'sidebar no longer owns section labels; folders live in Sources instead of duplicated global chrome',
  );
  assert.match(
    minimalRoot,
    /HStack\(spacing: 0\)\s*\{[\s\S]{0,220}sidebar[\s\S]{0,620}rootSplitHairline[\s\S]{0,260}VStack\(spacing: 0\)\s*\{[\s\S]{0,180}rootChrome[\s\S]{0,180}rootToolbarHairline[\s\S]{0,260}detailContent/,
    'minimal root should own one fixed compact split shell; the sidebar is independent and the top toolbar belongs to the detail pane',
  );
  assert.doesNotMatch(
    minimalRoot,
    /HSplitView\s*\{[\s\S]{0,260}sidebar/,
    'system HSplitView leaves a visible splitter seam between the sidebar and detail pane in the installed app',
  );
  assert.doesNotMatch(
    minimalRoot,
    /NavigationSplitView\s*\{/,
    'system NavigationSplitView adds fullscreen/windowed sidebar chrome that overlaps the custom Loom titlebar',
  );
  assert.match(
    minimalRoot,
    /\.ignoresSafeArea\(\.container, edges: \.top\)[\s\S]{0,360}\.background\(rootCanvasBackground\.ignoresSafeArea\(\)\)/,
    'the root shell should enter the transparent titlebar while the shared root toolbar keeps rows out from under the traffic lights',
  );
  assert.match(
    minimalRoot,
    /\.background\(rootCanvasBackground\.ignoresSafeArea\(\.container, edges: \.top\)\)/,
    'only the unified app canvas background should fill the transparent titlebar region',
  );
  assert.match(minimalRoot, /private let rootToolbarHeight: CGFloat = 28/);
  assert.match(minimalRoot, /private var rootToolbarClearance: CGFloat \{\s*rootToolbarHeight\s*\}/);
  assert.doesNotMatch(minimalRoot, /mainWindowIsFullScreen|MinimalWindowFullScreenObserver/);
  assert.match(
    minimalRoot,
    /private var sidebar: some View \{[\s\S]*?sidebarSurfaceSlot \{[\s\S]*?VStack\(alignment: \.leading, spacing: 0\) \{[\s\S]{0,120}sourcesRow[\s\S]{0,80}draftRow[\s\S]{0,220}\.frame\(maxWidth: \.infinity, maxHeight: \.infinity, alignment: \.topLeading\)/,
    'sidebar content should start directly with the primary navigation rows in the same post-toolbar body slot as primary page content',
  );
  assert.doesNotMatch(
    minimalRoot,
    /private var sidebar: some View \{[\s\S]*?ScrollView \{/,
    'the compact product switcher should not keep the old scrollable folder browser shell',
  );
  assert.doesNotMatch(
    minimalRoot,
    /sectionEyebrow\("Loom"/,
    'the centered root wordmark already names the product; repeating Loom inside the sidebar creates the oversized blank rail the user reported',
  );
  assert.doesNotMatch(minimalRoot, /private var sidebarChrome: some View/);
  assert.doesNotMatch(minimalRoot, /sidebarChromeIconButton/);
  assert.match(
    minimalRoot,
    /case \.sources, \.webCaptureSetup:[\s\S]{0,520}chromeTextButton\([\s\S]{0,160}title: "Add Folder"[\s\S]{0,260}pickFolder/,
    'Folder creation should live in the active Sources toolbar instead of as unexplained icons above the sidebar',
  );
  assert.match(
    minimalRoot,
    /rootChrome\s*\.frame\(height: rootToolbarClearance\)[\s\S]{0,160}rootToolbarHairline[\s\S]{0,220}detailContent/,
    'the toolbar bottom rule should be a real detail-pane row boundary in the root layout, not an offset overlay',
  );
  const rootChromeStart = minimalRoot.indexOf('private var rootChrome: some View');
  const chromeIconStart = minimalRoot.indexOf('private func chromeIconButton', rootChromeStart);
  assert.ok(rootChromeStart >= 0 && chromeIconStart > rootChromeStart);
  const rootChromeBody = minimalRoot.slice(rootChromeStart, chromeIconStart);
  assert.doesNotMatch(
    rootChromeBody,
    /Color\.clear\s*[\s\S]{0,160}\.frame\(width: minimalSidebarWidth\)|rootSplitHairline/,
    'the root toolbar should not allocate a fake left sidebar slice; that old blank band caused the side-nav/tool-bar alignment drift',
  );
  assert.doesNotMatch(
    rootChromeBody,
    /minimalSidebarWidth/,
    'the detail toolbar should not know the sidebar width',
  );
  assert.doesNotMatch(
    rootChromeBody,
    /\.overlay\(alignment: \.bottom\)/,
    'root toolbar should not draw a local overlay rule; rootToolbarHairline owns the boundary',
  );
  assert.doesNotMatch(
    minimalRoot,
    /sectionEyebrow\("Tools"/,
    'left navigation should not contain a Tools content section; creation tools belong in chrome',
  );
  assert.doesNotMatch(
    minimalRoot,
    /title:\s*"Page"[\s\S]{0,180}rowID:\s*"__new_page"[\s\S]{0,360}title:\s*"Folder"/,
    'Page and Folder must not render as regular navigation rows',
  );
  assert.doesNotMatch(
    minimalRoot,
    /\.safeAreaInset\(edge: \.top, spacing: 0\) \{[\s\S]*?minimalSidebarTopClearance/,
    'the sidebar chrome guard should not rely on ScrollView safeAreaInset',
  );
});

test('native root shell uses one continuous app canvas background', () => {
  const minimalRoot = read('macos-app/Loom/Sources/LoomMinimalRootView.swift');
  const captureSetup = read('macos-app/Loom/Sources/CapturesView.swift');
  const library = read('macos-app/Loom/Sources/LoomLibraryView.swift');
  const draft = read('macos-app/Loom/Sources/LoomDraftView.swift');

  assert.match(
    minimalRoot,
    /private var rootCanvasBackground: Color \{\s*LoomTokens\.dsPaperDeep\s*\}/,
    'the installed shell should have one named canvas background instead of mixing sidebar, toolbar, and detail colors',
  );

  const bodyStart = minimalRoot.indexOf('var body: some View');
  const navigationStart = minimalRoot.indexOf('private func handleAnchorJump', bodyStart);
  assert.ok(bodyStart >= 0 && navigationStart > bodyStart);
  const bodyShell = minimalRoot.slice(bodyStart, navigationStart);

  assert.match(
    bodyShell,
    /sidebar[\s\S]{0,420}\.background\(rootCanvasBackground\.ignoresSafeArea\(\.container, edges: \.top\)\)/,
    'the sidebar titlebar fill should use the same canvas color as the rest of the app',
  );
  assert.match(
    bodyShell,
    /detailContent[\s\S]{0,180}\.background\(rootCanvasBackground\)/,
    'the detail pane should not introduce a second large background color below the toolbar',
  );
  assert.match(
    bodyShell,
    /\.background\(rootCanvasBackground\.ignoresSafeArea\(\)\)/,
    'the window-wide fallback background should match the product canvas',
  );
  assert.doesNotMatch(
    bodyShell,
    /LoomTokens\.dsPaper(?!Deep)/,
    'the root shell body must not mix dsPaper into the large canvas; small controls can still use raised fills outside the shell body',
  );
  assert.match(
    minimalRoot,
    /private var rootChrome: some View \{[\s\S]*?\.background\(rootCanvasBackground\)/,
    'the toolbar should sit on the same app canvas, not a separate strip',
  );
  assert.match(
    captureSetup,
    /struct WebCaptureSetupView[\s\S]*?\.background\(LoomTokens\.dsPaperDeep\)/,
    'Sources setup should share the root app canvas background instead of using an older light/dark alias',
  );
  assert.doesNotMatch(
    captureSetup,
    /struct WebCaptureSetupView[\s\S]*?\.background\(LoomTokens\.paper\)/,
    'Sources setup must not reintroduce a page-local canvas color',
  );
  assert.match(
    library,
    /\.background\(LoomTokens\.dsPaperDeep\)/,
    'Sources should share the root app canvas background',
  );
  assert.match(
    draft,
    /var body: some View \{[\s\S]*?\.background\(LoomTokens\.dsPaperDeep\)/,
    'Draft should share the root app canvas background instead of rendering as a separate paper sheet',
  );
});

test('minimal sidebar is a compact product switcher, not a duplicate source browser', () => {
  const minimalRoot = read('macos-app/Loom/Sources/LoomMinimalRootView.swift');

  assert.match(
    minimalRoot,
    /private func sidebarNavigationRow\(/,
    'primary navigation should use one fixed row renderer instead of near-duplicate HStacks',
  );
  assert.match(
    minimalRoot,
    /private let minimalSidebarWidth: CGFloat = 112/,
    'sidebar should stay narrow once source folders move into the Sources workbench',
  );
  const sharedRowStart = minimalRoot.indexOf('private func sidebarNavigationRow(');
  const sidebarButtonStart = minimalRoot.indexOf('private func sidebarButton(', sharedRowStart);
  assert.ok(sharedRowStart >= 0 && sidebarButtonStart > sharedRowStart);
  const sharedRowBody = minimalRoot.slice(sharedRowStart, sidebarButtonStart);
  assert.match(
    sharedRowBody,
    /Button\(action: action\)/,
    'sidebar navigation rows must be real SwiftUI Buttons so installed-app accessibility clicks navigate reliably',
  );
  assert.doesNotMatch(
    sharedRowBody,
    /\.onTapGesture/,
    'sidebar navigation rows should not depend on gesture-only click handling',
  );
  assert.doesNotMatch(
    sharedRowBody,
    /\.accessibilityAction/,
    'real Buttons should own the accessibility action instead of a separate manual handler',
  );
  assert.match(
    sharedRowBody,
    /HStack\(spacing: 0\)/,
    'sidebar row renderer should use explicit zero spacing so the icon/text gap is fixed by one constant',
  );
  assert.match(
    sharedRowBody,
    /\.frame\(width: sidebarIconSlotWidth, height: sidebarIconSlotWidth, alignment: \.center\)/,
    'sidebar icons should sit in a real square slot, not rely on each SF Symbol intrinsic width',
  );
  assert.match(
    sharedRowBody,
    /\.padding\(\.leading, sidebarIconTextGap\)/,
    'sidebar row renderer should use one fixed icon slot and one fixed icon-to-text gap',
  );

  const sourcesRowStart = minimalRoot.indexOf('private var sourcesRow', sidebarButtonStart);
  assert.ok(sidebarButtonStart >= 0 && sourcesRowStart > sidebarButtonStart);
  const sidebarButtonBody = minimalRoot.slice(sidebarButtonStart, sourcesRowStart);
  assert.match(
    sidebarButtonBody,
    /sidebarNavigationRow\(/,
    'Sources and Draft should delegate to the shared sidebar row grid',
  );
  assert.doesNotMatch(
    sidebarButtonBody,
    /HStack\(spacing: DSSpace\.xs\.value \+ 1\)/,
    'primary rows should not carry their own icon/text spacing',
  );

  assert.match(minimalRoot, /private var sourcesRow: some View/);
  assert.match(minimalRoot, /private var draftRow: some View/);
  assert.doesNotMatch(
    minimalRoot,
    /sectionEyebrow\("Folders|folderList|private func rootRow\(|private var topLevelRoots|private func descendants\(/,
    'Sources page owns source groups; the global sidebar should not duplicate folders or nested source browsing',
  );
});

test('fallback main Loom window uses the same full-size chrome contract as the scene window', () => {
  const loomApp = read('macos-app/Loom/Sources/LoomApp.swift');

  assert.match(loomApp, /private func createFallbackMainWindow\(\)/);
  // The fallback window mounts the same dossier web root as the SwiftUI scene
  // (the macOS app now presents the latest web identity product, not the
  // retired minimal Sources/Draft shell).
  assert.match(loomApp, /let rootView = LoomDossierRootView\(\)/);
  assert.match(
    loomApp,
    /styleMask:\s*\[\.titled,\s*\.closable,\s*\.miniaturizable,\s*\.resizable,\s*\.fullSizeContentView\]/,
    'fallback minimal windows should match the scene window: full-size content plus explicit in-window top guards',
  );
});

test('hosted XCTest runs do not materialize a second visible Loom room', () => {
  const loomApp = read('macos-app/Loom/Sources/LoomApp.swift');
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
  const loomApp = read('macos-app/Loom/Sources/LoomApp.swift');
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
  const presentStart = loomApp.indexOf('@MainActor\n    private func presentWindowOnActiveSpace', ensureStart);
  assert.ok(ensureStart >= 0 && presentStart > ensureStart, 'ensureMainWindowVisible block must be bounded');
  const ensureBlock = loomApp.slice(ensureStart, presentStart);
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
  assert.match(loomApp, /presentationBehavior\.insert\(\.canJoinAllSpaces\)/);
  const presentBlock = loomApp.slice(presentStart, loomApp.indexOf('/// Materialize a fallback main window', presentStart));
  assert.doesNotMatch(presentBlock, /\.insert\(\.moveToActiveSpace\)/);
  assert.doesNotMatch(loomApp, /mainPresentationRestore/);
});

test('DevServer publishes SwiftUI observable state from the main thread', () => {
  const devServer = read('macos-app/Loom/Sources/DevServer.swift');
  const readyStart = devServer.indexOf('func markReadyForStaticBundle()');
  const resolvedStart = devServer.indexOf('static func resolvedServerMode', readyStart);
  const startStart = devServer.indexOf('func start(resetRetry: Bool = true)');
  const reloadStart = devServer.indexOf('/// Restart the node server', startStart);
  const publishHelpersStart = devServer.indexOf('private func publishStatus(_ nextStatus: Status)');
  const publishHelpersEnd = devServer.indexOf('/// Called by `AppDelegate`', publishHelpersStart);

  assert.ok(readyStart >= 0 && resolvedStart > readyStart, 'static-bundle ready path must exist');
  assert.ok(startStart >= 0 && reloadStart > startStart, 'server start path must exist');
  assert.ok(
    publishHelpersStart >= 0 && publishHelpersEnd > publishHelpersStart,
    'DevServer should centralize @Published writes through publish helpers',
  );

  const readyBody = devServer.slice(readyStart, resolvedStart);
  const startBody = devServer.slice(startStart, reloadStart);
  const devServerOutsidePublishHelpers =
    devServer.slice(0, publishHelpersStart) + devServer.slice(publishHelpersEnd);

  assert.match(
    readyBody,
    /guard Thread\.isMainThread else \{[\s\S]{0,220}DispatchQueue\.main\.async \{ \[weak self\] in[\s\S]{0,80}self\?\.markReadyForStaticBundle\(\)/,
    'static-bundle ready should hop back to main before publishing @Published state',
  );
  assert.match(
    startBody,
    /guard Thread\.isMainThread else \{[\s\S]{0,220}DispatchQueue\.main\.async \{ \[weak self\] in[\s\S]{0,100}self\?\.start\(resetRetry: resetRetry\)/,
    'start(resetRetry:) should hop back to main before publishing @Published state',
  );
  assert.match(devServer, /private func publishStatus\(_ nextStatus: Status\)/);
  assert.match(devServer, /private func publishCurrentPort\(_ nextPort: Int\)/);
  assert.doesNotMatch(
    devServerOutsidePublishHelpers,
    /\bstatus = \.(ready|starting|failed)/,
    'status changes should go through publishStatus so background callbacks cannot publish directly',
  );
  assert.doesNotMatch(
    devServerOutsidePublishHelpers,
    /\bcurrentPort = (preferredPort|nextPort)/,
    'currentPort changes should go through publishCurrentPort so background callbacks cannot publish directly',
  );
  assert.match(startBody, /if DevServer\.isSandboxed \{[\s\S]{0,120}publishStatus\(\.ready\)/);
});

test('minimal main Loom windows hide the system titlebar so Draft has one chrome owner', () => {
  const loomApp = read('macos-app/Loom/Sources/LoomApp.swift');
  const contentView = read('macos-app/Loom/Sources/ContentView.swift');
  const minimalRoot = read('macos-app/Loom/Sources/LoomMinimalRootView.swift');
  const mainStart = loomApp.indexOf('Window("Loom", id: MainWindow.id)');
  const settingsStart = loomApp.indexOf('Settings {', mainStart);
  const fallbackStart = loomApp.indexOf('private func createFallbackMainWindow()');
  const reopenStart = loomApp.indexOf('func applicationShouldHandleReopen', fallbackStart);
  const configuratorStart = contentView.indexOf('struct WindowConfigurator: NSViewRepresentable');

  assert.ok(mainStart >= 0, 'main Loom Window scene must exist');
  assert.ok(settingsStart > mainStart, 'main Loom Window scene block must be bounded');
  assert.ok(fallbackStart >= 0, 'fallback main window must exist');
  assert.ok(reopenStart > fallbackStart, 'fallback main window block must be bounded');
  assert.ok(configuratorStart >= 0, 'shared window configurator must exist');

  const mainScene = loomApp.slice(mainStart, settingsStart);
  const fallback = loomApp.slice(fallbackStart, reopenStart);
  const configurator = contentView.slice(configuratorStart);

  assert.match(
    mainScene,
    /\.windowStyle\(\.hiddenTitleBar\)/,
    'the minimal scene window must hide macOS titlebar chrome; Draft renders navigation/title/capture in-window',
  );
  assert.doesNotMatch(
    mainScene,
    /\.windowToolbarStyle\(\.unifiedCompact\)/,
    'the main Loom scene must not keep an empty macOS toolbar/title strip above Draft chrome',
  );
  assert.match(fallback, /window\.titlebarAppearsTransparent = true/);
  assert.match(fallback, /window\.titleVisibility = \.hidden/);
  assert.match(fallback, /window\.toolbar = nil/);
  assert.match(fallback, /window\.standardWindowButton\(\.toolbarButton\)\?\.isHidden = true/);
  assert.match(
    configurator,
    /var removesSystemToolbar: Bool = false/,
    'legacy ContentView may keep its toolbar, but minimal mode must be able to opt out',
  );
  assert.match(
    minimalRoot,
    /WindowConfigurator\(title: "Loom", isNight: usesNightPalette, contentExtendsUnderTitlebar: true, removesSystemToolbar: true\)/,
    'minimal mode must remove the scene-managed NSWindow toolbar that reappears in fullscreen/windowed Draft screenshots',
  );
  assert.match(
    configurator,
    /if removesSystemToolbar \{\s*window\.toolbar = nil\s*clearTitlebarAccessories\(window\)\s*window\.standardWindowButton\(\.toolbarButton\)\?\.isHidden = true\s*\}/,
    'scene-managed main windows must clear system toolbar and sidebar-toggle chrome, matching the fallback window path',
  );
  assert.match(
    configurator,
    /private func clearTitlebarAccessories\(_ window: NSWindow\)/,
    'titlebar accessory cleanup must be centralized so SwiftUI AppKitWindow subclasses can be guarded safely',
  );
  assert.match(
    configurator,
    /Selector\(\("setTitlebarAccessoryViewControllers:"\)\)/,
    'titlebar accessory cleanup must use the runtime selector because AppKitWindow may not implement the setter',
  );
  assert.match(
    configurator,
    /window\.responds\(to: selector\)/,
    'titlebar accessory cleanup must skip SwiftUI window classes that do not implement the setter',
  );
  assert.doesNotMatch(
    fallback,
    /window\.toolbarStyle = \.unifiedCompact/,
    'fallback windows must match the hidden-titlebar scene contract instead of recreating the duplicated top strip',
  );
});

test('minimal main Loom windows reapply hidden chrome after fullscreen transitions', () => {
  const contentView = read('macos-app/Loom/Sources/ContentView.swift');
  const configuratorStart = contentView.indexOf('struct WindowConfigurator: NSViewRepresentable');
  const configuratorEnd = contentView.indexOf('/// Minimal loading state', configuratorStart);

  assert.ok(configuratorStart >= 0, 'shared window configurator must exist');
  assert.ok(configuratorEnd > configuratorStart, 'shared window configurator block must be bounded');

  const configurator = contentView.slice(configuratorStart, configuratorEnd);

  assert.match(
    configurator,
    /func makeCoordinator\(\) -> Coordinator/,
    'WindowConfigurator needs a coordinator so it can keep fullscreen window chrome in contract after initial mount',
  );
  assert.match(
    configurator,
    /NSWindow\.didEnterFullScreenNotification/,
    'macOS can restore toolbar/titlebar chrome during fullscreen entry; reconfigure after entering fullscreen',
  );
  assert.match(
    configurator,
    /NSWindow\.didExitFullScreenNotification/,
    'exiting fullscreen must also reapply the hidden-titlebar chrome contract',
  );
  assert.match(
    configurator,
    /configureWhenAttached\(to: nsView, coordinator: context\.coordinator\)/,
    'SwiftUI updates should refresh the fullscreen observers for the currently attached main window',
  );
  assert.match(
    configurator,
    /clearTitlebarAccessories\(window\)/,
    'macOS can restore accessory titlebar chrome separately from window.toolbar; clear it through the guarded helper',
  );
  assert.doesNotMatch(
    configurator,
    /window\.titlebarAccessoryViewControllers = \[\]/,
    'directly setting titlebarAccessoryViewControllers crashes on SwiftUI AppKitWindow in the installed app',
  );
  assert.match(
    configurator,
    /NSWindow\.didBecomeKeyNotification/,
    'focus changes can restore titlebar chrome after returning from another app',
  );
  assert.match(
    configurator,
    /NSWindow\.didResizeNotification/,
    'Tahoe Fill/window resize can restore titlebar chrome without a fullscreen notification',
  );
  assert.match(
    configurator,
    /NSWindow\.didChangeScreenNotification/,
    'moving between displays/spaces must reassert the hidden chrome contract',
  );
  assert.match(
    configurator,
    /DispatchQueue\.main\.asyncAfter\(deadline: \.now\(\) \+ 2\.0\)/,
    'fullscreen/window-management animations can reinsert chrome after the current 0.75s repair window',
  );
});

test('minimal main Loom windows remain eligible for macOS fullscreen', () => {
  const contentView = read('macos-app/Loom/Sources/ContentView.swift');
  const loomApp = read('macos-app/Loom/Sources/LoomApp.swift');
  const configuratorStart = contentView.indexOf('struct WindowConfigurator: NSViewRepresentable');
  const fallbackStart = loomApp.indexOf('private func createFallbackMainWindow()');
  const reopenStart = loomApp.indexOf('func applicationShouldHandleReopen', fallbackStart);

  assert.ok(configuratorStart >= 0, 'shared window configurator must exist');
  assert.ok(fallbackStart >= 0, 'fallback main window must exist');
  assert.ok(reopenStart > fallbackStart, 'fallback main window block must be bounded');

  const configurator = contentView.slice(configuratorStart);
  const fallback = loomApp.slice(fallbackStart, reopenStart);

  assert.match(
    configurator,
    /window\.collectionBehavior\.insert\(\.fullScreenPrimary\)/,
    'scene-managed main windows must advertise fullscreen eligibility after custom chrome configuration',
  );
  assert.match(
    fallback,
    /window\.collectionBehavior\.insert\(\.fullScreenPrimary\)/,
    'fallback main windows must keep Window > fullscreen actions enabled for Draft chrome acceptance',
  );
});

test('AppDelegate reasserts main-window hidden chrome when presenting existing windows', () => {
  const loomApp = read('macos-app/Loom/Sources/LoomApp.swift');
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
  assert.match(appDelegate, /clearMainWindowTitlebarAccessories\(window\)/);
  assert.match(appDelegate, /Selector\(\("setTitlebarAccessoryViewControllers:"\)\)/);
  assert.match(appDelegate, /window\.responds\(to: selector\)/);
  assert.doesNotMatch(
    appDelegate,
    /window\.titlebarAccessoryViewControllers = \[\]/,
    'direct titlebarAccessoryViewControllers assignment crashes before Draft route acceptance can run',
  );
  assert.match(appDelegate, /window\.standardWindowButton\(\.toolbarButton\)\?\.isHidden = true/);
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

test('legacy top-level routes remain files but are not primary home links', () => {
  const home = read('app/HomeClient.tsx');
  const legacyRoutes = [
    'app/atlas/page.tsx',
    'app/weaves/page.tsx',
    'app/patterns/page.tsx',
    'app/pursuits/page.tsx',
    'app/workbench/page.tsx',
    'app/atelier/page.tsx',
    'app/collection/page.tsx',
    'app/constellation/page.tsx',
    'app/soan/page.tsx',
  ];

  for (const route of legacyRoutes) {
    assert.ok(
      fs.existsSync(path.join(repoRoot, route)),
      `${route} should remain available for legacy/internal access`,
    );
  }

  for (const href of [
    '/atlas',
    '/weaves',
    '/patterns',
    '/pursuits',
    '/workbench',
    '/atelier',
    '/collection',
    '/constellation',
    '/soan',
  ]) {
    assert.doesNotMatch(
      home,
      new RegExp(`href=["']${href}["']|window\\.location\\.href\\s*=\\s*["']${href}["']`),
    );
  }
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

test('runtime capture readers return to Sources instead of promoting the captures landing', () => {
  const captureReader = read('app/loom-render/capture/page.tsx');
  const snapshotReader = read('app/loom-render/snapshot/page.tsx');
  const nativeCaptures = read('macos-app/Loom/Sources/CapturesView.swift');
  const nativeMinimalRoot = read('macos-app/Loom/Sources/LoomMinimalRootView.swift');
  const plan = read('docs/projects/active/2026-05-09-legacy-surface-migration-plan.md');

  assert.doesNotMatch(captureReader, /loom:\/\/bundle\/loom-render\/captures|>\s*Captures\s*</);
  assert.doesNotMatch(captureReader, /breadcrumb=\{[\s\S]*?Source Index/);
  assert.doesNotMatch(captureReader, />\s*Source Index\s*</);
  assert.match(
    nativeMinimalRoot,
    /case \.captureReader:[\s\S]{0,260}chromeTextButton\(\s*title: "Sources",[\s\S]{0,260}help: "Back to Sources \(Esc\)"[\s\S]{0,220}returnToSourcesFromRuntime\(\)/,
    'Sources belongs in native toolbar chrome, not as a second web-content row',
  );
  assert.match(
    nativeMinimalRoot,
    /CapturesView\([\s\S]{0,260}showReaderChrome: false/,
    'minimal capture reader should not render its own second Sources row',
  );

  assert.doesNotMatch(
    snapshotReader,
    /loom:\/\/bundle\/loom-render\/captures|Back to Captures|Back to captures|‹ Captures/,
  );
  assert.match(snapshotReader, /const backHref = '\/sources'/);
  assert.match(snapshotReader, /Back to Sources|‹ Sources/);

  assert.doesNotMatch(
    nativeCaptures,
    /Text\("Captures"\)[\s\S]{0,180}\.help\("Back to captures list \(Esc\)"\)/,
  );
  assert.match(
    nativeCaptures,
    /Text\("Sources"\)[\s\S]{0,320}\.help\("Back to Sources \(Esc\)"\)/,
  );
  assert.match(nativeCaptures, /private let onBackToSources: \(\) -> Void/);
  assert.match(nativeCaptures, /private let showReaderChrome: Bool/);
  assert.match(
    nativeCaptures,
    /CaptureReaderView\(entry: entry, themeMode: themeMode, showChrome: showReaderChrome\) \{\s*\n\s*onBackToSources\(\)/,
  );
  assert.doesNotMatch(
    nativeCaptures,
    /CaptureReaderView\(entry: entry, themeMode: themeMode, showChrome: showReaderChrome\) \{\s*\n\s*presentingCapture = nil/,
  );

  assert.match(
    nativeMinimalRoot,
    /onBackToSources: \{\s*\n\s*returnToSourcesFromRuntime\(\)\s*\n\s*\}/,
  );
  assert.match(nativeMinimalRoot, /private func returnToSourcesFromRuntime\(\)/);
  assert.match(nativeMinimalRoot, /selection = \.sources/);
  assert.match(nativeMinimalRoot, /history\.last == \.sources/);

  assert.match(plan, /reader and snapshot back links return to `\/sources`/);
});

test('primary product surfaces do not route users back into legacy or internal destinations', () => {
  const primarySurfaceFiles = [
    'app/HomeClient.tsx',
    'app/collect/page.tsx',
    'app/sources/page.tsx',
    'app/knowledge/KnowledgeHomeClient.tsx',
    'app/knowledge/KnowledgeHomeStatic.tsx',
    'app/draft/page.tsx',
    'app/draft/DraftClient.tsx',
  ];
  const blockedRoutes = [...NEW_LOOM_LEGACY_ROUTES, ...NEW_LOOM_INTERNAL_ROUTES];

  for (const file of primarySurfaceFiles) {
    const source = read(file);
    for (const route of blockedRoutes) {
      assert.doesNotMatch(
        source,
        new RegExp(`['"]${escapeRegExp(route)}['"]`),
        `${file} should not link to hidden route ${route}`,
      );
    }
  }
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

test('notes and highlights are compatibility redirects into Sources reader notes', () => {
  const notesPage = read('app/notes/page.tsx');
  const highlightsPage = read('app/highlights/page.tsx');
  const sourceIndex = read('app/knowledge/KnowledgeHomeStatic.tsx');

  for (const page of [notesPage, highlightsPage]) {
    assert.match(page, /import \{ redirect \} from 'next\/navigation'/);
    assert.match(page, /redirect\('\/sources#reader-notes'\)/);
    assert.doesNotMatch(page, /useAllTraces|fetchSearchIndex|PageFrame|openPanelReview/);
  }

  assert.match(
    sourceIndex,
    /<SourceBlock id="reader-notes" title="Reader notes" empty="No reader notes yet\.">/,
  );
  assert.match(sourceIndex, /id\?: string/);
  assert.match(sourceIndex, /<section id=\{id\} className="loom-source-block">/);
});

test('today is a live capture surface — not a redirect — with client-side jot persistence', () => {
  const todayPage = read('app/today/page.tsx');
  const todayClient = read('app/today/TodayClient.tsx');
  const jotStorage = read('lib/jot/jot-storage.ts');
  const plan = read('docs/projects/active/2026-05-09-legacy-surface-migration-plan.md');

  // /today renders TodayClient, does not redirect to /sources or /desk.
  assert.doesNotMatch(todayPage, /redirect\('\/sources'\)/);
  assert.doesNotMatch(todayPage, /redirect\('\/desk'\)/);
  assert.match(todayPage, /TodayClient/);

  // Jot storage is localStorage-backed and exports the required API.
  assert.match(jotStorage, /JOTS_KEY/);
  assert.match(jotStorage, /export function readJots/);
  assert.match(jotStorage, /export function appendJot/);
  assert.match(jotStorage, /localStorage/);
  // No server / IndexedDB dependency — stays client-safe.
  assert.doesNotMatch(jotStorage, /appendEventForDoc|IndexedDB|indexedDB/);

  // TodayClient wires the jot store into the capture surface.
  assert.match(todayClient, /readJots/);
  assert.match(todayClient, /appendJot/);
  assert.match(todayClient, /jot-storage/);

  // Route is still classified (legacy, not primary) so no sidebar link
  // and the migration plan reflects the new role.
  assert.match(plan, /`\/today`/);
  assert.match(plan, /capture surface|jot|quick.jot|daily capture/i);
});

test('contents compatibility route lands in Sources instead of the legacy surface map', () => {
  const contentsPage = read('app/contents/page.tsx');
  const globals = read('app/globals.css');
  const plan = read('docs/projects/active/2026-05-09-legacy-surface-migration-plan.md');

  assert.match(contentsPage, /import \{ redirect \} from 'next\/navigation'/);
  assert.match(contentsPage, /redirect\('\/sources'\)/);
  assert.doesNotMatch(contentsPage, /ContentsClient|reader's table of contents|reader’s map/);
  assert.equal(
    fs.existsSync(path.join(repoRoot, 'app/ContentsClient.tsx')),
    false,
    'app/ContentsClient.tsx should be removed once /contents redirects to /sources',
  );
  assert.doesNotMatch(globals, /\.loom-contents\b/);
  assert.match(plan, /\| `\/contents` \| Compatibility \| Sources \| Redirect to `\/sources`/);
});

test('atlas and browse compatibility routes land in Sources without passing through Desk', () => {
  const atlasPage = read('app/atlas/page.tsx');
  const atlasShelfPage = read('app/atlas/shelf/page.tsx');
  const browsePage = read('app/browse/page.tsx');
  const plan = read('docs/projects/active/2026-05-09-legacy-surface-migration-plan.md');

  for (const page of [atlasPage, atlasShelfPage, browsePage]) {
    assert.match(page, /import \{ redirect \} from 'next\/navigation'/);
    assert.match(page, /redirect\('\/sources'\)/);
    assert.doesNotMatch(page, /redirect\('\/desk'\)/);
  }

  assert.match(plan, /\| `\/atlas`, `\/atlas\/shelf`, `\/browse` \| Compatibility \| Sources/);
});

test('desk compatibility route lands in Sources after its remaining jobs moved out', () => {
  const deskPage = read('app/desk/page.tsx');
  const screenshotScript = read('scripts/app-store-screenshots.mjs');
  const plan = read('docs/projects/active/2026-05-09-legacy-surface-migration-plan.md');

  assert.match(deskPage, /import \{ redirect \} from 'next\/navigation'/);
  assert.match(deskPage, /redirect\('\/sources'\)/);
  assert.doesNotMatch(deskPage, /DeskPage|TodayClient|AtlasClient/);

  assert.match(screenshotScript, /slug: '01-sources',\s+url: '\/sources'/);
  assert.doesNotMatch(screenshotScript, /slug: '01-library',\s+url: '\/desk'/);
  assert.match(plan, /\| `\/desk` \| Compatibility \| Sources \| Redirect to `\/sources`/);
});

test('collection detail fallback is retired into Sources', () => {
  const collectionPage = read('app/collection/page.tsx');
  const plan = read('docs/projects/active/2026-05-09-legacy-surface-migration-plan.md');

  assert.equal(fs.existsSync(path.join(repoRoot, 'app/CollectionClient.tsx')), false);
  assert.match(collectionPage, /redirect\('\/sources'\)/);
  assert.doesNotMatch(collectionPage, /CollectionClient|Desk|Organize/);
  assert.match(plan, /\/collection` detail fallback uses Sources breadcrumbs|Redirect to `\/sources`/);
});

test('retired visual and social compatibility routes land in Sources or Draft', () => {
  const constellationPage = read('app/constellation/page.tsx');
  const branchingPage = read('app/branching/page.tsx');
  const palimpsestPage = read('app/palimpsest/page.tsx');
  const salonPage = read('app/salon/page.tsx');
  const globals = read('app/globals.css');
  const plan = read('docs/projects/active/2026-05-09-legacy-surface-migration-plan.md');

  for (const page of [constellationPage, branchingPage, palimpsestPage, salonPage]) {
    assert.match(page, /import \{ redirect \} from 'next\/navigation'/);
    assert.doesNotMatch(
      page,
      /M1[36]|Design reference|loom-(thinking|constellation|salon)\.jsx|Surface/,
    );
  }

  assert.match(constellationPage, /redirect\('\/sources#reader-notes'\)/);
  assert.match(branchingPage, /redirect\('\/sources#reader-notes'\)/);
  assert.match(palimpsestPage, /redirect\('\/draft'\)/);
  assert.match(salonPage, /redirect\('\/sources'\)/);

  assert.doesNotMatch(constellationPage, /ConstellationClient|Constellation · Loom/);
  assert.doesNotMatch(branchingPage, /BranchingClient|Branching · Loom/);
  assert.doesNotMatch(palimpsestPage, /PalimpsestClient|Palimpsest · Loom/);
  assert.doesNotMatch(salonPage, /SalonClient|Salon · Loom/);
  for (const retiredClient of [
    'app/ConstellationClient.tsx',
    'app/BranchingClient.tsx',
    'app/PalimpsestClient.tsx',
    'app/SalonClient.tsx',
  ]) {
    assert.equal(
      fs.existsSync(path.join(repoRoot, retiredClient)),
      false,
      `${retiredClient} should not remain as an orphan implementation after its route redirects`,
    );
  }
  assert.doesNotMatch(globals, /\.loom-(constellation|branching|palimpsest|salon)\b/);

  assert.match(
    plan,
    /\| `\/constellation`, `\/branching` \| Compatibility \| Sources \| Redirect to `\/sources#reader-notes`/,
  );
  assert.match(plan, /\| `\/palimpsest` \| Compatibility \| Draft \| Redirect to `\/draft`/);
  assert.match(plan, /\| `\/salon` \| Compatibility \| Sources \| Redirect to `\/sources`/);
});

test('retired correspondence and cowork routes land in Draft', () => {
  const productShell = read('lib/new-loom/product-shell.ts');
  const coworkPage = read('app/coworks/page.tsx');
  const letterPage = read('app/letter/page.tsx');
  const globals = read('app/globals.css');
  const plan = read('docs/projects/active/2026-05-09-legacy-surface-migration-plan.md');
  const legacyRoutes = new Set<string>(NEW_LOOM_LEGACY_ROUTES);
  const internalRoutes = new Set<string>(NEW_LOOM_INTERNAL_ROUTES);

  assert.ok(legacyRoutes.has('/coworks'), '/coworks should be a legacy compatibility route');
  assert.ok(legacyRoutes.has('/letter'), '/letter should be a legacy compatibility route');
  assert.ok(
    !internalRoutes.has('/coworks'),
    '/coworks should not remain classified as an internal sample route',
  );
  assert.ok(
    !internalRoutes.has('/letter'),
    '/letter should not remain classified as an internal sample route',
  );

  for (const page of [coworkPage, letterPage]) {
    assert.match(page, /import \{ redirect \} from 'next\/navigation'/);
    assert.match(page, /redirect\('\/draft'\)/);
    assert.doesNotMatch(page, /M13|Design reference|loom-actions\.jsx|LetterSurface/);
  }

  assert.doesNotMatch(
    coworkPage,
    /CoworksIndexClient|listCoworksWithSearchable|getSourceLibraryCategories|Coworks · Loom/,
  );
  assert.doesNotMatch(letterPage, /LetterClient|Letter · Loom/);
  for (const retiredClient of ['app/coworks/CoworksIndexClient.tsx', 'app/LetterClient.tsx']) {
    assert.equal(
      fs.existsSync(path.join(repoRoot, retiredClient)),
      false,
      `${retiredClient} should not remain as an orphan implementation after its route redirects`,
    );
  }
  assert.doesNotMatch(globals, /\.loom-(coworks|letter)\b/);

  assert.match(productShell, /NEW_LOOM_LEGACY_ROUTES[\s\S]*'\/coworks'[\s\S]*'\/letter'/);
  assert.match(
    plan,
    /\| `\/coworks`, `\/letter` \| Compatibility \| Draft \| Redirect to `\/draft`/,
  );
});

test('retired diagramming route lands in Draft instead of owning a thinking surface', () => {
  const productShell = read('lib/new-loom/product-shell.ts');
  const diagramsPage = read('app/diagrams/page.tsx');
  const globals = read('app/globals.css');
  const plan = read('docs/projects/active/2026-05-09-legacy-surface-migration-plan.md');
  const legacyRoutes = new Set<string>(NEW_LOOM_LEGACY_ROUTES);
  const internalRoutes = new Set<string>(NEW_LOOM_INTERNAL_ROUTES);

  assert.ok(legacyRoutes.has('/diagrams'), '/diagrams should be a legacy compatibility route');
  assert.ok(
    !internalRoutes.has('/diagrams'),
    '/diagrams should not remain classified as an internal sample route',
  );
  assert.match(diagramsPage, /import \{ redirect \} from 'next\/navigation'/);
  assert.match(diagramsPage, /redirect\('\/draft'\)/);
  assert.doesNotMatch(diagramsPage, /DiagramsClient|Diagrams · Loom|Five ways to draw a thought/);
  assert.equal(
    fs.existsSync(path.join(repoRoot, 'app/DiagramsClient.tsx')),
    false,
    'DiagramsClient should not remain as an orphan implementation after /diagrams redirects',
  );
  assert.doesNotMatch(globals, /\.loom-diagrams\b/);
  assert.match(productShell, /NEW_LOOM_LEGACY_ROUTES[\s\S]*'\/diagrams'/);
  assert.match(plan, /\| `\/diagrams` \| Compatibility \| Draft \| Redirect to `\/draft`/);
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

test('retired detail and empty-state clients route readers back to new Loom homes', () => {
  const pursuitDetail = read('app/PursuitDetailClient.tsx');

  assert.match(pursuitDetail, /href="\/sources"/);
  assert.match(pursuitDetail, /Return to Sources/);
  assert.doesNotMatch(
    pursuitDetail,
    /href="\/pursuits"|href="\/patterns"|Return to Pursuits|Panels formed within|Remove this pursuit|Patterns →|Open Patterns/,
  );
});

test('pursuits top-level route lands in Sources now that source groups own project context', () => {
  const pursuitsPage = read('app/pursuits/page.tsx');
  const sourceIndex = read('app/knowledge/KnowledgeHomeStatic.tsx');
  const plan = read('docs/projects/active/2026-05-09-legacy-surface-migration-plan.md');

  assert.match(sourceIndex, /New group/);
  assert.match(sourceIndex, /Move this source group/);
  assert.match(sourceIndex, /function sourceStateTags/);
  assert.match(sourceIndex, /Has draft/);

  assert.match(pursuitsPage, /import \{ redirect \} from 'next\/navigation'/);
  assert.match(pursuitsPage, /redirect\('\/sources'\)/);
  assert.doesNotMatch(
    pursuitsPage,
    /PursuitsClient|loom:\/\/native\/pursuits\.json|top-level mind-object/,
  );
  assert.match(plan, /\| `\/pursuits` \| Compatibility \| Sources \| Redirect to `\/sources`/);
});

test('patterns and weaves top-level routes land in Sources reader notes after panel migration', () => {
  const patternsPage = read('app/patterns/page.tsx');
  const weavesPage = read('app/weaves/page.tsx');
  const kesiPage = read('app/kesi/page.tsx');
  const graphPage = read('app/graph/page.tsx');
  const reviewThoughtMap = read('components/ReviewThoughtMap.tsx');
  const refreshCoach = read('components/RefreshCoach.tsx');
  const liveArtifact = read('components/LiveArtifact.tsx');
  const plan = read('docs/projects/active/2026-05-09-legacy-surface-migration-plan.md');

  for (const page of [patternsPage, weavesPage, kesiPage, graphPage]) {
    assert.match(page, /import \{ redirect \} from 'next\/navigation'/);
    assert.match(page, /redirect\('\/sources#reader-notes'\)/);
    assert.doesNotMatch(
      page,
      /PatternsClient|WeavesClient|permanentRedirect\('\/patterns'\)|router\.replace\([^)]*\/weaves/,
    );
  }

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
  assert.match(read('macos-app/Loom/Sources/ShuttleView.swift'), /userInfo: \["path": "\/sources#reader-notes"\]/);
  assert.doesNotMatch(read('macos-app/Loom/Sources/ShuttleView.swift'), /\/weaves\?weaveId/);
  assert.match(
    plan,
    /\| `\/patterns`, `\/weaves` \| Compatibility \| Sources \| Redirect to `\/sources#reader-notes`/,
  );
});

test('learning-target relation work enters Reader notes instead of legacy Graph', () => {
  const learningTargets = read('lib/learning-targets.ts');

  assert.doesNotMatch(learningTargets, /\/graph\?focus=|Open graph/);
  assert.match(learningTargets, /href: '\/sources#reader-notes'/);
  assert.match(learningTargets, /target\.kind === 'weave' \? 'Open reader notes' : 'Open source'/);
  assert.doesNotMatch(learningTargets, /router\.push\(`\/graph/);
});

test('first-run and native shortcuts land on new Loom product capabilities', () => {
  const onboarding = read('app/onboarding/OnboardingClient.tsx');
  const onboardingCss = read('app/onboarding/OnboardingClient.module.css');
  const offline = read('app/offline/page.tsx');
  const offlineCss = read('app/offline/offline.module.css');
  const app = read('macos-app/Loom/Sources/LoomApp.swift');
  const minimalRoot = read('macos-app/Loom/Sources/LoomMinimalRootView.swift');
  const help = read('macos-app/Loom/Sources/KeyboardHelpView.swift');

  assert.ok(NEW_LOOM_SUPPORT_ROUTES.includes('/onboarding'), '/onboarding should stay a support route');
  assert.ok(NEW_LOOM_SUPPORT_ROUTES.includes('/offline'), '/offline should stay a support route');
  assert.match(onboarding, /const ONBOARDING_DONE_ROUTE = '\/sources'/);
  assert.match(onboarding, /router\.push\(ONBOARDING_DONE_ROUTE\)/);
  assert.match(onboarding, /LoomGlobalNav/);
  assert.match(onboarding, /ariaLabel="Onboarding navigation"/);
  assert.match(onboarding, /import styles from '\.\/OnboardingClient\.module\.css'/);
  assert.match(onboarding, /Set up[\s\S]{0,120}Sources\./);
  assert.match(onboarding, /<main className=\{styles\.page\}>/);
  assert.doesNotMatch(onboarding, /<main style=\{\{/);
  assert.match(onboardingCss, /radial-gradient\(66rem 42rem at 50% -18%, rgba\(232, 236, 238, 0\.14\)/);
  assert.match(onboardingCss, /backdrop-filter:\s*blur\(30px\) saturate\(108%\)/);
  assert.match(onboardingCss, /\.primaryButton\s*\{/);
  assert.match(onboarding, /import \{ ArrowRight \} from 'lucide-react'/);
  assert.match(onboarding, /label="Choose Sources root"/);
  assert.match(onboarding, /label="Choose source folders"/);
  assert.match(offline, /LoomGlobalNav/);
  assert.match(offline, /ariaLabel="Offline navigation"/);
  assert.match(offline, /import styles from '\.\/offline\.module\.css'/);
  assert.match(offline, /<main className=\{styles\.page\}>/);
  assert.doesNotMatch(offline, /<main style=\{\{/);
  assert.match(offline, /href="\/sources" className=\{styles\.action\}>Open Sources<\/a>/);
  assert.match(offlineCss, /radial-gradient\(58rem 34rem at 50% -16%, rgba\(232, 236, 238, 0\.13\)/);
  assert.match(offlineCss, /backdrop-filter:\s*blur\(30px\) saturate\(108%\)/);
  assert.match(offlineCss, /\.action\s*\{/);
  assert.match(onboarding, /icon=\{<ArrowRight aria-hidden="true" size=\{14\} strokeWidth=\{1\.8\} \/>/);
  assert.doesNotMatch(onboarding, /router\.push\('\/desk'\)|opening Desk/);
  assert.doesNotMatch(onboarding, /Open the first book|Choose shelves|A room|for slow reading|room is set|Reading the shelves|→/);
  assert.doesNotMatch(offline, /Continue weaving|href="\/"/);

  for (const label of ['Sources', 'Draft']) {
    assert.match(app, new RegExp(`Button\\("${label}"\\)`));
    assert.match(help, new RegExp(`label:\\s*"${label}"`));
  }
  for (const retired of ['Collect', 'Organize']) {
    assert.doesNotMatch(app, new RegExp(`Button\\("${retired}"\\)`));
    assert.doesNotMatch(help, new RegExp(`label:\\s*"${retired}"`));
  }
  for (const legacy of ['Desk', 'Coworks', 'Patterns', 'Weaves']) {
    assert.doesNotMatch(app, new RegExp(`Button\\("${legacy}"\\)`));
  }

  assert.doesNotMatch(app, /postNav\("\/collect"\)/);
  assert.doesNotMatch(app, /Window\("Rehearsal"|Window\("Examiner"|Window\("Reconstructions"/);
  assert.match(app, /Window\("Source practice"/);
  assert.match(app, /Window\("Source check"/);
  assert.match(app, /Window\("Practice notes"/);
  assert.match(app, /postNav\("\/sources"\)/);
  assert.match(app, /postNav\("\/draft"\)/);
  assert.match(minimalRoot, /func navigateProductPath\(_ path: String\)/);
  assert.match(minimalRoot, /case "\/", "\/collect", "\/sources", "\/knowledge":\s*\n\s*navigate\(\.sources\)/);
  assert.match(minimalRoot, /case "\/draft":\s*\n\s*navigate\(\.draft\)/);
});

test('support and detail fallback routes share the global Loom navigation', () => {
  const llmWiki = read('app/llm-wiki/page.tsx');
  const llmWikiCss = read('app/llm-wiki/LLMWikiPage.module.css');
  const quizzesPage = read('app/quizzes/page.tsx');
  const quizzes = read('app/quizzes/QuizzesClient.tsx');
  const quizzesCss = read('app/quizzes/QuizzesPage.module.css');
  const docClient = read('app/DocClient.tsx');
  const panelPage = read('app/panel/page.tsx');
  const panelDetail = read('app/PanelDetailClient.tsx');
  const pursuitPage = read('app/pursuit/page.tsx');
  const pursuitDetail = read('app/PursuitDetailClient.tsx');
  const globals = read('app/globals.css');

  assert.ok(NEW_LOOM_INTERNAL_ROUTES.includes('/llm-wiki'), '/llm-wiki should stay an internal reference route');
  assert.ok(NEW_LOOM_INTERNAL_ROUTES.includes('/quizzes'), '/quizzes should stay an internal source-check route');
  assert.match(llmWiki, /LoomGlobalNav/);
  assert.match(llmWiki, /activeHref="\/sources"/);
  assert.match(llmWiki, /import styles from '\.\/LLMWikiPage\.module\.css'/);
  assert.match(llmWiki, /<main className=\{styles\.page\}>/);
  assert.match(llmWiki, /href="\/sources"[\s\S]{0,160}Sources/);
  assert.match(llmWiki, /Reference atlas/);
  assert.match(llmWiki, /read-only reference constellation/);
  assert.match(llmWiki, /Sources \/[\s\S]{0,80}Draft product loop/);
  assert.doesNotMatch(llmWiki, /href="\/desk"[\s\S]{0,120}Desk/);
  assert.doesNotMatch(llmWiki, /<StageShell|<PageFrame|<WorkSurface|<main style=\{\{/);
  assert.match(llmWikiCss, /radial-gradient\(72rem 44rem at 50% -18%, rgba\(232, 236, 238, 0\.145\)/);
  assert.match(llmWikiCss, /backdrop-filter:\s*blur\(30px\) saturate\(108%\)/);
  assert.match(llmWikiCss, /\.sectionGrid\s*\{/);
  assert.doesNotMatch(llmWikiCss, /content-visibility:\s*auto/);
  assert.match(quizzes, /LoomGlobalNav/);
  assert.match(quizzesPage, /metadata = \{ title: 'Source checks · Loom' \}/);
  assert.match(quizzesPage, /<QuizzesClient \/>/);
  assert.match(quizzes, /Source checks/);
  assert.match(quizzes, /import styles from '\.\/QuizzesPage\.module\.css'/);
  assert.match(quizzes, /<main className=\{styles\.page\}>/);
  assert.match(quizzes, /Open Sources/);
  assert.match(quizzes, /href="\/llm-wiki"/);
  assert.match(quizzes, /Newest first/);
  assert.doesNotMatch(quizzes, /<PageFrame|className="prose-notion"|<main style=\{\{/);
  assert.match(quizzesCss, /radial-gradient\(68rem 42rem at 50% -18%, rgba\(232, 236, 238, 0\.14\)/);
  assert.match(quizzesCss, /backdrop-filter:\s*blur\(30px\) saturate\(108%\)/);
  assert.match(quizzesCss, /\.statRail\s*\{/);
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
  assert.match(pursuitPage, /metadata = \{ title: 'Question · Loom' \}/);
  assert.match(pursuitPage, /<PursuitPageClient \/>/);
  assert.match(pursuitPage, /import PursuitPageClient from '\.\/PursuitPageClient'/);
  assert.match(pursuitDetail, /LoomGlobalNav/);
  assert.match(pursuitDetail, /ariaLabel="Pursuit navigation"/);
  assert.match(globals, /\.loom-panel-detail\s*\{[\s\S]*padding-top:\s*5rem/);
  assert.match(globals, /@media \(max-width:\s*760px\)\s*\{[\s\S]*\.loom-panel-detail\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(globals, /\.loom-panel-detail-title\s*\{[\s\S]*overflow-wrap:\s*anywhere/);
});

test('native menus and shortcut help do not expose old thinking product labels', () => {
  const app = read('macos-app/Loom/Sources/LoomApp.swift');
  const keyboardHelp = read('macos-app/Loom/Sources/KeyboardHelpView.swift');
  const contentView = read('macos-app/Loom/Sources/ContentView.swift');
  const shuttle = read('macos-app/Loom/Sources/ShuttleView.swift');
  const commandScripts = read('macos-app/Loom/Sources/LoomCommandScripts.swift');
  const askAIWindow = read('macos-app/Loom/Sources/AskAIWindow.swift');
  const visibleSources = [app, keyboardHelp, contentView, shuttle].join('\n');

  for (const retired of [
    /Button\("Hold a Question/,
    /Button\("Add a Sōan Card/,
    /Button\("Connect Sōan Cards/,
    /Button\("Weave Two Panels/,
    /Button\("Learn"/,
    /Button\("Ingestion"/,
    /Text\("Hold a Question/,
    /Text\("Add a Card to Sōan/,
    /Text\("Sōan needs/,
    /Text\("Weave Two Panels/,
    /label: "Hold a Question/,
    /label: "Add a Sōan Card/,
    /label: "Connect Sōan Cards/,
    /label: "Weave Two Panels/,
    /Button\("Rehearsal"/,
    /Button\("Examiner"/,
    /Button\("Reconstructions"/,
    /label:\s*"Rehearsal/,
    /label:\s*"Examiner/,
    /label:\s*"Reconstructions/,
    /label: "Rehearsal/,
    /label: "Examiner/,
    /label: "Reconstructions/,
    /AI quizzes/i,
  ]) {
    assert.doesNotMatch(visibleSources, retired);
  }

  for (const retiredHelpCopy of [
    /thought-anchor/i,
    /warp thread/i,
    /current weave/i,
    /thought map/i,
    /Deepen a panel from memory/i,
    /Verify understanding/i,
    /Tools \(via ⌘P\)/,
    /link material \+ chip/i,
  ]) {
    assert.doesNotMatch(keyboardHelp, retiredHelpCopy);
  }

  assert.match(app, /Button\("Add Question…"\)/);
  assert.match(app, /Button\("Add Draft Card…"\)/);
  assert.match(app, /Button\("Connect Draft Cards…"\)/);
  assert.match(app, /Button\("Connect Reader Notes…"\)/);
  assert.match(app, /Button\("Ask Selection"\)/);

  assert.match(contentView, /Text\("Add Question"\)/);
  assert.match(contentView, /Text\("Add a Draft Card"\)/);
  assert.match(contentView, /Text\("Connect Draft Cards"\)/);
  assert.match(contentView, /Text\("Draft needs at least two cards/);
  assert.match(contentView, /Text\("Supports"\)\.tag\("support"\)/);
  assert.match(contentView, /Text\("Related"\)\.tag\("echo"\)/);
  assert.match(commandScripts, /return 'empty-selection'/);
  assert.doesNotMatch(commandScripts, /id: 'rehearsal'|loom:overlay:open|loom:overlay:toggle/);
  assert.doesNotMatch(askAIWindow, /Send to Rehearsal|citeIntoRehearsal|RehearsalContext\.shared/);
  assert.doesNotMatch(contentView, /Text\("Connect Two Cards"\)/);
  assert.doesNotMatch(contentView, /support \(solid bronze\)/);
  assert.match(contentView, /Text\("Connect Reader Notes"\)/);
  assert.match(contentView, /Text\("\(choose a reader note\)"\)\.tag\(""\)/);
  assert.doesNotMatch(contentView, /Text\("\(choose a panel\)"\)/);
  assert.match(contentView, /Text\("Supports"\)\.tag\("supports"\)/);
  assert.match(contentView, /Text\("Contradicts"\)\.tag\("contradicts"\)/);
  assert.match(contentView, /Text\("Adds detail"\)\.tag\("elaborates"\)/);
  assert.match(contentView, /Text\("Related"\)\.tag\("echoes"\)/);
  assert.doesNotMatch(
    contentView,
    /Text\("supports"\)|Text\("contradicts"\)|Text\("elaborates"\)|Text\("echoes"\)/,
  );

  assert.match(keyboardHelp, /Group\(title: "Draft and notes"/);
  assert.match(keyboardHelp, /label: "Add question/);
  assert.match(keyboardHelp, /label: "Add draft card/);
  assert.match(keyboardHelp, /label: "Connect draft cards/);
  assert.match(keyboardHelp, /label: "Connect reader notes/);
  assert.doesNotMatch(keyboardHelp, /Group\(title: "Cowork/);
  assert.doesNotMatch(keyboardHelp, /Actions \(replace main view\)/);
  assert.doesNotMatch(keyboardHelp, /scratch/i);
});

test('default-visible product copy uses literal Sources and Draft vocabulary', () => {
  const files = {
    'app/layout.tsx': read('app/layout.tsx'),
    'public/support.html': read('public/support.html'),
    'public/privacy.html': read('public/privacy.html'),
    'app/onboarding/OnboardingClient.tsx': read('app/onboarding/OnboardingClient.tsx'),
    'app/product-history/page.tsx': [
      read('app/product-history/page.tsx'),
      read('components/product-history/ProductHistoryPage.tsx'),
    ].join('\n'),
    'app/cover/page.tsx': read('app/cover/page.tsx'),
    'app/frontispiece/page.tsx': read('app/frontispiece/page.tsx'),
    'app/draft/DraftClient.tsx': read('app/draft/DraftClient.tsx'),
    'components/KeyboardShortcuts.tsx': read('components/KeyboardShortcuts.tsx'),
    'components/RehearseThisButton.tsx': read('components/RehearseThisButton.tsx'),
    'components/CapturePrompt.tsx': read('components/CapturePrompt.tsx'),
    'components/ReviewThoughtMap.tsx': read('components/ReviewThoughtMap.tsx'),
    'components/RefreshCoach.tsx': read('components/RefreshCoach.tsx'),
    'components/LiveArtifact.tsx': read('components/LiveArtifact.tsx'),
    'components/AnchorCard.tsx': read('components/AnchorCard.tsx'),
    'components/SelectionWarp.tsx': read('components/SelectionWarp.tsx'),
    'app/about/AboutClient.tsx': read('app/about/AboutClient.tsx'),
    'app/ColophonClient.tsx': read('app/ColophonClient.tsx'),
    'lib/ai/stage-model.ts': read('lib/ai/stage-model.ts'),
    'lib/new-loom/product-shell.ts': read('lib/new-loom/product-shell.ts'),
    'macos-app/Loom/Sources/RehearsalView.swift': read('macos-app/Loom/Sources/RehearsalView.swift'),
    'macos-app/Loom/Sources/ExaminerView.swift': read('macos-app/Loom/Sources/ExaminerView.swift'),
    'macos-app/Loom/Sources/ReconstructionsView.swift': read('macos-app/Loom/Sources/ReconstructionsView.swift'),
    'macos-app/Loom/Sources/FirstRunProviderSheet.swift': read('macos-app/Loom/Sources/FirstRunProviderSheet.swift'),
    'macos-app/Loom/Sources/AboutView.swift': read('macos-app/Loom/Sources/AboutView.swift'),
    'macos-app/Loom/Sources/IngestionView.swift': read('macos-app/Loom/Sources/IngestionView.swift'),
    'macos-app/Loom/Sources/AIProviderSettingsView.swift': read('macos-app/Loom/Sources/AIProviderSettingsView.swift'),
    'macos-app/Loom/Sources/KnowledgeSidebarView.swift': read('macos-app/Loom/Sources/KnowledgeSidebarView.swift'),
    'macos-app/Loom/Sources/ShuttleView.swift': read('macos-app/Loom/Sources/ShuttleView.swift'),
    'macos-app/Loom/Sources/CaptureSheet.swift': read('macos-app/Loom/Sources/CaptureSheet.swift'),
  };

  const forbidden = [
    /Weave lasting patterns/,
    /margin weaver/,
    /rehearsal, or examiner/,
    /traces, panels, weaves/,
    /panels, weaves/,
    /quiz attempts/,
    /Settle the current weave/,
    /Rehearse this/,
    /Start a rehearsal/,
    /second weaver/,
    /All threads respected/,
    /Capture AI thread/,
    /Import and organize material/,
    /Run `npm run ingest`/,
    /Run npm run ingest/,
    /Thought Map/,
    /Settled into Patterns/,
    /This weave is still taking shape\./,
    /Local thread locked/,
    /keep weaving here/,
    /Button\("Ingest"\)/,
    /panel\.prompt = "Ingest"/,
    /Text\("Ingest"\)/,
    /Text\("INGESTED"\)/,
    /Nothing ingested yet/,
    /Text\("Rehearsal"\)/,
    /Text\("Examiner"\)/,
    /No reconstructions yet/,
    /Complete a rehearsal/,
    /Back to Rehearsal/,
    /Re-finalized/,
    /examiner pass/,
    /Today weave/,
    /Recompile the current weave/,
    /launcherTitle: 'Import'/,
    /Ingest one source/,
    /first thread/,
    /organized note/,
    /Import, capture, organize/,
    /Panels are earned/,
    /Relations are earned/,
    /The Name, Unwoven/,
    /Woven by/,
    /Frontispiece ·/,
    /The second voice\./,
    /A room for your books\./,
    /Write from collected material/,
  ];

  for (const [file, text] of Object.entries(files)) {
    for (const pattern of forbidden) {
      assert.doesNotMatch(text, pattern, `${file} should not expose ${pattern}`);
    }
  }

  assert.match(files['app/layout.tsx'], /Add sources and draft clear writing from them\./);
  assert.match(files['app/onboarding/OnboardingClient.tsx'], /<Eyebrow>Setup · Sources<\/Eyebrow>/);
  assert.match(files['app/cover/page.tsx'], /redirect\('\/sources'\)/);
  assert.doesNotMatch(files['app/cover/page.tsx'], /CoverClient/);
  assert.match(files['app/frontispiece/page.tsx'], /redirect\('\/sources'\)/);
  assert.doesNotMatch(files['app/frontispiece/page.tsx'], /FrontispieceClient/);
  assert.match(files['app/about/AboutClient.tsx'], /personal knowledge identity platform/);
  assert.match(files['app/about/AboutClient.tsx'], /How Loom serves the archive/);
  assert.match(files['app/about/AboutClient.tsx'], /Product story/);
  assert.match(files['app/about/AboutClient.tsx'], /source-bound memory system/);
  assert.match(files['app/about/AboutClient.tsx'], /\/product-history/);
  assert.match(files['app/product-history/page.tsx'], /Source-backed self\. Living archive\./);
  assert.match(files['app/product-history/page.tsx'], /Proof changed the line/);
  assert.match(files['app/about/AboutClient.tsx'], /Publish the artifact/);
  assert.match(files['macos-app/Loom/Sources/AboutView.swift'], /personal knowledge identity platform/);
  assert.match(files['macos-app/Loom/Sources/AboutView.swift'], /History/);
  for (const pattern of [
    /RehearsalOverlay/,
    /ExaminerOverlay/,
    /RecursingOverlay/,
    /<RehearsalOverlay/,
    /<ExaminerOverlay/,
    /<RecursingOverlay/,
  ]) {
    assert.doesNotMatch(files['app/layout.tsx'], pattern);
  }
  assert.doesNotMatch(files['components/ReviewThoughtMap.tsx'], /openLoomOverlay\(\{ id: 'rehearsal'|openLoomOverlay\(\{ id: 'examiner'/);
  assert.doesNotMatch(files['components/RefreshCoach.tsx'], /openLoomOverlay/);
  assert.match(files['components/ReviewThoughtMap.tsx'], /router\.push\('\/draft'\)/);
  assert.match(files['components/ReviewThoughtMap.tsx'], /router\.push\('\/sources#reader-notes'\)/);
  assert.match(files['components/RefreshCoach.tsx'], /router\.push\('\/draft'\)/);
  assert.match(files['components/RefreshCoach.tsx'], /router\.push\('\/sources#reader-notes'\)/);
  assert.match(files['components/RefreshCoach.tsx'], /Reader notes updated/);
  assert.match(files['components/RefreshCoach.tsx'], /Review saved/);
  assert.match(files['lib/ai/stage-model.ts'], /launcherTitle: 'Ask Loom'/);
  assert.match(files['lib/ai/stage-model.ts'], /title: 'Add one source'/);
  assert.match(files['lib/ai/stage-model.ts'], /launcherTitle: 'Add source'/);
  assert.match(files['lib/ai/stage-model.ts'], /One source page · one reader note/);
  assert.match(files['lib/new-loom/product-shell.ts'], /Add learning paths/);
  assert.doesNotMatch(files['lib/new-loom/product-shell.ts'], /Collect learning paths/);
  assert.match(files['public/support.html'], /source questions, drafting help, or rewrite suggestions/);
  assert.match(files['public/privacy.html'], /reader notes, source connections, drafts/);
  assert.match(files['components/KeyboardShortcuts.tsx'], /\['⌘ \/', 'Open reader notes'\]/);
  assert.match(files['components/RehearseThisButton.tsx'], /Review this source/);
  assert.match(files['components/ReviewThoughtMap.tsx'], /Reader notes/);
  assert.match(files['components/ReviewThoughtMap.tsx'], /Saved to reader notes/);
  assert.match(files['macos-app/Loom/Sources/RehearsalView.swift'], /Text\("Source practice"\)/);
  assert.match(files['macos-app/Loom/Sources/RehearsalView.swift'], /Button\("Save & Check"\)/);
  assert.match(files['macos-app/Loom/Sources/ExaminerView.swift'], /Text\("Source check"\)/);
  assert.match(files['macos-app/Loom/Sources/ExaminerView.swift'], /Button\("Back to Source practice"\)/);
  assert.match(files['macos-app/Loom/Sources/ReconstructionsView.swift'], /Text\("No practice notes yet"\)/);
  assert.match(files['macos-app/Loom/Sources/IngestionView.swift'], /Text\("ADDED"\)/);
  assert.match(files['macos-app/Loom/Sources/IngestionView.swift'], /Text\("No files added yet\."\)/);
  assert.match(files['macos-app/Loom/Sources/FirstRunProviderSheet.swift'], /draft from sources/);
  assert.match(files['macos-app/Loom/Sources/FirstRunProviderSheet.swift'], /Setup · i of ii/);
  assert.match(files['macos-app/Loom/Sources/FirstRunProviderSheet.swift'], /Choose your sources folder\./);
  assert.match(files['macos-app/Loom/Sources/AIProviderSettingsView.swift'], /Text\("Source extraction"\)/);
  assert.match(files['macos-app/Loom/Sources/CaptureSheet.swift'], /Save AI conversation/);
});

test('native Data settings labels old storage buckets with new Loom vocabulary', () => {
  const dataSettings = read('macos-app/Loom/Sources/DataSettingsView.swift');
  const dataRows = read('macos-app/Loom/Sources/DataSettingsRows.swift');
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
  const picker = read('macos-app/Loom/Sources/Views/Ingest/FragmentDestinationPicker.swift');
  const schemaView = read('macos-app/Loom/Sources/Views/Ingest/FragmentSchemaView.swift');
  const ingestionView = read('macos-app/Loom/Sources/IngestionView.swift');
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
  const bridge = read('macos-app/Loom/Sources/NavigationBridgeHandler.swift');

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

test('Draft opens with incoming source references even when a draft already exists', () => {
  const draftClient = read('app/draft/DraftClient.tsx');

  assert.match(draftClient, /mergeDraftReferences/);
  assert.match(draftClient, /const incomingReferences = referencesFromLocation\(\)/);
  assert.match(draftClient, /const nativeStore = nativeDraftStorage\(\)/);
  assert.match(
    draftClient,
    /const nativeDraft = await loadNativeDraft\(nativeStore, incomingReferences\)/,
  );
  assert.match(
    draftClient,
    /const mergedReferences = existing[\s\S]*mergeDraftReferences\(existing\.references, incomingReferences\)/,
  );
  assert.match(draftClient, /await nativeStore\.update\(existing\.id, patch\)/);
  assert.match(
    draftClient,
    /updateDraft\(fallbackStorage, existing\.id, \{ references: mergedReferences \}/,
  );
  assert.match(draftClient, /draftReferencesChanged\(existing\.references, mergedReferences\)/);
});

test('Draft absorbs Workbench writing behavior instead of leaving it on the legacy route', () => {
  const draftClient = read('app/draft/DraftClient.tsx');

  assert.match(draftClient, /SAVE_DEBOUNCE_MS/);
  assert.match(draftClient, /importWorkbenchDraft/);
  assert.match(draftClient, /draftWordCount\(body\)/);
  assert.match(draftClient, /const saveTimer = useRef<number \| null>\(null\)/);
  assert.match(draftClient, /window\.setTimeout\(\(\) => \{/);
  assert.match(draftClient, /const next = await persistDraft\(\s*currentDraft,\s*nextTitle,\s*nextBody/);
  assert.match(draftClient, /nativeStore\.update\(currentDraft\.id/);
  assert.match(draftClient, /updateDraft\(fallbackStorage, currentDraft\.id/);
  assert.match(draftClient, /wordCount === 1 \? 'word' : 'words'/);
});

test('web Draft uses the native-backed Draft bridge inside the installed app', () => {
  const draftClient = read('app/draft/DraftClient.tsx');
  const nativeDraftClient = read('lib/new-loom/native-draft-client.ts');
  const draftBridge = read('macos-app/Loom/Sources/DraftBridgeHandler.swift');
  const contentView = read('macos-app/Loom/Sources/ContentView.swift');
  const plan = read('docs/projects/active/2026-05-09-legacy-surface-migration-plan.md');

  assert.match(nativeDraftClient, /loomDrafts/);
  assert.match(nativeDraftClient, /postMessage\(\{ action: 'list' \}\)/);
  assert.match(nativeDraftClient, /postMessage\(\{ action: 'create'/);
  assert.match(nativeDraftClient, /postMessage\(\{ action: 'update'/);
  assert.match(nativeDraftClient, /NewLoomDraftRecord/);

  assert.match(draftClient, /nativeDraftStorage/);
  assert.match(draftClient, /await nativeStore\.list\(\)/);
  assert.match(draftClient, /await nativeStore\.create/);
  assert.match(draftClient, /await persistDraft/);
  assert.doesNotMatch(
    draftClient,
    /const storage = browserDraftStorage\(\);\s*\n\s*if \(!storage\)/,
  );

  assert.match(draftBridge, /WKScriptMessageHandlerWithReply/);
  assert.match(draftBridge, /static let name = "loomDrafts"/);
  assert.match(draftBridge, /LoomDraftStore/);
  assert.match(draftBridge, /case "list"/);
  assert.match(draftBridge, /case "create"/);
  assert.match(draftBridge, /case "update"/);

  assert.match(contentView, /let draftBridge = DraftBridgeHandler\(\)/);
  assert.match(contentView, /name: DraftBridgeHandler\.name/);
  assert.match(plan, /Native-backed Draft bridge/);
});

test('web Draft opens attached references through the installed-app navigation bridge', () => {
  const draftClient = read('app/draft/DraftClient.tsx');
  const bridge = read('macos-app/Loom/Sources/NavigationBridgeHandler.swift');

  assert.match(draftClient, /type LoomNavigateWindow = \{/);
  assert.match(
    draftClient,
    /function callNativeBridge\(action: string, payload\?: Record<string, unknown>\)/,
  );
  assert.match(
    draftClient,
    /function openDraftReference\(\s*\n\s*event: \{ preventDefault\(\): void \},\s*\n\s*reference: Pick<NewLoomDraftReference, 'href' \| 'label' \| 'kind'>/,
  );
  assert.match(
    draftClient,
    /callNativeBridge\([\s\S]{0,80}'openReference'[\s\S]{0,160}href: reference\.href[\s\S]{0,120}label: reference\.label[\s\S]{0,120}kind: reference\.kind[\s\S]{0,80}\)/,
  );
  assert.match(draftClient, /onClick=\{\(event\) => openDraftReference\(event, realReference\)\}/);
  assert.match(draftClient, /onClick=\{\(event\) => openDraftReference\(event, match\)\}/);

  assert.match(bridge, /case "openReference":\s*\n\s*handleOpenReference\(body: payload\)/);
  assert.match(bridge, /private func handleOpenReference\(body: \[String: Any\]\)/);
  assert.match(
    bridge,
    /if kind == "capture" \|\| kind == "artifact-state" \|\| url\.absoluteString\.contains\("\/loom-render\/capture\/"\)/,
  );
  assert.match(bridge, /name: \.loomOpenCapture/);
  assert.match(bridge, /if url\.scheme == "loom", url\.host == "content"/);
  assert.match(
    bridge,
    /name: url\.pathExtension\.isEmpty \? \.loomShowFolderHome : \.loomOpenSourceFile/,
  );
  assert.match(bridge, /if url\.scheme == "loom"/);
  assert.match(bridge, /postProductNavigation\("\/sources"\)/);
  assert.match(bridge, /NSWorkspace\.shared\.open\(url\)/);
});

test('Draft composes with AI through the installed-app stream bridge', () => {
  const draftClient = read('app/draft/DraftClient.tsx');
  const draftStorage = read('lib/new-loom/draft-storage.ts');
  const nativeDraftView = read('macos-app/Loom/Sources/LoomDraftView.swift');
  const stageModel = read('lib/ai/stage-model.ts');
  const runtime = read('lib/ai/runtime.ts');
  const streamBridge = read('lib/ai-stream-bridge.ts');
  const contentView = read('macos-app/Loom/Sources/ContentView.swift');
  const plan = read('docs/projects/active/2026-05-09-legacy-surface-migration-plan.md');

  assert.match(draftClient, /import \{ callAiPrompt \} from '\.\.\/\.\.\/lib\/ai\/runtime'/);
  assert.match(draftClient, /function buildDraftAIPrompt/);
  assert.match(draftClient, /buildBoundedDraftAIPrompt/);
  assert.match(draftStorage, /buildBoundedDraftAIPrompt/);
  assert.match(draftStorage, /draftReferencePromptLines/);
  assert.match(draftStorage, /export function draftReferencePromptLines/);
  assert.match(draftStorage, /capturedAt \? `capturedAt=\$\{capturedAt\}` : ''/);
  assert.match(draftStorage, /artifactStateData=\$\{artifactStateData\}/);
  assert.match(draftClient, /function appendAISuggestionToBody/);
  assert.match(draftClient, /const \[aiSuggestion, setAiSuggestion\]/);
  assert.match(
    draftClient,
    /callAiPrompt\([\s\S]{0,120}'draft-compose'[\s\S]{0,120}buildDraftAIPrompt\(\{ title, body, references, corpusHits \}\)/,
  );
  assert.match(draftClient, /onDelta: \(_delta, full\) => setAiSuggestion\(full\)/);
  assert.match(draftClient, /setBody\(nextBody\)/);
  // Body-mutating saves now also thread the re-derived blocks so the canonical
  // block document never diverges from the synced body (Studio Phase 1, Task 4).
  assert.match(draftClient, /scheduleSave\(title, nextBody(?:, nextBlocks)?\)/);
  assert.match(draftClient, /Continue with AI/);
  assert.match(draftClient, /AI draft/);
  assert.match(draftClient, /Insert AI text/);
  assert.match(draftClient, /Discard/);

  assert.match(nativeDraftView, /enum LoomDraftAIPrompt/);
  assert.match(nativeDraftView, /static func buildDraftAIPrompt/);
  assert.match(nativeDraftView, /clean\(reference\.capturedAt\)\.map \{ "capturedAt=\\\(\$0\)" \}/);
  assert.match(nativeDraftView, /static func artifactStatePromptData/);
  assert.match(nativeDraftView, /artifactStateData=\\\(\$0\)/);
  assert.match(nativeDraftView, /static func appendAISuggestionToBody/);
  assert.match(nativeDraftView, /@State private var aiSuggestion: String = ""/);
  assert.match(nativeDraftView, /private var aiDraftInspectorPanel: some View/);
  assert.match(nativeDraftView, /private var draftNextActionPanel: some View/);
  assert.match(nativeDraftView, /LoomAI\.sendStream/);
  assert.match(
    nativeDraftView,
    /prompt: LoomDraftAIPrompt\.buildDraftAIPrompt\(title: title, body: draftBody, references: references, corpusHits: corpusHits\)/,
  );
  assert.match(nativeDraftView, /aiSuggestion \+= chunk/);
  assert.match(nativeDraftView, /draftBody = nextBody/);
  assert.match(nativeDraftView, /save\(\)/);
  assert.match(nativeDraftView, /Button\(draftPrimaryActionTitle\)/);
  assert.match(nativeDraftView, /Button\("Insert AI text"\)/);
  assert.match(nativeDraftView, /Button\("Discard"\)/);

  assert.match(stageModel, /'draft-compose'/);
  assert.match(stageModel, /id: 'draft'/);
  assert.match(stageModel, /family: 'draft'/);
  assert.match(stageModel, /role: 'drafting partner'/);
  assert.match(runtime, /askAIStream/);
  assert.match(streamBridge, /loomAIStream/);
  assert.match(contentView, /AIStreamBridgeHandler/);
  assert.match(plan, /Draft AI composition step/);
});

test('web Draft collapses legacy panels into a segmented inspector beside one writing surface', () => {
  const draftClient = read('app/draft/DraftClient.tsx');
  const globals = read('app/globals.css');

  assert.match(draftClient, /type DraftInspectorMode = 'sources' \| 'edit' \| 'board'/);
  assert.match(
    draftClient,
    /const \[inspectorMode, setInspectorMode\] = useState<DraftInspectorMode>\('sources'\)/,
  );
  assert.match(draftClient, /className="new-loom-draft__main"/);
  assert.match(draftClient, /className="new-loom-draft__inspector"/);
  assert.match(draftClient, /className="new-loom-draft__inspector-tabs"/);
  assert.match(draftClient, /aria-pressed=\{inspectorMode === mode\}/);
  assert.match(draftClient, /inspectorMode === 'sources'/);
  assert.match(draftClient, /inspectorMode === 'edit'/);
  assert.match(draftClient, /inspectorMode === 'board'/);
  assert.match(draftClient, /Keep writing from this point/);

  assert.match(globals, /\.new-loom-draft__main\b/);
  assert.match(globals, /\.new-loom-draft__inspector\b/);
  assert.match(globals, /\.new-loom-draft__inspector-tabs\b/);
  assert.doesNotMatch(
    globals,
    /\.new-loom-draft__editor,\s*\n\s*\.new-loom-draft__references,\s*\n\s*\.new-loom-draft__board/,
    'Draft should not style editor, references, and board as three sibling cards',
  );
  assert.doesNotMatch(
    cssRulesContaining(globals, '.new-loom-draft__source-tiles'),
    /grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/,
    'Draft source inspector should be a scannable list, not a two-column tile grid',
  );
  assert.doesNotMatch(
    globals,
    /\.new-loom-draft__board\s*\{[\s\S]{0,120}grid-column:\s*1 \/ -1/,
    'Draft board should live inside the inspector mode, not as a full-width page card',
  );
});

test('web Draft AI stream bridge audits provider body and routes Apple Foundation explicitly', () => {
  const streamBridgeHandler = read('macos-app/Loom/Sources/AIStreamBridgeHandler.swift');

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
  const sourceFileView = read('macos-app/Loom/Sources/SourceFileView.swift');
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
  assert.match(sourceFileView, /LoomTokens\.dsThread/);
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

test('Draft AI prompt carries inline @references with page slide and heading anchors', () => {
  const draftClient = read('app/draft/DraftClient.tsx');
  const draftStorage = read('lib/new-loom/draft-storage.ts');
  const nativeDraftView = read('macos-app/Loom/Sources/LoomDraftView.swift');
  const swiftTests = read('macos-app/Loom/Tests/LoomDraftStoreTests.swift');
  const loomDoc = read('docs/loom.md');

  assert.match(draftStorage, /export type NewLoomDraftInlineReferenceAnchor/);
  assert.match(draftStorage, /parseDraftInlineReferences/);
  assert.match(draftStorage, /draftInlineReferencePromptLines/);
  assert.match(draftStorage, /findInlineReferenceCorpusMatch/);
  assert.match(draftStorage, /findInlineArtifactStateReference/);
  assert.match(draftStorage, /inlineArtifactStateMatchesAnchor/);
  assert.match(draftStorage, /artifactStateData=/);
  assert.match(draftStorage, /draftReferenceMentionToken/);
  assert.match(draftStorage, /function draftArtifactStateMentionSuffix/);
  assert.match(draftStorage, /#\$\{anchor\}:state/);
  assert.match(
    draftStorage,
    /if \(cleanArtifactState\(doc\.artifactState\)\) return 'artifact-state'/,
  );
  assert.match(draftStorage, /insertDraftReferenceMention/);
  assert.match(draftStorage, /activeDraftReferenceMention/);
  assert.match(draftStorage, /rankDraftReferenceCandidates/);
  assert.match(draftStorage, /predictDraftNextReferences/);
  assert.match(draftStorage, /kind: 'page' \| 'slide' \| 'heading' \| 'artifact-state'/);
  assert.match(draftStorage, /inferPageOrSlideKind/);
  assert.match(draftStorage, /fragment\.includes\(': '\)|fragment\.includes\(':'\)/);
  assert.match(draftStorage, /buildBoundedDraftAIPrompt/);
  assert.match(draftStorage, /buildBoundedDraftInlineEditPrompt/);
  assert.match(
    draftStorage,
    /draftInlineReferencePromptLines\([\s\S]{0,120}input\.body[\s\S]{0,120}input\.references[\s\S]{0,120}input\.corpusHits \?\? \[\][\s\S]{0,80}\)/,
  );
  assert.match(draftStorage, /Inline @references:/);
  assert.match(draftClient, /referencePickerQuery/);
  assert.match(draftClient, /Reference search/);
  assert.match(draftClient, /insertDraftReferenceMention/);
  assert.match(
    draftClient,
    /syncReferencePickerWithMention\(nextBody,\s*event\.target\.selectionStart/,
  );
  assert.match(draftClient, /activeDraftReferenceMention\(nextBody,\s*cursor\)/);
  assert.match(
    draftClient,
    /rankDraftReferenceCandidates\(referencePickerQuery, referencePickerDocs/,
  );
  assert.match(draftClient, /predictDraftNextReferences\(\{/);
  assert.match(draftClient, /Suggested references/);

  assert.match(nativeDraftView, /struct LoomDraftInlineReferenceAnchor/);
  assert.match(nativeDraftView, /struct LoomDraftInlineReference/);
  assert.match(nativeDraftView, /enum LoomDraftInlineReferenceParser/);
  assert.match(nativeDraftView, /enum LoomDraftReferenceMention/);
  assert.match(nativeDraftView, /artifactStateMentionSuffix\(for:/);
  assert.match(nativeDraftView, /#\\\(anchor\):state/);
  assert.match(
    nativeDraftView,
    /if LoomDraftQuoteFormatter\.cleanArtifactState\(doc\.artifactState\) != nil \{ return "artifact-state" \}/,
  );
  assert.match(nativeDraftView, /static func promptLines/);
  assert.match(nativeDraftView, /corpusHits: \[LoomDraftCorpusHit\] = \[\]/);
  assert.match(nativeDraftView, /findCorpusMatch/);
  assert.match(nativeDraftView, /findArtifactStateMatch/);
  assert.match(nativeDraftView, /artifactStateData=/);
  assert.match(nativeDraftView, /showReferencePicker/);
  assert.match(nativeDraftView, /DocReferencePicker/);
  assert.match(nativeDraftView, /insertReferenceMention/);
  assert.match(nativeDraftView, /activeQuery\(in: draftBody, selectedRange: draftSelectionRange\)/);
  assert.match(nativeDraftView, /rank\(\s*query: activeMention\.query,\s*docs: referenceIndexDocs/);
  assert.match(nativeDraftView, /predictNext\(\s*title: title,\s*body: draftBody/);
  assert.match(nativeDraftView, /Text\("Suggested"\)/);
  assert.match(nativeDraftView, /suggestedReferenceRow\(doc\)/);
  assert.match(nativeDraftView, /"Inline @references:\\n\\\(inlineReferenceText\)"/);
  assert.match(swiftTests, /testDraftAIPromptIncludesInlineReferenceAnchors/);
  assert.match(swiftTests, /testDraftAIPromptIncludesInlineArtifactStateData/);
  assert.match(swiftTests, /testDraftAIPromptResolvesInlineReferencesFromCorpusHits/);
  assert.match(swiftTests, /testDraftReferenceMentionInsertsTokenAndReference/);
  assert.match(swiftTests, /testActiveDraftReferenceMentionQueryAndRanking/);
  assert.match(swiftTests, /testDraftReferenceMentionPredictsNextReferences/);
  assert.match(swiftTests, /@moodle-econ-w4-slides:p7/);
  assert.match(swiftTests, /@thesis-draft\.pdf:p23-25/);
  assert.match(swiftTests, /@meeting-notes-mar-15\.md#decisions/);
  assert.match(swiftTests, /@flipdisc-tutorial#floyd-bayer-slider:0\.4/);
  assert.match(loomDoc, /`@` 引用 origin-agnostic[\s\S]{0,320}Draft AI prompt/);
});

test('Draft AI uses whole-corpus context by default before composing', () => {
  const draftClient = read('app/draft/DraftClient.tsx');
  const nativeDraftView = read('macos-app/Loom/Sources/LoomDraftView.swift');
  const draftStorage = read('lib/new-loom/draft-storage.ts');
  const embeddingStore = read('macos-app/Loom/Sources/LoomEmbeddingStore.swift');
  const captureSheet = read('macos-app/Loom/Sources/CaptureSheet.swift');
  const searchIndexBuilder = read('scripts/build-search-index.ts');
  const askAIWindow = read('macos-app/Loom/Sources/AskAIWindow.swift');

  assert.match(draftStorage, /export type NewLoomDraftCorpusHit/);
  assert.match(draftStorage, /artifactState\?: NewLoomDraftArtifactState/);
  assert.match(draftStorage, /export function selectDraftCorpusHits/);
  assert.match(draftStorage, /export function draftCorpusPromptLines/);
  assert.match(draftStorage, /artifactStateData=/);
  assert.match(
    draftClient,
    /import \{ fetchSearchIndex \} from '\.\.\/\.\.\/lib\/search-index-client'/,
  );
  assert.match(draftClient, /async function loadDraftCorpusContext/);
  assert.match(draftClient, /artifactState\?:/);
  assert.match(draftClient, /cleanSearchIndexArtifactState/);
  assert.match(draftStorage, /Corpus context:/);
  assert.match(draftStorage, /buildBoundedDraftAIPrompt/);
  assert.match(draftStorage, /buildBoundedDraftInlineEditPrompt/);
  assert.match(draftClient, /buildDraftAIPrompt\(\{ title, body, references, corpusHits \}\)/);
  assert.match(nativeDraftView, /struct LoomDraftCorpusHit/);
  assert.match(nativeDraftView, /var artifactState: LoomDraftArtifactState\? = nil/);
  assert.match(nativeDraftView, /enum LoomDraftCorpusContext/);
  assert.match(nativeDraftView, /LoomEmbeddingStore\.similarAcrossAllRoots\(to: body/);
  assert.match(nativeDraftView, /artifactStateData=/);
  assert.match(nativeDraftView, /Corpus context:/);
  assert.match(
    nativeDraftView,
    /buildDraftAIPrompt\(title: title, body: draftBody, references: references, corpusHits:/,
  );
  assert.match(askAIWindow, /let artifactState: LoomDraftArtifactState\?/);
  assert.match(askAIWindow, /artifactState\(from: fields\)/);
  assert.match(askAIWindow, /fields\["artifactState"\] as\? \[String: Any\]/);
  assert.match(askAIWindow, /fields\["artifactTargetId"\]/);
  assert.match(askAIWindow, /fields\["artifactStateData"\]/);
  assert.match(embeddingStore, /let artifactStates: \[LoomDraftArtifactState\]\?/);
  assert.match(embeddingStore, /artifactStates: \[LoomDraftArtifactState\] = \[\]/);
  assert.match(captureSheet, /embeddingArtifactStates\(from: working\.captureAST\)/);
  assert.match(
    captureSheet,
    /private static func embeddingArtifactStates\(from ast: CaptureAST\?\)/,
  );
  assert.match(searchIndexBuilder, /artifactState\?: ArtifactStateField/);
  assert.match(
    searchIndexBuilder,
    /storeFields: \['title', 'href', 'category', 'subcategory', 'sourcePath', 'body', 'artifactState'\]/,
  );
});

test('Draft exposes Cmd-K inline edit with explicit accept and discard', () => {
  const draftClient = read('app/draft/DraftClient.tsx');
  const draftStorage = read('lib/new-loom/draft-storage.ts');
  const nativeDraftView = read('macos-app/Loom/Sources/LoomDraftView.swift');
  const swiftTests = read('macos-app/Loom/Tests/LoomDraftStoreTests.swift');
  const loomDoc = read('docs/loom.md');

  assert.match(draftStorage, /export type NewLoomDraftInlineEdit/);
  assert.match(draftStorage, /export type NewLoomDraftInlineEditDiffHunk/);
  assert.match(draftStorage, /export function applyDraftInlineEdit/);
  assert.match(draftStorage, /export function draftInlineEditDiffHunks/);
  assert.match(draftStorage, /body\.slice\(edit\.start, edit\.end\) !== edit\.original/);

  assert.match(draftClient, /applyDraftInlineEdit/);
  assert.match(draftClient, /bodyTextareaRef/);
  assert.match(draftClient, /inlineEditSelection/);
  assert.match(draftClient, /function buildDraftInlineEditPrompt/);
  assert.match(draftClient, /function startInlineEdit/);
  assert.match(draftClient, /function acceptInlineEdit/);
  assert.match(draftClient, /onKeyDown=\{\(event\) => \{/);
  assert.match(draftClient, /event\.key\.toLowerCase\(\) === 'k'/);
  assert.match(draftClient, /AI edit/);
  assert.match(draftClient, /Diff preview/);
  assert.match(
    draftClient,
    /draftInlineEditDiffHunks\([\s\S]{0,120}inlineEditSelection\.original[\s\S]{0,120}inlineEditSuggestion[\s\S]{0,80}\)/,
  );
  assert.match(draftClient, /Accept edit/);
  assert.match(draftClient, /Discard edit/);

  assert.match(nativeDraftView, /SelectableTextEditor/);
  assert.match(nativeDraftView, /CommandKTrap/);
  assert.match(nativeDraftView, /@State private var draftSelectionRange/);
  assert.match(nativeDraftView, /enum LoomDraftInlineEdit/);
  assert.match(nativeDraftView, /struct LoomDraftInlineEditDiffHunk/);
  assert.match(nativeDraftView, /static func buildPrompt/);
  assert.match(nativeDraftView, /static func apply/);
  assert.match(nativeDraftView, /static func diffHunks/);
  assert.match(nativeDraftView, /private var inlineEditInspectorPanel: some View/);
  assert.match(nativeDraftView, /Text\("Diff preview"\)/);
  assert.match(nativeDraftView, /private func startInlineEdit\(\)/);
  assert.match(nativeDraftView, /private func acceptInlineEdit\(\)/);
  assert.match(nativeDraftView, /inspectorSection\("Edit"\)/);
  assert.match(nativeDraftView, /Button\("Accept edit"\)/);
  assert.match(nativeDraftView, /Button\("Discard edit"\)/);

  assert.match(swiftTests, /testDraftInlineEditPromptAndApplyReplaceOnlySelectedPassage/);
  assert.match(swiftTests, /testDraftInlineEditPromptIncludesRawArtifactStateData/);
  assert.match(swiftTests, /testDraftInlineEditBuildsReviewableDiffHunks/);
  assert.match(loomDoc, /⌘K inline edit[\s\S]{0,360}selected passage[\s\S]{0,220}Accept/);
});

test('Draft has a ThinkingDraft block structure model instead of only one body string', () => {
  const draftStorage = read('lib/new-loom/draft-storage.ts');
  const draftClient = read('app/draft/DraftClient.tsx');
  const nativeDraftView = read('macos-app/Loom/Sources/LoomDraftView.swift');
  const swiftTests = read('macos-app/Loom/Tests/LoomDraftStoreTests.swift');
  const loomDoc = read('docs/loom.md');

  assert.match(draftStorage, /export type NewLoomDraftBlockKind/);
  assert.match(draftStorage, /export type NewLoomDraftBlock/);
  assert.match(draftStorage, /export function draftBlocksFromBody/);
  assert.match(draftStorage, /export function draftBlockReferenceLabels/);
  assert.match(draftStorage, /export function applyDraftBlockEdit/);

  assert.match(draftClient, /draftBlocksFromBody\(body, references\)/);
  assert.match(draftClient, /draftBlockReferenceLabels\(block, displayReferences\)/);
  assert.match(draftClient, /Draft structure/);
  assert.match(draftClient, /new-loom-draft__structure/);
  assert.match(draftClient, /new-loom-draft__block-refs/);

  assert.match(nativeDraftView, /struct LoomThinkingDraftBlock/);
  assert.match(nativeDraftView, /enum LoomThinkingDraft/);
  assert.match(nativeDraftView, /static func blocks\(body: String, references:/);
  assert.match(nativeDraftView, /static func referenceLabels\(for block: LoomThinkingDraftBlock, references:/);
  assert.match(nativeDraftView, /inspectorSection\("Structure"/);
  assert.match(nativeDraftView, /LoomThinkingDraft\.referenceLabels\(for: block, references: references\)/);

  assert.match(swiftTests, /testThinkingDraftSplitsMarkdownIntoReviewableBlocks/);
  assert.match(swiftTests, /testThinkingDraftAppliesBlockEditsOnlyWhenReviewedBlockStillMatches/);
  assert.match(swiftTests, /testThinkingDraftLabelsBlockReferencesForStructurePanels/);
  assert.match(loomDoc, /ThinkingDraft[\s\S]{0,220}block/);
  assert.doesNotMatch(
    loomDoc,
    /❌ 一切草稿层/,
    'docs/loom.md should not keep the stale claim that the whole Draft layer is missing',
  );
  assert.match(
    loomDoc,
    /草稿层已进入新 Loom 主线[\s\S]{0,220}ThinkingDraft[\s\S]{0,220}approval-bound/,
    'docs/loom.md should summarize the current Draft layer without closing approval-bound gates',
  );
});

test('Draft ThinkingDraft block operations review multiple blocks before rewriting them', () => {
  const draftStorage = read('lib/new-loom/draft-storage.ts');
  const draftClient = read('app/draft/DraftClient.tsx');
  const nativeDraftView = read('macos-app/Loom/Sources/LoomDraftView.swift');
  const swiftTests = read('macos-app/Loom/Tests/LoomDraftStoreTests.swift');
  const loomDoc = read('docs/loom.md');
  const migrationPlan = read('docs/projects/active/2026-05-09-legacy-surface-migration-plan.md');

  assert.match(draftStorage, /export type NewLoomDraftBlockOperation/);
  assert.match(draftStorage, /export function applyDraftBlockOperation/);
  assert.match(draftStorage, /export function draftBlockOperationDiffHunks/);
  assert.match(draftClient, /applyDraftBlockOperation/);
  assert.match(draftClient, /Block operation/);
  assert.match(draftClient, /selectedBlockIds/);
  assert.match(draftClient, /draftBlockOperationDiffHunks\(selectedBlocks, blockOperationText\)/);
  assert.match(draftClient, /aria-label="Block operation diff preview"/);

  assert.match(nativeDraftView, /applyBlockOperation/);
  assert.match(nativeDraftView, /accessibilityLabel\("Block operation"\)/);
  assert.match(
    nativeDraftView,
    /LoomThinkingDraft\.operationDiffHunks\(blocks: selected, replacement: blockOperationText\)/,
  );
  assert.match(
    swiftTests,
    /testThinkingDraftAppliesMultiBlockOperationsOnlyWhenReviewedBlocksStillMatch/,
  );
  assert.match(
    swiftTests,
    /testThinkingDraftBuildsReviewableDiffForBlockOperationsBeforeApply/,
  );
  assert.match(loomDoc, /multi-block operation/);
  assert.doesNotMatch(
    migrationPlan,
    /does not yet complete multi-block AI composition or cross-block operations/,
    'migration plan should not mark cross-block operations as missing once web/native Draft block operations are covered',
  );
  assert.match(
    migrationPlan,
    /Cross-block\s+operations now have web and native reviewable diff evidence/,
    'migration plan should split completed cross-block operations from the still approval-bound live AI composer work',
  );
});

test('workbench compatibility route lands in Draft after prose migration', () => {
  const workbenchPage = read('app/workbench/page.tsx');
  const globals = read('app/globals.css');
  const plan = read('docs/projects/active/2026-05-09-legacy-surface-migration-plan.md');

  assert.match(workbenchPage, /import \{ redirect \} from 'next\/navigation'/);
  assert.match(workbenchPage, /redirect\('\/draft'\)/);
  assert.doesNotMatch(workbenchPage, /WorkbenchClient|loom\.workbench\.current|localStorage/);
  assert.equal(
    fs.existsSync(path.join(repoRoot, 'app/WorkbenchClient.tsx')),
    false,
    'app/WorkbenchClient.tsx should be removed once /workbench redirects to /draft',
  );
  assert.doesNotMatch(globals, /\.loom-workbench\b/);
  assert.match(plan, /\| `\/workbench` \| Compatibility \| Draft \| Redirect to `\/draft`/);
});

test('Draft owns reference excerpt insertion and provenance instead of leaving it in Atelier', () => {
  const draftClient = read('app/draft/DraftClient.tsx');
  const draftStorage = read('lib/new-loom/draft-storage.ts');

  assert.match(draftStorage, /appendReferenceExcerptToDraft/);
  assert.match(draftStorage, /draftProvenanceMatches/);
  assert.match(draftClient, /appendReferenceExcerptToDraft/);
  assert.match(draftClient, /draftProvenanceMatches/);
  assert.match(draftClient, /Insert quote/);
  assert.match(draftClient, /Provenance/);
});

test('Draft owns Atelier multi-source tiling beside the writing surface', () => {
  const draftClient = read('app/draft/DraftClient.tsx');
  const draftStorage = read('lib/new-loom/draft-storage.ts');
  const nativeDraftView = read('macos-app/Loom/Sources/LoomDraftView.swift');
  const swiftTests = read('macos-app/Loom/Tests/LoomDraftStoreTests.swift');
  const atelierPage = read('app/atelier/page.tsx');
  const globals = read('app/globals.css');
  const loomDoc = read('docs/loom.md');

  assert.match(draftStorage, /export type NewLoomDraftSourceTile/);
  assert.match(draftStorage, /export function draftSourceTilesFromReferences/);
  assert.match(draftClient, /draftSourceTilesFromReferences\(displayReferences/);
  assert.match(draftClient, /aria-label="Source tiles"/);
  assert.match(draftClient, /Source tiles/);
  assert.match(draftClient, /new-loom-draft__source-tiles/);
  assert.match(draftClient, /tile\.canInsertQuote/);
  assert.match(draftClient, /openDraftReference\(event, tile\)/);
  assert.match(draftClient, /function removeDraftReference\(reference: NewLoomDraftReference\)/);
  assert.match(draftClient, /aria-label=\{`Remove source tile: \$\{tile\.label\}`\}/);
  assert.match(draftClient, /onClick=\{\(\) => removeDraftReference\(realReference\)\}/);
  assert.match(draftClient, /aria-label=\{`Remove reference: \$\{reference\.label\}`\}/);
  assert.match(globals, /\.new-loom-draft__source-tiles/);
  assert.doesNotMatch(
    cssRulesContaining(globals, '.new-loom-draft__source-tiles'),
    /grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/,
  );
  assert.match(globals, /\.new-loom-draft__source-list\b/);
  assert.match(nativeDraftView, /struct LoomDraftSourceTile: Equatable, Identifiable/);
  assert.match(nativeDraftView, /enum LoomDraftSourceTiles/);
  assert.match(nativeDraftView, /static func tiles\(from references: \[LoomDraftReference\]/);
  assert.match(nativeDraftView, /LoomDraftSourceTiles\.tiles\(from: references/);
  assert.match(nativeDraftView, /private var draftContextPanel: some View/);
  assert.match(nativeDraftView, /inspectorSection\("Attached sources", count: "\\\(sourceTiles\.count\)\/4"\)/);
  assert.match(nativeDraftView, /ForEach\(sourceTiles\)/);
  assert.match(nativeDraftView, /tile\.canInsertQuote/);
  assert.match(nativeDraftView, /openReference\(tile\.reference\)/);
  assert.match(nativeDraftView, /insertExcerpt\(tile\.reference\)/);
  assert.doesNotMatch(
    nativeDraftView,
    /private var (draftSourceSummaryPanel|sourceTilesPanel|referencesPanel|suggestedReferencesPanel): some View/,
    'source tiles, references, and suggestions should be one Sources inspector mode instead of duplicated legacy panels',
  );
  assert.match(swiftTests, /testDraftSourceTilesPrepareFourSourceNativeSurface/);

  assert.match(atelierPage, /redirect\('\/draft'\)/);
  assert.doesNotMatch(atelierPage, /AtelierClient|multi-source|source tiles/);
  assert.match(loomDoc, /Atelier 多 source 平铺[\s\S]{0,220}Draft/i);
});

test('Draft public working mode masks reference tiles without mutating the draft', () => {
  const draftClient = read('app/draft/DraftClient.tsx');
  const draftStorage = read('lib/new-loom/draft-storage.ts');
  const loomDoc = read('docs/loom.md');

  assert.match(draftClient, /isNewLoomPublicWorkingMode/);
  assert.match(draftClient, /browserPublicWorkingStorage/);
  assert.match(draftClient, /publicWorkingDraftReferences/);
  assert.match(draftClient, /const \[publicWorkingMode, setPublicWorkingMode\] = useState\(false\)/);
  assert.match(
    draftClient,
    /isNewLoomPublicWorkingMode\(\s*window\.location\.search,\s*browserPublicWorkingStorage\(\),\s*\)/,
  );
  assert.match(
    draftClient,
    /publicWorkingMode \? publicWorkingDraftReferences\(references\) : references/,
  );
  assert.match(draftClient, /draftSourceTilesFromReferences\(displayReferences/);
  assert.match(draftClient, /displayReferences\.map/);
  assert.match(draftClient, /Public working mode is on\. Draft references are masked\./);
  assert.match(draftClient, /!\s*publicWorkingMode && predictedReferenceHits\.length > 0/);
  assert.match(draftClient, /!\s*publicWorkingMode \? \(/);
  assert.match(draftClient, /!\s*publicWorkingMode && tile\.canInsertQuote/);
  assert.match(draftClient, /!\s*publicWorkingMode && realReference/);
  assert.match(draftClient, /!\s*publicWorkingMode && referencePickerOpen/);

  assert.match(draftStorage, /export function publicWorkingDraftReferences/);
  assert.match(draftStorage, /Source reference/);
  assert.match(draftStorage, /Capture reference/);
  assert.match(draftStorage, /Artifact state reference/);
  assert.match(loomDoc, /Draft references are masked/i);
});

test('atelier compatibility route lands in Draft after quote and provenance migration', () => {
  const atelierPage = read('app/atelier/page.tsx');
  const globals = read('app/globals.css');
  const plan = read('docs/projects/active/2026-05-09-legacy-surface-migration-plan.md');

  assert.match(atelierPage, /import \{ redirect \} from 'next\/navigation'/);
  assert.match(atelierPage, /redirect\('\/draft'\)/);
  assert.doesNotMatch(atelierPage, /AtelierClient|loom\.atelier\.current|provenance ledger/);
  assert.equal(
    fs.existsSync(path.join(repoRoot, 'app/AtelierClient.tsx')),
    false,
    'app/AtelierClient.tsx should be removed once /atelier redirects to /draft',
  );
  assert.doesNotMatch(globals, /\.loom-atelier\b/);
  assert.match(plan, /\| `\/atelier` \| Compatibility \| Draft \| Redirect to `\/draft`/);
});

test('Sōan compatibility route lands in Draft after card board migration', () => {
  const soanPage = read('app/soan/page.tsx');
  const draftBoardClient = read('app/draft/DraftBoardClient.tsx');
  const draftClient = read('app/draft/DraftClient.tsx');
  const nativeDraftView = read('macos-app/Loom/Sources/LoomDraftView.swift');
  const plan = read('docs/projects/active/2026-05-09-legacy-surface-migration-plan.md');
  const globals = read('app/globals.css');

  assert.match(soanPage, /import \{ redirect \} from 'next\/navigation'/);
  assert.match(soanPage, /redirect\('\/draft\?view=board'\)/);
  assert.doesNotMatch(soanPage, /SoanClient|DraftBoardClient|return <SoanClient|title: 'Sōan/);
  assert.equal(
    fs.existsSync(path.join(repoRoot, 'app/SoanClient.tsx')),
    false,
    'app/SoanClient.tsx should be removed once Draft owns the board runtime',
  );

  assert.match(draftClient, /import DraftBoardClient from '\.\/DraftBoardClient'/);
  assert.match(draftClient, /const boardRef = useRef<HTMLElement \| null>\(null\)/);
  assert.match(draftClient, /get\('view'\) === 'board'/);
  assert.match(draftClient, /boardRef\.current\?\.scrollIntoView/);
  assert.match(draftClient, /aria-label="Draft card board"/);
  assert.match(draftClient, /<DraftBoardClient \/>/);

  assert.match(draftBoardClient, /export default function DraftBoardClient/);
  assert.match(draftBoardClient, /aria-label="Draft card index"/);
  assert.match(draftBoardClient, /Draft board · thinking draft/);
  assert.match(draftBoardClient, /Draft board\./);
  assert.match(draftBoardClient, /Draft board holds the cards/);
  assert.match(draftBoardClient, /aria-label="Draft board shortcuts"/);
  assert.match(draftBoardClient, /className="draft-board"/);
  assert.match(globals, /\.draft-board\b/);
  assert.doesNotMatch(draftBoardClient, /className=\{?`?[^`"\n]*loom-soan|closest\('\.loom-soan/);
  assert.doesNotMatch(globals, /\.loom-soan/);
  assert.doesNotMatch(
    draftBoardClient,
    /Sōan · thinking draft|aria-label="Sōan card index"|Sōan holds|aria-label="Sōan shortcuts"|Sōan\./,
  );

  assert.match(nativeDraftView, /@State private var draftCards: \[LoomSoanCard\] = \[\]/);
  assert.match(nativeDraftView, /@State private var draftEdges: \[LoomSoanEdge\] = \[\]/);
  assert.match(nativeDraftView, /private var draftBoard: some View/);
  assert.match(nativeDraftView, /inspectorSection\("Board", count:/);
  assert.match(nativeDraftView, /accessibilityLabel\("Draft board"\)/);
  assert.match(nativeDraftView, /LoomSoanWriter\.allCards\(\)/);
  assert.match(nativeDraftView, /LoomSoanWriter\.allEdges\(\)/);
  assert.match(
    nativeDraftView,
    /\.onReceive\(NotificationCenter\.default\.publisher\(for: \.loomSoanChanged\)\)/,
  );
  assert.match(
    nativeDraftView,
    /NotificationCenter\.default\.post\(name: \.loomShowAddSoanCardDialog/,
  );
  assert.match(
    nativeDraftView,
    /NotificationCenter\.default\.post\(name: \.loomShowConnectSoanCardsDialog/,
  );
  assert.match(plan, /\| `\/soan` \| Compatibility \| Draft \| Redirect to `\/draft\?view=board`/);
});

test('Draft board uses literal visible card labels while preserving internal storage tags', () => {
  const draftBoardClient = read('app/draft/DraftBoardClient.tsx');
  const contentView = read('macos-app/Loom/Sources/ContentView.swift');
  const nativeDraftView = read('macos-app/Loom/Sources/LoomDraftView.swift');

  assert.match(draftBoardClient, /fog: \{ label: 'Unclear'/);
  assert.match(draftBoardClient, /weft: \{ label: 'Connection'/);
  assert.match(draftBoardClient, /unclear note, connection, sketch/);
  assert.doesNotMatch(
    draftBoardClient,
    /label: 'Fog'|label: 'Weft'|fog, weft|weft a bronze|echoes tag/,
  );

  assert.match(contentView, /Text\("Unclear"\)\.tag\("fog"\)/);
  assert.match(contentView, /Text\("Connection"\)\.tag\("weft"\)/);
  assert.match(contentView, /Text\("Related"\)\.tag\("echo"\)/);
  assert.doesNotMatch(
    contentView,
    /Text\("Fog"\)|Text\("Weft \(echo\)"\)|Text\("echo \(dashed muted\)"\)/,
  );

  assert.match(nativeDraftView, /draftCardKindLabel\(card\.kind\)/);
  assert.match(nativeDraftView, /case "fog": return "Unclear"/);
  assert.match(nativeDraftView, /case "weft": return "Connection"/);
  assert.doesNotMatch(nativeDraftView, /Text\(card\.kind\.capitalized\)/);
});

test('Draft streams /draft from #tag from matching draft-board cards', () => {
  const draftStorage = read('lib/new-loom/draft-storage.ts');
  const draftClient = read('app/draft/DraftClient.tsx');
  const nativeDraftView = read('macos-app/Loom/Sources/LoomDraftView.swift');
  const loomDoc = read('docs/loom.md');

  assert.match(draftStorage, /parseDraftFromTagCommand/);
  assert.match(draftStorage, /draftFromTagPromptLines/);
  assert.match(draftStorage, /buildDraftFromTagPrompt/);
  assert.match(draftStorage, /case 'unclear':[\s\S]{0,80}kind: 'fog'[\s\S]{0,80}label: 'Unclear'/);
  assert.match(
    draftStorage,
    /case 'connection':[\s\S]{0,80}kind: 'weft'[\s\S]{0,80}label: 'Connection'/,
  );

  assert.match(
    draftClient,
    /import \{ loadSoanPayload \} from '\.\.\/\.\.\/lib\/loom-soan-records'/,
  );
  assert.match(draftClient, /function cardsFromSoanPayload/);
  assert.match(draftClient, /async function startTaggedDraft\(\)/);
  assert.match(draftClient, /parseDraftFromTagCommand\(body\)/);
  assert.match(draftClient, /buildDraftFromTagPrompt\(\{ title, body, command, cards \}\)/);
  assert.match(
    draftClient,
    /callAiPrompt\([\s\S]{0,120}'draft-compose'[\s\S]{0,120}buildDraftFromTagPrompt\(\{ title, body, command, cards \}\)/,
  );
  assert.match(draftClient, />\s*Draft from tag\s*<\/button>/);

  assert.match(nativeDraftView, /enum LoomDraftFromTag/);
  assert.match(nativeDraftView, /static func parseCommand\(body: String\)/);
  assert.match(nativeDraftView, /static func buildPrompt/);
  assert.match(nativeDraftView, /private func startTaggedDraft\(\)/);
  assert.match(nativeDraftView, /Button\("Draft from tag"\)/);
  assert.match(nativeDraftView, /LoomAI\.sendStream\(\s*prompt: LoomDraftFromTag\.buildPrompt/);
  assert.match(nativeDraftView, /case "unclear": return \(kind: "fog", label: "Unclear"\)/);
  assert.match(nativeDraftView, /case "connection": return \(kind: "weft", label: "Connection"\)/);

  assert.match(loomDoc, /`\/draft from #tag`[\s\S]{0,360}first slice/i);
});

test('Help explains Sources and Draft without reviving legacy product labels', () => {
  const helpPage = read('app/help/page.tsx');
  const helpCss = read('app/help/HelpPage.module.css');

  for (const label of ['Sources', 'Draft']) {
    assert.match(helpPage, new RegExp(`\\b${label}\\b`));
  }

  assert.match(helpPage, /import styles from '\.\/HelpPage\.module\.css'/);
  assert.match(helpPage, /<main className=\{styles\.page\}>/);
  assert.doesNotMatch(helpPage, /<PageFrame|className="prose-notion"|style=\{\{/);
  assert.match(helpPage, /reading-and-thinking environment/);
  assert.doesNotMatch(helpPage, /\bCollect\b|\bOrganize\b|\borganize\b|href="\/collect"/);
  assert.match(helpPage, /Add, capture, and review source material/);
  assert.match(helpPage, /Read, mark, write\./);

  for (const href of ['/sources', '/digital-me?edit=new']) {
    assert.match(helpPage, new RegExp(`href="${escapeRegExp(href)}"`));
  }

  assert.doesNotMatch(
    helpPage,
    /\b(Desk|Workbench|Atelier|Pursuits?|Weaves?|Patterns?|Constellation|Atlas|Sōan)\b/i,
  );
  assert.doesNotMatch(helpPage, /\b(warp|woven|weaver|weaving metaphor)\b/i);

  for (const route of ['/desk', '/workbench', '/atelier', '/patterns', '/weaves', '/pursuits']) {
    assert.doesNotMatch(
      helpPage,
      new RegExp(`href="${escapeRegExp(route)}"|>${escapeRegExp(route)}<`),
    );
  }

  assert.match(
    helpCss,
    /radial-gradient\(70rem 43rem at 50% -18%, rgba\(232, 236, 238, 0\.145\)/,
  );
  assert.match(helpCss, /backdrop-filter:\s*blur\(30px\) saturate\(108%\)/);
  assert.match(helpCss, /\.workspaceGrid\s*\{/);
});

test('/system explains the new Loom loop instead of the retired product map', () => {
  const systemPage = read('app/system/page.tsx');
  const systemClientPath = path.join(repoRoot, 'app/SystemClient.tsx');
  const supportCss = read('app/loom-support-page.module.css');

  assert.ok(!fs.existsSync(path.join(repoRoot, 'app/SystemAtlasClient.tsx')));
  assert.ok(
    fs.existsSync(systemClientPath),
    'app/SystemClient.tsx should replace the retired SystemAtlas client',
  );
  const systemClient = fs.readFileSync(systemClientPath, 'utf8');

  assert.match(systemPage, /import SystemClient from '\.\.\/SystemClient'/);
  assert.match(systemPage, /return <SystemClient \/>/);
  assert.doesNotMatch(systemClient, /padding:\s*'var\(--support-main-padding\)'/);
  assert.match(systemClient, /className=\{styles\.main\}/);
  assert.match(systemClient, /styles\.archiveStepLink/);
  assert.match(systemClient, /styles\.archiveSupportSection/);
  assert.match(supportCss, /radial-gradient\(76rem 44rem at 50% -18%, rgba\(232, 236, 238, 0\.145\)/);

  for (const label of ['Sources', 'Draft']) {
    assert.match(systemClient, new RegExp(`\\b${label}\\b`));
  }
  assert.doesNotMatch(systemClient, /\bCollect\b|\bOrganize\b/);

  for (const label of ['Source workspace', 'Reader notes', 'Draft references']) {
    assert.match(systemClient, new RegExp(escapeRegExp(label)));
  }

  assert.match(systemClient, /Original files stay read-only/);

  assert.doesNotMatch(
    systemClient,
    /ATLAS · OF THE LOOM|seven nouns|Book Room|Workbench|Sōan|Atlas · Patterns|Weft engine|Pattern detector|Weft archive|Panel ledger|Letter outbox|READER UI|THE LOOM|SANCTUARY|four refusals/i,
  );
  assert.doesNotMatch(
    systemPage,
    /SystemAtlas|A reader's map|philosophy of mind|loom-atlas|Reader UI|Sanctuary/i,
  );
});

test('/discipline is an in-app support document for the six product refusals', () => {
  const productShell = read('lib/new-loom/product-shell.ts');
  const disciplinePath = path.join(repoRoot, 'app/discipline/page.tsx');
  const supportCss = read('app/loom-support-page.module.css');

  assert.ok(
    NEW_LOOM_SUPPORT_ROUTES.includes('/discipline'),
    '/discipline should be a support route',
  );
  assert.ok(
    !new Set<string>(NEW_LOOM_PRIMARY_ROUTES).has('/discipline'),
    '/discipline should not become a primary work route',
  );
  assert.ok(
    !new Set<string>(NEW_LOOM_LEGACY_ROUTES).has('/discipline'),
    '/discipline should not be classified as legacy',
  );
  assert.match(productShell, /NEW_LOOM_SUPPORT_ROUTES[\s\S]*'\/discipline'/);

  assert.ok(
    fs.existsSync(disciplinePath),
    'app/discipline/page.tsx should define the Discipline support page',
  );
  const disciplinePage = fs.readFileSync(disciplinePath, 'utf8');
  const systemClient = read('app/SystemClient.tsx');
  const helpPage = read('app/help/page.tsx');

  assert.match(disciplinePage, /title:\s*'Discipline · Loom'/);
  assert.match(disciplinePage, /six product refusals/i);
  assert.doesNotMatch(disciplinePage, /padding:\s*'var\(--support-main-padding\)'|style=\{\{ listStyle/);
  assert.match(disciplinePage, /styles\.refusalList/);
  assert.match(disciplinePage, /styles\.refusalTitle/);
  assert.match(supportCss, /\.refusalList\s*\{/);

  for (const refusal of [
    '不监视你',
    '不打断你',
    '不假装比你懂',
    '不把你的东西拍平成 feed',
    '不假装一切都该被永久保存',
    '不主动上传本地文件全文',
  ]) {
    assert.match(disciplinePage, new RegExp(escapeRegExp(refusal)));
  }

  for (const phrase of [
    'No telemetry',
    'No notifications',
    'AI only appears when you ask',
    'No home feed',
    'flow can fade',
    'No automatic full-file upload',
  ]) {
    assert.match(disciplinePage, new RegExp(escapeRegExp(phrase)));
  }

  assert.match(disciplinePage, /href="\/system"/);
  assert.match(disciplinePage, /href="\/sources"/);
  assert.match(systemClient, /href="\/discipline"/);
  assert.match(helpPage, /href="\/discipline"/);
});

test('/year is a support surface for the annual wintering view, not a primary route', () => {
  const productShell = read('lib/new-loom/product-shell.ts');
  const yearPath = path.join(repoRoot, 'app/year/page.tsx');
  const yearClientPath = path.join(repoRoot, 'app/year/YearClient.tsx');

  assert.ok(NEW_LOOM_SUPPORT_ROUTES.includes('/year'), '/year should be a support route');
  assert.ok(
    !new Set<string>(NEW_LOOM_PRIMARY_ROUTES).has('/year'),
    '/year should not become a primary work route',
  );
  assert.ok(
    !new Set<string>(NEW_LOOM_LEGACY_ROUTES).has('/year'),
    '/year should not be classified as legacy',
  );
  assert.match(productShell, /NEW_LOOM_SUPPORT_ROUTES[\s\S]*'\/year'/);

  assert.ok(fs.existsSync(yearPath), 'app/year/page.tsx should define The Year support page');
  assert.ok(
    fs.existsSync(yearClientPath),
    'The Year needs a client view so real captures, local files, and question containers can hydrate',
  );
  const yearPage = fs.readFileSync(yearPath, 'utf8');
  const yearClient = fs.readFileSync(yearClientPath, 'utf8');
  const yearSurfaceText = `${yearPage}\n${yearClient}`;
  const supportCss = read('app/loom-support-page.module.css');
  const systemClient = read('app/SystemClient.tsx');
  const helpPage = read('app/help/page.tsx');
  const loomDoc = read('docs/loom.md');
  const winteringState = read('lib/new-loom/wintering-state.ts');
  const yearSurface = read('lib/new-loom/year-surface.ts');

  assert.match(yearPage, /title:\s*'The Year · Loom'/);
  assert.match(yearPage, /import \{ YearClient \} from '\.\/YearClient'/);
  assert.match(yearPage, /<YearClient \/>/);
  assert.match(yearSurfaceText, /The Year/);
  assert.match(yearSurfaceText, /twelve months/i);
  assert.match(yearSurfaceText, /wintering ribbon/i);
  assert.match(yearSurfaceText, /Question\s+containers/);
  assert.match(yearSurfaceText, /Sources/);
  assert.match(yearSurfaceText, /Draft/);
  assert.doesNotMatch(yearSurfaceText, /padding:\s*'var\(--support-main-padding\)'|gridTemplateColumns:\s*'repeat\(12/);
  assert.match(yearPage, /className=\{styles\.main\}/);
  assert.match(yearClient, /styles\.yearChart/);
  assert.match(yearClient, /styles\.monthBar/);
  assert.match(yearClient, /styles\.bucketHeader/);
  assert.match(yearClient, /styles\.emptyCopy/);
  assert.match(supportCss, /\.yearChart\s*\{/);
  assert.match(supportCss, /\.monthBar\s*\{/);
  assert.doesNotMatch(yearSurfaceText, /Source Index|Collect|Organize/);

  for (const month of [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]) {
    assert.match(yearSurface, new RegExp(`\\b${month}\\b`));
  }

  assert.match(yearPage, /href="\/sources"/);
  assert.match(yearPage, /href="\/digital-me\?edit=new"/);
  assert.match(yearPage, /href="\/discipline"/);
  assert.match(yearClient, /'use client'/);
  assert.match(yearClient, /useAllTraces/);
  assert.match(yearClient, /loadPursuitRecords/);
  assert.match(yearClient, /fetch\('loom:\/\/native\/captures-list\.json'\)/);
  assert.match(yearClient, /buildNewLoomYearOverview/);
  assert.match(yearClient, /yearItemDraftHref/);
  assert.match(yearClient, /Draft this item/);
  assert.match(yearClient, /!\s*publicWorkingMode[\s\S]{0,160}yearItemDraftHref\(item\)/);
  assert.match(yearClient, /aria-label="The Year material by month"/);
  assert.match(yearClient, /aria-label="The Year wintering buckets"/);
  assert.match(yearSurface, /buildNewLoomYearOverview/);
  assert.match(yearSurface, /export function yearItemDraftHref/);
  assert.match(yearSurface, /bucketNewLoomWinteringItems/);
  assert.match(winteringState, /deriveNewLoomWinteringState/);
  assert.match(winteringState, /bucketNewLoomWinteringItems/);
  assert.match(winteringState, /winteringAfter:\s*45/);
  assert.match(winteringState, /archivedAfter:\s*365/);
  assert.match(systemClient, /href="\/year"/);
  assert.match(helpPage, /href="\/year"/);
  assert.match(loomDoc, /The Year[\s\S]{0,220}first support surface/i);
});

test('/hour is a support surface for the current thinking window, not a primary route', () => {
  const productShell = read('lib/new-loom/product-shell.ts');
  const hourPath = path.join(repoRoot, 'app/hour/page.tsx');
  const hourClientPath = path.join(repoRoot, 'app/hour/HourClient.tsx');

  assert.ok(NEW_LOOM_SUPPORT_ROUTES.includes('/hour'), '/hour should be a support route');
  assert.ok(
    !new Set<string>(NEW_LOOM_PRIMARY_ROUTES).has('/hour'),
    '/hour should not become a primary work route',
  );
  assert.ok(
    !new Set<string>(NEW_LOOM_LEGACY_ROUTES).has('/hour'),
    '/hour should not be classified as legacy',
  );
  assert.match(productShell, /NEW_LOOM_SUPPORT_ROUTES[\s\S]*'\/hour'/);

  assert.ok(fs.existsSync(hourPath), 'app/hour/page.tsx should define The Hour support page');
  assert.ok(
    fs.existsSync(hourClientPath),
    'The Hour needs a client view so the current minute can tick',
  );

  const hourPage = fs.readFileSync(hourPath, 'utf8');
  const hourClient = fs.readFileSync(hourClientPath, 'utf8');
  const supportCss = read('app/loom-support-page.module.css');
  const systemClient = read('app/SystemClient.tsx');
  const helpPage = read('app/help/page.tsx');
  const yearPage = read('app/year/page.tsx');
  const loomDoc = read('docs/loom.md');

  assert.match(hourPage, /title:\s*'The Hour · Loom'/);
  assert.match(hourPage, /import HourClient from '\.\/HourClient'/);
  assert.match(hourPage, /<HourClient \/>/);
  assert.doesNotMatch(hourClient, /padding:\s*'var\(--support-main-padding\)'|background:\s*'color-mix/);
  assert.match(hourClient, /className=\{styles\.main\}/);
  assert.match(hourClient, /styles\.breathBar/);
  assert.match(hourClient, /styles\.breathFill/);
  assert.match(hourClient, /styles\.emptyCopy/);
  assert.match(supportCss, /\.breathBar\s*\{/);
  assert.match(supportCss, /\.breathFill\s*\{/);

  assert.match(hourClient, /'use client'/);
  assert.match(hourClient, /useAllTraces/);
  assert.match(hourClient, /loadPursuitRecords/);
  assert.match(hourClient, /fetch\('loom:\/\/native\/captures-list\.json'\)/);
  assert.match(hourClient, /buildNewLoomYearOverview/);
  assert.match(hourClient, /currentHourItemsFromYearOverview/);
  assert.match(hourClient, /hourItemDraftHref/);
  assert.match(hourClient, /isNewLoomPublicWorkingMode/);
  assert.match(hourClient, /publicWorkingYearOverview/);
  assert.match(hourClient, /Draft this current item/);
  assert.match(hourClient, /!\s*publicWorkingMode[\s\S]{0,180}hourItemDraftHref\(item\)/);
  assert.match(hourClient, /useState<Date \| null>\(null\)/);
  assert.match(hourClient, /setNow\(currentDate\(\)\)/);
  assert.match(hourClient, /setInterval/);
  assert.match(hourClient, /Current hour/);
  assert.match(hourClient, /second:\s*'2-digit'/);
  assert.match(hourClient, /toFixed\(1\)/);
  assert.match(hourClient, /minute progress/i);
  assert.match(hourClient, /breath bar/i);
  assert.match(hourClient, /No alerts/);
  assert.match(hourClient, /href="\/sources"/);
  assert.match(hourClient, /href="\/digital-me\?edit=new"/);
  assert.match(hourClient, /href="\/year"/);
  assert.match(hourClient, /href="\/discipline"/);

  assert.match(systemClient, /href="\/hour"/);
  assert.match(helpPage, /href="\/hour"/);
  assert.match(yearPage, /href="\/hour"/);
  assert.match(loomDoc, /The Hour[\s\S]{0,260}current material/i);
  assert.match(loomDoc, /The Hour[\s\S]{0,260}first support surface/i);
});

test('/connections is a support surface for source connections and correspondents', () => {
  const productShell = read('lib/new-loom/product-shell.ts');
  const connectionsPath = path.join(repoRoot, 'app/connections/page.tsx');
  const connectionsClientPath = path.join(repoRoot, 'app/connections/ConnectionsClient.tsx');
  const sourceConnectionsPath = path.join(repoRoot, 'lib/new-loom/source-connections.ts');

  assert.ok(
    NEW_LOOM_SUPPORT_ROUTES.includes('/connections'),
    '/connections should be a support route',
  );
  assert.ok(
    !new Set<string>(NEW_LOOM_PRIMARY_ROUTES).has('/connections'),
    '/connections should not become a primary work route',
  );
  assert.ok(
    !new Set<string>(NEW_LOOM_LEGACY_ROUTES).has('/connections'),
    '/connections should not be classified as legacy',
  );
  assert.match(productShell, /NEW_LOOM_SUPPORT_ROUTES[\s\S]*'\/connections'/);

  assert.ok(
    fs.existsSync(sourceConnectionsPath),
    'source connection derivation should be a tested pure helper',
  );
  assert.ok(
    fs.existsSync(connectionsPath),
    'app/connections/page.tsx should define the Connections support page',
  );
  assert.ok(
    fs.existsSync(connectionsClientPath),
    'Connections needs a client view so trace links can render',
  );

  const sourceConnections = fs.readFileSync(sourceConnectionsPath, 'utf8');
  const connectionsPage = fs.readFileSync(connectionsPath, 'utf8');
  const connectionsClient = fs.readFileSync(connectionsClientPath, 'utf8');
  const supportCss = read('app/loom-support-page.module.css');
  const systemClient = read('app/SystemClient.tsx');
  const helpPage = read('app/help/page.tsx');
  const hourClient = read('app/hour/HourClient.tsx');
  const loomDoc = read('docs/loom.md');

  assert.match(sourceConnections, /deriveNewLoomSourceConnections/);
  assert.match(sourceConnections, /sourceConnectionDraftHref/);
  assert.match(sourceConnections, /crossOriginConnections/);
  assert.match(sourceConnections, /correspondents/);

  assert.match(connectionsPage, /title:\s*'Connections · Loom'/);
  assert.match(connectionsPage, /import ConnectionsClient from '\.\/ConnectionsClient'/);
  assert.match(connectionsPage, /<ConnectionsClient \/>/);

  assert.match(connectionsClient, /'use client'/);
  assert.match(connectionsClient, /useAllTraces/);
  assert.match(connectionsClient, /deriveNewLoomSourceConnections/);
  assert.match(connectionsClient, /sourceConnectionDraftHref/);
  assert.match(connectionsClient, /Connections \/ Correspondents/);
  assert.match(connectionsClient, /cross-origin/);
  assert.match(connectionsClient, /Draft this connection/);
  assert.match(connectionsClient, /!\s*publicWorkingMode[\s\S]{0,120}sourceConnectionDraftHref\(link\)/);
  assert.match(connectionsClient, /href="\/sources"/);
  assert.match(connectionsClient, /href="\/digital-me\?edit=new"/);
  assert.doesNotMatch(connectionsClient, /padding:\s*'var\(--support-main-padding\)'|style=\{\{ marginTop/);
  assert.match(connectionsClient, /className=\{styles\.main\}/);
  assert.match(connectionsClient, /styles\.connectionsSection/);
  assert.match(connectionsClient, /styles\.connectionMetaRow/);
  assert.match(connectionsClient, /styles\.emptyCopy/);
  assert.match(supportCss, /\.connectionsSection\s*\{/);
  assert.match(supportCss, /\.connectionMetaRow\s*\{/);

  assert.match(systemClient, /href="\/connections"/);
  assert.match(helpPage, /href="\/connections"/);
  assert.match(hourClient, /href="\/connections"/);
  assert.match(loomDoc, /Connections \/ Correspondents[\s\S]{0,260}first support surface/i);
});

test('native shell can open installed support bundle routes such as /hour', () => {
  const loomApp = read('macos-app/Loom/Sources/LoomApp.swift');
  const minimalRoot = read('macos-app/Loom/Sources/LoomMinimalRootView.swift');

  assert.match(loomApp, /url\.host == "bundle"/);
  assert.match(loomApp, /handleBundleURL\(url\)/);
  assert.match(loomApp, /bundleRoutePath\(from:\s*url\)/);
  assert.match(loomApp, /LoomBundleRouteRelay\.savePendingRoute\(path\)/);
  assert.match(loomApp, /postBundleNavigation\(path\)/);
  assert.match(
    loomApp,
    /NotificationCenter\.default\.post\(\s*name:\s*\.loomShuttleNavigate[\s\S]*userInfo:\s*\["path": path\]/,
  );
  assert.match(loomApp, /DispatchQueue\.main\.asyncAfter\(deadline:\s*\.now\(\) \+ 0\.35\)/);
  assert.match(loomApp, /DispatchQueue\.main\.asyncAfter\(deadline:\s*\.now\(\) \+ 1\.0\)/);
  assert.match(loomApp, /path\.hasSuffix\("\.html"\)/);
  assert.match(loomApp, /ensureMainWindowVisible\(\)/);
  assert.match(loomApp, /createFallbackMainWindow\(\)/);
  assert.match(
    loomApp,
    /existingMainWindow\(includeHidden:\s*false\) == nil[\s\S]*createFallbackMainWindow\(\)/,
  );

  assert.match(minimalRoot, /case supportRoute\(String\)/);
  assert.match(minimalRoot, /case [^\n]*"\/hour"/);
  assert.match(minimalRoot, /case [^\n]*"\/connections"/);
  assert.match(minimalRoot, /navigate\(\.supportRoute\(normalizedSupportPath\)\)/);
  assert.match(minimalRoot, /consumePendingBundleRoute\(\)/);
  assert.match(minimalRoot, /LoomBundleRouteRelay\.consumePendingRoute\(\)/);
  assert.match(minimalRoot, /LoomBundleRouteRelay\.clearPendingRoute\(path\)/);
  assert.match(minimalRoot, /supportBundleURL\(for: path\)/);
  assert.match(minimalRoot, /CaptureWebView\(url: supportURL, themeMode: webThemeMode\)/);
});
