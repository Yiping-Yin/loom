'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import {
  emptyBeginnerProfile,
  normalizeBeginnerProfile,
  type BeginnerProfile,
  type EducationEntry,
  type ExperienceEntry,
  type WorkItem,
} from '../../../lib/profile/beginner-profile';
import {
  readBeginnerProfileLocal,
  writeBeginnerProfileLocal,
} from '../../../lib/profile/profile-storage';
import styles from './ConversationalOnboarding.module.css';

// ── Step machine ─────────────────────────────────────────────────────────────

/**
 * Each discriminated step knows which field in BeginnerProfile it populates.
 * The machine is deterministic and offline-safe — no LLM call.
 */
export type ConvoStep =
  | { id: 'name' }
  | { id: 'headline' }
  | { id: 'summary' }
  | { id: 'edu_institution'; entryIdx: number }
  | { id: 'edu_qualification'; entryIdx: number }
  | { id: 'edu_years'; entryIdx: number }
  | { id: 'edu_more' }
  | { id: 'exp_role'; entryIdx: number }
  | { id: 'exp_organization'; entryIdx: number }
  | { id: 'exp_years'; entryIdx: number }
  | { id: 'exp_highlight'; entryIdx: number }
  | { id: 'exp_more' }
  | { id: 'work_title'; entryIdx: number }
  | { id: 'work_description'; entryIdx: number }
  | { id: 'work_link'; entryIdx: number }
  | { id: 'work_more' }
  | { id: 'review' };

export const TOTAL_STEPS = 15; // name + headline + summary + edu(3) + exp(4) + edu_more + exp_more + works(4) ≈ 15 logical beats

function stepPrompt(step: ConvoStep): string {
  switch (step.id) {
    case 'name':
      return "What's your full name?";
    case 'headline':
      return "Great! Now a one-line headline — what do you do and where? (e.g. Quant developer · Sydney)";
    case 'summary':
      return "Perfect. Write a short bio for your About page — a sentence or two about who you are and what you work on. Or type \"skip\" to leave it for later.";
    case 'edu_institution':
      return step.entryIdx === 0
        ? "Let's add your education. Which institution did you (or do you) attend? (or type \"skip\" to move on)"
        : "Another institution?";
    case 'edu_qualification':
      return "What qualification or degree? (e.g. BSc Mathematics)";
    case 'edu_years':
      return "Start and end years? (e.g. 2019–2022, or just \"2022\", or \"skip\")";
    case 'edu_more':
      return "Add another education entry? (yes / no)";
    case 'exp_role':
      return step.entryIdx === 0
        ? "Now let's add your experience. What was your role or job title? (or type \"skip\" to move on)"
        : "Another role?";
    case 'exp_organization':
      return "Which organisation or company?";
    case 'exp_years':
      return "Dates? (e.g. Jan 2021–Present, or \"skip\")";
    case 'exp_highlight':
      return "One highlight bullet — what did you accomplish or build? (or \"skip\")";
    case 'exp_more':
      return "Add another experience entry? (yes / no)";
    case 'work_title':
      return step.entryIdx === 0
        ? "Now let's add your works or projects. What's the project title? (or type \"skip\" to finish)"
        : "Another project?";
    case 'work_description':
      return "One-line description — what did you build or create? (or \"skip\")";
    case 'work_link':
      return "A link to the project, portfolio, or write-up? (URL or \"skip\")";
    case 'work_more':
      return "Add another project? (yes / no)";
    case 'review':
      return "You're all set! Here's what I have. Hit Save to publish your profile, or go back to the form to edit anything.";
  }
}

function progressOf(step: ConvoStep): number {
  // Returns a 1-based index out of TOTAL_STEPS for display
  switch (step.id) {
    case 'name': return 1;
    case 'headline': return 2;
    case 'summary': return 3;
    case 'edu_institution': return 4;
    case 'edu_qualification': return 5;
    case 'edu_years': return 6;
    case 'edu_more': return 7;
    case 'exp_role': return 8;
    case 'exp_organization': return 9;
    case 'exp_years': return 10;
    case 'exp_highlight': return 11;
    case 'exp_more': return 11;
    case 'work_title': return 12;
    case 'work_description': return 13;
    case 'work_link': return 14;
    case 'work_more': return 14;
    case 'review': return TOTAL_STEPS;
  }
}

