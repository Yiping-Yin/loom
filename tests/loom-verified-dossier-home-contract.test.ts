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
  VERIFIED_DOSSIER_PROFILE,
  VERIFIED_DOSSIER_SECTIONS,
  VERIFIED_DOSSIER_TOP_NAV,
  resolveVerifiedDossierArtifact,
} from '../lib/new-loom/verified-dossier-home';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));

const SAFE_INTERNAL_HREFS = new Set([
  '/about',
  '/knowledge',
  '/knowledge/unsw',
  '/knowledge/quantnet',
  '/knowledge/wqu',
  '/knowledge/claude',
  '/product-history',
]);

function assertSafeHref(href: string) {
  if (href.startsWith('https://')) {
    return;
  }

  assert.ok(SAFE_INTERNAL_HREFS.has(href), `${href} must be a safe internal app surface`);
}

test('verified dossier home data preserves approved product definition', () => {
  assert.equal(
    VERIFIED_DOSSIER_HOME_COPY.headline,
    'A knowledge profile people can inspect and ask.',
  );
  assert.match(
    VERIFIED_DOSSIER_HOME_COPY.body,
    /Sources, drafts, projects, and conversations become a public record/i,
  );
  assert.match(
    VERIFIED_DOSSIER_HOME_COPY.shortDefinition,
    /sources, learning path, work, process records, and AI conversations/,
  );
});

test('verified dossier home keeps canonical navigation and profile identity', () => {
  assert.deepEqual(
    VERIFIED_DOSSIER_TOP_NAV.map((item) => item.label),
    ['About', 'Sources', 'UNSW', 'Quantnet', 'WQU', 'Claude', 'History'],
  );
  assert.equal(VERIFIED_DOSSIER_PROFILE.name, 'Yiping Yin');
  assert.match(VERIFIED_DOSSIER_PROFILE.location, /Sydney/);
  assert.ok(VERIFIED_DOSSIER_PROFILE.links.some((link) => link.label === 'LinkedIn'));
  assert.ok(VERIFIED_DOSSIER_PROFILE.memberships.some((item) => item.label === 'UNSW Sydney'));
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
    'BHP Case Study.xlsx',
    'Prompt library.md',
  ]) {
    assert.ok(labels.has(label), `${label} should be present`);
  }

  assert.ok(VERIFIED_DOSSIER_ARTIFACTS.some((artifact) => artifact.kind === 'pdf'));
  assert.ok(VERIFIED_DOSSIER_ARTIFACTS.some((artifact) => artifact.kind === 'word'));
  assert.ok(VERIFIED_DOSSIER_ARTIFACTS.some((artifact) => artifact.kind === 'excel'));
  assert.ok(VERIFIED_DOSSIER_ARTIFACTS.some((artifact) => artifact.kind === 'markdown'));
});

test('verified dossier home keeps five sections and Loom history', () => {
  assert.deepEqual(
    VERIFIED_DOSSIER_SECTIONS.map((section) => section.label),
    ['About', 'UNSW / ECON3202', 'Quantnet', 'WQU', 'Claude'],
  );
  assert.deepEqual(
    VERIFIED_DOSSIER_HISTORY.map((item) => item.title),
    ['Original Loom', 'Private Wiki', 'Knowledge identity', 'Platform for everyone'],
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
    assert.match(artifact.preview.metadata, /(PDF|PPTX)/);
    assert.ok(artifact.preview.lines.length >= 3, `${artifact.label} should include preview lines`);
    assert.match(artifact.preview.tag, /Problem set|Week 8 lecture|Practice|Answer/);
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
