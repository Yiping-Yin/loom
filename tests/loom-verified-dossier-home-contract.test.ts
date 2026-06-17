import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, relative } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import React from 'react';

const cssModuleClassMap = new Proxy(
  {},
  { get: (_target, className) => (typeof className === 'string' ? className : '') },
) as Record<string, string>;
const cssModuleExports = { __esModule: true, default: cssModuleClassMap };

require.extensions['.css'] = (module: { exports: typeof cssModuleExports }) => {
  module.exports = cssModuleExports;
};

import {
  VERIFIED_DOSSIER_AI_PROMPT,
  VERIFIED_DOSSIER_ARTIFACTS,
  VERIFIED_DOSSIER_ARTIFACTS_BY_ID,
  VERIFIED_DOSSIER_EXPERIENCE_ENTRIES,
  VERIFIED_DOSSIER_HISTORY,
  VERIFIED_DOSSIER_HOME_COPY,
  VERIFIED_DOSSIER_LOOM_INTRO,
  VERIFIED_DOSSIER_PRESENTATION_CATEGORIES,
  VERIFIED_DOSSIER_PROFILE,
  VERIFIED_DOSSIER_SECTIONS,
  VERIFIED_DOSSIER_TOP_NAV,
  VERIFIED_DOSSIER_UNSW_COURSES,
  VERIFIED_DOSSIER_WORKBENCH,
  resolveVerifiedDossierArtifact,
  type VerifiedDossierExperienceEntry,
} from '../lib/new-loom/verified-dossier-home';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const TEXT_ASSET_EXTENSIONS = new Set(['.css', '.html', '.js', '.json', '.svg', '.txt', '.xml']);

function collectFiles(root: string): string[] {
  const entries = readdirSync(root);
  const files: string[] = [];

  for (const entry of entries) {
    const path = join(root, entry);
    const stat = statSync(path);

    if (stat.isDirectory()) {
      files.push(...collectFiles(path));
    } else {
      files.push(path);
    }
  }

  return files;
}

const SAFE_INTERNAL_HREFS = new Set([
  '/',
  '/about',
  '/education',
  '/experience',
  '/digital-me',
  '/knowledge',
  '/drafts',
  '/knowledge/unsw',
  '/knowledge/quantnet',
  '/knowledge/wqu',
  '/knowledge/claude',
  '/knowledge/unsw/econ3202',
  '/knowledge/unsw/econ3202/ps02',
  '/knowledge/quantnet/quantnet-online-cpp-course',
  '/knowledge/quantnet/python-foundations',
  '/knowledge/wqu/wqu-index',
  '/knowledge/claude/claude-certificate',
  '/product-history',
  // Real evidence documents served from public/ and the Optibook replica
  // build that a later integration step copies into public/optibook/.
  '/verified-sources/about/cv-yiping-yin.pdf',
  '/optibook/index.html',
]);

function assertSafeHref(href: string) {
  if (href.startsWith('https://')) {
    return;
  }

  assert.ok(SAFE_INTERNAL_HREFS.has(href), `${href} must be a safe internal app surface`);
}

test('verified dossier home data preserves approved evidence workbench definition', () => {
  assert.equal(VERIFIED_DOSSIER_HOME_COPY.headline, 'Yiping Yin');
  assert.equal(
    VERIFIED_DOSSIER_HOME_COPY.body,
    'Quant T/R | AI Founder',
  );
  assert.match(
    VERIFIED_DOSSIER_HOME_COPY.shortDefinition,
    /source-backed systems/,
  );
  assert.notEqual(VERIFIED_DOSSIER_HOME_COPY.headline, 'Sources become cited work');
  assert.notEqual(VERIFIED_DOSSIER_HOME_COPY.body, 'Verified source workspace');
  assert.equal(VERIFIED_DOSSIER_WORKBENCH.activeSectionId, 'unsw');
  assert.deepEqual(VERIFIED_DOSSIER_WORKBENCH.activeArtifactIds, [
    'econ-ps2',
    'econ-slides',
    'econ-tutorial',
    'econ-notes',
  ]);
  assert.deepEqual(
    VERIFIED_DOSSIER_WORKBENCH.provenanceSteps.map((step) => step.title),
    ['Sources', 'Draft', 'Answer'],
  );
  assert.ok(VERIFIED_DOSSIER_WORKBENCH.sourceGraph.nodes.length >= 4);
  assert.ok(VERIFIED_DOSSIER_WORKBENCH.sourceGraph.edges.length >= 3);
});

