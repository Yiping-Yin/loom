import { type BeginnerProfile } from '../profile/beginner-profile';

/**
 * Build the JSON body for a POST /api/ask request.
 *
 * When a non-null profile is provided the route grounds the answer in that
 * beginner's own content instead of the Yiping dossier. When null/undefined,
 * only `question` is sent so the route falls back to the Yiping corpus exactly
 * as before — no behavior change for the owner path.
 *
 * Kept in a pure module (no React, no CSS) so it can be unit-tested without
 * the tsx runner choking on CSS module imports.
 */
export function buildAskRequestBody(
  question: string,
  profile: BeginnerProfile | null | undefined,
): Record<string, unknown> {
  if (profile) {
    return { question, profile };
  }
  return { question };
}
