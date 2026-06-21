import type { ValidateResult } from '../../app/api/validate-answer/route';
import type { AnswerField } from './assess-answer';

/** Calls /api/validate-answer; fails open to {verdict:'accept'} (no key, 404, network, parse). */
export async function validateAnswerRemote(
  field: AnswerField,
  question: string,
  answer: string,
): Promise<ValidateResult> {
  try {
    const res = await fetch('/api/validate-answer', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ field, question, answer }),
    });
    if (!res.ok) return { verdict: 'accept' };
    const data = (await res.json().catch(() => null)) as
      | { configured?: boolean; verdict?: string; cleaned?: string; hint?: string }
      | null;
    if (!data || data.configured === false) return { verdict: 'accept' };
    if (data.verdict === 'clean' && typeof data.cleaned === 'string')
      return { verdict: 'clean', cleaned: data.cleaned };
    if (data.verdict === 'reask') return { verdict: 'reask', hint: data.hint };
    return { verdict: 'accept' };
  } catch {
    return { verdict: 'accept' };
  }
}

export type RemoteResolution =
  | { nudge: true; key: string; hint?: string }
  | { nudge: false; answer: string };

/** Pure: turn a remote verdict + the prior answer into advance-or-reask. */
export function resolveRemote(
  remote: ValidateResult,
  key: string,
  answer: string,
): RemoteResolution {
  if (remote.verdict === 'reask') return { nudge: true, key, hint: remote.hint };
  if (remote.verdict === 'clean' && remote.cleaned) return { nudge: false, answer: remote.cleaned };
  return { nudge: false, answer };
}
