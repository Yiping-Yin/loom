'use client';

import React from 'react';
import { draftWordCount, type NewLoomDraftRecord } from '../../lib/new-loom/draft-storage';
import styles from './BeginnerDocuments.module.css';

export type StudioDocumentSummary = {
  id: string;
  title: string;
  sourceCount: number;
  wordCount: number;
  updatedAt: string;
  includedInDigitalMe?: boolean;
};

export function toStudioDocumentSummary(record: NewLoomDraftRecord): StudioDocumentSummary {
  return {
    id: record.id,
    title: record.title?.trim() || 'Untitled document',
    sourceCount: record.references?.length ?? 0,
    wordCount: draftWordCount(record.body ?? ''),
    updatedAt: record.updatedAt,
    includedInDigitalMe: record.includedInDigitalMe,
  };
}

export function BeginnerDocuments({ documents }: { documents: StudioDocumentSummary[] }) {
  return (
    <section className={styles.section} aria-labelledby="beginner-documents-title">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Studio</p>
          <h2 id="beginner-documents-title" className={styles.title}>Your documents</h2>
        </div>
        <a className={styles.newAction} href="/digital-me?edit=new">New document</a>
      </header>

      {documents.length > 0 ? (
        <ul className={styles.list}>
          {documents.map((doc) => (
            <li key={doc.id}>
              <a className={styles.card} href={`/digital-me?edit=${doc.id}`}>
                <span className={styles.cardTitleRow}>
                  <span className={styles.cardTitle}>{doc.title}</span>
                  {doc.includedInDigitalMe ? (
                    <span className={styles.chip}>In Digital Me</span>
                  ) : null}
                </span>
                <span className={styles.cardMeta}>
                  Grounded by {doc.sourceCount} {doc.sourceCount === 1 ? 'source' : 'sources'}
                  {' · '}
                  {doc.wordCount} {doc.wordCount === 1 ? 'word' : 'words'}
                  {' · '}
                  Updated {doc.updatedAt.slice(0, 10)}
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <a className={styles.empty} href="/digital-me?edit=new">
          <span className={styles.emptyCta}>Start a document →</span>
        </a>
      )}
    </section>
  );
}
