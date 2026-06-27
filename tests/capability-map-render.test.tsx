import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';

import type { BeginnerCapability } from '../lib/capability/capability-graph';
import type { BeginnerProfile } from '../lib/profile/beginner-profile';

// ── Stub CSS Modules (no browser globals, no stylesheet parsing) ──────────────
const cssModuleClassMap = new Proxy(
  {},
  { get: (_target, className) => (typeof className === 'string' ? className : '') },
) as Record<string, string>;
const cssModuleExports = { __esModule: true, default: cssModuleClassMap };

require.extensions['.css'] = (module: { exports: typeof cssModuleExports }) => {
  module.exports = cssModuleExports;
};

// ── Stub artifact-store so SSR render never touches IndexedDB ─────────────────
// Must happen before CapabilityMap is required so the stub is in cache first.
// Mirror: beginner-digital-me-render.test.tsx uses require.cache injection.
{
  const artifactStorePath = require.resolve('../lib/artifact/artifact-store');
  require.cache[artifactStorePath] = {
    id: artifactStorePath,
    filename: artifactStorePath,
    loaded: true,
    exports: {
      getArtifactObjectUrl: async (_id: string) => null,
    },
    parent: null,
    children: [],
    paths: [],
  } as unknown as NodeModule;
}

// ── Render helper (SSR via renderToStaticMarkup) ──────────────────────────────
function render(node: React.ReactElement) {
  Object.assign(globalThis, { React });
  const { renderToStaticMarkup } = require('react-dom/server') as {
    renderToStaticMarkup: (node: React.ReactElement) => string;
  };
  return renderToStaticMarkup(node);
}

function visibleText(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'").replace(/\s+/g, ' ').trim();
}

// ── Fixtures ──────────────────────────────────────────────────────────────────
const SAMPLE_PROFILE: BeginnerProfile = {
  version: 1,
  home: { name: 'Alex Chen', headline: 'Software Engineer' },
  about: { summary: 'Building reliable distributed systems.', links: [] },
  education: [],
  experience: [],
  works: [],
};

const SAMPLE_CAPABILITIES: BeginnerCapability[] = [
  {
    id: 'cap-python-programming',
    label: 'Python Programming',
    status: 'strong',
    evidence: [
      { kind: 'experience', refId: 'exp-0', label: 'Acme Corp internship' },
      { kind: 'artifact', refId: 'artifact-abc123', label: 'Python Project Report' },
    ],
    note: 'Used in production data pipelines.',
    growth: 'Deepen async patterns and packaging.',
  },
  {
    id: 'cap-data-analysis',
    label: 'Data Analysis',
    status: 'partial',
    evidence: [
      { kind: 'work', refId: 'work-0', label: 'Analytics Dashboard' },
    ],
  },
  {
    id: 'cap-machine-learning',
    label: 'Machine Learning',
    status: 'direction',
    evidence: [],
    growth: 'Start with linear models and build up.',
  },
];

// ── Tests ─────────────────────────────────────────────────────────────────────

test('CapabilityMap renders one card per capability with its label', () => {
  const { CapabilityMap } = require('../components/CapabilityMap') as typeof import('../components/CapabilityMap');
  const html = render(<CapabilityMap capabilities={SAMPLE_CAPABILITIES} profile={SAMPLE_PROFILE} />);
  const text = visibleText(html);

  assert.match(text, /Python Programming/);
  assert.match(text, /Data Analysis/);
  assert.match(text, /Machine Learning/);
});

test('CapabilityMap renders a status indicator (class and text) per card', () => {
  const { CapabilityMap } = require('../components/CapabilityMap') as typeof import('../components/CapabilityMap');
  const html = render(<CapabilityMap capabilities={SAMPLE_CAPABILITIES} profile={SAMPLE_PROFILE} />);
  const text = visibleText(html);

  // Each status should appear as visible text (accessible — not color alone).
  assert.match(text, /Strong/);
  assert.match(text, /Partial/);
  assert.match(text, /Direction/);

  // data-status attributes encode status on the card element.
  assert.match(html, /data-status="strong"/);
  assert.match(html, /data-status="partial"/);
  assert.match(html, /data-status="direction"/);
});

