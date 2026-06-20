/**
 * Local LLM smoke / quality harness.
 *
 * Runs LOOM's REAL routes — extract → merge → derive-capabilities → ask — against
 * a sample (or a `--resume` text file) and prints the structured output so you can
 * eyeball the keyed-quality gate that offline tests can't prove:
 *   - extraction faithful?  (no invented entries; correct section mapping)
 *   - capabilities earn real status?  (strong = backed by an artifact = a comet)
 *   - the cited answer is grounded?  (citations resolve; refuses when unsupported)
 *
 * It calls the same code that ships — the route handlers are plain async
 * functions. No browser, no deploy; the credential never touches the deploy.
 *
 * Credential — use your Anthropic account, no static key needed (run once):
 *   ant auth login
 *   eval "$(ant auth print-credentials --env)"    # sets ANTHROPIC_AUTH_TOKEN
 * Then:
 *   npm run llm:smoke
 *   npm run llm:smoke -- --resume ./my-resume.txt --question "What can they do?"
 *
 * A plain ANTHROPIC_API_KEY exported in the shell also works. The token is
 * short-lived; re-run the `eval` line if a call fails with an auth error.
 *
 * NOTE: extraction takes plain TEXT (the browser turns a PDF into text before
 * calling the route). Pass a .txt/.md résumé to `--resume`, not a raw PDF.
 */

import { readFileSync } from 'node:fs';

import { POST as extractPost } from '../app/api/extract-profile/route';
import { POST as derivePost } from '../app/api/derive-capabilities/route';
import { POST as askPost } from '../app/api/ask/route';
import { isAnthropicConfigured } from '../lib/anthropic-http';
import { mergeExtractedProfile } from '../lib/profile/merge-extracted-profile';
import { emptyBeginnerProfile, type BeginnerProfile } from '../lib/profile/beginner-profile';
import type { BeginnerCapability } from '../lib/capability/capability-graph';

const API_BASE = 'http://localhost';

const SAMPLE_RESUME = `Lin Wei
Junior Software Developer · Sydney, Australia
lin.wei.dev@example.com · github.com/linwei-dev

Summary
Recent computer science graduate who likes turning messy data into small, useful
tools. Comfortable shipping full-stack features and writing tests.

Education
University of New South Wales — BSc Computer Science, 2021–2024
Relevant coursework: Data Structures & Algorithms, Databases, Operating Systems,
Machine Learning. Graduated with distinction; final-year project on time-series
anomaly detection.

Experience
Software Engineering Intern — Atlassian, Nov 2023 – Feb 2024
- Built a React dashboard that surfaced flaky-test trends across 200+ CI pipelines.
- Wrote a Python service that ingested test logs and computed retry statistics.
- Added integration tests that caught two regressions before release.

Teaching Assistant — UNSW School of CSE, 2022 – 2023
- Ran weekly lab sessions for 30 first-year students learning Python.
- Marked assignments and gave written feedback on code style and correctness.

Projects
Anomaly Radar — a time-series anomaly detector (Python, scikit-learn) that flags
unusual patterns in server metrics and visualises results with matplotlib.
Open-sourced on GitHub with a small test suite.

Skills
Python, JavaScript/TypeScript, React, SQL, Git, data analysis, unit testing.`;

const DEFAULT_QUESTION =
  'What are this person’s strongest skills, and what have they actually built?';

