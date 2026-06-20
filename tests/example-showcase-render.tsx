/**
 * Contract tests for the /example and /example/digital-me showcase routes.
 *
 * These are purely ADDITIVE checks (F2 step 1): they verify that the owner
 * dossier renders under the /example prefix and that the ExampleBanner CTA
 * points to /onboarding/profile. They do NOT modify any existing owner route.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';

// CSS Modules: return a proxy so any className lookup is a no-op string.
const cssModuleClassMap = new Proxy(
  {},
  { get: (_target, className) => (typeof className === 'string' ? className : '') },
) as Record<string, string>;
const cssModuleExports = { __esModule: true, default: cssModuleClassMap };

require.extensions['.css'] = (module: { exports: typeof cssModuleExports }) => {
  module.exports = cssModuleExports;
};

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

// ---------------------------------------------------------------------------
// ExampleBanner — unit tests
// ---------------------------------------------------------------------------

test('ExampleBanner renders the showcase label text', () => {
  const { ExampleBanner } = require('../components/ExampleBanner') as typeof import('../components/ExampleBanner');
  const html = render(<ExampleBanner />);
  const text = visibleText(html);

  assert.match(text, /Example LOOM/);
  assert.match(text, /finished LOOM/);
});

test('ExampleBanner CTA links to /onboarding/profile', () => {
  const { ExampleBanner } = require('../components/ExampleBanner') as typeof import('../components/ExampleBanner');
  const html = render(<ExampleBanner />);

  assert.match(html, /href="\/onboarding\/profile"/);
  assert.match(html, /Build yours/);
});

test('ExampleBanner has aria-label for accessibility', () => {
  const { ExampleBanner } = require('../components/ExampleBanner') as typeof import('../components/ExampleBanner');
  const html = render(<ExampleBanner />);

  assert.match(html, /aria-label="Example LOOM showcase"/);
});

// ---------------------------------------------------------------------------
// /example page — renders owner HomeClient + ExampleBanner
// ---------------------------------------------------------------------------

test('/example page renders owner dossier markers', () => {
  const { ExampleBanner } = require('../components/ExampleBanner') as typeof import('../components/ExampleBanner');
  const { HomeClient } = require('../app/HomeClient') as typeof import('../app/HomeClient');
  const html = render(
    <>
      <ExampleBanner />
      <HomeClient />
    </>,
  );
  const text = visibleText(html);

  // Owner identity markers (from HomeClient → VerifiedDossierHome).
  assert.match(text, /Yiping Yin/);
  assert.match(text, /About/);
  assert.match(text, /Education/);
  assert.match(text, /Experience/);
  assert.match(text, /Digital Me/);
});

test('/example page banner CTA links to /onboarding/profile', () => {
  const { ExampleBanner } = require('../components/ExampleBanner') as typeof import('../components/ExampleBanner');
  const { HomeClient } = require('../app/HomeClient') as typeof import('../app/HomeClient');
  const html = render(
    <>
      <ExampleBanner />
      <HomeClient />
    </>,
  );

  assert.match(html, /href="\/onboarding\/profile"/);
  assert.match(html, /Build yours/);
});

test('/example page renders the owner ledger cover shell', () => {
  const { ExampleBanner } = require('../components/ExampleBanner') as typeof import('../components/ExampleBanner');
  const { HomeClient } = require('../app/HomeClient') as typeof import('../app/HomeClient');
  const html = render(
    <>
      <ExampleBanner />
      <HomeClient />
    </>,
  );

  // The lcv-shell class identifies the Home v12 ledger cover (HomeClient contract).
  assert.match(html, /class="lcv-shell"/);
  assert.match(html, /class="lcv-ledger"/);
});

// ---------------------------------------------------------------------------
// /example/digital-me page — renders owner DigitalMeRoleOSClient + ExampleBanner
// ---------------------------------------------------------------------------

test('/example/digital-me page renders Role-OS markers', () => {
  const { ExampleBanner } = require('../components/ExampleBanner') as typeof import('../components/ExampleBanner');
  const DigitalMeRoleOSClient = (require('../app/digital-me/DigitalMeRoleOSClient') as { default: React.ComponentType }).default;
  const html = render(
    <>
      <ExampleBanner />
      <DigitalMeRoleOSClient />
    </>,
  );
  const text = visibleText(html);

  // Owner Role-OS surface markers (from DigitalMeRoleOSClient).
  assert.match(text, /Digital Me/);
  // The Ask widget section is always rendered.
  assert.match(html, /ask-yiping/i);
});

test('/example/digital-me page banner CTA links to /onboarding/profile', () => {
  const { ExampleBanner } = require('../components/ExampleBanner') as typeof import('../components/ExampleBanner');
  const DigitalMeRoleOSClient = (require('../app/digital-me/DigitalMeRoleOSClient') as { default: React.ComponentType }).default;
  const html = render(
    <>
      <ExampleBanner />
      <DigitalMeRoleOSClient />
    </>,
  );

  assert.match(html, /href="\/onboarding\/profile"/);
  assert.match(html, /Build yours/);
});

// ---------------------------------------------------------------------------
// product-shell.ts — /example prefix is registered as internal
// ---------------------------------------------------------------------------

test('product-shell registers /example as an internal route prefix', () => {
  const { NEW_LOOM_INTERNAL_ROUTE_PREFIXES } = require('../lib/new-loom/product-shell') as typeof import('../lib/new-loom/product-shell');

  const prefixes = NEW_LOOM_INTERNAL_ROUTE_PREFIXES as readonly string[];
  assert.ok(
    prefixes.includes('/example'),
    '/example must be registered in NEW_LOOM_INTERNAL_ROUTE_PREFIXES',
  );
});
