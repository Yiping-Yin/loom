import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import React from 'react';

import { VERIFIED_DOSSIER_HOME_COPY } from '../lib/new-loom/verified-dossier-home';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const cssModuleClassMap = new Proxy(
  {},
  { get: (_target, className) => (typeof className === 'string' ? className : '') },
) as Record<string, string>;
const cssModuleExports = { __esModule: true, default: cssModuleClassMap };

require.extensions['.css'] = (module: { exports: typeof cssModuleExports }) => {
  module.exports = cssModuleExports;
};

function read(relativePath: string) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function cssBlock(css: string, selector: string, requiredContent?: string) {
  const selectorPattern = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const selectorRegex = new RegExp(`${selectorPattern}\\s*\\{`, 'g');
  let match = selectorRegex.exec(css);

  while (match) {
    const start = match.index;
    const openBrace = css.indexOf('{', start);
    let depth = 0;
    for (let index = openBrace; index < css.length; index += 1) {
      if (css[index] === '{') depth += 1;
      if (css[index] === '}') {
        depth -= 1;
        if (depth === 0) {
          const block = css.slice(start, index + 1);
          if (!requiredContent || block.includes(requiredContent)) {
            return block;
          }
          match = selectorRegex.exec(css);
          break;
        }
      }
    }
    if (!match) assert.fail(`${selector} block should include ${requiredContent}`);
  }

  assert.fail(`${selector} block should include ${requiredContent}`);
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

test('home first paint frames Loom as an inspectable personal knowledge identity', () => {
  const html = renderHomeClientHtml();
  const primaryNavHtml = globalNavHtml(html);

  assert.match(html, /Yiping Yin/);
  assert.match(html, /🇨🇳 Wuhan/);
  assert.match(html, /🇦🇺 Sydney/);
  assert.match(html, /Quant T\/R/);
  assert.match(html, /AI Founder/);
  // Home v12 ledger cover: an inspectable identity rail beside a numbered
  // evidence ledger, every row carrying a verified-source pill and a
  // View-details link to its own destination.
  assert.match(html, /<main class="vd-home lcv" aria-labelledby="verified-dossier-title">/);
  assert.match(html, /href="\/loom" aria-label="Open Loom product"/);
  assert.match(html, /class="lcv-shell"/);
  assert.match(html, /class="lcv-rail"/);
  assert.match(html, /class="lcv-ledger"/);
  assert.equal((html.match(/class="lcv-row lcv-row--/g) ?? []).length, 3);
  assert.match(html, /class="lcv-row lcv-row--about"/);
  assert.match(html, /class="lcv-row lcv-row--education"/);
  assert.match(html, /class="lcv-row lcv-row--experience"/);
  assert.equal((html.match(/class="lcv-row__num"/g) ?? []).length, 3);
  // The whole row is the link to its category — no separate "View details" element.
  assert.doesNotMatch(html, /class="lcv-view"/);
  assert.equal((html.match(/<a class="lcv-row lcv-row--[a-z-]+" href="/g) ?? []).length, 3);
  assert.match(html, /<a class="lcv-row lcv-row--about" href="\/about"/);
  assert.match(html, /<a class="lcv-row lcv-row--education" href="\/education"/);
  assert.match(html, /<a class="lcv-row lcv-row--experience" href="\/experience"/);
  assert.equal((html.match(/class="lcv-verified"/g) ?? []).length, 5);
  assert.match(html, /class="lcv-photo"/);
  assert.match(html, /\/profile\/yiping-profile-photo\.png/);
  assert.equal((html.match(/class="lcv-link-icon/g) ?? []).length, 3);
  assert.match(html, /class="lcv-link-icon lcv-link-icon--linkedin"/);
  assert.match(html, /class="lcv-panel lcv-about"/);
  assert.match(html, /class="lcv-cv"/);
  assert.match(html, /class="lcv-panel lcv-edu"/);
  assert.match(html, /class="lcv-edu__logos"/);
  assert.match(html, /\/brand\/unsw\/unsw-crest\.png/);
  assert.match(html, /\/brand\/wqu\/wqu-logo\.svg/);
  assert.match(html, /\/brand\/quantnet\/quantnet-logo\.png/);
  assert.match(html, /\/brand\/claude\/claude-icon\.png/);
  assert.equal((html.match(/class="lcv-exp__card"/g) ?? []).length, 2);
  // The identity rail now lists real memberships (UNSW Sydney / WorldQuant /
  // QuantNet) as source-backed affiliations — legitimate profile content that
  // fills the rail instead of leaving it hollow below the pull-quote.
  assert.match(html, /class="lcv-members"/);
  assert.equal((html.match(/class="lcv-members__item/g) ?? []).length, 3);
  assert.match(html, /ECON 3202/);
  assert.match(html, /MATH 2991/);
  assert.match(html, /FINS 3666/);
  assert.match(html, /more courses/);
  assert.match(html, /Optiver/);
  // UNSW Research Assistant experience row uses its CV-backed role label.
  assert.match(html, /Research Assistant/);
  assert.doesNotMatch(html, /class="vd-home-answer-canvas"/);
  assert.doesNotMatch(html, /class="vd-home-proof-steps"/);
  assert.doesNotMatch(html, /class="vd-home-mini-table"/);
  assert.doesNotMatch(html, /class="vd-profile-card"/);
  assert.doesNotMatch(html, /class="vd-dossier"/);
  assert.doesNotMatch(html, /class="vd-resume-safe-preview"/);
  assert.doesNotMatch(html, /class="vd-evidence-row"/);
  assert.doesNotMatch(html, /class="vd-home-asset-grid"/);
  assert.doesNotMatch(html, /vd-home-asset-grid__/);
  assert.doesNotMatch(html, /class="vd-profile-asset"/);
  assert.doesNotMatch(html, /class="vd-institution-badge"/);
  assert.doesNotMatch(html, /class="vd-document-preview-asset\b/);
  assert.doesNotMatch(html, /class="vd-course-asset-row"/);
  assert.doesNotMatch(html, /class="vd-process-step-asset\b/);
  assert.doesNotMatch(html, /Market Lens/);
  assert.doesNotMatch(html, /Source memory/);
  assert.doesNotMatch(html, /NVDA/);
  assert.doesNotMatch(html, /SPY/);
  assert.doesNotMatch(html, /Python Foundations\.pdf/);
  assert.doesNotMatch(html, /\/verified-sources\/about\/cv-yiping-yin\.pdf/);
  assert.doesNotMatch(html, /Open Sources/);
  assert.doesNotMatch(html, /class="vd-avatar"/);
  assert.doesNotMatch(html, /vd-personal-stage__photo/);
  assert.doesNotMatch(html, /vd-home-source-preview/);
  assert.doesNotMatch(html, /vd-home-route-rail/);
  assert.doesNotMatch(html, /vd-home-provenance/);

  for (const label of ['Home', 'About', 'Education', 'Experience']) {
    assert.match(primaryNavHtml, new RegExp(`>${label}<`));
  }
  for (const menuLabel of ['Identity', 'Workspaces', 'Sources']) {
    assert.match(primaryNavHtml, new RegExp(`>${menuLabel}<`));
  }
  assert.match(primaryNavHtml, /href="\/sources"/);
  // Draft is no longer a peer workspace nav item — it lives inside Digital Me.
  assert.doesNotMatch(primaryNavHtml, /href="\/draft"/);
  assert.doesNotMatch(primaryNavHtml, /href="\/drafts"/);

  for (const label of [
    'About',
    'Education',
    'Experience',
  ]) {
    assert.match(html, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.doesNotMatch(html, /Built with Loom/);
  assert.doesNotMatch(html, /Loom trust layer/);
  assert.doesNotMatch(html, /Cited answer sample/);
  assert.doesNotMatch(html, /Loom is the underlying trust mechanism/);
  assert.doesNotMatch(html, /href="#loom-trust-layer"/);
  assert.doesNotMatch(html, /vd-loom-intro/);
  assert.doesNotMatch(html, /vd-proof-band/);
  assert.doesNotMatch(html, /vd-workbench-grid/);
  assert.doesNotMatch(html, /aria-label="Loom history"/);
  assert.doesNotMatch(html, /Verified source workspace/);
  assert.doesNotMatch(html, /Sources become cited work/);
  assert.doesNotMatch(html, />Evidence Portal</);
  assert.doesNotMatch(html, />Live system</);
  assert.doesNotMatch(html, /Sources → Reasoning → Artifact/);
  assert.doesNotMatch(html, /Problem Set 02\.pdf/);
  assert.doesNotMatch(html, /W8 A Concave-Functions\.pdf/);
  assert.doesNotMatch(html, /Source Dossier/);
  assert.doesNotMatch(html, /Ask this profile/);
  assert.doesNotMatch(html, /Ask a follow-up/);
  assert.doesNotMatch(html, /vd-loom-intro-link/);
  assert.doesNotMatch(html, /aria-label="Identity sidebar"/);
  assert.doesNotMatch(html, /id="cited-answer"/);
  assert.doesNotMatch(html, /One workspace for source material, one surface for writing from it\./);
  assert.doesNotMatch(html, /personal knowledge display platform/i);
  assert.doesNotMatch(html, /Recent progress|Product story|Process timeline|Output previews/);
  assert.doesNotMatch(html, /students, researchers, editors, and anyone/i);
  assert.doesNotMatch(html, /[\u3400-\u9fff]/);
  // The ledger cover owns the membership line and the source-of-truth footer.
  assert.match(html, /class="lcv-member">MEMBER SINCE APRIL 2024/);
  assert.match(html, /class="lcv-foot"/);
  assert.match(html, /LOOM — PERSONAL KNOWLEDGE, BACKED BY REAL SOURCES/);
  assert.match(html, /<a class="lcv-foot__all" href="\/sources">/);
});

test('verified dossier data contract keeps the approved short definition', () => {
  assert.equal(
    VERIFIED_DOSSIER_HOME_COPY.shortDefinition,
    'Explore the source-backed systems that define my knowledge, work, and Digital Me.',
  );
});

// Removed: 'personal positioning CSS keeps the Home cover visual and non-operational'
// — it pinned the retired .vd-home--cover cover CSS, removed as dead code (no
// component applies that class). The rendered-HTML guard that the dead class is never
// emitted remains in home-client-first-paint.

test('Sources Studio and Digital Me descriptions serve learning paths, resources, portfolio, and process work', () => {
  const productShell = read('lib/new-loom/product-shell.ts');

  assert.match(productShell, /learning paths/i);
  assert.match(productShell, /resources/i);
  assert.doesNotMatch(productShell, /one workspace/i);
});

test('visible support surfaces use approved personal-identity and local-app positioning', () => {
  const about = read('app/about/AboutClient.tsx');
  const aboutCss = read('app/about/AboutClient.module.css');
  const verifiedDossierData = read('lib/new-loom/verified-dossier-home.ts');
  const help = read('app/help/page.tsx');
  const loomRoute = read('app/loom/page.tsx');
  const productHistory = [
    read('app/product-history/page.tsx'),
    read('components/product-history/ProductHistoryPage.tsx'),
  ].join('\n');
  const layout = read('app/layout.tsx');
  const productHistoryCss = read('components/product-history/HistoryDossier.module.css');
  const globalsCss = read('app/globals.css');
  const fontsCss = read('app/fonts.css');
  const globalNav = read('components/verified-dossier/LoomGlobalNav.tsx');
  const globalNavCss = read('components/verified-dossier/LoomGlobalNav.module.css');
  const supportCss = read('app/loom-support-page.module.css');
  const systemClient = read('app/SystemClient.tsx');
  const designCanon = read('docs/design/CURRENT_DESIGN_CANON.md');
  const visualSpec = read('docs/superpowers/specs/2026-06-11-loom-visual-system-design.md');
  const supportClients = [
    read('app/connections/ConnectionsClient.tsx'),
    read('app/SystemClient.tsx'),
    read('app/discipline/page.tsx'),
  ].join('\n');
  const privacy = read('public/privacy.html');
  const support = read('public/support.html');

  assert.match(help, /LoomGlobalNav/);
  assert.match(help, /ariaLabel="Help navigation"/);
  assert.doesNotMatch(help, /LoomSupportNav|className="vd-nav"|className='vd-nav'/);

  assert.match(about, /personal knowledge identity platform/i);
  assert.match(about, /backed by sources/i);
  assert.match(about, /readable by people/i);
  assert.match(about, /usable by Digital Me/i);
  assert.match(about, /Proof/);
  assert.match(about, /about-doc/);
  assert.match(about, /\/verified-sources\/about\/cv-yiping-yin\.pdf/);
  assert.match(verifiedDossierData, /About me page\.docx/);
  assert.match(about, /UNSW, WQU, QuantNet, and Claude learning evidence/);
  assert.match(about, /usable by Digital Me/);
  assert.match(about, /Product story/i);
  assert.match(about, /\/product-history/);
  assert.match(about, /import \{ ArrowRight, ArrowUpRight \} from 'lucide-react'/);
  assert.match(about, /className=\{styles\.externalLinkIcon\}/);
  assert.match(about, /className=\{styles\.historyLinkIcon\}/);
  assert.doesNotMatch(about, />↗<\/span>/);
  assert.match(aboutCss, /--about-signature:\s*var\(--signature-cyan\)/);
  assert.match(aboutCss, /--about-signature-hi:\s*var\(--signature-cyan-hi\)/);
  assert.match(cssBlock(aboutCss, '.externalLinkIcon', 'width'), /width:\s*0\.82rem/);
  assert.match(cssBlock(aboutCss, '.profileLinks a:hover .externalLinkIcon'), /translate\(1px,\s*-1px\)/);
  assert.match(cssBlock(aboutCss, '.historyLinkIcon'), /width:\s*0\.88rem/);
  assert.match(cssBlock(aboutCss, '.historyLink:hover .historyLinkIcon'), /translateX\(1px\)/);
  assert.doesNotMatch(aboutCss, /\.historyLink::after[\s\S]*content:\s*"→"/);
  assert.doesNotMatch(aboutCss, /--about-gold:/);
  assert.doesNotMatch(aboutCss, /--about-gold2:/);
  assert.match(
    aboutCss,
    /@media\s*\(max-width:\s*640px\)\s*\{[\s\S]*\.profileRail\s*\{[^}]*grid-template-columns:\s*minmax\(6\.4rem,\s*0\.44fr\)\s*minmax\(0,\s*1fr\)/,
  );
  assert.match(
    aboutCss,
    /@media\s*\(max-width:\s*640px\)\s*\{[\s\S]*\.resumeObject\s*\{[^}]*width:\s*min\(100%,\s*14\.5rem\)/,
  );
  assert.match(
    aboutCss,
    /@media\s*\(max-width:\s*640px\)\s*\{[\s\S]*\.sourceList\s*\{[^}]*align-content:\s*start/,
  );
  assert.doesNotMatch(about, /Yiping's Loom/);
  assert.doesNotMatch(about, /[\u3400-\u9fff]/);

  assert.match(help, /context-to-form workspace/i);
  assert.match(help, /Sources resolve real material/i);
  assert.match(help, /\/about/);

  assert.match(loomRoute, /Loom · Product System/);
  assert.doesNotMatch(loomRoute, /Loom · History/);

  assert.match(productHistory, /<h1 id="history-title">History<\/h1>/);
  assert.doesNotMatch(productHistory, /History\./);
  assert.doesNotMatch(productHistory, /Loom archive/);
  assert.doesNotMatch(productHistory, /Early studies, original language/);
  assert.match(productHistory, /Source-backed self\. Living archive\./i);
  assert.match(productHistory, /Library \/ Eyes \/ Memory/i);
  // ---- New flat-composite "History" hero (Claude Design handoff) ----------
  // The hero is a single flat composite-photo plate (history-hero.webp) with a
  // CENTERED, upright Cormorant masthead + a "2024 — PRESENT" eyebrow + a cyan
  // timeline node. The live moon / astronaut-helmet / breathing-visor "First
  // Contact" stack was retired; behaviour now lives in a client island.
  assert.match(productHistory, /HistoryRuntime/);
  assert.match(productHistory, /2024 — PRESENT/);
  assert.match(productHistory, /comet-clean\.png/);
  assert.match(productHistoryCss, /\.heroPlate[\s\S]*?history-hero\.webp/);
  assert.match(productHistoryCss, /\.heroGrid\s*\{[^}]*text-align:\s*center/s);
  assert.match(productHistoryCss, /\.heroGrid h1\s*\{[^}]*font-weight:\s*600/s);
  assert.match(productHistoryCss, /\.heroGrid h1\s*\{[^}]*font-style:\s*normal/s);
  // The retired First Contact cluster must be gone from the History surface.
  assert.doesNotMatch(productHistory, /first-contact/);
  assert.doesNotMatch(productHistory, /<Helmet \/>|<VisorText \/>|<FirstContact \/>/);
  assert.doesNotMatch(productHistory, /styles\.heroLead|HERO_STATEMENT/);
  // The retired monogram markup + annotation labels stay gone (page + CSS).
  assert.doesNotMatch(productHistory, /Touch or focus to read the Loom mark/i);
  assert.doesNotMatch(productHistory, /Source atlas/i);
  assert.doesNotMatch(productHistory, /Weaver gaze/i);
  assert.doesNotMatch(productHistory, /Woven pattern/i);
  assert.doesNotMatch(productHistory, /studyMark|markAnnotations|studyEyes|studyLetter|studyBlueprint/);
  assert.doesNotMatch(productHistoryCss, /\.studyMark|\.markAnnotations|\.studyEyes|\.studyLetter|\.studyBlueprint/);
  assert.doesNotMatch(productHistoryCss, /helmetShell|helmetChin|helmetRim/);
  // ---- New narrative sections: Origins / Weave / "became" / Footer / Earth -
  assert.match(productHistory, /Before a system, a room for slow reading\./);
  assert.match(productHistory, /Three threads, one figure\./);
  assert.match(productHistory, /What Loom became/);
  assert.match(productHistory, /Interface recedes\. Evidence remains\./);
  assert.match(productHistory, /every source kept/);
  assert.doesNotMatch(productHistory, /All threads respected/);
  assert.match(productHistory, /The Earth in the visor/);
  assert.match(productHistory, /Everything you’ve read, in orbit\./);
  // ---- Display faces are self-hosted via @font-face (offline-safe), NOT
  // next/font/google — the wordmark face stays exposed only as --font-wordmark.
  assert.doesNotMatch(layout, /next\/font\/google/);
  assert.doesNotMatch(layout, /Fraunces\(/);
  assert.match(globalsCss, /--font-wordmark:\s*"Fraunces",\s*"Cormorant Garamond"/);
  assert.match(globalsCss, /@import '\.\/fonts\.css'/);
  assert.match(fontsCss, /@font-face/);
  assert.match(fontsCss, /font-family:\s*'Cormorant Garamond'/);
  assert.match(fontsCss, /font-family:\s*'Fraunces'/);
  assert.match(fontsCss, /font-family:\s*'JetBrains Mono'/);
  assert.doesNotMatch(fontsCss, /next\/font/);
  assert.match(productHistory, /ArrowUpRight/);
  assert.doesNotMatch(productHistory, /-&gt;|View archive\s*<span aria-hidden="true">/);
  assert.doesNotMatch(productHistory, /Past material\./i);
  assert.doesNotMatch(productHistory, /Present judgment\./i);
  assert.doesNotMatch(productHistory, /Future self\./i);
  assert.match(productHistory, /Human \/ System \/ AI/i);
  assert.match(productHistory, /Sees\. Compares\. Chooses\./i);
  assert.match(productHistory, /Anchors\. Orders\. Preserves\./i);
  assert.match(productHistory, /Infers\. Drafts\. Cites\./i);
  assert.match(productHistory, /Source is sacred/i);
  assert.match(productHistory, /Personal growth loop/i);
  assert.match(productHistory, /Source/);
  assert.match(productHistory, /Attention/);
  assert.match(productHistory, /Question/);
  assert.match(productHistory, /Judgment/);
  assert.match(productHistory, /Practice/);
  assert.match(productHistory, /Studio/);
  assert.match(productHistory, /Output/);
  assert.match(productHistory, /Identity/);
  assert.match(productHistory, /Next source/);
  assert.match(productHistory, /text:\s*'Add files\.'/);
  assert.match(productHistory, /text:\s*'Mark passages\.'/);
  assert.match(productHistory, /text:\s*'Write with references\.'/);
  assert.match(productHistory, /<p>\{step\.text\}<\/p>/);
  assert.doesNotMatch(productHistory, /Collect files\./);
  assert.match(productHistory, /Five product layers/i);
  assert.match(productHistory, /Public identity surface/);
  assert.match(productHistory, /Evidence and source layer/);
  assert.match(productHistory, /Growth and capability layer/);
  assert.match(productHistory, /Cognitive structuring layer/);
  assert.match(productHistory, /AI and production layer/);
  assert.match(productHistory, /Functional reuse and innovation/i);
  assert.match(productHistory, /source shelf/);
  assert.match(productHistory, /citation-backed Digital Me answers/i);
  assert.match(productHistory, /process replay and output production/i);
  assert.match(productHistory, /Product evolution/i);
  assert.match(productHistory, /Source material, not skin/i);
  assert.match(productHistory, /Real evidence assets/i);
  assert.match(productHistoryCss, /--history-accent:\s*var\(--signature-cyan\)/);
  assert.match(productHistoryCss, /--history-accent-dim:\s*var\(--signature-cyan-hi\)/);
  assert.doesNotMatch(productHistoryCss, /--history-accent:\s*var\(--gold\)/);
  assert.doesNotMatch(productHistoryCss, /var\(--gold-hi\)/);
  assert.match(productHistoryCss, /\.page :global\(\.loom-global-nav-slot\)\s*\{[^}]*min-height:\s*0 !important/s);
  assert.doesNotMatch(productHistoryCss, /:global\(\.loom-global-nav\)\s*\{[^}]*29rem/s);
  assert.doesNotMatch(productHistoryCss, /:global\(\.loom-global-nav__brand\)\s*\{/);
  assert.doesNotMatch(productHistoryCss, /:global\(\.loom-global-nav__icon(?:-orb)?\)\s*\{/);
  assert.doesNotMatch(productHistoryCss, /:global\(\.loom-global-nav__menu summary\)\s*\{/);
  assert.match(productHistoryCss, /\.heroGrid h1\s*\{[^}]*font-size:\s*clamp\(4\.4rem,\s*8\.6vw,\s*9\.2rem\)/s);
  assert.match(productHistory, /\/loom\/history\/early-version\/01-reading-thinking-environment\.jpg/);
  assert.match(productHistory, /\/loom\/history\/early-version\/02-name-mark-library-eyes-memory\.jpg/);
  assert.match(productHistory, /\/loom\/history\/early-version\/05-weaver-vocabulary\.jpg/);
  assert.match(productHistory, /\/loom\/history\/early-version\/08-paper-reading-source\.jpg/);
  assert.match(productHistory, /\/loom\/history\/evolution\/2026-04-17-wordmark-structure\.png/);
  assert.match(productHistory, /\/loom\/history\/evolution\/2026-04-24-frontispiece-vellum\.jpg/);
  assert.match(productHistory, /\/loom\/history\/evolution\/2026-06-02-profile-home\.png/);
  assert.match(productHistory, /\/loom\/history\/evolution\/2026-06-03-source-dossier\.png/);
  assert.match(productHistory, /\/loom\/history\/evolution\/2026-06-04-evidence-workbench\.png/);
  assert.match(productHistory, /\/loom\/history\/evolution\/2026-06-04-current-home\.png/);
  assert.match(productHistory, /LoomGlobalNav/);
  assert.match(productHistory, /brandCurrent/);
  assert.match(globalNav, /import \{ Search \} from 'lucide-react'/);
  assert.match(globalNav, /Search Loom knowledge/);
  assert.match(globalNav, /action="\/sources"/);
  assert.match(globalNav, /name="search"/);
  assert.match(globalNav, /placeholder="Search sources"/);
  assert.match(globalNav, /setSearchOpen/);
  assert.match(globalNav, /flushSync/);
  assert.match(globalNav, /searchOpenRef/);
  assert.match(globalNav, /onPointerDown=\{onSearchButtonPointerDown\}/);
  assert.match(globalNav, /function onSearchButtonClick\(event: React\.MouseEvent<HTMLButtonElement>\)/);
  assert.match(globalNav, /event\.preventDefault\(\);\s*if \(!searchOpenRef\.current\)/);
  assert.doesNotMatch(globalNav, /function onSearchFormPointerDown\(/);
  assert.doesNotMatch(globalNav, /onPointerDown=\{onSearchFormPointerDown\}/);
  assert.doesNotMatch(globalNav, /function onSearchFormPointerDown\([\s\S]*?event\.preventDefault\(\)/);
  assert.doesNotMatch(globalNav, /onMouseDown=\{\(event\) => event\.preventDefault\(\)\}/);
  assert.doesNotMatch(globalNav, /function onSearchButtonPointerDown\(event: React\.PointerEvent<HTMLButtonElement>\)[\s\S]*?event\.preventDefault\(\)/);
  assert.match(globalNav, /onSearchSubmit/);
  assert.match(globalNav, /inputMode="search"/);
  assert.match(globalNav, /enterKeyHint="search"/);
  assert.match(globalNav, /Open Loom menu/);
  assert.match(globalNav, /\/brand\/loom_lunar_orb\.png/);
  assert.match(globalNav, /requestAnimationFrame/);
  assert.match(globalNav, /const LOOM_WORKSPACE_NAV = \[/);
  assert.match(globalNav, /\{ label: 'Sources', href: '\/sources' \}/);
  assert.doesNotMatch(globalNav, /label: 'Draft'/);
  assert.match(globalNav, />\s*Identity\s*</);
  assert.match(globalNav, />\s*Workspaces\s*</);
  assert.match(globalNavCss, /position:\s*fixed/);
  assert.match(globalNavCss, /23\.25rem/);
  assert.match(cssBlock(globalNavCss, '.slot', '--loom-nav-clearance'), /z-index:\s*1000/);
  assert.match(cssBlock(globalNavCss, '.slot', '--loom-nav-clearance'), /min-height:\s*var\(--loom-nav-clearance\)/);
  assert.match(cssBlock(globalNavCss, '.nav', 'border-radius: 999px'), /grid-template-columns:\s*minmax\(2\.45rem,\s*1fr\)\s*auto\s*minmax\(2\.45rem,\s*1fr\)/);
  assert.match(
    globalNavCss,
    /\.nav \.brand,\s*\.nav \.brand:visited\s*\{[^}]*color:\s*rgba\(240,\s*243,\s*244,\s*0\.9\)/s,
  );
  // The duplicated `.loom-global-nav*` clone was removed from globals.css — the
  // CSS module (imported in layout.tsx) is the single source of truth for the
  // nav, so the brand colour is asserted against the module copy above only.
  // (.navHidden removed — the nav no longer hides on scroll; it is always present.)
  assert.match(cssBlock(globalNavCss, '.searchInput'), /caret-color:\s*var\(--signature-cyan-hi,\s*#8AF7E6\)/);
  assert.match(cssBlock(globalNavCss, '.searchInput::placeholder'), /rgba\(232,\s*236,\s*238,\s*0\.68\)/);
  assert.match(cssBlock(globalNavCss, '.icon'), /object-fit:\s*cover/);
  assert.match(cssBlock(globalNavCss, '.icon', 'object-position'), /animation:\s*loomLunarSurfaceDrift 88s/);
  assert.match(cssBlock(globalNavCss, '.iconOrb', 'perspective'), /transform-style:\s*preserve-3d/);
  assert.match(globalNavCss, /@keyframes loomLunarTerminatorBreath/);
  assert.match(globalNavCss, /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*\.icon,[\s\S]*animation:\s*none/);
  assert.match(cssBlock(globalNavCss, '.menuPanel'), /z-index:\s*1003/);
  assert.match(cssBlock(globalNavCss, '.menuPanel'), /width:\s*min\(18\.65rem,\s*calc\(100vw - 2rem\)\)/);
  assert.match(cssBlock(globalNavCss, '.menuPanel'), /grid-template-columns:\s*1fr/);
  assert.match(cssBlock(globalNavCss, '.menuGroupLabel'), /letter-spacing:\s*0\.16em/);
  assert.match(cssBlock(globalNavCss, '.menuGroupLinks'), /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(globalNavCss, /@media \(max-width: 680px\)[\s\S]*\.menuPanel\s*{[^}]*width:\s*min\(calc\(100vw - 2rem\),\s*18\.65rem\);[^}]*grid-template-columns:\s*1fr;/s);
  assert.match(cssBlock(productHistoryCss, '.hero', 'min-height: max(48rem, 100svh)'), /contain:\s*paint/);
  assert.match(cssBlock(productHistoryCss, '.hero', 'min-height: max(48rem, 100svh)'), /overflow:\s*clip/);
  assert.match(systemClient, /This page moved into Loom history/);
  assert.match(systemClient, /<details className=\{styles\.archiveDetails\}>/);
  assert.doesNotMatch(systemClient, /<details className=\{styles\.archiveDetails\} open/);
  assert.match(globalsCss, /--signature-cyan:\s*#4BC5DE/);
  assert.match(globalsCss, /--signature-cyan-hi:\s*#8AF7E6/);
  assert.match(supportCss, /--support-main-padding:/);
  assert.match(supportCss, /--signature:\s*var\(--signature-cyan\)/);
  assert.match(supportCss, /--signature-hi:\s*var\(--signature-cyan-hi\)/);
  assert.match(supportCss, /--accent:\s*var\(--text-2\)/);
  assert.match(supportCss, /--accent-info:\s*var\(--cyan\)/);
  assert.match(supportCss, /background:\s*var\(--signature\)/);
  assert.doesNotMatch(supportCss, /rgba\(75,\s*197,\s*222,\s*0\.14\)/);
  assert.match(designCanon, /Signature cyan `#4BC5DE`/);
  assert.match(designCanon, /Data cyan `#6CE7F2`/);
  assert.match(visualSpec, /Signature cyan `--accent #4BC5DE`/);
  assert.match(visualSpec, /Data cyan `--cyan #6CE7F2`/);
  assert.doesNotMatch(visualSpec, /Champagne gold `--gold #C8A24A`/);
  assert.doesNotMatch(supportClients, /padding:\s*'var\(--support-main-padding\)'/);
  for (const selector of [
    '.breathBar',
    '.yearChart',
    '.monthBar',
    '.connectionsSection',
    '.connectionMetaRow',
    '.refusalList',
    '.archiveStepLink',
  ]) {
    assert.match(supportCss, new RegExp(`${selector.replace('.', '\\.')}\\s*\\{`));
  }
  assert.doesNotMatch(productHistory, /styles\.navSearch/);
  assert.doesNotMatch(productHistory, /styles\.brandLockup/);
  assert.doesNotMatch(productHistory, /styles\.brandIcon/);
  assert.doesNotMatch(productHistory, /styles\.navLinks/);
  assert.doesNotMatch(productHistory, /styles\.navAvatar/);
  assert.doesNotMatch(productHistory, /VERIFIED_DOSSIER_PROFILE/);
  assert.doesNotMatch(productHistory, /generic SaaS landing page/i);
  assert.doesNotMatch(productHistory, /always-visible AI assistant/i);

  assert.match(privacy, /local Mac app for personal reading and thinking/i);
  assert.match(privacy, /everything stays on your Mac/i);
  assert.match(support, /local Mac app for reading and thinking/i);
  // The retired "personal knowledge display platform" line must not leak onto
  // live support surfaces — but /product-history deliberately preserves it as
  // sediment in the tagline lineage, so it is excluded from this guard.
  assert.doesNotMatch([help, privacy, support].join('\n'), /personal knowledge display platform/i);
  assert.match(productHistory, /personal knowledge display platform/i);
});

test('Loom product history evolution assets are curated under Loom folders', () => {
  const assetNames = [
    '2026-04-17-wordmark-structure.png',
    '2026-04-24-frontispiece-vellum.jpg',
    '2026-06-02-profile-home.png',
    '2026-06-03-source-dossier.png',
    '2026-06-04-evidence-workbench.png',
    '2026-06-04-current-home.png',
  ];

  for (const assetName of assetNames) {
    assert.ok(
      fs.existsSync(path.join(repoRoot, 'public/loom/history/evolution', assetName)),
      `${assetName} should have a public Loom history copy`,
    );
    assert.ok(
      fs.existsSync(path.join(repoRoot, 'resources/loom-history/evolution', assetName)),
      `${assetName} should have a source Loom history copy`,
    );
  }

  assert.ok(fs.existsSync(path.join(repoRoot, 'resources/loom-history/evolution/README.md')));
});

test('canonical docs no longer present Loom as a generic public product', () => {
  const readme = read('README.md');
  const productDefinition = read('docs/canon/LOOM.md');
  const productRules = read('docs/canon/LOOM_RULES.md');
  const appStoreCopy = read('docs/app-store-copy.md');
  const canonicalDocs = [readme, productDefinition, productRules].join('\n');

  assert.match(readme, /local context-to-form workspace/i);
  assert.match(readme, /Studio documents/i);
  assert.match(readme, /Digital Me/i);
  assert.match(productDefinition, /local[\s>]+context-to-form workspace/i);
  assert.match(productDefinition, /source-backed forms/i);
  assert.match(productDefinition, /Yiping's Loom is[\s>]+the first reference instance/i);
  assert.match(productRules, /local context-to-form workspace/i);
  assert.match(productRules, /Digital Me that answers from the real archive/i);
  assert.match(productRules, /reference instance, not the product boundary/i);
  assert.match(appStoreCopy, /Canonical metadata for the first Mac App Store submission/i);
  assert.match(appStoreCopy, /Your files stay on your Mac/i);

  for (const retired of [
    /personal knowledge display platform/i,
    /Collect, organize, draft/i,
    /source-bound knowledge display platform/i,
  ]) {
    assert.doesNotMatch(canonicalDocs, retired);
  }
});
