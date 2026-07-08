/**
 * Wiki migration step 1 (docs/canon ruling 2026-07-09): emit the 47-chapter
 * spine manifest the native side (WikiCurriculum.swift) decodes. The single
 * source of truth stays lib/nav.ts — this script derives, never invents.
 *
 * Output: public/wiki-manifest.json — staged into the app bundle at
 * Resources/web/wiki-manifest.json alongside the wiki pages.
 *
 * Run: npx tsx scripts/build-wiki-manifest.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chapters, type Chapter } from '../lib/nav';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export type WikiManifest = {
  generatedFrom: 'lib/nav.ts';
  version: 1;
  sections: string[];
  chapters: Array<{
    slug: string;
    title: string;
    section: string;
    /** 0-based position within the whole spine (reading order). */
    order: number;
    /** 1-based position within its section — drives "iii of vi" folios. */
    positionInSection: number;
    sectionSize: number;
    href: string;
  }>;
};

/** Pure builder — unit-tested; `pageExists` injects the fs check. */
export function buildWikiManifest(
  input: Chapter[],
  pageExists: (slug: string) => boolean,
): WikiManifest {
  const missing = input.filter((c) => !pageExists(c.slug)).map((c) => c.slug);
  if (missing.length > 0) {
    throw new Error(`manifest refuses to ship dead links — missing pages: ${missing.join(', ')}`);
  }

  // Section order = first appearance in the spine (nav.ts is reading order).
  const sections: string[] = [];
  for (const c of input) {
    if (!sections.includes(c.section)) sections.push(c.section);
  }

  const sectionCounts = new Map<string, number>();
  for (const c of input) {
    sectionCounts.set(c.section, (sectionCounts.get(c.section) ?? 0) + 1);
  }

  const seenInSection = new Map<string, number>();
  return {
    generatedFrom: 'lib/nav.ts',
    version: 1,
    sections,
    chapters: input.map((c, order) => {
      const pos = (seenInSection.get(c.section) ?? 0) + 1;
      seenInSection.set(c.section, pos);
      return {
        slug: c.slug,
        title: c.title,
        section: c.section,
        order,
        positionInSection: pos,
        sectionSize: sectionCounts.get(c.section) ?? 1,
        href: `/wiki/${c.slug}`,
      };
    }),
  };
}

function main() {
  const manifest = buildWikiManifest(chapters, (slug) =>
    fs.existsSync(path.join(repoRoot, 'app', 'wiki', slug, 'page.mdx')),
  );
  const out = path.join(repoRoot, 'public', 'wiki-manifest.json');
  fs.writeFileSync(out, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`[build-wiki-manifest] wrote ${manifest.chapters.length} chapters, ${manifest.sections.length} sections → ${path.relative(repoRoot, out)}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