const isSkip = (answer: string) => /^(skip|s|no|nope|none|n\/a|-)$/i.test(answer.trim());
const isYes = (answer: string) => /^(yes|y|yeah|sure|yep|ok)$/i.test(answer.trim());

/**
 * Pure, exported transition function. Takes the current profile + step + user
 * answer and returns { next: ConvoStep, profile: BeginnerProfile }.
 *
 * This is unit-tested directly via applyAnswer in tests/conversational-onboarding.test.tsx.
 */
export function applyAnswer(
  profile: BeginnerProfile,
  step: ConvoStep,
  answer: string,
): { next: ConvoStep; profile: BeginnerProfile } {
  const trimmed = answer.trim();

  switch (step.id) {
    case 'name': {
      const next: BeginnerProfile = {
        ...profile,
        home: { ...profile.home, name: trimmed },
      };
      return { next: { id: 'headline' }, profile: next };
    }
    case 'headline': {
      const next: BeginnerProfile = {
        ...profile,
        home: { ...profile.home, headline: trimmed },
      };
      return { next: { id: 'summary' }, profile: next };
    }
    case 'summary': {
      const summary = isSkip(trimmed) ? profile.about.summary : trimmed;
      const next: BeginnerProfile = {
        ...profile,
        about: { ...profile.about, summary },
      };
      return { next: { id: 'edu_institution', entryIdx: 0 }, profile: next };
    }
    case 'edu_institution': {
      if (isSkip(trimmed)) {
        return { next: { id: 'exp_role', entryIdx: 0 }, profile };
      }
      // Start a new education entry. Index the just-appended slot rather than
      // step.entryIdx — on a returning/pre-populated profile the new entry lands
      // at the end of an already-populated array, not at index 0.
      const edu: EducationEntry = { institution: trimmed, qualification: '' };
      const education = [...profile.education, edu];
      const next: BeginnerProfile = { ...profile, education };
      return {
        next: { id: 'edu_qualification', entryIdx: education.length - 1 },
        profile: next,
      };
    }
    case 'edu_qualification': {
      const idx = step.entryIdx;
      const updated = profile.education.map((e, i) =>
        i === idx ? { ...e, qualification: trimmed } : e,
      );
      return {
        next: { id: 'edu_years', entryIdx: idx },
        profile: { ...profile, education: updated },
      };
    }
    case 'edu_years': {
      const idx = step.entryIdx;
      const yearsStr = isSkip(trimmed) ? '' : trimmed;
      // Parse "2019–2022", "2019-2022", or single year
      const parts = yearsStr.split(/[–—-]/).map((p) => p.trim());
      const start = parts[0] || undefined;
      const end = parts[1] || undefined;
      const updated = profile.education.map((e, i) =>
        i === idx ? { ...e, start, end } : e,
      );
      return { next: { id: 'edu_more' }, profile: { ...profile, education: updated } };
    }
    case 'edu_more': {
      if (isYes(trimmed)) {
        const nextIdx = profile.education.length;
        return { next: { id: 'edu_institution', entryIdx: nextIdx }, profile };
      }
      return { next: { id: 'exp_role', entryIdx: 0 }, profile };
    }
    case 'exp_role': {
      if (isSkip(trimmed)) {
        // Skipping experience must still let a user (e.g. a student with
        // projects but no jobs) reach the Works section, not jump to review.
        return { next: { id: 'work_title', entryIdx: 0 }, profile };
      }
      const exp: ExperienceEntry = { role: trimmed, organization: '', bullets: [] };
      const experience = [...profile.experience, exp];
      const next: BeginnerProfile = { ...profile, experience };
      return {
        next: { id: 'exp_organization', entryIdx: experience.length - 1 },
        profile: next,
      };
    }
    case 'exp_organization': {
      const idx = step.entryIdx;
      const updated = profile.experience.map((e, i) =>
        i === idx ? { ...e, organization: trimmed } : e,
      );
      return {
        next: { id: 'exp_years', entryIdx: idx },
        profile: { ...profile, experience: updated },
      };
    }
    case 'exp_years': {
      const idx = step.entryIdx;
      const yearsStr = isSkip(trimmed) ? '' : trimmed;
      const parts = yearsStr.split(/[–—-]/).map((p) => p.trim());
      const start = parts[0] || undefined;
      // Preserve "Present" if it was part of the answer
      const endRaw = parts.slice(1).join('-').trim();
      const end = endRaw || undefined;
      const updated = profile.experience.map((e, i) =>
        i === idx ? { ...e, start, end } : e,
      );
      return {
        next: { id: 'exp_highlight', entryIdx: idx },
        profile: { ...profile, experience: updated },
      };
    }
    case 'exp_highlight': {
      const idx = step.entryIdx;
      const bullets = isSkip(trimmed) ? [] : [trimmed];
      const updated = profile.experience.map((e, i) =>
        i === idx ? { ...e, bullets: [...e.bullets, ...bullets] } : e,
      );
      return {
        next: { id: 'exp_more' },
        profile: { ...profile, experience: updated },
      };
    }
    case 'exp_more': {
      if (isYes(trimmed)) {
        const nextIdx = profile.experience.length;
        return { next: { id: 'exp_role', entryIdx: nextIdx }, profile };
      }
      return { next: { id: 'work_title', entryIdx: 0 }, profile };
    }
    case 'work_title': {
      if (isSkip(trimmed)) {
        return { next: { id: 'review' }, profile };
      }
      const work: WorkItem = { title: trimmed };
      const works = [...profile.works, work];
      const next: BeginnerProfile = { ...profile, works };
      return {
        next: { id: 'work_description', entryIdx: works.length - 1 },
        profile: next,
      };
    }
    case 'work_description': {
      const idx = step.entryIdx;
      const description = isSkip(trimmed) ? undefined : trimmed;
      const updated = profile.works.map((w, i) =>
        i === idx ? { ...w, description } : w,
      );
      return {
        next: { id: 'work_link', entryIdx: idx },
        profile: { ...profile, works: updated },
      };
    }
    case 'work_link': {
      const idx = step.entryIdx;
      const link = isSkip(trimmed) ? undefined : trimmed;
      const updated = profile.works.map((w, i) =>
        i === idx ? { ...w, link } : w,
      );
      return {
        next: { id: 'work_more' },
        profile: { ...profile, works: updated },
      };
    }
    case 'work_more': {
      if (isYes(trimmed)) {
        const nextIdx = profile.works.length;
        return { next: { id: 'work_title', entryIdx: nextIdx }, profile };
      }
      return { next: { id: 'review' }, profile };
    }
    case 'review':
      // No further transitions from review — caller handles save
      return { next: { id: 'review' }, profile };
  }
}

