'use client';

import { useEffect, useState } from 'react';
import {
  draftRecordDetailHref,
  loadDraftRecords,
  NEW_LOOM_DRAFT_RECORDS_KEY,
  type NewLoomDraftRecord,
} from '../../lib/new-loom/draft-records';
import { LoomGlobalNav } from '../../components/verified-dossier/LoomGlobalNav';

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

function useDraftRecords() {
  const [records, setRecords] = useState<NewLoomDraftRecord[]>([]);

  useEffect(() => {
    setRecords(loadDraftRecords());

    const handleStorage = (event: StorageEvent) => {
      if (event.key === NEW_LOOM_DRAFT_RECORDS_KEY) {
        setRecords(loadDraftRecords());
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return records;
}

export function DraftsClient() {
  const records = useDraftRecords();
  const recordCount = records.length;
  const sourceCount = new Set(records.flatMap((record) => record.sourceHrefs)).size;

  return (
    <main className="vd-home vd-drafts-page" aria-labelledby="draft-library-title">
      <LoomGlobalNav ariaLabel="Studio Library navigation" />

      <section className="vd-draft-library" aria-label="Studio records">
        <header className="vd-draft-library__hero">
          <p>Sources → Studio → Digital Me</p>
          <h1 id="draft-library-title">Studio Library</h1>
          <span>
            {recordCount} {recordCount === 1 ? 'record' : 'records'} / {sourceCount}{' '}
            {sourceCount === 1 ? 'source' : 'sources'}
          </span>
        </header>

        {records.length > 0 ? (
          <div className="vd-draft-record-list">
            {records.map((record) => (
              <article key={record.id} className="vd-draft-record-card">
                <div className="vd-draft-record-card__main">
                  <span>{formatDraftRecordStatus(record.status)}</span>
                  <h2>{record.title}</h2>
                  <p>{record.answer || 'No answer text saved yet.'}</p>
                </div>
                <div className="vd-draft-record-card__meta" aria-label={`${record.title} source trail`}>
                  <strong>{record.sourceLabels.length} sources</strong>
                  <div>
                    {record.sourceLabels.slice(0, 3).map((label, index) => (
                      <a key={`${record.id}:${label}:${index}`} href={record.sourceHrefs[index] ?? '/knowledge'}>
                        {label}
                      </a>
                    ))}
                    {record.sourceLabels.length > 3 ? <span>+{record.sourceLabels.length - 3} more</span> : null}
                  </div>
                </div>
                <footer className="vd-draft-record-card__footer">
                  <time dateTime={record.updatedAt}>{formatDraftRecordDate(record.updatedAt)}</time>
                  <span className="vd-draft-record-card__actions">
                    <a href={draftRecordDetailHref(record)}>
                      View Artifact <ArrowIcon />
                    </a>
                    <a href={record.draftUrl}>
                      Open Studio <ArrowIcon />
                    </a>
                  </span>
                </footer>
              </article>
            ))}
          </div>
        ) : (
          <section className="vd-draft-library__empty" aria-label="No Studio records">
            <h2>No Studio records yet</h2>
            <p>Publish an AI Answer preview from Studio to create the first library record.</p>
            <a href="/studio?edit=new&draftType=ai-answer">
              Open Studio <ArrowIcon />
            </a>
          </section>
        )}
      </section>
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
