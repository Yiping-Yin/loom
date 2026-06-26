'use client';

import { useEffect, useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import {
  readBeginnerProfileLocal,
  writeBeginnerProfileLocal,
} from '../../lib/profile/profile-storage';
import { emptyBeginnerProfile, type ArtifactRef } from '../../lib/profile/beginner-profile';
import { putArtifact, deleteArtifact } from '../../lib/artifact/artifact-store';
import { VerifiedArtifactCard } from '../../components/VerifiedArtifactCard';
import styles from './BeginnerProofSection.module.css';

/**
 * "Proof & documents" — the upload affordance on the beginner Digital Me.
 *
 * On select, each file's bytes go to IndexedDB via `putArtifact`; the returned
 * small meta is appended to the profile (`writeBeginnerProfileLocal`) as an
 * `ArtifactRef` and rendered as a `VerifiedArtifactCard`. This is what makes
 * "Verified. Cited." real: the visitor can open the underlying document.
 *
 * The blob (IndexedDB) vs meta (localStorage profile) split keeps the profile
 * tiny while the heavy bytes live in a quota-friendly store. The meta also carries
 * a bounded text excerpt (PDFs) so the cited-answer engine grounds in the real
 * document — see lib/new-loom/beginner-ask-corpus.ts (me-artifact-* sources).
 *
 * Client-only: the initial artifacts come from props (SSR-safe; the page reads
 * localStorage on the server pass as null and hydrates), then this component
 * re-reads from localStorage on mount to stay the source of truth after edits.
 */

const MAX_ARTIFACTS = 24;
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB per file.
const ACCEPT =
  '.pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md,application/pdf,image/*';

export function BeginnerProofSection({
  initialArtifacts = [],
  onArtifactsChanged,
}: {
  initialArtifacts?: ArtifactRef[];
  /** Fired after the artifact set changes (upload or remove) so the parent can
      re-derive capabilities against the new proof — the moat payoff ("0 backed by
      proof" → backed) then lands immediately instead of waiting for a manual refresh. */
  onArtifactsChanged?: () => void;
}) {
  const [artifacts, setArtifacts] = useState<ArtifactRef[]>(initialArtifacts);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // After mount, trust localStorage as the source of truth (the SSR pass can't
  // read it). Keeps the list correct across reloads and other-tab edits.
  useEffect(() => {
    const stored = readBeginnerProfileLocal();
    if (stored?.artifacts) setArtifacts(stored.artifacts);
  }, []);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    setMessage(null);

    // Read the freshest profile so we never clobber a concurrent edit, and base
    // the count cap on what's actually stored.
    const current = readBeginnerProfileLocal() ?? { ...emptyBeginnerProfile(), artifacts };
    const existing = current.artifacts ?? [];
    let next = [...existing];
    let added = 0;
    const errors: string[] = [];

    setBusy(true);
    try {
      for (const file of files) {
        if (next.length >= MAX_ARTIFACTS) {
          errors.push(`You can store up to ${MAX_ARTIFACTS} documents.`);
          break;
        }
        if (file.size > MAX_FILE_BYTES) {
          errors.push(`"${file.name}" is over 10MB — please upload a smaller file.`);
          continue;
        }
        try {
          const meta = await putArtifact(file);
          const ref: ArtifactRef = {
            id: meta.id,
            name: meta.name,
            kind: meta.kind,
            thumbnailDataUri: meta.thumbnailDataUri,
            // Carry the document's text excerpt into the profile so the cited
            // answer engine can GROUND in the real document, not typed fields.
            extractedText: meta.extractedText,
          };
          next = [...next, ref];
          added += 1;
        } catch {
          errors.push(`Could not add "${file.name}".`);
        }
      }

      if (added > 0) {
        const saved = writeBeginnerProfileLocal({ ...current, artifacts: next });
        if (saved) {
          setArtifacts(next);
          // New proof landed — let the parent re-derive capabilities now, so the
          // "backed by proof" payoff is immediate (the new artifact's extractedText
          // is already in the saved profile for grounding).
          onArtifactsChanged?.();
        } else {
          // Write failed (quota / private mode) — roll back the blobs we just
          // stored so IndexedDB doesn't drift from the profile.
          await Promise.all(next.slice(existing.length).map((r) => deleteArtifact(r.id)));
          errors.push('Could not save — storage may be full or blocked.');
        }
      }

      setMessage(
        errors.length > 0
          ? errors.join(' ')
          : added > 0
            ? `Added ${added} document${added === 1 ? '' : 's'}.`
            : null,
      );
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function handleRemove(id: string) {
    const current = readBeginnerProfileLocal() ?? { ...emptyBeginnerProfile(), artifacts };
    const next = (current.artifacts ?? []).filter((a) => a.id !== id);
    const saved = writeBeginnerProfileLocal({ ...current, artifacts: next });
    if (saved) {
      setArtifacts(next);
      await deleteArtifact(id);
      setMessage(null);
      // Proof set changed — re-derive so capabilities reflect the removal too.
      onArtifactsChanged?.();
    } else {
      setMessage('Could not remove the document right now.');
    }
  }

  const atCap = artifacts.length >= MAX_ARTIFACTS;

  return (
    <section className={styles.section} aria-labelledby="proof-title">
      <header className={styles.head}>
        <p className={styles.eyebrow}>Proof &amp; documents</p>
        <h2 id="proof-title" className={styles.title}>
          Verified artifacts
        </h2>
        <p className={styles.lede}>
          Add a CV, transcript, or certificate as proof.
        </p>
      </header>

      <div className={styles.uploadRow}>
        <label className={styles.upload} data-disabled={busy || atCap ? '' : undefined}>
          <UploadCloud size={16} strokeWidth={1.8} aria-hidden="true" />
          <span>{busy ? 'Adding…' : atCap ? 'Storage full' : 'Add documents'}</span>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPT}
            className={styles.input}
            disabled={busy || atCap}
            onChange={(e) => void handleFiles(e.target.files)}
          />
        </label>
        <span className={styles.hint}>PDF, images, or documents · up to 10MB each</span>
      </div>

      {message && (
        <p className={styles.message} role="status">
          {message}
        </p>
      )}

      {artifacts.length > 0 ? (
        <ul className={styles.grid}>
          {artifacts.map((artifact) => (
            <li key={artifact.id} className={styles.gridItem}>
              <VerifiedArtifactCard artifact={artifact} onDelete={(id) => void handleRemove(id)} />
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>No documents yet.</p>
      )}
    </section>
  );
}
