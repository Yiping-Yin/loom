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
  assert.match(text, /Loom reads your experience/);

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
