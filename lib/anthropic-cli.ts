/**
 * Local CLI transport for runAnthropicHttp — routes the model call through the
 * `claude` CLI (Claude Code) in headless print mode instead of the HTTP Messages
 * API. Claude Code runs on your SUBSCRIPTION, so this validates LOOM's LLM
 * features locally WITHOUT consuming API credits.
 *
 * Activated only when LOOM_LLM_BACKEND=cli (set by `npm run llm:smoke -- --cli`).
 * The deploy NEVER sets it — the web/app paths use the HTTP Messages API.
 *
 * `claude -p` is the full agent and is not perfectly reliable for back-to-back
 * programmatic calls (occasional non-zero exits / empty output, e.g. transient
 * throttling or contention with an open interactive Claude Code session), so each
 * call retries a few times with backoff. Set LOOM_LLM_DEBUG=1 to dump raw output.
 *
 * Caveats (this is local validation, not a pristine eval):
 *   - The spawned `claude` runs from a temp cwd to avoid the repo's CLAUDE.md,
 *     but your GLOBAL ~/.claude memory still loads as background context (mild).
 *   - It is the full Claude Code agent in print mode (slower than a raw API call).
 */
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';

const DEFAULT_TIMEOUT_MS = 180000;
const MAX_ATTEMPTS = 3;
// `claude -p` is the full agent; without a firm instruction it tends to wrap
// structured output in prose ("Here's the profile:" + ```json fences + trailing
// commentary), which breaks the routes' JSON parsers. This forces a raw artifact.
const NEUTRAL_SYSTEM =
  'You are a precise execution engine, not a conversational assistant. Follow the ' +
  'user instructions EXACTLY and output ONLY the artifact they ask for. If the ' +
  'instructions ask for JSON, output a single raw JSON value and nothing else — no ' +
  'markdown code fences, no preamble, no trailing commentary, no explanation. ' +
  'Never ask clarifying questions. Never use tools.';

type CliOpts = { model?: string; timeoutMs?: number; onChunk?: (chunk: string) => void };

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** One `claude -p` attempt. Rejects on spawn error, timeout, non-zero exit, or empty output. */
function attemptClaudeCli(prompt: string, opts: CliOpts): Promise<string> {
  const bin = process.env.LOOM_LLM_CLI?.trim() || 'claude';
  const model = opts.model?.trim() || 'sonnet';
  const args = [
    '-p',
    '--model', model,
    '--output-format', 'text',
    '--system-prompt', NEUTRAL_SYSTEM,
    '--no-session-persistence',
  ];

  // Force subscription auth: strip any inherited API credentials so `claude` uses
  // its own logged-in account (keychain/subscription), NOT an ANTHROPIC_AUTH_TOKEN
  // / ANTHROPIC_API_KEY the user may have exported into their shell — e.g. an
  // `ant auth print-credentials --env` token points at a (possibly credit-empty)
  // API org, which makes `claude -p` fail with "Credit balance is too low".
  const childEnv: NodeJS.ProcessEnv = { ...process.env };
  delete childEnv.ANTHROPIC_API_KEY;
  delete childEnv.ANTHROPIC_AUTH_TOKEN;
  delete childEnv.ANTHROPIC_BASE_URL;

  return new Promise<string>((resolve, reject) => {
    const child = spawn(bin, args, { cwd: tmpdir(), env: childEnv, stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`${bin} -p timed out after ${opts.timeoutMs ?? DEFAULT_TIMEOUT_MS}ms`));
    }, opts.timeoutMs ?? DEFAULT_TIMEOUT_MS);

    child.stdout.on('data', (d: Buffer) => {
      out += d.toString();
    });
    child.stderr.on('data', (d: Buffer) => {
      err += d.toString();
    });
    child.on('error', (e: Error) => {
      clearTimeout(timer);
      reject(new Error(`Failed to run "${bin}" (is Claude Code installed and logged in?): ${e.message}`));
    });
    child.on('close', (code: number | null) => {
      clearTimeout(timer);
      const text = out.trim();
      if (process.env.LOOM_LLM_DEBUG) {
        process.stderr.write(
          `\n[llm cli] exit=${code}, stdout(${text.length} chars):\n${text.slice(0, 2000)}\n` +
            (err.trim() ? `[llm cli] stderr:\n${err.trim().slice(0, 1000)}\n` : '') +
            '\n',
        );
      }
      if (code !== 0) {
        // `claude -p` errors often land on stdout, not stderr — surface both.
        reject(new Error(`${bin} -p exited with code ${code}: ${(err.trim() || text || '(no output)').slice(0, 500)}`));
        return;
      }
      if (!text) {
        reject(new Error(`${bin} -p returned empty output`));
        return;
      }
      resolve(text);
    });

    child.stdin.write(prompt);
    child.stdin.end();
  });
}

export async function runViaClaudeCli(prompt: string, opts: CliOpts = {}): Promise<string> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const text = await attemptClaudeCli(prompt, opts);
      if (opts.onChunk) {
        try {
          opts.onChunk(text);
        } catch {
          /* ignore */
        }
      }
      return text;
    } catch (e) {
      lastErr = e;
      if (process.env.LOOM_LLM_DEBUG) {
        process.stderr.write(`[llm cli] attempt ${attempt}/${MAX_ATTEMPTS} failed: ${e instanceof Error ? e.message : String(e)}\n`);
      }
      if (attempt < MAX_ATTEMPTS) await delay(1500 * attempt);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}
