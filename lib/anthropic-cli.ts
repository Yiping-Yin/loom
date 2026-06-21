/**
 * Local CLI transport for runAnthropicHttp — routes the model call through the
 * `claude` CLI (Claude Code) in headless print mode instead of the HTTP Messages
 * API. Claude Code runs on your SUBSCRIPTION, so this validates LOOM's LLM
 * features locally WITHOUT consuming API credits.
 *
 * Activated only when LOOM_LLM_BACKEND=cli (set by `npm run llm:smoke -- --cli`).
 * The deploy NEVER sets it — the web/app paths use the HTTP Messages API.
 *
 * Caveats (this is local validation, not a pristine eval):
 *   - The spawned `claude` runs from a temp cwd to avoid the repo's CLAUDE.md,
 *     but your GLOBAL ~/.claude memory still loads as background context (mild).
 *     For a fully clean signal, use the HTTP API (a few cents of credit).
 *   - It is the full Claude Code agent in print mode (slower than a raw API call).
 *   - The model is whatever you pass via --model (Sonnet by default, matching prod).
 */
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';

const DEFAULT_TIMEOUT_MS = 180000;
const NEUTRAL_SYSTEM =
  'You are a precise assistant. Follow the user instructions exactly and output ' +
  'only what they ask for — no preamble, no commentary, and do not use any tools.';

export async function runViaClaudeCli(
  prompt: string,
  opts: { model?: string; timeoutMs?: number; onChunk?: (chunk: string) => void } = {},
): Promise<string> {
  const bin = process.env.LOOM_LLM_CLI?.trim() || 'claude';
  const model = opts.model?.trim() || 'sonnet';
  const args = ['-p', '--model', model, '--output-format', 'text', '--system-prompt', NEUTRAL_SYSTEM];

  return new Promise<string>((resolve, reject) => {
    const child = spawn(bin, args, { cwd: tmpdir(), stdio: ['pipe', 'pipe', 'pipe'] });
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
      if (code !== 0) {
        reject(new Error(`${bin} -p exited with code ${code}: ${err.trim().slice(0, 400)}`));
        return;
      }
      const text = out.trim();
      if (opts.onChunk && text) {
        try {
          opts.onChunk(text);
        } catch {
          /* ignore */
        }
      }
      resolve(text);
    });

    child.stdin.write(prompt);
    child.stdin.end();
  });
}
