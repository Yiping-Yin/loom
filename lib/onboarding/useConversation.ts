/**
 * useConversation — the onboarding's runtime (state + handlers), lifted out of
 * ConversationalOnboardingClient so any surface (the chat client today, a cosmic
 * cover later) can drive the EXACT same scripted step machine. The pure step
 * logic lives in ./steps; this hook owns the React state, the timing/typing
 * beats, the résumé import side effects, and navigation.
 *
 * No 'use client' directive here — a hook file is not a component; the consuming
 * client components carry the directive. Behavior is identical to the original
 * inline implementation.
 */
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  emptyBeginnerProfile,
  normalizeBeginnerProfile,
  type BeginnerProfile,
  type ArtifactRef,
} from '../profile/beginner-profile';
import {
  readBeginnerProfileLocal,
  writeBeginnerProfileLocal,
} from '../profile/profile-storage';
import { mergeExtractedProfile } from '../profile/merge-extracted-profile';
import { type ConvoStep, decideChatGate } from './chat-gate';
import { validateAnswerRemote, resolveRemote } from './validate-answer-client';
import {
  applyAnswer,
  stepPrompt,
  progressOf,
  TOTAL_STEPS,
  type ChatMessage,
} from './steps';

/** Max file size for résumé import (mirrors the Proof section: 10 MB). */
const RESUME_MAX_BYTES = 10 * 1024 * 1024;

/** Accepted MIME types for résumé import. */
const RESUME_ACCEPTED_TYPES = new Set([
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/x-markdown',
]);

/**
 * Returns true if the user's OS has prefers-reduced-motion: reduce set.
 * Falls back to false in SSR / environments without matchMedia.
 */
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * The runtime surface a view binds to. Pure step logic (stepPrompt/progressOf/
 * applyAnswer/TOTAL_STEPS) is re-exposed as derived values (promptText/progress/
 * totalSteps) so the view never imports it directly for the live conversation.
 */
export type ConversationApi = {
  profile: BeginnerProfile;
  step: ConvoStep;
  messages: ChatMessage[];
  input: string;
  setInput: (v: string) => void;
  importMode: 'none' | 'upload' | 'paste';
  setImportMode: (v: 'none' | 'upload' | 'paste') => void;
  isTyping: boolean;
  checking: boolean;
  saving: boolean;
  extracting: boolean;
  doneBeat: boolean;
  progress: number;
  totalSteps: number;
  uploadStatus: 'idle' | 'reading' | 'extracting';
  uploadError: string;
  setUploadError: (v: string) => void;
  saveError: string;
  promptText: string;
  inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  bottomRef: React.RefObject<HTMLDivElement | null>;
  handleSubmit: (answerOverride?: string) => Promise<void>;
  handleFileUpload: (file: File) => Promise<void>;
  handlePasteResume: (text: string) => Promise<void>;
  handleSave: () => void;
  goToForm: () => void;
};

export function useConversation(): ConversationApi {
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
  const [checking, setChecking] = useState(false);
  const [doneBeat, setDoneBeat] = useState(false);
  const [reasked, setReasked] = useState<Set<string>>(() => new Set());
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const submitting = useRef(false);

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
    if (!answer || isTyping || checking || submitting.current) return;
    submitting.current = true;
    try {
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
        setChecking(true);
        let remote;
        try {
          remote = await validateAnswerRemote(gate.field, stepPrompt(step), answer);
        } finally {
          setChecking(false);
        }
        const r = resolveRemote(remote, gate.key, answer);
        if (r.nudge) {
          setReasked((s) => new Set(s).add(r.key));
          nudge(answer, r.hint);
          return;
        }
        answer = r.answer;
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
    } finally {
      submitting.current = false;
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
      const { putArtifact } = await import('../artifact/artifact-store');
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

  return {
    profile,
    step,
    messages,
    input,
    setInput,
    importMode,
    setImportMode,
    isTyping,
    checking,
    saving,
    extracting,
    doneBeat,
    progress: progressOf(step),
    totalSteps: TOTAL_STEPS,
    uploadStatus,
    uploadError,
    setUploadError,
    saveError,
    promptText: stepPrompt(step),
    inputRef,
    bottomRef,
    handleSubmit,
    handleFileUpload,
    handlePasteResume,
    handleSave,
    goToForm,
  };
}
