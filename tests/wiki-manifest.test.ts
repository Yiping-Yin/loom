/**
 * Wiki migration step 1: the spine manifest derives from lib/nav.ts and
 * refuses to ship dead links. WikiCurriculum.swift decodes this shape —
 * changing it is a cross-boundary contract change.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { buildWikiManifest } from '../scripts/build-wiki-manifest';
import { chapters } from '../lib/nav';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('manifest mirrors the real spine: every chapter has a live page', () => {
  const manifest = buildWikiManifest(chapters, (slug) =>
    fs.existsSync(path.join(repoRoot, 'app', 'wiki', slug, 'page.mdx')),
  );

  assert.equal(manifest.version, 1);
  assert.equal(manifest.chapters.length, chapters.length);
  assert.ok(manifest.chapters.length >= 47, 'the book has at least its 47 chapters');
  // Reading order preserved verbatim from nav.ts.
  assert.deepEqual(manifest.chapters.map((c) => c.slug), chapters.map((c) => c.slug));
  // Section list is first-appearance order, starting at the spine's head.
  assert.equal(manifest.sections[0], chapters[0].section);
});

test('folio math: positionInSection / sectionSize are consistent', () => {
  const manifest = buildWikiManifest(chapters, () => true);

  for (const section of manifest.sections) {
    const inSection = manifest.chapters.filter((c) => c.section === section);
    assert.deepEqual(
      inSection.map((c) => c.positionInSection),
      inSection.map((_, i) => i + 1),
      `${section}: positions must be 1..n in spine order`,
    );
    assert.ok(inSection.every((c) => c.sectionSize === inSection.length));
  }
});

test('manifest refuses dead links', () => {
  assert.throws(
    () => buildWikiManifest(chapters, (slug) => slug !== 'dpo'),
    /missing pages: dpo/,
  );
});

test('committed manifest file is fresh against nav.ts', () => {
  const p = path.join(repoRoot, 'public', 'wiki-manifest.json');
  assert.ok(fs.existsSync(p), 'run: npx tsx scripts/build-wiki-manifest.ts');
  const committed = JSON.parse(fs.readFileSync(p, 'utf8'));
  const expected = buildWikiManifest(chapters, () => true);
  assert.deepEqual(committed, expected, 'public/wiki-manifest.json is stale — re-run the generator');
});
