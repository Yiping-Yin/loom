/**
 * Deterministic, offline answer-quality floor for onboarding. Pure — no network,
 * no React — so it runs in every deploy (incl. the static macOS export) and is
 * unit-tested directly. Catches obvious garbage; the LLM smart layer
 * (/api/validate-answer) handles semantic off-topic on the keyed web deploy.
 */

export type AnswerField =
  | 'name'
  | 'headline'
  | 'summary'
  | 'institution'
  | 'qualification'
  | 'role'
  | 'organization'
  | 'highlight'
  | 'work_title'
  | 'work_description'
  | 'generic';

export type AnswerLevel = 'ok' | 'weak' | 'bad';
export type AnswerAssessment = { level: AnswerLevel; hint?: string };

const MIN_LEN: Partial<Record<AnswerField, number>> = {
  name: 2,
  headline: 4,
  summary: 20,
  institution: 2,
  qualification: 2,
  role: 2,
  organization: 2,
  work_title: 2,
  highlight: 8,
  work_description: 8,
};
const DEFAULT_MIN = 2;

/** Obvious non-language garbage, field-independent. */
function isGibberish(text: string): boolean {
  const lower = text.toLowerCase();
  if (/(.)\1{4,}/.test(lower)) return true; // 'aaaaaa'
  if (/asdf|qwer|zxcv|hjkl|qwerty|asdfgh|zxcvbn/.test(lower)) return true; // keyboard mash
  for (const tok of lower.split(/[\s/&·,]+/)) {
    const alpha = tok.replace(/[^a-z]/g, '');
    if (alpha.length >= 6 && !/[aeiouy]/.test(alpha)) return true; // long, no vowels
  }
  const symbols = (text.match(/[^\p{L}\p{N}\s]/gu) ?? []).length;
  if (text.length >= 4 && symbols / text.length > 0.5) return true; // mostly symbols
  return false;
}

/** Length that credits CJK characters double — one Han/Kana/Hangul char ≈ one English word. */
function effectiveLength(text: string): number {
  const chars = [...text];
  const cjk = chars.filter((c) =>
    /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(c),
  ).length;
  return chars.length + cjk;
}

function gibberishHint(field: AnswerField): string {
  if (field === 'name') return "That doesn't look like a name — e.g. 'Lin Wei'.";
  if (field === 'headline')
    return "That doesn't look like a headline — e.g. 'Finance student · Python & derivatives'.";
  return "That doesn't look quite right — could you rephrase?";
}

export function assessAnswer(field: AnswerField, raw: string): AnswerAssessment {
  const text = raw.trim();
  if (!text) return { level: 'bad', hint: "This one can't be empty." };
  if (isGibberish(text)) return { level: 'bad', hint: gibberishHint(field) };

  if (field === 'name') {
    if (/https?:\/\/|@|www\./i.test(text) || /^\d+$/.test(text)) {
      return { level: 'bad', hint: "Just your name — e.g. 'Lin Wei'." };
    }
    if (text.split(/\s+/).length >= 7 || text.includes('?')) {
      return { level: 'weak', hint: "Just your name — e.g. 'Lin Wei'." };
    }
  }

  if (field === 'headline') {
    const chatty =
      text.includes('?') ||
      /\b(do you|can you|could you|recommend|i'?m doing|i am doing)\b/i.test(text) ||
      /你能|推荐|怎么|帮我/.test(text);
    if (chatty) {
      return {
        level: 'weak',
        hint: "A headline is a short line about what you do — e.g. 'Finance student · Python & derivatives'.",
      };
    }
    if (text.length > 140) {
      return { level: 'weak', hint: 'Keep the headline short — a phrase, not a paragraph.' };
    }
  }

  const min = MIN_LEN[field] ?? DEFAULT_MIN;
  if (effectiveLength(text) < min) return { level: 'weak', hint: 'A little more detail would help.' };

  return { level: 'ok' };
}
