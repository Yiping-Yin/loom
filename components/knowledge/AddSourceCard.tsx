'use client';

/**
 * AddSourceCard — a visible, self-serve upload affordance for /knowledge.
 *
 * The web product already ingests dropped files via the global <DropZone>
 * (POST /api/upload), but that is invisible until you happen to drag a file.
 * This card surfaces the same path with a click-to-browse control + a hint that
 * drag also works, so a pure-web user can add their own sources without the
 * desktop app and without the AI chat. Same endpoint, same allowed types.
 */

import { useRef, useState } from 'react';
import styles from './AddSourceCard.module.css';

const ACCEPT = '.pdf,.docx,.doc,.pptx,.ppt,.txt,.md,.mdx,.csv,.tsv,.json,.ipynb,.xlsx,.xls';

export function AddSourceCard() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function upload(files: FileList | null) {
    const list = files ? Array.from(files) : [];
    if (list.length === 0) return;
    setBusy(true);
    setError(null);
    setDone(0);
    let ok = 0;
    let firstHref: string | null = null;
    for (const file of list) {
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const body = (await res.json().catch(() => ({}))) as { error?: string; href?: string };
        if (!res.ok) {
          setError(`${file.name}: ${body.error ?? 'upload failed'}`);
          continue;
        }
        ok += 1;
        setDone(ok);
        if (!firstHref && typeof body.href === 'string') firstHref = body.href;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'upload failed');
      }
    }
    setBusy(false);
    // Land the user ON the file they just added so the upload is visibly
    // confirmed (matches the global DropZone). Fall back to a refresh.
    if (firstHref) window.location.href = firstHref;
    else if (ok > 0) window.location.reload();
  }

  return (
    <section className={styles.card} aria-label="Add a source">
      <div className={styles.copy}>
        <p className={styles.label}>Add files</p>
        <h2 className={styles.heading}>Bring your own sources.</h2>
        <p className={styles.hint}>
          PDF, Word, slides, notes, or data — up to 50&nbsp;MB. Or drag files anywhere on this page.
        </p>
      </div>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.browse}
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          {busy ? `Uploading…${done > 0 ? ` (${done})` : ''}` : 'Choose files'}
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT}
          className={styles.input}
          onChange={(event) => upload(event.target.files)}
        />
      </div>
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
