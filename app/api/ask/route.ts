import {
  isAnthropicConfigured,
  runAnthropicHttp,
} from '../../../lib/anthropic-http';
import {
  buildAskYipingPrompt,
  parseAskYipingCitations,
  resolveAskYipingDossierCitation,
  retrieveAskYipingSources,
  type AskYipingCitation,
  type AskYipingCitationResolver,
  type AskYipingCorpusContext,
  type AskYipingSource,
} from '../../../lib/new-loom/ask-yiping';
import { beginnerCorpusContext } from '../../../lib/new-loom/beginner-ask-corpus';
import {
  normalizeBeginnerProfile,
  type BeginnerProfile,
} from '../../../lib/profile/beginner-profile';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Ask Yiping — the web-deployable conversational core of Digital Me.
 *
 * This route is the transport that pairs the pure retrieval/prompt/citation
 * layer (lib/new-loom/ask-yiping) with the serverless-friendly HTTPS Anthropic
 * client (lib/anthropic-http). It runs on the Node serverless runtime, never
 * touches the native Mac app bridge, and degrades gracefully when no API key is
 * configured: in that case it still tells the client which verified dossier
 * artifacts WOULD ground the answer so the UI can show sources + nudge the user
 * to connect a key.
 *
 * Grounding discipline lives in ask-yiping.ts: the model is told to answer only
 * from the provided dossier context and to refuse plainly when it cannot, and
 * citations are filtered down to REAL artifact ids that resolve via
 * resolveVerifiedDossierArtifact. Nothing here fabricates hrefs.
 */

type AskRequestBody = {
  question?: unknown;
  /**
   * Optional beginner profile. When present, the request is grounded in this
   * user's OWN profile sections instead of the hardcoded Yiping dossier. The
   * client Ask widget holds it in localStorage and sends it; absent → Yiping.
   */
  profile?: unknown;
};

/** Turn a retrieved source into a real, resolvable citation (or null). */
function toResolvableCitation(
  source: AskYipingSource,
  resolveCitation: AskYipingCitationResolver,
): AskYipingCitation | null {
  return resolveCitation(source.id);
}

/**
 * Decide whether the POST body carries a usable beginner profile. A profile is
 * "present" only if normalizing it yields at least one searchable section
 * (name/headline/summary/education/experience/link); an empty object falls back
 * to the Yiping corpus exactly as before.
 */
function readUsableProfile(raw: unknown): BeginnerProfile | null {
  if (raw == null || typeof raw !== 'object') return null;
  const profile = normalizeBeginnerProfile(raw);
  const hasContent =
    Boolean(profile.home.name.trim()) ||
    Boolean(profile.home.headline.trim()) ||
    Boolean(profile.about.summary.trim()) ||
    profile.about.links.length > 0 ||
    profile.education.length > 0 ||
    profile.experience.length > 0;
  return hasContent ? profile : null;
}

/** SSE line for a single payload object. */
function sseData(payload: unknown): string {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

export async function POST(request: Request): Promise<Response> {
  let body: AskRequestBody;
  try {
    body = (await request.json()) as AskRequestBody;
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const question = typeof body.question === 'string' ? body.question.trim() : '';
  if (!question) {
    return Response.json({ error: 'A non-empty question is required.' }, { status: 400 });
  }

  // Choose the corpus for this request: a usable beginner profile grounds the
  // answer in the user's OWN sections; otherwise fall back to the Yiping dossier
  // exactly as before. The same retrieve/prompt/citation core runs either way.
  const profile = readUsableProfile(body.profile);
  const corpusContext: AskYipingCorpusContext = profile ? beginnerCorpusContext(profile) : {};
  const resolveCitation = corpusContext.resolveCitation ?? resolveAskYipingDossierCitation;
  const personaName = profile?.home.name?.trim() || undefined;

  // No API key on this deploy: stay useful. Surface the artifacts that WOULD
  // ground an answer (real, resolvable ids only) so the client can render
  // sources and prompt the user to connect a key. Never stream, never guess.
  if (!isAnthropicConfigured()) {
    const citations = retrieveAskYipingSources(question, 6, corpusContext)
      .map((source) => toResolvableCitation(source, resolveCitation))
      .filter((citation): citation is AskYipingCitation => citation !== null);
    return Response.json({ configured: false, citations }, { status: 200 });
  }

  const sources = retrieveAskYipingSources(question, 6, corpusContext);
  const { system, user } = buildAskYipingPrompt(question, sources, { personaName });

  // runAnthropicHttp has no system parameter, so prepend the grounding system
  // prompt to the user prompt (it is sent as a single user message body).
  const prompt = `${system}\n\n${user}`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let full = '';
      let closed = false;

      const enqueue = (payload: unknown) => {
        if (closed) return;
        controller.enqueue(encoder.encode(sseData(payload)));
      };

      try {
        await runAnthropicHttp(prompt, {
          onChunk: (delta) => {
            if (!delta) return;
            full += delta;
            enqueue({ delta });
          },
        });

        const { citations } = parseAskYipingCitations(full, sources, resolveCitation);
        enqueue({ done: true, citations });
      } catch (error) {
        // Abort and network/API errors both land here: report plainly so the
        // client can show a failure state instead of a half-streamed answer.
        const message =
          error instanceof Error ? error.message : 'Ask Yiping failed to answer.';
        enqueue({ error: message });
      } finally {
        closed = true;
        try {
          controller.close();
        } catch {
          // Stream already torn down (e.g. client aborted) — nothing to do.
        }
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
    },
  });
}