async function callRoute(
  handler: (req: Request) => Promise<Response>,
  path: string,
  body: unknown,
): Promise<Response> {
  return handler(
    new Request(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
}

/** Read a `--name value` CLI flag (works with `npm run llm:smoke -- --name v`). */
function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

type AskResult = {
  answer: string;
  citations: Array<Record<string, unknown>>;
  error: string | null;
};

/** Parse the ask route's SSE body ({delta} … {done,citations} | {error}). */
function parseAskSse(text: string): AskResult {
  let answer = '';
  let citations: Array<Record<string, unknown>> = [];
  let error: string | null = null;
  for (const block of text.split('\n\n')) {
    const line = block
      .split('\n')
      .map((l) => l.trim())
      .find((l) => l.startsWith('data:'));
    if (!line) continue;
    const json = line.slice(5).trim();
    if (!json || json === '[DONE]') continue;
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(json) as Record<string, unknown>;
    } catch {
      continue;
    }
    if (typeof payload.delta === 'string') answer += payload.delta;
    if (payload.done && Array.isArray(payload.citations)) {
      citations = payload.citations as Array<Record<string, unknown>>;
    }
    if (typeof payload.error === 'string') error = payload.error;
  }
  return { answer, citations, error };
}

function printProfile(p: BeginnerProfile): void {
  console.log(`  name:     ${p.home.name || '(none)'}`);
  console.log(`  headline: ${p.home.headline || '(none)'}`);
  if (p.about.summary) console.log(`  summary:  ${p.about.summary}`);
  console.log(`  education (${p.education.length}):`);
  for (const e of p.education) {
    console.log(`    • ${[e.qualification, e.field, e.institution].filter(Boolean).join(' — ')}`);
  }
  console.log(`  experience (${p.experience.length}):`);
  for (const x of p.experience) {
    console.log(`    • ${[x.role, x.organization].filter(Boolean).join(' @ ')}`);
    for (const b of x.bullets) console.log(`        – ${b}`);
  }
  console.log(`  works (${p.works.length}):`);
  for (const w of p.works) {
    console.log(`    • ${w.title}${w.description ? ` — ${w.description}` : ''}`);
  }
  console.log(`  artifacts (${(p.artifacts ?? []).length})`);
}

function printCapabilities(caps: BeginnerCapability[]): void {
  const strong = caps.filter((c) => c.status === 'strong').length;
  console.log(`  ${caps.length} capabilities · ${strong} strong (comets):`);
  for (const c of caps) {
    const mark = c.status === 'strong' ? '☄' : c.status === 'partial' ? '◐' : '·';
    console.log(`    ${mark} [${c.status}] ${c.label}  (id: ${c.id})`);
    for (const ev of c.evidence) console.log(`        ← ${ev.kind}:${ev.refId} (${ev.label})`);
    if (c.note) console.log(`        note: ${c.note}`);
    if (c.growth) console.log(`        growth: ${c.growth}`);
  }
}

function printCitations(citations: Array<Record<string, unknown>>): void {
  if (citations.length === 0) {
    console.log('  citations: (none)');
    return;
  }
  console.log(`  citations (${citations.length}):`);
  for (const c of citations) {
    const id = c.artifactId ?? c.id ?? '?';
    const title = c.title ?? c.label ?? '';
    const href = c.href ?? '';
    console.log(`    [${String(id)}] ${String(title)}${href ? ` → ${String(href)}` : ''}`);
  }
}

async function main(): Promise<void> {
  if (!isAnthropicConfigured()) {
    console.error(
      [
        'No Anthropic credential found.',
        '',
        'Use your Anthropic account (no static key needed):',
        '  ant auth login',
        '  eval "$(ant auth print-credentials --env)"   # sets ANTHROPIC_AUTH_TOKEN',
        '',
        'Then re-run:  npm run llm:smoke',
        '(A plain ANTHROPIC_API_KEY exported in the shell also works.)',
      ].join('\n'),
    );
    process.exitCode = 1;
    return;
  }

  const credLabel = process.env.ANTHROPIC_API_KEY?.trim()
    ? 'ANTHROPIC_API_KEY (x-api-key)'
    : 'ANTHROPIC_AUTH_TOKEN (OAuth bearer via ant)';
  const resumePath = arg('resume');
  const resumeText = resumePath ? readFileSync(resumePath, 'utf8') : SAMPLE_RESUME;
  const question = arg('question') ?? DEFAULT_QUESTION;

  console.log(`LOOM LLM smoke — credential: ${credLabel}`);
  console.log(`Résumé source: ${resumePath ?? '(built-in sample)'}  (${resumeText.length} chars)\n`);

  // ── 1. Extract ────────────────────────────────────────────────────────────
  console.log('━━━ 1. EXTRACT  (POST /api/extract-profile) ━━━');
  let profile: BeginnerProfile = emptyBeginnerProfile();
  try {
    const res = await callRoute(extractPost, '/api/extract-profile', { text: resumeText });
    const data = (await res.json()) as {
      ok?: boolean;
      configured?: boolean;
      profile?: BeginnerProfile;
    };
    if (data.configured === false) {
      console.log('  → route reported not configured (no credential reached the route).');
    } else if (data.ok && data.profile) {
      profile = mergeExtractedProfile(emptyBeginnerProfile(), data.profile);
      printProfile(profile);
    } else {
      console.log('  → extraction failed (ok:false) — the model output did not parse.');
    }
  } catch (err) {
    console.log(`  ✗ extract error: ${errMsg(err)}`);
  }

  // ── 2. Derive capabilities ────────────────────────────────────────────────
  console.log('\n━━━ 2. CAPABILITIES  (POST /api/derive-capabilities) ━━━');
  try {
    const res = await callRoute(derivePost, '/api/derive-capabilities', { profile });
    const data = (await res.json()) as {
      ok?: boolean;
      configured?: boolean;
      capabilities?: BeginnerCapability[];
    };
    if (data.ok && data.capabilities) {
      printCapabilities(data.capabilities);
    } else if (data.configured === false) {
      console.log('  → route reported not configured.');
    } else {
      console.log('  → derivation failed (ok:false).');
    }
  } catch (err) {
    console.log(`  ✗ derive error: ${errMsg(err)}`);
  }

  // ── 3. Cited answer ───────────────────────────────────────────────────────
  console.log('\n━━━ 3. CITED ANSWER  (POST /api/ask) ━━━');
  console.log(`  Q: ${question}`);
  try {
    const res = await callRoute(askPost, '/api/ask', { question, profile });
    const ctype = res.headers.get('content-type') ?? '';
    if (ctype.includes('text/event-stream')) {
      const { answer, citations, error } = parseAskSse(await res.text());
      if (error) {
        console.log(`  ✗ ask stream error: ${error}`);
      } else {
        console.log(`\n  A: ${answer.trim() || '(empty)'}\n`);
        printCitations(citations);
      }
    } else {
      const data = (await res.json()) as {
        configured?: boolean;
        grounded?: boolean;
        reason?: string;
        citations?: Array<Record<string, unknown>>;
      };
      if (data.configured === false) {
        console.log('  → route reported not configured.');
      } else if (data.grounded === false) {
        console.log(
          `  → refused to answer (grounded:false, reason: ${data.reason}). ` +
            'This is the moat working: no citeable sources for this profile.',
        );
        printCitations(data.citations ?? []);
      } else {
        console.log(`  → unexpected JSON: ${JSON.stringify(data).slice(0, 300)}`);
      }
    }
  } catch (err) {
    console.log(`  ✗ ask error: ${errMsg(err)}`);
  }

  console.log(
    '\nDone. Eyeball — extraction faithful? capabilities backed by real proof? ' +
      'answer grounded with resolvable citations (or an honest refusal)?',
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
