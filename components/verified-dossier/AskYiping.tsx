'use client';

import React, { useCallback, useRef, useState } from 'react';

import { ASK_YIPING_SUGGESTED_QUESTIONS } from '../../lib/new-loom/ask-yiping';
import {
  VERIFIED_DOSSIER_AI_PROMPT,
  resolveVerifiedDossierArtifact,
  type VerifiedDossierArtifactId,
} from '../../lib/new-loom/verified-dossier-home';
import { FileBadge } from './FileBadge';
import styles from './AskYiping.module.css';

/**
 * Ask Yiping — the web-deployable conversational core of Digital Me.
 *
 * Visitor types (or picks) a question, this POSTs /api/ask, reads the SSE stream
 * (`{delta}` chunks, then `{done, citations}`), and renders a grounded, cited
 * answer. The route NEVER fabricates: every citation is a real verified dossier
 * artifact id resolved here via resolveVerifiedDossierArtifact and shown with the
 * AnswerInspector visual language (FileBadge title + kind + href).
 *
 * No API key on the deploy -> the route returns `{configured:false, citations}`;
 * we then show the would-be sources plus a calm read-only note instead of
 * inventing an answer client-side. Loading + error states are handled inline.
 */

/** A resolved citation as surfaced to the UI. Mirrors AskYipingCitation. */
type ResolvedCitation = {
  artifactId: string;
  title: string;
  href: string;
  kind: ReturnType<typeof resolveVerifiedDossierArtifact>['kind'];
};

type AskPhase = 'example' | 'streaming' | 'done' | 'unconfigured' | 'error';

/** Raw citation shape the API emits ({done} or {configured:false}). */
type ApiCitation = { artifactId?: unknown; title?: unknown; href?: unknown };

/** Resolve an API citation to the real artifact; drop anything non-resolvable. */
function resolveCitation(raw: ApiCitation): ResolvedCitation | null {
  if (typeof raw?.artifactId !== 'string') return null;
  const artifact = resolveVerifiedDossierArtifact(
    raw.artifactId as VerifiedDossierArtifactId,
  );
  if (!artifact) return null;
  return {
    artifactId: artifact.id,
    title: artifact.label,
    href: artifact.href,
    kind: artifact.kind,
  };
}

function resolveCitations(list: unknown): ResolvedCitation[] {
  if (!Array.isArray(list)) return [];
  return list
    .map((raw) => resolveCitation(raw as ApiCitation))
    .filter((citation): citation is ResolvedCitation => citation !== null);
}

/** A single SSE event payload the route may send. */
type AskStreamEvent = {
  delta?: string;
  done?: boolean;
  citations?: unknown;
  error?: string;
};

const READ_ONLY_NOTE =
  'Live answers need an AI key — this deploy is read-only; the verified sources below are what Yiping’s answer draws from.';

/**
 * The canned grounded Q&A (VERIFIED_DOSSIER_AI_PROMPT) seeds the panel before the
 * visitor asks anything, so even a no-key deploy opens with a complete cited
 * example. Citations are resolved the same way as live answers — no fabrication.
 */
const EXAMPLE_CITATIONS: ResolvedCitation[] = VERIFIED_DOSSIER_AI_PROMPT.citations
  .map((id) => resolveCitation({ artifactId: id }))
  .filter((citation): citation is ResolvedCitation => citation !== null);

