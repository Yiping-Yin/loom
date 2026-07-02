'use client';

import React, { useCallback, useRef, useState } from 'react';

import { ASK_YIPING_SUGGESTED_QUESTIONS } from '../../lib/new-loom/ask-yiping';
import {
  VERIFIED_DOSSIER_AI_PROMPT,
  resolveVerifiedDossierArtifact,
  type VerifiedDossierArtifactId,
} from '../../lib/new-loom/verified-dossier-home';
import { buildAskRequestBody } from '../../lib/new-loom/ask-yiping-body';
import { readBeginnerProfileForAsk } from '../../lib/new-loom/draft-artifacts';
import { safeHref } from '../../lib/profile/safe-href';
import { getArtifactObjectUrl } from '../../lib/artifact/artifact-store';
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
 * Beginner uploaded-artifact citations (me-artifact-*) are openable: the API
 * carries the real IndexedDB blob id + file kind, and the cited "Open →" resolves
 * and opens the ACTUAL document by id (mirroring VerifiedArtifactCard) rather than
 * navigating an href — so a beginner answer cites and opens its real proof.
 *
 * No API key on the deploy -> the route returns `{configured:false, citations}`;
 * we then show the would-be sources plus a calm read-only note instead of
 * inventing an answer client-side. Loading + error states are handled inline.
 */

// Re-export so callers that import from the component path still work.
export { buildAskRequestBody } from '../../lib/new-loom/ask-yiping-body';

/** A resolved citation as surfaced to the UI. Mirrors AskYipingCitation. */
type ResolvedCitation = {
  artifactId: string;
  title: string;
  href: string;
  kind: ReturnType<typeof resolveVerifiedDossierArtifact>['kind'];
  /**
   * Set for an uploaded beginner artifact (me-artifact-*). When present, the
   * citation has no navigable href — its "Open →" resolves the real document blob
   * from IndexedDB by this id at click time (mirroring VerifiedArtifactCard),
   * grounding the citation in the actual file rather than a typed field.
   */
  openArtifactId?: string;
};

type AskPhase = 'idle' | 'example' | 'streaming' | 'done' | 'unconfigured' | 'no-sources' | 'error';

/** Raw citation shape the API emits ({done} or {configured:false}). */
type ApiCitation = { artifactId?: unknown; title?: unknown; href?: unknown; kind?: unknown };

/**
 * Map a beginner artifact's free-string kind to a FileBadge file kind. Uploaded
 * artifacts are 'pdf' | 'image' | 'doc' | 'other'; the badge vocabulary has no
 * image glyph, so non-PDF artifacts fall back to the neutral 'text' badge. The
 * artifact still opens its real blob regardless of the badge shown.
 */
function artifactBadgeKind(kind: unknown): ResolvedCitation['kind'] {
  return kind === 'pdf' ? 'pdf' : 'text';
}

/**
 * Resolve an API citation to a renderable citation.
 *
 * Owner citations: dossier resolution runs first and wins — kind/label/href are
 * taken from the real verified artifact, byte-identical to before.
 *
 * Beginner uploaded-artifact citations (me-artifact-*): the API sends the real
 * IndexedDB blob id as `artifactId`, a `title`, a file `kind`, and an EMPTY href.
 * These open the actual stored document by id (not a navigable link), so build an
 * openable ResolvedCitation flagged with `openArtifactId`.
 *
 * Beginner section citations (e.g. `me-exp-0`, `me-edu-0`): the dossier resolver
 * returns null for those ids. When the raw citation already carries a string
 * `title` and `href` (filled in server-side by the beginner citation resolver),
 * build a ResolvedCitation from them with a neutral `kind` so FileBadge can render.
 *
 * Anything else (no title, non-string artifactId) is dropped.
 */
