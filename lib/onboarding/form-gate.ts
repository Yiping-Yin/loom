/**
 * Pure, offline floor for the FORM wizard. Mirrors chat-gate.ts but for the
 * field-based form: returns advisory (never-blocking) hints for the HOME step.
 */
import { assessAnswer } from './assess-answer';

export type HomeHints = { name?: string; headline?: string };

/** Non-blocking floor hints for the form's HOME step. Empty object = nothing to flag. */
export function assessHomeFields(home: { name: string; headline: string }): HomeHints {
  const hints: HomeHints = {};
  const name = assessAnswer('name', home.name);
  const headline = assessAnswer('headline', home.headline);
  if (name.level !== 'ok') hints.name = name.hint;
  if (headline.level !== 'ok') hints.headline = headline.hint;
  return hints;
}
