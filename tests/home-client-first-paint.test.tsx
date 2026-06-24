import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import React from 'react';

const repoRoot = path.resolve(__dirname, '..');

const cssModuleClassMap = new Proxy(
  {},
  { get: (_target, className) => (typeof className === 'string' ? className : '') },
) as Record<string, string>;
const cssModuleExports = { __esModule: true, default: cssModuleClassMap };

require.extensions['.css'] = (module: { exports: typeof cssModuleExports }) => {
  module.exports = cssModuleExports;
};

function visibleText(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'").replace(/\s+/g, ' ');
}

function renderHomeClientHtml() {
  Object.assign(globalThis, { React });
  const { renderToStaticMarkup } = require('react-dom/server') as {
    renderToStaticMarkup: (node: React.ReactElement) => string;
  };
  const { HomeClient } = require('../app/HomeClient') as typeof import('../app/HomeClient');

  return renderToStaticMarkup(<HomeClient />);
}

function globalNavHtml(html: string, ariaLabel = 'Verified dossier navigation') {
  return html.match(new RegExp(`<nav[^>]+aria-label="${ariaLabel}"[\\s\\S]*?<\\/nav>`))?.[0] ?? '';
}

test('HomeClient first paint is a balanced evidence portal with source-backed destinations', () => {
  const html = renderHomeClientHtml();
  const text = visibleText(html);
  const primaryNavHtml = globalNavHtml(html);

  for (const label of [
    'Yiping Yin',
    '🇨🇳 Wuhan',
    '🇦🇺 Sydney',
    'Quant T/R',
    'AI Founder',
    'About',
    'Education',
    'Experience',
    'Digital Me',
    'ECON 3202',
    'MATH 2991',
    'Data and Algorithms in Trading',
    'FINS 3666',
    'Optiver',
    // The experience ledger row renders the UNSW Research Assistant entry by
    // its CV-backed role rather than the retired "UNSW RA" preview label.
    'Research Assistant',
  ]) {
    assert.match(text, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.match(html, /Trading &amp; Market Making/);

  for (const label of ['Home', 'About', 'Education', 'Experience', 'Digital Me']) {
    assert.match(primaryNavHtml, new RegExp(`>${label}<`));
  }

  for (const retiredPrimaryNav of ['Quantnet', 'QuantNet', 'WQU', 'Claude', 'History']) {
    assert.doesNotMatch(
      primaryNavHtml,
      new RegExp(`>${retiredPrimaryNav.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}<`),
    );
  }

  for (const menuLabel of ['Identity', 'Workspaces', 'Sources']) {
    assert.match(primaryNavHtml, new RegExp(`>${menuLabel}<`));
  }
  assert.match(primaryNavHtml, /href="\/sources"/);
  // Draft is no longer a peer workspace nav item — it lives inside Digital Me.
  assert.doesNotMatch(primaryNavHtml, /href="\/draft"/);
  assert.doesNotMatch(primaryNavHtml, /href="\/drafts"/);

  // New "ledger cover" (Home v12): identity rail + numbered evidence ledger.
  assert.match(html, /<main class="vd-home lcv" aria-labelledby="verified-dossier-title">/);
  assert.match(html, /href="\/loom" aria-label="Open Loom product"/);
  assert.match(html, /role="search" aria-label="Search Loom knowledge"/);
  assert.match(html, /action="\/sources" method="get"/);
  assert.match(html, /name="search"/);
  assert.match(html, /placeholder="Search sources"/);
  assert.match(html, /type="button" aria-label="Open Loom search"/);
  assert.match(html, /aria-label="Open Loom search"/);
  assert.match(html, /aria-controls="loom-global-search-input"/);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /id="loom-global-search-input"/);
  assert.match(html, /aria-label="Open Loom menu"/);
  assert.match(html, /\/brand\/loom_lunar_orb\.png/);
  assert.match(html, /class="new-loom-home-capabilities"/);
  assert.match(html, /data-capability="sources"/);
  assert.match(html, /data-capability="draft"/);
  assert.doesNotMatch(html, /<nav class="new-loom-home-capabilities"/);
  assert.doesNotMatch(html, /aria-label="Loom workspaces"/);

  const globalNavSource = fs.readFileSync(
    path.join(repoRoot, 'components/verified-dossier/LoomGlobalNav.tsx'),
    'utf8',
  );
  assert.match(globalNavSource, /elements\.namedItem\('search'\)/);
  assert.match(globalNavSource, /import \{ flushSync \} from 'react-dom'/);
  assert.match(globalNavSource, /const searchOpenRef = useRef\(false\)/);
  assert.match(globalNavSource, /function focusSearchInput\(\)/);
  assert.match(globalNavSource, /window\.requestAnimationFrame\(focusInput\)/);
  assert.match(globalNavSource, /window\.setTimeout\(focusInput, 0\)/);
  assert.match(globalNavSource, /function openSearch\(\)/);
  assert.match(globalNavSource, /flushSync\(\(\) => \{\s*setSearchOpen\(true\);\s*\}\)/);
  assert.match(globalNavSource, /function onSearchButtonPointerDown\(/);
  assert.match(globalNavSource, /onPointerDown=\{onSearchButtonPointerDown\}/);
  assert.match(globalNavSource, /function onSearchButtonClick\(event: React\.MouseEvent<HTMLButtonElement>\)/);
  assert.match(globalNavSource, /event\.preventDefault\(\);\s*if \(!searchOpenRef\.current\)/);
  assert.match(globalNavSource, /function onSearchButtonPointerDown\(\)\s*\{\s*openSearch\(\);/);
  assert.doesNotMatch(globalNavSource, /onPointerDown=\{onSearchFormPointerDown\}/);
  assert.doesNotMatch(globalNavSource, /function onSearchFormPointerDown\(/);
  assert.doesNotMatch(globalNavSource, /function onSearchFormPointerDown\([\s\S]*?event\.preventDefault\(\)/);
  assert.doesNotMatch(globalNavSource, /onMouseDown=\{\(event\) => event\.preventDefault\(\)\}/);
  assert.doesNotMatch(globalNavSource, /function onSearchButtonPointerDown\(event: React\.PointerEvent<HTMLButtonElement>\)[\s\S]*?event\.preventDefault\(\)/);
  assert.match(globalNavSource, /inputMode="search"/);
  assert.match(globalNavSource, /enterKeyHint="search"/);
  assert.match(globalNavSource, /window\.location\.assign\(`\/sources\?\$\{params\.toString\(\)\}`\)/);
  // Stable nav contract: the scroll-driven hide/show (wheel listeners + interval
  // polling + the hidden transform/state) was removed so the top bar no longer
  // repeatedly hides and reappears — it is always present.
  assert.doesNotMatch(globalNavSource, /queueScrollUpdate/);
  assert.doesNotMatch(globalNavSource, /addEventListener\('wheel'/);
  assert.doesNotMatch(globalNavSource, /navHidden/);
  assert.doesNotMatch(globalNavSource, /if \(!searchQuery\.trim\(\)\)/);
  assert.match(globalNavSource, /const LOOM_WORKSPACE_NAV = \[/);
  assert.match(globalNavSource, /\{ label: 'Sources', href: '\/sources' \}/);
  assert.doesNotMatch(globalNavSource, /label: 'Draft'/);
  assert.match(globalNavSource, />\s*Identity\s*</);
  assert.match(globalNavSource, />\s*Workspaces\s*</);

  const globalNavCss = fs.readFileSync(
    path.join(repoRoot, 'components/verified-dossier/LoomGlobalNav.module.css'),
    'utf8',
  );
  const globalsCss = fs.readFileSync(path.join(repoRoot, 'app/globals.css'), 'utf8');
  const aiKeyBannerSource = fs.readFileSync(
    path.join(repoRoot, 'components/AiKeyMissingBanner.tsx'),
    'utf8',
  );
  const homeClientSource = fs.readFileSync(path.join(repoRoot, 'app/HomeClient.tsx'), 'utf8');
  const rootLayoutSource = fs.readFileSync(path.join(repoRoot, 'app/layout.tsx'), 'utf8');
  assert.match(homeClientSource, /NEW_LOOM_CAPABILITIES/);
  assert.match(homeClientSource, /data-capability=\{capability\.id\}/);
  assert.doesNotMatch(homeClientSource, /Loom workspaces/);
  assert.doesNotMatch(homeClientSource, /<nav className="new-loom-home-capabilities"/);
  assert.match(
    rootLayoutSource,
    /import '\.\.\/components\/verified-dossier\/LoomGlobalNav\.module\.css'/,
    'Root layout must load the global navigation CSS so / keeps searchable nav styling even when the page CSS chunk is absent.',
  );
  assert.match(aiKeyBannerSource, /position: 'fixed'/);
  assert.match(aiKeyBannerSource, /className="loom-ai-key-banner"/);
  assert.match(aiKeyBannerSource, /data-ai-key-banner="true"/);
  assert.match(aiKeyBannerSource, /pathname === ['"]\/sources['"]/);
  assert.match(aiKeyBannerSource, /pathname === ['"]\/draft['"]/);
  assert.match(aiKeyBannerSource, /pathname === ['"]\/drafts['"]/);
  assert.match(aiKeyBannerSource, /pathname === ['"]\/help['"]/);
  assert.match(aiKeyBannerSource, /pathname === ['"]\/hour['"]/);
  assert.match(aiKeyBannerSource, /pathname === ['"]\/connections['"]/);
  assert.match(aiKeyBannerSource, /pathname === ['"]\/offline['"]/);
  assert.match(aiKeyBannerSource, /pathname === ['"]\/onboarding['"]/);
  assert.match(aiKeyBannerSource, /bottom: 'max\(0\.75rem, env\(safe-area-inset-bottom\)\)'/);
  assert.match(aiKeyBannerSource, /maxWidth: 'min\(25rem, calc\(100vw - 2rem\)\)'/);
  assert.match(aiKeyBannerSource, /boxSizing: 'border-box'/);
  assert.match(aiKeyBannerSource, /className="loom-ai-key-banner__copy"/);
  assert.match(aiKeyBannerSource, /whiteSpace: 'nowrap'/);
  assert.match(aiKeyBannerSource, /textOverflow: 'ellipsis'/);
  assert.match(globalsCss, /body \.loom-ai-key-banner\s*\{[^}]*max-width:min\(16\.5rem, calc\(100vw - 2rem\)\)!important;/s);
  assert.match(globalsCss, /body \.loom-ai-key-banner__copy\s*\{[^}]*max-width:10rem!important;/s);
  assert.match(globalsCss, /body:has\(\.new-loom-draft\) \.loom-ai-key-banner\s*\{[^}]*display:none!important;/s);
  assert.doesNotMatch(aiKeyBannerSource, /--loom-ai-key-banner-offset/);
  assert.doesNotMatch(globalNavCss, /html\[data-loom-ai-key-banner='visible'\]/);
  assert.doesNotMatch(globalNavCss, /--loom-nav-banner-offset/);
  assert.match(globalNavCss, /top: var\(--loom-nav-base-top\);/);
  assert.doesNotMatch(globalNavCss, /\.nav\.navHidden/);
  assert.match(globalNavCss, /\.slot\s*{[^}]*--loom-nav-clearance: clamp\(5\.05rem, 6vw, 5\.85rem\);/s);
  assert.match(globalNavCss, /\.slot\s*{[^}]*z-index: 1000;[^}]*min-height: var\(--loom-nav-clearance\);[^}]*pointer-events: none;/s);
  assert.match(globalNavCss, /\.nav\s*{[^}]*z-index: 1000;[^}]*width: min\(calc\(100vw - clamp\(1\.25rem, 20vw, 21rem\)\), 23\.25rem\);/s);
  assert.match(globalNavCss, /rgba\(13, 15, 16, 0\.5\)/);
  assert.match(globalNavCss, /backdrop-filter: blur\(38px\) saturate\(112%\) brightness\(1\.04\);/);
  assert.match(globalNavCss, /\.searchInput\s*{[^}]*opacity: 0;[^}]*pointer-events: none;/s);
  assert.match(globalNavCss, /\.searchInput\s*{[^}]*caret-color: var\(--signature-cyan-hi, #8AF7E6\);/s);
  assert.match(globalNavCss, /\.searchInput::placeholder\s*{[^}]*rgba\(232, 236, 238, 0\.68\);/s);
  assert.match(globalNavCss, /width: 12\.25rem;/);
  assert.match(globalNavCss, /max-width: calc\(100vw - 2\.4rem\);/);
  assert.match(
    globalNavCss,
    /\.navSearching \.searchForm,[\s\S]*\.nav:has\(\.searchInput:focus\) \.searchForm:focus-within\s*{[^}]*grid-column: 1 \/ -1;[^}]*width: 100%;[^}]*background: transparent;[^}]*box-shadow: none;[^}]*transition: none;/s,
  );
  assert.match(globalNavCss, /\.navSearching,\s*\.nav:has\(\.searchInput:focus\)\s*{[^}]*rgba\(18, 20, 22, 0\.48\);/s);
  assert.match(globalNavCss, /\.navSearching::before,\s*\.nav:has\(\.searchInput:focus\)::before\s*{[^}]*opacity: 0\.42;/s);
  assert.match(globalNavCss, /\.navSearching \.searchForm:focus-within,\s*\.nav:has\(\.searchInput:focus\) \.searchForm:focus-within\s*{[^}]*box-shadow: none;/s);
  assert.match(globalNavCss, /\.navSearching \.searchInput,\s*\.nav:has\(\.searchInput:focus\) \.searchInput\s*{[^}]*opacity: 1 !important;/s);
  assert.match(globalNavCss, /\.navSearching \.searchInput,\s*\.nav:has\(\.searchInput:focus\) \.searchInput\s*{[^}]*transition:[^}]*color var\(--dur-1\) var\(--ease\),[^}]*text-shadow var\(--dur-1\) var\(--ease\);/s);
  assert.doesNotMatch(globalNavCss, /\.navSearching \.searchInput,[\s\S]*?\.nav:has\(\.searchInput:focus\) \.searchInput\s*{[^}]*opacity 0\.16s ease/s);
  assert.match(globalNavCss, /\.searchInput:focus,\s*\.searchInput:focus-visible\s*{[^}]*outline: none !important;[^}]*box-shadow: none !important;/s);
  assert.match(globalNavCss, /\.navSearching \.brand,\s*\.navSearching \.menu,[\s\S]*\.nav:has\(\.searchInput:focus\) \.brand,[\s\S]*\.nav:has\(\.searchInput:focus\) \.menu\s*{[^}]*opacity: 0;/s);
  assert.match(
    globalNavCss,
    /\.menuPanel\s*{[^}]*position: fixed;[^}]*z-index: 1003;[^}]*width: min\(18\.65rem, calc\(100vw - 2rem\)\);[^}]*grid-template-columns: 1fr;[^}]*rgba\(7, 8, 9, 0\.86\);/s,
  );
  assert.match(globalNavCss, /\.nav\s*\{[\s\S]*pointer-events:\s*auto/);
  assert.match(globalNavCss, /\.menuGroupLabel\s*\{/);
  assert.match(globalNavCss, /\.menuGroupLinks\s*{[^}]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/s);
  assert.match(globalNavCss, /@media \(max-width: 680px\)[\s\S]*\.menuPanel\s*{[^}]*width: min\(calc\(100vw - 2rem\), 18\.65rem\);[^}]*grid-template-columns: 1fr;/s);

  assert.match(html, /class="lcv-shell"/);
  assert.match(html, /class="lcv-rail"/);
  assert.match(html, /class="lcv-ledger"/);
  // Exactly four numbered ledger rows, one per presentation category.
  assert.equal((html.match(/class="lcv-row lcv-row--/g) ?? []).length, 4);
  assert.match(html, /class="lcv-row lcv-row--about"/);
  assert.match(html, /class="lcv-row lcv-row--education"/);
  assert.match(html, /class="lcv-row lcv-row--experience"/);
  assert.match(html, /class="lcv-row lcv-row--digital-me"/);
  assert.equal((html.match(/class="lcv-row__num"/g) ?? []).length, 4);
  assert.match(html, />01</);
  assert.match(html, />04</);
  // Each ledger row is itself a link to its category destination (the whole
  // row is clickable; there is no separate floating "View details" element).
  assert.doesNotMatch(html, /class="lcv-view"/);
  assert.equal((html.match(/<a class="lcv-row lcv-row--[a-z-]+" href="/g) ?? []).length, 4);
  assert.match(html, /<a class="lcv-row lcv-row--about" href="\/about"/);
  assert.match(html, /<a class="lcv-row lcv-row--education" href="\/education"/);
  assert.match(html, /<a class="lcv-row lcv-row--experience" href="\/experience"/);
  assert.match(html, /<a class="lcv-row lcv-row--digital-me" href="\/digital-me"/);
  // Inline "Open →" affordance lives inside each label block (4 total).
  assert.equal((html.match(/class="lcv-row__open"/g) ?? []).length, 4);
  // Identity rail: photo, three profile links (LinkedIn icon variant).
  assert.match(html, /class="lcv-photo"/);
  assert.match(html, /\/profile\/yiping-profile-photo\.png/);
  assert.equal((html.match(/class="lcv-link-icon/g) ?? []).length, 3);
  assert.match(html, /class="lcv-link-icon lcv-link-icon--linkedin"/);
  assert.match(html, /class="lcv-member">MEMBER SINCE APRIL 2024/);
  // Per-category preview assets.
  assert.match(html, /class="lcv-panel lcv-about"/);
  assert.match(html, /class="lcv-cv"/);
  assert.match(text, /CURRICULUM VITAE/);
  assert.match(text, /CV \/ Résumé/);
  assert.match(html, /class="lcv-panel lcv-edu"/);
  assert.match(html, /class="lcv-edu__logos"/);
  assert.match(html, /\/brand\/unsw\/unsw-crest\.png/);
  assert.match(html, /\/brand\/wqu\/wqu-logo\.svg/);
  assert.match(html, /\/brand\/quantnet\/quantnet-logo\.png/);
  assert.match(html, /\/brand\/claude\/claude-icon\.png/);
  assert.match(html, /class="lcv-edu__chips"/);
  assert.match(html, /more courses/);
  assert.equal((html.match(/class="lcv-exp__card"/g) ?? []).length, 2);
  assert.match(html, /class="lcv-panel lcv-dm"/);
  assert.match(html, /class="lcv-dm__flow"/);
  assert.match(html, /class="lcv-dm__table"/);
  assert.match(html, /class="lcv-dm__graph"/);
  assert.match(text, /How does concavity connect to optimisation/);
  // Verified-source pills: four ledger rows plus the two experience cards.
  assert.equal((html.match(/class="lcv-verified"/g) ?? []).length, 6);
  assert.match(text, /Verified source/);
  assert.match(text, /Verified sources/);
  // Footer source-of-truth callout.
  assert.match(html, /class="lcv-foot"/);
  assert.match(text, /LOOM — PERSONAL KNOWLEDGE, BACKED BY REAL SOURCES/);
  assert.match(html, /<a class="lcv-foot__all" href="\/sources">/);
  assert.match(text, /VIEW ALL SOURCES/);
  assert.match(text, /Turning scattered knowledge/);
  // Retired markup must NOT reappear under any of the legacy cover names.
  assert.doesNotMatch(html, /vd-home--cover/);
  assert.doesNotMatch(html, /vd-cover-composition/);
  assert.doesNotMatch(html, /vd-portrait-cover/);
  assert.doesNotMatch(html, /vd-proof-covers?/);
  assert.doesNotMatch(html, /vd-hybrid-grid|vd-hybrid-covers/);
  assert.doesNotMatch(html, /vd-cover-art/);
  assert.doesNotMatch(html, /vd-cover-link/);
  assert.doesNotMatch(html, /vd-home-optibook-shot/);
  assert.doesNotMatch(html, /vd-personal-stage/);
  assert.doesNotMatch(html, /class="vd-home-answer-canvas"/);
  assert.doesNotMatch(html, /class="vd-home-proof-steps"/);
  assert.doesNotMatch(html, /class="vd-home-mini-table"/);
  assert.doesNotMatch(html, /class="vd-home-asset-grid"/);
  assert.doesNotMatch(html, /vd-home-asset-grid__/);
  assert.doesNotMatch(html, /class="vd-profile-card"/);
  assert.doesNotMatch(html, /class="vd-dossier"/);
  assert.doesNotMatch(html, /class="vd-resume-safe-preview"/);
  assert.doesNotMatch(html, /class="vd-evidence-row"/);
  assert.doesNotMatch(html, /class="vd-profile-asset"/);
  assert.doesNotMatch(html, /class="vd-institution-badge"/);
  assert.doesNotMatch(html, /class="vd-document-preview-asset\b/);
  assert.doesNotMatch(html, /class="vd-course-asset-row"/);
  assert.doesNotMatch(html, /class="vd-process-step-asset\b/);
  assert.doesNotMatch(html, /Market Lens/);
  assert.doesNotMatch(html, /Source memory/);
  assert.doesNotMatch(html, /NVDA/);
  assert.doesNotMatch(html, /SPY/);
  assert.doesNotMatch(html, /class="vd-avatar"/);
  assert.doesNotMatch(html, /<aside id="cited-answer" class="vd-inspector"/);
  assert.doesNotMatch(html, /aria-label="Identity sidebar"/);
  assert.doesNotMatch(text, /No recent Draft/);
  assert.doesNotMatch(html, /vd-workbench-grid/);
  assert.doesNotMatch(html, /vd-home-source-preview/);
  assert.doesNotMatch(html, /vd-home-route-rail/);
  assert.doesNotMatch(html, /vd-home-provenance/);
  assert.doesNotMatch(text, /Evidence Portal/);
  assert.doesNotMatch(text, /Explore the source-backed systems/);
  assert.doesNotMatch(text, /LAST UPDATED 2025-06-05/);
  // The ledger now renders each category summary verbatim, so the about
  // ("Self-introduction…"), education ("Courses, coursework…") and experience
  // ("Projects, work, competitions…") summaries are expected to appear. The
  // retired *standalone-asset-grid* descriptions below must still be absent.
  assert.doesNotMatch(text, /Projects, research, and built systems/);
  assert.doesNotMatch(text, /Local Optibook, market memory/);
  // "CV / Resume" (ASCII e) must stay absent; the design uses "Résumé".
  assert.doesNotMatch(text, /CV \/ Resume\b/);
  assert.doesNotMatch(text, /Open About/);
  assert.doesNotMatch(text, /Open Education/);
  assert.doesNotMatch(text, /Open Experience/);
  assert.doesNotMatch(text, /Open Digital Me/);
  assert.doesNotMatch(text, /Live system/);
  assert.doesNotMatch(text, /Sources → Reasoning → Artifact/);
  assert.doesNotMatch(text, /Problem Set 02\.pdf/);
  assert.doesNotMatch(text, /W8 A Concave-Functions\.pdf/);
  assert.doesNotMatch(text, /Profile notes and public context/);
  assert.doesNotMatch(text, /Cited answers, process replay/);
  assert.doesNotMatch(primaryNavHtml, /href="\/drafts"/);
  assert.doesNotMatch(text, /Yiping's Loom/);
  assert.doesNotMatch(text, /[\u3400-\u9fff]/);
  assert.doesNotMatch(text, /\b(?:panel|panels|pursuit|pursuits|weave|weaves)\b/i);
  assert.doesNotMatch(html, />\s*&nbsp;\s*</i);
});

test('HomeClient stays a static profile surface without operational plumbing', () => {
  const source = fs.readFileSync(path.join(repoRoot, 'app/HomeClient.tsx'), 'utf8');

  assert.match(source, /<VerifiedDossierHome \/>/);
  assert.doesNotMatch(source, /VerifiedDossierAssetHome/);
  assert.doesNotMatch(source, /RECENT_RECORDS_KEY/);
  assert.doesNotMatch(source, /loadLatestRecentRecord/);
  assert.doesNotMatch(source, /subscribeLoomMirror/);
  // callNativeBridge('navigate', …) is the new-loom skeleton's capability
  // passthrough (pinned by new-loom-skeleton-contract.test.ts); a minimal
  // navigate bridge is consistent with a static profile surface.
  assert.doesNotMatch(source, /handleOpenSources/);
  assert.doesNotMatch(source, /handleOpenRecent/);
  assert.doesNotMatch(source, /loadPanelRecords/);
  assert.doesNotMatch(source, /loadPursuitRecords/);
  assert.doesNotMatch(source, /loadWeaveRecords/);
  assert.doesNotMatch(source, /PANEL_RECORDS_KEY/);
  assert.doesNotMatch(source, /PURSUIT_RECORDS_KEY/);
  assert.doesNotMatch(source, /WEAVE_RECORDS_KEY/);
  assert.doesNotMatch(source, /formatNativeActivitySummary/);
  assert.doesNotMatch(source, /formatHomepageActivitySummary/);
  assert.doesNotMatch(source, /activitySummary=/);
  assert.doesNotMatch(source, /ready=/);
});

test('white dashboard homepage is retired into the hybrid evidence cover design', () => {
  const homeSource = fs.readFileSync(
    path.join(repoRoot, 'components/verified-dossier/VerifiedDossierHome.tsx'),
    'utf8',
  );
  const dataSource = fs.readFileSync(
    path.join(repoRoot, 'lib/new-loom/verified-dossier-home.ts'),
    'utf8',
  );
  const cssSource = fs.readFileSync(path.join(repoRoot, 'app/globals.css'), 'utf8');
  const navCssSource = fs.readFileSync(
    path.join(repoRoot, 'components/verified-dossier/LoomGlobalNav.module.css'),
    'utf8',
  );

  assert.equal(
    fs.existsSync(path.join(repoRoot, 'components/verified-dossier/VerifiedDossierAssetHome.tsx')),
    false,
  );
  assert.equal(
    fs.existsSync(path.join(repoRoot, 'components/verified-dossier/AssetPrimitives.tsx')),
    false,
  );
  // The component is the Home v12 "ledger cover": a CoverAsset preview per
  // category, data-driven from the canonical presentation/course/workbench
  // models, and rendered under the isolated `.lcv-*` namespace.
  assert.match(homeSource, /CoverAsset/);
  assert.match(homeSource, /VERIFIED_DOSSIER_PRESENTATION_CATEGORIES/);
  assert.match(homeSource, /VERIFIED_DOSSIER_UNSW_COURSES/);
  assert.match(homeSource, /LoomGlobalNav/);
  // Digital Me preview now reuses the canonical Sources → Draft → Answer
  // workbench provenance steps, so the import is expected (was forbidden in v11).
  assert.match(homeSource, /VERIFIED_DOSSIER_WORKBENCH/);
  assert.match(homeSource, /lcv-shell/);
  assert.match(homeSource, /lcv-rail/);
  assert.match(homeSource, /lcv-ledger/);
  assert.match(homeSource, /lcv-row lcv-row--\$\{cat\.id\}/);
  assert.match(homeSource, /lcv-panel lcv-about/);
  assert.match(homeSource, /lcv-panel lcv-edu/);
  assert.match(homeSource, /lcv-exp__card/);
  assert.match(homeSource, /lcv-panel lcv-dm/);
  assert.match(homeSource, /lcv-link-icon--linkedin/);
  // The retired cover/asset-grid implementations must be gone from the component.
  assert.doesNotMatch(homeSource, /vd-hybrid-grid|vd-hybrid-covers/);
  assert.doesNotMatch(homeSource, /vd-cover-art/);
  assert.doesNotMatch(homeSource, /vd-cover-link/);
  assert.doesNotMatch(homeSource, /vd-home-optibook-shot/);
  assert.doesNotMatch(homeSource, /vd-portrait-cover/);
  assert.doesNotMatch(homeSource, /vd-proof-covers?/);
  assert.doesNotMatch(homeSource, /vd-personal-stage/);
  assert.doesNotMatch(homeSource, /vd-home-answer-canvas/);
  assert.doesNotMatch(homeSource, /SourcePreview/);
  assert.doesNotMatch(homeSource, /ProvenanceProof/);
  assert.doesNotMatch(homeSource, /vd-home-source-preview/);
  assert.doesNotMatch(homeSource, /vd-home-route-rail/);
  assert.doesNotMatch(homeSource, /VerifiedDossierAssetHome/);
  assert.doesNotMatch(homeSource, /AssetPrimitives/);
  assert.doesNotMatch(homeSource, /vd-home-asset-grid/);
  assert.doesNotMatch(dataSource, /VERIFIED_DOSSIER_ASSET_MANIFEST/);
  // CSS ships the isolated Home v12 ledger-cover block.
  assert.match(cssSource, /Home v12: ledger cover/);
  assert.match(cssSource, /\.lcv-shell/);
  assert.match(cssSource, /\.lcv-rail/);
  assert.match(cssSource, /\.lcv-row\b/);
  assert.match(cssSource, /body \.lcv \.lcv-dm__body\s*\{[^}]*grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)!important;/s);
  assert.match(cssSource, /body \.lcv \.lcv-dm__srcs\s*\{[^}]*grid-column:1 \/ -1!important;/s);
  assert.match(cssSource, /body \.lcv \.lcv-dm__table\s*\{[^}]*table-layout:fixed!important;/s);
  assert.match(cssSource, /\.lcv-link-icon--linkedin/);
  assert.match(navCssSource, /\.nav\b/);
  assert.match(navCssSource, /23\.25rem/);
  assert.match(navCssSource, /position:\s*fixed/);
  assert.doesNotMatch(navCssSource, /\.navHidden/);
  assert.match(navCssSource, /backdrop-filter:\s*blur\(38px\) saturate\(112%\) brightness\(1\.04\)/);
  assert.match(navCssSource, /radial-gradient/);
  assert.doesNotMatch(cssSource, /vd-home-asset-grid/);
  assert.doesNotMatch(cssSource, /vd-profile-asset/);
  assert.doesNotMatch(cssSource, /vd-document-preview-asset/);
  assert.doesNotMatch(cssSource, /vd-course-asset-row/);
  assert.doesNotMatch(cssSource, /vd-process-step-asset/);
});