test('CapabilityMap renders one evidence element per evidence item', () => {
  const { CapabilityMap } = require('../components/CapabilityMap') as typeof import('../components/CapabilityMap');
  const html = render(<CapabilityMap capabilities={SAMPLE_CAPABILITIES} profile={SAMPLE_PROFILE} />);
  const text = visibleText(html);

  // Evidence labels must appear.
  assert.match(text, /Acme Corp internship/);
  assert.match(text, /Python Project Report/);
  assert.match(text, /Analytics Dashboard/);
});

test('CapabilityMap renders artifact evidence as a button (not a link)', () => {
  const { CapabilityMap } = require('../components/CapabilityMap') as typeof import('../components/CapabilityMap');
  const html = render(<CapabilityMap capabilities={SAMPLE_CAPABILITIES} profile={SAMPLE_PROFILE} />);

  // The artifact chip must be a <button type="button"> containing the artifact label.
  assert.match(html, /<button[^>]*type="button"[^>]*>[\s\S]*?Python Project Report/);

  // The artifact label must NOT appear inside an <a href=...> tag.
  const artifactAnchorMatch = html.match(/<a[^>]*href[^>]*>[^<]*Python Project Report[^<]*<\/a>/);
  assert.equal(artifactAnchorMatch, null, 'artifact evidence must not render as an anchor');
});

test('CapabilityMap renders education evidence as an anchor to /education', () => {
  const caps: BeginnerCapability[] = [
    {
      id: 'cap-test-edu',
      label: 'Mathematics',
      status: 'partial',
      evidence: [{ kind: 'education', refId: 'edu-0', label: 'University of Sydney' }],
    },
  ];
  const { CapabilityMap } = require('../components/CapabilityMap') as typeof import('../components/CapabilityMap');
  const html = render(<CapabilityMap capabilities={caps} profile={SAMPLE_PROFILE} />);

  assert.match(html, /href="\/education"/);
  const text = visibleText(html);
  assert.match(text, /University of Sydney/);
});

test('CapabilityMap renders experience evidence as an anchor to /experience', () => {
  const caps: BeginnerCapability[] = [
    {
      id: 'cap-test-exp',
      label: 'Software Engineering',
      status: 'partial',
      evidence: [{ kind: 'experience', refId: 'exp-0', label: 'Acme Corp' }],
    },
  ];
  const { CapabilityMap } = require('../components/CapabilityMap') as typeof import('../components/CapabilityMap');
  const html = render(<CapabilityMap capabilities={caps} profile={SAMPLE_PROFILE} />);

  assert.match(html, /href="\/experience"/);
  const text = visibleText(html);
  assert.match(text, /Acme Corp/);
});

test('CapabilityMap renders work evidence as an anchor to /works', () => {
  const caps: BeginnerCapability[] = [
    {
      id: 'cap-test-work',
      label: 'Data Analysis',
      status: 'partial',
      evidence: [{ kind: 'work', refId: 'work-0', label: 'Analytics Dashboard' }],
    },
  ];
  const { CapabilityMap } = require('../components/CapabilityMap') as typeof import('../components/CapabilityMap');
  const html = render(<CapabilityMap capabilities={caps} profile={SAMPLE_PROFILE} />);

  assert.match(html, /href="\/works"/);
  const text = visibleText(html);
  assert.match(text, /Analytics Dashboard/);
});

test('CapabilityMap renders growth when present', () => {
  const { CapabilityMap } = require('../components/CapabilityMap') as typeof import('../components/CapabilityMap');
  const html = render(<CapabilityMap capabilities={SAMPLE_CAPABILITIES} profile={SAMPLE_PROFILE} />);
  const text = visibleText(html);

  assert.match(text, /Deepen async patterns and packaging\./);
  assert.match(text, /Start with linear models and build up\./);
});

test('CapabilityMap does not render growth when absent', () => {
  const caps: BeginnerCapability[] = [
    {
      id: 'cap-no-growth',
      label: 'Research',
      status: 'partial',
      evidence: [{ kind: 'experience', refId: 'exp-0', label: 'Lab assistant' }],
      // no growth field
    },
  ];
  const { CapabilityMap } = require('../components/CapabilityMap') as typeof import('../components/CapabilityMap');
  const html = render(<CapabilityMap capabilities={caps} profile={SAMPLE_PROFILE} />);

  // The growth paragraph class should not appear.
  assert.doesNotMatch(html, /class="growth"/);
});