function resolveCitation(raw: ApiCitation): ResolvedCitation | null {
  if (typeof raw?.artifactId !== 'string') return null;
  const artifact = resolveVerifiedDossierArtifact(
    raw.artifactId as VerifiedDossierArtifactId,
  );
  if (artifact) {
    return {
      artifactId: artifact.id,
      title: artifact.label,
      href: artifact.href,
      kind: artifact.kind,
    };
  }
  // Uploaded beginner artifact: a present `kind` (a file kind) is the signal that
  // this citation opens a stored blob by id rather than navigating an href. Its
  // href is intentionally empty; the "Open →" resolves the blob at click time.
  if (typeof raw.kind === 'string' && raw.kind.length > 0 &&
      typeof raw.title === 'string' && raw.title.length > 0) {
    return {
      artifactId: raw.artifactId,
      title: raw.title,
      href: '',
      kind: artifactBadgeKind(raw.kind),
      openArtifactId: raw.artifactId,
    };
  }
  // Beginner section citations: the API provides title + href directly. This is
  // the one citation href that does NOT pass through normalizeBeginnerProfile, so
  // run it through the same URL-scheme allowlist here. A dropped href ('') leaves
  // a titled-but-unlinked citation rather than a dangerous-scheme anchor.
  if (typeof raw.title === 'string' && raw.title.length > 0 &&
      typeof raw.href === 'string' && raw.href.length > 0) {
    return {
      artifactId: raw.artifactId,
      title: raw.title,
      href: safeHref(raw.href),
      kind: 'text',
    };
  }
  return null;
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
  "Live answers need an AI key — this deploy is read-only; the verified sources below are what Yiping's answer draws from.";

const NO_SOURCES_NOTE = 'Add your experience, education, or work to get cited answers.';

/**
 * The canned grounded Q&A (VERIFIED_DOSSIER_AI_PROMPT) seeds the panel before the
 * visitor asks anything, so even a no-key deploy opens with a complete cited
 * example. Citations are resolved the same way as live answers — no fabrication.
 */
const EXAMPLE_CITATIONS: ResolvedCitation[] = VERIFIED_DOSSIER_AI_PROMPT.citations
  .map((id) => resolveCitation({ artifactId: id }))
  .filter((citation): citation is ResolvedCitation => citation !== null);

/** Shape of the optional example seed (question + answer + resolved citations). */
export type AskYipingExample = {
  question: string;
  answer: string;
  citations: ResolvedCitation[];
};

export interface AskYipingProps {
  /** Override the suggested-question chips. Defaults to the owner's questions. */
  suggestedQuestions?: string[];
  /** Override the input placeholder text. Defaults to the owner's placeholder. */
  placeholder?: string;
  /** Override the eyebrow label above the title. Defaults to "Ask Yiping". */
  eyebrow?: string;
  /** Override the section title. Defaults to "Ask Yiping's verified knowledge". */
  title?: string;
  /** Override the lede below the title. Defaults to "Verified answers. Cited sources." */
  lede?: string;
  /** Override the read-only deploy note. Defaults to the owner-specific note. */
  readOnlyNote?: string;
  /**
   * Optional example Q&A to seed the panel before the visitor asks anything.
   * Pass `null` to start in a neutral idle state (no seeded question/answer).
   * Defaults to the owner's canned VERIFIED_DOSSIER_AI_PROMPT seed.
   */
  example?: AskYipingExample | null;
  /**
   * When true, ignore any beginner profile in localStorage and always ground the
   * answer in the owner (Yiping) corpus. The owner showcase sets this so a
   * visitor who happens to have their own beginner profile doesn't silently
   * switch the demo to answer from their own data.
   */
  forceOwnerCorpus?: boolean;
}

const OWNER_PLACEHOLDER = 'Ask about maths, optimisation, programming, or QBook...';
const OWNER_EYEBROW = 'Ask Yiping';
const OWNER_TITLE = "Ask Yiping's verified knowledge";
const OWNER_LEDE = 'Verified answers. Cited sources.';

/** The owner example seed, pre-resolved. Used as the default `example` prop value. */
const OWNER_EXAMPLE: AskYipingExample = {
  question: VERIFIED_DOSSIER_AI_PROMPT.question,
  answer: VERIFIED_DOSSIER_AI_PROMPT.answer,
  citations: EXAMPLE_CITATIONS,
};

export function AskYiping({
  suggestedQuestions = ASK_YIPING_SUGGESTED_QUESTIONS,
  placeholder = OWNER_PLACEHOLDER,
  eyebrow = OWNER_EYEBROW,
  title = OWNER_TITLE,
  lede = OWNER_LEDE,
  readOnlyNote = READ_ONLY_NOTE,
  example = OWNER_EXAMPLE,
  forceOwnerCorpus = false,
}: AskYipingProps = {}) {
  // When example is null we start in neutral idle; otherwise seed the panel.
  const [draft, setDraft] = useState('');
  const [askedQuestion, setAskedQuestion] = useState(example?.question ?? '');
  const [answer, setAnswer] = useState(example?.answer ?? '');
  const [citations, setCitations] = useState<ResolvedCitation[]>(example?.citations ?? []);
  const [phase, setPhase] = useState<AskPhase>(example !== null ? 'example' : 'idle');
  const [errorMessage, setErrorMessage] = useState('');
  // Per-artifact open status for citations that open a stored blob by id.
  const [openingArtifactId, setOpeningArtifactId] = useState<string | null>(null);
  const [unavailableArtifactIds, setUnavailableArtifactIds] = useState<Set<string>>(
    () => new Set(),
  );

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
      // forceOwnerCorpus (owner showcase) → never read the visitor's local
      // profile, so the demo always answers from the Yiping corpus.
      //
      // Otherwise read the persisted beginner profile AND fold in the user's
      // INCLUDED Studio drafts (the Ask half of the moat): the persisted profile
      // has no draft artifacts — drafts live in separate draft-storage — so
      // readBeginnerProfileForAsk merges includedDraftArtifacts into it (the same
      // non-clobbering, transient, NOT-persisted merge handleBuildCapabilities
      // uses for derivation). Without this an included draft never reaches the
      // corpus, so it can't ground/cite an answer.
      const profile = forceOwnerCorpus ? null : readBeginnerProfileForAsk();
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(buildAskRequestBody(trimmed, profile)),
      });

      const contentType = response.headers.get('content-type') ?? '';

      // No-key deploy (or any non-stream JSON): the route returns plain JSON. It
      // may carry { configured:false, citations } or an { error } message.
      if (!contentType.includes('text/event-stream')) {
        const payload = (await response.json().catch(() => null)) as
          | { configured?: boolean; grounded?: boolean; reason?: string; citations?: unknown; error?: string }
          | null;
        if (!response.ok || !payload) {
          throw new Error(payload?.error ?? `Ask failed (${response.status}).`);
        }
        if (payload.configured === false) {
          setCitations(resolveCitations(payload.citations));
          setPhase('unconfigured');
          return;
        }
        // Grounding floor: retrieval found no inspectable sources for this
        // question, so the route refused to stream a confident, uncited answer.
        // Show a calm empty state instead of an answer body.
        if (payload.grounded === false) {
          setCitations([]);
          setPhase('no-sources');
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
        error instanceof Error ? error.message : `${eyebrow} failed to answer.`,
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

  // Open an uploaded artifact citation: resolve the real blob from IndexedDB by
  // id and open it in a new tab. Mirrors VerifiedArtifactCard's open behavior,
  // including the popup-blocked same-tab fallback. If the blob is gone (cleared
  // IndexedDB), mark the citation unavailable instead of failing silently.
  const openArtifact = useCallback(async (artifactId: string) => {
    if (openingArtifactId) return;
    setOpeningArtifactId(artifactId);
    try {
      const url = await getArtifactObjectUrl(artifactId);
      if (!url) {
        setUnavailableArtifactIds((prev) => new Set(prev).add(artifactId));
        return;
      }
      const win =
        typeof window !== 'undefined'
          ? window.open(url, '_blank', 'noopener,noreferrer')
          : null;
      if (!win && typeof window !== 'undefined') {
        // Pop-up blocked — fall back to navigating the current tab to the blob.
        window.location.href = url;
      }
    } catch {
      setUnavailableArtifactIds((prev) => new Set(prev).add(artifactId));
    } finally {
      setOpeningArtifactId(null);
    }
  }, [openingArtifactId]);

  const isBusy = phase === 'streaming';
  const showAnswerBody =
    phase === 'example' ||
    phase === 'streaming' ||
    phase === 'done' ||
    (phase === 'error' && answer.length > 0);
  // In idle phase, show a calm placeholder prose instead of an empty answer body.
  const showIdlePlaceholder = phase === 'idle';

  return (
    <section className={styles.askYiping} aria-labelledby="ask-yiping-title" data-reveal="">
      <div className={styles.header}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h2 id="ask-yiping-title" className={styles.title}>
          {title}
        </h2>
        <p className={styles.lede}>{lede}</p>
      </div>

      <form className={styles.form} onSubmit={onSubmit}>
        <input
          className={styles.input}
          type="text"
          name="question"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={placeholder}
          aria-label={`${eyebrow} — ask a question`}
          autoComplete="off"
          disabled={isBusy}
        />
        <button className={styles.submit} type="submit" disabled={isBusy || !draft.trim()}>
          {isBusy ? 'Asking…' : 'Ask'}
        </button>
      </form>

      <div className={styles.chips} role="group" aria-label="Suggested questions">
        {suggestedQuestions.map((question) => (
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
        {phase !== 'idle' ? (
          <div className={styles.answerHead}>
            <p>{phase === 'example' ? 'Example grounded answer' : 'Grounded answer'}</p>
            <span className={styles.status}>{statusLabel(phase)}</span>
          </div>
        ) : null}

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

        {showIdlePlaceholder ? (
          <p className={styles.answerBody} style={{ opacity: 0.5 }}>
            Ask a question to get a grounded, cited answer.
          </p>
        ) : null}

        {phase === 'unconfigured' ? (
          <div className={styles.note}>
            <strong>Read-only deploy</strong>
            <p>{readOnlyNote}</p>
          </div>
        ) : null}

        {phase === 'no-sources' ? (
          <div className={styles.note}>
            <strong>No inspectable sources yet</strong>
            <p>{NO_SOURCES_NOTE}</p>
          </div>
        ) : null}

        {phase === 'error' ? (
          <div className={`${styles.note} ${styles.error}`} role="alert">
            <strong>{"Couldn't reach"} {eyebrow}</strong>
            <p>{errorMessage}</p>
          </div>
        ) : null}

        {citations.length > 0 ? (
          <div className={styles.sources}>
            <h3 className={styles.sourcesHeading}>
              {phase === 'unconfigured' ? 'Sources this answer would draw from' : 'Cited sources'}
            </h3>
            <div className={styles.sourceList} aria-label="Cited verified artifacts">
              {citations.map((citation) => {
                // Uploaded artifact citation: opens the real document blob by id
                // (no navigable href). Mirrors VerifiedArtifactCard's open path.
                if (citation.openArtifactId) {
                  const id = citation.openArtifactId;
                  const unavailable = unavailableArtifactIds.has(id);
                  const opening = openingArtifactId === id;
                  return (
                    <button
                      key={citation.artifactId}
                      type="button"
                      className={styles.sourceRow}
                      onClick={() => void openArtifact(id)}
                      disabled={opening || unavailable}
                    >
                      <FileBadge kind={citation.kind} label={citation.title} compact />
                      <span className={styles.sourceHref}>
                        {unavailable ? 'File unavailable' : opening ? 'Opening…' : 'Open →'}
                      </span>
                    </button>
                  );
                }
                return citation.href ? (
                  <a key={citation.artifactId} className={styles.sourceRow} href={citation.href}>
                    <FileBadge kind={citation.kind} label={citation.title} compact />
                    <span className={styles.sourceHref}>{citation.href}</span>
                  </a>
                ) : (
                  // href dropped by the URL-scheme allowlist — show the cited
                  // source as plain text instead of a dangerous-scheme anchor.
                  <div key={citation.artifactId} className={styles.sourceRow}>
                    <FileBadge kind={citation.kind} label={citation.title} compact />
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function statusLabel(phase: AskPhase): string {
  switch (phase) {
    case 'idle':
      return '';
    case 'streaming':
      return 'Streaming…';
    case 'done':
      return 'Grounded';
    case 'example':
      return 'Example';
    case 'unconfigured':
      return 'Read-only';
    case 'no-sources':
      return 'No sources';
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
