import { GitBranch } from 'lucide-react';
import type { KeyboardEvent } from 'react';

import styles from './ReflectionWorkspace.module.css';
import type { ReflectionCase } from './reflectionModel';
import { understandingVersionsFromCase } from './reflectionModel';

type ReviewStage = {
  label: string;
  count: number;
  state: 'done' | 'active' | 'empty';
};

function isCaptureVersion(title: string) {
  return title.startsWith('Selected') || title === 'Native translation' || title === 'User meaning';
}

function buildReviewStages(versions: ReturnType<typeof understandingVersionsFromCase>): ReviewStage[] {
  const captureCount = versions.filter((version) => isCaptureVersion(version.title)).length;
  const meaningCount = versions.filter((version) =>
    ['committed', 'needs meaning', 'needs interpretation', 'open question'].includes(version.state),
  ).length;
  const reviewCount = versions.filter((version) => version.state === 'synthesis draft').length;
  const memoryCount = versions.filter((version) => version.state === 'memory candidate').length;

  return [
    { label: 'Capture', count: captureCount, state: captureCount > 0 ? 'done' : 'empty' },
    { label: 'Meaning', count: meaningCount, state: meaningCount > 0 ? 'active' : 'empty' },
    { label: 'Review', count: reviewCount, state: reviewCount > 0 ? 'active' : 'empty' },
    { label: 'Memory', count: memoryCount, state: memoryCount > 0 ? 'done' : 'empty' },
  ];
}

function nextReviewVersion(versions: ReturnType<typeof understandingVersionsFromCase>) {
  return (
    versions.find((version) =>
      ['needs meaning', 'needs interpretation', 'open question'].includes(version.state),
    ) ??
    versions.find((version) => version.state === 'synthesis draft') ??
    versions.find((version) => version.state === 'memory candidate') ??
    versions.at(-1) ??
    null
  );
}

export function UnderstandingSpine({
  reflectionCase,
  activeVersionId,
  onSelectVersion,
}: {
  reflectionCase: ReflectionCase;
  activeVersionId: string | null;
  onSelectVersion: (versionId: string) => void;
}) {
  const versions = understandingVersionsFromCase(reflectionCase);
  const isLearningCase = reflectionCase.project === 'Learning pass';
  const selectedVersionId =
    activeVersionId && versions.some((version) => version.id === activeVersionId)
      ? activeVersionId
      : versions.at(-1)?.id ?? null;
  const versionCountLabel = `${versions.length} version${versions.length === 1 ? '' : 's'}`;
  const reviewStages = buildReviewStages(versions);
  const reviewFocus = nextReviewVersion(versions);

  function handleVersionKeyDown(event: KeyboardEvent<HTMLElement>, versionId: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelectVersion(versionId);
    }
  }

  return (
    <section className={styles.versionHistory} data-learning={isLearningCase} aria-label="Understanding Version Flow">
      <div className={styles.versionHistoryHeader}>
        <div>
          <p className={styles.kicker}>Understanding Review</p>
          <h3>理解复盘</h3>
        </div>
        <span>{versionCountLabel}</span>
      </div>

      {versions.length === 0 ? (
        <article className={styles.versionEmpty}>
          <h4>No understanding versions yet.</h4>
          <p>Start from a real source event, selected material, question, correction, or judgment change.</p>
        </article>
      ) : (
        <>
          <section className={styles.reviewObject} aria-label="Current understanding review">
            <div className={styles.reviewFocus}>
              <p className={styles.kicker}>Current Focus</p>
              <h4>{reviewFocus?.title ?? 'No focus'}</h4>
              <p>{reviewFocus?.material ?? 'Capture one source moment before reviewing.'}</p>
              {reviewFocus ? (
                <button
                  className={styles.reviewFocusAnchor}
                  type="button"
                  onClick={() => onSelectVersion(reviewFocus.id)}
                  aria-label={`Inspect current focus: ${reviewFocus.title}`}
                >
                  <GitBranch size={13} />
                  <span>{reviewFocus.anchor}</span>
                </button>
              ) : null}
            </div>

            <div className={styles.reviewStageList} aria-label="Review stages">
              {reviewStages.map((stage) => (
                <div key={stage.label} className={styles.reviewStage} data-state={stage.state}>
                  <span>{stage.label}</span>
                  <strong>{stage.count}</strong>
                </div>
              ))}
            </div>
          </section>

          <div className={styles.versionList}>
            {versions.map((version) => {
              const isSelected = version.id === selectedVersionId;

              return (
                <article
                  key={version.id}
                  className={styles.versionRow}
                  data-accent={version.accent}
                  data-active={isSelected}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  onClick={() => onSelectVersion(version.id)}
                  onKeyDown={(event) => handleVersionKeyDown(event, version.id)}
                >
                  <span className={styles.versionNumber}>{version.number}</span>
                  <div className={styles.versionBody}>
                    <div className={styles.versionMeta}>
                      <strong>{version.title}</strong>
                      <span>{version.state}</span>
                    </div>
                    <p>{version.material}</p>
                    <button
                      className={styles.versionAnchor}
                      type="button"
                      onPointerDown={() => onSelectVersion(version.id)}
                      onClick={() => onSelectVersion(version.id)}
                      aria-pressed={isSelected}
                      aria-label={`Inspect ${version.number}: ${version.title}`}
                    >
                      <GitBranch size={13} />
                      <span>{version.anchor}</span>
                    </button>
                    {isSelected ? (
                      <details className={styles.versionAudit}>
                        <summary>Audit trail</summary>
                        <ul>
                          {version.audit.map((line) => (
                            <li key={line}>{line}</li>
                          ))}
                        </ul>
                      </details>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
