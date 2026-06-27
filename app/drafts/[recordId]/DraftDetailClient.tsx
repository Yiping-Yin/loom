'use client';

import { useEffect, useState } from 'react';
import {
  loadDraftRecordById,
  NEW_LOOM_DRAFT_RECORDS_KEY,
  type NewLoomDraftRecord,
} from '../../../lib/new-loom/draft-records';
import { LoomGlobalNav } from '../../../components/verified-dossier/LoomGlobalNav';

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12h13M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function useDraftRecord(recordId: string) {
  const [record, setRecord] = useState<NewLoomDraftRecord | null>(null);

  useEffect(() => {
    setRecord(loadDraftRecordById(recordId));

    const handleStorage = (event: StorageEvent) => {
      if (event.key === NEW_LOOM_DRAFT_RECORDS_KEY) {
        setRecord(loadDraftRecordById(recordId));
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [recordId]);

  return record;
}

export function DraftDetailClient({ recordId }: { recordId: string }) {
  const record = useDraftRecord(recordId);

  return (
    <main className="vd-home vd-draft-detail-page" aria-labelledby="draft-detail-title">
      <LoomGlobalNav ariaLabel="Studio artifact navigation" />

      {record ? (
        <article className="vd-draft-artifact" aria-label="Published Studio artifact">
          <header className="vd-draft-artifact__header">
            <a href="/drafts">Back to Studio Library</a>
            <p>Published Artifact</p>
            <h1 id="draft-detail-title">{record.title}</h1>
            <div className="vd-draft-artifact__meta">
              <span>{formatDraftRecordStatus(record.status)}</span>
              <time dateTime={record.updatedAt}>{formatDraftRecordDate(record.updatedAt)}</time>
              <span>{record.sourceLabels.length} sources</span>
            </div>
          </header>

          <section className="vd-draft-artifact__answer" aria-label="Artifact answer">
            <h2>Answer</h2>
            <p>{record.answer || 'No answer text saved yet.'}</p>
          </section>

          <aside className="vd-draft-artifact__sources" aria-label="Source trail">
            <h2>Source trail</h2>
            <div>
              {record.sourceLabels.length > 0 ? (
                record.sourceLabels.map((label, index) => (
                  <a key={`${record.id}:${label}:${index}`} href={record.sourceHrefs[index] ?? '/knowledge'}>
                    <span>{label}</span>
                    <small>{record.sourceHrefs[index] ?? '/knowledge'}</small>
                  </a>
                ))
              ) : (
                <p>No source trail saved.</p>
              )}
            </div>
          </aside>

          <footer className="vd-draft-artifact__actions">
            <a href={record.draftUrl}>
              Open Studio <ArrowIcon />
            </a>
          </footer>
        </article>
      ) : (
        <section className="vd-draft-artifact vd-draft-artifact--empty" aria-label="Record not found">
          <header className="vd-draft-artifact__header">
            <a href="/drafts">Back to Studio Library</a>
            <p>Published Artifact</p>
            <h1 id="draft-detail-title">Record not found</h1>
          </header>
          <p>This Studio record is not available in local browser storage.</p>
          <a href="/drafts">
            Back to Studio Library <ArrowIcon />
          </a>
        </section>
      )}
    </main>
  );
}

function formatDraftRecordStatus(status: NewLoomDraftRecord['status']) {
  if (status === 'previewed') return 'Previewed';
  if (status === 'published') return 'Published';
  return 'In progress';
}

function formatDraftRecordDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}
