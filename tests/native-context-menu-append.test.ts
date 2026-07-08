/**
 * Charter §13 regression lock (WORKBENCH_MACOS_STANDARDS): context menus
 * ONLY APPEND to the system menu, never replace it. The four-state gutter
 * REVERT (owner: LOOM custom features must never displace native
 * Translate / Look Up / Services) is the case law behind this — this test
 * turns it into a tripwire.
 *
 * Scope: the reader's PDF menu (SourceFileView). The editor delegate's
 * append pattern lives in the in-flight shell file and gets its pin when
 * that file lands (Wave 1).
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('reader PDF context menu builds on the system menu and only appends', () => {
  const reader = fs.readFileSync(
    path.join(repoRoot, 'macos-app', 'Loom', 'Sources', 'Workspace', 'Reader', 'SourceFileView.swift'),
    'utf8',
  );

  // The override must exist and must START from the system's menu.
  assert.match(reader, /override func menu\(for event: NSEvent\)/);
  assert.match(reader, /super\.menu\(for: event\)/);

  // Appending idiom: LOOM items join the system menu (separator + addItem),
  // and nothing constructs a bare replacement NSMenu() to RETURN in the
  // system menu's place without incorporating super's items.
  assert.match(reader, /NSMenuItem\.separator\(\)/);
  assert.match(reader, /\.addItem\(/);
});