test('CapabilityMap with empty capabilities renders the empty-state prompt, no cards', () => {
  const { CapabilityMap } = require('../components/CapabilityMap') as typeof import('../components/CapabilityMap');
  const html = render(<CapabilityMap capabilities={[]} profile={SAMPLE_PROFILE} />);
  const text = visibleText(html);

  assert.match(text, /Build your capability map/);
  assert.match(text, /LOOM reads your experience/);

  // No card elements should be rendered.
  assert.doesNotMatch(html, /data-status=/);
});

test('CapabilityMap empty state does not crash with an empty array', () => {
  const { CapabilityMap } = require('../components/CapabilityMap') as typeof import('../components/CapabilityMap');
  // Should render without throwing.
  const html = render(<CapabilityMap capabilities={[]} profile={SAMPLE_PROFILE} />);
  assert.ok(html.length > 0);
});

test('CapabilityMap status ring conveyed by accessible label, not color alone', () => {
  const { CapabilityMap } = require('../components/CapabilityMap') as typeof import('../components/CapabilityMap');
  const html = render(<CapabilityMap capabilities={SAMPLE_CAPABILITIES} profile={SAMPLE_PROFILE} />);

  // aria-label on the status badge must contain the human-readable status.
  assert.match(html, /aria-label="Capability status: Strong"/);
  assert.match(html, /aria-label="Capability status: Partial"/);
  assert.match(html, /aria-label="Capability status: Direction"/);
});

test('CapabilityMap artifact chip renders Open ↗ affordance', () => {
  const caps: BeginnerCapability[] = [
    {
      id: 'cap-with-artifact',
      label: 'Python Programming',
      status: 'strong',
      evidence: [
        { kind: 'artifact', refId: 'artifact-xyz', label: 'Portfolio PDF' },
      ],
    },
  ];
  const { CapabilityMap } = require('../components/CapabilityMap') as typeof import('../components/CapabilityMap');
  const html = render(<CapabilityMap capabilities={caps} profile={SAMPLE_PROFILE} />);

  // "Open ↗" text should be present in the artifact chip.
  assert.match(html, /Open ↗/);
});

// ── Task 2 (r4): grounded evidence excerpts ───────────────────────────────────

test('CapabilityMap shows an evidence excerpt AND keeps its openable cross-ref (link)', () => {
  const caps: BeginnerCapability[] = [
    {
      id: 'cap-excerpt-link',
      label: 'User Research',
      status: 'partial',
      evidence: [
        {
          kind: 'experience',
          refId: 'exp-0',
          label: 'Atlas Labs',
          excerpt: 'Ran weekly usability sessions that reshaped the onboarding flow.',
        },
      ],
    },
  ];
  const { CapabilityMap } = require('../components/CapabilityMap') as typeof import('../components/CapabilityMap');
  const html = render(<CapabilityMap capabilities={caps} profile={SAMPLE_PROFILE} />);
  const text = visibleText(html);

  // The grounded snippet is shown…
  assert.match(text, /Ran weekly usability sessions that reshaped the onboarding flow\./);
  // …with no "Excerpt:" prefix (copy stays minimal — just the quote).
  assert.doesNotMatch(text, /Excerpt:/i);
  // …and the openable cross-ref is still there, exactly as before (link to the source).
  assert.match(html, /href="\/experience"/);
  const text2 = visibleText(html);
  assert.match(text2, /Atlas Labs/);
});

test('CapabilityMap shows an evidence excerpt AND keeps the artifact open button', () => {
  const caps: BeginnerCapability[] = [
    {
      id: 'cap-excerpt-artifact',
      label: 'Machine Learning',
      status: 'strong',
      evidence: [
        { kind: 'experience', refId: 'exp-0', label: 'Org' },
        {
          kind: 'artifact',
          refId: 'artifact-ml',
          label: 'Thesis PDF',
          excerpt: 'A convolutional network trained on the augmented dataset.',
        },
      ],
    },
  ];
  const { CapabilityMap } = require('../components/CapabilityMap') as typeof import('../components/CapabilityMap');
  const html = render(<CapabilityMap capabilities={caps} profile={SAMPLE_PROFILE} />);
  const text = visibleText(html);

  // The grounded snippet is shown next to the artifact chip…
  assert.match(text, /A convolutional network trained on the augmented dataset\./);
  // …and the artifact is still openable (button, not an anchor) + Open ↗ affordance.
  assert.match(html, /<button[^>]*type="button"[^>]*>[\s\S]*?Thesis PDF/);
  assert.match(html, /Open ↗/);
});

