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
import Module from 'node:module';

// CSS Modules: return a proxy so any className lookup is a no-op string.
const cssModuleClassMap = new Proxy(
  {},
  { get: (_target, className) => (typeof className === 'string' ? className : '') },
) as Record<string, string>;
const cssModuleExports = { __esModule: true, default: cssModuleClassMap };

require.extensions['.css'] = (module: { exports: typeof cssModuleExports }) => {
  module.exports = cssModuleExports;
};

// Dependency stubs (installed before the gated home is first require()'d). The
// default `/` is now the conversation-first cosmic cover (HomeGate → cover),
// which — like the chat client — calls useRouter() and renders next/link, neither
// of which is mounted in a bare renderToStaticMarkup. We stub next/navigation +
// next/link, and force a no-profile read so the cover (the new-user front door),
// not the returning-user /digital-me redirect, is what `/` paints. Mirrors the
// harness in home-cover.test.tsx. The owner components rendered below
// (HomeClient, DigitalMeRoleOSClient, ExampleBanner) tolerate these stubs:
// ExampleBanner's next/link still emits a plain <a href>, the others import no
// navigation hooks.
const _origRequire = (Module.prototype as NodeJS.Module).require as (id: string) => unknown;

(Module.prototype as NodeJS.Module).require = function stubRequire(
  this: NodeJS.Module,
  id: string,
): unknown {
  if (id === 'next/navigation') {
    return { useRouter: () => ({ push: () => undefined, replace: () => undefined }), usePathname: () => '/' };
  }
  if (id === 'next/link') {
    function LinkStub({
      href,
      children,
      className,
    }: {
      href: string;
      children: React.ReactNode;
      className?: string;
    }) {
      return React.createElement('a', { href, className }, children);
    }
    return { __esModule: true, default: LinkStub };
  }
  if (id.endsWith('profile-storage')) {
    return {
      readBeginnerProfileLocal: () => null,
      writeBeginnerProfileLocal: () => undefined,
      BEGINNER_PROFILE_KEY: 'loom:beginner-profile',
    };
  }
  return _origRequire.call(this, id);
} as typeof _origRequire;

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

test('ExampleBanner carries no build-CTA (beginner funnel retired)', () => {
  const { ExampleBanner } = require('../components/ExampleBanner') as typeof import('../components/ExampleBanner');
  const html = render(<ExampleBanner />);

  assert.doesNotMatch(html, /onboarding/);
  assert.doesNotMatch(html, /Build yours/);
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

// ---------------------------------------------------------------------------
// The DEFAULT `/` is the owner dossier (ONE-digital-me, owner 2026-07-08).
//
// The two-door funnel (HomeGate -> cosmic cover for strangers) was GTM-era
// product and is deleted: LOOM is a local-first single-owner app, so the
// front door renders the verified dossier directly — the same surface the
// native You window opens at /you.
// ---------------------------------------------------------------------------

test('/ renders the owner dossier front door (funnel retired)', () => {
  const { default: HomePage } = require('../app/page') as { default: React.ComponentType };
  const html = render(<HomePage />);
  const text = visibleText(html);

  // The verified owner dossier renders directly.
  assert.match(text, /Yiping Yin/);
  assert.match(html, /class="lcv-shell"/);
  assert.match(html, /class="lcv-ledger"/);

  // The retired funnel must be GONE from the default home.
  assert.doesNotMatch(html, /Type your answer/i);
  assert.doesNotMatch(html, /loom-cosmic-field/);
  assert.doesNotMatch(text, /Prefer a form\?/i);
});

test('/about renders the owner directly (beginner gate retired)', () => {
  const { default: AboutPage } = require('../app/about/page') as { default: React.ComponentType };
  const html = render(<AboutPage />);
  const text = visibleText(html);

  // ONE-digital-me: the owner IS the default; no stranger empty state.
  assert.match(text, /Yiping Yin/);
  assert.doesNotMatch(text, /This is your About page/);
  assert.doesNotMatch(html, /onboarding/);
});


test('default /education (courses authoring) and /experience (no profile) do not leak owner dossiers', () => {
  const { default: EducationPage } = require('../app/education/page') as {
    default: React.ComponentType;
  };
  const { default: ExperiencePage } = require('../app/experience/page') as {
    default: React.ComponentType;
  };

  // /education is now the schools & courses authoring home; it mounts client-side
  // (useSearchParams → CSR bailout), so the static render is a neutral Suspense
  // fallback. The guarantee that matters: it must NOT leak the owner's dossier.
  const eduHtml = render(<EducationPage />);
  const eduText = visibleText(eduHtml);
  assert.match(eduHtml, /edu-loading/);
  assert.doesNotMatch(eduText, /This is your Education page/);
  assert.doesNotMatch(eduText, /Evidence files/);
  assert.doesNotMatch(eduText, /UNSW courses/);

  // /experience renders the owner directly (beginner gate retired).
  const expHtml = render(<ExperiencePage />);
  const expText = visibleText(expHtml);
  assert.doesNotMatch(expText, /This is your Experience page/);
  assert.doesNotMatch(expHtml, /onboarding/);
});
