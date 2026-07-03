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

test('new Loom web shell exposes the Sources Studio Digital Me product loop', () => {
  const home = read('app/HomeClient.tsx');
  const productShell = read('lib/new-loom/product-shell.ts');

  for (const label of ['Sources', 'Studio', 'Digital Me']) {
    assert.match(productShell, new RegExp(`label:\\s*'${label}'`));
  }
  assert.match(productShell, /href:\s*'\/studio'/);
  assert.match(productShell, /href:\s*'\/digital-me'/);
  assert.match(productShell, /NEW_LOOM_SUPPORT_ROUTES[\s\S]*'\/draft'/);
  assert.doesNotMatch(productShell, /label:\s*'Collect'|label:\s*'Organize'/);
  assert.doesNotMatch(productShell, /label:\s*'Draft'/);
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

test('Reflection workspace is a separate product reflection workbench', () => {
  const page = read('app/reflection/page.tsx');
  const workspace = [
    read('app/reflection/ReflectionWorkspaceClient.tsx'),
    read('app/reflection/UnderstandingSpine.tsx'),
    read('app/reflection/reflectionModel.ts'),
  ].join('\n');
  const styles = read('app/reflection/ReflectionWorkspace.module.css');
  const nativeRoot = read('macos-app/Loom/Sources/LoomReflectionRootView.swift');
  // Stage 1 (LoomDomain): the domain model moved out of the root view file.
  const nativeModel = read('macos-app/Loom/Sources/ReflectionModel.swift');
  const nativeStore = read('macos-app/Loom/Sources/ReflectionWorkspaceStore.swift');
  const nativeTrace = read('macos-app/Loom/Sources/ReflectionLearningTrace.swift');
  const nativeSession = read('macos-app/Loom/Sources/ReflectionWorkspaceSession.swift');
  const nativeSurface = nativeRoot + nativeModel + nativeStore + nativeTrace + nativeSession;
  const sourceFileView = read('macos-app/Loom/Sources/SourceFileView.swift');
  const loomApp = read('macos-app/Loom/Sources/LoomApp.swift');
  const contentView = read('macos-app/Loom/Sources/ContentView.swift');
  const project = read('macos-app/Loom/Loom.xcodeproj/project.pbxproj');
  const projectYml = read('macos-app/Loom/project.yml');
  const infoPlist = read('macos-app/Loom/Info.plist');
  const packageJson = read('package.json');
  const nativeSidecarVerifier = read('scripts/verify-native-sidecar.mjs');
  const nativeTempCleaner = read('scripts/clean-loom-native-temp.mjs');
  const activeReadme = read('docs/projects/active/README.md');
  const loomRules = read('docs/canon/LOOM_RULES.md');
  const designDiscipline = read('docs/canon/LOOM_DESIGN_DISCIPLINE.md');
  const reflectionPrd = read('docs/projects/active/2026-06-28-loom-reflection-workspace-prd.md');
  const pollutionRules = read('docs/projects/active/2026-06-29-loom-pollution-avoidance-rules.md');
  const layoutContract = read('docs/projects/active/2026-06-27-loom-reflection-workspace-layout-contract.md');
  const topBarStart = nativeRoot.indexOf('private struct ReflectionTopBar');
  const sidebarStart = nativeRoot.indexOf('private struct ReflectionSidebar');
  const sidebarBackgroundStart = nativeRoot.indexOf('private struct ReflectionSidebarPeekBackdrop');
  const sidebarVisualEffectStart = nativeRoot.indexOf('private struct ReflectionVisualEffectBackground', sidebarBackgroundStart);
  const reflectionComposerStart = nativeRoot.indexOf('private struct ReflectionComposer');
  const reflectionSourceInspectorStart = nativeRoot.indexOf('private struct ReflectionSourceInspector', reflectionComposerStart);
  const topBarBlock = nativeRoot.slice(topBarStart, sidebarStart);
  const sidebarBackgroundBlock = nativeRoot.slice(sidebarBackgroundStart, sidebarVisualEffectStart);
  const reflectionComposerBlock = nativeRoot.slice(reflectionComposerStart, reflectionSourceInspectorStart);

  assert.match(activeReadme, /2026-06-28-loom-reflection-workspace-prd\.md/);
  assert.match(page, /ReflectionWorkspaceClient/);
  assert.match(workspace, /Learning document/);
  assert.match(workspace, /UnderstandingSpine/);
  assert.match(workspace, /understandingVersionsFromCase/);
  for (const prdTerm of [
    'Loom Reflection helps product builders turn real work into',
    'better judgment. That is one vertical',
    'Loom is an external learning and thinking layer for original files.',
    'A PDF stays a PDF, Excel stays',
    'Reflection is the second pass.',
    'word meaning, pronunciation, phrase',
    'original file activity -> anchored learning commit -> user-confirmed principle -> reusable thinking',
    'the user works inside the native file surface while',
    'As a Chinese-native learner reading English material',
    'specific page or selection',
    'later return to Loom for a second',
    'Implementation rule: no Reflection UI change ships without a matching PRD or',
    'docs/canon/LOOM_DESIGN_DISCIPLINE.md',
    'Titlebar controls share one center line with the native traffic lights.',
    'The whole Reflection workspace may use macOS Liquid Glass, but the materials',
    'The four zones have non-overlapping jobs.',
    'Delete reflection belongs to the left sidebar row.',
    'I can import local files into the current reflection',
    'open a PDF source in the native app',
    'Look Up, Translate, Copy, Writing Tools, Summarize, and Services',
    'one-page or two-page viewing',
    'Original file',
    'Native surface',
    'Source disambiguation',
    'Frontmost app identity is not source truth',
    'Wrong-window evidence is still',
    'Native translation receipt',
    'Structured visual extraction',
    'Learning trace',
    'Learning pass',
    'Loom sidecar',
    'Understanding Version Flow',
    'Make learning and review continuous like source control for understanding',
    'local cognitive version-control layer',
    'raw exposure became understanding',
    'understanding became thinking',
    'thinking became a reusable system',
    'passive notebook that merely stores highlights',
    'Thinking system',
    'Convert understanding into future thinking',
    'file + anchor + pass + trace type + user meaning',
    'Local import creates a current-case source and concrete Input trace entry',
    'Sidecar Mode keeps Loom around the material',
    'weaker reader',
    "the user's native app",
    'must not block the responder chain or replace the system menu',
    'The first native bridge is a macOS Services capture.',
    'Capture Selection in Loom',
    'reads the system pasteboard',
    'current Loom sidecar as an anchored Input trace',
    "the browser's own PDF viewer",
    'PDF.js, canvas rendering, or image',
    'The companion copy should be a light confirmation',
    "product contract, not in the user's reading flow",
    'anchored capture: language',
    'The smallest valuable capture is not a note.',
    'first language pass',
    'Second-pass synthesis is allowed to be richer',
    'not a chat, not a mind map, and not a generic notes feed',
    "Its differentiated job is Understanding Version Flow",
    "Loom's broader cognitive version-control layer",
    'understanding history: source anchor, first-pass interpretation',
    'each capture behaves more like a small version commit than a',
    'raw machine metadata belong behind an',
    'audit trail',
    "what changed in the user's understanding across passes",
    'cognition versions',
    'selected material -> first interpretation -> correction -> reflection ->',
    'If the center pane only lists notes',
    'The right pane owns **Evidence Inspector**',
    'Source Collection is secondary',
    'selecting a thinking version in',
    'updates the Evidence Inspector',
    'the right pane inspects the latest version',
    'right pane never becomes a second note feed',
    'thinking version -> evidence inspector',
    'Loom output should beat static packets and rich source-summary products',
    'NotebookLM-style source collections',
    'source-grounded summaries, Q&A, study guides, and rich review formats',
    'Those are table stakes, not the moat',
    '`loom-notes`-style fill-in study notes',
    'active recall scaffolds',
    'what is the spine of this',
    'readable exposition and active recall',
    'It should not compete mainly on static',
    'typesetting, page layout',
    'generic source-grounded Q&A',
    'A compiled course packet can answer: what material was collected',
    'NotebookLM-style tools can answer: what do',
    'what study artifacts can be',
    "user's understanding change while using that material",
    'across native apps and',
    'NotebookLM-style richness is a baseline product requirement',
    'source hub with summaries, questions',
    'artifacts are generated from Loom',
    "cognition trail, not only from uploaded",
    'source collection: the documents, sheets, pages, passages',
    'generated artifacts: summary, Q&A, glossary, timeline',
    "learning trail: the user's selected words, phrases, sentences",
    'versioned understanding: what was first misunderstood',
    'weaker NotebookLM clone',
    'rich source aggregation plus reviewable thinking evolution',
    'rich enough to generate source-grounded summaries, Q&A, glossary, timeline',
    'anchored source trail: exact file, page, selection, region, sheet, or paragraph',
    'native use trail: what happened inside Preview, Word, Excel, browser',
    'understanding diff: what the user thought before, what changed, and why',
    'reflection memory: what changed in judgment after repeated use',
    'Static output is downstream',
    '## Design Discipline',
    'critique and choice, not through feature',
    'What mature capability already exists',
    'What baseline must Loom match',
    'What gap remains that only Loom should own',
    'What tempting implementation is being refused',
    'What acceptance signal proves',
    '### Current Requirement Decisions',
    'Do not make Loom a better PDF app.',
    'Do not make the center pane a note surface.',
    'Do not keep a composer without a commit target.',
    'Do not confuse clean output with differentiation.',
    'Do not confuse NotebookLM-style richness with the final product.',
    'Do not turn every capture into memory.',
    'Do not explain the product in the main surface.',
    '### Design Choice Ledger',
    'observed issue -> chosen rule -> refusal -> acceptance signal',
    'Center owns Understanding Version Flow.',
    'Understanding Spine',
    "Codex records what an agent did",
    "Loom records how a user's understanding",
    'an agent operation log',
    'Composer is a document-edge commit affordance.',
    'Static output is baseline; cognition trail is Loom.',
    '### Decision Protocol',
    'symptom -> critique -> choice -> rule -> acceptance evidence',
    "The user's feedback is evidence, not an instruction to copy literally.",
    'Name the symptom.',
    'Challenge the proposed fix.',
    'Choose the product owner.',
    'Write the rule.',
    'Add evidence.',
    'Do not ship a design change because it makes one screenshot look better.',
    '### Requirement Writing Standard',
    'reference image, native app screenshot, user phrase, or competitor comparison',
    'symptom -> critique -> choice -> owner -> refusal -> acceptance',
    'Make it cleaner',
    'Make it like Codex',
    'Use Liquid glass',
    'Support PDF',
    'Make NotebookLM-like output',
    'Add chat',
    'job -> owner -> user path -> proportion -> material -> copy -> evidence',
    'This order is part of the PRD.',
    'Evidence comes from a real user path',
    '### Requirement Triage',
    'Invariant | A rule Loom must preserve every time',
    'Baseline | A capability mature tools already provide',
    'Differentiator | A job only Loom should own',
    'Refusal | A tempting direction that would make Loom weaker',
    'Open question | A real uncertainty that needs evidence',
    '### Capability And Evidence Ladder',
    'The Translate example is not a translation requirement.',
    'What does the original app or macOS already do well?',
    'What is the smallest truthful fallback',
    'Use this evidence ladder for source context',
    'selected text, copied translation, structured file parse',
    'Loom-owned appshot plus OCR, Vision, or multimodal extraction',
    'user-confirmed manual anchor',
    'The product rule is degradation with honesty.',
    'visual context only',
    'The simplest path wins.',
    '### Questioning And Choice Discipline',
    'Loom requirements are not accepted as features.',
    'Observed failure.',
    'User example.',
    'Bad literal fix.',
    'Existing capability.',
    'Chosen owner.',
    'Discipline added.',
    'Acceptance evidence.',
    'If the decision record cannot identify a bad literal fix',
    'Every accepted design choice must also carry a refusal.',
    'not commentary',
    'Every implementation pass must also write or preserve an implementation record',
    'classification -> preserved capability -> baseline matched -> Loom-only value -> surface owner -> refusal -> acceptance path',
    '"Cleaner", "more native", "more like Codex", "more like Preview"',
    'one surface that owns the change',
    '### Design Constitution',
    'The original file is the subject; Loom is the learning and reflection layer',
    'A native capability is always cheaper than a Loom clone',
    'The center pane earns its existence only by showing how understanding changed',
    'Static output is a baseline export, not the product',
    'Rich source summaries are baseline',
    'No visible surface may exist without a single product duty.',
    '### Center Workspace Discipline',
    'Understanding Version Flow',
    '理解版本流',
    'It should not default to long explanatory metadata.',
    'collapsed audit trail',
    'decorative sections',
    '### Composer Discipline',
    'The document-edge input exists only if it has a version target.',
    'If the composer cannot name one of these targets, it should be hidden',
    'A generic "ask or type anything" box is not a',
    'Loom primitive; it belongs only inside',
    '### Output Discipline',
    'native use -> anchored captures -> understanding versions -> second-pass synthesis -> export',
    'structure, readability, and rich presentation',
    'Word/PPT documents, dynamic HTML dossiers',
    'video or narrated walkthrough formats',
    'dynamic HTML artifact, video/script outline',
    'Rich output has four requirements',
    'structural strength',
    'media fitness',
    'replayability',
    'If the output cannot show that',
    'it is just another static or rich AI-generated packet.',
    'Baseline vs Differentiation',
    'Do not confuse a baseline feature with product differentiation',
    'Preview/default PDF apps',
    'Word/Excel/PowerPoint',
    'AI chat',
    'meet the baseline and own the',
    'thinking-history layer',
    'Surface Duties',
    'Native file surface: keep the original work alive',
    'Loom Companion: confirm a capture',
    'Composer: commit the next understanding version',
    'Export surface: produce readable packets after review',
    'Commit Rule',
    'The atomic Loom unit is not "note". It is "understanding version".',
    'source anchor: file, page, region',
    'Refusal Rules',
    'rebuilds a native PDF/Word/Excel function',
    'treats uploaded files only as RAG attachments',
    'rich source summaries as the final product',
    'composer a generic chat input',
    'adds controls without assigning them to a single surface duty',
    'Center workspace | Understanding Spine inside Understanding Version Flow',
    'an agent operation log',
    'a center entry must look like a thinking version',
    'version type: selected word, phrase, sentence, passage',
    'state: needs meaning, needs interpretation, committed',
    'Raw source app, trace type, window title, file path',
    'When a learning case reaches `Second pass ready`',
    'continue the same Understanding Version Flow',
    'scaffolding belongs to product cases',
    'not a replacement',
    'reader, chat answer, note feed, or duplicate',
    'Manual text typed into a learning case is an understanding version',
    'Version History as user meaning, question, correction, or principle',
    'manual meaning should attach to the most recent unresolved',
    'explicit principles can become memory candidates',
    'Product intent is visible: Loom reads as an external learning',
    'The original file remains primary',
    'Captures preserve file, page or region, pass, trace type, and user meaning.',
    'Anchor precision is user-facing evidence',
    'only app/window/time context must say so explicitly',
    'Weak fallback labels such as `window+page`',
    'require a short `anchor note`',
    'FINS3666 Week 1 Quantitative',
    'Trading Algorithmic Trading.pdf',
    'Learning Output Packet',
    'Understanding object',
    'Consolidate raw captures into the object the user should actually review',
    '`market` and `making` may start as word traces',
    '`market making` is captured from the same passage',
    'larger objects absorb component traces',
    'fill-in prompts or review gaps',
    'active recall trail',
    'source/provenance',
    'learning objectives',
    'key concepts',
    'agenda',
    'sections',
    'page-aware citations',
    'claims came from the original material',
    'corrected understanding',
    'affordances: table of contents',
    'One-page and two-page viewing are PDF layout states, not Loom features.',
    'The fixed right Sources pane is hidden in Sidecar Mode.',
    'Deleting the final case should leave one empty reflection',
    'Temporary sidebar peek is allowed only as a collapsed-state hover affordance.',
    'Hover near the left edge may slide the sidebar out as an overlay.',
    'inside the slid-out sidebar, the sidebar stays visible.',
    'center/right pane proportions, pane seams, titlebar',
    'the center workspace background as its transparent material base',
    'Its internal controls also shift',
    'to center-pane hierarchy',
    'permanent sidebar state or center/right pane proportions.',
    'Temporary hover peek uses center-backed glass',
    'Loom captures unanchored notes',
    'reading mode makes Loom visually louder',
    'native file sidecar model',
    'anchored learning traces',
    'cloned Excel or Word editors',
    'Reject PRD drift',
    'Do not call a visual change complete from source code alone.',
    'Do not call a product change complete from a screenshot alone.',
  ]) {
    assertTextContains(reflectionPrd, prdTerm);
  }
  for (const canonTerm of [
    'Reflection / Sidecar Design Discipline',
    'LOOM_DESIGN_DISCIPLINE.md',
    'Every Loom design change must be written as a choice under constraint',
    'What already exists?',
    'What baseline must Loom match?',
    "What is Loom's unique job?",
    'What are we refusing?',
    'Preservation:',
    'Baseline:',
    'Differentiation:',
    'If Loom skips preservation',
    'The atomic Loom unit is **understanding version**, not note.',
    'Learning captures are not append-only notes.',
    'single-word translations become absorbed evidence',
    'Grouped objects mean semantic consolidation, not a',
    'formulas, tables, figures, concepts, or problems absorb their component traces',
    'Original file app owns reading, editing, page modes',
    'Center workspace owns Understanding Spine inside Understanding Version Flow',
    'Capability Ladder',
    'Evidence Ladder',
    'Simplest Path Rule',
    'Missing Information Handling',
    'Sandbox honesty',
    'a sandboxed Service capture may only prove selected text',
    'not precise anchors until an allowed AX helper',
    'appshot/OCR/Vision/model extraction',
    'Source disambiguation',
    'frontmost app identity is not source truth',
    'Wrong-window downgrade',
    'different document than the target learning file',
    'visual context only',
    'fake precise anchor',
    'Never present a lower rung as a higher one.',
    'strongest evidence available',
    'does not fake file/page/cell certainty',
    'Codex records what an agent did',
    'Understanding Spine',
    'Composer owns committing the next understanding version',
    'Rich summaries, Q&A, glossaries, study guides, and A4 exports are baseline',
    'Circle-style course packet',
    'source/provenance, learning objectives, key concepts, agenda, sections',
    "The user's FINS3666 Circle packet is already fast, complete, and reviewable.",
    'match that Learning Output Packet floor',
    'source anchors, passes, corrections, and principles produced it',
    'loom-notes`-style active recall packets',
    'No turning the center workspace into a LaTeX worksheet editor',
    'Fill-in prompts trace back to source anchors',
    'trail, not only from uploaded files',
    'A rich source dossier is a baseline review / export view',
    'source collection, generated artifacts, source',
    'learning trail, versioned understanding, and reuse',
    'Source collection plus generated artifacts is baseline',
    'plus understanding evolution is Loom',
    'symptom -> critique -> choice -> rule -> acceptance evidence',
    'request -> symptom -> objection -> baseline -> Loom-only gap -> owner -> rule -> evidence',
    'The objection step is mandatory.',
    "The user's wording is evidence, not an implementation order.",
    'invariant, baseline',
    'differentiator, refusal, or open question',
    'Requirements are not accepted as feature orders.',
    'observed failure -> user example -> bad literal fix -> existing capability -> chosen owner -> discipline added -> acceptance evidence',
    'If the record cannot name a bad literal fix',
    'Every accepted choice must carry a matching',
    'refusal',
    'Every implementation pass must also preserve this shorter product record',
    'classification -> preserved capability -> baseline matched -> Loom-only value -> surface owner -> refusal -> acceptance path',
    '"Cleaner", "more native", "more like Codex", "more like Preview"',
    'preserved capability, baseline, Loom-only value, owner',
    'Requirement writing is itself a product discipline.',
    'Screenshots, comparisons,',
    'and user wording are evidence, not specs.',
    'symptom -> critique -> choice -> owner -> refusal -> acceptance',
    'Do not start a Loom design from material, color, glass',
    'job -> owner -> user path -> proportion -> material -> copy -> evidence',
    'Vague requests such as "make it cleaner"',
    'what Loom-only',
    'how it can become',
    'synthesis / memory / export',
    'Current requirement discipline from the PDF / Word / GitHub / Circle /',
    'Do not make Loom a better PDF, Word, or Excel app.',
    'Do not make the center a note surface.',
    'Do not keep the composer if it cannot name the next commit target.',
    'Do not claim static or rich output as the moat.',
    'Do not stop at NotebookLM-style source richness.',
    'Do not convert every capture into memory.',
    'Do not explain the product in the main surface.',
    'Every serious design pass leaves a design choice ledger:',
    'observed issue -> chosen rule -> refusal -> acceptance signal',
    'If the ledger is missing',
    'The current design constitution:',
    'The original file is the subject; Loom is the learning and reflection layer',
    'A native capability is cheaper than a Loom clone',
    'The center workspace earns its existence only by showing how understanding',
    'The composer is not a chat box',
    'Static output and NotebookLM-style richness are baseline exports.',
    'rich source aggregation plus the user',
    'A design that cannot be tested through a real user path is an illustration',
    'Every roadmap item must name both the baseline it protects',
    'Understanding Spine inside Understanding Version Flow',
    'Codex records what an agent did',
    'Loom records how the user',
    'Agent operation log',
    'Understanding Version Flow',
    '理解版本流',
    'The document-edge composer appears only when it has a version target',
    'A generic free-form chat box is rejected',
    'Current precedent:',
    'PDF learning uses Preview / native PDF apps as the reader.',
    'In learning mode the default shape',
    'quiet document-edge note field',
    'Type choice, source anchor, and assist controls stay hidden',
    'Full source metadata belongs in tooltip, aria-label, Evidence, or audit',
    'Learning center defaults to the organized understanding object',
    'Version counts, capture receipts, raw evidence labels, and automation scaffolding stay behind',
    'Glass is a material system; light is momentary feedback',
    'Siri-like white/prism light belongs',
    'Excel, Word, and other native files keep their own editing',
    'it is product noise',
  ]) {
    assertTextContains(loomRules, canonTerm);
  }
  for (const disciplineTerm of [
    'Loom Design Discipline',
    'critique, choice, refusal, and evidence',
    'Loom is a local cognitive version-control layer around original work.',
    'native work -> anchored capture -> understanding version -> second-pass synthesis -> reusable thinking -> export',
    'Discipline Stack',
    'Preservation',
    'Baseline',
    'Differentiation',
    'Most wrong Loom designs happen when a baseline is mistaken for',
    'preserve mature tools -> satisfy baseline output -> spend Loom surface area only on understanding versions',
    'Structured rich output is table stakes.',
    'Use a capability ladder before building.',
    'Use an evidence ladder when information is missing.',
    'The simplest truthful path wins.',
    'Native translation is only one example of preserved native actions.',
    'Visual extraction is a fallback and enrichment path.',
    'Frontmost app is not source truth.',
    'Wrong-window evidence must downgrade the anchor.',
    'NotebookLM-style richness is baseline.',
    'The center is Understanding Version Flow.',
    'The composer is a commit affordance, not a bottom bar.',
    'quiet document-edge note field: one line of user language',
    'Type choice, compact source anchor, and assist controls',
    'Full metadata belongs in evidence or audit',
    'The center pane shows the understanding object first.',
    'Version counts, capture receipts, and raw automation evidence belong behind Capture trail',
    'Learning traces mature into semantic objects.',
    'That is only one example of the',
    'formulas, tables, figures, claims, examples, questions, or corrections',
    'Larger objects show the useful review',
    'The same source context produces word, phrase, and sentence captures.',
    'Larger semantic objects absorb smaller traces',
    'Every accepted choice carries a refusal.',
    'User wording is evidence, not instruction.',
    'Do not ship a concept without a path.',
    'Do not ship a path without a review object.',
    'Do not ship a review object without reuse.',
    'Current Hard Requirements From Critique',
    'Native PDF already has Translate, Look Up',
    'Word and GitHub already have version history',
    'Circle / LaTeX / AI chat can already make fast readable packets.',
    'NotebookLM-style tools already create rich source summaries',
    'The input box has no meaning when it accepts anything.',
    'The visible object should look like a human learning record',
    'Capture feedback became too large and explanatory.',
    'Loom Companion is a small transient saved receipt only',
    'selected text, source metadata, trace explanation',
    'Multiple Preview / Word / Excel windows can confuse automation',
    'Loom is meant to become a thinking service / future brain interface.',
    'Memory is only user-confirmed reusable thinking',
    'Design Choice Ledger',
    'Every serious design pass should leave a ledger entry.',
    'Observed issue | Chosen rule | Refusal | Acceptance signal',
    'Center is Understanding Version Flow.',
    'Composer is a document-edge commit affordance.',
    'Static output is baseline; cognition trail is the Loom layer.',
    'Computer-use can observe a different Preview document',
    'The ledger is not optional.',
    'Questioning Loop',
    'request -> symptom -> objection -> baseline -> Loom-only gap -> owner -> rule -> evidence',
    'The objection step is mandatory.',
    'Decision Gate',
    'Observed failure',
    'Bad literal fix',
    'Existing capability',
    'Chosen owner',
    'Acceptance evidence',
    'Implementation Record',
    'Every implementation pass must leave a short product record',
    'classification -> preserved capability -> baseline matched -> Loom-only value -> surface owner -> refusal -> acceptance path',
    'Do not implement from an adjective.',
    '"Cleaner", "more native", "more like',
    'both the baseline it',
    'protects and the Loom-only value',
    'The implementation record is the product discipline',
    'Requirement Writing Discipline',
    'Screenshots, analogies, and user wording are evidence, not specs.',
    'Every written requirement must include six parts',
    'symptom -> critique -> choice -> owner -> refusal -> acceptance',
    'make it cleaner',
    'make it like Codex',
    'add Liquid glass',
    'support PDF',
    'make NotebookLM-like output',
    'add a chat box',
    'job -> owner -> user path -> proportion -> material -> copy -> evidence',
    'Do not start with material, color, glass, animation, or layout.',
    'Product Discipline Checklist',
    'What native or mature capability are we preserving?',
    'What Loom-only thinking-history value are we adding?',
    'What object is created or revised?',
    'How can it become synthesis, memory, or export?',
    'Request Triage',
    'Surface Ownership',
    'Native file app',
    'Loom Companion',
    'Center workspace',
    'Composer',
    'Export',
    'Memory',
    'Baseline vs Moat Rules',
    'Rich Dossier Discipline',
    'A rich source dossier is required',
    'not the center workspace',
    'source collection: files, pages, passages',
    'generated artifacts: summary, Q&A, glossary',
    'NotebookLM-style tools already cover much of this',
    'source collection plus generated artifacts is baseline',
    'plus understanding evolution is',
    'The center workspace still remains Understanding Version Flow.',
    'Evidence Inspector',
    'Source Collection is secondary',
    'which source anchors and which user',
    'Every roadmap item must therefore name both: the baseline it protects and',
    'Current Debate Resolutions',
    'PDF Learning',
    'Center Workspace',
    'Excel / Word / Other Native Files',
    'preserved capability -> baseline met -> Loom-only value -> refusal still true -> evidence path',
    'Native File Sidecar',
    'Understanding Version Flow',
    'Rich Output',
    'Acceptance Discipline',
    'A Loom change is not accepted from source code alone.',
    'A visual change is not accepted from a screenshot alone.',
    'the native app still owns its native capabilities',
    'the refusal is still true after the implementation',
    'When in doubt, choose the mature existing tool',
    'Liquid Glass light is interaction feedback, not background decoration.',
    'short-lived, local, and',
    'if it continuously attracts attention, it is visual noise',
    'Center and right panes may use frosted material',
    'Those effects belong only to action controls.',
    'No animated color wash on sidebars',
    'Center/right material can be frosted but not visually alive.',
    'Middle and right panes read as stable paper/inspector surfaces',
  ]) {
    assertTextContains(designDiscipline, disciplineTerm);
  }
  for (const pollutionTerm of [
    'wrong-window / weak-anchor finding',
    'do not promote it to',
    'file/page/cell evidence',
  ]) {
    assertTextContains(pollutionRules, pollutionTerm);
  }
  for (const label of ['Input', 'Assumption', 'Decision Trace', 'Outcome', 'Reflection', 'Judgment Memory']) {
    assert.match(workspace, new RegExp(escapeRegExp(label)));
    assert.match(nativeSurface, new RegExp(escapeRegExp(label)));
  }
  for (const retired of ['KaaS', 'portfolio', 'skill', 'Digital Me']) {
    assert.doesNotMatch(workspace, new RegExp(escapeRegExp(retired), 'i'));
    assert.doesNotMatch(nativeSurface, new RegExp(escapeRegExp(retired), 'i'));
  }
  for (const contractTerm of [
    'Baseline desktop window: 1320 x 860 pt',
    'Reflection workspace minimum: 1184 x 720 pt',
    'File Sidecar minimum: 560 x 620 pt',
    'Default window | 1320 x 860 pt',
    'Reflection minimum window | 1184 x 720 pt',
    'File Sidecar minimum | 560 x 620 pt',
    'Titlebar height | 52 pt',
    'Titlebar controls | 16 x 16 pt',
    'Titlebar control center line | 16 pt',
    'Titlebar control top inset | 8 pt',
    'Codex reference image measured at 3456 x 2048 px',
    'The reference image is not a generic three-column layout',
    'sidecar-first',
    'external learning and',
    'original file remains the main surface',
    'Loom must stay visually subordinate',
    'Left rail: persistent navigation, project memory, account state',
    'Center workstream: the live reasoning/log surface, active input, or currently promoted material',
    'Right material pane: concrete files, document context, and source preview in Reflection Mode.',
    'Local import is a Sources-pane action.',
    'Sidecar Mode is the exception to the old "Sources stays on the side" rule.',
    'preserve Preview, Excel, Word, browser, and macOS document',
    'During native-file learning, the main Loom workspace stays parked after the',
    'plus a compact Loom Companion panel',
    'Review in Loom is the explicit transition',
    'The Sidecar Mode hierarchy is file first, Loom second.',
    'capture word,',
    'pronunciation, phrase',
    'must not become permanent',
    '`NSWorkspace` opens the original file',
    'one-page/two-page states',
    'keep the PDFView responder',
    'Look Up, Translate, Copy',
    'Writing Tools, Summarize, Services',
    'super.menu(for:)',
    'Native selection capture enters Loom through macOS Services and the system',
    'The Service label is "Capture Selection in Loom"',
    'selected passage to the current sidecar Input trace',
    'must not install a custom PDF reader',
    'bypasses macOS Services/pasteboard',
    'Preview/default PDF apps own',
    'right Sources pane may collapse',
    'They should never force another permanent pane',
    'file-reader states or macOS services',
    'Each capture must be anchorable back to the original file context',
    'learning pass, trace type, and user meaning',
    'append a concrete Input trace',
    'For Loom this maps to',
    'Verified v7 screenshot `/tmp/loom-reflection-window-v7-proportions.png`',
    'left navigation rail near 240 pt',
    'right material/file area near 575 pt',
    'Traffic-light clearance | 88 pt',
    'Left sidebar width | 240 pt',
    'Right Sources width | 400 pt',
    'Thread max width | 720 pt',
    'Sidebar body top inset | 72 pt',
    'Thread body top inset | 76 pt',
    'Inspector body top inset | 74 pt',
    'The whole workbench may use Liquid Glass, but not as one repeated effect.',
    'The titlebar is a control overlay, not a layout row',
    'Pane seams align without turning the workbench into six boxed regions',
    'Hovering near the left edge may temporarily overlay the sidebar at 240 pt',
    'inside the slid-out sidebar, the sidebar stays',
    'The peek overlay must not move the center workspace',
    'The peek overlay glass must use the center workspace background',
    'must not reuse the permanent left-rail material',
    'buttons, search, selected rows, row metadata, and delete affordances',
    'The titlebar must not draw its own material background, internal vertical separators, or a full-width hard bottom rule',
    'macOS 27-style white light and small red/gold/blue separation belong to',
    'one-shot points of emphasis',
    'it cannot own prism light, moving glare, persistent',
    'Optical light is reserved for moments of action',
    'not the workspace theme',
    'The learning center default is the organized understanding object',
    'Show the selected word, phrase, sentence, data point, user',
    'keep capture receipts, version counts, and raw evidence labels',
    'The learning composer is a quiet document-edge note field',
    'not a second toolbar',
    'Full source metadata belongs in tooltip, aria-label, Evidence, or audit',
    'A learning composer that repeats the full filename',
    'Persistent glow on normal selection rows',
    'Visible learning-default copy such as `Receipts`, `Needs human meaning`',
    'A custom PDF canvas/image reader replacing Preview or the user',
    'A Loom PDF context menu that omits `super.menu(for:)`',
    'visually dominate the original',
    'cannot return to the file, page, selected text',
  ]) {
    assertTextContains(layoutContract, contractTerm);
  }
  assert.match(
    layoutContract,
    /Titlebar \| Window-level status, current case, source count, sidebar and Sources toggles/,
  );
  assert.match(
    layoutContract,
    /Center workspace \| Reflection trace, composer, and sidecar record for the current original file/,
  );
  assert.match(loomApp, /private let loomWorkspaceMinimumSize = NSSize\(width: 1184, height: 720\)/);
  assert.match(
    loomApp,
    /\.frame\(minWidth: loomWorkspaceMinimumSize\.width, minHeight: loomWorkspaceMinimumSize\.height\)/,
  );
  assert.match(loomApp, /\.defaultSize\(width: 1320, height: 860\)/);
  assert.match(loomApp, /contentRect: NSRect\(x: 0, y: 0, width: 1320, height: 860\)/);
  assert.match(loomApp, /window\.minSize = loomWorkspaceMinimumSize/);
  assert.doesNotMatch(loomApp, /private let loomFileSidecarMinimumSize/);
  assert.doesNotMatch(loomApp, /private func scheduleFileSidecarPresentation\(\)/);
  assert.doesNotMatch(loomApp, /private func presentMainWindowAsFileSidecar\(\)/);
  assert.doesNotMatch(loomApp, /visibleFrame\.width \* 0\.32/);
  assert.match(loomApp, /private var externalCompanionWindow: NSPanel\?/);
  assert.match(loomApp, /private var externalCompanionKeepsMainParked = false/);
  assert.match(loomApp, /final class LoomExternalCompanionPanel: NSPanel/);
  assert.match(loomApp, /override var canBecomeKey: Bool \{ true \}/);
  assert.match(loomApp, /override var canBecomeMain: Bool \{ false \}/);
  assert.match(loomApp, /struct LoomExternalCompanionView: View/);
  assert.match(loomApp, /private func presentExternalCompanionWindow\(\)/);
  assert.match(loomApp, /private var externalCompanionDismissToken: UUID\?/);
  assert.match(loomApp, /private func scheduleExternalCompanionAutoDismiss\(\)/);
  assert.match(loomApp, /private func dismissExternalCompanionReceipt\(matching token: UUID\? = nil, clearParking: Bool\)/);
  assert.match(loomApp, /private func parkMainWindowForExternalCompanion\(\)/);
  assert.match(loomApp, /private func openMainWindowFromExternalCompanion\(\)/);
  assert.match(
    loomApp,
    /private func ensureMainWindowVisible\(\)[\s\S]{0,180}if externalCompanionKeepsMainParked \{[\s\S]{0,120}parkMainWindowForExternalCompanion\(\)[\s\S]{0,80}return/,
    'main-window repair must not reopen Loom over the native file during companion learning',
  );
  assert.match(
    loomApp,
    /func applicationShouldHandleReopen[\s\S]{0,220}if externalCompanionKeepsMainParked \{[\s\S]{0,120}parkMainWindowForExternalCompanion\(\)[\s\S]{0,80}return/,
    'Dock/AppKit reopen repair must not clear external companion parking',
  );
  assert.match(
    loomApp,
    /private func openMainWindowFromExternalCompanion\(\)[\s\S]{0,100}dismissExternalCompanionReceipt\(clearParking: true\)[\s\S]{0,80}ensureMainWindowVisible\(\)/,
    'Review in Loom is the explicit path back to the full workspace',
  );
  assert.match(
    loomApp,
    /styleMask:\s*\[\.borderless,\s*\.nonactivatingPanel\]/,
    'external companion should be a borderless non-activating receipt, not a replacement main workspace',
  );
  assert.doesNotMatch(loomApp, /styleMask:\s*\[\.titled,\s*\.nonactivatingPanel,\s*\.fullSizeContentView\]/);
  assert.match(loomApp, /let panel = LoomExternalCompanionPanel\(/);
  assert.match(loomApp, /panel\.standardWindowButton\(\.closeButton\)\?\.isHidden = true/);
  assert.match(loomApp, /panel\.standardWindowButton\(\.miniaturizeButton\)\?\.isHidden = true/);
  assert.match(loomApp, /panel\.standardWindowButton\(\.zoomButton\)\?\.isHidden = true/);
  assert.match(loomApp, /panel\.identifier = NSUserInterfaceItemIdentifier\("loom\.externalCompanion"\)/);
  assert.match(loomApp, /panel\.title = "Loom Companion"/);
  assert.match(loomApp, /panel\.collectionBehavior = \[\.canJoinAllSpaces, \.fullScreenAuxiliary, \.transient\]/);
  assert.match(loomApp, /externalCompanionKeepsMainParked = true/);
  assert.match(loomApp, /panel\.orderFrontRegardless\(\)/);
  assert.match(
    loomApp,
    /panel\.orderFrontRegardless\(\)[\s\S]{0,120}scheduleExternalCompanionAutoDismiss\(\)/,
    'external companion must behave as a transient saved receipt, not a persistent floating card',
  );
  assert.match(loomApp, /DispatchQueue\.main\.asyncAfter\(deadline: \.now\(\) \+ 4\.2\)/);
  assert.match(loomApp, /dismissExternalCompanionReceipt\(matching: token, clearParking: true\)/);
  assert.match(loomApp, /externalCompanionWindow\?\.orderOut\(nil\)/);
  assert.match(loomApp, /panel\.becomesKeyOnlyIfNeeded = true/);
  assert.doesNotMatch(loomApp, /panel\.makeKey\(\)/);
  assert.match(loomApp, /private let loomExternalCompanionSize = NSSize\(width: 276, height: 64\)/);
  assert.match(loomApp, /\.frame\(width: loomExternalCompanionSize\.width, height: loomExternalCompanionSize\.height\)/);
  assert.match(loomApp, /panel\.minSize = loomExternalCompanionSize/);
  assert.match(loomApp, /panel\.maxSize = loomExternalCompanionSize/);
  assert.match(loomApp, /panel\.setContentSize\(loomExternalCompanionSize\)/);
  assert.match(loomApp, /let width = loomExternalCompanionSize\.width/);
  assert.match(loomApp, /let height = loomExternalCompanionSize\.height/);
  assert.doesNotMatch(loomApp, /selectedMaterial|selectedTextPreview|sourceMetadataPreview|traceExplanation/);
  assert.doesNotMatch(loomApp, /private static func companionPreview\(for text: String, kind: LoomNativeDocumentKind\) -> String/);
  assert.doesNotMatch(loomApp, /compactSpreadsheetPreview/);
  assert.match(loomApp, /fallbackMaterializationToken = nil/);
  assert.match(loomApp, /for window in mainWindows\(includeHidden: true\)[\s\S]{0,80}parkVisibleMainWindow\(window\)/);
  assert.match(loomApp, /private func parkVisibleMainWindow\(_ window: NSWindow\)/);
  assert.match(loomApp, /window\.ignoresMouseEvents = true[\s\S]{0,80}window\.alphaValue = 0[\s\S]{0,80}window\.orderOut\(nil\)/);
  assert.match(
    loomApp,
    /if externalCompanionKeepsMainParked \{[\s\S]{0,80}closeMainWindow\(window\)/,
    'companion mode must close the full workspace; only Review in Loom should reopen it',
  );
  assert.match(loomApp, /private func presentWindowOnActiveSpace\(_ window: NSWindow\) \{[\s\S]{0,120}window\.alphaValue = 1[\s\S]{0,120}window\.ignoresMouseEvents = false/);
  assert.match(loomApp, /if window\.identifier\?\.rawValue == "loom\.externalCompanion" \{ return false \}/);
  assert.match(loomApp, /private var companionMainWindowSuppressionObserver: NSObjectProtocol\?/);
  assert.match(loomApp, /registerCompanionMainWindowSuppressionObserver\(\)/);
  assert.match(loomApp, /NSApplication\.didUpdateNotification/);
  assert.match(loomApp, /externalCompanionKeepsMainParked[\s\S]{0,180}parkMainWindowForExternalCompanion\(\)/);
  assert.match(loomApp, /private func isMainWindowForParking\(_ window: NSWindow, includeHidden: Bool\) -> Bool/);
  assert.match(loomApp, /NSApp\.windows\.filter \{ window in[\s\S]{0,120}isMainWindowForParking\(window, includeHidden: includeHidden\)/);
  assert.doesNotMatch(
    loomApp,
    /let isMainWindow =[\s\S]{0,160}guard isMainWindow, window\.canBecomeKey/,
    'main-window parking must catch visible SwiftUI main windows even when they are not keyable',
  );
  assert.match(loomApp, /guard let self, self\.externalCompanionKeepsMainParked else \{ return \}/);
  assert.match(loomApp, /private enum LoomNativeDocumentKind/);
  assert.match(loomApp, /case pdf[\s\S]*case word[\s\S]*case spreadsheet/);
  assert.match(loomApp, /case "doc", "docx", "pages", "rtf", "rtfd":[\s\S]{0,40}return \.word/);
  assert.match(loomApp, /case "xls", "xlsx", "csv", "tsv", "numbers":[\s\S]{0,40}return \.spreadsheet/);
  assert.doesNotMatch(loomApp, /@Published private\(set\) var subtitle/);
  assert.doesNotMatch(loomApp, /subtitle: kind\.openSubtitle/);
  assert.doesNotMatch(loomApp, /subtitle: kind\.captureSubtitle/);
  assert.doesNotMatch(loomApp, /func openSubtitle/);
  assert.doesNotMatch(loomApp, /func captureSubtitle/);
  assert.doesNotMatch(loomApp, /kind\.captureDetail/);
  assert.doesNotMatch(loomApp, /var captureDetail: String/);
  assert.doesNotMatch(loomApp, /private enum LoomNativeLearningFocus/);
  assert.doesNotMatch(loomApp, /PDF sentence meaning/);
  assert.doesNotMatch(loomApp, /PDF phrase meaning/);
  assert.doesNotMatch(loomApp, /PDF vocabulary/);
  assert.doesNotMatch(loomApp, /Spreadsheet data/);
  assert.doesNotMatch(loomApp, /Document meaning/);
  assert.doesNotMatch(loomApp, /Added to Thinking History/);
  assert.doesNotMatch(loomApp, /Added as data version/);
  const externalOpenStart = loomApp.indexOf('private func openExternalFiles(_ urls: [URL])');
  const externalOpenEnd = loomApp.indexOf('private func postExternalFileOpen', externalOpenStart);
  const externalCaptureStart = loomApp.indexOf('private func captureExternalSelection(_ capture: LoomExternalSelectionCapture)');
  const externalCaptureEnd = loomApp.indexOf('private func postExternalSelectionCapture', externalCaptureStart);
  assert.ok(externalOpenStart >= 0 && externalOpenEnd > externalOpenStart);
  assert.ok(externalCaptureStart >= 0 && externalCaptureEnd > externalCaptureStart);
  const externalOpenBlock = loomApp.slice(externalOpenStart, externalOpenEnd);
  const externalCaptureBlock = loomApp.slice(externalCaptureStart, externalCaptureEnd);
  assert.doesNotMatch(externalOpenBlock, /NSApp\.activate|ensureMainWindowVisible\(\)/);
  assert.doesNotMatch(externalCaptureBlock, /NSApp\.activate|ensureMainWindowVisible\(\)/);
  assert.match(externalOpenBlock, /presentExternalCompanion\(for: fileURLs\)/);
  assert.match(externalCaptureBlock, /presentExternalCompanion\(for: capture\)/);
  assert.match(externalOpenBlock, /parkMainWindowForExternalCompanion\(\)/);
  assert.match(externalCaptureBlock, /parkMainWindowForExternalCompanion\(\)/);
  assert.doesNotMatch(loomApp, /\.defaultSize\(width: 1400, height: 900\)/);
  assert.match(
    styles,
    /grid-template-columns:\s*var\(--reflection-sidebar-width\) minmax\(34rem, 1fr\) var\(--reflection-sources-width\)/,
  );
  assert.match(styles, /--reflection-sidebar-width:\s*14rem/);
  assert.match(styles, /--reflection-sources-width:\s*22rem/);
  assert.match(workspace, /data-sidebar-collapsed=\{isSidebarCollapsed\}/);
  assert.match(workspace, /const \[isSidebarPeeking, setIsSidebarPeeking\] = useState\(false\)/);
  assert.match(workspace, /const shouldShowFullSidebar = !isSidebarCollapsed \|\| isSidebarPeeking/);
  assert.match(workspace, /data-sidebar-peeking=\{isSidebarPeeking\}/);
  assert.match(workspace, /onMouseEnter=\{handleSidebarMouseEnter\}/);
  assert.match(workspace, /onMouseLeave=\{handleSidebarMouseLeave\}/);
  assert.match(workspace, /function handleSidebarMouseLeave\(\)[\s\S]{0,100}setIsSidebarPeeking\(false\)/);
  assert.match(workspace, /data-sources-collapsed=\{isSourcesCollapsed\}/);
  assert.match(workspace, /className=\{styles\.paneToggleButton\}/);
  assert.match(workspace, /PanelLeftOpen/);
  assert.match(workspace, /PanelLeftClose/);
  assert.match(workspace, /PanelRightOpen/);
  assert.match(workspace, /PanelRightClose/);
  assert.doesNotMatch(workspace, /ChevronLeft/);
  assert.doesNotMatch(workspace, /ChevronRight/);
  assert.match(workspace, /className=\{styles\.paneToggleButton\}[\s\S]{0,160}aria-label="Expand reflection sidebar"/);
  assert.match(workspace, /className=\{styles\.paneToggleButton\}[\s\S]{0,160}aria-label="Collapse reflection sidebar"/);
  assert.match(workspace, /className=\{styles\.paneToggleButton\}[\s\S]{0,160}aria-label="Expand sources inspector"/);
  assert.match(workspace, /className=\{styles\.paneToggleButton\}[\s\S]{0,160}aria-label="Collapse sources inspector"/);
  assert.match(workspace, /function deleteReflection\(caseId: string\)/);
  assert.match(workspace, /const fileInputRef = useRef<HTMLInputElement>\(null\)/);
  assert.doesNotMatch(workspace, /type WorkspaceMode = 'reflection' \| 'reader'/);
  assert.doesNotMatch(workspace, /const \[workspaceMode, setWorkspaceMode\]/);
  assert.doesNotMatch(workspace, /data-workspace-mode=\{workspaceMode\}/);
  assert.match(workspace, /function openLocalImport\(\)[\s\S]{0,80}fileInputRef\.current\?\.click\(\)/);
  assert.match(workspace, /function isPdfSource\(source: ReflectionSource\)/);
  assert.match(workspace, /URL\.createObjectURL\(file\)/);
  assert.match(workspace, /objectUrlsRef\.current\.forEach\(\(url\) => URL\.revokeObjectURL\(url\)\)/);
  assert.match(workspace, /async function importLocalFiles\(event: ChangeEvent<HTMLInputElement>\)/);
  assert.match(workspace, /Promise\.all\(files\.map\(fileToReflectionSource\)\)/);
  assert.match(workspace, /file\.slice\(0, 48_000\)\.text\(\)/);
  assert.match(workspace, /sources: \[\.\.\.importedSources, \.\.\.item\.sources\]/);
  assert.match(workspace, /input: \[\.\.\.item\.sections\.input, \.\.\.inputLines\]/);
  assert.match(workspace, /type="file"[\s\S]{0,80}multiple[\s\S]{0,120}onChange=\{importLocalFiles\}/);
  assert.match(workspace, /aria-label="Import local source"/);
  assert.match(workspace, /title="Import local source"/);
  assert.match(workspace, /<Upload size=\{14\} \/>/);
  assert.match(workspace, /function selectSource\(source: ReflectionSource\)/);
  assert.match(workspace, /setInspectorTarget\('source'\)/);
  assert.match(workspace, /data-native-primary=\{isNativePrimarySource\(source\)\}/);
  assert.match(workspace, /onClick=\{\(\) => selectSource\(source\)\}/);
  assert.doesNotMatch(workspace, /function SourceReader\(/);
  assert.doesNotMatch(workspace, /function BrowserPdfReader\(\{/);
  assert.doesNotMatch(workspace, /function PdfFallbackReader\(\{/);
  assert.doesNotMatch(workspace, /className=\{styles\.browserPdfReader\}/);
  assert.doesNotMatch(workspace, /className=\{styles\.pdfFrame\}/);
  assert.doesNotMatch(workspace, /<iframe/);
  assert.doesNotMatch(workspace, /import\('pdfjs-dist\/legacy\/build\/pdf\.mjs'\)/);
  assert.doesNotMatch(workspace, /page\.render\(\{ canvasContext: context, viewport, canvas \}/);
  assert.doesNotMatch(workspace, /layout === 'spread'/);
  assert.doesNotMatch(workspace, /<Columns2 size=\{14\} \/>/);
  assert.doesNotMatch(workspace, /Fallback preview/);
  assert.doesNotMatch(workspace, /function sourceCanOpenInReader\(source: ReflectionSource\)/);
  assert.match(workspace, /function isNativePrimarySource\(source: ReflectionSource\)/);
  assert.match(workspace, /isPdfSource\(source\)[\s\S]{0,160}docx\?/);
  assert.doesNotMatch(workspace, /<strong>Native source<\/strong>/);
  assert.doesNotMatch(workspace, /Use the original app\. Loom records understanding versions\./);
  assert.doesNotMatch(workspace, /const readerEngine = canRenderPdf \? 'browser' : 'static'/);
  assert.doesNotMatch(workspace, /<BrowserPdfReader source=\{source\} \/>/);
  assert.doesNotMatch(workspace, /data-engine="static"/);
  assert.doesNotMatch(workspace, /className=\{styles\.readerMarginPanel\}/);
  assert.doesNotMatch(workspace, /className=\{styles\.readerEdgeTab\}/);
  assert.doesNotMatch(workspace, /setWorkspaceMode\('reader'\)/);
  assert.doesNotMatch(workspace, /appendSourceExcerptToInput\(activeSource\)/);
  assert.doesNotMatch(workspace, /startReflectionFromSource\(activeSource\)/);
  assert.match(workspace, /Definition of Market Making/);
  assert.match(workspace, /Captured native translation from Week 1 Notes\.pdf, page 2 \[vocabulary meaning\]: market/);
  assert.match(workspace, /Captured native translation from Week 1 Notes\.pdf, page 2 \[vocabulary meaning\]: making/);
  assert.match(workspace, /Captured native translation from Week 1 Notes\.pdf, page 2 \[phrase meaning\]: market making/);
  assert.match(workspace, /Market making means providing both bid and ask prices/);
  assert.match(workspace, /Market making combines market as a trading venue with making as actively providing quotes/);
  assert.match(workspace, /A market maker improves liquidity by continuously showing bid and ask prices/);
  assert.match(workspace, /function displayLearningMaterial\(version: UnderstandingVersion\)/);
  assert.match(
    workspace,
    /\.replace\(\s*\/\^\(concept synthesis\|reusable principle\)\[:：\]\\s\*\/i,\s*''\s*\)/,
  );
  assert.match(workspace, /native tool=macOS Translate/);
  assert.match(workspace, /visual extraction=appshot OCR candidate/);
  assert.match(workspace, /visual precision=visual context only/);
  assert.match(workspace, /evidence rung=selected text \+ file \+ page/);
  assert.match(workspace, /evidence rung=selected text \+ file \+ page \+ appshot/);
  assert.match(workspace, /focus\.includes\('translation'\)[\s\S]{0,80}\? 'Native translation'/);
  assert.match(workspace, /type UnderstandingVersion = \{/);
  assert.match(workspace, /type CommitTarget = \{/);
  assert.match(workspace, /function commitTargetForCase\(reflectionCase: ReflectionCase\): CommitTarget/);
  assert.match(workspace, /function understandingVersionsFromCase\(reflectionCase: ReflectionCase\): UnderstandingVersion\[\]/);
  assert.match(workspace, /const LEARNING_EVIDENCE_MARKER = '\\nEvidence:'/);
  assert.match(workspace, /function parseLearningEvidence\(value: string\)/);
  assert.match(workspace, /function prioritizeLearningEvidence\(items: string\[\]\)/);
  assert.match(workspace, /'anchor note:'/);
  assert.match(workspace, /function splitLearningEvidence\(value: string\)/);
  assert.ok(
    workspace.includes('line.match(/^Captured (.+?) from (.+?) \\[(.+?)\\]\\s*([:.])?\\s*([\\s\\S]+)$/)'),
    'learning trace parser must accept multiline Evidence payloads',
  );
  assert.match(workspace, /const supportingEvidence = prioritizeLearningEvidence\(evidenceSplit\.evidence\)/);
  assert.match(workspace, /function currentEvidenceVersion\([\s\S]{0,160}reflectionCase: ReflectionCase,[\s\S]{0,160}activeVersionId\?: string \| null,[\s\S]{0,160}\): UnderstandingVersion \| null/);
  assert.match(workspace, /function versionMatchesSource\(version: UnderstandingVersion, source: ReflectionSource\)/);
  assert.match(workspace, /function sourceForVersion\(/);
  assert.match(workspace, /function versionForSource\(/);
  assert.match(workspace, /const LEARNING_CASES: ReflectionCase\[\] = \[/);
  assert.match(workspace, /id: 'pdf-learning-week-1-notes'/);
  assert.match(workspace, /title: 'Week 1 Notes\.pdf'/);
  assert.match(workspace, /id: 'word-learning-notes'/);
  assert.match(workspace, /title: 'Loom Word Learning Notes\.docx'/);
  assert.match(workspace, /id: 'excel-learning-table'/);
  assert.match(workspace, /title: 'Loom Excel Learning Table\.csv'/);
  assert.match(workspace, /\.\.\.LEARNING_CASES/);
  assert.match(workspace, /anchor precision=file\+page/);
  assert.match(workspace, /anchor precision=file\+cell/);
  assert.match(workspace, /evidence rung=selected text \+ file \+ cell/);
  assert.match(workspace, /function UnderstandingSpine\(\{[\s\S]{0,80}reflectionCase,[\s\S]{0,80}activeVersionId,[\s\S]{0,80}onSelectVersion/);
  assert.match(workspace, /aria-label="Learning review"/);
  assert.match(workspace, /function stageForVersion\(version: UnderstandingVersion\)/);
  assert.match(workspace, /function sectionForVersion\(version: UnderstandingVersion\)/);
  assert.match(workspace, /function documentProseVersions\(versions: UnderstandingVersion\[\], focus: UnderstandingVersion \| null\)/);
  assert.match(workspace, /function documentSourceQuoteVersion\(versions: UnderstandingVersion\[\], focus: UnderstandingVersion \| null\)/);
  assert.match(workspace, /type UnderstandingObject = \{/);
  assert.match(workspace, /function normalizeObjectSubject\(value: string\)/);
  assert.match(workspace, /function objectSubjectForVersion\(version: UnderstandingVersion\)/);
  assert.match(workspace, /function understandingObjectMeaning\(object: UnderstandingObject\): ObjectMeaning/);
  assert.match(workspace, /function understandingObjectTraceCount\(object: UnderstandingObject\)/);
  assert.match(workspace, /function buildUnderstandingObjects\(versions: UnderstandingVersion\[\]\)/);
  assert.match(workspace, /if \(phrase\.kind !== 'phrase'\) return/);
  assert.match(workspace, /function documentObjectVersions\(versions: UnderstandingVersion\[\]\)/);
  assert.match(workspace, /function primaryLearningObject\(objects: UnderstandingObject\[\]\)/);
  assert.match(workspace, /function bestLearningFocus\(versions: UnderstandingVersion\[\]\)/);
  assert.doesNotMatch(workspace, /function unresolvedVersion\(versions: UnderstandingVersion\[\]\)/);
  assert.match(workspace, /function LearningDigest\(\{/);
  assert.match(workspace, /function memoryGateForVersion\(version: UnderstandingVersion \| null\)/);
  assert.doesNotMatch(workspace, /<p className=\{styles\.kicker\}>Trace Ledger<\/p>/);
  assert.doesNotMatch(workspace, /<h3>理解账本<\/h3>/);
  assert.match(workspace, /className=\{styles\.learningDigest\} aria-label="Learning document"/);
  assert.match(workspace, /className=\{styles\.learningDocument\} aria-label="Learning document"/);
  assert.match(workspace, /className=\{styles\.learningDocumentHeader\}/);
  assert.match(workspace, /className=\{styles\.learningDocumentTitleBlock\}/);
  assert.doesNotMatch(workspace, /className=\{styles\.learningDocumentEyebrow\}/);
  assert.match(workspace, /className=\{styles\.learningDocumentLead\}/);
  assert.match(workspace, /function learningSourceLabel\(version: UnderstandingVersion\)/);
  assert.match(workspace, /function documentTitleForFocus\(version: UnderstandingVersion\)/);
  assert.match(workspace, /function documentReportTitle\(versions: UnderstandingVersion\[\], focus: UnderstandingVersion\)/);
  assert.doesNotMatch(workspace, /function documentSectionTitle\(section: LearningSection\)/);
  assert.doesNotMatch(workspace, /function documentSectionAccessibilityLabel\(section: LearningSection\)/);
  assert.doesNotMatch(workspace, /function documentFlowSections\(sections: LearningSection\[\]\)/);
  assert.doesNotMatch(workspace, /function documentSectionSummary\(section: LearningSection\)/);
  assert.doesNotMatch(workspace, /Current understanding/);
  assert.doesNotMatch(workspace, /Understanding objects/);
  assert.doesNotMatch(workspace, /Needs human meaning/);
  assert.doesNotMatch(workspace, /const unresolved = unresolvedVersion\(versions\)/);
  assert.doesNotMatch(workspace, /Learning report/);
  assert.doesNotMatch(workspace, /learning report/);
  assert.doesNotMatch(workspace, /captured moments/);
  assert.match(workspace, /function sourceFootnoteLabel\(version: UnderstandingVersion\)/);
  assert.match(workspace, /className=\{styles\.learningDocumentMeta\}/);
  assert.doesNotMatch(workspace, /className=\{styles\.learningDocumentAbstract\}/);
  assert.doesNotMatch(workspace, /className=\{styles\.learningDocumentPrompt\}/);
  assert.doesNotMatch(workspace, />Abstract</);
  assert.doesNotMatch(workspace, />Next</);
  assert.doesNotMatch(workspace, /className=\{styles\.learningReviewGrid\}/);
  assert.doesNotMatch(workspace, /className=\{styles\.learningReviewCard\}/);
  assert.doesNotMatch(workspace, /className=\{styles\.learningDocumentSections\}/);
  assert.doesNotMatch(workspace, /className=\{styles\.learningDocumentSection\}/);
  assert.doesNotMatch(workspace, /aria-label=\{documentSectionAccessibilityLabel\(section\)\}/);
  assert.doesNotMatch(workspace, /className=\{styles\.learningDocumentSectionTitle\}/);
  assert.doesNotMatch(workspace, /className=\{styles\.learningDocumentSectionNumber\}/);
  assert.match(workspace, /className=\{styles\.learningDocumentProse\} aria-label="Learning note"/);
  assert.match(workspace, /className=\{styles\.learningDocumentQuote\}/);
  assert.doesNotMatch(workspace, /className=\{styles\.learningDocumentEvidence\}/);
  assert.match(workspace, /className=\{styles\.learningInlineGlossary\}/);
  assert.doesNotMatch(workspace, /className=\{styles\.learningGlossaryItem\}/);
  assert.match(workspace, /data-kind=\{primaryObject\.kind\}/);
  assert.match(workspace, /className=\{styles\.learningInlineTerm\}/);
  assert.match(workspace, /className=\{styles\.learningTraceAnchor\}/);
  assert.match(workspace, /function TraceAnchor\(\{/);
  assert.match(workspace, /data-compact=\{compact\}/);
  assert.doesNotMatch(workspace, /<em>\{object\.kind\}<\/em>/);
  assert.doesNotMatch(workspace, /className=\{styles\.learningGlossaryMeaning\}/);
  assert.match(workspace, /function TraceTip\(\{/);
  assert.match(workspace, /className=\{styles\.learningTraceTip\} role="tooltip"/);
  assert.match(workspace, /Absorbs: \{componentTerms\.join\(' \+ '\)\}/);
  assert.doesNotMatch(workspace, /Includes earlier notes: \{object\.componentTerms\.join\(' \+ '\)\}/);
  assert.doesNotMatch(workspace, /Absorbs component traces/);
  assert.match(workspace, /supportCount=\{understandingObjectTraceCount\(primaryObject\)\}/);
  assert.doesNotMatch(workspace, /source moments/);
  assert.doesNotMatch(workspace, /className=\{styles\.learningParagraphList\}/);
  assert.doesNotMatch(workspace, /className=\{styles\.learningParagraph\}/);
  assert.doesNotMatch(workspace, /className=\{styles\.learningParagraphText\}/);
  for (const reviewCardTitle of ['Current meaning', 'Next review']) {
    assert.doesNotMatch(workspace, new RegExp(reviewCardTitle));
  }
  assert.doesNotMatch(workspace, /className=\{styles\.learningStageStrip\}/);
  assert.doesNotMatch(workspace, /Next Human Move/);
  assert.doesNotMatch(workspace, /className=\{styles\.learningSectionCount\}/);
  assert.doesNotMatch(workspace, /Meaning that can survive this pass/);
  assert.doesNotMatch(workspace, /Only promote after the second pass/);
  assert.match(workspace, /data-weak-anchor=\{hasWeakAnchor\}/);
  assert.match(workspace, /className=\{styles\.versionSignalLine\}/);
  assert.match(workspace, /aria-label=\{`Trace grounding: \$\{stage\.label\}; \$\{precision\}; \$\{evidence\}`\}/);
  assert.match(workspace, /className=\{styles\.versionSignalDot\} data-tone=\{signal\.tone\}/);
  assert.match(workspace, /const capturedLines = reflectionCase\.sections\.input\.filter\(\(line\) => line\.startsWith\('Captured '\)\)/);
  assert.match(workspace, /learningReviewVersionFromLine\(line, capturedLines\.length \+ index, 'review'\)/);
  assert.match(workspace, /title: phase === 'memory' \? 'Reusable memory' : 'Second-pass review'/);
  assert.match(workspace, /role="button"/);
  assert.match(workspace, /onKeyDown=\{\(event\) => handleVersionKeyDown\(event, version\.id\)\}/);
  assert.match(workspace, /Capture trail/);
  assert.doesNotMatch(workspace, /Receipts/);
  assert.match(workspace, /Trace history/);
  assert.match(workspace, /Learning review/);
  assert.doesNotMatch(workspace, /function recallPromptForVersion\(version: UnderstandingVersion\)/);
  assert.doesNotMatch(workspace, /function nextReviewActionForVersion\(version: UnderstandingVersion \| null\)/);
  assert.doesNotMatch(workspace, /<details className=\{styles\.recallCheck\}>/);
  assert.doesNotMatch(workspace, /aria-label="Recall this understanding"/);
  assert.doesNotMatch(workspace, /Recall before review/);
  assert.match(workspace, /aria-label="Learning document"/);
  assert.doesNotMatch(workspace, /const reviewTarget = unresolved \?\? focus/);
  assert.doesNotMatch(workspace, /aria-label="Review prompt"/);
  assert.doesNotMatch(workspace, /nextReviewActionForVersion\(reviewTarget\)/);
  assert.match(workspace, /const historyHeaderLabel = versionCountLabel/);
  assert.match(workspace, /\{!isLearningCase \? \(/);
  assert.doesNotMatch(workspace, /Understanding document/);
  assert.match(workspace, /threadTitleLine/);
  assert.doesNotMatch(workspace, /native · \{activeVersions\.length\} notes/);
  assert.match(workspace, /data-learning=\{isLearningCase\}/);
  assert.match(workspace, /const isSelected = version\.id === selectedVersionId/);
  assert.match(workspace, /data-active=\{isSelected\}/);
  assert.match(workspace, /onClick=\{\(\) => onSelectVersion\(version\.id\)\}/);
  assert.match(workspace, /aria-label=\{`Inspect \$\{version\.number\}: \$\{version\.title\}`\}/);
  assert.match(workspace, /<details className=\{styles\.versionAudit\}>/);
  assert.match(workspace, /<summary>Audit trail<\/summary>/);
  assert.match(workspace, /const \[activeVersionId, setActiveVersionId\] = useState<string \| null>\(null\)/);
  assert.match(workspace, /type InspectorTarget = 'version' \| 'source'/);
  assert.match(workspace, /const \[inspectorTarget, setInspectorTarget\] = useState<InspectorTarget>\('version'\)/);
  assert.match(workspace, /if \(inspectorTarget === 'source'\) return versionForSource\(activeVersions, activeSource\)/);
  assert.match(workspace, /return currentEvidenceVersion\(activeCase, activeVersionId\)/);
  assert.match(workspace, /if \(inspectorTarget === 'source'\) return activeSource/);
  assert.match(workspace, /function evidenceSourceFor\(/);
  assert.match(workspace, /const matchedSource = sourceForVersion\(reflectionCase\.sources, version\)/);
  assert.match(workspace, /reflectionCase\.project === 'Learning pass' && reflectionCase\.sources\.length === 1/);
  assert.match(workspace, /return evidenceSourceFor\(activeCase, activeEvidence, activeSource, inspectorTarget\)/);
  assert.match(workspace, /activeVersionId=\{activeEvidence\?\.id \?\? null\}/);
  assert.match(workspace, /onSelectVersion=\{selectVersion\}/);
  assert.match(workspace, /function selectVersion\(versionId: string\)/);
  assert.match(workspace, /const source = sourceForVersion\(activeCase\.sources, version\)/);
  assert.match(workspace, /setInspectorTarget\('version'\)/);
  assert.match(workspace, /const commitTarget = commitTargetForCase\(activeCase\)/);
  assert.match(workspace, /const commitAnchor = activeCase\.project === 'Learning pass'/);
  assert.match(workspace, /label: 'Margin note'/);
  assert.match(workspace, /placeholder: 'Write a margin note\.\.\.'/);
  assert.match(workspace, /aria-label=\{isLearningCase \? 'Add margin note' : `\$\{commitTarget\.label\} commit`\}/);
  assert.doesNotMatch(workspace, /className=\{styles\.composerTypeBar\}/);
  assert.doesNotMatch(workspace, /LEARNING_COMMIT_TYPES\.map/);
  assert.doesNotMatch(workspace, />Meaning<|>Ask<|>Fix<|>Keep</);
  assert.doesNotMatch(workspace, /data-active=\{type\.focus === learningCommitFocus\}/);
  assert.doesNotMatch(workspace, /aria-label=\{`Commit \$\{type\.focus\}`\}/);
  assert.match(workspace, /formatLearningCommit\(text, latestLearningAnchor\(activeCase, activeSource\), learningCommitFocus\)/);
  assert.doesNotMatch(workspace, /function learningStarterFor\(/);
  assert.doesNotMatch(workspace, /function draftLearningStarter\(\)/);
  assert.match(workspace, /Margin note\.\.\./);
  assert.match(workspace, /aria-label=\{isLearningCase \? 'Margin note input' : `\$\{commitTarget\.label\} input`\}/);
  assert.doesNotMatch(workspace, /Add understanding\.\.\./);
  assert.doesNotMatch(workspace, /placeholder: 'Add your meaning\.\.\.'/);
  assert.doesNotMatch(workspace, /placeholder: 'Add a question\.\.\.'/);
  assert.doesNotMatch(workspace, /placeholder: 'Add a correction\.\.\.'/);
  assert.doesNotMatch(workspace, /placeholder: 'Add a principle\.\.\.'/);
  assert.doesNotMatch(workspace, /Add your meaning for the selected source moment/);
  assert.match(workspace, /<div className=\{styles\.composerField\}>/);
  assert.doesNotMatch(workspace, /className=\{styles\.composerAnchor\}/);
  assert.doesNotMatch(workspace, /className=\{styles\.composerReference\}/);
  assert.doesNotMatch(workspace, /aria-label=\{`Current source anchor: \$\{commitAnchor\}`\}/);
  assert.doesNotMatch(workspace, /title=\{isLearningCase \? commitAnchor : undefined\}/);
  assert.doesNotMatch(workspace, /<span>@ \{commitAnchorLabel\}<\/span>/);
  assert.doesNotMatch(workspace, /className=\{styles\.composerAssistButton\}/);
  assert.doesNotMatch(workspace, /aria-label="Help me interpret the selected source moment"/);
  assert.doesNotMatch(workspace, /<Sparkles size=\{13\} \/>/);
  assert.match(workspace, /function latestLearningAnchor\(reflectionCase: ReflectionCase, activeSource: ReflectionSource \| null\)/);
  assert.match(workspace, /version\.state === 'needs meaning'/);
  assert.match(workspace, /type LearningCommitFocus = 'user meaning' \| 'question' \| 'correction' \| 'principle'/);
  assert.doesNotMatch(workspace, /Captured user trace from current source/);
  assert.match(workspace, /disabled=\{!draft\.trim\(\)\}/);
  assert.match(workspace, /\? 'Save margin note'/);
  assert.doesNotMatch(workspace, /\? 'Commit understanding'/);
  assert.doesNotMatch(workspace, /Commit \$\{learningCommitFocus\} to \$\{commitAnchor\}/);
  assert.match(workspace, /\[commitTarget\.key\]: \[\.\.\.item\.sections\[commitTarget\.key\], committedText\]/);
  assert.match(workspace, /Committed to \$\{WORKFLOW_BY_KEY\[commitTarget\.key\]\.label\}/);
  assert.match(
    workspace,
    /<UnderstandingSpine[\s\S]{0,180}reflectionCase=\{activeCase\}[\s\S]{0,180}activeVersionId=\{activeEvidence\?\.id \?\? null\}[\s\S]{0,180}onSelectVersion=\{selectVersion\}/,
  );
  assert.match(
    workspace,
    /const activeEvidence = useMemo\(\(\) => \{[\s\S]{0,140}versionForSource\(activeVersions, activeSource\)[\s\S]{0,140}currentEvidenceVersion\(activeCase, activeVersionId\)/,
  );
  assert.match(workspace, /source=\{evidenceSource\}/);
  assert.match(workspace, /aria-label="Evidence"/);
  assert.match(workspace, /className=\{styles\.sourcesHeaderQuiet\} aria-hidden="true"/);
  assert.match(workspace, /const shouldShowSourceList = activeCase\.sources\.length !== 1 \|\| sourceQuery\.trim\(\)\.length > 0/);
  assert.doesNotMatch(workspace, /<h2>\{workspaceMode === 'reader' \? 'Loom' : 'Inspector'\}<\/h2>/);
  assert.match(workspace, /type LoomOpenSourceBridge = \{ postMessage: \(payload: unknown\) => void \}/);
  assert.match(workspace, /loomOpenReflectionSource\?: LoomOpenSourceBridge/);
  assert.match(workspace, /function openSourceBridge\(\)/);
  assert.match(workspace, /function sourceCanOpen\(source: ReflectionSource \| null, hasNativeBridge: boolean\)/);
  assert.match(workspace, /function SourceOpenButton\(\{/);
  assert.match(workspace, /<ExternalLink size=\{13\} \/>/);
  assert.match(workspace, /bridge\.postMessage\(sourceOpenPayload\(source\)\)/);
  assert.match(workspace, /window\.open\(source\.localPreviewUrl, '_blank', 'noopener,noreferrer'\)/);
  assert.match(workspace, /function EvidenceGrounding\(\{/);
  assert.match(workspace, /source: ReflectionSource \| null/);
  assert.match(workspace, /onOpenSource: \(source: ReflectionSource\) => void/);
  assert.match(workspace, /className=\{styles\.evidenceSourceLine\} aria-label="Evidence source"/);
  assert.match(workspace, /<SourceOpenButton source=\{source\} canOpen=\{canOpenSource\} onOpenSource=\{onOpenSource\} \/>/);
  assert.match(workspace, /<SourceOpenButton[\s\S]{0,120}source=\{activeSource\}[\s\S]{0,120}canOpen=\{canOpenActiveSource\}/);
  assert.match(workspace, /function FileBadge\(\{ kind \}: \{ kind\?: string \}\)/);
  assert.match(workspace, /replace\(\/\^\\\.\/, ''\)/);
  assert.match(workspace, /\(\^\|\[-\/\]\)\(xls\|xlsx\|csv\|tsv\|numbers\)\$/);
  assert.match(workspace, /\(\^\|\[-\/\]\)\(ppt\|pptx\|keynote\)\$/);
  assert.match(workspace, /\(\^\|\[-\/\]\)\(doc\|docx\|pages\|rtf\|rtfd\)\$/);
  assert.match(workspace, /function caseFileKind\(reflectionCase: ReflectionCase\)/);
  assert.match(workspace, /function CaseGlyph\(\{ reflectionCase \}: \{ reflectionCase: ReflectionCase \}\)/);
  assert.match(workspace, /function caseSubLabel\(reflectionCase: ReflectionCase\)/);
  assert.match(workspace, /if \(reflectionCase\.project === 'Learning pass'\) return null/);
  assert.match(workspace, /function caseTimeLabel\(reflectionCase: ReflectionCase\)/);
  assert.match(workspace, /reflectionCase\.project === 'Learning pass' && reflectionCase\.updatedAt === 'learning'/);
  assert.match(workspace, /<CaseGlyph reflectionCase=\{item\} \/>/);
  assert.match(workspace, /data-file=\{Boolean\(caseFileKind\(item\)\)\}/);
  assert.match(workspace, /data-single-line=\{caseSubLabel\(item\) === null\}/);
  assert.doesNotMatch(workspace, /<span>\{item\.project\}<\/span>/);
  assert.doesNotMatch(workspace, /<span className=\{styles\.caseTime\}>\{item\.updatedAt\}<\/span>/);
  assert.match(workspace, /const tone = sourceTone\(kind\)/);
  assert.match(workspace, /\{tone === 'document' \? <span className=\{styles\.fileBadgeLines\} \/> : null\}/);
  assert.match(workspace, /<FileBadge kind=\{kind\} \/>/);
  assert.match(workspace, /const groundingRows = groundingRowsForVersion\(version\)/);
  assert.match(workspace, /function evidenceGateForVersion\(version: UnderstandingVersion\)/);
  assert.match(workspace, /auditValue\(version\.audit, 'anchor precision'\)/);
  assert.match(workspace, /auditValue\(version\.audit, 'visual precision'\)/);
  assert.match(workspace, /Confirm the source before reuse/);
  assert.match(workspace, /Reusable only after review/);
  assert.match(workspace, /aria-label="Evidence reuse gate"/);
  assert.match(workspace, /data-state=\{evidenceGate\.state\}/);
  assert.match(workspace, /\{ label: 'evidence rung', value: auditValue\(version\.audit, 'evidence rung'\) \?\? '' \}/);
  assert.match(workspace, /\{ label: 'fallback', value: auditValue\(version\.audit, 'fallback note'\) \?\? '' \}/);
  assert.match(workspace, /\{ label: 'native tool', value: auditValue\(version\.audit, 'native tool'\) \?\? '' \}/);
  assert.match(workspace, /\{ label: 'language pair', value: auditValue\(version\.audit, 'language pair'\) \?\? '' \}/);
  assert.match(workspace, /\{ label: 'visual extraction', value: auditValue\(version\.audit, 'visual extraction'\) \?\? '' \}/);
  assert.match(workspace, /\{ label: 'visual precision', value: auditValue\(version\.audit, 'visual precision'\) \?\? '' \}/);
  assert.match(workspace, /aria-label="Evidence grounding"/);
  assert.match(workspace, /<details className=\{styles\.evidenceAudit\}>/);
  assert.match(workspace, /<summary>Details<\/summary>/);
  assert.doesNotMatch(workspace, /activeEvidence\.audit\.slice\(0, 5\)/);
  assert.doesNotMatch(workspace, /Source Collection/);
  assert.doesNotMatch(workspace, /aria-label="Reflection workflow"/);
  assert.doesNotMatch(workspace, /aria-label="Working notes"/);
  assert.match(workspace, /const nextCases = remainingCases\.length > 0 \? remainingCases : \[makeBlankReflectionCase\(\)\]/);
  assert.match(workspace, /className=\{styles\.caseSelectButton\}/);
  assert.match(workspace, /className=\{styles\.caseDeleteButton\}/);
  assert.match(workspace, /aria-label=\{`Delete \$\{item\.title\}`\}/);
  assert.match(workspace, /<Trash2 size=\{13\} \/>/);
  assert.match(styles, /\.shell\[data-sidebar-collapsed='true'\]/);
  assert.match(styles, /\.shell\[data-sidebar-collapsed='true'\]\[data-sidebar-peeking='true'\] \.sidebar/);
  assert.doesNotMatch(
    cssRulesContaining(styles, ".shell[data-sidebar-collapsed='true'][data-sidebar-peeking='true'] .sidebar"),
    /--reflection-sidebar-width/,
    'hover peek must overlay the collapsed column instead of changing grid proportions',
  );
  assert.match(
    cssRulesContaining(styles, ".shell[data-sidebar-collapsed='true'][data-sidebar-peeking='true'] .sidebar"),
    /color-mix\(in srgb, var\(--reflection-matte\) 58%, transparent\)/,
    'hover peek glass should use the center matte workspace background as its transparent base',
  );
  assert.match(
    cssRulesContaining(styles, ".shell[data-sidebar-collapsed='true'][data-sidebar-peeking='true'] .sidebar"),
    /--reflection-sidebar-text:\s*var\(--reflection-text\)/,
    'overlay sidebar chrome should inherit center-pane text hierarchy rather than permanent rail text tokens',
  );
  assert.match(
    cssRulesContaining(styles, ".shell[data-sidebar-collapsed='true'][data-sidebar-peeking='true'] .newButton"),
    /background:\s*color-mix\(in srgb, var\(--reflection-surface\) 70%, transparent\)/,
    'overlay sidebar controls should use center-pane surface chrome instead of permanent rail chrome',
  );
  assert.match(
    cssRulesContaining(styles, ".shell[data-sidebar-collapsed='true'][data-sidebar-peeking='true'] .caseItem[data-active='true']"),
    /background:\s*var\(--reflection-selection\)/,
    'overlay sidebar selected rows should use center-pane selection color',
  );
  assert.match(
    cssRulesContaining(styles, ".shell[data-sidebar-collapsed='true'][data-sidebar-peeking='true'] .caseDeleteButton:hover"),
    /color:\s*var\(--reflection-text\)/,
    'overlay sidebar row actions should inherit center-pane foreground hierarchy',
  );
  assert.match(styles, /\.shell\[data-sources-collapsed='true'\]/);
  assert.match(styles, /--reflection-pane-rail-width:\s*4\.25rem/);
  assert.match(styles, /--reflection-pane-toggle-size:\s*2rem/);
  assert.match(
    cssRulesContaining(styles, ".shell[data-sidebar-collapsed='true']"),
    /--reflection-sidebar-width:\s*var\(--reflection-pane-rail-width\)/,
  );
  assert.match(
    cssRulesContaining(styles, ".shell[data-sources-collapsed='true']"),
    /--reflection-sources-width:\s*var\(--reflection-pane-rail-width\)/,
  );
  assert.match(styles, /\.paneToggleButton \{/);
  assert.match(
    cssRulesContaining(styles, '.paneToggleButton'),
    /width:\s*var\(--reflection-pane-toggle-size\)[\s\S]*height:\s*var\(--reflection-pane-toggle-size\)/,
  );
  assert.match(styles, /\.paneToggleButton svg \{[\s\S]*width:\s*1rem[\s\S]*height:\s*1rem[\s\S]*stroke-width:\s*2/);
  assert.match(styles, /\.paneToggleButton\[data-pane='left'\] svg \{[\s\S]*transform:\s*translateX\(0\.5px\)/);
  assert.match(styles, /\.paneToggleButton\[data-pane='right'\] svg \{[\s\S]*transform:\s*translateX\(-0\.5px\)/);
  assert.match(styles, /\.sidebar \.paneToggleButton \{/);
  assert.match(styles, /--reflection-pane-topbar-height:\s*3\.5rem/);
  assert.match(styles, /\.paneRailTop \{/);
  assert.match(
    cssRulesContaining(styles, '.paneRailTop'),
    /height:\s*var\(--reflection-pane-topbar-height\)[\s\S]*place-items:\s*center/,
  );
  assert.match(
    cssRulesContaining(styles, '.brandRow'),
    /min-height:\s*var\(--reflection-pane-topbar-height\)[\s\S]*align-items:\s*center/,
  );
  assert.match(
    cssRulesContaining(styles, '.sourcesHeader'),
    /min-height:\s*var\(--reflection-pane-topbar-height\)[\s\S]*align-items:\s*center/,
  );
  assert.match(
    cssRulesContaining(styles, '.sidebarRail'),
    /width:\s*var\(--reflection-pane-rail-width\)[\s\S]*padding:\s*0 var\(--reflection-pane-rail-padding-inline\) var\(--reflection-pane-rail-padding-block\)/,
  );
  assert.match(
    cssRulesContaining(styles, '.sourcesRail'),
    /width:\s*var\(--reflection-pane-rail-width\)[\s\S]*padding:\s*0 var\(--reflection-pane-rail-padding-inline\) var\(--reflection-pane-rail-padding-block\)/,
  );
  assert.match(workspace, /className=\{styles\.paneRailTop\}[\s\S]{0,240}aria-label="Expand reflection sidebar"/);
  assert.match(workspace, /className=\{styles\.paneRailTop\}[\s\S]{0,240}aria-label="Expand sources inspector"/);
  assert.match(workspace, /className=\{styles\.paneToggleButton\}[\s\S]{0,80}data-pane="left"[\s\S]{0,160}aria-label="Expand reflection sidebar"/);
  assert.match(workspace, /className=\{styles\.paneToggleButton\}[\s\S]{0,80}data-pane="left"[\s\S]{0,160}aria-label="Collapse reflection sidebar"/);
  assert.match(workspace, /className=\{styles\.paneToggleButton\}[\s\S]{0,80}data-pane="right"[\s\S]{0,160}aria-label="Expand sources inspector"/);
  assert.match(workspace, /className=\{styles\.paneToggleButton\}[\s\S]{0,80}data-pane="right"[\s\S]{0,160}aria-label="Collapse sources inspector"/);
  assert.doesNotMatch(styles, /\.sourcesRail > span/);
  assert.doesNotMatch(styles, /\.shell\[data-workspace-mode='reader'\]/);
  assert.doesNotMatch(styles, /\.shell\[data-workspace-mode='reader'\] \.sources/);
  assert.doesNotMatch(styles, /\.reader \{/);
  assert.doesNotMatch(styles, /\.browserPdfReader/);
  assert.doesNotMatch(styles, /\.pdfFrame/);
  assert.doesNotMatch(styles, /data-engine='browser'/);
  assert.doesNotMatch(styles, /\.pdfFallbackReader/);
  assert.doesNotMatch(styles, /\.pdfReaderToolbar \{/);
  assert.doesNotMatch(styles, /\.pdfPageSpread \{/);
  assert.doesNotMatch(styles, /\.pdfPageImage \{/);
  assert.doesNotMatch(styles, /\.readerMarginPanel \{/);
  assert.doesNotMatch(styles, /\.readerMarginCard \{/);
  assert.doesNotMatch(styles, /\.readerEdgeTab \{/);
  assert.doesNotMatch(styles, /\.readerBody\[data-layout='spread'\]/);
  assert.doesNotMatch(styles, /\.readerBody\[data-engine='browser'\] \.readerMarginPanel/);
  assert.doesNotMatch(styles, /\.readerBody\[data-engine='browser'\] \.readerEdgeTab/);
  assert.doesNotMatch(styles, /\.readerActionButton \{/);
  assert.match(styles, /\.evidenceSourceLine \{/);
  assert.match(styles, /\.fileBadge\[data-kind='pdf'\]/);
  assert.match(styles, /\.fileBadge\[data-kind='document'\]/);
  assert.match(styles, /\.fileBadge\[data-kind='spreadsheet'\]/);
  assert.match(styles, /\.fileBadge\[data-kind='presentation'\]/);
  assert.match(styles, /\.fileBadge::after \{[\s\S]*clip-path:\s*polygon\(0 0, 100% 100%, 100% 0\)/);
  assert.doesNotMatch(cssRulesContaining(styles, '.fileBadge::after'), /linear-gradient|radial-gradient/);
  assert.doesNotMatch(cssRulesContaining(styles, '.fileBadgeGrid'), /linear-gradient|radial-gradient/);
  assert.doesNotMatch(cssRulesContaining(styles, '.fileBadgeLines'), /linear-gradient|radial-gradient/);
  assert.doesNotMatch(styles, /svg\[data-kind='pdf'\]/);
  assert.doesNotMatch(styles, /svg\[data-kind='document'\]/);
  assert.match(styles, /\.caseIcon\[data-file='true'\]/);
  assert.match(styles, /\.railCaseItem \.fileBadge/);
  assert.match(styles, /\.evidenceSourceLine button:disabled/);
  assert.doesNotMatch(styles, /\.composerTypeBar \{/);
  assert.match(styles, /\.versionHistory \{/);
  assert.match(styles, /\.versionHistoryHeader \{/);
  assert.match(styles, /\.learningDigest \{/);
  assert.match(styles, /\.learningDocument \{/);
  assert.match(styles, /\.learningDocumentHeader \{/);
  assert.match(styles, /\.learningDocumentTitleBlock \{/);
  assert.doesNotMatch(styles, /\.learningDocumentEyebrow \{/);
  assert.match(styles, /\.learningDocumentMeta \{/);
  assert.match(styles, /\.learningDocumentLead \{/);
  assert.doesNotMatch(styles, /\.learningDocumentAbstract \{/);
  assert.doesNotMatch(styles, /\.learningDocumentPrompt \{/);
  assert.doesNotMatch(styles, /\.learningDocumentSections \{/);
  assert.doesNotMatch(styles, /\.learningDocumentSection \{/);
  assert.doesNotMatch(styles, /\.learningDocumentSectionTitle \{/);
  assert.doesNotMatch(styles, /\.learningDocumentSectionNumber \{/);
  assert.match(styles, /\.learningDocumentProse \{/);
  assert.match(styles, /\.learningDocumentProse p \{/);
  assert.doesNotMatch(styles, /\.learningDocumentEvidence \{/);
  assert.doesNotMatch(styles, /\.learningDocumentEvidence blockquote \{/);
  assert.match(styles, /\.learningInlineGlossary \{/);
  assert.match(styles, /\.learningInlineGlossary\[data-active='true'\]/);
  assert.match(styles, /\.learningInlineTerm \{/);
  assert.doesNotMatch(styles, /\.learningGlossaryItem \{/);
  assert.doesNotMatch(styles, /\.learningGlossaryItem\[data-active='true'\]/);
  assert.doesNotMatch(styles, /\.learningGlossaryMeaning \{/);
  assert.doesNotMatch(styles, /\.learningGlossaryMeaning em \{/);
  assert.doesNotMatch(styles, /\.learningGlossaryMeaning strong \{/);
  assert.doesNotMatch(styles, /\.learningTermList \{/);
  assert.doesNotMatch(styles, /\.learningTermObject \{/);
  assert.doesNotMatch(styles, /\.learningTermHeader \{/);
  assert.doesNotMatch(styles, /\.learningTermTranslation \{/);
  assert.doesNotMatch(styles, /\.learningTermMeaning \{/);
  assert.doesNotMatch(styles, /\.learningTermSupport \{/);
  assert.match(styles, /\.learningTraceAnchor \{/);
  assert.match(styles, /\.learningTraceAnchor\[data-compact='true'\] \{/);
  assert.match(styles, /\.learningDocument \.learningTraceAnchor\[data-compact='true'\] \{[\s\S]*opacity:\s*0/);
  assert.match(styles, /\.learningDocumentProse p:hover \.learningTraceAnchor\[data-compact='true'\]/);
  assert.doesNotMatch(styles, /\.learningGlossaryItem:hover \.learningTraceAnchor\[data-compact='true'\]/);
  assert.match(styles, /\.learningTraceTip \{/);
  assert.match(styles, /\.learningTraceAnchor:hover \.learningTraceTip/);
  assert.match(styles, /\.learningTraceAnchor:focus \.learningTraceTip/);
  assert.doesNotMatch(styles, /\.learningParagraphList \{/);
  assert.doesNotMatch(styles, /\.learningParagraph \{/);
  assert.doesNotMatch(styles, /\.learningParagraphText \{/);
  assert.doesNotMatch(styles, /\.learningParagraph small em \{/);
  assert.doesNotMatch(styles, /\.learningDigestLead \{/);
  assert.doesNotMatch(styles, /\.learningLeadActions \{/);
  assert.doesNotMatch(styles, /\.learningObjectBody \{/);
  assert.doesNotMatch(styles, /\.learningObjectHeader \{/);
  assert.doesNotMatch(styles, /\.learningObjectHeader > span \{/);
  assert.doesNotMatch(styles, /\.learningObjectHeader > strong\[data-tone='memory'\]/);
  assert.doesNotMatch(styles, /\.recallCheck \{/);
  assert.doesNotMatch(styles, /\.recallCheck > summary \{/);
  assert.doesNotMatch(styles, /\.recallCheck > div \{/);
  assert.doesNotMatch(styles, /\.learningStatusLine \{/);
  assert.doesNotMatch(styles, /\.learningStatusTarget \{/);
  assert.doesNotMatch(styles, /\.learningStatusTarget > span \{/);
  assert.doesNotMatch(styles, /\.learningStatusTarget \{[\s\S]*grid-template-columns:\s*auto minmax\(0, 1fr\) auto/);
  assert.doesNotMatch(styles, /\.learningReviewGrid \{/);
  assert.doesNotMatch(styles, /\.learningReviewCard \{/);
  assert.doesNotMatch(styles, /\.learningStageStrip \{/);
  assert.doesNotMatch(styles, /\.learningSectionList \{/);
  assert.doesNotMatch(styles, /\.learningNote \{/);
  assert.match(styles, /\.traceHistory \{/);
  assert.match(styles, /\.versionHistory\[data-learning='true'\] \.traceHistory \{[\s\S]*display:\s*none/);
  assert.match(styles, /\.versionRow \{/);
  assert.match(styles, /\.versionSignalLine \{/);
  assert.match(styles, /\.versionSignalDot \{/);
  assert.match(styles, /\.versionSignalDot\[data-tone='memory'\]/);
  assert.match(styles, /\.versionAudit \{/);
  assert.match(styles, /\.evidenceGrounding \{/);
  assert.match(styles, /\.evidenceGate \{/);
  assert.match(styles, /\.evidenceGate\[data-state='weak'\]/);
  assert.match(styles, /\.evidenceGate\[data-state='ready'\]/);
  assert.match(styles, /\.evidenceAudit \{/);
  const composerSurfaceBlock = exactCssRule(styles, '.composer');
  const learningComposerBlock = exactCssRule(styles, ".composer[data-learning='true']");
  assert.match(styles, /\.composerField \{/);
  assert.doesNotMatch(styles, /\.composerReference \{/);
  assert.doesNotMatch(styles, /\.composerAssistButton \{/);
  assert.match(styles, /\.thread \{[\s\S]*position:\s*relative/);
  assert.match(styles, /\.versionHistory \{[\s\S]*padding:\s*0\.82rem clamp\(1\.25rem, 2\.6vw, 2\.2rem\) 5rem/);
  assert.match(styles, /\.versionHistory\[data-learning='true'\] \{[\s\S]*padding:\s*clamp\(1\.05rem, 2\.6vw, 2\.4rem\) clamp\(1\.25rem, 2\.6vw, 2\.2rem\) 1\.25rem/);
  assert.match(composerSurfaceBlock, /position:\s*absolute/);
  assert.match(composerSurfaceBlock, /left:\s*50%/);
  assert.match(composerSurfaceBlock, /width:\s*min\(50rem, calc\(100% - clamp\(2rem, 5vw, 4\.5rem\)\)\)/);
  assert.match(composerSurfaceBlock, /grid-template-columns:\s*minmax\(0, 1fr\) auto/);
  assert.match(composerSurfaceBlock, /transform:\s*translateX\(-50%\)/);
  assert.match(composerSurfaceBlock, /border:\s*0/);
  assert.match(composerSurfaceBlock, /background:\s*transparent/);
  assert.match(composerSurfaceBlock, /backdrop-filter:\s*none/);
  assert.doesNotMatch(composerSurfaceBlock, /border-top:\s*1px solid var\(--reflection-line\)/);
  assert.doesNotMatch(composerSurfaceBlock, /background:\s*color-mix\(in srgb, var\(--reflection-matte\)/);
  assert.match(learningComposerBlock, /position:\s*absolute/);
  assert.match(learningComposerBlock, /left:\s*50%/);
  assert.match(learningComposerBlock, /bottom:\s*clamp\(0\.56rem, 1\.2vw, 0\.86rem\)/);
  assert.match(learningComposerBlock, /width:\s*min\(18rem, calc\(100% - clamp\(4rem, 18vw, 12rem\)\)\)/);
  assert.match(learningComposerBlock, /grid-template-columns:\s*minmax\(0, 1fr\) auto/);
  assert.match(learningComposerBlock, /gap:\s*0/);
  assert.match(learningComposerBlock, /transform:\s*translateX\(-50%\)/);
  assert.match(learningComposerBlock, /margin:\s*0/);
  assert.match(learningComposerBlock, /opacity:\s*0\.36/);
  assert.match(styles, /\.composer\[data-learning='true'\]:hover,[\s\S]*\.composer\[data-learning='true'\]:focus-within \{[\s\S]*width:\s*min\(22rem, calc\(100% - clamp\(3rem, 14vw, 9rem\)\)\)/);
  assert.match(styles, /\.composer\[data-learning='true'\] \.composerField \{[\s\S]*border:\s*1px solid color-mix\(in srgb, var\(--reflection-line\) 42%, transparent\)/);
  assert.match(styles, /\.composer\[data-learning='true'\] \.composerField \{[\s\S]*border-radius:\s*999px/);
  assert.match(styles, /\.composer\[data-learning='true'\] \.composerField \{[\s\S]*background:\s*color-mix\(in srgb, var\(--reflection-surface\) 18%, transparent\)/);
  assert.match(styles, /\.composer\[data-learning='true'\] \.composerField \{[\s\S]*backdrop-filter:\s*blur\(22px\) saturate\(124%\) brightness\(1\.02\)/);
  assert.match(styles, /\.composer\[data-learning='true'\] \.composerField \{[\s\S]*grid-template-columns:\s*minmax\(0, 1fr\)/);
  assert.match(styles, /\.composer\[data-learning='true'\] > button \{[\s\S]*width:\s*0/);
  assert.match(styles, /\.composer\[data-learning='true'\] > button \{[\s\S]*opacity:\s*0/);
  assert.match(styles, /\.composer\[data-learning='true'\] > button:not\(:disabled\) \{[\s\S]*width:\s*1\.28rem/);
  assert.match(styles, /\.composer\[data-learning='true'\] > button:not\(:disabled\) \{[\s\S]*opacity:\s*0\.72/);
  assert.doesNotMatch(styles, /\.composerReference \{[\s\S]*max-width:\s*clamp\(3\.6rem, 8vw, 6\.4rem\)/);
  assert.doesNotMatch(styles, /\.composerTypeBar button \{[\s\S]*border-radius:\s*999px/);
  assert.match(styles, /\.composer > button \{[\s\S]*border-radius:\s*999px/);
  assert.match(styles, /\.composer > button:disabled \{/);
  assert.match(styles, /\.composer > button:disabled::after \{/);
  assert.doesNotMatch(styles, /grid-template-columns:\s*minmax\(10\.5rem, 13rem\) minmax\(0, 1fr\) auto/);
  assert.match(styles, /\.versionBody > p \{[\s\S]*-webkit-line-clamp:\s*2/);
  assert.match(styles, /\.versionRow\[data-active='true'\] \.versionBody > p \{[\s\S]*-webkit-line-clamp:\s*3/);
  assert.match(styles, /\.sidebarRail/);
  assert.match(styles, /\.sourcesRail/);
  assert.match(styles, /\.caseSelectButton/);
  assert.match(styles, /\.caseDeleteButton/);
  assert.match(styles, /\.caseItem:hover \.caseDeleteButton/);
  assert.match(styles, /\.sidebar,[\s\S]*\.sources,[\s\S]*\.thread/);
  assert.match(styles, /\.sidebar \{[\s\S]*background:\s*var\(--reflection-sidebar-glass\)/);
  assert.match(styles, /\.sidebar \{[\s\S]*backdrop-filter:\s*blur\(62px\) saturate\(178%\) brightness\(1\.04\) contrast\(1\.02\)/);
  const sourcesBlock = cssRulesContaining(styles, '.sources');
  const threadBlock = cssRulesContaining(styles, '.thread');
  const threadHeaderBlock = cssRulesContaining(styles, '.threadHeader');
  const sidebarHighlightBlock = cssRulesContaining(styles, '.sidebar::before');
  const composerInputHighlightBlock = cssRulesContaining(styles, '.composerField::after');
  const composerSubmitHighlightBlock = cssRulesContaining(styles, '.composer > button::after');
  assert.match(sourcesBlock, /background:\s*var\(--reflection-inspector-glass\)/);
  assert.match(sourcesBlock, /backdrop-filter:\s*blur\(22px\) saturate\(118%\) brightness\(1\.01\)/);
  assert.match(sourcesBlock, /box-shadow:[\s\S]*inset 1px 0 0 var\(--reflection-glass-edge\)/);
  assert.match(threadBlock, /background:\s*var\(--reflection-workbench-glass\)/);
  assert.match(threadBlock, /backdrop-filter:\s*blur\(8px\) saturate\(108%\)/);
  assert.match(styles, /--reflection-workbench-glass:/);
  assert.match(styles, /--reflection-glass-edge:/);
  assert.match(styles, /--reflection-glass-inset:/);
  assert.match(styles, /--reflection-live-white:/);
  assert.match(styles, /--reflection-prism-red:/);
  assert.match(styles, /--reflection-prism-gold:/);
  assert.match(styles, /--reflection-prism-blue:/);
  assert.match(styles, /@keyframes reflectionInputSheen/);
  assert.match(composerInputHighlightBlock, /--reflection-live-white/);
  assert.match(composerInputHighlightBlock, /--reflection-prism-red/);
  assert.match(composerInputHighlightBlock, /--reflection-prism-gold/);
  assert.match(composerInputHighlightBlock, /--reflection-prism-blue/);
  assert.match(cssRulesContaining(styles, '.composerField:focus-within::after'), /animation:\s*reflectionInputSheen 1\.8s ease-out 1/);
  assert.match(composerSubmitHighlightBlock, /--reflection-live-white/);
  assert.match(composerSubmitHighlightBlock, /--reflection-prism-blue/);
  assert.doesNotMatch(sidebarHighlightBlock, /--reflection-prism|reflectionInputSheen|animation:/);
  assert.doesNotMatch(cssRulesContaining(styles, ".caseItem[data-active='true']"), /--reflection-prism|0 0 18px|0 0 20px|0 0 14px/);
  assert.doesNotMatch(cssRulesContaining(styles, ".reviewStage[data-state='active']"), /--reflection-prism|0 0 18px|0 0 20px|0 0 14px/);
  assert.doesNotMatch(styles, /\.learningNote\[data-active='true'\]/);
  assert.doesNotMatch(cssRulesContaining(styles, '.fileBadge'), /linear-gradient|radial-gradient/);
  assert.doesNotMatch(
    [sourcesBlock, threadBlock, threadHeaderBlock, composerSurfaceBlock].join('\n'),
    /radial-gradient|linear-gradient/,
    'reflection glass must come from matte/frosted materials, not decorative gradients',
  );
  assert.doesNotMatch(workspace, /styles\.traffic/, 'native traffic lights should not be faked inside the workbench');
  assert.doesNotMatch(
    workspace,
    /<section className=\{styles\.preview\}/,
    'source preview should not compete with the compact evidence receipt',
  );
  assert.match(nativeRoot, /struct LoomReflectionRootView: View/);
  assert.match(nativeRoot, /HStack\(spacing:\s*0\)/);
  assert.match(nativeRoot, /@State private var isSidebarPeeking: Bool = false/);
  assert.match(nativeRoot, /private var shouldShowSidebar: Bool \{ isSidebarPresented \|\| isSidebarPeeking \}/);
  assert.match(nativeRoot, /private var shouldOverlaySidebar: Bool \{ !isSidebarPresented && isSidebarPeeking \}/);
  assert.match(nativeRoot, /if isSidebarPresented \{/);
  // The Explorer redesign (owner-approved 2026-07-03): the sidebar has ONE
  // variant and paints nothing; the floating edge-peek instance carries a
  // painted backdrop at the call site (floating chrome may hold material).
  assert.match(nativeRoot, /if shouldOverlaySidebar \{[\s\S]{0,1600}\.background\(ReflectionSidebarPeekBackdrop\(\)\)/);
  assert.match(nativeRoot, /ReflectionLeftEdgePeekZone\(\)/);
  // The Explorer redesign: the material enum is retired — the docked rail
  // is transparent over the window's one glass; only the floating peek
  // backdrop carries material (.popover, withinWindow).
  assert.doesNotMatch(nativeRoot, /ReflectionSidebarMaterial/);
  assert.match(nativeRoot, /struct ReflectionSidebarPeekBackdrop: View/);
  assert.match(nativeRoot, /ReflectionVisualEffectBackground\([\s\S]{0,120}material: \.popover,[\s\S]{0,80}blendingMode: \.withinWindow/);
  // Fullscreen glass (owner-approved 2026-07-03): the dedicated
  // Fullscreen keeps the SAME window material (2026-07-03 night retest:
  // the .fullScreenUI verdict predated system-follow appearance; under
  // true system-follow it rendered a flat slate slab). One material,
  // one appearance, windowed or fullscreen.
  assert.doesNotMatch(nativeRoot, /\.fullScreenUI/);
  assert.match(
    nativeRoot,
    /if isFullScreen \{[\s\S]{0,700}material: \.underWindowBackground,[\s\S]{0,60}blendingMode: \.behindWindow/,
  );
  assert.match(sidebarBackgroundBlock, /ReflectionVisualEffectBackground/);
  assert.match(sidebarBackgroundBlock, /LinearGradient\(/);
  assert.match(sidebarBackgroundBlock, /\.blendMode\(\.plusLighter\)/);
  assert.doesNotMatch(sidebarBackgroundBlock, /Color\(red:/);
  assert.doesNotMatch(sidebarBackgroundBlock, /RadialGradient/);
  assert.match(reflectionComposerBlock, /private var hasCommitText: Bool/);
  assert.match(reflectionComposerBlock, /Color\(red:\s*1\.0, green:\s*0\.24, blue:\s*0\.34\)/);
  assert.match(reflectionComposerBlock, /Color\(red:\s*1\.0, green:\s*0\.84, blue:\s*0\.28\)/);
  assert.match(reflectionComposerBlock, /Color\(red:\s*0\.28, green:\s*0\.66, blue:\s*1\.0\)/);
  assert.match(reflectionComposerBlock, /\.shadow\(color: Color\(red: 0\.28, green: 0\.66, blue: 1\.0\)\.opacity\(hasCommitText \? 0\.18 : 0\)/);
  assert.match(nativeRoot, /private struct ReflectionMatteWorkbenchBackground: View/);
  assert.match(nativeRoot, /private struct ReflectionFrostedInspectorBackground: View/);
  assert.match(nativeRoot, /ReflectionMatteWorkbenchBackground\(\)\.ignoresSafeArea\(\)/);
  assert.match(nativeRoot, /ReflectionFrostedInspectorBackground\(\)\.ignoresSafeArea\(\)/);
  // The Explorer redesign: one sidebar variant, zero rail-local appearance
  // logic — glass-native translucent objects via Color.primary washes.
  assert.doesNotMatch(nativeRoot, /usesLightChrome|usesCenterOverlay/);
  assert.match(nativeRoot, /ReflectionSidebarSearchField\(text: \$query, focus: \$searchFocused\)/);
  // System semantics (owner 2026-07-03: 系统是什么就用什么): selection is
  // the system's unemphasized sidebar-selection color; seams are the
  // system separator; fills are hierarchical styles.
  assert.match(nativeRoot, /unemphasizedSelectedContentBackgroundColor/);
  assert.match(nativeRoot, /Color\(nsColor: \.separatorColor\)/);
  // Glass law 2026-07-03 (owner-approved): ONE glass pane per window — the
  // root matte is underWindowBackground+behindWindow with day/night tints;
  // the inspector and the docked rail are transparent over it and never
  // stack their own behind-window material or edge hairline.
  assert.match(nativeRoot, /material: \.underWindowBackground,[\s\S]{0,40}blendingMode: \.behindWindow/);
  // Glass law v2: ZERO tint washes — the window is the system material
  // itself. NSGlassEffectView is reserved for floating chrome (it is an
  // in-window lens and renders near-solid as a full-window backing).
  assert.doesNotMatch(nativeRoot, /Rectangle\(\)\.fill\(paperTint\)/);
  assert.match(nativeRoot, /struct ReflectionLiquidGlassBackground: NSViewRepresentable/);
  assert.match(nativeRoot, /ReflectionSidebarRow\([\s\S]{0,220}isSelected: reflectionCase\.id == selectedCaseID/);
  // Selection: a soft translucent highlight, never an opaque slab and never
  // the retired cyan bar (owner 2026-07-03: black boxes + the bar were cheap).
  assert.doesNotMatch(nativeRoot, /fill\(LoomTokens\.dsPaperCard\)/);
  assert.match(nativeRoot, /private func updateSidebarPeek\(_ shouldPeek: Bool\)/);
  assert.match(nativeRoot, /guard !isSidebarPresented else \{ return \}/);
  assert.match(nativeRoot, /ReflectionSidebar\([\s\S]{0,1200}\.onHover \{ hovering in[\s\S]{0,100}updateSidebarPeek\(hovering\)/);
  assert.match(nativeRoot, /ReflectionTopBar\([\s\S]{0,220}isSidebarPresented: isSidebarPresented/);
  assert.doesNotMatch(nativeRoot, /ReflectionTopBar\([\s\S]{0,220}isSidebarPresented: shouldShowSidebar/);
  assert.match(nativeRoot, /private let reflectionSidebarWidth: CGFloat = 248/);
  assert.match(nativeRoot, /private let reflectionInspectorDefaultWidth: CGFloat = 400/);
  assert.match(nativeRoot, /private let reflectionInspectorMinWidth: CGFloat = 320/);
  assert.match(nativeRoot, /private let reflectionInspectorMaxWidth: CGFloat = 560/);
  assert.match(nativeRoot, /private struct ReflectionPaneResizer: View/);
  assert.match(nativeRoot, /@AppStorage\(reflectionInspectorWidthKey\)/);
  assert.match(nativeRoot, /addCursorRect\(bounds, cursor: \.resizeLeftRight\)/);
  assert.match(nativeRoot, /override var mouseDownCanMoveWindow: Bool \{ false \}/);
  assert.match(
    nativeRoot,
    /private struct ReflectionSidebar:[\s\S]*\.background\(Color\.clear\)/,
    'docked left sidebar stays transparent over the window glass (Explorer redesign, owner-approved 2026-07-03)',
  );
  assert.match(nativeRoot, /ZStack\(alignment: \.topLeading\)/);
  assert.match(
    nativeRoot,
    /HStack\(spacing:\s*0\)[\s\S]*\.frame\(maxWidth: \.infinity, maxHeight: \.infinity\)[\s\S]*ReflectionTopBar\(/,
    'native shell should keep one full-height body stack with the titlebar overlaid instead of adding a separate top row',
  );
  assert.match(nativeRoot, /ReflectionTopBar\([\s\S]{0,520}\.zIndex\(1\)/);
  assert.match(nativeRoot, /private func deleteReflection\(_ reflectionCase: ReflectionCase\)/);
  assert.match(nativeRoot, /private func importLocalSources\(\)/);
  assert.match(nativeRoot, /let panel = NSOpenPanel\(\)/);
  assert.match(nativeRoot, /panel\.allowsMultipleSelection = true/);
  assert.match(nativeRoot, /panel\.prompt = "Import"/);
  assert.match(nativeRoot, /panel\.title = "Import local sources"/);
  assert.match(nativeRoot, /panel\.allowedContentTypes = nativeFileImporterContentTypes\(\)/);
  assert.match(nativeRoot, /cases\[index\]\.sources\.insert\(contentsOf: importedSources, at: 0\)/);
  assert.match(nativeRoot, /cases\[index\]\.steps\[0\]\.items\.append\(contentsOf: inputLines\)/);
  assert.match(nativeRoot, /selectedSourceID = importedSources\[0\]\.id/);
  assert.match(nativeRoot, /private static func localSource\(from url: URL\) -> ReflectionSource/);
  assert.match(nativeRoot, /@State private var lastHandledExternalFileToken: UUID\?/);
  assert.match(nativeRoot, /@State private var lastHandledExternalSelectionToken: UUID\?/);
  assert.match(nativeRoot, /private var nativeSource: ReflectionSource\?/);
  assert.match(nativeSurface, /func reflectionLearningInputFingerprint\(_ value: String\) -> String/);
  assert.match(nativeRoot, /range\(of: #", page \\d\+"#, options: \.regularExpression\)/);
  assert.match(nativeRoot, /\.onReceive\(NotificationCenter\.default\.publisher\(for: \.loomOpenExternalFiles\)\)/);
  assert.match(nativeRoot, /\.onReceive\(NotificationCenter\.default\.publisher\(for: \.loomCaptureExternalSelection\)\)/);
  assert.match(nativeRoot, /private func consumePendingExternalFiles\(\)/);
  assert.match(nativeRoot, /private func consumePendingExternalSelection\(\)/);
  assert.match(nativeRoot, /private func openExternalFiles\(_ urls: \[URL\]\)/);
  assert.match(nativeRoot, /private func handleExternalSelectionCapture\(_ capture: LoomExternalSelectionCapture\)/);
  assert.match(nativeRoot, /import PDFKit/);
  assert.match(nativeRoot, /LoomExternalFileOpenRelay\.pendingEntries\(\)/);
  assert.match(nativeRoot, /LoomExternalSelectionCaptureRelay\.pendingCaptures\(\)/);
  assert.match(nativeRoot, /LoomExternalFileOpenRelay\.clear\(ifToken: pending\.token\)/);
  assert.match(nativeRoot, /LoomExternalSelectionCaptureRelay\.clear\(ifToken: pending\.token\)/);
  assert.match(nativeRoot, /cases\[index\]\.steps\[0\]\.items\.append\(inputLine\)/);
  assert.match(nativeRoot, /let sessionSources = importedSources\.isEmpty/);
  assert.match(nativeRoot, /Self\.nativeSessionSource\(from: capture\)/);
  assert.match(nativeRoot, /let candidateSources = importedSources \+ sessionSources/);
  // Sidebar rows are user-initiated projects, never files: captures join the
  // active learning project; a file-named case per document is forbidden.
  assert.match(nativeRoot, /Self\.activeLearningCaseIndex\(/);
  assert.match(nativeRoot, /private static func activeLearningCaseIndex\(/);
  assert.match(nativeRoot, /title: Self\.learningProjectTitle\(\)/);
  assert.doesNotMatch(nativeRoot, /title: primary\.label/);
  assert.match(nativeRoot, /Self\.sourceDeduplicationKey\(source\) == Self\.sourceDeduplicationKey\(primarySource\)/);
  assert.match(nativeRoot, /capture\.sourceWindowTitle/);
  assert.match(nativeRoot, /let inferredAnchor = Self\.inferPDFAnchor\(/);
  assert.match(nativeRoot, /Self\.nativeContextAnchoredSourceLabel\(for: capture, kind: captureKind\)/);
  assert.match(nativeRoot, /selectedSourceID = inferredSourceID/);
  assert.match(nativeRoot, /Window: \\\(\$0\)/);
  assert.match(nativeRoot, /eyebrow: "Learning trace"/);
  assert.match(nativeRoot, /Captured selected text from the native app/);
  assert.match(nativeRoot, /private static func selectionInputLine/);
  assert.match(nativeSurface, /let reflectionLearningEvidenceMarker = "\\nEvidence:"/);
  assert.match(nativeRoot, /private static func selectionEvidenceLine/);
  assert.match(nativeRoot, /return "Evidence: \\\(body\)"/);
  assert.match(nativeRoot, /"app", capture\.sourceApp \?\? "native macOS app"/);
  assert.match(nativeRoot, /"window", capture\.sourceWindowTitle/);
  assert.match(nativeRoot, /"kind", kind\.sourceKind/);
  assert.match(nativeRoot, /let evidenceFileName = fileNames\.isEmpty \? inferredAnchor\?\.fileName : fileNames/);
  assert.match(nativeRoot, /"file", evidenceFileName\?\.isEmpty == false \? evidenceFileName : nil/);
  assert.match(nativeRoot, /"bundle", capture\.sourceBundleIdentifier/);
  assert.match(nativeRoot, /let anchorPrecision = selectionAnchorPrecision\(capture: capture, kind: kind, inferredAnchor: inferredAnchor\)/);
  assert.match(nativeRoot, /\("anchor precision", anchorPrecision\)/);
  assert.match(nativeRoot, /\("evidence rung", selectionEvidenceRung\(for: anchorPrecision\)\)/);
  assert.match(nativeRoot, /\("anchor note", selectionAnchorNote\(for: anchorPrecision\)\)/);
  assert.match(nativeRoot, /\("fallback note", selectionFallbackNote\(for: anchorPrecision\)\)/);
  assert.match(nativeRoot, /\("captured at", ISO8601DateFormatter\(\)\.string\(from: capture\.capturedAt\)\)/);
  assert.match(nativeRoot, /nativeContextEvidencePairs\(capture\.nativeContext\)/);
  assert.match(nativeRoot, /inferredAnchorEvidencePairs\(inferredAnchor\)/);
  assert.match(nativeRoot, /\("path", context\.documentURL\?\.path\)/);
  assert.match(nativeRoot, /\("page", page\)/);
  assert.match(nativeRoot, /\("cell", context\.cellRange\)/);
  assert.match(nativeRoot, /private static func inferredAnchorEvidencePairs\(_ anchor: ReflectionSourceAnchor\?\)/);
  assert.match(nativeRoot, /\("anchor method", anchor\.method\)/);
  assert.match(nativeRoot, /private static func selectionAnchorPrecision/);
  assert.match(nativeRoot, /if let precision = inferredAnchor\?\.precision/);
  assert.match(nativeRoot, /return "file"/);
  assert.match(nativeRoot, /return "window\+page"/);
  assert.match(nativeRoot, /return "window\+time"/);
  assert.match(nativeRoot, /return "app\+time"/);
  assert.match(nativeRoot, /private static func selectionAnchorNote\(for precision: String\) -> String\?/);
  assert.match(nativeRoot, /weak: precise file, page, or cell unavailable/);
  assert.match(nativeRoot, /private static func selectionEvidenceRung\(for precision: String\) -> String/);
  assert.match(nativeRoot, /selected text \+ file \+ page/);
  assert.match(nativeRoot, /selected text \+ app \+ time/);
  assert.match(nativeRoot, /private static func selectionFallbackNote\(for precision: String\) -> String\?/);
  assert.match(nativeRoot, /use appshot, OCR, Vision, or manual confirmation before promoting/);
  assert.doesNotMatch(nativeRoot, /\("anchor precision", context\.anchorPrecision\)/);
  assert.match(nativeRoot, /ForEach\(trace\.evidence\)/);
  assert.match(nativeSurface, /struct ReflectionLearningEvidence: Identifiable, Equatable/);
  assert.match(nativeSurface, /static func splitEvidence/);
  assert.match(nativeSurface, /static func parseEvidence/);
  assert.match(nativeSurface, /evidence: evidence/);
  assert.match(nativeRoot, /private static func learningFocus/);
  assert.match(nativeRoot, /private enum ReflectionLearningFocus/);
  assert.match(nativeRoot, /static func clippedSelectionText/);
  assert.match(nativeRoot, /private static func inferPDFAnchor/);
  assert.match(nativeRoot, /PDFDocument\(url: url\)/);
  assert.match(nativeRoot, /document\.page\(at: pageIndex\)\?\.string/);
  assert.match(nativeRoot, /var matches: \[\(source: ReflectionSource, page: Int\)\] = \[\]/);
  assert.match(nativeRoot, /guard matches\.count == 1/);
  assert.match(nativeRoot, /source\.label\), page/);
  assert.match(nativeRoot, /precision: "file\+page"/);
  assert.match(nativeRoot, /selected text matched one PDF page/);
  assert.match(nativeRoot, /private static func normalizedAnchorText/);
  const normalizedAnchorBlock = nativeRoot.match(
    /private static func normalizedAnchorText[\s\S]*?\n    }\n\n    private static func localFileSize/,
  )?.[0] ?? '';
  assert.match(normalizedAnchorBlock, /CharacterSet\.alphanumerics\.contains\(scalar\)/);
  assert.match(normalizedAnchorBlock, /\.unicodeScalars/);
  assert.match(normalizedAnchorBlock, /\.compactMap \{ scalar -> Character\?/);
  assert.doesNotMatch(normalizedAnchorBlock, /components\(separatedBy: \.whitespacesAndNewlines\)[\s\S]{0,120}joined\(separator: " "\)/);
  assert.match(nativeSurface, /struct ReflectionSourceAnchor/);
  assert.match(nativeRoot, /let next = Self\.learningCase\(from: candidateSources\)/);
  assert.doesNotMatch(nativeRoot, /let primaryPath = primarySource\.fileURL\?\.standardizedFileURL\.path/);
  assert.match(nativeRoot, /return cases\.firstIndex \{ reflectionCase in/);
  assert.match(nativeRoot, /selectedCaseID = cases\[activeIndex\]\.id/);
  assert.match(nativeSurface, /let inputFingerprint = reflectionLearningInputFingerprint\(inputLine\)/);
  assert.match(nativeSurface, /reflectionLearningInputFingerprint\(\$0\) == inputFingerprint/);
  assert.match(nativeRoot, /persistWorkspace\(\)[\s\S]{0,80}return/);
  assert.match(nativeRoot, /isSidebarPresented = false/);
  assert.match(nativeRoot, /isSidebarPeeking = false/);
  assert.match(nativeRoot, /isInspectorPresented = false/);
  assert.match(nativeRoot, /openSourcesInNativeApps\(importedSources\)/);
  assert.match(nativeRoot, /nativeSource: nativeSource/);
  assert.match(nativeRoot, /onOpenSourceInNativeApp: openSelectedSourceInNativeApp/);
  assert.match(nativeRoot, /private func openSourceInNativeApp\(_ source: ReflectionSource\)/);
  assert.match(nativeRoot, /private func openSelectedSourceInNativeApp\(\)/);
  assert.match(nativeRoot, /private func openSourcesInNativeApps\(_ sources: \[ReflectionSource\]\)/);
  assert.match(nativeRoot, /Self\.openURLInPreferredNativeApp\(url\)/);
  assert.match(nativeRoot, /private static func openURLInPreferredNativeApp\(_ url: URL\)/);
  assert.match(nativeRoot, /preferredNativeApplicationURL\(for: url\)/);
  assert.match(nativeRoot, /NSWorkspace\.shared\.urlForApplication\(toOpen: url\)/);
  assert.match(nativeRoot, /NSWorkspace\.OpenConfiguration\(\)/);
  assert.match(nativeRoot, /configuration\.activates = true/);
  assert.match(nativeRoot, /withApplicationAt: applicationURL/);
  assert.match(nativeRoot, /private static func preferredNativeApplicationURL\(for url: URL\) -> URL\?/);
  assert.match(nativeRoot, /case "pdf":[\s\S]{0,90}Preview\.app/);
  assert.match(nativeRoot, /case "doc", "docx", "rtf", "rtfd":[\s\S]{0,90}Microsoft Word\.app/);
  assert.match(nativeRoot, /case "xls", "xlsx", "csv", "tsv":[\s\S]{0,90}Microsoft Excel\.app/);
  assert.match(nativeRoot, /Image\(systemName: "arrow\.up\.forward\.app"\)/);
  assert.match(nativeRoot, /private static func learningCase\(from sources: \[ReflectionSource\]\) -> ReflectionCase/);
  assert.match(nativeRoot, /private static func nativeSessionSource\(from capture: LoomExternalSelectionCapture\) -> ReflectionSource\?/);
  assert.match(nativeRoot, /Native selection captured from/);
  assert.match(nativeRoot, /private static func existingLearningCaseIndex\(/);
  assert.match(nativeRoot, /private static func sourceDeduplicationKey\(_ source: ReflectionSource\) -> String/);
  assert.match(nativeRoot, /return "file:/);
  assert.match(nativeRoot, /return "session:/);
  assert.match(nativeRoot, /var sourceKind: String/);
  assert.match(nativeSurface, /struct ReflectionWorkspaceSnapshot: Codable, Equatable/);
  // The store and the persisted model are internal (not file-private) so
  // LoomTests can verify the mirror safety net with injected scratch stores.
  assert.match(nativeSurface, /enum ReflectionWorkspaceStore/);
  assert.match(nativeSurface, /static let defaultsKey = "loom\.reflectionWorkspaceSnapshot"/);
  assert.match(nativeSurface, /private static func loadFromDefaults\(_ defaults: UserDefaults\) -> ReflectionWorkspaceSnapshot\?/);
  assert.match(nativeSurface, /private static func loadFromMirror\(_ mirrorURL: URL\?\) -> ReflectionWorkspaceSnapshot\?/);
  assert.match(nativeSurface, /private static func writeMirror\(\n        _ snapshot: ReflectionWorkspaceSnapshot,\n        encodedData: Data\? = nil,\n        mirrorURL: URL\?\n    \)/);
  assert.match(nativeSurface, /reflection-workspace-snapshot\.json/);
  assert.match(nativeSurface, /ReflectionWorkspaceStore\.load\(\)/);
  assert.match(nativeRoot, /private func persistWorkspace\(\)/);
  assert.match(nativeSurface, /ReflectionWorkspaceStore\.save\(/);
  assert.match(nativeSurface, /private static func normalize\(_ snapshot: ReflectionWorkspaceSnapshot\) -> ReflectionWorkspaceSnapshot/);
  assert.match(nativeSurface, /static func orderedUnique\(_ values: \[String\]\) -> \[String\]/);
  assert.match(nativeRoot, /project: "Learning pass"/);
  assert.match(nativeRoot, /status: "Reading"/);
  assert.match(nativeRoot, /Use native file tools first/);
  assert.match(nativeRoot, /First language pass: keep the original file surface primary/);
  assert.match(nativeRoot, /capture vocabulary, pronunciation, phrases, sentence meaning, grammar/);
  assert.doesNotMatch(nativeRoot, /SourceFileView\(fileURL: fileURL\)/);
  // The open-in-native-app route survives the launcher right pane: the
  // top bar's Open Source button + the source-open helpers still gate on
  // a real local fileURL.
  assert.match(nativeRoot, /if nativeSource\?\.fileURL != nil/);
  assert.match(nativeRoot, /private func openSourceInNativeApp\(_ source: ReflectionSource\)/);
  assert.match(nativeRoot, /fileURL: url/);
  assert.match(nativeSurface, /var fileURL: URL\?/);
  assert.match(sourceFileView, /import PDFKit/);
  assert.match(sourceFileView, /import QuickLookUI/);
  assert.match(sourceFileView, /init\(fileURL: URL, onClose: @escaping \(\) -> Void\)/);
  assert.match(sourceFileView, /private var sourceIdentity: URL\?/);
  assert.match(sourceFileView, /LoomPDFView\(/);
  assert.match(sourceFileView, /LoomQuickLookView\(fileURL: resolved\)/);
  assert.match(sourceFileView, /if shouldShowCompileActionPanel \{/);
  assert.match(sourceFileView, /private var shouldShowCompileActionPanel: Bool/);
  assert.match(sourceFileView, /final class LoomPDFKitView: PDFView/);
  assert.match(sourceFileView, /override func menu\(for event: NSEvent\) -> NSMenu\?/);
  assert.match(sourceFileView, /super\.menu\(for: event\) \?\? NSMenu\(\)/);
  assert.match(sourceFileView, /currentSelection\?\.string\?\.trimmingCharacters\(in: \.whitespacesAndNewlines\)/);
  assert.match(sourceFileView, /menu\.addItem\(NSMenuItem\.separator\(\)\)/);
  assert.match(sourceFileView, /menu\.addItem\(item\)/);
  assert.doesNotMatch(sourceFileView, /insertItem\(item, at: 0\)/);
  assert.match(sourceFileView, /Note this passage…/);
  assert.match(loomApp, /func application\(_ application: NSApplication, open urls: \[URL\]\)/);
  assert.match(loomApp, /func application\(_ sender: NSApplication, openFile filename: String\) -> Bool/);
  assert.match(loomApp, /private func openExternalFiles\(_ urls: \[URL\]\)/);
  assert.match(loomApp, /LoomExternalFileOpenRelay\.savePending\(fileURLs, token: token\)/);
  assert.match(loomApp, /name: \.loomOpenExternalFiles/);
  assert.match(loomApp, /enum LoomExternalFileOpenRelay/);
  assert.match(loomApp, /static let loomOpenExternalFiles = Notification\.Name\("loomOpenExternalFiles"\)/);
  assert.match(loomApp, /private var servicesProviderRegistered = false/);
  assert.match(loomApp, /private var sourceApplicationObserverRegistered = false/);
  assert.match(loomApp, /private var lastExternalApplicationSnapshot: LoomExternalApplicationSnapshot\?/);
  assert.match(loomApp, /func applicationWillFinishLaunching\(_ notification: Notification\)/);
  assert.match(loomApp, /private func registerSourceApplicationObserver\(\)/);
  assert.match(loomApp, /NSWorkspace\.didActivateApplicationNotification/);
  assert.match(loomApp, /@objc private func activeApplicationDidChange\(_ notification: Notification\)/);
  assert.match(loomApp, /private func registerServicesProvider\(\)/);
  assert.match(loomApp, /NSApp\.servicesProvider = self/);
  assert.match(loomApp, /NSRegisterServicesProvider\(self, "Loom"\)/);
  assert.match(loomApp, /Services provider registered for port Loom/);
  assert.match(loomApp, /@objc\(captureSelectionInLoom:userData:error:\)/);
  assert.match(loomApp, /func captureSelectionInLoom\(/);
  assert.match(loomApp, /captureSelectionInLoom service invoked/);
  assert.match(loomApp, /fallbackSource: lastExternalApplicationSnapshot/);
  assert.match(loomApp, /_ pasteboard: NSPasteboard/);
  assert.match(loomApp, /pasteboard\.string\(forType: \.string\)/);
  assert.match(loomApp, /readObjects\(forClasses: \[NSURL\.self\]/);
  assert.match(loomApp, /fallbackSource: LoomExternalApplicationSnapshot\?/);
  assert.match(loomApp, /let activeSource = sourceApplicationSnapshot\(for: NSWorkspace\.shared\.frontmostApplication\)/);
  assert.match(loomApp, /let refreshedFallbackSource = refreshedSourceApplicationSnapshot\(from: fallbackSource\)/);
  assert.match(loomApp, /let source = activeSource \?\? refreshedFallbackSource/);
  assert.match(loomApp, /sourceWindowTitle: source\?\.windowTitle/);
  assert.match(loomApp, /nativeContext: source\?\.nativeContext/);
  assert.match(loomApp, /private static func sourceApplicationSnapshot/);
  assert.match(loomApp, /processIdentifier: application\.processIdentifier/);
  assert.match(loomApp, /accessibilitySourceContext\(for: application, windowTitle: windowTitle\)/);
  assert.match(loomApp, /private static func refreshedSourceApplicationSnapshot/);
  assert.match(loomApp, /NSRunningApplication\(processIdentifier: snapshot\.processIdentifier\)/);
  assert.match(loomApp, /private static func isLoomApplication\(_ application: NSRunningApplication\) -> Bool/);
  assert.match(loomApp, /private static func isIgnoredSourceApplication\(_ application: NSRunningApplication\) -> Bool/);
  assert.match(loomApp, /"com\.apple\.loginwindow", "com\.apple\.systemuiserver", "com\.apple\.controlcenter"/);
  assert.match(loomApp, /private static func frontmostWindowTitle\(for application: NSRunningApplication\?\) -> String\?/);
  assert.match(loomApp, /AXUIElementCreateApplication\(application\.processIdentifier\)/);
  assert.match(loomApp, /kAXFocusedWindowAttribute/);
  assert.match(loomApp, /kAXFocusedUIElementAttribute/);
  assert.match(loomApp, /"AXDocument", "AXURL", "AXFilename"/);
  assert.match(loomApp, /documentURL\(fromAccessibilityValue:/);
  assert.match(loomApp, /pageContext\(from: strings\)/);
  assert.match(loomApp, /spreadsheetCellRange\(from: strings\)/);
  assert.match(loomApp, /anchorPrecision\(/);
  assert.match(loomApp, /CGWindowListCopyWindowInfo/);
  assert.match(loomApp, /private func captureExternalSelection\(_ capture: LoomExternalSelectionCapture\)/);
  assert.match(loomApp, /LoomExternalSelectionCaptureRelay\.savePending\(capture\)/);
  assert.match(loomApp, /name: \.loomCaptureExternalSelection/);
  assert.match(loomApp, /static let loomCaptureExternalSelection = Notification\.Name\("loomCaptureExternalSelection"\)/);
  assert.match(loomApp, /struct LoomExternalSelectionCapture: Codable, Equatable/);
  assert.match(loomApp, /var sourceWindowTitle: String\?/);
  assert.match(loomApp, /var nativeContext: LoomNativeSourceContext\?/);
  assert.match(loomApp, /struct LoomNativeSourceContext: Codable, Equatable/);
  assert.match(loomApp, /var documentURL: URL\?/);
  assert.match(loomApp, /var pageNumber: Int\?/);
  assert.match(loomApp, /var cellRange: String\?/);
  assert.match(loomApp, /var anchorPrecision: String/);
  assert.match(loomApp, /private struct LoomExternalApplicationSnapshot/);
  assert.match(loomApp, /var processIdentifier: pid_t/);
  assert.match(loomApp, /struct LoomExternalFileOpenEntry: Codable, Equatable/);
  assert.match(loomApp, /private static let defaultsKey = "loom\.pendingExternalFileOpenEntries"/);
  assert.match(loomApp, /private static let defaultsKey = "loom\.pendingExternalSelectionCaptures"/);
  assert.match(loomApp, /static func pendingCaptures\(\) -> \[LoomExternalSelectionCapture\]/);
  assert.match(loomApp, /static func pendingEntries\(\) -> \[LoomExternalFileOpenEntry\]/);
  assert.match(loomApp, /JSONEncoder\(\)\.encode\(captures\)/);
  assert.match(loomApp, /JSONDecoder\(\)\.decode\(\[LoomExternalSelectionCapture\]\.self/);
  assert.match(loomApp, /enum LoomExternalSelectionCaptureRelay/);
  assert.match(nativeRoot, /let captureKind = Self\.captureKind\(for: capture\)/);
  assert.match(nativeRoot, /let captureHasFileEvidence = !capture\.fileURLs\.filter\(\\\.isFileURL\)\.isEmpty/);
  assert.match(nativeRoot, /let sourceLabel = inferredAnchor\?\.label[\s\S]{0,260}\?\? Self\.nativeContextAnchoredSourceLabel\(for: capture, kind: captureKind\)[\s\S]{0,260}\?\? Self\.windowAnchoredSourceLabel\(/);
  assert.match(nativeRoot, /includeWindowPage: !captureHasFileEvidence/);
  assert.match(nativeRoot, /private enum ReflectionCaptureKind: Equatable/);
  assert.match(nativeRoot, /case pdf[\s\S]*case document[\s\S]*case spreadsheet/);
  assert.match(nativeRoot, /private static func pdfDocumentTitle\(from windowTitle: String\) -> String\?/);
  assert.match(nativeRoot, /private static func pdfPageNumber\(from windowTitle: String\) -> Int\?/);
  assert.match(nativeRoot, /guard includeWindowPage else \{ return documentTitle \}/);
  assert.match(nativeRoot, /return "\\\(documentTitle\), page \\\(page\)"/);
  assert.match(nativeRoot, /private static func shouldPromoteLearningInputAnchor\(_ existing: String, candidate: String\) -> Bool/);
  assert.match(nativeRoot, /cases\[index\]\.steps\[0\]\.items\[existingInputIndex\] = inputLine/);
  assert.match(nativeRoot, /return "PDF passage"/);
  assert.match(nativeRoot, /return "document selection"/);
  assert.match(nativeRoot, /return Self\.hasTabularSelection\(text\) \? "spreadsheet cells" : "spreadsheet selection"/);
  assert.match(nativeRoot, /Trace type: \\?\(kind\.traceType\(for: capture\.text\)\\?\)/);
  assert.match(nativeRoot, /Pass: \\?\(focus\.passLabel\\?\)/);
  assert.match(nativeRoot, /Learning focus: \\?\(focus\.label\\?\)/);
  assert.match(nativeRoot, /Meaning status: needs user confirmation/);
  assert.match(nativeRoot, /Second pass: not synthesized yet/);
  // Stage 2 (THE BOOK): machine synthesis is COMPUTED ON READ — it never
  // writes into the user's steps, never appends Loom messages, and never
  // auto-advances the pass. Only user review actions advance it.
  assert.doesNotMatch(nativeRoot, /appendUniqueStepItems/);
  assert.doesNotMatch(nativeRoot, /refreshLearningSynthesis/);
  assert.doesNotMatch(nativeRoot, /Second-pass synthesis prepared from understanding versions/);
  assert.match(nativeRoot, /advancePassOnUserReview\(for: index, focus: focus\)/);
  assert.match(nativeRoot, /if focus == \.question \|\| focus == \.correction \|\| focus == \.principle \{/);
  assert.match(nativeRoot, /cases\[index\]\.status = "Second pass ready"/);
  assert.match(nativeRoot, /let synthesis = ReflectionLearningSynthesis\.make\(for: reflectionCase\)/);
  assert.match(nativeRoot, /mergedUnique\(stepItems\(in: reflectionCase, id: "outcome"\), synthesis\.outcomes\)/);
  assert.match(nativeRoot, /private struct ReflectionLearningSynthesis/);
  assert.match(nativeRoot, /static func make\(for reflectionCase: ReflectionCase\) -> ReflectionLearningSynthesis/);
  assert.match(nativeRoot, /First-pass learning is not final understanding; raw captures need review before they become reusable thinking/);
  assert.match(nativeRoot, /Kept the original file surface primary and used Loom only to commit anchored traces/);
  assert.match(nativeRoot, /Captured \\?\(traces\.count\\?\) anchored learning trace/);
  assert.match(nativeRoot, /Second-pass synthesis: compare versions, correct meanings, then separate language understanding from domain knowledge/);
  assert.match(nativeRoot, /let confirmedPrinciple = traces\.last \{ \$0\.focus == "principle" \}/);
  assert.match(nativeRoot, /Principle candidate: /);
  assert.match(nativeRoot, /private enum ReflectionCommitFocus: String/);
  assert.doesNotMatch(nativeRoot, /CaseIterable, Identifiable/);
  // Stage 2 (THE BOOK): the composer carries explicit type chips — the chip
  // is the FALLBACK; the prefix/suffix grammar still wins so muscle-memory
  // commits keep working. The commit type is never guessed-only.
  assert.match(nativeRoot, /@State private var composerFocus: ReflectionCommitFocus = \.meaning/);
  assert.match(nativeRoot, /let focus = Self\.commitFocus\(for: material, fallback: composerFocus\)/);
  assert.match(nativeRoot, /manualLearningInputLine\(material, sourceLabel: sourceLabel, focus: focus\)/);
  assert.match(nativeRoot, /private static func commitFocus\(for material: String, fallback: ReflectionCommitFocus\) -> ReflectionCommitFocus/);
  assert.match(nativeRoot, /@Binding var commitFocus: ReflectionCommitFocus/);
  assert.match(nativeRoot, /Commit the next entry as a /);
  assert.match(nativeRoot, /trimmed\.hasSuffix\("\?"\) \|\| trimmed\.hasSuffix\("？"\)/);
  assert.match(nativeRoot, /reviewLine\(for: trace\)/);
  assert.match(nativeRoot, /User-confirmed meaning/);
  assert.match(nativeRoot, /confirmedText\(from: trace\.text\)/);
  assert.match(nativeRoot, /confirmationLabel\(for: trace\.focus\)/);
  assert.match(nativeRoot, /LoomReflectionRootView\.clippedSelectionText\(trimmedText, maxLength: 180\)/);
  assert.match(nativeRoot, /if reflectionCase\.project == "Learning pass"[\s\S]{0,360}ReflectionLearningLedgerView\([\s\S]{0,180}reflectionCase: reflectionCase/);
  // Right pane = the launcher (owner-pointed design, 2026-07-03):
  // Review / Terminal / Browser / Files; Files wires to the local-file
  // importer. The old inspector face stays defined but unmounted.
  assert.match(nativeRoot, /ReflectionBridgePanel\([\s\S]{0,120}sources: selectedCase\.sources[\s\S]{0,80}onFiles: importLocalSources/);
  // Bridge v2: the lower half lists what has crossed — project-scoped
  // resources with the way back out to the original.
  assert.match(nativeRoot, /struct BridgeResourceRow: View/);
  assert.match(nativeRoot, /BridgeRow\([\s\S]{0,120}title: "Files"/);
  assert.match(nativeRoot, /private struct ReflectionLearningLedgerView: View/);
  assert.match(nativeRoot, /private struct ReflectionLearningTraceCard: View/);
  assert.match(nativeRoot, /private struct ReflectionLearningSignal: View/);
  assert.match(nativeSurface, /struct ReflectionLearningTrace: Identifiable, Equatable/);
  // Stage 1 (LoomDomain): selection state lives on the shared session so
  // both window mounts observe one workspace instead of racing @State copies.
  assert.match(nativeSession, /@Published var selectedLearningTraceID: ReflectionLearningTrace\.ID\?/);
  assert.match(nativeRoot, /@StateObject private var workspace = ReflectionWorkspaceSession\.shared/);
  assert.match(nativeRoot, /private var selectedLearningTrace: ReflectionLearningTrace\?/);
  assert.match(nativeRoot, /@Binding var selectedLearningTraceID: ReflectionLearningTrace\.ID\?/);
  assert.match(nativeRoot, /private var learningTraces: \[ReflectionLearningTrace\]/);
  assert.match(nativeRoot, /let onSelectTrace: \(ReflectionLearningTrace\) -> Void/);
  assert.match(nativeRoot, /private func selectLearningTrace\(_ trace: ReflectionLearningTrace\)/);
  assert.match(nativeRoot, /selectedSourceID = matchingSource\.id/);
  // The inspector face is unmounted (launcher pane instead); its struct
  // and machinery stay defined for the evidence surfaces it still owns.
  assert.match(nativeRoot, /private struct ReflectionSourceInspector: View/);
  assert.match(nativeRoot, /let sourceLabel = selectedLearningTrace\?\.sourceAnchor/);
  assert.doesNotMatch(nativeRoot, /return "target: \\\(selectedLearningTrace\.version\) \\\(selectedLearningTrace\.versionTitle\.lowercased\(\)\)"/);
  assert.match(nativeRoot, /ReflectionEvidenceInspector\([\s\S]{0,120}trace: selectedTrace[\s\S]{0,120}source: selectedSource[\s\S]{0,160}onOpenSource:/);
  assert.match(nativeRoot, /let onOpenSource: \(\) -> Void/);
  assert.match(nativeRoot, /let onOpenSource: \(\(\) -> Void\)\?/);
  assert.match(nativeRoot, /Label\("Open Source", systemImage: "arrow\.up\.forward\.app"\)/);
  assert.match(nativeRoot, /\.help\("Open the original file in its native app"\)/);
  assert.match(nativeSurface, /func matches\(source: ReflectionSource\) -> Bool/);
  assert.match(nativeSurface, /sourceAnchor\.hasPrefix/);
  assert.doesNotMatch(
    nativeRoot,
    /private var currentTrace: ReflectionLearningTrace\?[\s\S]{0,100}ReflectionLearningTrace\.from\(reflectionCase\)\.last/,
    'Evidence Inspector should follow the selected thinking version, not always the last trace',
  );
  assert.match(nativeRoot, /private struct ReflectionEvidenceInspector: View/);
  assert.match(nativeRoot, /private struct ReflectionEvidenceSourceLine: View/);
  assert.doesNotMatch(nativeRoot, /Text\("Evidence Inspector"\)/);
  assert.doesNotMatch(nativeRoot, /Text\("Source Collection"\)/);
  assert.match(nativeRoot, /Text\("Audit trail"\)/);
  assert.match(nativeRoot, /Text\(trace\.versionTitle\)/);
  assert.match(nativeRoot, /ReflectionLearningSignal\(label: trace\.signalLabel, color: trace\.signalColor\)/);
  assert.match(nativeRoot, /Text\(trace\.displayLabel\)/);
  assert.match(nativeSurface, /return "Original selection"/);
  assert.match(nativeSurface, /return "Selected word"/);
  assert.match(nativeSurface, /return "needs meaning"/);
  assert.match(nativeSurface, /return "needs interpretation"/);
  assert.match(nativeSurface, /static func cleanUserPrefix\(_ value: String\) -> String/);
  assert.match(nativeSurface, /"principle:", "principle："/);
  assert.match(nativeSurface, /"question:", "question："/);
  assert.match(nativeSurface, /"meaning:", "meaning："/);
  assert.match(nativeSurface, /"translation:", "translation："/);
  assert.match(nativeSurface, /"意思:", "意思："/);
  assert.match(nativeRoot, /ReflectionLearningTrace\.from\(reflectionCase\)/);
  assert.match(nativeRoot, /private static func latestLearningAnchor\(in reflectionCase: ReflectionCase\) -> String\?/);
  assert.match(nativeRoot, /\.first \{ trace in[\s\S]{0,160}trace\.isLanguageSelection \|\| trace\.isDataOrDocumentSelection/);
  assert.match(nativeSurface, /parseCaptured\(_ item: String, version: Int\)/);
  assert.match(nativeSurface, /sourceAnchor: sourceAnchor\.isEmpty \? "Original file" : sourceAnchor/);
  assert.match(nativeSurface, /version: "v\\?\(version\\?\)"/);
  assert.match(nativeRoot, /private struct ReflectionLearningReviewSummary: Equatable/);
  assert.match(nativeRoot, /private struct ReflectionLearningPrincipleCandidate: View/);
  // Stage 4 (融会贯通): the candidate block carries the user-signed Promote
  // affordance (gated by anchor honesty in promoteCandidatePrinciple).
  assert.match(nativeRoot, /ReflectionLearningPrincipleCandidate\(/);
  assert.match(nativeRoot, /onPromote: onPromotePrinciple\.map/);
  assert.match(nativeRoot, /case \.blockedWeakAnchor\(let reason\):/);
  assert.match(nativeRoot, /steps\[5\]\.title = "Principle"/);
  assert.match(nativeRoot, /steps\[5\]\.subtitle = "What can become reusable thinking"/);
  assert.match(nativeSurface, /if reflectionCase\.project == "Learning pass", normalizedStep\.id == "memory"/);
  // Stage 2 (THE BOOK): the placeholder adapts to the selected commit type —
  // it teaches only what the chip's word cannot.
  assert.match(nativeRoot, /case \.meaning: return "Add your meaning\.\.\."/);
  assert.match(nativeRoot, /closes when: /);
  assert.match(nativeRoot, /\.help\("Save margin note"\)/);
  // Superseded refusal (Stage 2): adaptive placeholders were rejected when
  // they tracked a GUESSED focus; with explicit type chips the placeholder
  // legitimately follows the user's own selection. The refusal that stands:
  // no worded commit-target column beside the writing row.
  assert.doesNotMatch(nativeRoot, /return "Add understanding\.\.\."/);
  assert.doesNotMatch(nativeRoot, /commitTarget: composerTarget/);
  assert.doesNotMatch(nativeRoot, /private var composerTarget: String/);
  assert.match(nativeRoot, /private var learningTraces: \[ReflectionLearningTrace\]/);
  assert.doesNotMatch(nativeRoot, /if let latest = learningTraces\.last, latest\.isUserCommitted/);
  assert.doesNotMatch(nativeRoot, /return "target: \\?\(latest\.version\\?\) \\?\(latest\.versionTitle\.lowercased\(\)\\?\)"/);
  assert.doesNotMatch(nativeRoot, /learningTraces\.reversed\(\)\.first\(where: \{ !\$0\.isUserCommitted \}\)/);
  assert.doesNotMatch(nativeRoot, /return "target: \\?\(unresolved\.version\\?\) \\?\(unresolved\.versionTitle\.lowercased\(\)\\?\)"/);
  assert.doesNotMatch(nativeRoot, /return "target: \\?\(nextStep\.title\\?\)"/);
  assert.doesNotMatch(nativeRoot, /ForEach\(ReflectionCommitFocus\.allCases\)/);
  assert.doesNotMatch(nativeRoot, /Text\(focus\.title\)/);
  assert.match(nativeRoot, /Image\(systemName: "paperplane\.fill"\)/);
  assert.match(nativeRoot, /Captured user trace from \\?\(sourceLabel\\?\) \[\\?\(focus\.captureLabel\\?\)\]/);
  assert.doesNotMatch(nativeRoot, /manualLearningFocus\(for: material\)/);
  assert.match(nativeRoot, /return "question"/);
  assert.match(nativeRoot, /return "user meaning"/);
  assert.match(nativeRoot, /eyebrow: focus == \.question \? "Open question" : "Understanding version"/);
  assert.match(nativeRoot, /statusMessage = "Committed thinking version"/);
  assert.match(nativeSurface, /static func normalizeLearningInputItem\(_ value: String\) -> String/);
  assert.match(nativeSurface, /static func orderedUniqueLearningInputs\(_ values: \[String\]\) -> \[String\]/);
  assert.match(nativeSurface, /static func normalizeLearningStepItems\(_ step: ReflectionStep\) -> \[String\]/);
  assert.match(nativeSurface, /used Loom only to save anchored traces/);
  assert.match(nativeRoot, /used Loom only to commit anchored traces/);
  assert.match(nativeSurface, /if step\.id == "memory"/);
  assert.match(nativeSurface, /items\.filter \{ \$0\.contains\("Principle candidate"\) \}/);
  assert.match(nativeSurface, /static func normalizeLearningMessage\(_ message: ReflectionMessage\) -> ReflectionMessage/);
  assert.match(nativeSurface, /static func orderedUniqueLearningMessages\(_ messages: \[ReflectionMessage\]\) -> \[ReflectionMessage\]/);
  assert.match(nativeSurface, /let key = "\\\(message\.eyebrow\)\\n\\\(message\.body\)"/);
  assert.match(nativeSurface, /next\.eyebrow = "Understanding version"/);
  assert.match(nativeSurface, /promote only confirmed principles into memory/);
  assert.match(nativeRoot, /First language pass: keep the original file surface primary and capture vocabulary/);
  assert.match(nativeRoot, /case vocabulary[\s\S]*case phrase[\s\S]*case sentence[\s\S]*case passage/);
  assert.match(nativeRoot, /return "first language pass"/);
  assert.match(nativeRoot, /return "phrase meaning"/);
  assert.match(nativeRoot, /return "sentence meaning"/);
  assert.match(nativeRoot, /return "data meaning"/);
  assert.match(nativeRoot, /case "doc", "docx", "pages", "rtf", "rtfd":[\s\S]{0,40}return \.document/);
  assert.match(nativeRoot, /case "xls", "xlsx", "csv", "tsv", "numbers":[\s\S]{0,40}return \.spreadsheet/);
  assert.match(infoPlist, /CFBundleDocumentTypes/);
  assert.match(infoPlist, /com\.adobe\.pdf/);
  assert.match(infoPlist, /org\.openxmlformats\.wordprocessingml\.document/);
  assert.match(infoPlist, /NSServices/);
  assert.match(infoPlist, /Capture Selection in Loom/);
  assert.match(infoPlist, /captureSelectionInLoom/);
  assert.match(infoPlist, /NSPortName/);
  assert.match(infoPlist, /NSStringPboardType/);
  assert.match(infoPlist, /public\.utf8-plain-text/);
  assert.match(projectYml, /NSServices:/);
  assert.match(projectYml, /Capture Selection in Loom/);
  assert.match(projectYml, /NSMessage: captureSelectionInLoom/);
  assert.match(projectYml, /NSPortName: Loom/);
  assert.match(loomApp, /NSUpdateDynamicServices\(\)/);
  assert.match(loomApp, /Text\("Saved"\)/);
  assert.match(loomApp, /Text\("Loom"\)/);
  assert.match(loomApp, /\.accessibilityLabel\(model\.sourceActionLabel \?\? "Back to Source"\)/);
  assert.doesNotMatch(loomApp, /private var compactContextText: String/);
  assert.doesNotMatch(loomApp, /Text\(compactContextText\)/);
  assert.doesNotMatch(loomApp, /compactSpreadsheetPreview/);
  assert.doesNotMatch(loomApp, /Text\(sourceActionLabel\)/);
  assert.match(loomApp, /sourceActionLabel: "Back to Source"/);
  assert.match(loomApp, /sourceActionLabel: "Open Source"/);
  assert.match(loomApp, /actionLabel: "Review in Loom"/);
  assert.doesNotMatch(loomApp, /actionLabel: "Open Loom"/);
  assert.match(loomApp, /private func openSourceFromExternalCompanion\(\)/);
  assert.match(loomApp, /private func restoreSourceFocusFromExternalCompanion\(\) -> Bool/);
  assert.match(loomApp, /private func restoreSourceFocusFromExternalCompanionSoon\(\)/);
  assert.match(loomApp, /restoreSourceFocusFromExternalCompanionSoon\(\)/);
  assert.match(loomApp, /externalCompanionSourceFileURLs/);
  assert.match(loomApp, /externalCompanionSourceBundleIdentifier/);
  assert.match(loomApp, /externalCompanionSourceProcessIdentifier/);
  assert.match(loomApp, /NSWorkspace\.shared\.open\(url\)/);
  assert.match(loomApp, /Self\.openURLInPreferredNativeApp\(url\)/);
  assert.match(loomApp, /private static func openURLInPreferredNativeApp\(_ url: URL\)/);
  assert.match(loomApp, /NSWorkspace\.shared\.urlForApplication\(toOpen: url\)/);
  assert.match(loomApp, /private static func preferredNativeApplicationURL\(for url: URL\) -> URL\?/);
  assert.match(loomApp, /case "pdf":[\s\S]{0,90}Preview\.app/);
  assert.match(loomApp, /case "doc", "docx", "rtf", "rtfd":[\s\S]{0,90}Microsoft Word\.app/);
  assert.match(loomApp, /case "xls", "xlsx", "csv", "tsv":[\s\S]{0,90}Microsoft Excel\.app/);
  assert.match(loomApp, /NSRunningApplication\(processIdentifier: processIdentifier\)/);
  assert.match(loomApp, /application\.activate\(options: \[\.activateAllWindows, \.activateIgnoringOtherApps\]\)/);
  assert.match(loomApp, /sourceBundleIdentifier: source\?\.bundleIdentifier/);
  assert.match(loomApp, /sourceProcessIdentifier: source\?\.processIdentifier/);
  assert.doesNotMatch(loomApp, /Added to Thinking History/);
  assert.doesNotMatch(loomApp, /Source linked\./);
  assert.match(packageJson, /"verify:native-sidecar": "node scripts\/verify-native-sidecar\.mjs"/);
  assert.match(projectYml, /DEVELOPMENT_TEAM: 8BW2794353/);
  assert.match(projectYml, /CODE_SIGN_STYLE: Automatic/);
  assert.match(projectYml, /CODE_SIGN_IDENTITY: "Apple Development"/);
  assert.match(packageJson, /"clean:native-temp:dry": "node scripts\/clean-loom-native-temp\.mjs"/);
  assert.match(packageJson, /"clean:native-temp": "node scripts\/clean-loom-native-temp\.mjs --apply"/);
  assert.match(nativeTempCleaner, /const tempRoots = \[\.\.\.new Set\(\[os\.tmpdir\(\), '\/private\/tmp'\]/);
  assert.match(nativeTempCleaner, /function canonicalTempPath/);
  assert.match(nativeTempCleaner, /function isSafeLoomTempPath/);
  assert.match(nativeTempCleaner, /relative\.startsWith\('loom-'\)/);
  assert.match(nativeTempCleaner, /scratchpad[\s\S]{0,120}loom-build/);
  assert.match(nativeTempCleaner, /function collectRegisteredTempApps/);
  assert.match(nativeTempCleaner, /lsregister/);
  assert.match(nativeTempCleaner, /NSUpdateDynamicServices/);
  assert.match(loomRules, /No workspace pollution/);
  assert.match(loomRules, /Temporary artifacts either live[\s\S]{0,180}\.codex\//);
  assert.match(designDiscipline, /Do not pollute user folders or macOS Services/);
  assert.match(reflectionPrd, /Operational cleanliness is part of preservation/);
  assert.match(nativeSidecarVerifier, /function isConsoleLocked\(\)/);
  assert.match(nativeSidecarVerifier, /IOConsoleLocked/);
  assert.match(nativeSidecarVerifier, /function assertConsoleUnlocked\(\)/);
  assert.match(nativeSidecarVerifier, /Native sidecar verification requires an unlocked macOS session/);
  assert.match(nativeSidecarVerifier, /assertConsoleUnlocked\(\)/);
  assert.match(nativeSidecarVerifier, /NSPerformService\("Capture Selection in Loom", pasteboard\)/);
  assert.match(nativeSidecarVerifier, /function stopRunningLoom\(\)/);
  assert.match(nativeSidecarVerifier, /execFileSync\('\/usr\/bin\/pkill', \['-x', 'Loom'\]/);
  assert.match(nativeSidecarVerifier, /function appUnderTestMetadata\(\)/);
  assert.match(nativeSidecarVerifier, /function fixtureMetadata\(fixtures = \{\}, pdfSource = null\)/);
  assert.match(nativeSidecarVerifier, /function reportPdfSource\(snapshot, verificationLevel\)/);
  assert.match(nativeSidecarVerifier, /function readSnapshotForReport\(\) \{\n  if \(existsSync\(currentSnapshotPath\)\)/);
  assert.match(nativeSidecarVerifier, /function withRestoredUserSnapshot\(label, task\)/);
  assert.match(nativeSidecarVerifier, /pre-run-reflection-snapshot\.json/);
  assert.match(nativeSidecarVerifier, /restoredUserSnapshot=\$\{label\}/);
  assert.match(nativeSidecarVerifier, /withRestoredUserSnapshot\('native-sidecar-gui'/);
  assert.match(nativeSidecarVerifier, /withRestoredUserSnapshot\('native-services-smoke', runServicesCaptureSmoke\)/);
  assert.match(nativeSidecarVerifier, /if \(verificationLevel !== 'snapshot-only'\)/);
  assert.match(nativeSidecarVerifier, /source: 'snapshot PDF learning case'/);
  assert.match(nativeSidecarVerifier, /function isPdfLearningCase\(reflectionCase\)/);
  assert.match(nativeSidecarVerifier, /function traceStrength\(reflectionCase, snapshot\)/);
  assert.match(nativeSidecarVerifier, /function traceCase\(snapshot, title\) \{/);
  assert.match(nativeSidecarVerifier, /traceStrength\(right\.entry, snapshot\) - traceStrength\(left\.entry, snapshot\)/);
  assert.match(nativeSidecarVerifier, /function buildStaticIntegrationContract\(\)/);
  assert.match(nativeSidecarVerifier, /function readPlistJson\(plistPath\)/);
  assert.match(nativeSidecarVerifier, /Contents', 'Info\.plist'/);
  assert.match(nativeSidecarVerifier, /CFBundleDocumentTypes/);
  assert.match(nativeSidecarVerifier, /CFBundleURLTypes/);
  assert.match(nativeSidecarVerifier, /NSServices/);
  assert.match(nativeSidecarVerifier, /serviceDeclared/);
  assert.match(nativeSidecarVerifier, /serviceMessage/);
  assert.match(nativeSidecarVerifier, /serviceSendTypes/);
  assert.match(nativeSidecarVerifier, /pdfDocumentType/);
  assert.match(nativeSidecarVerifier, /wordDocumentType/);
  assert.match(nativeSidecarVerifier, /excelDocumentType/);
  assert.match(nativeSidecarVerifier, /com\.adobe\.pdf/);
  assert.match(nativeSidecarVerifier, /org\.openxmlformats\.wordprocessingml\.document/);
  assert.match(nativeSidecarVerifier, /org\.openxmlformats\.spreadsheetml\.sheet/);
  assert.match(nativeSidecarVerifier, /Capture Selection in Loom/);
  assert.match(nativeSidecarVerifier, /captureSelectionInLoom/);
  assert.match(nativeSidecarVerifier, /NSStringPboardType/);
  assert.match(nativeSidecarVerifier, /public\.utf8-plain-text/);
  assert.match(nativeSidecarVerifier, /public\.file-url/);
  assert.match(nativeSidecarVerifier, /function runtimeMetadata\(\)/);
  assert.match(nativeSidecarVerifier, /staticIntegration: buildStaticIntegrationContract\(\)/);
  assert.match(nativeSidecarVerifier, /appUnderTest: appUnderTestMetadata\(\)/);
  assert.match(nativeSidecarVerifier, /fixtures: fixtureMetadata\(fixtures, pdfSource\)/);
  assert.match(nativeSidecarVerifier, /pdfSource: \{/);
  assert.match(nativeSidecarVerifier, /pdfLearningExperiment: compactTraceCaseFromCase\(pdfSource\.reflectionCase, pdfSource\.title\)/);
  assert.match(nativeSidecarVerifier, /runtime: runtimeMetadata\(\)/);
  assert.match(nativeSidecarVerifier, /`- App under test: \$\{report\.appUnderTest\.path\}`/);
  assert.match(nativeSidecarVerifier, /`- PDF source: \$\{report\.pdfSource\.title\}`/);
  assert.match(nativeSidecarVerifier, /`- PDF path: \$\{report\.fixtures\.pdf\.path\}`/);
  assert.match(nativeSidecarVerifier, /pdfFixture: fixtureMetadata\(\)\.pdf/);
  assert.match(nativeSidecarVerifier, /\.\.\.runtimeMetadata\(\)/);
  assert.match(nativeSidecarVerifier, /function openAppBundle\(target\)/);
  assert.match(nativeSidecarVerifier, /execFileSync\('\/usr\/bin\/open', \[target\]/);
  assert.match(nativeSidecarVerifier, /openAppBundle\(appPath\)/);
  assert.match(nativeSidecarVerifier, /function openFileWithLoom\(target\)/);
  assert.match(nativeSidecarVerifier, /execFileSync\('\/usr\/bin\/open', \['-a', appPath, target\]/);
  assert.match(nativeSidecarVerifier, /openFileWithLoom\(pdfPath\)/);
  assert.match(nativeSidecarVerifier, /openFileWithLoom\(fixtures\.docx\)/);
  assert.match(nativeSidecarVerifier, /openFileWithLoom\(fixtures\.csv\)/);
  assert.doesNotMatch(nativeSidecarVerifier, /\/usr\/bin\/open -a \$\{JSON\.stringify\(appPath\)\}/);
  assert.match(nativeSidecarVerifier, /CGWindowListCopyWindowInfo\(\[\.optionOnScreenOnly\]/);
  assert.match(nativeSidecarVerifier, /Loom Companion/);
  assert.match(nativeSidecarVerifier, /Week 1 Notes\.pdf/);
  assert.match(nativeSidecarVerifier, /Microsoft Word/);
  assert.match(nativeSidecarVerifier, /Microsoft Excel/);
  assert.match(nativeSidecarVerifier, /function assertNativeSurface\(label, windows, owner, nameFragment\)/);
  assert.match(nativeSidecarVerifier, /function assertLoomStaysCompanion\(label, windows\)/);
  assert.match(nativeSidecarVerifier, /function assertLoomIsNotFrontmost\(label\)/);
  assert.match(nativeSidecarVerifier, /function learningInputFingerprint\(value\)/);
  assert.match(nativeSidecarVerifier, /function firstPdfPageText\(target = pdfPath\)/);
  assert.match(nativeSidecarVerifier, /pdftotext', \['-layout', '-f', '1', '-l', '1', target, '-'\]/);
  assert.match(nativeSidecarVerifier, /function pdfLearningSelections\(\)/);
  assert.match(nativeSidecarVerifier, /selectPdfLearningSentence\(text\)/);
  assert.match(nativeSidecarVerifier, /selectPdfLearningPhrase\(sentence, text\)/);
  assert.match(nativeSidecarVerifier, /function parseCapturedInputLine\(item\)/);
  assert.match(nativeSidecarVerifier, /function traceIntegrityFor\(reflectionCase\)/);
  assert.match(nativeSidecarVerifier, /function allTraceIntegrityPassed\(report\)/);
  assert.match(nativeSidecarVerifier, /sourceAnchors/);
  assert.match(nativeSidecarVerifier, /focusLabels/);
  assert.match(nativeSidecarVerifier, /selectedText/);
  assert.match(nativeSidecarVerifier, /passMetadata/);
  assert.match(nativeSidecarVerifier, /traceTypeMetadata/);
  assert.match(nativeSidecarVerifier, /secondPassReadiness/);
  assert.match(nativeSidecarVerifier, /understanding versions are reviewable/);
  assert.match(nativeSidecarVerifier, /\.replace\(\//);
  assert.match(nativeSidecarVerifier, /, page \\d\+/);
  assert.match(nativeSidecarVerifier, /function assertNoDuplicateInputFingerprints\(label, items\)/);
  assert.match(nativeSidecarVerifier, /duplicate understanding input fingerprints/);
  assert.match(nativeSidecarVerifier, /assertNoDuplicateInputFingerprints\('PDF trace', inputItems\(pdfTrace\)\)/);
  assert.match(nativeSidecarVerifier, /Loom must not become the frontmost app during native-file learning/);
  assert.match(nativeSidecarVerifier, /assertLoomIsNotFrontmost\('PDF capture focus'\)/);
  assert.match(nativeSidecarVerifier, /assertLoomIsNotFrontmost\('PDF phrase capture focus'\)/);
  assert.match(nativeSidecarVerifier, /assertLoomIsNotFrontmost\('Word capture focus'\)/);
  assert.match(nativeSidecarVerifier, /assertLoomIsNotFrontmost\('Excel capture focus'\)/);
  assert.match(nativeSidecarVerifier, /latestWindows = readWindows\(\)/);
  assert.match(nativeSidecarVerifier, /expected native .* surface to remain visible/);
  assert.match(nativeSidecarVerifier, /Loom should not leave a full workspace over the native file during learning/);
  assert.match(nativeSidecarVerifier, /function assertReceiptDoesNotPersist\(label\)/);
  assert.match(nativeSidecarVerifier, /Loom saved receipt should auto-dismiss instead of staying open/);
  assert.match(nativeSidecarVerifier, /assertReceiptDoesNotPersist\('Final saved receipt behavior'\)/);
  assert.match(nativeSidecarVerifier, /PDF handoff, capture, focus, and transient receipt assertions passed during the PDF step/);
  assert.match(nativeSidecarVerifier, /Word handoff, capture, focus, and transient receipt assertions passed during the Word step/);
  assert.doesNotMatch(nativeSidecarVerifier, /Final active native surface/);
  assert.match(nativeSidecarVerifier, /status: 'Second pass ready'/);
  assert.match(nativeSidecarVerifier, /Second-pass synthesis prepared/);
  assert.match(nativeSidecarVerifier, /const pdfSelection = pdfLearningSelections\(\)/);
  assert.match(nativeSidecarVerifier, /Captured PDF passage from \$\{pdfTitle\}, page \$\{pdfSelection\.page\}/);
  assert.match(nativeSidecarVerifier, /Source: \$\{pdfTitle\}, page \$\{pdfSelection\.page\}/);
  assert.match(nativeSidecarVerifier, /Sentence meaning to review/);
  assert.match(nativeSidecarVerifier, /Phrase meaning to review/);
  assert.match(nativeSidecarVerifier, /const reportOnly = process\.argv\.includes\('--report-only'\)/);
  assert.match(nativeSidecarVerifier, /const preflightOnly = process\.argv\.includes\('--preflight'\)/);
  assert.match(nativeSidecarVerifier, /const serviceCaptureOnly = process\.argv\.includes\('--service-capture-only'\)/);
  assert.match(nativeSidecarVerifier, /const repoRoot = path\.resolve\(path\.dirname\(fileURLToPath\(import\.meta\.url\)\), '\.\.'\)/);
  assert.match(nativeSidecarVerifier, /process\.env\.LOOM_NATIVE_VERIFY_DIR/);
  assert.match(nativeSidecarVerifier, /path\.join\(repoRoot, '\.codex', 'native-sidecar-verify'\)/);
  assert.doesNotMatch(nativeSidecarVerifier, /\/tmp\/loom-native-sidecar-verify/);
  assert.match(nativeSidecarVerifier, /reflection-write-snapshot\.swift/);
  assert.match(nativeSidecarVerifier, /UserDefaults\.standard\.set\(data, forKey: "loom\.reflectionWorkspaceSnapshot"\)/);
  assert.match(nativeSidecarVerifier, /plistWrites=/);
  assert.match(nativeSidecarVerifier, /mirrorWrites=/);
  assert.match(nativeSidecarVerifier, /function restoreSnapshotFocusToPdf\(snapshot\)/);
  assert.match(nativeSidecarVerifier, /selectedCaseID: pdfCase\.id/);
  assert.match(nativeSidecarVerifier, /selectedSourceID: selectedSource\?\.id \?\? null/);
  assert.match(nativeSidecarVerifier, /cases: \[pdfCase, \.\.\.cases\]/);
  assert.match(nativeSidecarVerifier, /persistPdfFocusedSnapshot\(readLearningExperimentSnapshot\(\)\)/);
  assert.match(nativeSidecarVerifier, /learning-experiment-report\.json/);
  assert.match(nativeSidecarVerifier, /learning-experiment-report\.md/);
  assert.match(nativeSidecarVerifier, /learning-output-packet\.md/);
  assert.match(nativeSidecarVerifier, /learning-output-packet\.html/);
  assert.match(nativeSidecarVerifier, /learning-output-packet\.pdf/);
  assert.match(nativeSidecarVerifier, /learningOutputPacketPdfSourceHashPath/);
  assert.match(nativeSidecarVerifier, /\.source\.sha256/);
  assert.match(nativeSidecarVerifier, /native-sidecar-preflight\.json/);
  assert.match(nativeSidecarVerifier, /computer-use-readback\.json/);
  assert.match(nativeSidecarVerifier, /function readComputerUseReadback\(\)/);
  assert.match(nativeSidecarVerifier, /report\.computerUseReadback\?\.status === 'passed'/);
  assert.match(nativeSidecarVerifier, /computerUseObservedWrongWindow/);
  assert.match(nativeSidecarVerifier, /source-disambiguation-human-path/);
  assert.match(nativeSidecarVerifier, /weak context instead of promoting app identity into file\/page\/cell truth/);
  assert.match(nativeSidecarVerifier, /status: computerUsePassed \? 'passed' : guiStatus/);
  assert.match(nativeSidecarVerifier, /Computer Use readback confirms Preview kept native document text/);
  assert.match(nativeSidecarVerifier, /computerUseReadback: readComputerUseReadback\(\)/);
  assert.match(nativeSidecarVerifier, /function writeLearningExperimentReport\(snapshot, verificationLevel, fixtures = \{\}\)/);
  assert.match(nativeSidecarVerifier, /function reportOnlySnapshot\(baseSnapshot, fixtures = \{\}\)/);
  assert.match(nativeSidecarVerifier, /function reportOnlyLearningCase\(\{/);
  assert.match(nativeSidecarVerifier, /function reportOnlyPassLabel\(traceType\)/);
  assert.match(nativeSidecarVerifier, /function reportOnlyAnchorPrecision\(\{ app, window, kind, file, anchorPrecision \}\)/);
  assert.match(nativeSidecarVerifier, /Report-only fixtures are allowed to prove that a file was configured/);
  assert.match(nativeSidecarVerifier, /they must not promote a page\/cell claim/);
  assert.doesNotMatch(nativeSidecarVerifier, /file && \/pdf\/i\.test\(kind\)[\s\S]{0,120}return 'file\+page'/);
  assert.doesNotMatch(nativeSidecarVerifier, /file && \/spreadsheet\/i\.test\(kind\)[\s\S]{0,120}return 'file\+cell'/);
  assert.match(nativeSidecarVerifier, /file confirmed; page or cell not promoted in report-only mode/);
  assert.match(nativeSidecarVerifier, /function reportOnlyAnchorNote\(precision\)/);
  assert.match(nativeSidecarVerifier, /function evidenceRungForPrecision\(precision\)/);
  assert.match(nativeSidecarVerifier, /selected text \+ file \+ cell/);
  assert.match(nativeSidecarVerifier, /function fallbackNoteForPrecision\(precision\)/);
  assert.match(nativeSidecarVerifier, /use appshot, OCR, Vision, or manual confirmation before promoting/);
  assert.match(nativeSidecarVerifier, /function reportOnlyEvidence\(\{ app, window, kind, file, bundle, anchorPrecision \}\)/);
  assert.match(nativeSidecarVerifier, /const precision = reportOnlyAnchorPrecision\(\{ app, window, kind, file, anchorPrecision \}\)/);
  assert.match(nativeSidecarVerifier, /\['anchor precision', precision\]/);
  assert.match(nativeSidecarVerifier, /\['evidence rung', evidenceRungForPrecision\(precision\)\]/);
  assert.match(nativeSidecarVerifier, /\['anchor note', reportOnlyAnchorNote\(precision\)\]/);
  assert.match(nativeSidecarVerifier, /\['fallback note', fallbackNoteForPrecision\(precision\)\]/);
  assert.match(nativeSidecarVerifier, /Evidence: \$\{reportOnlyEvidence/);
  assert.match(nativeSidecarVerifier, /nativeEvidence: nativeVersions\.length > 0/);
  assert.match(nativeSidecarVerifier, /anchorPrecision: nativeVersions\.length > 0/);
  assert.match(nativeSidecarVerifier, /evidenceRung: nativeVersions\.length > 0/);
  assert.match(nativeSidecarVerifier, /weakAnchorDisclosure: nativeVersions\.length > 0/);
  assert.match(nativeSidecarVerifier, /fallbackDisclosure: nativeVersions\.length > 0/);
  assert.match(nativeSidecarVerifier, /version\.evidence\?\.\['anchor precision'\]/);
  assert.match(nativeSidecarVerifier, /version\.evidence\?\.\['evidence rung'\]/);
  assert.match(nativeSidecarVerifier, /version\.evidence\?\.\['anchor note'\]/);
  assert.match(nativeSidecarVerifier, /version\.evidence\?\.\['fallback note'\]/);
  assert.match(nativeSidecarVerifier, /version\.evidence\?\.app && version\.evidence\?\.kind/);
  assert.match(nativeSidecarVerifier, /function parseInputEvidence\(value\)/);
  assert.match(nativeSidecarVerifier, /id: 'report-only-pdf-learning'/);
  assert.match(nativeSidecarVerifier, /id: 'report-only-word-learning'/);
  assert.match(nativeSidecarVerifier, /id: 'report-only-excel-learning'/);
  assert.match(nativeSidecarVerifier, /const snapshot = reportOnlySnapshot\(readSnapshotForReport\(\), fixtures\)/);
  assert.match(nativeSidecarVerifier, /function learningOutputPacketMarkdown\(report\)/);
  assert.match(nativeSidecarVerifier, /function learningOutputPacketHtml\(markdown, report\)/);
  assert.match(nativeSidecarVerifier, /function renderLearningOutputPacketPdf\(htmlPath, pdfPath\)/);
  assert.match(nativeSidecarVerifier, /function sha256ForFile\(filePath\)/);
  assert.match(nativeSidecarVerifier, /function cachedLearningOutputPacketPdf\(htmlPath, pdfPath/);
  assert.match(nativeSidecarVerifier, /const cachedPdf = cachedLearningOutputPacketPdf\(htmlPath, pdfPath\)/);
  assert.match(nativeSidecarVerifier, /Reused cached A4 PDF packet/);
  assert.match(nativeSidecarVerifier, /source HTML hash unchanged/);
  assert.match(nativeSidecarVerifier, /writeFileSync\(learningOutputPacketPdfSourceHashPath, `\$\{htmlHash\}\\n`\)/);
  assert.match(nativeSidecarVerifier, /function packetSourceOutline\(report\)/);
  assert.match(nativeSidecarVerifier, /function packetSourceOutlineMarkdown\(outline\)/);
  assert.match(nativeSidecarVerifier, /function packetSourceCoverageLines\(report\)/);
  assert.match(nativeSidecarVerifier, /function packetTraceVersionCount\(trace\)/);
  assert.match(nativeSidecarVerifier, /function packetTraceEvidenceValues\(trace, key\)/);
  assert.match(nativeSidecarVerifier, /Word: Loom Word Learning Notes\.docx/);
  assert.match(nativeSidecarVerifier, /Excel: Loom Excel Learning Table\.csv/);
  assert.match(nativeSidecarVerifier, /## 1\. Sources/);
  assert.match(nativeSidecarVerifier, /understanding version\$\{totalVersionCount === 1 \? '' : 's'\} across/);
  assert.match(nativeSidecarVerifier, /anchor precision:/);
  assert.match(nativeSidecarVerifier, /native app:/);
  assert.match(nativeSidecarVerifier, /Learning Objectives/);
  assert.match(nativeSidecarVerifier, /Key Concepts/);
  assert.match(nativeSidecarVerifier, /Agenda/);
  assert.match(nativeSidecarVerifier, /--print-to-pdf=\$\{pdfPath\}/);
  assert.match(nativeSidecarVerifier, /Chrome returned warnings after writing the file/);
  assert.match(nativeSidecarVerifier, /Learning packet/);
  assert.match(nativeSidecarVerifier, /Anchored learning trail/);
  assert.doesNotMatch(nativeSidecarVerifier, /Learning packet · Source:[^`]+Generated:/);
  assert.doesNotMatch(nativeSidecarVerifier, /Loom learning review/);
  assert.match(nativeSidecarVerifier, /Native file remains the source of truth; Loom records the learning trail only/);
  assert.match(nativeSidecarVerifier, /function packetSpineLines\(report\)/);
  assert.match(nativeSidecarVerifier, /function packetActiveRecallPrompt\(version\)/);
  assert.match(nativeSidecarVerifier, /function packetFirstPassLine\(version\)/);
  assert.match(nativeSidecarVerifier, /user-confirmed meaning/);
  assert.match(nativeSidecarVerifier, /Term \/ phrase to review/);
  assert.match(nativeSidecarVerifier, /Sentence to understand/);
  assert.match(nativeSidecarVerifier, /Restate the confirmed meaning/);
  assert.match(nativeSidecarVerifier, /Learning Record/);
  assert.match(nativeSidecarVerifier, /Active recall/);
  assert.match(nativeSidecarVerifier, /Reproducibility — capture trail/);
  assert.match(nativeSidecarVerifier, /Evidence/);
  assert.match(nativeSidecarVerifier, /Selection \/ meaning/);
  assert.match(nativeSidecarVerifier, /Fill in/);
  assert.match(nativeSidecarVerifier, /## 7\. Review record/);
  assert.match(nativeSidecarVerifier, /promote only stable principles/);
  assert.match(nativeSidecarVerifier, /--no-pdf-header-footer/);
  assert.match(nativeSidecarVerifier, /--print-to-pdf-no-header/);
  assert.match(nativeSidecarVerifier, /Generated from anchored learning traces/);
  assert.match(nativeSidecarVerifier, /Evidence/);
  assert.match(nativeSidecarVerifier, /## 0\. Scope — read this first/);
  assert.match(nativeSidecarVerifier, /function buildAcceptanceMatrix\(report\)/);
  assert.match(nativeSidecarVerifier, /const staticIntegrationPassed = report\.staticIntegration\?\.status === 'passed'/);
  assert.match(nativeSidecarVerifier, /const packetGenerated = report\.outputPacket\?\.status === 'generated'/);
  assert.match(nativeSidecarVerifier, /const pdfPacketGenerated = report\.outputPacket\?\.pdf\?\.status === 'generated'/);
  assert.match(nativeSidecarVerifier, /a4-pdf-generated/);
  assert.match(nativeSidecarVerifier, /html-markdown-packet-generated/);
  assert.match(nativeSidecarVerifier, /static-native-integration-contract/);
  assert.match(nativeSidecarVerifier, /Installed Loom\.app declares PDF, Word, Excel, Services capture, and loom:\/\/ handoff integration/);
  assert.match(nativeSidecarVerifier, /Info\.plist declares document types, Capture Selection in Loom/);
  assert.match(nativeSidecarVerifier, /function acceptanceMatrixMarkdown\(criteria\)/);
  assert.match(nativeSidecarVerifier, /function humanPathChecklist\(\)/);
  assert.match(nativeSidecarVerifier, /function humanPathChecklistMarkdown\(items\)/);
  assert.match(nativeSidecarVerifier, /preferencePlistPaths/);
  assert.match(nativeSidecarVerifier, /snapshotMirrorPaths/);
  assert.match(nativeSidecarVerifier, /'Application Support'/);
  assert.match(nativeSidecarVerifier, /'Loom'/);
  assert.match(nativeSidecarVerifier, /reflection-workspace-snapshot\.json/);
  assert.match(nativeSidecarVerifier, /Library', 'Containers', 'com\.yinyiping\.loom'/);
  assert.match(nativeSidecarVerifier, /defaultsExportTimeoutMs/);
  assert.match(nativeSidecarVerifier, /swiftHelperTimeoutMs/);
  assert.match(nativeSidecarVerifier, /snapshotHelperTimeoutMs/);
  assert.match(nativeSidecarVerifier, /snapshot mirror candidates/);
  assert.match(nativeSidecarVerifier, /direct plist candidates/);
  assert.match(nativeSidecarVerifier, /snapshot helper timeout/);
  assert.match(nativeSidecarVerifier, /## Human Path Checklist/);
  assert.match(nativeSidecarVerifier, /unlock-and-read-windows/);
  assert.match(nativeSidecarVerifier, /pdf-native-reading-first/);
  assert.match(nativeSidecarVerifier, /pdf-system-tools-preserved/);
  assert.match(nativeSidecarVerifier, /Look Up, Copy, Translate/);
  assert.match(nativeSidecarVerifier, /search, zoom, and Services remain native macOS actions/);
  assert.match(nativeSidecarVerifier, /pdf-services-capture/);
  assert.match(nativeSidecarVerifier, /word-native-capture/);
  assert.match(nativeSidecarVerifier, /excel-native-capture/);
  assert.match(nativeSidecarVerifier, /review-thinking-version-history/);
  assert.match(nativeSidecarVerifier, /humanPathChecklist: humanPathChecklist\(\)/);
  assert.match(nativeSidecarVerifier, /pdf-native-surface/);
  assert.match(nativeSidecarVerifier, /original-file-open-handoff/);
  assert.match(nativeSidecarVerifier, /thinking-version-integrity/);
  assert.match(nativeSidecarVerifier, /evidence-ladder-integrity/);
  assert.match(nativeSidecarVerifier, /Every native capture states the strongest available evidence rung/);
  assert.match(nativeSidecarVerifier, /native-capability-preservation/);
  assert.match(nativeSidecarVerifier, /does not rebuild mature native actions such as Look Up, Copy, Translate/);
  assert.match(nativeSidecarVerifier, /function nativeCapabilityContract\(\)/);
  assert.match(nativeSidecarVerifier, /function nativeCapabilityContractComplete\(items\)/);
  assert.match(nativeSidecarVerifier, /## Native Capability Contract/);
  assert.match(nativeSidecarVerifier, /native-capability-contract/);
  assert.match(nativeSidecarVerifier, /pdf-native-reading/);
  assert.match(nativeSidecarVerifier, /word-native-document/);
  assert.match(nativeSidecarVerifier, /excel-native-spreadsheet/);
  assert.match(nativeSidecarVerifier, /appshot-fallback/);
  assert.match(nativeSidecarVerifier, /Do not build a custom PDF reader or clone the Preview context menu for v1/);
  assert.match(nativeSidecarVerifier, /Do not clone Word editing, comments, or version history/);
  assert.match(nativeSidecarVerifier, /Do not clone spreadsheet editing, formulas, or chart tooling/);
  assert.match(nativeSidecarVerifier, /Do not present screenshot or OCR evidence as precise file, page, paragraph, or cell provenance/);
  assert.match(nativeSidecarVerifier, /selected text \+ file \+ page/);
  assert.match(nativeSidecarVerifier, /selected cells \+ file \+ sheet\/cell/);
  assert.match(nativeSidecarVerifier, /visual context only/);
  assert.match(
    nativeSidecarVerifier,
    /reviewable understanding versions with source anchor, anchor precision, weak-anchor disclosure, focus, selected text, pass metadata, trace type, and second-pass readiness/,
  );
  assert.match(nativeSidecarVerifier, /All three traces include reviewable understanding-version evidence/);
  assert.match(nativeSidecarVerifier, /### Thinking Version Integrity/);
  assert.match(nativeSidecarVerifier, /PDF file open through Loom/);
  assert.match(nativeSidecarVerifier, /Word file open through Loom/);
  assert.match(nativeSidecarVerifier, /Excel file open through Loom/);
  assert.match(nativeSidecarVerifier, /word-native-surface/);
  assert.match(nativeSidecarVerifier, /excel-native-surface/);
  assert.match(nativeSidecarVerifier, /loom-companion/);
  assert.match(nativeSidecarVerifier, /pdf-learning-experiment/);
  assert.match(nativeSidecarVerifier, /computer-use-human-path/);
  assert.match(nativeSidecarVerifier, /computerUsePassed \? 'passed' : 'external-check-required'/);
  assert.match(nativeSidecarVerifier, /external-check-required/);
  assert.match(nativeSidecarVerifier, /Requires mcp__computer_use\.get_app_state/);
  assert.match(nativeSidecarVerifier, /report\.acceptanceMatrix = buildAcceptanceMatrix\(report\)/);
  assert.match(nativeSidecarVerifier, /writeFileSync\(learningOutputPacketMarkdownPath, packetMarkdown\)/);
  assert.match(nativeSidecarVerifier, /writeFileSync\(learningOutputPacketHtmlPath, packetHtml\)/);
  assert.match(nativeSidecarVerifier, /## Acceptance Matrix/);
  assert.match(nativeSidecarVerifier, /function writePreflightReport\(\)/);
  assert.match(nativeSidecarVerifier, /status: consoleLocked \? 'blocked:locked-screen' : 'ready-for-gui-verification'/);
  assert.match(nativeSidecarVerifier, /servicesCaptureSmoke: 'npm run verify:native-sidecar -- --service-capture-only'/);
  assert.match(nativeSidecarVerifier, /fullGuiVerification: 'npm run verify:native-sidecar -- --screenshots'/);
  assert.match(nativeSidecarVerifier, /Unlock macOS before claiming native PDF\/Word\/Excel GUI verification/);
  assert.match(nativeSidecarVerifier, /function orderedUniqueItems\(items\)/);
  assert.match(nativeSidecarVerifier, /function compactOutcomeItems\(items\)/);
  assert.match(nativeSidecarVerifier, /progressiveOutcomeIndexes/);
  assert.match(nativeSidecarVerifier, /\^Captured \\d\+ anchored learning traces\? from \(\[\^:\]\+\):/);
  assert.match(nativeSidecarVerifier, /verificationLevel === 'snapshot-only'/);
  assert.match(nativeSidecarVerifier, /verificationLevel === 'native-sidecar-gui'/);
  assert.match(nativeSidecarVerifier, /native-services-smoke/);
  assert.match(nativeSidecarVerifier, /Services capture and Reflection snapshot assertions without CGWindow native-surface checks/);
  assert.match(nativeSidecarVerifier, /native window preservation and transient receipt behavior still require GUI verification/);
  assert.match(nativeSidecarVerifier, /function runServicesCaptureSmoke\(\)/);
  assert.match(nativeSidecarVerifier, /function readLearningExperimentSnapshot\(options = \{\}\)/);
  assert.match(nativeSidecarVerifier, /function assertLearningExperimentTraces\(snapshot, options = \{\}\)/);
  assert.match(nativeSidecarVerifier, /allowFileLevelEvidence/);
  assert.match(nativeSidecarVerifier, /gui-verification-required/);
  assert.match(nativeSidecarVerifier, /Requires full GUI verifier or Computer Use to confirm native windows, focus, and companion behavior/);
  assert.match(nativeSidecarVerifier, /writeLearningExperimentReport\(snapshot, 'native-services-smoke', fixtures\)/);
  assert.match(nativeSidecarVerifier, /does not prove the current GUI capture path/);
  assert.match(nativeSidecarVerifier, /writeLearningExperimentReport\(snapshot, 'native-sidecar-gui', fixtures\)/);
  assert.match(nativeSidecarVerifier, /const pdfTitle = path\.basename\(pdfPath\)/);
  assert.match(nativeSidecarVerifier, /PDF: \$\{report\.pdfSource\.title\}/);
  assert.match(nativeSidecarVerifier, /Word: Loom Word Learning Notes\.docx/);
  assert.match(nativeSidecarVerifier, /Excel: Loom Excel Learning Table\.csv/);
  assert.match(nativeSidecarVerifier, /Preview, Word, and Excel remain the primary native surfaces/);
  assert.match(nativeSidecarVerifier, /Loom only appears as a transient saved receipt/);
  assert.match(nativeSidecarVerifier, /source anchors, anchor precision, weak-anchor notes when precision is weak, pass, trace type, selected text, and second-pass readiness/);
  assert.match(nativeSidecarVerifier, /function nativeSurfaceTimeoutMs\(owner\)/);
  assert.match(nativeSidecarVerifier, /owner\.startsWith\('Microsoft '\) \? 18000 : 10000/);
  assert.match(nativeSidecarVerifier, /input: orderedUniqueItems\(inputItems\(reflectionCase\)\)/);
  assert.doesNotMatch(nativeSidecarVerifier, /original file activity -> anchored learning trace -> second-pass synthesis -> reusable memory/);
  assert.match(nativeSidecarVerifier, /27\[0-9\]x6\[0-9\]/);
  assert.match(nativeSidecarVerifier, /tiny transient HUD, not a modal card/);
  assert.match(nativeRoot, /handle\.read\(upToCount: 48_000\)/);
  assert.match(nativeRoot, /private struct ReflectionImportButton: View/);
  assert.match(nativeRoot, /ReflectionImportButton\(action: onImport\)/);
  assert.match(nativeRoot, /if cases\.isEmpty \{[\s\S]{0,80}cases = \[ReflectionCase\.blank\(\)\]/);
  assert.match(nativeRoot, /onDelete: deleteReflection/);
  assert.match(nativeRoot, /ReflectionSidebarRow\([\s\S]{0,340}onDelete: \{ onDelete\(reflectionCase\) \}/);
  assert.match(nativeRoot, /SidebarRowActionButton\(systemImage: "trash", help: "Delete"\)/);
  assert.match(nativeRoot, /private let reflectionTopBarHeight: CGFloat = 52/);
  assert.match(nativeRoot, /private let reflectionSidebarTopClearance: CGFloat = 60/);
  assert.match(nativeRoot, /private let reflectionTitlebarControlSize: CGFloat = 16/);
  assert.match(nativeRoot, /private let reflectionTrafficLightClearance: CGFloat = 88/);
  assert.match(nativeRoot, /private let reflectionTitlebarControlCenterY: CGFloat = 16/);
  assert.match(
    nativeRoot,
    /private let reflectionTitlebarContentTop: CGFloat = reflectionTitlebarControlCenterY - \(reflectionTitlebarControlSize \/ 2\)/,
  );
  assert.match(nativeRoot, /private let reflectionThreadTopPadding: CGFloat = 76/);
  assert.match(nativeRoot, /private let reflectionInspectorTopPadding: CGFloat = 74/);
  assert.doesNotMatch(nativeRoot, /VStack\(spacing:\s*0\)[\s\S]{0,260}ReflectionTopBar\(/, 'titlebar should overlay the workbench instead of occupying a row');
  assert.match(topBarBlock, /ReflectionFileTypeBadge\([\s\S]{0,140}kind: nativeSource\?\.kind \?\? reflectionCase\.sources\.first\?\.kind \?\? "document"/);
  assert.match(topBarBlock, /Text\(reflectionCase\.title\)/);
  assert.doesNotMatch(topBarBlock, /Text\(reflectionCase\.status\)/);
  assert.match(topBarBlock, /Circle\(\)[\s\S]{0,180}\.fill\(reflectionCase\.status == "Second pass ready" \? LoomTokens\.dsSuccess : LoomTokens\.dsInk3\)[\s\S]{0,120}\.help\(reflectionCase\.status\)/);
  assert.match(topBarBlock, /if sourceCount > 1 \{/);
  assert.match(topBarBlock, /systemImage: "folder"/);
  // The pane title is gone (owner 2026-07-03: 摘掉) — only the pane
  // toggle remains in the top bar's inspector slot.
  assert.doesNotMatch(topBarBlock, /Text\("Evidence"\)/);
  assert.match(topBarBlock, /inspectorButton[\s\S]{0,40}\.padding\(\.trailing, 16\)/);
  assert.match(topBarBlock, /ReflectionTopBarButton\([\s\S]*systemName: "sidebar\.left"[\s\S]*action: onToggleSidebar/);
  assert.match(topBarBlock, /ReflectionTopBarButton\([\s\S]*systemName: "sidebar\.right"[\s\S]*action: onToggleInspector/);
  assert.doesNotMatch(topBarBlock, /trash|Delete reflection|onDelete/, 'destructive case actions must stay scoped to sidebar rows');
  assert.match(topBarBlock, /\.padding\(\.top,\s*reflectionTitlebarContentTop\)/);
  assert.match(topBarBlock, /\.frame\(height: reflectionTopBarHeight, alignment: \.topLeading\)/);
  assert.match(topBarBlock, /\.frame\(maxWidth: \.infinity, alignment: \.topLeading\)/);
  assert.doesNotMatch(nativeRoot, /ReflectionTopBarBackground/, 'titlebar should not own a separate material row');
  const topBarViewBlock = topBarBlock.slice(0, topBarBlock.indexOf('private struct ReflectionTopBarButton'));
  assert.doesNotMatch(
    topBarViewBlock,
    /\.background\(/,
    'titlebar should be a control overlay over continuous workbench materials',
  );
  assert.match(topBarBlock, /ReflectionTopBarButton:[\s\S]*\.background\(\.thinMaterial, in: RoundedRectangle/);
  assert.doesNotMatch(nativeRoot, /ReflectionCollapsedSidebarRail/);
  // The retired thread header must not return. (The IDE explorer's
  // WORKSPACE section label — owner-directed 2026-07-03 — is sanctioned,
  // so the old blanket Text("WORKSPACE") clause is scoped down.)
  assert.doesNotMatch(nativeRoot, /ReflectionThreadHeader|PRODUCT REFLECTION WORKSPACE/);
  assert.match(nativeRoot, /ReflectionDivider\(\)/);
  assert.doesNotMatch(nativeRoot, /NavigationSplitView\(columnVisibility:/);
  assert.doesNotMatch(nativeRoot, /List\(selection:/);
  assert.doesNotMatch(nativeRoot, /\.listStyle\(\.sidebar\)/);
  assert.doesNotMatch(nativeRoot, /\.navigationSplitViewColumnWidth/);
  assert.match(nativeRoot, /ReflectionSidebarSearchField\(text: \$query, focus: \$searchFocused\)/);
  assert.match(nativeRoot, /systemName: "sidebar\.left"/);
  assert.match(nativeRoot, /systemName: "sidebar\.right"/);
  assert.match(nativeRoot, /\.frame\(width: reflectionTitlebarControlSize, height: reflectionTitlebarControlSize\)/);
  assert.doesNotMatch(topBarBlock, /RoundedRectangle\(cornerRadius: 4/, 'titlebar controls should not draw separate button pills');
  assert.doesNotMatch(topBarBlock, /\.frame\(width: 22, height: 22\)/, 'titlebar controls should use the shared 16pt macOS control size');
  assert.doesNotMatch(topBarBlock, /\.frame\(width: 28, height: 28\)/, 'titlebar controls should match the small macOS traffic-light scale');
  assert.match(nativeRoot, /contentExtendsUnderTitlebar:\s*true/);
  assert.match(nativeRoot, /removesSystemToolbar:\s*true/);
  assert.match(nativeRoot, /usesFrameAutosave:\s*false/);
  assert.match(contentView, /var usesFrameAutosave: Bool = true/);
  assert.match(
    contentView,
    /if usesFrameAutosave \{[\s\S]{0,120}window\.setFrameAutosaveName\("LoomMainWindow"\)/,
    'reflection must be able to opt out of stale restored frame sizes while legacy shells keep autosave',
  );
  assert.match(
    nativeRoot,
    /contentCornerRadius:\s*0/,
    'reflection should use one native window shell instead of an inner rounded content shell',
  );
  assert.doesNotMatch(nativeRoot, /ReflectionPaneMaterial|ReflectionSelectionMaterial|reflectionGlass/);
  assert.match(nativeRoot, /private let reflectionThreadMaxWidth: CGFloat = 720/);
  assert.match(nativeRoot, /ReflectionTraceList\(steps: reflectionCase\.steps\)/);
  // Stage 3 (workbench): the thread's top clearance is a parameter — the
  // default keeps the contract's 76pt; the tab strip variant reduces it.
  assert.match(nativeRoot, /var topPadding: CGFloat = reflectionThreadTopPadding/);
  assert.match(nativeRoot, /\.padding\(\.top,\s*topPadding\)/);
  assert.match(nativeRoot, /\.padding\(\.top,\s*reflectionInspectorTopPadding\)/);
  assert.doesNotMatch(nativeRoot, /\.padding\(\.top,\s*reflectionTopBarHeight \+/);
  assert.match(
    nativeRoot,
    /ReflectionTraceList\(steps: reflectionCase\.steps\)[\s\S]{0,520}\.frame\(maxWidth: \.infinity, alignment: \.center\)/,
    'thread content should stay centered in the available center pane, especially when side panes are collapsed',
  );
  assert.match(
    nativeRoot,
    /ReflectionComposer\([\s\S]{0,360}text: \$draftText[\s\S]{0,360}onSubmit: onSubmit[\s\S]{0,620}\.frame\(maxWidth: \.infinity, alignment: \.center\)/,
    'composer should share the centered thread axis instead of sticking to the left edge',
  );
  assert.doesNotMatch(nativeRoot, /ReflectionWorkflowGrid|LazyVGrid/);
  assert.match(nativeRoot, /ReflectionSearchField\(text: \$query, placeholder: "Filter sources"\)/);
  assert.match(
    nativeRoot,
    /ScrollView \{[\s\S]*ForEach\(groupedSources, id: \\\.0\)[\s\S]*\.padding\(\.bottom,\s*18\)/,
    'native source list should scroll as evidence navigation instead of keeping a duplicate fixed preview',
  );
  assert.doesNotMatch(nativeRoot, /ReflectionSourcePreview\(source: selectedSource\)/);
  assert.doesNotMatch(nativeRoot, /ReflectionBottomStatusStrip|reflectionBottomStatusHeight|sourceSummary/);
  assert.doesNotMatch(nativeRoot, /Button\(action: onClose\)/, 'sources collapse belongs in the shared top bar');
  assert.doesNotMatch(nativeRoot, /preferredColorScheme\(\.dark\)|environment\(\\\.colorScheme,\s*\.dark\)/);
  assert.match(project, /LoomReflectionRootView\.swift in Sources/);
  assert.ok(NEW_LOOM_PRIMARY_ROUTES.includes('/reflection'), '/reflection should be a primary product route');

  // Owner directive 2026-07-03: the center document is WRITABLE — a
  // transparent, growing NSTextView drawing serif ink directly on the
  // glass (Obsidian/Notion text baseline), not a viewer plus an input box.
  assert.match(nativeRoot, /private struct GlassDocumentEditor: NSViewRepresentable/);
  assert.match(
    nativeRoot,
    /makeNSView\(context: Context\) -> GrowingGlassTextView[\s\S]{0,300}view\.drawsBackground = false/,
    'the document editor must draw on the glass, never on an opaque backing',
  );
  assert.match(
    nativeRoot,
    /final class GrowingGlassTextView: NSTextView[\s\S]{0,600}intrinsicContentSize/,
    'the editor grows with its content inside the outer reading scroll — no nested scroller',
  );
  assert.match(nativeModel, /var documentText: String\? = nil/);
  assert.match(
    nativeRoot,
    /if isLearningCase \{[\s\S]{0,240}ReflectionComposer\(/,
    'the reflection composer box is gone — the document is the writing surface; only the learning commit strip remains',
  );
  assert.doesNotMatch(
    nativeRoot,
    /Paste a product event, user reaction, decision, or launch result/,
    'the reflection composer placeholder must not survive the composer removal',
  );
  // The empty state (owner final call 2026-07-04, closing the moon arc):
  // the blank case stages NOTHING — title, auto-focused cursor, quiet
  // glass. No emblem of any kind mounts on it; the moon's craft lives on
  // in the relief component and the Blender pipelines for the stage and
  // the future pass-progress instrument.
  assert.doesNotMatch(nativeRoot, /MoonEmblem|BacklitMoon|ModeledMoon/);
  assert.match(nativeRoot, /isBlankCase \{ editorFocusRequest \+= 1 \}/);
  assert.match(nativeRoot, /documentText\.isEmpty/, 'blankness is judged against the written document too');
  assert.match(nativeRoot, /struct MoonGlassRelief: View/, 'the carved-glass craft stays for the progress moon and the stage');
  const reliefBlock = nativeRoot.slice(
    nativeRoot.indexOf('struct MoonGlassRelief'),
    nativeRoot.indexOf('private struct MoonAvatar'),
  );
  assert.doesNotMatch(reliefBlock, /Image\(|NSImage/, 'the relief component itself stays pure light');

  // Images ride the document flow as solid white PAPER CARDS (the
  // evidence-card material language), textual pastes stay plain so the
  // document keeps one uniform ink, and the rich document persists as an
  // RTFD package per case — the store keeps only a plain-text mirror.
  assert.match(nativeRoot, /final class PaperImageAttachmentCell: NSTextAttachmentCell/);
  assert.match(
    nativeRoot,
    /PaperImageAttachmentCell[\s\S]{0,2400}NSColor\.white\.setFill\(\)/,
    'the image card is honest solid paper — white fill with a real shadow',
  );
  assert.match(nativeRoot, /pasteAsPlainText\(sender\)/, 'textual pastes must not smuggle foreign fonts or colors onto the glass');
  assert.match(nativeRoot, /rtfdFileWrapper\(/, 'the rich case document persists as RTFD');
  assert.match(nativeRoot, /CaseDocuments/, 'case documents live in their own Application Support directory');
  assert.match(
    nativeRoot,
    /func normalizeDocument[\s\S]{0,2600}PaperImageAttachmentCell/,
    'every attachment — loaded, pasted, or dropped — must wear the paper card',
  );

  // Heading hierarchy + live outline (owner round, from the Obsidian
  // reading-workflow reference): `#`/`##`/`###` lines style as serif
  // headings with the markers faded to tertiary ink, the right-edge
  // outline derives from the WRITTEN document, and clicking an entry
  // scrolls the enclosing reading pane to the heading's line.
  assert.match(nativeRoot, /func headingLevel\(of line: String\)/);
  assert.match(nativeRoot, /func documentHeadings\(in text: String\) -> \[DocumentHeading\]/);
  assert.match(
    nativeRoot,
    /headingLevel\(of: line\)[\s\S]{0,900}NSColor\.tertiaryLabelColor/,
    'heading markers fade to tertiary ink — margin furniture, not content',
  );
  assert.match(
    nativeRoot,
    /GlassDocumentEditor\.documentHeadings\(in: documentText\)/,
    'the live outline mirrors the written document',
  );
  assert.match(
    nativeRoot,
    /headingJumpTarget = heading\.id/,
    'outline entries jump to their heading',
  );
  assert.match(nativeRoot, /view\.enclosingScrollView/, 'the jump drives the enclosing reading scroll, not a nested scroller');

  // The moon-phase progress arc — LOOM's loading language ("Many faces of
  // the Moon" distillation): a thin light travels the limb of a dark disc,
  // drawn natively (no bitmap, no video), following the system appearance.
  // Every AI-thinking surface wears the moon, not the stock spinner.
  const moonIndicator = read('macos-app/Loom/Sources/MoonPhaseIndicator.swift');
  assert.match(moonIndicator, /struct MoonPhaseIndicator: View/);
  assert.match(moonIndicator, /\.trim\(from: 0, to: waxing \? 0\.30 : 0\.07\)/, 'the crescent WAXES AND WANES — many faces, not one face rotating');
  assert.match(moonIndicator, /repeatForever\(autoreverses: false\)/, 'the light sweeps the limb continuously');
  assert.match(moonIndicator, /repeatForever\(autoreverses: true\)/, 'the breath runs out of phase with the sweep');
  assert.doesNotMatch(moonIndicator, /Image\(|NSImage/, 'the arc is drawn light, never a bitmap');
  assert.match(project, /MoonPhaseIndicator\.swift in Sources/);
  const aiBar = read('macos-app/Loom/Sources/LoomAIBar.swift');
  assert.match(aiBar, /MoonPhaseIndicator\(size: 14\)/);
  assert.doesNotMatch(aiBar, /ProgressView\(\)/, 'the AI bar thinks in moonlight, not a stock spinner');
  const examinerView = read('macos-app/Loom/Sources/ExaminerView.swift');
  assert.match(examinerView, /MoonPhaseIndicator\(size: 14\)/);
  const askAIWindow = read('macos-app/Loom/Sources/AskAIWindow.swift');
  assert.match(askAIWindow, /MoonPhaseIndicator\(size: 14\)/);

  // Top-chrome collision: scrolled ink DISSOLVES before reaching the top
  // bar — an alpha mask on the reading scroll, never a painted scrim.
  assert.match(
    nativeRoot,
    /\.mask\([\s\S]{0,400}LinearGradient[\s\S]{0,300}Rectangle\(\)\.fill\(Color\.black\)/,
    'the reading scroll fades its own ink under the top chrome',
  );

  // Files into the flow: images become paper cards, every OTHER file
  // registers as a case source (bridge panel resources) and lands as a
  // clickable paper chip whose loom-source:// link opens through the
  // workspace open path. The chip payload survives RTFD round-trips.
  assert.match(nativeRoot, /func importSources\(from urls: \[URL\], openAfterImport: Bool\)/);
  assert.match(nativeRoot, /final class PaperFileAttachmentCell: NSTextAttachmentCell/);
  assert.match(nativeRoot, /loom-source:\/\//);
  assert.match(nativeRoot, /\.loomref/, 'file chips persist as .loomref payloads inside the RTFD');
  assert.match(nativeRoot, /func routeFiles\(from pasteboard: NSPasteboard\)/);
  assert.match(
    nativeRoot,
    /performDragOperation[\s\S]{0,500}characterIndexForInsertion/,
    'dropped files land at the drop point',
  );
  assert.match(
    nativeRoot,
    /clickedOnLink[\s\S]{0,300}loom-source/,
    'chip clicks open the source through the workspace, not a raw file URL',
  );
  assert.match(
    nativeRoot,
    /importSources\(from: urls, openAfterImport: false\)/,
    'dropping into the document must not bounce the user into another app',
  );

  // About window is a STAGE surface: the brand mark is the bare moon disc
  // (not a letter, not the icon's squircle container), the accent is 青芒
  // cyan (the gold era is over), ONE tagline, and system serif only — the
  // Garamond custom fonts were never bundled and silently fell back.
  const aboutView = read('macos-app/Loom/Sources/AboutView.swift');
  assert.match(aboutView, /applicationIconImage[\s\S]{0,400}clipShape\(Circle\(\)\)/, 'the About hero is the bare moon disc');
  assert.match(aboutView, /signalText/, 'links wear the 青芒 data cyan');
  assert.doesNotMatch(aboutView, /bronze|0xC8|0xE3/i, 'no gold-era ink survives');
  assert.doesNotMatch(aboutView, /Cormorant|EB Garamond|\.custom\(/, 'system serif only — unbundled custom fonts are a silent lie');
  assert.doesNotMatch(aboutView, /personal knowledge identity platform/, 'one tagline, not two');

  // History renders ON the main window's glass (owner 2026-07-04: 不要做成
  // 两个页面 — one pane, not a second window). About posts a notification,
  // the root view mounts a native serif timeline over withinWindow glass,
  // Esc dismisses. The separate webview History window is gone.
  assert.match(aboutView, /loomShowHistoryOnGlass/, 'the History link asks the main window, not a second window');
  assert.doesNotMatch(aboutView, /HistoryWindow\b/, 'the dedicated History window is retired');
  assert.match(nativeRoot, /struct HistoryGlassSurface/, 'history lives as a native surface in the root view');
  assert.match(
    nativeRoot,
    /HistoryGlassSurface[\s\S]{0,4000}material: \.popover,\s*blendingMode: \.withinWindow/,
    'the history surface sits on withinWindow glass (peek-backdrop precedent), not an opaque sheet',
  );
  assert.match(
    nativeRoot,
    /loomShowHistoryOnGlass[\s\S]{0,200}isPresentingHistory = true/,
    'the About link actually reaches the glass — the notification is received, not posted into a void',
  );
  assert.match(
    nativeRoot,
    /HistoryGlassSurface[\s\S]{0,9000}EscapeKeyTrap\(action: onClose\)/,
    'Esc closes the history surface via an NSEvent monitor — the document editor keeps first responder under the glass and eats Escape before onKeyPress or cancelAction can fire',
  );
  assert.doesNotMatch(nativeRoot, /HistoryGlassSurface[\s\S]{0,6000}WebView/, 'the on-glass history is native type, not an embedded web page');
  const loomAppSource = read('macos-app/Loom/Sources/LoomApp.swift');
  assert.doesNotMatch(loomAppSource, /Window\("History"/, 'no separate History window scene survives');
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
  const library = read('macos-app/Loom/Sources/LoomLibraryView.swift');

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

test('Sources absorbs legacy file intake natively after uploads surface removal', () => {
  const globals = read('app/globals.css');
  const nativeSources = read('macos-app/Loom/Sources/LoomLibraryView.swift');

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
    /"md", "mdx", "markdown", "docx", "doc", "rtfd", "xlsx", "xls", "csv", "tsv", "ppt", "key", "pages"/,
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
  const reflectionRoot = read('macos-app/Loom/Sources/LoomReflectionRootView.swift');

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

test('reflection main Loom windows use one unified full-window shell', () => {
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
    'the reflection scene should unify titlebar and content into one shell',
  );
  assert.doesNotMatch(
    mainScene,
    /\.windowToolbarStyle\(\.unifiedCompact\)/,
    'the reflection scene must not recreate the floating system toolbar seen above the custom shell',
  );
  assert.match(fallback, /window\.titlebarAppearsTransparent = true/);
  assert.match(fallback, /window\.titleVisibility = \.hidden/);
  assert.match(fallback, /window\.toolbar = nil/);
  assert.match(fallback, /window\.standardWindowButton\(\.toolbarButton\)\?\.isHidden = true/);
  assert.match(fallback, /styleMask:\s*\[\.titled,\s*\.closable,\s*\.miniaturizable,\s*\.resizable,\s*\.fullSizeContentView\]/);
  assert.match(fallback, /window\.backgroundColor = NSColor\.windowBackgroundColor/);
  assert.match(
    configurator,
    /var removesSystemToolbar: Bool = false/,
    'legacy ContentView may keep its toolbar, but minimal mode must be able to opt out',
  );
  assert.match(
    minimalRoot,
    /WindowConfigurator\(title: "Loom", isNight: usesNightPalette, contentExtendsUnderTitlebar: true, removesSystemToolbar: true\)/,
    'legacy minimal mode can still remove scene-managed toolbar when that shell owns its chrome',
  );
  assert.match(
    configurator,
    /if removesSystemToolbar \{\s*window\.toolbar = nil\s*clearTitlebarAccessories\(window\)\s*window\.standardWindowButton\(\.toolbarButton\)\?\.isHidden = true\s*\}/,
    'full-size shells should clear system toolbar and titlebar accessory chrome explicitly',
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
    'fallback main windows must keep Window > fullscreen actions enabled',
  );
});

test('AppDelegate reasserts reflection main-window hidden-toolbar chrome', () => {
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
  assert.match(read('macos-app/Loom/Sources/ShuttleView.swift'), /userInfo: \["path": "\/sources#reader-notes"\]/);
  assert.doesNotMatch(read('macos-app/Loom/Sources/ShuttleView.swift'), /\/weaves\?weaveId/);
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
  assert.match(app, /Button\("Reflection"\)/);
  assert.match(app, /postNav\("\/reflection"\)/);
  assert.doesNotMatch(app, /Button\("Home"\)/);
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
  assert.doesNotMatch(app, /Button\("Connect Reader Notes…"\)/);
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
  assert.doesNotMatch(contentView, /Text\("Connect Reader Notes"\)/);
  assert.doesNotMatch(contentView, /Text\("\(choose a reader note\)"\)\.tag\(""\)/);
  assert.doesNotMatch(contentView, /Text\("\(choose a panel\)"\)/);
  assert.doesNotMatch(contentView, /Text\("Supports"\)\.tag\("supports"\)/);
  assert.doesNotMatch(contentView, /Text\("Contradicts"\)\.tag\("contradicts"\)/);
  assert.doesNotMatch(contentView, /Text\("Adds detail"\)\.tag\("elaborates"\)/);
  assert.doesNotMatch(contentView, /Text\("Related"\)\.tag\("echoes"\)/);
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

test('default-visible product copy uses literal Sources Studio and Digital Me vocabulary', () => {
  const files = {
    'app/layout.tsx': read('app/layout.tsx'),
    'public/support.html': read('public/support.html'),
    'public/privacy.html': read('public/privacy.html'),
    'app/onboarding/OnboardingClient.tsx': read('app/onboarding/OnboardingClient.tsx'),
    'app/product-history/page.tsx': [
      read('app/product-history/page.tsx'),
      read('components/product-history/ProductHistoryPage.tsx'),
    ].join('\n'),
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
  assert.match(files['app/about/AboutClient.tsx'], /personal knowledge identity platform/);
  assert.match(files['app/about/AboutClient.tsx'], /How Loom serves the archive/);
  assert.match(files['app/about/AboutClient.tsx'], /Product story/);
  assert.match(files['app/about/AboutClient.tsx'], /source-bound memory system/);
  assert.match(files['app/about/AboutClient.tsx'], /\/product-history/);
  assert.match(files['app/product-history/page.tsx'], /Source-backed self\. Living archive\./);
  assert.match(files['app/product-history/page.tsx'], /Proof changed the line/);
  assert.match(files['app/about/AboutClient.tsx'], /Publish the artifact/);
  // 2026-07-03 stage redesign: ONE tagline — the platform restatement
  // was cut with the gold era.
  assert.match(files['macos-app/Loom/Sources/AboutView.swift'], /A living knowledge identity\./);
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
  assert.match(files['lib/new-loom/product-shell.ts'], /resources for learning paths/);
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
  assert.match(draftClient, /AI writing/);
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
  assert.match(loomDoc, /`@` 引用 origin-agnostic[\s\S]{0,320}Studio AI prompt/);
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
  assert.match(draftClient, /Studio structure/);
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
    /Studio 已进入新 Loom 主线[\s\S]{0,220}ThinkingDraft[\s\S]{0,220}approval-bound/,
    'docs/loom.md should summarize the current Studio layer without closing approval-bound gates',
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
  assert.match(draftClient, /Public working mode is on\. Studio references are masked\./);
  assert.match(draftClient, /!\s*publicWorkingMode && predictedReferenceHits\.length > 0/);
  assert.match(draftClient, /!\s*publicWorkingMode \? \(/);
  assert.match(draftClient, /!\s*publicWorkingMode && tile\.canInsertQuote/);
  assert.match(draftClient, /!\s*publicWorkingMode && realReference/);
  assert.match(draftClient, /!\s*publicWorkingMode && referencePickerOpen/);

  assert.match(draftStorage, /export function publicWorkingDraftReferences/);
  assert.match(draftStorage, /Source reference/);
  assert.match(draftStorage, /Capture reference/);
  assert.match(draftStorage, /Artifact state reference/);
  assert.match(loomDoc, /Studio references are masked/i);
});

test('Draft owns the card board runtime migrated out of Sōan', () => {
  const draftBoardClient = read('app/draft/DraftBoardClient.tsx');
  const draftClient = read('app/draft/DraftClient.tsx');
  const nativeDraftView = read('macos-app/Loom/Sources/LoomDraftView.swift');
  const plan = read('docs/projects/active/2026-05-09-legacy-surface-migration-plan.md');
  const globals = read('app/globals.css');

  assert.match(draftClient, /import DraftBoardClient from '\.\/DraftBoardClient'/);
  assert.match(draftClient, /const boardRef = useRef<HTMLElement \| null>\(null\)/);
  assert.match(draftClient, /get\('view'\) === 'board'/);
  assert.match(draftClient, /boardRef\.current\?\.scrollIntoView/);
  assert.match(draftClient, /aria-label="Studio card board"/);
  assert.match(draftClient, /<DraftBoardClient \/>/);

  assert.match(draftBoardClient, /export default function DraftBoardClient/);
  assert.match(draftBoardClient, /aria-label="Studio card index"/);
  assert.match(draftBoardClient, /Studio board · thinking space/);
  assert.match(draftBoardClient, /Studio board\./);
  assert.match(draftBoardClient, /Studio board holds the cards/);
  assert.match(draftBoardClient, /aria-label="Studio board shortcuts"/);
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
  assert.match(plan, /\| `\/soan` \| Compatibility \| Studio \| Redirect to `\/studio\?edit=new`/);
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
  assert.match(draftClient, />\s*Start from tag\s*<\/button>/);

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

test('Help explains Sources Studio and Digital Me without reviving legacy product labels', () => {
  const helpPage = read('app/help/page.tsx');
  const helpCss = read('app/help/HelpPage.module.css');

  for (const label of ['Sources', 'Studio', 'Digital Me']) {
    assert.match(helpPage, new RegExp(`\\b${label}\\b`));
  }

  assert.match(helpPage, /import styles from '\.\/HelpPage\.module\.css'/);
  assert.match(helpPage, /<main className=\{styles\.page\}>/);
  assert.doesNotMatch(helpPage, /<PageFrame|className="prose-notion"|style=\{\{/);
  assert.match(helpPage, /context-to-form workspace/);
  assert.doesNotMatch(helpPage, /\bCollect\b|\bOrganize\b|\borganize\b|href="\/collect"/);
  assert.match(helpPage, /Resolve source material into claims/);
  assert.match(helpPage, /Bring in, shape, represent\./);

  for (const href of ['/sources', '/studio', '/digital-me']) {
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

  for (const label of ['Sources', 'Studio', 'Digital Me']) {
    assert.match(systemClient, new RegExp(`\\b${label}\\b`));
  }
  assert.doesNotMatch(systemClient, /\bCollect\b|\bOrganize\b/);

  for (const label of ['Sources', 'Studio', 'Digital Me']) {
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
    'We don’t watch you',
    'We don’t interrupt you',
    'We don’t pretend to know better',
    'We don’t flatten your work into a feed',
    'We don’t pretend everything must be kept forever',
    'We don’t auto-upload your local files',
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
