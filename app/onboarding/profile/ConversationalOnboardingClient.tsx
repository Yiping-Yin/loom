'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import {
  emptyBeginnerProfile,
  normalizeBeginnerProfile,
  type BeginnerProfile,
  type EducationEntry,
  type ExperienceEntry,
  type WorkItem,
  type ArtifactRef,
} from '../../../lib/profile/beginner-profile';
import {
  readBeginnerProfileLocal,
  writeBeginnerProfileLocal,
} from '../../../lib/profile/profile-storage';
import { mergeExtractedProfile } from '../../../lib/profile/merge-extracted-profile';
import {
  type ConvoStep,
  isSkip,
  isYes,
  decideChatGate,
} from '../../../lib/onboarding/chat-gate';
import { validateAnswerRemote } from '../../../lib/onboarding/validate-answer-client';
import styles from './ConversationalOnboarding.module.css';

/** Max file size for résumé import (mirrors the Proof section: 10 MB). */
const RESUME_MAX_BYTES = 10 * 1024 * 1024;

/** Accepted MIME types + extensions for résumé import. */
const RESUME_ACCEPT = '.pdf,.txt,.md,.markdown';
const RESUME_ACCEPTED_TYPES = new Set([
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/x-markdown',
]);

// ── Step machine ─────────────────────────────────────────────────────────────
// The ConvoStep type, isSkip/isYes, fieldOf/stepKey, and the pure gate decision
// (decideChatGate) live in lib/onboarding/chat-gate.ts so they're unit-testable
// without a React/jsdom harness. This component owns only the rendering + the
// component-local pure helpers (stepPrompt, progressOf, applyAnswer).

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