test('CapabilityMap omits the excerpt line when an evidence item has none', () => {
  const caps: BeginnerCapability[] = [
    {
      id: 'cap-no-excerpt',
      label: 'Research',
      status: 'partial',
      evidence: [{ kind: 'experience', refId: 'exp-0', label: 'Lab' }],
    },
  ];
  const { CapabilityMap } = require('../components/CapabilityMap') as typeof import('../components/CapabilityMap');
  const html = render(<CapabilityMap capabilities={caps} profile={SAMPLE_PROFILE} />);

  // The cross-ref still renders…
  assert.match(html, /href="\/experience"/);
  // …but no excerpt element is emitted for a label-only evidence item.
  assert.doesNotMatch(html, /class="evidenceExcerpt"/);
});

// ── Regression: draft-derived artifact opens the Studio editor (not a blob) ────

test('CapabilityMap draft-artifact evidence opens the Studio editor (link, not blob button)', () => {
  const caps: BeginnerCapability[] = [
    {
      id: 'cap-draft-artifact',
      label: 'Technical Writing',
      status: 'strong',
      evidence: [
        { kind: 'artifact', refId: 'draft-abc123', label: 'My Draft Essay' },
      ],
    },
  ];
  const { CapabilityMap } = require('../components/CapabilityMap') as typeof import('../components/CapabilityMap');
  const html = render(<CapabilityMap capabilities={caps} profile={SAMPLE_PROFILE} />);

  // The draft-derived artifact must be an openable cross-ref to the Studio editor…
  assert.match(html, /href="\/studio\?edit=abc123"/);
  // …rendered as an anchor carrying the draft label (same-tab nav, like the editor).
  assert.match(html, /<a[^>]*href="\/studio\?edit=abc123"[^>]*>[\s\S]*?My Draft Essay/);
  // …and NOT the blob-open <button> path (which would go "file unavailable").
  const draftAsButton = html.match(/<button[^>]*type="button"[^>]*>[\s\S]*?My Draft Essay/);
  assert.equal(draftAsButton, null, 'a draft artifact must not render as a blob-open button');
});

test('CapabilityMap draft-artifact link keeps its excerpt and is same-tab (no _blank)', () => {
  const caps: BeginnerCapability[] = [
    {
      id: 'cap-draft-excerpt',
      label: 'Product Thinking',
      status: 'partial',
      evidence: [
        {
          kind: 'artifact',
          refId: 'draft-xyz',
          label: 'Roadmap Notes',
          excerpt: 'A phased plan from discovery to launch.',
        },
      ],
    },
  ];
  const { CapabilityMap } = require('../components/CapabilityMap') as typeof import('../components/CapabilityMap');
  const html = render(<CapabilityMap capabilities={caps} profile={SAMPLE_PROFILE} />);

  // The editor cross-ref renders…
  assert.match(html, /href="\/studio\?edit=xyz"/);
  // …same-tab (the draft anchor must not open a new tab).
  const draftAnchor = html.match(/<a[^>]*href="\/studio\?edit=xyz"[^>]*>/);
  assert.ok(draftAnchor, 'draft artifact must render an anchor');
  assert.doesNotMatch(draftAnchor![0], /target="_blank"/);
  // …and the grounded excerpt is still shown beside it.
  const text = visibleText(html);
  assert.match(text, /A phased plan from discovery to launch\./);
});

