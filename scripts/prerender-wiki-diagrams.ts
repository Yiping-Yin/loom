#!/usr/bin/env node
/**
 * Wiki migration step 2: pre-render every <Mermaid chart={`…`}/> block in
 * app/wiki into static SVGs (light + dark), so the staged bundle never
 * depends on client-side mermaid hydration — a failed hydration used to
 * mean an empty hole in 31 of the 47 chapters.
 *
 * The book is still growing (owner ruling 2026-07-09): dev keeps live
 * rendering as fallback for charts not yet pre-rendered; re-running this
 * script picks up new/edited charts. Deterministic: same chart source →
 * same hash → same files.
 *
 * Output:
 *   public/wiki-diagrams/<sha1-12>.svg        (light)
 *   public/wiki-diagrams/<sha1-12>.dark.svg   (dark)
 *   lib/wiki-diagram-map.json                 { chartSource → hash }
 *
 * Run: npx tsx scripts/prerender-wiki-diagrams.ts
 */
import { chromium } from '@playwright/test';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { diagramKey } from '../lib/wiki-diagram-key';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(repoRoot, 'public', 'wiki-diagrams');
const mapPath = path.join(repoRoot, 'lib', 'wiki-diagram-map.json');

/** Extract chart sources from `<Mermaid chart={` ... `} />` blocks. */
export function extractCharts(mdx: string): string[] {
  const charts: string[] = [];
  const re = /<Mermaid\s+chart=\{`([\s\S]*?)`\}/g;
  let m;
  while ((m = re.exec(mdx)) !== null) charts.push(m[1]);
  return charts;
}

const hashOf = (chart: string) => createHash('sha1').update(diagramKey(chart)).digest('hex').slice(0, 12);

async function main() {
  const wikiDir = path.join(repoRoot, 'app', 'wiki');
  const slugs = fs.readdirSync(wikiDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  const charts = new Map<string, string>(); // hash → source
  for (const slug of slugs) {
    const p = path.join(wikiDir, slug, 'page.mdx');
    if (!fs.existsSync(p)) continue;
    for (const chart of extractCharts(fs.readFileSync(p, 'utf8'))) {
      charts.set(hashOf(chart), chart);
    }
  }
  console.log(`[prerender-wiki-diagrams] ${charts.size} unique charts across ${slugs.length} chapters`);

  fs.mkdirSync(outDir, { recursive: true });
  // channel:'chrome' = the installed Google Chrome — no Chromium download.
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage();
  await page.setContent('<!doctype html><html><body></body></html>');
  await page.addScriptTag({ path: path.join(repoRoot, 'node_modules', 'mermaid', 'dist', 'mermaid.min.js') });

  const map: Record<string, string> = {};
  let rendered = 0;
  let failed = 0;
  for (const [hash, chart] of charts) {
    let ok = true;
    for (const theme of ['default', 'dark']) {
      const suffix = theme === 'dark' ? '.dark.svg' : '.svg';
      try {
        const svg = await page.evaluate(async ({ chart, theme, id }: { chart: string; theme: string; id: string }) => {
          const mermaid = (window as unknown as { mermaid: {
            initialize: (c: object) => void;
            render: (id: string, chart: string) => Promise<{ svg: string }>;
          } }).mermaid;
          // htmlLabels:false — SVG-as-<img> runs in secure static mode where
          // <foreignObject> HTML labels don't render (the image errors out);
          // pure SVG <text> labels work everywhere.
          mermaid.initialize({
            startOnLoad: false, theme, securityLevel: 'strict',
            htmlLabels: false, flowchart: { htmlLabels: false },
          });
          const { svg } = await mermaid.render(id, chart);
          return svg;
        }, { chart, theme, id: `m${hash}${theme === 'dark' ? 'd' : 'l'}` });
        // Mermaid emits width="100%" with no height — fine inline, but as an
        // <img> source the SVG then has no intrinsic size and collapses.
        // Pin explicit width/height from the viewBox.
        const sized = svg.replace(/<svg([^>]*?)width="100%"/, (m0: string, pre: string) => {
          const vb = /viewBox="([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)"/.exec(svg);
          if (!vb) return m0;
          return `<svg${pre}width="${Math.ceil(Number(vb[3]))}" height="${Math.ceil(Number(vb[4]))}"`;
        });
        fs.writeFileSync(path.join(outDir, hash + suffix), sized);
      } catch (err) {
        ok = false;
        failed += 1;
        console.error(`[prerender-wiki-diagrams] FAILED ${hash} (${theme}): ${String(err).split('\n')[0]}`);
        break;
      }
    }
    if (ok) {
      map[diagramKey(chart)] = hash;
      rendered += 1;
    }
  }
  await browser.close();

  fs.writeFileSync(mapPath, JSON.stringify(map, null, 2) + '\n');
  console.log(`[prerender-wiki-diagrams] rendered ${rendered}/${charts.size} (light+dark), map → lib/wiki-diagram-map.json`);
  if (failed > 0) {
    console.error(`[prerender-wiki-diagrams] ${failed} chart(s) failed — they will fall back to live rendering.`);
  }
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  main().catch((err) => { console.error(err); process.exit(1); });
}
