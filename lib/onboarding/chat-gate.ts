/**
 * Pure chat-onboarding gate logic. No 'use client', no React/CSS/next imports —
 * so the floor decision is testable with a plain `import` (the repo has no jsdom
 * harness) and stays separated from the rendering component.
 *
 * Owns: the ConvoStep step machine's shape, the skip/yes answer predicates, the
 * step→AnswerField mapping, the stable re-ask key, and the pure gate decision
 * (decideChatGate) that ConversationalOnboardingClient consumes.
 */
import { assessAnswer, type AnswerField } from './assess-answer';

// ── Step machine ─────────────────────────────────────────────────────────────

/**
 * Each discriminated step knows which field in BeginnerProfile it populates.
 * The machine is deterministic and offline-safe — no LLM call.
 */
export type ConvoStep =
  | { id: 'name' }
  | { id: 'headline' }
  | { id: 'summary' }
  | { id: 'edu_institution'; entryIdx: number }
  | { id: 'edu_qualification'; entryIdx: number }
  | { id: 'edu_years'; entryIdx: number }
  | { id: 'edu_more' }
  | { id: 'exp_role'; entryIdx: number }
  | { id: 'exp_organization'; entryIdx: number }
  | { id: 'exp_years'; entryIdx: number }
  | { id: 'exp_highlight'; entryIdx: number }
  | { id: 'exp_more' }
  | { id: 'work_title'; entryIdx: number }
  | { id: 'work_description'; entryIdx: number }
  | { id: 'work_link'; entryIdx: number }
  | { id: 'work_more' }
  | { id: 'review' };

export const isSkip = (answer: string) => /^(skip|s|no|nope|none|n\/a|-)$/i.test(answer.trim());
export const isYes = (answer: string) => /^(yes|y|yeah|sure|yep|ok)$/i.test(answer.trim());

/**
 * Map a chat step to the answer-quality floor's AnswerField, or null for
 * non-free-text steps (year ranges, yes/no "add another?", link, review) which
 * get no floor check.
 */
export function fieldOf(step: ConvoStep): AnswerField | null {
  switch (step.id) {
    case 'name': return 'name';
    case 'headline': return 'headline';
    case 'summary': return 'summary';
    case 'edu_institution': return 'institution';
    case 'edu_qualification': return 'qualification';
    case 'exp_role': return 'role';
    case 'exp_organization': return 'organization';
    case 'exp_highlight': return 'highlight';
    case 'work_title': return 'work_title';
    case 'work_description': return 'work_description';
    default: return null;
  }
}

/** Stable key per step occurrence (entryIdx disambiguates repeated edu/exp/work). */
export function stepKey(step: ConvoStep): string {
  return 'entryIdx' in step ? `${step.id}:${step.entryIdx}` : step.id;
}

// ── Gate decision ─────────────────────────────────────────────────────────────

export type ChatGate =
  | { kind: 'nudge'; key: string; hint?: string } // floor said bad → nudge once, don't advance
  | { kind: 'check'; field: AnswerField; key: string } // floor passed → smart layer may validate
  | { kind: 'pass' }; // skip / non-free-text / already reasked → advance now

/** Pure floor decision. `nudge` = bad answer (coach, don't advance). `check` = eligible for the
 *  optional LLM smart layer. `pass` = advance immediately (skip/non-free-text/already-reasked). */
export function decideChatGate(step: ConvoStep, answer: string, reasked: Set<string>): ChatGate {
  const field = fieldOf(step);
  const key = stepKey(step);
  if (!field || isSkip(answer) || reasked.has(key)) return { kind: 'pass' };
  const floor = assessAnswer(field, answer);
  if (floor.level === 'bad') return { kind: 'nudge', key, hint: floor.hint };
  return { kind: 'check', field, key };
}