test('CapabilityMap uploaded (non-draft) artifact still uses the blob open button', () => {
  const caps: BeginnerCapability[] = [
    {
      id: 'cap-uploaded-artifact',
      label: 'Design',
      status: 'strong',
      evidence: [
        { kind: 'artifact', refId: 'artifact-real-blob', label: 'Portfolio PDF' },
      ],
    },
  ];
  const { CapabilityMap } = require('../components/CapabilityMap') as typeof import('../components/CapabilityMap');
  const html = render(<CapabilityMap capabilities={caps} profile={SAMPLE_PROFILE} />);

  // An uploaded artifact (no draft- prefix) keeps the blob-open button + Open ↗.
  assert.match(html, /<button[^>]*type="button"[^>]*>[\s\S]*?Portfolio PDF/);
  assert.match(html, /Open ↗/);
  // …and must NOT become an editor link.
  assert.doesNotMatch(html, /href="\/digital-me\?edit=/);
});

// ── Task 5: star-river + comets visualization ─────────────────────────────────

/** Count occurrences of a substring in the rendered markup. */
function count(html: string, needle: RegExp): number {
  const matches = html.match(needle);
  return matches ? matches.length : 0;
}

test('CapabilityMap renders one star node per capability (star-river)', () => {
  const { CapabilityMap } = require('../components/CapabilityMap') as typeof import('../components/CapabilityMap');
  const html = render(<CapabilityMap capabilities={SAMPLE_CAPABILITIES} profile={SAMPLE_PROFILE} />);

  // One star node per capability, marked by a stable data attribute.
  assert.equal(
    count(html, /data-star-node=/g),
    SAMPLE_CAPABILITIES.length,
    'expected one star node per capability',
  );
});

test('CapabilityMap renders the star-river SVG above the cards', () => {
  const { CapabilityMap } = require('../components/CapabilityMap') as typeof import('../components/CapabilityMap');
  const html = render(<CapabilityMap capabilities={SAMPLE_CAPABILITIES} profile={SAMPLE_PROFILE} />);

  const svgIdx = html.indexOf('data-star-river');
  const cardIdx = html.indexOf('data-status=');
  assert.ok(svgIdx >= 0, 'star-river container should be present');
  assert.ok(cardIdx >= 0, 'cards should still be present');
  assert.ok(svgIdx < cardIdx, 'star-river SVG must render above the cards list');
});

test('CapabilityMap renders a comet marker for a strong capability', () => {
  const { CapabilityMap } = require('../components/CapabilityMap') as typeof import('../components/CapabilityMap');
  const html = render(<CapabilityMap capabilities={SAMPLE_CAPABILITIES} profile={SAMPLE_PROFILE} />);

  // The strong capability becomes a comet — marked by a stable data attribute,
  // and the brand comet asset is referenced.
  assert.match(html, /data-comet=/);
  assert.match(html, /loom_lunar_comet_icon/);
});

test('CapabilityMap star nodes have an aria-label including the capability label', () => {
  const { CapabilityMap } = require('../components/CapabilityMap') as typeof import('../components/CapabilityMap');
  const html = render(<CapabilityMap capabilities={SAMPLE_CAPABILITIES} profile={SAMPLE_PROFILE} />);

  // Each star node is a focusable button with a descriptive aria-label.
  assert.match(html, /aria-label="Python Programming — strong, 2 evidence"/);
  assert.match(html, /aria-label="Data Analysis — partial, 1 evidence"/);
  assert.match(html, /aria-label="Machine Learning — direction, 0 evidence"/);

  // Star nodes are keyboard-focusable controls.
  assert.match(html, /role="button"[^>]*tabindex="0"|tabindex="0"[^>]*role="button"/);
});

test('CapabilityMap star magnitude scales with evidence (radius differs by strength)', () => {
  const { CapabilityMap } = require('../components/CapabilityMap') as typeof import('../components/CapabilityMap');
  const html = render(<CapabilityMap capabilities={SAMPLE_CAPABILITIES} profile={SAMPLE_PROFILE} />);

  // Collect the radii emitted on star magnitude circles (data-star-mag).
  const radii = Array.from(html.matchAll(/data-star-mag[^>]*\br="([\d.]+)"/g)).map((m) =>
    parseFloat(m[1]),
  );
  assert.ok(radii.length >= 2, 'expected magnitude circles for the stars');
  // Not all the same — magnitude must respond to evidence strength.
  const distinct = new Set(radii.map((r) => r.toFixed(2)));
  assert.ok(distinct.size > 1, 'star radii should vary with evidence strength');
});

test('CapabilityMap caps comets at 3 even with many strong capabilities', () => {
  const caps: BeginnerCapability[] = Array.from({ length: 6 }, (_, i) => ({
    id: `cap-strong-${i}`,
    label: `Strong Skill ${i}`,
    status: 'strong' as const,
    evidence: [
      { kind: 'experience' as const, refId: `exp-${i}`, label: `Org ${i}` },
      { kind: 'artifact' as const, refId: `artifact-${i}`, label: `Proof ${i}` },
    ],
  }));
  const { CapabilityMap } = require('../components/CapabilityMap') as typeof import('../components/CapabilityMap');
  const html = render(<CapabilityMap capabilities={caps} profile={SAMPLE_PROFILE} />);

  assert.ok(count(html, /data-comet=/g) <= 3, 'comets must be capped at 3');
  // But every capability still has a star node.
  assert.equal(count(html, /data-star-node=/g), caps.length);
});

test('CapabilityMap falls back to top-by-evidence comets when none are strong', () => {
  const caps: BeginnerCapability[] = [
    {
      id: 'cap-a',
      label: 'Alpha',
      status: 'partial',
      evidence: [
        { kind: 'work', refId: 'work-0', label: 'P1' },
        { kind: 'work', refId: 'work-1', label: 'P2' },
        { kind: 'experience', refId: 'exp-0', label: 'E1' },
      ],
    },
    {
      id: 'cap-b',
      label: 'Beta',
      status: 'partial',
      evidence: [{ kind: 'work', refId: 'work-2', label: 'P3' }],
    },
    {
      id: 'cap-c',
      label: 'Gamma',
      status: 'direction',
      evidence: [],
    },
  ];
  const { CapabilityMap } = require('../components/CapabilityMap') as typeof import('../components/CapabilityMap');
  const html = render(<CapabilityMap capabilities={caps} profile={SAMPLE_PROFILE} />);

  // No strong capability, but the richest-evidence one (Alpha) becomes a comet.
  assert.ok(count(html, /data-comet=/g) >= 1, 'expected a fallback comet');
});

test('CapabilityMap star-river has a moon (Memory) anchor and a horizon baseline', () => {
  const { CapabilityMap } = require('../components/CapabilityMap') as typeof import('../components/CapabilityMap');
  const html = render(<CapabilityMap capabilities={SAMPLE_CAPABILITIES} profile={SAMPLE_PROFILE} />);

  assert.match(html, /data-moon-anchor/);
  assert.match(html, /data-horizon/);
});

test('CapabilityMap star-river layout is deterministic across renders (SSR-stable)', () => {
  const { CapabilityMap } = require('../components/CapabilityMap') as typeof import('../components/CapabilityMap');
  const a = render(<CapabilityMap capabilities={SAMPLE_CAPABILITIES} profile={SAMPLE_PROFILE} />);
  const b = render(<CapabilityMap capabilities={SAMPLE_CAPABILITIES} profile={SAMPLE_PROFILE} />);
  assert.equal(a, b, 'two renders of the same input must produce identical markup');
});

test('CapabilityMap exposes a reduced-motion affordance for the star-river', () => {
  // The reduced-motion gating lives in the CSS module; assert the source block
  // exists so motion is provably gated behind prefers-reduced-motion.
  const fs = require('node:fs') as typeof import('node:fs');
  const path = require('node:path') as typeof import('node:path');
  const css = fs.readFileSync(
    path.join(__dirname, '../components/CapabilityMap.module.css'),
    'utf8',
  );
  // Idle motion must be gated behind no-preference (only runs when motion is OK),
  // and a reduce block must exist to strip any remaining transitions.
  assert.match(css, /prefers-reduced-motion:\s*no-preference/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});

test('CapabilityMap with empty capabilities renders no star nodes (still the prompt)', () => {
  const { CapabilityMap } = require('../components/CapabilityMap') as typeof import('../components/CapabilityMap');
  const html = render(<CapabilityMap capabilities={[]} profile={SAMPLE_PROFILE} />);
  const text = visibleText(html);

  // Still the Task-4 empty prompt.
  assert.match(text, /Build your capability map/);
  // No star-river SVG nodes.
  assert.doesNotMatch(html, /data-star-node=/);
  assert.doesNotMatch(html, /data-star-river/);
});
