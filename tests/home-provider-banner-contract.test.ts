import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

test('AI key missing banner does not render on public presentation pages', () => {
  const source = readFileSync(resolve('components/AiKeyMissingBanner.tsx'), 'utf8');

  assert.match(source, /function isPresentationPath\(pathname: string\)/);
  assert.match(source, /pathname === ['"]\/['"]/);
  assert.match(source, /pathname === ['"]\/sources['"]/);
  assert.match(source, /pathname === ['"]\/loom['"]/);
  // (Dead-route suppressions pruned with web-retirement 5/7.)
  for (const supportPath of [
    '/offline',
    '/doc',
    '/panel',
  ]) {
    assert.match(source, new RegExp(`pathname === ['"]${supportPath.replace('/', '\\/')}['"]`));
  }
  assert.match(source, /pathname\.startsWith\(['"]\/panel\/['"]\)/);
  assert.match(source, /pathname === ['"]\/about['"]/);
  assert.match(source, /const shouldShow = visible && !isPresentationPath\(pathname\) && !isReadingPath\(pathname\)/);
  assert.match(source, /position: 'fixed'/);
  assert.match(source, /className="loom-ai-key-banner"/);
  assert.match(source, /data-ai-key-banner="true"/);
  assert.match(source, /bottom: 'max\(0\.75rem, env\(safe-area-inset-bottom\)\)'/);
  assert.match(source, /maxWidth: 'min\(25rem, calc\(100vw - 2rem\)\)'/);
  assert.match(source, /boxSizing: 'border-box'/);
  assert.match(source, /className="loom-ai-key-banner__copy"/);
  assert.match(source, /whiteSpace: 'nowrap'/);
  assert.match(source, /textOverflow: 'ellipsis'/);
  assert.match(source, /backdropFilter: 'blur\(22px\) saturate\(118%\)'/);
  assert.match(source, /AI off\. Add a key in Settings; Sources and Draft still work\./);
  assert.doesNotMatch(source, /loomAiKeyBanner/);
  assert.doesNotMatch(source, /--loom-ai-key-banner-offset/);
});
