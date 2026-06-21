'use client';

/**
 * HomeConversationalCover — the new-user front door for the conversational
 * cosmos entry. A calm dark cosmic surface whose locus is ONE living prompt and
 * a single input; the onboarding conversation then continues on the same
 * surface, a constellation forms behind it as the profile fills, and the only
 * chrome is two whispered links ("See an example" / "Prefer a form?").
 *
 * This is NOT a route — it is a component HomeGate renders for a no-profile
 * visitor (Task 4). It is a thin VIEW over the SHARED useConversation() engine
 * (same hook the /onboarding/profile chat client binds to), so the scripted
 * step machine, timing/typing beats, answer-quality gate, résumé import side
 * effects, and navigation are all identical — only the styling differs.
 *
 * DOM coupling: the hook owns inputRef/bottomRef plus its auto-focus and
 * auto-scroll-to-bottom effects, tuned for exactly this layout (one focusable
 * input + one scroll region). The cover reuses c.inputRef on its input and
 * c.bottomRef on its scroll anchor so those effects apply cleanly — no fork.
 */

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useConversation, type ConversationApi } from '../lib/onboarding/useConversation';
import { constellationFor } from '../lib/onboarding/constellation';
import { ConstellationField } from './ConstellationField';
import styles from './HomeConversationalCover.module.css';

/** Accepted résumé extensions (mirrors the chat client's import affordance). */
const RESUME_ACCEPT = '.pdf,.txt,.md,.markdown';

export function HomeConversationalCover() {
  const c = useConversation();
  const constellation = constellationFor(c.profile);

  return (
    <main className={styles.cover}>
      {/* Deep-space backdrop (fixed, z-index:-1) + forming constellation. Both
          decorative and aria-hidden — the constellation grows as areas fill. */}
      <div className="loom-cosmic-field" aria-hidden />
      <ConstellationField data={constellation} />

      {/* Brand mark: the lunar moon + LOOM wordmark, quiet at the top. */}
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
          // trapped re-answering the final prompt. Mirrors the chat client's
          // review branch (Save · saveError · doneBeat); the "Prefer a form?"
          // escape stays in the whisper nav below.
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

        {/* Résumé import: a quiet whisper toggle that lets a new user auto-fill
            from a CV instead of typing every answer. Pure VIEW over the shared
            hook's import side effects — no forked logic. Gone once we reach
            review (there's nothing left to pre-fill). */}
        {c.step.id !== 'review' && <ResumeImport c={c} />}

        <nav className={styles.whisper} aria-label="Other ways to start">
          <Link href="/example" className={styles.whisperLink}>
            See an example
          </Link>
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

/**
 * ResumeImport — a quiet "Import a résumé" whisper on the cover that lets a new
 * user auto-fill from a CV rather than typing every answer. It is a sparser
 * cosmic VIEW over the SAME shared hook side effects the chat client's
 * UploadArea/PasteArea drive (c.importMode/c.handleFileUpload/c.handlePasteResume
 * /c.uploadStatus/c.uploadError/c.extracting) — no forked logic.
 *
 * The hook closes c.importMode back to 'none' the moment an import starts (see
 * handleFileUpload/handlePasteResume), so the busy/error feedback lives OUTSIDE
 * the open panel — otherwise "Extracting…" would vanish the instant it began.
 * The caller renders this only before review.
 */
function ResumeImport({ c }: { c: ConversationApi }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pasteText, setPasteText] = useState('');
  const open = c.importMode !== 'none';
  const busy = c.uploadStatus !== 'idle' || c.extracting;
  const status =
    c.uploadStatus === 'reading'
      ? 'Reading…'
      : c.uploadStatus === 'extracting' || c.extracting
        ? 'Extracting your profile…'
        : '';

  return (
    <div className={styles.import}>
      <button
        type="button"
        className={styles.importToggle}
        onClick={() => c.setImportMode(open ? 'none' : 'upload')}
        aria-expanded={open}
        disabled={busy}
      >
        {open ? 'Hide résumé import' : 'Import a résumé'}
      </button>

      {open && (
        <div className={styles.importPanel}>
          {c.importMode === 'upload' ? (
            <div className={styles.importRow}>
              <button
                type="button"
                className={styles.importAction}
                onClick={() => fileInputRef.current?.click()}
                disabled={busy}
              >
                Choose a file
              </button>
              <button
                type="button"
                className={styles.importSwitch}
                onClick={() => {
                  c.setUploadError('');
                  c.setImportMode('paste');
                }}
                disabled={busy}
              >
                or paste text
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept={RESUME_ACCEPT}
                className={styles.importFile}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void c.handleFileUpload(file);
                  // Reset so the same file can be re-picked after an error.
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                aria-label="Upload résumé file"
                disabled={busy}
              />
            </div>
          ) : (
            <div className={styles.importPaste}>
              <textarea
                className={styles.importTextarea}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Paste your résumé text…"
                rows={6}
                disabled={busy}
                aria-label="Paste résumé text"
              />
              <div className={styles.importRow}>
                <button
                  type="button"
                  className={styles.importAction}
                  onClick={() => void c.handlePasteResume(pasteText)}
                  disabled={!pasteText.trim() || busy}
                >
                  Use this résumé
                </button>
                <button
                  type="button"
                  className={styles.importSwitch}
                  onClick={() => {
                    c.setUploadError('');
                    c.setImportMode('upload');
                  }}
                  disabled={busy}
                >
                  or upload a file
                </button>
              </div>
            </div>
          )}
          <p className={styles.importHint}>PDF, TXT, or MD · max 10 MB</p>
        </div>
      )}

      {status && (
        <p className={styles.importStatus} role="status" aria-live="polite">
          {status}
        </p>
      )}
      {c.uploadError && (
        <p className={styles.importError} role="alert">
          {c.uploadError}
        </p>
      )}
    </div>
  );
}
