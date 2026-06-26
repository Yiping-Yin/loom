import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repoRoot = path.resolve(__dirname, '..');
const globalsCss = fs.readFileSync(path.join(repoRoot, 'app/globals.css'), 'utf8');
const rootLayoutSource = fs.readFileSync(path.join(repoRoot, 'app/layout.tsx'), 'utf8');
const deckBuildSource = fs.readFileSync(path.join(repoRoot, 'docs/deck/build-loom-deck.mjs'), 'utf8');
const knowledgeSurfaceCss = [
  'app/about/AboutClient.module.css',
  'app/digital-me/DigitalMeRoleOS.module.css',
  'app/draft/draft-evidence-desk.module.css',
  'app/knowledge/KnowledgeHomeStatic.module.css',
  'app/knowledge/[category]/CategoryDossier.module.css',
  'app/knowledge/unsw/UnswDossier.module.css',
].map((relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')).join('\n');
const coldInterfacePaletteSource = [
  'app/globals.css',
  'lib/loom-design-system.ts',
  'app/AtlasClient.tsx',
  'app/PanelDetailClient.tsx',
  'app/PatternsClient.tsx',
  'app/WeavesClient.tsx',
  'app/draft/DraftBoardClient.tsx',
  'components/BPETokenizer.tsx',
  'components/LoomDiagram.tsx',
  'components/LoomCursor.tsx',
  'components/ActiveRetrieval.tsx',
  'app/knowledge/KnowledgeHomeStatic.module.css',
  'app/knowledge/[category]/CategoryDossier.module.css',
].map((relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')).join('\n');

test('root typography is offline-safe and scopes the wordmark serif stack', () => {
  // Body/chrome typography stays offline-safe: display faces resolve through
  // CSS stacks instead of next/font network fetches. The locked Loom wordmark
  // gets its own CSS variable so it can be applied only to the History visor.
  assert.doesNotMatch(rootLayoutSource, /next\/font\/google/);
  assert.doesNotMatch(rootLayoutSource, /Cormorant_Garamond/);
  assert.match(globalsCss, /--font-cormorant:\s*"Cormorant Garamond"/);
  assert.match(globalsCss, /--font-wordmark:\s*"Fraunces",\s*"Cormorant Garamond"/);
  assert.doesNotMatch(rootLayoutSource, /className=\{fraunces\.variable\}/);
});

test('root route container fills the native webview viewport', () => {
  assert.match(
    rootLayoutSource,
    /<div className="layout">\s*<div id="main" tabIndex=\{-1\}>/,
    'RootLayout should keep #main as the direct flex child of .layout',
  );
  assert.match(
    globalsCss,
    /\.layout\s*>\s*#main\s*\{[\s\S]*flex:\s*1\s+1\s+auto[\s\S]*min-width:\s*0[\s\S]*width:\s*100%[\s\S]*align-self:\s*stretch/,
    'The actual root route container must fill the WebView instead of shrink-wrapping route content',
  );
  assert.match(
    globalsCss,
    /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*\.layout\s*>\s*#main\s*\{[\s\S]*animation:\s*none/,
    'Reduced-motion override should target the same root route container',
  );
  assert.doesNotMatch(
    globalsCss,
    /\.layout\s+main\s*\{[\s\S]*flex:\s*1/,
    'Do not put the viewport flex contract on nested route <main> elements',
  );
});

test('global CSS preserves shared compatibility contracts outside the home route', () => {
  const requiredContracts: Array<[label: string, pattern: RegExp]> = [
    ['overlay fade-in animation', /@keyframes\s+loom-overlay-fade-in\s*\{/],
    ['modal exit animation', /@keyframes\s+loom-modal-exit\s*\{/],
    ['pulse animation', /@keyframes\s+loomPulse\s*\{/],
    ['pin burst animation', /@keyframes\s+pinBurst\s*\{/],
    ['pin halo animation', /@keyframes\s+pinHalo\s*\{/],
    ['highlight passage utility', /\.loom-highlight-passage\s*\{/],
    ['highlight passage animation', /@keyframes\s+loom-highlight-passage\s*\{/],
    ['note-rendered KaTeX contract', /\.note-rendered\s+\.katex-display\s*\{/],
    ['note-rendered markdown contract', /\.note-rendered\s+h1\s*\{/],
    ['manual dark theme contract', /\.dark\s*\{[\s\S]*--bg:/],
    [
      'auto dark media query gated behind explicit light\/dark classes',
      /@media\s*\(prefers-color-scheme:\s*dark\)\s*\{[\s\S]*html:not\(\.light\):not\(\.dark\)\s*\{/,
    ],
    ['layout shell main contract', /\.layout-shell__main\s*\{[\s\S]*min-height:\s*100vh/],
    [
      'pinned sidebar layout offset',
      /body\.sidebar-pinned\s+\.layout-shell__main\s*\{[\s\S]*margin-left:\s*var\(--sidebar-shell-width\)/,
    ],
    ['sidebar shell contract', /\.sidebar-shell__inner\s*\{/],
    ['sidebar section contract', /\.sidebar-section__body\s*\{/],
    ['toc contract', /\.toc\s*\{/],
    ['doc outline contract', /\.doc-outline\b|\.loom-doc-nav\s*\{/],
    ['study mode toc hiding contract', /body\.loom-study-mode\s+\.toc\b/],
    ['reading mode doc chrome hiding contract', /body\.reading-mode\s+\.doc-outline\b/],
    ['glass utility', /\.glass\s*\{/],
    [
      'material thick utility contract',
      /\.material-thick\s*\{[\s\S]*background:\s*var\(--mat-thick-bg\)[\s\S]*backdrop-filter:\s*var\(--mat-blur-thick\)[\s\S]*border:\s*0\.5px solid var\(--mat-border\)/,
    ],
    ['caption2 utility', /\.t-caption2\s*\{[\s\S]*font-size:\s*var\(--t-caption2\)/],
    ['adjacent typography utilities', /\.t-footnote\s*\{[\s\S]*font-size:\s*var\(--t-footnote\)/],
    ['toastIn animation', /@keyframes\s+toastIn\s*\{/],
    ['lpFade animation', /@keyframes\s+lpFade\s*\{/],
    ['static grain overlay', /\.loom-grain\s*\{[\s\S]*background-image:\s*url\(/],
  ];

  for (const [label, pattern] of requiredContracts) {
    assert.match(globalsCss, pattern, `Expected ${label} in app/globals.css`);
  }
});

test('global deep-space palette uses graphite black with silver lift', () => {
  const lockedTokens: Array<[token: string, value: string]> = [
    ['--ink-0', '#070809'],
    ['--ink-1', '#0B0C0D'],
    ['--ink-2', '#111315'],
    ['--ink-3', '#181B1E'],
    ['--ink-4', '#22262A'],
    ['--ink-5', '#30353A'],
    ['--line', '#2A2F34'],
    ['--line-soft', '#202428'],
    ['--text-1', '#E7E9EA'],
    ['--text-2', '#A4A9AD'],
    ['--text-3', '#8E9499'], // lifted from #666D72 to clear WCAG-AA on dark surfaces
  ];

  for (const [token, value] of lockedTokens) {
    assert.match(
      globalsCss,
      new RegExp(`${token}:\\s*${value}`, 'i'),
      `${token} should resolve to the graphite/silver deep-space ramp`,
    );
  }

  assert.match(
    globalsCss,
    /--deep-space-field:\s*[\s\S]*radial-gradient\(84%\s+74%\s+at\s+-6%\s+-8%[\s\S]*rgba\(238,\s*241,\s*242,\s*0\.16\)[\s\S]*linear-gradient\(135deg[\s\S]*rgba\(4,\s*5,\s*6,\s*0\.96\)/,
    'Body should define a left-top silver to lower-right cold-black deep-space field, not a blue glow',
  );
  assert.match(
    globalsCss,
    /body\s*\{[\s\S]*background-image:\s*var\(--deep-space-field\)[\s\S]*background-attachment:\s*fixed/,
    'Body should render the shared deep-space field as the ambient page background',
  );
  assert.match(
    rootLayoutSource,
    /themeColor:\s*\[[\s\S]*color:\s*'#070809'[\s\S]*color:\s*'#070809'/,
    'Browser and native chrome should use the graphite-black page base',
  );
  assert.doesNotMatch(globalsCss, /rgba\(108,\s*148,\s*180,\s*0\.05\)/);
  assert.doesNotMatch(globalsCss, /#10141A/i);
  assert.doesNotMatch(knowledgeSurfaceCss, /#10141A/i);
  assert.doesNotMatch(`${globalsCss}\n${knowledgeSurfaceCss}`, /#07090C|#161B22|#0a0d12|#04060a/i);
  assert.doesNotMatch(
    `${globalsCss}\n${knowledgeSurfaceCss}`,
    /rgba\(\s*(202,\s*214,\s*226|89,\s*105,\s*122|126,\s*143,\s*160)/i,
  );
  assert.doesNotMatch(globalsCss, /hair of blue undertone/i);
});

test('global liquid glass tokens stay neutral silver instead of paper-warm bronze', () => {
  assert.match(globalsCss, /--mat-thin-bg:\s+rgba\(232,\s*236,\s*238,\s*0\.36\)/);
  assert.match(globalsCss, /--mat-reg-bg:\s+rgba\(232,\s*236,\s*238,\s*0\.62\)/);
  assert.match(globalsCss, /--mat-thick-bg:\s+rgba\(232,\s*236,\s*238,\s*0\.9\)/);
  // Realistic glass optics (2026-06-26): a bright white top lip + cool-gray inner
  // thickness — still NEUTRAL silver (the silver --mat-*-bg + no-warm guard below hold).
  assert.match(globalsCss, /--mat-hi:\s*[\s\S]*rgba\(255,\s*255,\s*255,\s*0\.66\)[\s\S]*rgba\(38,\s*44,\s*50,\s*0\.16\)/);
  assert.match(globalsCss, /Scrollbars — thin, signature-cyan, quiet/);
  assert.match(globalsCss, /Keyboard focus ring — signature cyan/);
  assert.doesNotMatch(globalsCss, /rgba\(255,\s*245,\s*220,\s*0\.62\)/);
  assert.doesNotMatch(globalsCss, /rgba\(158,\s*124,\s*62,\s*0\.08\)/);
  assert.doesNotMatch(globalsCss, /tinted with paper warmth/i);
  assert.doesNotMatch(globalsCss, /Scrollbars — thin, bronze/i);
  assert.doesNotMatch(globalsCss, /Keyboard focus ring — bronze/i);
});

test('system dark mode uses the same graphite silver ramp as explicit dark', () => {
  assert.match(
    globalsCss,
    /@media\s*\(prefers-color-scheme:\s*dark\)\s*\{[\s\S]*html:not\(\.light\):not\(\.dark\)\s*\{[\s\S]*System dark follows the explicit Loom dark ramp/,
  );
  assert.match(
    globalsCss,
    /html:not\(\.light\):not\(\.dark\)\s*\{[\s\S]*--bg:\s*#070809[\s\S]*--fg:\s*#E7E9EA[\s\S]*--fg-secondary:\s*#A4A9AD[\s\S]*--muted:\s*#666D72/,
  );
  assert.match(
    globalsCss,
    /html:not\(\.light\):not\(\.dark\)\s*\{[\s\S]*--mat-border:\s*rgba\(231,\s*233,\s*234,\s*0\.08\)[\s\S]*--mat-thin-bg:\s*rgba\(18,\s*20,\s*22,\s*0\.45\)[\s\S]*--mat-reg-bg:\s*rgba\(18,\s*20,\s*22,\s*0\.75\)[\s\S]*--mat-thick-bg:\s*rgba\(18,\s*20,\s*22,\s*0\.94\)/,
  );
  assert.match(
    globalsCss,
    /\.dark\s*\{[\s\S]*--bg:\s*#070809[\s\S]*--mat-thin-bg:\s*rgba\(18,\s*20,\s*22,\s*0\.45\)[\s\S]*--mat-thick-bg:\s*rgba\(18,\s*20,\s*22,\s*0\.94\)/,
  );
  assert.doesNotMatch(globalsCss, /Vellum's warmth in the candle text/i);
  assert.doesNotMatch(globalsCss, /night \(warm-neutral\)/i);
  assert.doesNotMatch(globalsCss, /rgba\(26,\s*24,\s*21,\s*0\.(45|75|94|88)\)/);
  assert.doesNotMatch(globalsCss, /rgba\(232,\s*224,\s*206,\s*0\.0[348]\)/);
});

test('global CSS does not keep retired deep-green dossier accents', () => {
  const retiredDeepGreenTokens = [
    '#215b47',
    '#123f30',
    '#0c4636',
    '#15513f',
    '#0f3f31',
    '#0d3f31',
    '#073125',
    '#225c48',
    '#174534',
    '#0e3c2e',
    '#064f3f',
    '#043d31',
    '#063f34',
    '#e8f2ed',
    '#8fc6ad',
    '#9ac9af',
    '#9ad7b8',
    '#9fcdae',
    '#9fcfae',
    '#9fcfb3',
    '4, 63, 52',
    '33, 91, 71',
    '34, 92, 72',
    '21, 81, 63',
    '31, 58, 47',
    '18, 63, 49',
    '30, 43, 37',
    '55, 68, 54',
    '143, 198, 173',
    '154, 201, 175',
    '159, 205, 174',
    '159, 207, 179',
  ];

  for (const token of retiredDeepGreenTokens) {
    assert.doesNotMatch(
      globalsCss.toLowerCase(),
      new RegExp(token.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      `Retired deep-green dossier accent should not remain in app/globals.css: ${token}`,
    );
  }
});

test('global CSS does not keep retired cover sage or bronze literals', () => {
  const retiredCoverLiterals = [
    '#9fcbb6',
    '#a8d5bf',
    '#bfe4d0',
    '#c9a86a',
    '201,168,106',
    '201, 168, 106',
    '159, 203, 182',
    '96, 144, 120',
    'Bronze (#c9a86a)',
    'green stays verified-only',
    'warm gold glow',
    'gold quote-mark',
    'gold/green fill',
  ];

  for (const literal of retiredCoverLiterals) {
    assert.doesNotMatch(
      globalsCss.toLowerCase(),
      new RegExp(literal.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      `Retired cover sage/bronze literal should not remain in app/globals.css: ${literal}`,
    );
  }
});

test('cold interface palette replaces retired gold sage and indigo literals', () => {
  const retiredInterfacePalette = [
    '#9E7C3E',
    '#A8783E',
    '#B98E3F',
    '#C4A468',
    '#5C6E4E',
    '#3A477A',
    '#5E3D5C',
    '#5C3F2A',
    '196, 164, 104',
    '185, 142, 63',
    '92, 110, 78',
    '58, 71, 122',
  ];

  for (const literal of retiredInterfacePalette) {
    assert.doesNotMatch(
      coldInterfacePaletteSource.toLowerCase(),
      new RegExp(literal.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      `Retired gold/sage/indigo interface literal should not remain: ${literal}`,
    );
  }
});

test('product deck generator uses the current signature-cyan visual system', () => {
  assert.match(deckBuildSource, /const SIGNATURE = '4BC5DE'/);
  assert.match(deckBuildSource, /SIGNATURE_HI = '8AF7E6'/);
  assert.match(deckBuildSource, /CYAN = '6CE7F2'/);
  assert.match(deckBuildSource, /const BG = '070809', PANEL = '181B1E', PANEL2 = '111315'/);
  assert.doesNotMatch(deckBuildSource, /C8A24A|E3C56A|const GOLD|GOLD2|champagne/i);
  assert.doesNotMatch(deckBuildSource, /faint gold rule/i);
});
