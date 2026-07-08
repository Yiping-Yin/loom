import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(relativePath: string) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('main Loom window disables automatic tabbing so the system title pill does not reappear', () => {
  // Post-partition homes: the app scene lives at App/Shell/LoomApp.swift and
  // the window styler was extracted to App/Shell/WindowConfigurator.swift.
  const appSource = read('macos-app/Loom/Sources/App/Shell/LoomApp.swift');
  const contentSource = read('macos-app/Loom/Sources/App/Shell/WindowConfigurator.swift');

  assert.match(appSource, /Window\("Loom"/);
  assert.doesNotMatch(appSource, /WindowGroup \{/);
  assert.match(appSource, /NSWindow\.allowsAutomaticWindowTabbing = false/);
  assert.match(contentSource, /window\.tabbingMode = \.disallowed/);
  assert.match(contentSource, /tabGroup\?\.isTabBarVisible == true/);
  assert.match(contentSource, /window\.toggleTabBar\(nil\)/);
  // Glass law (2026-07-03): the window INHERITS the system appearance —
  // the old isNight pin locked the workbench out of the system day/night
  // switch (pinned window -> colorScheme stays dark -> pinned forever).
  assert.match(contentSource, /window\.appearance = nil/);
  assert.doesNotMatch(contentSource, /window\.appearance = NSAppearance\(named:/);
  assert.match(contentSource, /window\.title = "Loom"/);
  assert.doesNotMatch(contentSource, /window\.title = title/);
});
