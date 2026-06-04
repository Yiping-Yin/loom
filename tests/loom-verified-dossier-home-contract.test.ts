import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  VERIFIED_DOSSIER_AI_PROMPT,
  VERIFIED_DOSSIER_ARTIFACTS,
  VERIFIED_DOSSIER_ARTIFACTS_BY_ID,
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
} from '../lib/new-loom/verified-dossier-home';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));

const SAFE_INTERNAL_HREFS = new Set([
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
]);

function assertSafeHref(href: string) {
  if (href.startsWith('https://')) {
    return;
  }

  assert.ok(SAFE_INTERNAL_HREFS.has(href), `${href} must be a safe internal app surface`);
}

test('verified dossier home data preserves approved evidence workbench definition', () => {
  assert.equal(VERIFIED_DOSSIER_HOME_COPY.headline, 'Sources become cited work');
  assert.equal(VERIFIED_DOSSIER_HOME_COPY.body, 'Verified source workspace');
  assert.match(
    VERIFIED_DOSSIER_HOME_COPY.shortDefinition,
    /Sources stay inspectable\. Draft turns them into cited answers\./,
  );
  assert.equal(VERIFIED_DOSSIER_WORKBENCH.activeSectionId, 'unsw');
  assert.deepEqual(
    VERIFIED_DOSSIER_WORKBENCH.activeArtifactIds,
    ['econ-ps2', 'econ-slides', 'econ-tutorial', 'econ-notes'],
  );
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
    ['About', 'Education', 'Experience', 'Digital Me', 'Draft'],
  );
  assert.deepEqual(
    VERIFIED_DOSSIER_TOP_NAV.map((item) => item.href),
    ['/about', '/education', '/experience', '/digital-me', '/drafts'],
  );
  assert.ok(!VERIFIED_DOSSIER_TOP_NAV.some((item) => item.label === 'Sources'));
  assert.ok(!VERIFIED_DOSSIER_TOP_NAV.some((item) => item.label === 'UNSW'));
  assert.equal(VERIFIED_DOSSIER_PROFILE.name, 'Yiping Yin');
  assert.match(VERIFIED_DOSSIER_PROFILE.location, /Sydney/);
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
    VERIFIED_DOSSIER_TOP_NAV.slice(0, VERIFIED_DOSSIER_PRESENTATION_CATEGORIES.length).map((item) => [item.label, item.href]),
    VERIFIED_DOSSIER_PRESENTATION_CATEGORIES.map((category) => [category.label, category.href]),
  );

  for (const category of VERIFIED_DOSSIER_PRESENTATION_CATEGORIES) {
    assertSafeHref(category.href);
    assert.ok(category.sourceSectionIds.length > 0, `${category.id} should map to source sections`);
    assert.ok(category.artifactIds.length > 0, `${category.id} should map to artifacts`);

    for (const sectionId of category.sourceSectionIds) {
      assert.ok(sectionIds.has(sectionId), `${category.id} references missing source section ${sectionId}`);
    }

    for (const artifactId of category.artifactIds) {
      assert.ok(artifactIds.has(artifactId), `${category.id} references missing artifact ${artifactId}`);
      assert.equal(resolveVerifiedDossierArtifact(artifactId).id, artifactId);
    }
  }

  const education = VERIFIED_DOSSIER_PRESENTATION_CATEGORIES.find((category) => category.id === 'education');
  assert.ok(education, 'Education presentation category should exist');
  for (const sourceSectionId of ['unsw', 'quantnet', 'wqu', 'claude'] as const) {
    assert.ok(
      education.sourceSectionIds.includes(sourceSectionId),
      `Education should include ${sourceSectionId} source section`,
    );
  }

  const digitalMe = VERIFIED_DOSSIER_PRESENTATION_CATEGORIES.find((category) => category.id === 'digital-me');
  assert.ok(digitalMe, 'Digital Me presentation category should exist');
  assert.ok(digitalMe.capabilities.some((capability) => /citation/i.test(capability)));
  assert.ok(digitalMe.capabilities.some((capability) => /process/i.test(capability)));
});

test('verified dossier profile photo points to a tracked public asset path', () => {
  assert.match(VERIFIED_DOSSIER_PROFILE.photoSrc, /^\/profile\/.+\.png$/);

  const publicPath = join(repoRoot, 'public', VERIFIED_DOSSIER_PROFILE.photoSrc);
  assert.ok(existsSync(publicPath), `${VERIFIED_DOSSIER_PROFILE.photoSrc} should exist under public/`);
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
    ['About', 'UNSW', 'Quantnet', 'WQU', 'Claude'],
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
    assert.ok(VERIFIED_DOSSIER_UNSW_COURSES.some((course) => course.code === code), `${code} should be indexed`);
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
      assert.ok(artifactIds.has(artifactId), `${section.id} references missing artifact ${artifactId}`);
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
    assert.ok(artifactIds.has(artifactId), `active story references missing artifact ${artifactId}`);
  }

  for (const node of VERIFIED_DOSSIER_WORKBENCH.sourceGraph.nodes) {
    if ('artifactId' in node && node.artifactId) {
      assert.ok(artifactIds.has(node.artifactId), `graph node references missing artifact ${node.artifactId}`);
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
    assert.ok(artifact.sourcePath?.startsWith('UNSW/ECON 3202/'), `${artifact.label} should bind to a real source path`);
    assert.ok(artifact.pageCount && artifact.pageCount > 0, `${artifact.label} should carry a real page count`);
    assert.ok(artifact.fileSize, `${artifact.label} should carry a real file size`);
    assert.ok(artifact.modifiedAt, `${artifact.label} should carry a real modified date`);
    assert.ok(artifact.thumbnailSrc?.startsWith('/verified-sources/econ3202/'), `${artifact.label} should carry a real thumbnail`);
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