// ── Chat message types ────────────────────────────────────────────────────────

type ChatMessage =
  | { from: 'loom'; text: string }
  | { from: 'user'; text: string };

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Conversational onboarding — replaces the 5-step form as the default entry.
 * No LLM call: purely a scripted step machine. Prefills from localStorage if a
 * profile already exists (resume / edit flow).
 */
export function ConversationalOnboardingClient() {
  const router = useRouter();
  const [profile, setProfile] = useState<BeginnerProfile>(emptyBeginnerProfile());
  const [step, setStep] = useState<ConvoStep>({ id: 'name' });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [pasteMode, setPasteMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Seed the initial LOOM question
  useEffect(() => {
    const stored = readBeginnerProfileLocal();
    const prefilled = stored ?? emptyBeginnerProfile();
    setProfile(prefilled);
    setMessages([{ from: 'loom', text: stepPrompt({ id: 'name' }) }]);
  }, []);

  // Auto-scroll to bottom as messages grow
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-focus input after each exchange
  useEffect(() => {
    if (step.id !== 'review') {
      inputRef.current?.focus();
    }
  }, [step]);

  const appendMessages = (msgs: ChatMessage[]) => {
    setMessages((prev) => [...prev, ...msgs]);
  };

  const handleSubmit = (answerOverride?: string) => {
    const answer = (answerOverride ?? input).trim();
    if (!answer) return;

    // Append the user bubble
    const userMsg: ChatMessage = { from: 'user', text: answer };

    // Transition
    const { next, profile: nextProfile } = applyAnswer(profile, step, answer);
    setProfile(nextProfile);
    setStep(next);
    setInput('');

    // Append user bubble + next LOOM prompt
    const loomMsg: ChatMessage = { from: 'loom', text: stepPrompt(next) };
    appendMessages([userMsg, loomMsg]);
  };

  const handlePasteResume = (text: string) => {
    // Drop the pasted text into the about summary (real auto-extract is deferred).
    const trimmed = text.trim();
    if (!trimmed) return;
    setProfile((p) => ({
      ...p,
      about: { ...p.about, summary: trimmed },
    }));
    setPasteMode(false);
    // Advance to name step if still at the very start, otherwise stay
    if (step.id === 'name') {
      appendMessages([
        { from: 'user', text: '[Résumé pasted]' },
        {
          from: 'loom',
          text: "Got it — I've stored your résumé text as your About summary. You can refine it later. Let's fill in the rest. What's your full name?",
        },
      ]);
    }
  };

  const handleSave = () => {
    setSaving(true);
    try {
      writeBeginnerProfileLocal(normalizeBeginnerProfile(profile));
      router.push('/digital-me');
    } catch {
      setSaving(false);
    }
  };

  const currentProgress = progressOf(step);
  const progressPercent = Math.round((currentProgress / TOTAL_STEPS) * 100);

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
            No forms, just answer a few questions — or{' '}
            <button
              type="button"
              className={styles.inlineBtn}
              onClick={() => setPasteMode((v) => !v)}
            >
              paste a résumé
            </button>
            .
          </p>
        </div>
      </header>

      {/* Paste résumé affordance */}
      {pasteMode && (
        <div className={styles.pasteBox}>
          <p className={styles.pasteLabel}>
            Paste your résumé text below. It will be saved as your About summary — you can edit it
            later.{' '}
            <span className={styles.pasteNote}>(Auto-extraction coming soon.)</span>
          </p>
          <PasteArea onSubmit={handlePasteResume} onCancel={() => setPasteMode(false)} />
        </div>
      )}

      {/* Progress bar */}
      <div className={styles.progressBar} aria-label={`Progress: ${currentProgress} of ${TOTAL_STEPS}`}>
        <div
          className={styles.progressFill}
          style={{ width: `${progressPercent}%` }}
        />
        <span className={styles.progressLabel}>
          {step.id === 'review' ? 'Done' : `${currentProgress}/${TOTAL_STEPS}`}
        </span>
      </div>

      {/* Chat thread */}
      <div className={styles.chatThread} role="log" aria-live="polite" aria-label="Onboarding conversation">
        {messages.map((msg, i) => (
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
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      {step.id !== 'review' ? (
        <form
          className={styles.inputRow}
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            className={styles.chatInput}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your answer…"
            aria-label="Your answer"
            autoComplete="off"
            autoFocus
          />
          <button
            type="submit"
            className={styles.sendBtn}
            disabled={!input.trim()}
            aria-label="Send answer"
          >
            <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </form>
      ) : (
        /* Review + Save */
        <div className={styles.reviewActions}>
          <ProfileSummary profile={profile} />
          <div className={styles.reviewButtons}>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save & see my profile'}
              {!saving && <ArrowRight size={14} strokeWidth={1.8} aria-hidden="true" />}
            </button>
          </div>
        </div>
      )}

      {/* Footer links */}
      <footer className={styles.footer}>
        <Link href="/onboarding/profile/form" className={styles.footerLink}>
          Prefer a form?
        </Link>
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

function PasteArea({
  onSubmit,
  onCancel,
}: {
  onSubmit: (text: string) => void;
  onCancel: () => void;
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
        autoFocus
      />
      <div className={styles.pasteActions}>
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={() => onSubmit(text)}
          disabled={!text.trim()}
        >
          Use this résumé
        </button>
        <button type="button" className={styles.ghostBtn} onClick={onCancel}>
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
