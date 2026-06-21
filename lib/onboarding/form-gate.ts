/**
 * Pure, offline floor for the FORM wizard. Mirrors chat-gate.ts but for the
 * field-based form: returns advisory (never-blocking) hints for the HOME step.
 */
import { assessAnswer } from './assess-answer';

export type HomeHints = { name?: string; headline?: string };

/** Non-blocking floor hint for one HOME field. undefined = nothing to flag. */
export function assessHomeField(field: 'name' | 'headline', value: string): string | undefined {
  const a = assessAnswer(field, value);
  return a.level !== 'ok' ? a.hint : undefined;
}
