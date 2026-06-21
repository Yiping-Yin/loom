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

import Link from 'next/link';
import { useConversation } from '../lib/onboarding/useConversation';
import { constellationFor } from '../lib/onboarding/constellation';
import { ConstellationField } from './ConstellationField';
import styles from './HomeConversationalCover.module.css';

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
        <MoonOrb />
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
 * The LOOM lunar mark — the same inline moon orb the chat client uses, kept in
 * sync visually (radial-grad moon + faint craters). Inline SVG (not the /public
 * asset) so it themes with the surface and needs no network/asset wiring.
 */
function MoonOrb() {
  return (
    <svg
      width={28}
      height={28}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="18" cy="18" r="18" fill="url(#cover-moon-grad)" />
      <circle cx="18" cy="18" r="17" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      <circle cx="13" cy="14" r="2.5" fill="rgba(0,0,0,0.18)" />
      <circle cx="22" cy="22" r="1.8" fill="rgba(0,0,0,0.14)" />
      <circle cx="24" cy="13" r="1.2" fill="rgba(0,0,0,0.10)" />
      <defs>
        <radialGradient id="cover-moon-grad" cx="38%" cy="28%" r="68%" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#d8e4e8" />
          <stop offset="55%" stopColor="#9ab0b8" />
          <stop offset="100%" stopColor="#5e7880" />
        </radialGradient>
      </defs>
    </svg>
  );
}
