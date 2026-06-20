import type { BeginnerProfile } from '../profile/beginner-profile';
import {
  deriveCapabilitiesHeuristic,
  normalizeCapabilities,
  type BeginnerCapability,
} from './capability-graph';

/**
 * Client-side capability derivation orchestrator (Task 3).
 *
 * Attempts the LLM-backed /api/derive-capabilities route; falls back to the
 * deterministic heuristic for EVERY failure mode:
 *   - {configured:false}    → no API key on this deploy
 *   - {ok:false}            → API/transport error on the server
 *   - non-2xx status        → server error, proxy error, etc.
 *   - 404                   → static export has no /api routes
 *   - invalid / non-JSON    → corrupted response
 *   - thrown fetch          → offline or CORS
 *
 * NEVER throws. Safe to call from a client event handler.
 */
export async function buildCapabilities(
  profile: BeginnerProfile,
): Promise<BeginnerCapability[]> {
  try {
    const res = await fetch('/api/derive-capabilities', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ profile }),
    });

    if (!res.ok) {
      return deriveCapabilitiesHeuristic(profile);
    }

    let data: unknown;
    try {
      data = await res.json();
    } catch {
      return deriveCapabilitiesHeuristic(profile);
    }

    if (
      data !== null &&
      typeof data === 'object' &&
      'ok' in data &&
      (data as Record<string, unknown>).ok === true &&
      'capabilities' in data
    ) {
      return normalizeCapabilities((data as Record<string, unknown>).capabilities);
    }

    // {configured:false}, {ok:false}, or any unexpected shape.
    return deriveCapabilitiesHeuristic(profile);
  } catch {
    // fetch threw (offline, CORS, etc.).
    return deriveCapabilitiesHeuristic(profile);
  }
}
