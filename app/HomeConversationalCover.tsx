'use client';

/**
 * HomeConversationalCover — the new-user front door for the conversational
 * cosmos entry. A calm dark cosmic surface whose locus is ONE living prompt and
 * a single input; the onboarding conversation then continues on the same
 * surface, a constellation forms behind it as the profile fills, and the only
 * chrome is three whispered links ("See an example" / "Import a résumé" /
 * "Prefer a form?").
 *
 * This is NOT a route — it is a component HomeGate renders for a no-profile
 * visitor. It is a thin VIEW over the SHARED useConversation() engine (same hook
 * the /onboarding/profile chat client binds to), so the scripted step machine,
 * timing/typing beats, answer-quality gate, résumé import side effects, and
 * navigation are all identical — only the styling differs.
 *
 * Résumé import is deliberately minimal here: a single whisper word that opens
 * the system file picker directly (no inline panel, no format blurb, no paste
 * box) — the cover stays sparse. Full upload/paste lives in the form.
 */

import { useRef } from 'react';
import Link from 'next/link';
import { useConversation } from '../lib/onboarding/useConversation';
import { constellationFor } from '../lib/onboarding/constellation';
import { ConstellationField } from './ConstellationField';
import styles from './HomeConversationalCover.module.css';

/** Accepted résumé extensions for the quiet import. */
const RESUME_ACCEPT = '.pdf,.txt,.md,.markdown';

export function HomeConversationalCover() {
  const c = useConversation();
  const constellation = constellationFor(c.profile);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const importBusy = c.uploadStatus !== 'idle' || c.extracting;

  return (
    <main className={styles.cover}>
      {/* Deep-space backdrop (fixed, z-index:-1) + forming constellation. Both
          decorative and aria-hidden — the constellation grows as areas fill. */}
      <div className="loom-cosmic-field" aria-hidden />
      <ConstellationField data={constellation} />

      {/* Brand mark: the photoreal lunar moon + LOOM wordmark, quiet at the top. */}
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
        {c.messages.length === 0 ? (
          // First contact: the single living prompt is the locus.
          <p className={styles.prompt}>{c.promptText}</p>
        ) : (
          // The conversation continues on the same surface.
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
        )}

        {c.step.id === 'review' ? (
          // The conversation is complete — replace the input with the publish
          // action so a user who finished the whole chat on the cover isn't
          // trapped re-answering the final prompt.
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
              placeholder="Tell me about yourself…"
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
        )}

        {/* Résumé import (answer-time only) — a hidden file input opened by the
            "Import a résumé" whisper link below; a quiet status line while a
            picked file is read/extracted. Gone at review (nothing left to fill). */}
        {c.step.id !== 'review' && (
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
        )}

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
                onClick={() => resumeInputRef.current?.click()}
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
      </section>
    </main>
  );
}