/**
 * Returns true if the user's OS has prefers-reduced-motion: reduce set.
 * Falls back to false in SSR / environments without matchMedia.
 */
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

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
  const [importMode, setImportMode] = useState<'none' | 'upload' | 'paste'>('none');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'reading' | 'extracting'>('idle');
  const [uploadError, setUploadError] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [doneBeat, setDoneBeat] = useState(false);
  const [reasked, setReasked] = useState<Set<string>>(() => new Set());
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

  /** Show the user's answer + one quiet LOOM coaching bubble, without advancing. */
  const nudge = (userText: string, hint?: string) => {
    setInput('');
    setMessages((prev) => [...prev, { from: 'user', text: userText }]);
    const text = hint ?? "That doesn't look quite right — mind trying again?";
    const delay = prefersReducedMotion() ? 0 : 500;
    if (delay === 0) {
      setMessages((prev) => [...prev, { from: 'loom', text }]);
    } else {
      setIsTyping(true);
      setTimeout(() => {
        setMessages((prev) => [...prev, { from: 'loom', text }]);
        setIsTyping(false);
      }, delay);
    }
  };

  /**
   * Handles a user answer submission.
   *
   * Timing logic lives here, NOT in applyAnswer, so that applyAnswer stays pure
   * and the contract tests remain synchronous.
   *
   * Flow:
   *  1. Append user bubble immediately.
   *  2. Set isTyping (shows 3-dot pulse in the LOOM avatar slot).
   *  3. Wait ~500ms (or ~0ms under prefers-reduced-motion).
   *  4. Append the LOOM prompt bubble, clear isTyping.
   */
  const handleSubmit = async (answerOverride?: string) => {
    let answer = (answerOverride ?? input).trim();
    if (!answer || isTyping) return;

    // Answer-quality gate (free-text steps only; skip answers + already-reasked pass through).
    // Two layers: the deterministic floor (offline, always) then the optional LLM smart layer
    // (keyed web only, fail-open). Both can re-ask ONCE; neither traps the user.
    const gate = decideChatGate(step, answer, reasked);
    if (gate.kind === 'nudge') {
      setReasked((s) => new Set(s).add(gate.key));
      nudge(answer, gate.hint);
      return;
    }
    if (gate.kind === 'check') {
      const remote = await validateAnswerRemote(gate.field, stepPrompt(step), answer);
      if (remote.verdict === 'reask') {
        setReasked((s) => new Set(s).add(gate.key));
        nudge(answer, remote.hint);
        return;
      }
      if (remote.verdict === 'clean' && remote.cleaned) answer = remote.cleaned;
    }

    const userMsg: ChatMessage = { from: 'user', text: answer };

    // Transition (pure — no side effects)
    const { next, profile: nextProfile } = applyAnswer(profile, step, answer);
    setProfile(nextProfile);
    setStep(next);
    setInput('');

    // Append user bubble first
    setMessages((prev) => [...prev, userMsg]);

    const delay = prefersReducedMotion() ? 0 : 500;

    if (delay === 0) {
      // Instant path for reduced-motion users
      const loomMsg: ChatMessage = { from: 'loom', text: stepPrompt(next) };
      setMessages((prev) => [...prev, loomMsg]);
    } else {
      setIsTyping(true);
      setTimeout(() => {
        const loomMsg: ChatMessage = { from: 'loom', text: stepPrompt(next) };
        setMessages((prev) => [...prev, loomMsg]);
        setIsTyping(false);
      }, delay);
    }
  };

  /**
   * Fallback when structured extraction is unavailable (no API key on this
   * deploy, the /api route is shelved in the static export → 404, or extraction
   * failed/returned malformed output). Preserves the original behavior: drop the
   * raw text into about.summary and tell the user honestly.
   */
  const storePastedAsSummary = (trimmed: string) => {
    setProfile((p) => normalizeBeginnerProfile({
      ...p,
      about: { ...p.about, summary: trimmed },
    }));
    if (step.id === 'name') {
      appendMessages([
        {
          from: 'loom',
          text: "Saved to your summary — I couldn't auto-structure it just now. Let's fill in the rest. What's your full name?",
        },
      ]);
    }
  };

  /**
   * Apply a successfully extracted profile: merge the structured fields into the
   * in-progress profile (without clobbering anything the user already typed) so
   * they land on a POPULATED, citeable profile.
   */
  const applyExtractedProfile = (extracted: BeginnerProfile) => {
    setProfile((p) => mergeExtractedProfile(p, extracted));
    if (step.id === 'name') {
      const bits: string[] = [];
      if (extracted.education.length) bits.push(`${extracted.education.length} education`);
      if (extracted.experience.length) bits.push(`${extracted.experience.length} experience`);
      if (extracted.works.length) bits.push(`${extracted.works.length} project${extracted.works.length === 1 ? '' : 's'}`);
      const detail = bits.length ? ` (${bits.join(', ')})` : '';
      appendMessages([
        {
          from: 'loom',
          text: `Got it — I pulled a structured profile from that${detail}. What's your full name? (I'll fill the rest in, and you can review everything at the end.)`,
        },
      ]);
    }
  };

  /**
   * File-upload résumé handler.
   *
   * Steps:
   *   1. Validate file (size, type).
   *   2. Show "Reading…" state.
   *   3. putArtifact → stores blob in IndexedDB + extracts PDF text + thumbnail.
   *   4. Get text: PDF → meta.extractedText; .txt/.md → file.text().
   *   5. Run extraction (same POST flow as paste); falls back to about.summary.
   *   6. Add the ArtifactRef (labelled "CV / Résumé") to profile.artifacts.
   */
  const handleFileUpload = async (file: File) => {
    // Validate
    if (file.size > RESUME_MAX_BYTES) {
      setUploadError('File is larger than 10 MB — please use a smaller PDF or paste the text instead.');
      return;
    }
    const type = (file.type || '').toLowerCase();
    const name = (file.name || '').toLowerCase();
    const isText = type === 'text/plain' || type === 'text/markdown' || type === 'text/x-markdown'
      || name.endsWith('.txt') || name.endsWith('.md') || name.endsWith('.markdown');
    const isPdf = type === 'application/pdf' || name.endsWith('.pdf');
    if (!isPdf && !isText && !RESUME_ACCEPTED_TYPES.has(type)) {
      setUploadError('Unsupported file type. Please upload a PDF, .txt, or .md file.');
      return;
    }

    setUploadError('');
    setImportMode('none');
    setUploadStatus('reading');
    appendMessages([{ from: 'user', text: `[Uploading: ${file.name}]` }]);

    try {
      // putArtifact is client-only (IndexedDB + pdfjs) — imported dynamically
      // to stay SSR-safe (this function only runs on user action in the browser).
      const { putArtifact } = await import('../../../lib/artifact/artifact-store');
      const meta = await putArtifact(file);

      // Get extractable text
      let text: string | undefined;
      if (isPdf) {
        text = meta.extractedText;
      } else if (isText) {
        try {
          text = await file.text();
        } catch {
          // fallback: no text
        }
      }

      // Build ArtifactRef to persist (labelled as CV / Résumé)
      const artifactRef: ArtifactRef = {
        id: meta.id,
        name: meta.name,
        kind: meta.kind,
        label: 'CV / Résumé',
        thumbnailDataUri: meta.thumbnailDataUri,
        extractedText: meta.extractedText,
      };

      if (!text || !text.trim()) {
        // Scanned PDF / no extractable text — keep as proof artifact, advise manual entry
        setProfile((p) => normalizeBeginnerProfile({
          ...p,
          artifacts: [...(p.artifacts ?? []), artifactRef],
        }));
        appendMessages([
          {
            from: 'loom',
            text: `Saved as a proof document. It looks like this PDF doesn't have selectable text — add your details below and the file will stay as supporting proof.${step.id === 'name' ? " What's your full name?" : ''}`,
          },
        ]);
        setUploadStatus('idle');
        return;
      }

      // Run extraction (same as paste path)
      setUploadStatus('extracting');
      // First, wire in the artifact ref regardless of whether extraction succeeds
      setProfile((p) => normalizeBeginnerProfile({
        ...p,
        artifacts: [...(p.artifacts ?? []), artifactRef],
      }));
      await runExtraction(text);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not read the file.';
      setUploadError(msg);
      appendMessages([
        {
          from: 'loom',
          text: `Couldn't save the file — ${msg} Try pasting the text instead.`,
        },
      ]);
    } finally {
      setUploadStatus('idle');
    }
  };

  /**
   * Core extraction: POST text to /api/extract-profile, merge or fall back to
   * summary. Shared by both the paste path and the file-upload path.
   */
  const runExtraction = async (trimmed: string) => {
    setExtracting(true);
    try {
      const res = await fetch('/api/extract-profile', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text: trimmed }),
      });
      if (!res.ok) {
        storePastedAsSummary(trimmed);
        return;
      }
      const data = (await res.json()) as { ok?: unknown; profile?: unknown };
      if (data && typeof data === 'object' && data.ok === true) {
        const extracted = normalizeBeginnerProfile(data.profile);
        applyExtractedProfile(extracted);
      } else {
        storePastedAsSummary(trimmed);
      }
    } catch {
      storePastedAsSummary(trimmed);
    } finally {
      setExtracting(false);
    }
  };

  /**
   * Paste-a-résumé handler. POSTs the raw text to /api/extract-profile and, on a
   * structured result, merges it into the profile. Degrades gracefully end to
   * end: a missing route (404 in the static export), no API key
   * ({configured:false}), a thrown fetch, or malformed output ({ok:false}) all
   * fall back to the honest summary stub — no crash, never strands the user.
   */
  const handlePasteResume = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || extracting) return;

    setImportMode('none');
    appendMessages([{ from: 'user', text: '[Résumé pasted]' }]);
    // Delegate to shared extraction logic
    await runExtraction(trimmed);
  };

  const handleSave = () => {
    setSaving(true);
    setSaveError('');
    const ok = writeBeginnerProfileLocal(normalizeBeginnerProfile(profile));
    if (!ok) {
      // Persistence was blocked (private mode / quota). Stay on the page and
      // tell the user instead of navigating to a profile that reads back null.
      setSaveError(
        "Couldn't save your profile — your browser is blocking local storage (e.g. private browsing). Try a normal window, then save again.",
      );
      setSaving(false);
      return;
    }
    const delay = prefersReducedMotion() ? 0 : 600;
    if (delay === 0) {
      router.push('/digital-me');
    } else {
      setDoneBeat(true);
      setTimeout(() => router.push('/digital-me'), delay);
    }
  };

  /**
   * Persist the in-progress chat profile, THEN navigate to the form. The form
   * route re-reads localStorage on mount, so without this save a first-time user
   * would land on an empty form and silently lose the whole chat session. Mirrors
   * handleSave's write-result check: a blocked write (private mode / quota) shows
   * an error instead of navigating to a blank form.
   */
  const goToForm = () => {
    const ok = writeBeginnerProfileLocal(normalizeBeginnerProfile(profile));
    if (!ok) {
      setSaveError(
        "Couldn't save your progress — your browser is blocking local storage (e.g. private browsing). Try a normal window, then continue.",
      );
      return;
    }
    router.push('/onboarding/profile/form');
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
            Upload your résumé (PDF) — or{' '}
            <button
              type="button"
              className={styles.inlineBtn}
              onClick={() => setImportMode((v) => (v === 'upload' ? 'none' : 'upload'))}
            >
              import a file
            </button>
            {', or '}
            <button
              type="button"
              className={styles.inlineBtn}
              onClick={() => setImportMode((v) => (v === 'paste' ? 'none' : 'paste'))}
            >
              paste text
            </button>
            .
          </p>
        </div>
      </header>

      {/* File upload affordance — primary import path */}
      {importMode === 'upload' && (
        <div className={styles.pasteBox}>
          <UploadArea
            onFile={handleFileUpload}
            onCancel={() => { setImportMode('none'); setUploadError(''); }}
            busy={uploadStatus !== 'idle'}
            status={uploadStatus}
            error={uploadError}
          />
        </div>
      )}

      {/* Paste résumé affordance — secondary */}
      {importMode === 'paste' && (
        <div className={styles.pasteBox}>
          <p className={styles.pasteLabel}>Upload your résumé (PDF) — or paste it.</p>
          <PasteArea
            onSubmit={handlePasteResume}
            onCancel={() => setImportMode('none')}
            busy={extracting}
          />
        </div>
      )}

      {/* In-progress state */}
      {(extracting || uploadStatus === 'extracting') && (
        <p className={styles.extractingNote} role="status" aria-live="polite">
          Extracting your profile…
        </p>
      )}
      {uploadStatus === 'reading' && (
        <p className={styles.extractingNote} role="status" aria-live="polite">
          Reading…
        </p>
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
        {/* Typing indicator — shown while LOOM is "thinking" */}
        {isTyping && (
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
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      {step.id !== 'review' ? (
        <form
          className={styles.inputRow}
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit();
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
            disabled={!input.trim() || isTyping}
            aria-label="Send answer"
          >
            <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </form>
      ) : (
        /* Review + Save */
        <div className={styles.reviewActions}>
          <ProfileSummary profile={profile} />
          {saveError && (
            <p className={styles.errorNote} role="alert">
              {saveError}
            </p>
          )}
          {doneBeat ? (
            <p className={styles.doneBeat} role="status">
              Done — opening your Digital Me…
            </p>
          ) : (
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
              <button
                type="button"
                className={styles.ghostBtn}
                onClick={goToForm}
              >
                Edit in form
              </button>
            </div>
          )}
        </div>
      )}

      {/* Footer links */}
      <footer className={styles.footer}>
        <button type="button" className={styles.footerLink} onClick={goToForm}>
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
