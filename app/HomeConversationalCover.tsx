'use client';

/**
 * HomeConversationalCover — the new-user front door. Two modes over ONE shared
 * useConversation() engine:
 *
 *  • Landing mode (first contact: no messages yet, not at review) — a real
 *    product landing: LandingNav + an editorial hero (big photoreal moon +
 *    eyebrow + poetic headline + the live conversational prompt + the answer
 *    input + résumé import + whisper links) + LandingShowcase + LandingFooter.
 *  • Conversation/review mode (once the visitor answers, or at review) — the
 *    focused cosmic surface: the running thread + input, or the Save action.
 *    Behaviour here is unchanged (keeps the test-locked review/Save flow).
 *
 * The answer-input form, whisper nav, and hidden résumé file input are shared
 * fragments so there is no forked conversation logic.
 *
 * Tokens only (var()); never hardcode the cyans (uses --signature-cyan-hi).
 */

import { useRef } from 'react';
import Link from 'next/link';
import { useConversation } from '../lib/onboarding/useConversation';
import { constellationFor } from '../lib/onboarding/constellation';
import { ConstellationField } from './ConstellationField';
import { LandingNav } from './LandingNav';
import { LandingShowcase } from './LandingShowcase';
import { LandingFooter } from './LandingFooter';
import styles from './HomeConversationalCover.module.css';

/** Accepted résumé extensions for the quiet import. */
const RESUME_ACCEPT = '.pdf,.txt,.md,.markdown';

export function HomeConversationalCover() {
  const c = useConversation();
  const constellation = constellationFor(c.profile);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const importBusy = c.uploadStatus !== 'idle' || c.extracting;

  // First contact is the full product landing; once the conversation starts (or
  // at review) we collapse to the focused surface so an active chat never shares
  // the page with the marketing sections below.
  //
  // Gate on "the visitor hasn't answered yet" — NOT messages.length. The hook
  // seeds an opening LOOM greeting into `messages` on mount, so a length check
  // would render the landing on the server then collapse the instant that effect
  // runs in the browser. A user-authored message is the real "they've started".
  const hasAnswered = c.messages.some((m) => m.from === 'user');
  const landingMode = !hasAnswered && c.step.id !== 'review';

  const openResume = () => resumeInputRef.current?.click();

  // ── Shared fragments (identical behaviour in both modes) ──────────────────
  const inputForm = (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void c.handleSubmit();
      }}
      className={styles.inputRow}
    >
      <input
        ref={c.inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        className={styles.input}
        value={c.input}
        onChange={(e) => c.setInput(e.target.value)}
        disabled={c.checking}
        placeholder="Type your answer…"
        aria-label="Your answer"
        autoComplete="off"
      />
      <button
        type="submit"
        className={styles.send}
        disabled={!c.input.trim() || c.isTyping || c.checking}
        aria-label="Send"
      >
        →
      </button>
    </form>
  );

  // Résumé import (answer-time only) — a hidden file input opened by the
  // "Import a résumé" whisper; a quiet status line while a picked file is read.
  const importBits = c.step.id !== 'review' && (
    <>
      {importBusy && (
        <p className={styles.importNote} role="status" aria-live="polite">
          {c.uploadStatus === 'reading' ? 'Reading…' : 'Extracting your profile…'}
        </p>
      )}
      {c.uploadError && (
        <p className={styles.saveError} role="alert">
          {c.uploadError}
        </p>
      )}
      <input
        ref={resumeInputRef}
        type="file"
        accept={RESUME_ACCEPT}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void c.handleFileUpload(file);
          e.currentTarget.value = '';
        }}
        aria-hidden="true"
        tabIndex={-1}
        style={{ display: 'none' }}
      />
    </>
  );

  const whisper = (
    <nav className={styles.whisper} aria-label="Other ways to start">
      <Link href="/example" className={styles.whisperLink}>
        See an example
      </Link>
      {c.step.id !== 'review' && (
        <>
          <span className={styles.whisperDot} aria-hidden>
            ·
          </span>
          <button
            type="button"
            className={styles.formLink}
            onClick={openResume}
            disabled={importBusy}
          >
            Import a résumé
          </button>
        </>
      )}
      <span className={styles.whisperDot} aria-hidden>
        ·
      </span>
      <button type="button" className={styles.formLink} onClick={c.goToForm}>
        Prefer a form?
      </button>
    </nav>
  );

  // ── Landing mode — the real product page ──────────────────────────────────
  if (landingMode) {
    return (
      <div className={styles.landing}>
        <div className="loom-cosmic-field" aria-hidden />
        <ConstellationField data={constellation} />

        <LandingNav onBegin={() => c.inputRef.current?.focus()} />

        <section className={styles.hero} aria-label="Start your LOOM">
          <img
            className={styles.heroMoon}
            src="/loom/history/moon-orb.webp"
            alt=""
            draggable={false}
            aria-hidden="true"
          />
          <div className={styles.heroInner}>
            <p className={styles.heroEyebrow}>A living knowledge identity</p>
            <h1 className={styles.heroHeadline}>
              Everything you know,
              <br />
              woven into one self.
            </h1>
            <p className={styles.heroPrompt}>{c.promptText}</p>
            {inputForm}
            {importBits}
            {whisper}
          </div>
        </section>

        <LandingShowcase />
        <LandingFooter />
      </div>
    );
  }

  // ── Conversation / review mode — the focused cosmic surface ────────────────
  return (
    <main className={styles.cover}>
      <div className="loom-cosmic-field" aria-hidden />
      <ConstellationField data={constellation} />

      <div className={styles.brand}>
        <img
          className={styles.brandMoon}
          src="/brand/loom_lunar_orb.png"
          alt=""
          draggable={false}
          width={30}
          height={30}
        />
        <span className={styles.wordmark}>LOOM</span>
      </div>

      <section className={styles.locus} aria-label="Start your LOOM">
        <div
          className={styles.thread}
          role="log"
          aria-live="polite"
          aria-label="Your LOOM conversation"
        >
          {c.messages.map((msg, i) => (
            <div
              key={i}
              className={msg.from === 'loom' ? styles.bubbleLoom : styles.bubbleUser}
            >
              <span className={styles.bubbleText}>{msg.text}</span>
            </div>
          ))}
          {(c.isTyping || c.checking) && (
            <div className={styles.typingBubble} aria-label="LOOM is typing" aria-live="polite">
              <span className={styles.typingDots}>· · ·</span>
            </div>
          )}
          <div ref={c.bottomRef} />
        </div>

        {c.step.id === 'review' ? (
          <div className={styles.reviewActions}>
            {c.saveError && (
              <p className={styles.saveError} role="alert">
                {c.saveError}
              </p>
            )}
            {c.doneBeat ? (
              <p className={styles.doneBeat} role="status">
                Opening your Digital Me…
              </p>
            ) : (
              <button
                type="button"
                className={styles.save}
                onClick={c.handleSave}
                disabled={c.saving}
              >
                {c.saving ? 'Saving…' : 'Save & see my profile'}
              </button>
            )}
          </div>
        ) : (
          inputForm
        )}

        {importBits}
        {whisper}
      </section>
    </main>
  );
}