test('verified dossier home keeps canonical navigation and profile identity', () => {
  assert.deepEqual(
    VERIFIED_DOSSIER_TOP_NAV.map((item) => item.label),
    ['Home', 'About', 'Education', 'Experience', 'Digital Me'],
  );
  assert.deepEqual(
    VERIFIED_DOSSIER_TOP_NAV.map((item) => item.href),
    ['/', '/about', '/education', '/experience', '/digital-me'],
  );
  assert.ok(!VERIFIED_DOSSIER_TOP_NAV.some((item) => item.label === 'Sources'));
  assert.ok(!VERIFIED_DOSSIER_TOP_NAV.some((item) => item.label === 'UNSW'));
  assert.ok(!VERIFIED_DOSSIER_TOP_NAV.some((item) => item.label === 'Draft'));
  assert.ok(!VERIFIED_DOSSIER_TOP_NAV.some((item) => item.href === '/drafts'));
  assert.equal(VERIFIED_DOSSIER_PROFILE.name, 'Yiping Yin');
  assert.equal(VERIFIED_DOSSIER_PROFILE.location, '🇨🇳 Wuhan | 🇦🇺 Sydney');
  assert.ok(VERIFIED_DOSSIER_PROFILE.links.some((link) => link.label === 'LinkedIn'));
  assert.ok(VERIFIED_DOSSIER_PROFILE.memberships.some((item) => item.label === 'UNSW Sydney'));
});

test('personal IA routes exist as importable app pages', async () => {
  for (const routePage of [
    'app/education/page.tsx',
    'app/experience/page.tsx',
    'app/digital-me/page.tsx',
  ]) {
    assert.ok(existsSync(join(repoRoot, routePage)), `${routePage} should exist`);
  }

  const [educationPage, experiencePage, digitalMePage] = await Promise.all([
    import('../app/education/page'),
    import('../app/experience/page'),
    import('../app/digital-me/page'),
  ]);

  assert.equal(typeof educationPage.default, 'function');
  assert.equal(typeof experiencePage.default, 'function');
  assert.equal(typeof digitalMePage.default, 'function');
});

test('verified dossier home explains Loom as the underlying trust mechanism', () => {
  assert.equal(VERIFIED_DOSSIER_LOOM_INTRO.title, 'Built with Loom');
  assert.match(VERIFIED_DOSSIER_LOOM_INTRO.summary, /underlying trust mechanism/i);
  assert.deepEqual(
    VERIFIED_DOSSIER_LOOM_INTRO.steps.map((step) => step.label),
    ['Sources', 'Draft', 'Digital Me'],
  );
  assert.equal(VERIFIED_DOSSIER_LOOM_INTRO.blocking, false);
});

test('verified dossier home groups source shelves into presentation categories', () => {
  const sectionIds = new Set(VERIFIED_DOSSIER_SECTIONS.map((section) => section.id));
  const artifactIds = new Set(VERIFIED_DOSSIER_ARTIFACTS.map((artifact) => artifact.id));

  assert.deepEqual(
    VERIFIED_DOSSIER_PRESENTATION_CATEGORIES.map((category) => category.label),
    ['About', 'Education', 'Experience', 'Digital Me'],
  );
  assert.deepEqual(
    VERIFIED_DOSSIER_TOP_NAV.filter((item) => item.label !== 'Home').map(
      (item) => [item.label, item.href],
    ),
    VERIFIED_DOSSIER_PRESENTATION_CATEGORIES.map((category) => [category.label, category.href]),
  );

  for (const category of VERIFIED_DOSSIER_PRESENTATION_CATEGORIES) {
    assertSafeHref(category.href);
    assert.ok(category.sourceSectionIds.length > 0, `${category.id} should map to source sections`);
    assert.ok(category.artifactIds.length > 0, `${category.id} should map to artifacts`);

    for (const sectionId of category.sourceSectionIds) {
      assert.ok(
        sectionIds.has(sectionId),
        `${category.id} references missing source section ${sectionId}`,
      );
    }

    for (const artifactId of category.artifactIds) {
      assert.ok(
        artifactIds.has(artifactId),
        `${category.id} references missing artifact ${artifactId}`,
      );
      assert.equal(resolveVerifiedDossierArtifact(artifactId).id, artifactId);
    }
  }

  const education = VERIFIED_DOSSIER_PRESENTATION_CATEGORIES.find(
    (category) => category.id === 'education',
  );
  assert.ok(education, 'Education presentation category should exist');
  for (const sourceSectionId of ['unsw', 'quantnet', 'wqu', 'claude'] as const) {
    assert.ok(
      education.sourceSectionIds.includes(sourceSectionId),
      `Education should include ${sourceSectionId} source section`,
    );
  }

  const digitalMe = VERIFIED_DOSSIER_PRESENTATION_CATEGORIES.find(
    (category) => category.id === 'digital-me',
  );
  assert.ok(digitalMe, 'Digital Me presentation category should exist');
  assert.deepEqual(digitalMe.foundationCategoryIds, ['about', 'education', 'experience']);
  assert.ok(digitalMe.capabilities.some((capability) => /citation/i.test(capability)));
  assert.ok(digitalMe.capabilities.some((capability) => /process/i.test(capability)));
});

