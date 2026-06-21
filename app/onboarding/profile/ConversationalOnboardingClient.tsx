'use client';

import { useState, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { type BeginnerProfile } from '../../../lib/profile/beginner-profile';
import { useConversation } from '../../../lib/onboarding/useConversation';
import styles from './ConversationalOnboarding.module.css';
// Re-export the pure step helpers so existing consumers / contract tests that
// import them from the client module keep working. The real definitions live in
// lib/onboarding/steps.ts (pure, React-free, independently unit-tested).
export {
  applyAnswer,
  stepPrompt,
  progressOf,
  TOTAL_STEPS,
} from '../../../lib/onboarding/steps';

/** Accepted MIME types + extensions for résumé import. */
const RESUME_ACCEPT = '.pdf,.txt,.md,.markdown';

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Conversational onboarding — replaces the 5-step form as the default entry.
 * No LLM call: purely a scripted step machine. Prefills from localStorage if a
 * profile already exists (resume / edit flow).
 *
 * This is a thin VIEW over useConversation(): all state, timing, and side
 * effects live in the hook so a later cover surface can reuse the same engine.
 */
export function ConversationalOnboardingClient() {
  const c = useConversation();

  return (
    <main className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.moonAvatar} aria-hidden="true">
          <MoonOrb />
        </div>
        <div className={styles.headerText}>
          <span className={styles.eyebrow}>Profile · Setup</span>
          <h1 className={styles.title}>
            Let&apos;s build your <span className={styles.titleAccent}>LOOM.</span>
          </h1>
          <p className={styles.subtitle}>
            Upload your résumé (PDF) — or{' '}
            <button
              type="button"
              className={styles.inlineBtn}
              onClick={() => c.setImportMode(c.importMode === 'upload' ? 'none' : 'upload')}
            >
              import a file
            </button>
            {', or '}
            <button
              type="button"
              className={styles.inlineBtn}
              onClick={() => c.setImportMode(c.importMode === 'paste' ? 'none' : 'paste')}
            >
              paste text
            </button>
            .
          </p>
        </div>
      </header>

      {/* File upload affordance — primary import path */}
      {c.importMode === 'upload' && (
        <div className={styles.pasteBox}>
          <UploadArea
            onFile={c.handleFileUpload}
            onCancel={() => { c.setImportMode('none'); c.setUploadError(''); }}
            busy={c.uploadStatus !== 'idle'}
            status={c.uploadStatus}
            error={c.uploadError}
          />
        </div>
      )}

      {/* Paste résumé affordance — secondary */}
      {c.importMode === 'paste' && (
        <div className={styles.pasteBox}>
          <p className={styles.pasteLabel}>Upload your résumé (PDF) — or paste it.</p>
          <PasteArea
            onSubmit={c.handlePasteResume}
            onCancel={() => c.setImportMode('none')}
            busy={c.extracting}
          />
        </div>
      )}

      {/* In-progress state */}
      {(c.extracting || c.uploadStatus === 'extracting') && (
        <p className={styles.extractingNote} role="status" aria-live="polite">
          Extracting your profile…
        </p>
      )}
      {c.uploadStatus === 'reading' && (
        <p className={styles.extractingNote} role="status" aria-live="polite">
          Reading…
        </p>
      )}

      {/* Progress bar */}
      <div className={styles.progressBar} aria-label={`Progress: ${c.progress} of ${c.totalSteps}`}>
        <div
          className={styles.progressFill}
          style={{ width: `${Math.round((c.progress / c.totalSteps) * 100)}%` }}
        />
        <span className={styles.progressLabel}>
          {c.step.id === 'review' ? 'Done' : `${c.progress}/${c.totalSteps}`}
        </span>
      </div>

      {/* Chat thread */}
      <div className={styles.chatThread} role="log" aria-live="polite" aria-label="Onboarding conversation">
        {c.messages.map((msg, i) => (
          <div
            key={i}
            className={msg.from === 'loom' ? styles.bubbleLoom : styles.bubbleUser}
          >
            {msg.from === 'loom' && (
              <span className={styles.loomAvatar} aria-hidden="true">
                <MoonOrb small />
              </span>
            )}
            <span className={styles.bubbleText}>{msg.text}</span>
          </div>
        ))}
        {/* Typing indicator — shown while LOOM is "thinking" (advance tail or smart-layer check) */}
        {(c.isTyping || c.checking) && (
          <div className={styles.typingBubble} aria-label="LOOM is typing" aria-live="polite">
            <span className={styles.loomAvatar} aria-hidden="true">
              <MoonOrb small />
            </span>
            <div className={styles.typingDots}>
              <span className={styles.typingDot} />
              <span className={styles.typingDot} />
              <span className={styles.typingDot} />
            </div>
          </div>
        )}
        <div ref={c.bottomRef} />
      </div>

      {/* Input area */}
      {c.step.id !== 'review' ? (
        <form
          className={styles.inputRow}
          onSubmit={(e) => {
            e.preventDefault();
            void c.handleSubmit();
          }}
        >
          <input
            ref={c.inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            className={styles.chatInput}
            value={c.input}
            onChange={(e) => c.setInput(e.target.value)}
            placeholder="Type your answer…"
            aria-label="Your answer"
            autoComplete="off"
            autoFocus
            disabled={c.checking}
          />
          <button
            type="submit"
            className={styles.sendBtn}
            disabled={!c.input.trim() || c.isTyping || c.checking}
            aria-label="Send answer"
          >
            <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </form>
      ) : (
        /* Review + Save */
        <div className={styles.reviewActions}>
          <ProfileSummary profile={c.profile} />
          {c.saveError && (
            <p className={styles.errorNote} role="alert">
              {c.saveError}
            </p>
          )}
          {c.doneBeat ? (
            <p className={styles.doneBeat} role="status">
              Done — opening your Digital Me…
            </p>
          ) : (
            <div className={styles.reviewButtons}>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={c.handleSave}
                disabled={c.saving}
              >
                {c.saving ? 'Saving…' : 'Save & see my profile'}
                {!c.saving && <ArrowRight size={14} strokeWidth={1.8} aria-hidden="true" />}
              </button>
              <button
                type="button"
                className={styles.ghostBtn}
                onClick={c.goToForm}
              >
                Edit in form
              </button>
            </div>
          )}
        </div>
      )}

      {/* Footer links */}
      <footer className={styles.footer}>
        <button type="button" className={styles.footerLink} onClick={c.goToForm}>
          Prefer a form?
        </button>
      </footer>
    </main>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MoonOrb({ small }: { small?: boolean }) {
  const size = small ? 20 : 36;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="18" cy="18" r="18" fill="url(#moon-grad)" />
      <circle cx="18" cy="18" r="17" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      {/* Simple craters for a moon look */}
      <circle cx="13" cy="14" r="2.5" fill="rgba(0,0,0,0.18)" />
      <circle cx="22" cy="22" r="1.8" fill="rgba(0,0,0,0.14)" />
      <circle cx="24" cy="13" r="1.2" fill="rgba(0,0,0,0.10)" />
      <defs>
        <radialGradient id="moon-grad" cx="38%" cy="28%" r="68%" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#d8e4e8" />
          <stop offset="55%" stopColor="#9ab0b8" />
          <stop offset="100%" stopColor="#5e7880" />
        </radialGradient>
      </defs>
    </svg>
  );
}

/**
 * File upload zone — the primary résumé import affordance.
 * A clear file-input button. Drop zone is a bonus on top.
 */
function UploadArea({
  onFile,
  onCancel,
  busy = false,
  status,
  error,
}: {
  onFile: (file: File) => void;
  onCancel: () => void;
  busy?: boolean;
  status: 'idle' | 'reading' | 'extracting';
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
    // Reset so the same file can be re-selected after an error
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  };

  const statusLabel =
    status === 'reading' ? 'Reading…' :
    status === 'extracting' ? 'Extracting…' :
    'Choose file';

  return (
    <div className={styles.uploadInner}>
      {/* Drop zone */}
      <div
        className={`${styles.dropZone} ${dragging ? styles.dropZoneDragging : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        aria-label="Drop your résumé here"
      >
        <span className={styles.uploadIcon} aria-hidden="true">↑</span>
        <span className={styles.dropZoneText}>
          {busy ? statusLabel : 'Drop your résumé here'}
        </span>
        <span className={styles.dropZoneHint}>PDF, TXT, or MD · max 10 MB</span>
      </div>
      {/* Error */}
      {error && (
        <p className={styles.uploadError} role="alert">{error}</p>
      )}
      {/* Actions */}
      <div className={styles.pasteActions}>
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          {statusLabel}
        </button>
        <button
          type="button"
          className={styles.ghostBtn}
          onClick={onCancel}
          disabled={busy}
        >
          Cancel
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={RESUME_ACCEPT}
        className={styles.fileInputHidden}
        onChange={handleChange}
        aria-label="Upload résumé file"
        disabled={busy}
      />
    </div>
  );
}

function PasteArea({
  onSubmit,
  onCancel,
  busy = false,
}: {
  onSubmit: (text: string) => void;
  onCancel: () => void;
  busy?: boolean;
}) {
  const [text, setText] = useState('');
  return (
    <div className={styles.pasteInner}>
      <textarea
        className={styles.pasteTextarea}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste your résumé text here…"
        rows={8}
        disabled={busy}
        autoFocus
      />
      <div className={styles.pasteActions}>
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={() => onSubmit(text)}
          disabled={!text.trim() || busy}
        >
          {busy ? 'Extracting…' : 'Use this résumé'}
        </button>
        <button
          type="button"
          className={styles.ghostBtn}
          onClick={onCancel}
          disabled={busy}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function ProfileSummary({ profile }: { profile: BeginnerProfile }) {
  return (
    <div className={styles.summary}>
      <div className={styles.summaryRow}>
        <span className={styles.summaryLabel}>Name</span>
        <span className={styles.summaryValue}>
          {profile.home.name || <em className={styles.summaryEmpty}>not set</em>}
        </span>
      </div>
      {profile.home.headline && (
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>Headline</span>
          <span className={styles.summaryValue}>{profile.home.headline}</span>
        </div>
      )}
      {profile.about.summary && (
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>About</span>
          <span className={styles.summaryValue}>{profile.about.summary}</span>
        </div>
      )}
      {profile.education.length > 0 && (
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>Education</span>
          <span className={styles.summaryValue}>
            {profile.education.map((e) => `${e.qualification} · ${e.institution}`).join('; ')}
          </span>
        </div>
      )}
      {profile.experience.length > 0 && (
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>Experience</span>
          <span className={styles.summaryValue}>
            {profile.experience.map((e) => `${e.role} · ${e.organization}`).join('; ')}
          </span>
        </div>
      )}
      {profile.works.length > 0 && (
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>Works</span>
          <span className={styles.summaryValue}>
            {profile.works.map((w) => w.title).join('; ')}
          </span>
        </div>
      )}
    </div>
  );
}
