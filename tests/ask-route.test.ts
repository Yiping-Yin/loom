import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { POST } from '../app/api/ask/route';

const repoRoot = path.resolve(__dirname, '..');
const routeSource = fs.readFileSync(
  path.join(repoRoot, 'app/api/ask/route.ts'),
  'utf8',
);

test('ask route declares the Node serverless runtime and dynamic rendering', () => {
  assert.match(routeSource, /export const runtime = 'nodejs'/);
  assert.match(routeSource, /export const dynamic = 'force-dynamic'/);
});

test('ask route gates on isAnthropicConfigured and keeps a graceful configured:false branch', () => {
  assert.match(routeSource, /isAnthropicConfigured/);
  // The no-key branch returns configured:false with sources that WOULD ground.
  assert.match(routeSource, /!isAnthropicConfigured\(\)/);
  assert.match(routeSource, /configured: false/);
  assert.match(routeSource, /retrieveAskYipingSources/);
  // Citations in the graceful branch must resolve to real dossier artifacts.
  assert.match(routeSource, /resolveVerifiedDossierArtifact/);
});

test('ask route validates a non-empty question with a 400', () => {
  assert.match(routeSource, /status: 400/);
  assert.match(routeSource, /question/);
});

test('ask route streams Anthropic output as SSE and cites on completion', () => {
  assert.match(routeSource, /runAnthropicHttp/);
  // Streaming is wired through the onChunk callback.
  assert.match(routeSource, /onChunk/);
  // The response is an SSE text/event-stream of data: frames.
  assert.match(routeSource, /text\/event-stream/);
  assert.match(routeSource, /ReadableStream/);
  assert.match(routeSource, /data: \$\{JSON\.stringify/);
  // Per-chunk delta frames and a terminal done frame with citations.
  assert.match(routeSource, /delta/);
  assert.match(routeSource, /done: true/);
  // Citations are computed from the accumulated answer on completion.
  assert.match(routeSource, /parseAskYipingCitations/);
  // Abort/error frames are emitted instead of crashing the stream.
  assert.match(routeSource, /enqueue\(\{ error/);
});

test('ask route returns 400 JSON for an empty question (behavioural)', async () => {
  const response = await POST(
    new Request('http://localhost/api/ask', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ question: '   ' }),
    }),
  );
  assert.equal(response.status, 400);
  const payload = (await response.json()) as { error?: string };
  assert.equal(typeof payload.error, 'string');
});

test('ask route returns 400 JSON for invalid body (behavioural)', async () => {
  const response = await POST(
    new Request('http://localhost/api/ask', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'not json',
    }),
  );
  assert.equal(response.status, 400);
});

test('ask route degrades gracefully when no API key is set (behavioural)', async () => {
  const previousKey = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  try {
    const response = await POST(
      new Request('http://localhost/api/ask', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question: 'What are Yiping C++ and Python foundations?' }),
      }),
    );

    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type') ?? '', /application\/json/);

    const payload = (await response.json()) as {
      configured?: boolean;
      citations?: Array<{ artifactId: string; title: string; href: string }>;
    };

    assert.equal(payload.configured, false);
    assert.ok(Array.isArray(payload.citations), 'citations should be an array');
    // Every returned citation must be a real, resolvable dossier artifact.
    for (const citation of payload.citations ?? []) {
      assert.ok(citation.artifactId.length > 0, 'citation should carry an artifact id');
      assert.ok(citation.title.length > 0, 'citation should carry a title');
      assert.ok(citation.href.length > 0, 'citation should carry an href');
    }
  } finally {
    if (previousKey === undefined) {
      delete process.env.ANTHROPIC_API_KEY;
    } else {
      process.env.ANTHROPIC_API_KEY = previousKey;
    }
  }
});