test('presentation categories expose real homepage visual assets', () => {
  for (const category of VERIFIED_DOSSIER_PRESENTATION_CATEGORIES) {
    assert.ok(category.visualAsset, `${category.id} should expose a visual asset`);
    assert.match(category.visualAsset.label, /\S/);
    assert.match(category.visualAsset.caption, /\S/);

    const assetPaths = [
      ...('src' in category.visualAsset ? [category.visualAsset.src] : []),
      ...('srcs' in category.visualAsset ? category.visualAsset.srcs : []),
    ]
      .filter(Boolean)
      .map(String);

    assert.ok(assetPaths.length > 0, `${category.id} should bind to at least one image or logo`);

    for (const src of assetPaths) {
      assert.match(src, /^\//, `${src} should be a public asset path`);
      assert.ok(existsSync(join(repoRoot, 'public', src)), `${src} should exist under public/`);
    }
  }
});

test('Digital Me is based on About, Education, and Experience layers', async () => {
  const digitalMe = VERIFIED_DOSSIER_PRESENTATION_CATEGORIES.find(
    (category) => category.id === 'digital-me',
  );
  assert.ok(digitalMe, 'Digital Me presentation category should exist');
  assert.deepEqual(digitalMe.foundationCategoryIds, ['about', 'education', 'experience']);

  const foundations = digitalMe.foundationCategoryIds.map((categoryId) => {
    const foundation = VERIFIED_DOSSIER_PRESENTATION_CATEGORIES.find(
      (category) => category.id === categoryId,
    );
    assert.ok(foundation, `${categoryId} should resolve to a presentation category`);
    return foundation;
  });

  assert.deepEqual(
    foundations.map((foundation) => foundation.label),
    ['About', 'Education', 'Experience'],
  );
  assert.deepEqual(
    foundations.map((foundation) => foundation.href),
    ['/about', '/education', '/experience'],
  );
  assert.ok(digitalMe.sourceSectionIds.includes('about'));
  for (const educationSection of ['unsw', 'quantnet', 'wqu', 'claude'] as const) {
    assert.ok(digitalMe.sourceSectionIds.includes(educationSection));
  }

  const { default: DigitalMePage } = await import('../app/digital-me/page');
  const { renderToStaticMarkup } = require('react-dom/server') as {
    renderToStaticMarkup: (node: React.ReactElement) => string;
  };
  const html = renderToStaticMarkup(React.createElement(DigitalMePage));

  assert.match(html, /Quant Researcher \/ Trader|Quant Trader|Quant T\/R/);
  assert.match(html, /Role Lens/);
  assert.match(html, /Evidence Graph/);
  assert.match(html, /Claim Engine/);
  assert.match(html, /Artifact Runtime/);
  assert.match(html, /Boundary/);
  assert.match(html, /Next Growth Action/);
  assert.match(html, /Built from About, Education, and Experience/);
  assert.match(html, /About foundation/);
  assert.match(html, /Education foundation/);
  assert.match(html, /Experience foundation/);
  assert.doesNotMatch(html, /A living personal interface/);
  assert.doesNotMatch(html, /interactive representation of a person/i);
});

test('Digital Me exposes role-lens artifact runtime actions', async () => {
  const {
    DIGITAL_ME_ARTIFACT_MODES,
    DIGITAL_ME_PROOF_PATH,
  } = await import('../lib/new-loom/digital-me-role-os');

  assert.deepEqual(
    DIGITAL_ME_ARTIFACT_MODES.map((mode) => mode.label),
    ['Capability Map', 'Interview Answer', 'Gap Roadmap', 'Source Graph', 'Portfolio Case'],
  );
  assert.ok(DIGITAL_ME_PROOF_PATH.claims.length >= 5);

  const { default: DigitalMePage } = await import('../app/digital-me/page');
  const { renderToStaticMarkup } = require('react-dom/server') as {
    renderToStaticMarkup: (node: React.ReactElement) => string;
  };
  const html = renderToStaticMarkup(React.createElement(DigitalMePage));

  for (const mode of DIGITAL_ME_ARTIFACT_MODES) {
    assert.match(html, new RegExp(mode.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(html, /Capability Map/);
  assert.match(html, /Interview Answer/);
  assert.match(html, /Gap Roadmap/);
});

test('Digital Me renders the Quant proof path with evidence statuses and gaps', async () => {
  const {
    DIGITAL_ME_PROOF_PATH,
    getDigitalMeClaimById,
    getDigitalMeEvidenceForClaim,
  } = await import('../lib/new-loom/digital-me-role-os');

  assert.ok(DIGITAL_ME_PROOF_PATH.claims.some((claim) => claim.evidenceStatus === 'strong'));
  assert.ok(DIGITAL_ME_PROOF_PATH.claims.some((claim) => claim.evidenceStatus === 'partial'));
  assert.ok(DIGITAL_ME_PROOF_PATH.claims.some((claim) => claim.evidenceStatus === 'direction'));
  assert.ok(getDigitalMeEvidenceForClaim('mathematical-reasoning').length > 0);

  // The Optibook screenshot upgraded live-market proof from missing to partial.
  assert.equal(getDigitalMeClaimById('live-market-project-proof')?.evidenceStatus, 'partial');
  assert.ok(
    getDigitalMeEvidenceForClaim('live-market-project-proof').some(
      (evidence) => evidence.artifactId === 'optibook-market-lens',
    ),
  );

  const { default: DigitalMePage } = await import('../app/digital-me/page');
  const { renderToStaticMarkup } = require('react-dom/server') as {
    renderToStaticMarkup: (node: React.ReactElement) => string;
  };
  const html = renderToStaticMarkup(React.createElement(DigitalMePage));

  assert.match(html, /Mathematical reasoning/);
  assert.match(html, /Optimisation thinking/);
  assert.match(html, /Programming foundations/);
  assert.match(html, /Market structure/);
  assert.match(html, /Research output gap/);
  assert.match(html, /Strong evidence/);
  assert.match(html, /Partial evidence/);
  assert.match(html, /Direction only/);
  assert.doesNotMatch(html, /Missing proof/);
  assert.match(html, /Create a small quant research project/);
});

test('education and experience section heroes expose compact evidence summaries', async () => {
  const { default: EducationPage } = await import('../app/education/page');
  const { default: ExperiencePage } = await import('../app/experience/page');
  const { renderToStaticMarkup } = require('react-dom/server') as {
    renderToStaticMarkup: (node: React.ReactElement) => string;
  };

  const educationHtml = renderToStaticMarkup(React.createElement(EducationPage));
  const experienceHtml = renderToStaticMarkup(React.createElement(ExperiencePage));

  assert.match(educationHtml, /class="vd-section-page__hero-copy"/);
  assert.match(educationHtml, /class="vd-section-page__hero-proof"/);
  assert.match(educationHtml, /aria-label="Education evidence summary"/);
  assert.match(educationHtml, /Source shelves/);
  assert.match(educationHtml, /Visible courses/);
  assert.match(educationHtml, /Evidence files/);

  assert.match(experienceHtml, /class="vd-section-page__hero-copy"/);
  assert.match(experienceHtml, /class="vd-section-page__hero-proof"/);
  assert.match(experienceHtml, /aria-label="Experience evidence summary"/);
  assert.match(experienceHtml, /Experience evidence\./);
  assert.match(experienceHtml, /Work/);
  assert.match(experienceHtml, /Projects/);
  assert.match(experienceHtml, /Files/);
});

test('experience surface ships CV-backed entries with resolving proof artifacts', async () => {
  const entries: readonly VerifiedDossierExperienceEntry[] = VERIFIED_DOSSIER_EXPERIENCE_ENTRIES;

  assert.ok(entries.length >= 5, 'experience entries should exist');
  assert.equal(
    new Set(entries.map((entry) => entry.id)).size,
    entries.length,
    'experience entry ids must be unique',
  );

  for (const entry of entries) {
    assert.match(entry.organisation, /\S/, `${entry.id} needs an organisation`);
    assert.match(entry.role, /\S/, `${entry.id} needs a role`);
    assert.ok(entry.summary.length > 20, `${entry.id} needs a real summary`);

    if (entry.verification === 'cv-pdf') {
      assert.ok(
        entry.proofArtifactIds.length > 0,
        `${entry.id} is CV-backed and must carry proof artifacts`,
      );
      for (const artifactId of entry.proofArtifactIds) {
        assert.equal(
          resolveVerifiedDossierArtifact(artifactId).id,
          artifactId,
          `${entry.id} proof artifact ${artifactId} must resolve`,
        );
      }
    } else {
      // Honesty rule: cover claims without CV documentation must say so
      // and must not invent dates or proof.
      assert.equal(entry.verification, 'pending-documentation');
      assert.equal(entry.period, undefined, `${entry.id} must not invent dates`);
      assert.ok(entry.verificationNote.length > 20, `${entry.id} needs a pending note`);
    }
  }

  const optiver = entries.find((entry) => entry.id === 'optiver-unsw-trading-academy');
  assert.ok(optiver, 'Optiver & UNSW trading academy entry should exist');
  assert.match(optiver.organisation, /Optiver & UNSW/);
  assert.equal(optiver.role, 'Trading Academy Participant');
  assert.equal(optiver.period, 'May 2026 – August 2026');
  assert.ok(optiver.proofArtifactIds.includes('optibook-market-lens'));

  assert.equal(
    entries.find((entry) => entry.id === 'oak-financial-group'),
    undefined,
    'Oak Financial Group entry should stay removed from the public Experience surface',
  );

  const { default: ExperiencePage } = await import('../app/experience/page');
  const { renderToStaticMarkup } = require('react-dom/server') as {
    renderToStaticMarkup: (node: React.ReactElement) => string;
  };
  const html = renderToStaticMarkup(React.createElement(ExperiencePage));

  assert.match(html, /Optiver &(amp;)? UNSW/);
  assert.match(html, /Trading Academy Participant/);
  assert.doesNotMatch(html, /Oak Financial Group/);
  assert.doesNotMatch(html, /Property Portfolio Assistant/);
  assert.doesNotMatch(html, /Backed by source records and process artifacts\./);
});

test('CV and Optibook artifacts open real evidence targets', () => {
  const aboutDoc = resolveVerifiedDossierArtifact('about-doc');
  assert.equal(aboutDoc.href, '/verified-sources/about/cv-yiping-yin.pdf');
  assert.ok(
    existsSync(join(repoRoot, 'public/verified-sources/about/cv-yiping-yin.pdf')),
    'the real CV PDF should exist under public/',
  );

  const optibook = resolveVerifiedDossierArtifact('optibook-market-lens');
  assert.match(optibook.label, /QBook/);
  // The replica build is copied into public/optibook/ by a later
  // integration step, so pin the href without asserting file existence.
  assert.equal(optibook.href, '/optibook/index.html');
  assert.ok(optibook.thumbnailSrc, 'Optibook artifact needs its screenshot thumbnail');
  assert.equal(optibook.thumbnailSrc, '/verified-sources/digital-me/optibook-market-lens.png');
  assert.ok(
    existsSync(join(repoRoot, 'public', optibook.thumbnailSrc!)),
    'the Optibook screenshot should exist under public/',
  );
});

test('Optibook static replica is rebadged as QBook in the shipped public bundle', {
  // public/optibook/ is the Optiver-IP replica build: gitignored here and shipped
  // from the private Yiping-Yin/optibook-replica repo, so it is absent on a clean
  // checkout / CI. Skip rather than fail when the bundle has not been copied in.
  skip: existsSync(join(repoRoot, 'public/optibook/index.html'))
    ? false
    : 'public/optibook replica bundle absent (gitignored Optiver IP)',
}, () => {
  const optibookRoot = join(repoRoot, 'public/optibook');
  assert.ok(existsSync(join(optibookRoot, 'index.html')), 'Optibook public bundle should exist');

  const files = collectFiles(optibookRoot);
  assert.ok(
    files.some((file) => file.endsWith('/QBook_Logo-Light-RGB.svg')),
    'public Optibook bundle should ship the QBook wordmark',
  );

  for (const file of files) {
    assert.doesNotMatch(
      relative(optibookRoot, file),
      /beebook/i,
      'public Optibook bundle filenames must not keep the old Beebook brand',
    );
  }

  const textAssets = files.filter((file) => TEXT_ASSET_EXTENSIONS.has(extname(file)));
  assert.ok(textAssets.length > 0, 'public Optibook bundle should include inspectable text assets');

  let sawQBook = false;
  for (const file of textAssets) {
    const text = readFileSync(file, 'utf8');
    const label = relative(optibookRoot, file);

    sawQBook ||= text.includes('QBook');
    assert.doesNotMatch(text, /BeeBook|Beebook|beebook/, `${label} must not keep old Beebook copy`);
    assert.doesNotMatch(
      text,
      /#(?:C8A24A|E3C56A)(?:[0-9A-F]{2})?/i,
      `${label} must not keep the deprecated gold wordmark`,
    );
    assert.doesNotMatch(
      text,
      /rgba?\(\s*(?:200\s*,\s*162\s*,\s*74|227\s*,\s*197\s*,\s*106)/i,
      `${label} must not keep deprecated gold channel values`,
    );
    assert.doesNotMatch(
      text,
      /--participant-hue|participant-hue|hsl\(/i,
      `${label} must not reintroduce saturated generated participant colors`,
    );
  }

  assert.equal(sawQBook, true, 'public Optibook bundle should visibly say QBook');
});

test('QBook documentation screens keep the cold Loom documentation skin', {
  // Reads the gitignored Optiver-IP replica assets (see the rebadge test above);
  // skip when public/optibook/assets has not been copied in (clean checkout / CI).
  skip: existsSync(join(repoRoot, 'public/optibook/assets'))
    ? false
    : 'public/optibook replica bundle absent (gitignored Optiver IP)',
}, () => {
  const cssRoot = join(repoRoot, 'public/optibook/assets');
  const cssText = collectFiles(cssRoot)
    .filter((file) => extname(file) === '.css')
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n');

  assert.match(cssText, /\.docs-app\{[^}]*color:#dce2e8[^}]*background:radial-gradient/);
  assert.match(cssText, /\.docs-topline\{[^}]*background:(?:rgba\(13,17,23,.78\)|#0d1117c7)/);
  assert.match(cssText, /\.module-list code,.reference-list code\{[^}]*color:#8af7e6[^}]*background:#0b1118/);
  assert.match(cssText, /\.api-signature\{[^}]*color:#dce2e8[^}]*background:#0b1118/);
  assert.doesNotMatch(cssText, /\.docs-app\{[^}]*background:#fafafa/);
  assert.doesNotMatch(cssText, /\.docs-topline\{[^}]*background:#fff/);
  assert.doesNotMatch(cssText, /\.docs-content\{[^}]*color:#33363a/);
  assert.doesNotMatch(cssText, /\.docs-content h1 code\{[^}]*color:#e06a6a/);
});

test('Digital Me page ships professional section-page layout styles', () => {
  const cssPath = join(repoRoot, 'app/globals.css');
  const css = existsSync(cssPath)
    ? (require('node:fs').readFileSync(cssPath, 'utf8') as string)
    : '';

  for (const selector of [
    '.vd-section-page',
    '.vd-section-page__nav',
    '.vd-section-page__hero',
    '.vd-section-page__hero-copy',
    '.vd-section-page__hero-proof',
    '.vd-section-page__list',
    '.vd-section-page__modes',
    '.vd-section-page__foundations',
    '.vd-section-page__canvas',
    '.vd-section-page__answer',
    '.vd-section-page__loom-layer',
  ]) {
    assert.match(css, new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  const roleCssPath = join(repoRoot, 'app/digital-me/DigitalMeRoleOS.module.css');
  const roleCss = existsSync(roleCssPath)
    ? (require('node:fs').readFileSync(roleCssPath, 'utf8') as string)
    : '';

  for (const selector of [
    '.roleOsPage',
    '.roleLens',
    '.proofPath',
    '.claimRail',
    '.artifactStage',
    '.evidencePanel',
    '.boundaryPanel',
  ]) {
    assert.match(roleCss, new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.match(css, /\.vd-section-page__canvas[\s\S]*grid-template-columns/);
  assert.match(css, /\.vd-section-page__foundations[\s\S]*grid-template-columns/);
  assert.match(css, /\.vd-section-page__hero\s*{[\s\S]*grid-template-columns:\s*minmax\(0, 1fr\) minmax\(15rem, 21rem\)/);
  assert.match(css, /\.vd-section-page__hero h1\s*{[\s\S]*font-size:\s*clamp\(2\.45rem, 4\.55vw, 4\.35rem\)/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.vd-section-page__hero\s*{[\s\S]*grid-template-columns:\s*minmax\(0, 1fr\)/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.vd-section-page__hero\s*{[\s\S]*padding:\s*clamp\(2\.4rem, 9vw, 3\.5rem\) 0 clamp\(1rem, 5vw, 1\.4rem\)/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.vd-section-page__hero h1\s*{[\s\S]*font-size:\s*clamp\(2\.25rem, 10\.5vw, 2\.9rem\)/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.vd-section-page/);
});

test('verified dossier profile photo points to a tracked public asset path', () => {
  assert.match(VERIFIED_DOSSIER_PROFILE.photoSrc, /^\/profile\/.+\.png$/);

  const publicPath = join(repoRoot, 'public', VERIFIED_DOSSIER_PROFILE.photoSrc);
  assert.ok(
    existsSync(publicPath),
    `${VERIFIED_DOSSIER_PROFILE.photoSrc} should exist under public/`,
  );
});

test('verified dossier home includes ECON3202 artifacts and file kinds', () => {
  const labels = new Set<string>(VERIFIED_DOSSIER_ARTIFACTS.map((artifact) => artifact.label));
  for (const label of [
    'Problem Set 02.pdf',
    'W8 A Concave-Functions.pdf',
    'W8 C Suggested Exercises.pdf',
    'Problem2.pdf',
    'About me page.docx',
    'QuantNet Online C++ Course.pdf',
    'Python Foundations.pdf',
    'WQU index.html',
    'Claude Certificate.html',
  ]) {
    assert.ok(labels.has(label), `${label} should be present`);
  }

  assert.ok(VERIFIED_DOSSIER_ARTIFACTS.some((artifact) => artifact.kind === 'pdf'));
  assert.ok(VERIFIED_DOSSIER_ARTIFACTS.some((artifact) => artifact.kind === 'word'));
  assert.ok(VERIFIED_DOSSIER_ARTIFACTS.some((artifact) => artifact.kind === 'html'));
});

test('verified dossier home keeps five sections and Loom history', () => {
  assert.deepEqual(
    VERIFIED_DOSSIER_SECTIONS.map((section) => section.label),
    ['About', 'UNSW', 'QuantNet', 'WQU', 'Claude'],
  );
  assert.deepEqual(
    VERIFIED_DOSSIER_HISTORY.map((item) => item.title),
    ['Original Loom', 'Private Wiki', 'Knowledge identity', 'Real-file workflow'],
  );
});

test('verified dossier home presents UNSW as a course shelf before ECON3202 detail', () => {
  const unsw = VERIFIED_DOSSIER_SECTIONS.find((section) => section.id === 'unsw');

  assert.ok(unsw, 'UNSW section should exist');
  assert.equal(unsw.label, 'UNSW');
  assert.equal(unsw.status, 'Course source shelf');
  assert.ok(VERIFIED_DOSSIER_UNSW_COURSES.length >= 15);
  for (const code of [
    'ECON 3202',
    'MATH 2991',
    'FINS 3666',
    'FINS 3640',
    'FINS 3616',
    'FINS 3635',
    'FINS 3646',
    'MATH 3856',
    'MATH 2018',
    'INFS 3822',
    'COMM 3030',
  ]) {
    assert.ok(
      VERIFIED_DOSSIER_UNSW_COURSES.some((course) => course.code === code),
      `${code} should be indexed`,
    );
  }
  assert.ok(
    VERIFIED_DOSSIER_UNSW_COURSES.every((course) => course.folder.startsWith('UNSW/')),
    'course folders should stay under the top-level UNSW shelf',
  );
  assert.ok(
    VERIFIED_DOSSIER_UNSW_COURSES.every((course) => course.fileCount > 0),
    'course folders should expose real local file counts',
  );
});

test('verified dossier sections and AI citations resolve to known artifacts', () => {
  const artifactIds = new Set(VERIFIED_DOSSIER_ARTIFACTS.map((artifact) => artifact.id));
  assert.equal(artifactIds.size, VERIFIED_DOSSIER_ARTIFACTS.length, 'artifact ids must be unique');

  for (const artifact of VERIFIED_DOSSIER_ARTIFACTS) {
    assert.equal(VERIFIED_DOSSIER_ARTIFACTS_BY_ID[artifact.id], artifact);
    assert.equal(resolveVerifiedDossierArtifact(artifact.id), artifact);
  }

  for (const section of VERIFIED_DOSSIER_SECTIONS) {
    for (const artifactId of section.artifactIds) {
      assert.ok(
        artifactIds.has(artifactId),
        `${section.id} references missing artifact ${artifactId}`,
      );
      assert.equal(resolveVerifiedDossierArtifact(artifactId).id, artifactId);
    }
  }

  for (const artifactId of VERIFIED_DOSSIER_AI_PROMPT.citations) {
    assert.ok(artifactIds.has(artifactId), `AI citation references missing artifact ${artifactId}`);
    assert.equal(resolveVerifiedDossierArtifact(artifactId).id, artifactId);
  }
});

test('verified dossier workbench graph binds relationships to real artifact ids', () => {
  const artifactIds = new Set(VERIFIED_DOSSIER_ARTIFACTS.map((artifact) => artifact.id));

  for (const artifactId of VERIFIED_DOSSIER_WORKBENCH.activeArtifactIds) {
    assert.ok(
      artifactIds.has(artifactId),
      `active story references missing artifact ${artifactId}`,
    );
  }

  for (const node of VERIFIED_DOSSIER_WORKBENCH.sourceGraph.nodes) {
    if ('artifactId' in node && node.artifactId) {
      assert.ok(
        artifactIds.has(node.artifactId),
        `graph node references missing artifact ${node.artifactId}`,
      );
    }
  }

  const nodeIds = new Set(VERIFIED_DOSSIER_WORKBENCH.sourceGraph.nodes.map((node) => node.id));
  for (const edge of VERIFIED_DOSSIER_WORKBENCH.sourceGraph.edges) {
    assert.ok(nodeIds.has(edge.from), `graph edge references missing from-node ${edge.from}`);
    assert.ok(nodeIds.has(edge.to), `graph edge references missing to-node ${edge.to}`);
  }
});

test('verified dossier links stay on currently routable app surfaces', () => {
  for (const item of VERIFIED_DOSSIER_TOP_NAV) {
    assertSafeHref(item.href);
  }

  for (const link of VERIFIED_DOSSIER_PROFILE.links) {
    assertSafeHref(link.href.split('#')[0]);
  }

  for (const artifact of VERIFIED_DOSSIER_ARTIFACTS) {
    assertSafeHref(artifact.href);
  }

  for (const section of VERIFIED_DOSSIER_SECTIONS) {
    assertSafeHref(section.href);
  }
});

test('verified dossier AI prompt is source-grounded and not generic chat', () => {
  assert.match(VERIFIED_DOSSIER_AI_PROMPT.question, /concavity/i);
  assert.match(VERIFIED_DOSSIER_AI_PROMPT.answer, /optimisation/i);
  assert.match(VERIFIED_DOSSIER_AI_PROMPT.answer, /first-order conditions/i);
  assert.match(VERIFIED_DOSSIER_AI_PROMPT.answer, /economic choice problem/i);
  assert.ok(VERIFIED_DOSSIER_AI_PROMPT.citations.length >= 3);
});

test('featured ECON3202 artifacts carry realistic document preview metadata', () => {
  for (const artifactId of ['econ-ps2', 'econ-slides', 'econ-tutorial', 'econ-notes'] as const) {
    const artifact = resolveVerifiedDossierArtifact(artifactId);

    assert.ok(artifact.preview, `${artifact.label} should include preview metadata`);
    assert.ok(
      artifact.sourcePath?.startsWith('UNSW/ECON 3202/'),
      `${artifact.label} should bind to a real source path`,
    );
    assert.ok(
      artifact.pageCount && artifact.pageCount > 0,
      `${artifact.label} should carry a real page count`,
    );
    assert.ok(artifact.fileSize, `${artifact.label} should carry a real file size`);
    assert.ok(artifact.modifiedAt, `${artifact.label} should carry a real modified date`);
    assert.ok(
      artifact.thumbnailSrc?.startsWith('/verified-sources/econ3202/'),
      `${artifact.label} should carry a real thumbnail`,
    );
    assert.match(artifact.preview.metadata, /pages - .+ - modified/);
    assert.ok(artifact.preview.lines.length >= 3, `${artifact.label} should include preview lines`);
    assert.match(artifact.preview.tag, /03_Problem_Set|02_Week\/W08/);

    const thumbPath = join(repoRoot, 'public', artifact.thumbnailSrc!);
    assert.ok(existsSync(thumbPath), `${artifact.thumbnailSrc} should exist under public/`);
  }
});

test('about profile artifact carries a realistic document preview', () => {
  const artifact = resolveVerifiedDossierArtifact('about-doc');

  assert.equal(artifact.kind, 'word');
  assert.ok(artifact.preview, 'About artifact should include preview metadata');
  assert.match(artifact.preview.metadata, /DOCX/);
  assert.match(artifact.preview.kicker, /Personal Knowledge Postcard/);
  assert.ok(artifact.preview.lines.some((line) => /Learning path/.test(line)));
});

test('reference shelves use real local sources and image previews', () => {
  for (const artifactId of [
    'quantnet-cpp-course',
    'quantnet-python-foundations',
    'wqu-index',
    'claude-certificate',
  ] as const) {
    const artifact = resolveVerifiedDossierArtifact(artifactId);

    assert.ok(artifact.sourcePath, `${artifact.label} should bind to a local source path`);
    assert.ok(artifact.fileSize, `${artifact.label} should carry a real file size`);
    assert.ok(artifact.modifiedAt, `${artifact.label} should carry a real modified date`);
    assert.ok(artifact.thumbnailSrc, `${artifact.label} should carry a public thumbnail`);
    assert.match(artifact.preview?.metadata ?? '', /(pages|HTML) - .+ - modified/);

    const thumbPath = join(repoRoot, 'public', artifact.thumbnailSrc!);
    assert.ok(existsSync(thumbPath), `${artifact.thumbnailSrc} should exist under public/`);
  }
});
