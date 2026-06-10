'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getAiSurface } from '../lib/ai/stage-model';
import { openLoomReview } from '../lib/ai/surface-actions';
import { contextFromPathname } from '../lib/doc-context';
import { REFRESH_RESUME_KEY, type RefreshResumePayload } from '../lib/refresh-resume';
import { summarizeLearningSurface, type LearningSurfaceSummary } from '../lib/learning-status';
import { useSmallScreen } from '../lib/use-small-screen';
import { useHistory } from '../lib/use-history';
import { useTracesForDoc, type Trace } from '../lib/trace';

export function RefreshCoach() {
  const router = useRouter();
  const pathname = usePathname() ?? '/';
  const ctx = contextFromPathname(pathname);
  const smallScreen = useSmallScreen();
  const rehearsalSurface = getAiSurface('rehearsal');
  const examinerSurface = getAiSurface('examiner');
  const [payload, setPayload] = useState<RefreshResumePayload | null>(null);
  const [completion, setCompletion] = useState<'settled' | 'verified' | null>(null);
  const [history] = useHistory();
  const { traces } = useTracesForDoc(ctx.isFree ? null : ctx.docId);
  const prevRef = useRef<ReturnType<typeof summarizeLearningSurface> | null>(null);

  const readingTraces = useMemo(
    () => traces.filter((trace) => trace.kind === 'reading' && !trace.parentId) as Trace[],
    [traces],
  );
  const viewedAt = useMemo(() => {
    const current = history.find((entry) => entry.id === ctx.docId);
    return current?.viewedAt ?? 0;
  }, [history, ctx.docId]);
  const learning = useMemo(
    () => summarizeLearningSurface(readingTraces, viewedAt),
    [readingTraces, viewedAt],
  );

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(REFRESH_RESUME_KEY);
      if (!raw) {
        setPayload(null);
        setCompletion(null);
        return;
      }
      const parsed = JSON.parse(raw) as RefreshResumePayload;
      if (!parsed?.href || parsed.href !== pathname) {
        setPayload(null);
        setCompletion(null);
        return;
      }
      setPayload(parsed);
    } catch {
      setPayload(null);
    }
  }, [pathname]);

  useEffect(() => {
    if (!payload) {
      prevRef.current = null;
      return;
    }
    const prev = prevRef.current;
    if (!prev) {
      prevRef.current = learning;
      return;
    }

    if (learning.crystallized && !prev.crystallized) {
      setCompletion('settled');
      const id = window.setTimeout(() => dismiss(), 1800);
      prevRef.current = learning;
      return () => window.clearTimeout(id);
    }

    if (learning.examinerCount > prev.examinerCount) {
      setCompletion('verified');
      const id = window.setTimeout(() => dismiss(), 1800);
      prevRef.current = learning;
      return () => window.clearTimeout(id);
    }

    prevRef.current = learning;
  }, [payload, learning]);

  const dismiss = () => {
    try { sessionStorage.removeItem(REFRESH_RESUME_KEY); } catch {}
    setPayload(null);
    setCompletion(null);
    prevRef.current = null;
  };

  if (!payload || ctx.isFree) return null;

  const openReview = () => {
    openLoomReview(learning.latestAnchorId);
  };

  const openDraft = () => router.push('/draft');

  const openReaderNotes = () => router.push('/sources#reader-notes');
  const primaryAction = refreshPrimaryAction(learning.nextAction);
  const bodyText = refreshBodyText(learning, payload?.source);

  return (
    <div
      style={{
        position: 'fixed',
        left: smallScreen ? 12 : 20,
        right: smallScreen ? 12 : 'auto',
        bottom: smallScreen ? 'max(12px, env(safe-area-inset-bottom, 0px) + 8px)' : 18,
        zIndex: 820,
        padding: '0.65rem 0.8rem',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        maxWidth: smallScreen ? 'none' : 360,
        borderTop: '0.5px solid var(--mat-border)',
        borderBottom: '0.5px solid var(--mat-border)',
        background: 'color-mix(in srgb, var(--bg) 96%, var(--bg-elevated))',
        borderRadius: smallScreen ? 14 : 0,
        boxShadow: smallScreen ? 'var(--shadow-1)' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          className="loom-smallcaps"
          style={{
            color: 'var(--accent)',
            fontFamily: 'var(--serif)',
            fontWeight: 500,
            fontSize: '0.84rem',
          }}
        >
          {completion === 'settled'
            ? 'Reader notes updated'
            : completion === 'verified'
              ? 'Review saved'
              : 'Keep this active'}
        </span>
      </div>

      <div className="t-footnote" style={{ color: 'var(--fg-secondary)', lineHeight: 1.5 }}>
        {completion === 'settled'
          ? 'This reader note is no longer stale. Open reader notes and update the source context if it drifts again.'
          : completion === 'verified'
            ? 'Your latest source check succeeded. Keep going only if you want to extend the understanding.'
            : bodyText}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {completion === 'settled' ? (
          <>
            <button type="button" onClick={openReaderNotes} style={actionStyle(true)}>
              Open reader notes
            </button>
          </>
        ) : completion === 'verified' ? (
          <>
            <button type="button" onClick={openReview} style={actionStyle(true)}>
              Review
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => {
                if (primaryAction === 'review') openReview();
                else if (primaryAction === 'rehearsal') openDraft();
                else if (primaryAction === 'examiner') openReaderNotes();
              }}
              style={actionStyle(true)}
            >
              {primaryAction === 'review'
                ? 'Review'
                : primaryAction === 'rehearsal'
                  ? rehearsalSurface.launcherTitle
                  : examinerSurface.launcherTitle}
            </button>
          </>
        )}
        <button type="button" onClick={dismiss} style={actionStyle(false)}>
          Close
        </button>
      </div>
    </div>
  );
}

function refreshPrimaryAction(nextAction: LearningSurfaceSummary['nextAction']) {
  if (nextAction === 'rehearse') return 'rehearsal' as const;
  if (nextAction === 'examine') return 'examiner' as const;
  return 'review' as const;
}

function refreshBodyText(learning: LearningSurfaceSummary, source?: RefreshResumePayload['source']) {
  if (learning.nextAction === 'refresh') {
    return 'Re-enter review and bring the reader note back up to date.';
  }
  if (learning.nextAction === 'rehearse') {
    return 'The reader note needs another written pass before it is stable.';
  }
  if (learning.nextAction === 'examine') {
    return 'The reader note is ready to review while the thinking is still fresh.';
  }
  return 'Review the current shape and decide whether to extend or finalize it.';
}

function actionStyle(primary: boolean) {
  return {
    padding: '0.28rem 0',
    borderRadius: 999,
    border: 0,
    borderBottom: `0.5px solid ${primary ? 'var(--accent)' : 'var(--mat-border)'}`,
    background: 'transparent',
    color: primary ? 'var(--accent)' : 'var(--fg-secondary)',
    fontSize: '0.76rem',
    fontWeight: 700,
    letterSpacing: '0.04em',
    cursor: 'pointer',
  } as const;
}