export function AskYiping() {
  const [draft, setDraft] = useState('');
  const [askedQuestion, setAskedQuestion] = useState(VERIFIED_DOSSIER_AI_PROMPT.question);
  const [answer, setAnswer] = useState(VERIFIED_DOSSIER_AI_PROMPT.answer);
  const [citations, setCitations] = useState<ResolvedCitation[]>(EXAMPLE_CITATIONS);
  const [phase, setPhase] = useState<AskPhase>('example');
  const [errorMessage, setErrorMessage] = useState('');

  // Guards against overlapping submissions racing the streamed answer.
  const inFlight = useRef(false);

  const runAsk = useCallback(async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || inFlight.current) return;
    inFlight.current = true;

    setAskedQuestion(trimmed);
    setAnswer('');
    setCitations([]);
    setErrorMessage('');
    setPhase('streaming');

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question: trimmed }),
      });

      const contentType = response.headers.get('content-type') ?? '';

      // No-key deploy (or any non-stream JSON): the route returns plain JSON. It
      // may carry { configured:false, citations } or an { error } message.
      if (!contentType.includes('text/event-stream')) {
        const payload = (await response.json().catch(() => null)) as
          | { configured?: boolean; citations?: unknown; error?: string }
          | null;
        if (!response.ok || !payload) {
          throw new Error(payload?.error ?? `Ask failed (${response.status}).`);
        }
        if (payload.configured === false) {
          setCitations(resolveCitations(payload.citations));
          setPhase('unconfigured');
          return;
        }
        // Defensive: an OK JSON body without a stream — treat as error.
        throw new Error(payload.error ?? 'Ask returned an unexpected response.');
      }

      if (!response.body) throw new Error('Ask returned no response stream.');

      await consumeSse(response.body, (event) => {
        if (event.error) throw new Error(event.error);
        if (typeof event.delta === 'string') {
          setAnswer((prev) => prev + event.delta);
        }
        if (event.done) {
          setCitations(resolveCitations(event.citations));
          setPhase('done');
        }
      });

      // If the stream closed without a {done} event, still leave a usable state.
      setPhase((prev) => (prev === 'streaming' ? 'done' : prev));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Ask Yiping failed to answer.',
      );
      setPhase('error');
    } finally {
      inFlight.current = false;
    }
  }, []);

  const onSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void runAsk(draft);
    },
    [draft, runAsk],
  );

  const onChip = useCallback(
    (question: string) => {
      setDraft(question);
      void runAsk(question);
    },
    [runAsk],
  );

  const isBusy = phase === 'streaming';
  const showAnswerBody =
    phase === 'example' ||
    phase === 'streaming' ||
    phase === 'done' ||
    (phase === 'error' && answer.length > 0);

  return (
    <section className={styles.askYiping} aria-labelledby="ask-yiping-title">
      <div className={styles.header}>
        <p className={styles.eyebrow}>Ask Yiping</p>
        <h2 id="ask-yiping-title" className={styles.title}>
          Ask Yiping’s verified knowledge
        </h2>
        <p className={styles.lede}>
          A grounded conversation with Yiping’s verified dossier. Every answer is drawn only
          from inspectable About, Education, and Experience sources — and cites the exact
          artifacts it used.
        </p>
      </div>

      <form className={styles.form} onSubmit={onSubmit}>
        <input
          className={styles.input}
          type="text"
          name="question"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask about Yiping’s maths, optimisation, programming, or trading practice…"
          aria-label="Ask Yiping a question"
          autoComplete="off"
          disabled={isBusy}
        />
        <button className={styles.submit} type="submit" disabled={isBusy || !draft.trim()}>
          {isBusy ? 'Asking…' : 'Ask'}
        </button>
      </form>

      <div className={styles.chips} role="group" aria-label="Suggested questions">
        {ASK_YIPING_SUGGESTED_QUESTIONS.map((question) => (
          <button
            key={question}
            type="button"
            className={styles.chip}
            onClick={() => onChip(question)}
            disabled={isBusy}
          >
            {question}
          </button>
        ))}
      </div>

      <div className={styles.answerArea} aria-live="polite">
        <div className={styles.answerHead}>
          <p>{phase === 'example' ? 'Example grounded answer' : 'Grounded answer'}</p>
          <span className={styles.status}>{statusLabel(phase)}</span>
        </div>

        {askedQuestion ? <p className={styles.askedQuestion}>{askedQuestion}</p> : null}

        {showAnswerBody ? (
          <p
            className={
              phase === 'streaming'
                ? `${styles.answerBody} ${styles.streaming}`
                : styles.answerBody
            }
          >
            {answer}
          </p>
        ) : null}

        {phase === 'unconfigured' ? (
          <div className={styles.note}>
            <strong>Read-only deploy</strong>
            <p>{READ_ONLY_NOTE}</p>
          </div>
        ) : null}

        {phase === 'error' ? (
          <div className={`${styles.note} ${styles.error}`} role="alert">
            <strong>Couldn’t reach Ask Yiping</strong>
            <p>{errorMessage}</p>
          </div>
        ) : null}

        {citations.length > 0 ? (
          <div className={styles.sources}>
            <h3 className={styles.sourcesHeading}>
              {phase === 'unconfigured' ? 'Sources this answer would draw from' : 'Cited sources'}
            </h3>
            <div className={styles.sourceList} aria-label="Cited verified artifacts">
              {citations.map((citation) => (
                <a key={citation.artifactId} className={styles.sourceRow} href={citation.href}>
                  <FileBadge kind={citation.kind} label={citation.title} compact />
                  <span className={styles.sourceHref}>{citation.href}</span>
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function statusLabel(phase: AskPhase): string {
  switch (phase) {
    case 'streaming':
      return 'Streaming…';
    case 'done':
      return 'Grounded';
    case 'example':
      return 'Example';
    case 'unconfigured':
      return 'Read-only';
    case 'error':
      return 'Error';
    default:
      return '';
  }
}

/**
 * Reads an SSE body, parsing each `data: {…}` line into an AskStreamEvent and
 * handing it to `onEvent`. Mirrors the route's `data: <json>\n\n` framing.
 */
async function consumeSse(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: AskStreamEvent) => void,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const flush = (rawEvent: string) => {
    const dataLine = rawEvent
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.startsWith('data:'));
    if (!dataLine) return;
    const json = dataLine.slice('data:'.length).trim();
    if (!json) return;
    let parsed: AskStreamEvent;
    try {
      parsed = JSON.parse(json) as AskStreamEvent;
    } catch {
      return;
    }
    onEvent(parsed);
  };

  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let boundary = buffer.indexOf('\n\n');
      while (boundary >= 0) {
        flush(buffer.slice(0, boundary));
        buffer = buffer.slice(boundary + 2);
        boundary = buffer.indexOf('\n\n');
      }
    }
    buffer += decoder.decode();
    if (buffer.trim()) flush(buffer);
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // Stream already released.
    }
  }
}
