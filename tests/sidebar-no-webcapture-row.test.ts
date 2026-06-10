import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * docs/loom.md §VII.bis migration: the Web Capture sidebar surface was
 * dismantled. Setup content lives in Settings > Capture
 * (CaptureSettingsView) and Help > Set Up Captures…
 * (CaptureHelpView). The sidebar no longer has a Web Capture row.
 *
 * Superseded in part by tests/new-loom-skeleton-contract.test.ts
 * (2026-06 new-Loom shell): the minimal root keeps a `.webCaptureSetup`
 * compatibility deep-link case that mounts the Sources workbench (it is
 * NOT a sidebar row), and CapturesView defines `WebCaptureSetupView` as
 * the capture-tools workbench lane layout. The invariant this file
 * still pins: no Web Capture sidebar row, ever.
 */

const MINIMAL_ROOT = resolve('macos-app/Loom/Sources/LoomMinimalRootView.swift');
const CAPTURES = resolve('macos-app/Loom/Sources/CapturesView.swift');
const CAPTURE_SETTINGS = resolve('macos-app/Loom/Sources/CaptureSettingsView.swift');
const CAPTURE_HELP = resolve('macos-app/Loom/Sources/CaptureHelpView.swift');

test('LoomMinimalRootView.swift no longer renders a Web Capture sidebar row', () => {
  const text = readFileSync(MINIMAL_ROOT, 'utf-8');
  const forbidden = [
    'webCaptureSetupRow',
    'WebCaptureSetupView',
    '"Web Capture"',
    "'__webcapture'",
    '"__webcapture"',
  ];
  for (const needle of forbidden) {
    assert.equal(
      text.includes(needle),
      false,
      `Found forbidden token "${needle}" in LoomMinimalRootView.swift — ` +
        `per docs/loom.md §VII.bis the Web Capture sidebar surface is dismantled; ` +
        `capture setup content lives in Settings > Capture and Help > Set Up Captures…`,
    );
  }
});

test('CapturesView.swift keeps WebCaptureSetupView as a workbench lane layout, not a sidebar surface', () => {
  const text = readFileSync(CAPTURES, 'utf-8');
  assert.equal(
    text.includes('struct WebCaptureSetupView'),
    true,
    'WebCaptureSetupView is the capture-tools workbench layout required by the new-Loom skeleton contract',
  );
});

test('CaptureSettingsView and CaptureHelpView exist with their structs', () => {
  const settings = readFileSync(CAPTURE_SETTINGS, 'utf-8');
  const help = readFileSync(CAPTURE_HELP, 'utf-8');
  assert.ok(settings.includes('struct CaptureSettingsView'), 'CaptureSettingsView struct missing');
  assert.ok(help.includes('struct CaptureHelpView'), 'CaptureHelpView struct missing');
  assert.ok(help.includes('enum CaptureHelpWindow'), 'CaptureHelpWindow enum missing');
});
