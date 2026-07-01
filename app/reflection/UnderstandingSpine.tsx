import { GitBranch } from 'lucide-react';
import type { KeyboardEvent, ReactNode } from 'react';

import styles from './ReflectionWorkspace.module.css';
import type { ReflectionCase, UnderstandingVersion } from './reflectionModel';
import { auditValue, understandingVersionsFromCase } from './reflectionModel';

type UnderstandingObject = {
  id: string;
  term: string;
  kind: 'word' | 'phrase' | 'sentence' | 'data' | 'concept';
  primary: UnderstandingVersion;
  support: UnderstandingVersion[];
  componentTerms: string[];
};

type ObjectMeaning = {
  phonetic: string | null;
  translation: string | null;
  context: string | null;
  raw: string;
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isCaptureVersion(title: string) {
  return title.startsWith('Selected') || title === 'Native translation' || title === 'User meaning';
}

function stageForVersion(version: UnderstandingVersion) {
  if (version.state === 'memory candidate') return { label: 'Reusable memory', tone: 'memory' };
  if (version.state === 'synthesis draft') return { label: 'Second-pass review', tone: 'review' };
  if (version.state === 'open question') return { label: 'Open question', tone: 'question' };
  if (version.state === 'needs meaning' || version.state === 'needs interpretation') {
    return { label: 'Needs meaning', tone: 'meaning' };
  }
  if (isCaptureVersion(version.title)) return { label: 'Source capture', tone: 'capture' };
  return { label: 'Committed understanding', tone: 'committed' };
}

function precisionForVersion(version: UnderstandingVersion) {
  return (
    auditValue(version.audit, 'anchor precision') ??
    auditValue(version.audit, 'visual precision') ??
    'manual record'
  );
}

function evidenceForVersion(version: UnderstandingVersion) {
  return auditValue(version.audit, 'evidence rung') ?? auditValue(version.audit, 'type') ?? 'user commit';
}

function isWeaklyAnchored(version: UnderstandingVersion) {
  const precision = [
    precisionForVersion(version),
    auditValue(version.audit, 'visual precision'),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  const fallback = auditValue(version.audit, 'fallback note')?.toLowerCase() ?? '';
  return precision.includes('visual context only') || precision.includes('window') || fallback.includes('weak');
}

function signalForVersion(version: UnderstandingVersion) {
  if (isWeaklyAnchored(version)) return { label: 'Confirm source', tone: 'weak' };
  if (version.state === 'needs meaning' || version.state === 'needs interpretation') {
    return { label: 'Needs meaning', tone: 'meaning' };
  }
  if (version.state === 'open question') return { label: 'Question', tone: 'question' };
  if (version.state === 'memory candidate') return { label: 'Reusable', tone: 'memory' };
  return { label: 'Source backed', tone: 'grounded' };
}

function memoryGateForVersion(version: UnderstandingVersion | null) {
  if (!version) return 'No source yet';
  if (isWeaklyAnchored(version)) return 'Confirm source before reuse';
  if (version.state === 'needs meaning' || version.state === 'needs interpretation') {
    return 'Needs meaning';
  }
  if (version.state === 'memory candidate') return 'Candidate, not automatic memory';
  return 'Source backed';
}

function learningSourceLabel(version: UnderstandingVersion) {
  const page = auditValue(version.audit, 'page');
  const cell = auditValue(version.audit, 'cell');
  const anchor = version.anchor.trim();

  if (cell) {
    return anchor.toLowerCase().includes(cell.toLowerCase()) ? anchor : `${anchor} · ${cell}`;
  }

  if (page) {
    const pagePattern = new RegExp(`(?:page\\s*|p\\.?\\s*)${escapeRegExp(page)}\\b`, 'i');
    return pagePattern.test(anchor) ? anchor : `${anchor} · p.${page}`;
  }

  return anchor;
}

function inlineSourceLabel(version: UnderstandingVersion) {
  const source = learningSourceLabel(version);
  if (/^(Review path|Reuse after review)$/i.test(source)) return null;
  return source;
}

function sourceFootnoteLabel(version: UnderstandingVersion) {
  const source = inlineSourceLabel(version);
  if (!source) return null;
  return source
    .replace(/,\s*page\s*(\d+)/i, ', p.$1')
    .replace(/\s+·\s+p\.(\d+)/i, ', p.$1');
}

function traceTipTitle(version: UnderstandingVersion) {
  if (version.title === 'Native translation') return 'Native translation trace';
  if (version.title.startsWith('Selected')) return 'Source selection trace';
  if (version.state === 'memory candidate') return 'Reusable memory candidate';
  if (version.state === 'open question') return 'Open question trace';
  return 'Understanding trace';
}

function TraceTip({
  version,
  supportCount,
  componentTerms,
}: {
  version: UnderstandingVersion;
  supportCount?: number;
  componentTerms?: string[];
}) {
  const source = sourceFootnoteLabel(version);
  const gate = memoryGateForVersion(version);

  return (
    <span className={styles.learningTraceTip} role="tooltip">
      <strong>{traceTipTitle(version)}</strong>
      {source ? <span>{source}</span> : null}
      <span>{gate}</span>
      {supportCount && supportCount > 1 ? <span>{supportCount} linked traces</span> : null}
      {componentTerms && componentTerms.length > 0 ? <span>Absorbs: {componentTerms.join(' + ')}</span> : null}
    </span>
  );
}

function TraceAnchor({
  version,
  supportCount,
  componentTerms,
  children,
  compact = false,
  onSelectVersion,
}: {
  version: UnderstandingVersion;
  supportCount?: number;
  componentTerms?: string[];
  children?: ReactNode;
  compact?: boolean;
  onSelectVersion: (versionId: string) => void;
}) {
  return (
    <button
      className={styles.learningTraceAnchor}
      data-compact={compact}
      type="button"
      onClick={() => onSelectVersion(version.id)}
      aria-label={`Show trace for ${digestTitleForVersion(version)}`}
    >
      {children ?? <GitBranch size={12} aria-hidden="true" />}
      <TraceTip version={version} supportCount={supportCount} componentTerms={componentTerms} />
    </button>
  );
}

function digestTitleForVersion(version: UnderstandingVersion) {
  if (version.state === 'memory candidate') return 'Reusable memory candidate';
  if (version.state === 'synthesis draft') return 'Second-pass synthesis';
  if (version.state === 'open question') return 'Open question';
  if (version.state === 'needs meaning' || version.state === 'needs interpretation') {
    return 'Explain this in your own words';
  }
  if (version.title === 'User meaning') return 'User meaning';
  if (version.title === 'Native translation') return 'Native language help';
  if (version.title === 'Selected phrase' || version.title === 'Selected word') return 'Understanding object';
  if (version.title === 'Selected data') return 'Selected data';
  return 'Source-backed note';
}

function normalizeObjectSubject(value: string) {
  return value
    .toLowerCase()
    .replace(/[“”"']/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function objectTokens(term: string) {
  return normalizeObjectSubject(term)
    .split(/\s+/)
    .filter(Boolean);
}

function objectSubjectForVersion(version: UnderstandingVersion) {
  const beforeMeaning = version.material.split(/\bUser meaning\s*:/i)[0] ?? version.material;
  const beforeArrow = beforeMeaning.split(/\s*(?:->|→)\s*/)[0] ?? beforeMeaning;
  const phoneticMatch = beforeArrow.match(/^(.+?)\s+\/[^/]+\/(?:\s|$)/);
  const candidate = phoneticMatch?.[1] ?? beforeArrow;

  return candidate
    .replace(/^[\s:：,.;-]+|[\s:：,.;-]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function objectKindForVersion(version: UnderstandingVersion, term: string): UnderstandingObject['kind'] {
  if (version.title === 'Selected sentence') return 'sentence';
  if (version.title === 'Selected word') return 'word';
  if (version.title === 'Selected data') return 'data';
  if (version.title === 'User meaning') return 'concept';
  return objectTokens(term).length > 1 ? 'phrase' : 'word';
}

function understandingObjectSummary(object: UnderstandingObject) {
  const material = object.primary.material.trim();
  if (!material) return object.term;

  return material;
}

function understandingObjectMeaning(object: UnderstandingObject): ObjectMeaning {
  const raw = understandingObjectSummary(object);
  let remainder = raw.replace(new RegExp(`^${escapeRegExp(object.term)}\\s*`, 'i'), '').trim();
  const phoneticMatch = remainder.match(/^(\/[^/]+\/)\s*/);
  const phonetic = phoneticMatch?.[1] ?? null;

  if (phoneticMatch) {
    remainder = remainder.slice(phoneticMatch[0].length).trim();
  }

  const arrowMatch = remainder.match(/^(?:->|→)\s*(.+)$/);
  if (!arrowMatch) {
    const context = remainder.replace(/^[.。]+$/, '').trim() || null;
    return { phonetic, translation: null, context, raw };
  }

  const meaningText = arrowMatch[1].trim();
  const contextMatch = meaningText.match(/^(.+?)(?:\.\s+In this PDF:\s*|\s+In this PDF:\s*)(.+)$/i);
  const translation = (contextMatch?.[1] ?? meaningText).replace(/[.。]\s*$/, '').trim();
  const context = contextMatch?.[2]?.trim() ?? null;

  return { phonetic, translation, context, raw };
}

function uniqueVersions(versions: UnderstandingVersion[]) {
  const seen = new Set<string>();

  return versions.filter((version) => {
    if (seen.has(version.id)) return false;
    seen.add(version.id);
    return true;
  });
}

function uniqueObjectSubjects(terms: string[]) {
  const seen = new Set<string>();

  return terms.filter((term) => {
    const key = normalizeObjectSubject(term);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function understandingObjectTraceCount(object: UnderstandingObject) {
  return uniqueVersions([object.primary, ...object.support]).length;
}

function buildUnderstandingObjects(versions: UnderstandingVersion[]) {
  const objectsByTerm = new Map<string, UnderstandingObject & { index: number }>();

  versions.forEach((version, index) => {
    const term = objectSubjectForVersion(version);
    const key = normalizeObjectSubject(term);
    if (!key) return;

    const existing = objectsByTerm.get(key);
    if (existing) {
      objectsByTerm.set(key, {
        ...existing,
        primary: version,
        support: [...existing.support, existing.primary],
      });
      return;
    }

    objectsByTerm.set(key, {
      id: `understanding-object-${version.id}`,
      term,
      kind: objectKindForVersion(version, term),
      primary: version,
      support: [],
      componentTerms: [],
      index,
    });
  });

  const objects = Array.from(objectsByTerm.entries()).map(([key, object]) => ({ key, object }));
  const absorbedTerms = new Set<string>();
  const supportByPhrase = new Map<string, UnderstandingVersion[]>();
  const componentTermsByPhrase = new Map<string, string[]>();

  objects.forEach(({ key: phraseKey, object: phrase }) => {
    if (phrase.kind !== 'phrase') return;
    const phraseTokens = objectTokens(phrase.term);
    if (phraseTokens.length <= 1) return;

    objects.forEach(({ key: wordKey, object: word }) => {
      if (wordKey === phraseKey || objectTokens(word.term).length !== 1) return;
      if (!phraseTokens.includes(wordKey)) return;

      absorbedTerms.add(wordKey);
      supportByPhrase.set(phraseKey, [...(supportByPhrase.get(phraseKey) ?? []), word.primary, ...word.support]);
      componentTermsByPhrase.set(phraseKey, [...(componentTermsByPhrase.get(phraseKey) ?? []), word.term]);
    });
  });

  return objects
    .filter(({ key, object }) => object.kind !== 'word' || !absorbedTerms.has(key))
    .map(({ key, object }) => ({
      ...object,
      support: uniqueVersions([...object.support, ...(supportByPhrase.get(key) ?? [])]),
      componentTerms: uniqueObjectSubjects(componentTermsByPhrase.get(key) ?? []),
    }))
    .sort((left, right) => {
      const leftIndex = objectsByTerm.get(normalizeObjectSubject(left.term))?.index ?? 0;
      const rightIndex = objectsByTerm.get(normalizeObjectSubject(right.term))?.index ?? 0;
      return leftIndex - rightIndex;
    });
}

function sectionForVersion(version: UnderstandingVersion) {
  const focus = auditValue(version.audit, 'focus')?.toLowerCase() ?? '';
  if (
    version.title === 'Selected phrase' ||
    version.title === 'Selected word' ||
    version.title === 'Selected sentence' ||
    version.title === 'Selected passage' ||
    version.title === 'Selected data' ||
    version.title === 'Native translation' ||
    focus.includes('data')
  ) {
    return 'objects';
  }
  if (version.title === 'Question' || version.state === 'open question') return 'questions';
  if (version.title === 'Correction') return 'corrections';
  if (version.title === 'Principle' || version.state === 'memory candidate') return 'principles';
  if (version.title === 'User meaning') return 'understanding';
  if (version.state === 'synthesis draft') return 'review';
  return 'context';
}

function documentTitleForFocus(version: UnderstandingVersion) {
  if (version.title === 'User meaning') return 'What this source means now';
  if (version.state === 'synthesis draft') return 'Second-pass synthesis';
  if (version.state === 'memory candidate') return 'Reusable thinking candidate';
  if (version.title === 'Selected data') return 'Data interpretation';
  return digestTitleForVersion(version);
}

function formatReportSubject(value: string) {
  const subject = value.replace(/\s+/g, ' ').trim();
  if (!subject) return subject;
  return subject.charAt(0).toUpperCase() + subject.slice(1);
}

function documentReportTitle(versions: UnderstandingVersion[], focus: UnderstandingVersion) {
  const phrase = buildUnderstandingObjects(versions).find((object) => object.kind === 'phrase');
  if (phrase) return formatReportSubject(phrase.term);

  const candidate = [...versions]
    .reverse()
    .map((version) => objectSubjectForVersion(version))
    .find((subject) => subject.length > 0 && subject.length <= 72);

  if (candidate) return formatReportSubject(candidate);

  const focusTitle = documentTitleForFocus(focus);
  if (focusTitle !== 'What this source means now') return focusTitle;

  return learningSourceLabel(focus).replace(/,\s*page\s+\d+.*$/i, '');
}

function bestLearningFocus(versions: UnderstandingVersion[]) {
  return (
    [...versions].reverse().find((version) => version.title === 'User meaning') ??
    [...versions].reverse().find((version) => version.state === 'synthesis draft') ??
    [...versions].reverse().find((version) => version.title.startsWith('Selected')) ??
    versions.at(-1) ??
    null
  );
}

function documentProseVersions(versions: UnderstandingVersion[], focus: UnderstandingVersion | null) {
  return uniqueVersions(
    versions.filter((version) => {
      if (version.id === focus?.id) return false;
      return (
        version.title === 'User meaning' ||
        version.state === 'synthesis draft' ||
        version.state === 'memory candidate' ||
        version.title === 'Principle'
      );
    }),
  );
}

function documentSourceQuoteVersion(versions: UnderstandingVersion[], focus: UnderstandingVersion | null) {
  return (
    versions.find((version) => {
      if (version.id === focus?.id) return false;
      return version.title === 'Selected sentence' || version.title === 'Selected passage';
    }) ??
    versions.find((version) => {
      if (version.id === focus?.id) return false;
      return version.title === 'Selected data';
    }) ??
    null
  );
}

function displayLearningMaterial(version: UnderstandingVersion) {
  return version.material
    .replace(/^(concept synthesis|reusable principle)[:：]\s*/i, '')
    .trim();
}

function documentObjectVersions(versions: UnderstandingVersion[]) {
  return versions.filter(
    (version) =>
      version.title === 'Selected word' ||
      version.title === 'Selected phrase' ||
      version.title === 'Selected data' ||
      version.title === 'Native translation',
  );
}

function primaryLearningObject(objects: UnderstandingObject[]) {
  return (
    objects.find((object) => object.kind === 'phrase') ??
    objects.find((object) => object.kind === 'concept') ??
    objects.find((object) => object.kind === 'data') ??
    objects[0] ??
    null
  );
}

function LearningDigest({
  versions,
  selectedVersionId,
  onSelectVersion,
}: {
  versions: UnderstandingVersion[];
  selectedVersionId: string | null;
  onSelectVersion: (versionId: string) => void;
}) {
  const focus = bestLearningFocus(versions);
  const focusSource = focus ? sourceFootnoteLabel(focus) : null;
  const proseVersions = documentProseVersions(versions, focus);
  const sourceQuoteVersion = documentSourceQuoteVersion(versions, focus);
  const understandingObjects = buildUnderstandingObjects(documentObjectVersions(versions));
  const primaryObject = primaryLearningObject(understandingObjects);
  const primaryMeaning = primaryObject ? understandingObjectMeaning(primaryObject) : null;

  return (
    <section className={styles.learningDigest} aria-label="Learning document">
      {focus ? (
        <article className={styles.learningDocument} aria-label="Learning document">
          <header className={styles.learningDocumentHeader}>
            <div className={styles.learningDocumentTitleBlock}>
              <h3>{documentReportTitle(versions, focus)}</h3>
              {focusSource ? (
                <p className={styles.learningDocumentMeta}>
                  {focusSource}
                  <TraceAnchor version={focus} compact onSelectVersion={onSelectVersion} />
                </p>
              ) : null}
            </div>
          </header>

          <section className={styles.learningDocumentProse} aria-label="Learning note">
            <p className={styles.learningDocumentLead} data-active={focus.id === selectedVersionId}>
              {displayLearningMaterial(focus)}
              <TraceAnchor version={focus} compact onSelectVersion={onSelectVersion} />
            </p>
            {proseVersions.map((version) => (
              <p key={version.id} data-active={version.id === selectedVersionId}>
                {displayLearningMaterial(version)}
                <TraceAnchor version={version} compact onSelectVersion={onSelectVersion} />
              </p>
            ))}
          </section>

          {sourceQuoteVersion ? (
            <blockquote
              className={styles.learningDocumentQuote}
              data-active={sourceQuoteVersion.id === selectedVersionId}
            >
              <p>
                {displayLearningMaterial(sourceQuoteVersion)}
                <TraceAnchor version={sourceQuoteVersion} compact onSelectVersion={onSelectVersion} />
              </p>
            </blockquote>
          ) : null}

          {primaryObject && primaryMeaning ? (
            <p
              className={styles.learningInlineGlossary}
              data-active={primaryObject.primary.id === selectedVersionId}
              data-kind={primaryObject.kind}
            >
              <TraceAnchor
                version={primaryObject.primary}
                supportCount={understandingObjectTraceCount(primaryObject)}
                componentTerms={primaryObject.componentTerms}
                onSelectVersion={onSelectVersion}
              >
                <span className={styles.learningInlineTerm}>{primaryObject.term}</span>
              </TraceAnchor>
              {primaryMeaning.phonetic ? <em>{primaryMeaning.phonetic}</em> : null}
              {primaryMeaning.translation ? <strong>{primaryMeaning.translation}</strong> : null}
              {primaryMeaning.context ? <span>{primaryMeaning.context}</span> : null}
            </p>
          ) : null}
        </article>
      ) : null}
    </section>
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
  const historyHeaderLabel = versionCountLabel;

  function handleVersionKeyDown(event: KeyboardEvent<HTMLElement>, versionId: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelectVersion(versionId);
    }
  }

  return (
    <section className={styles.versionHistory} data-learning={isLearningCase} aria-label="Learning review">
      {!isLearningCase ? (
        <div className={styles.versionHistoryHeader} aria-label="Learning record count">
          <span>{historyHeaderLabel}</span>
        </div>
      ) : null}

      {versions.length === 0 ? (
        <article className={styles.versionEmpty}>
          <h4>No understanding versions yet.</h4>
          <p>Start from a real source event, selected material, question, correction, or judgment change.</p>
        </article>
      ) : (
        <>
          {isLearningCase ? (
            <LearningDigest versions={versions} selectedVersionId={selectedVersionId} onSelectVersion={onSelectVersion} />
          ) : null}

          <details className={styles.traceHistory} open={!isLearningCase}>
            <summary>
              {isLearningCase ? 'Capture trail' : 'Trace history'}
              <span>{versionCountLabel}</span>
            </summary>
            <div className={styles.versionList}>
            {versions.map((version) => {
              const isSelected = version.id === selectedVersionId;
              const stage = stageForVersion(version);
              const precision = precisionForVersion(version);
              const evidence = evidenceForVersion(version);
              const hasWeakAnchor = isWeaklyAnchored(version);
              const signal = signalForVersion(version);

              return (
                <article
                  key={version.id}
                  className={styles.versionRow}
                  data-accent={version.accent}
                  data-active={isSelected}
                  data-weak-anchor={hasWeakAnchor}
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
                    </div>
                    <div
                      className={styles.versionSignalLine}
                      aria-label={`Trace grounding: ${stage.label}; ${precision}; ${evidence}`}
                      title={`${stage.label} · ${precision} · ${evidence}`}
                    >
                      <span className={styles.versionSignalDot} data-tone={signal.tone} aria-hidden="true" />
                      <span>{signal.label}</span>
                    </div>
                    <p>{displayLearningMaterial(version)}</p>
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
          </details>
        </>
      )}
    </section>
  );
}
