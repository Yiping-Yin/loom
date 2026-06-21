'use client';

import { useState } from 'react';
import { ArrowUpRight, FileText, Image as ImageIcon, File as FileIcon, ShieldCheck } from 'lucide-react';
import type { ArtifactRef } from '../lib/profile/beginner-profile';
import { getArtifactObjectUrl } from '../lib/artifact/artifact-store';
import styles from './VerifiedArtifactCard.module.css';

/**
 * VerifiedArtifactCard · renders one uploaded proof document as a premium
 * "verified artifact" card, mirroring the /example dossier's credential/CV card
 * look (thumbnail + label + Verified mark + an Open action).
 *
 * The blob lives in IndexedDB keyed by `artifact.id`; this card only receives
 * the small `ArtifactRef` meta. "Open" resolves an object URL on demand and
 * opens it in a new tab. If the blob is gone (e.g. the user cleared IndexedDB
 * but the profile meta survived in localStorage), the card degrades to a
 * "file unavailable" state instead of failing silently.
 *
 * Reduced-motion friendly (transitions disabled via the CSS media query) and
 * SSR-safe — `getArtifactObjectUrl` is only ever called from the click handler.
 */
export function VerifiedArtifactCard({
  artifact,
  onDelete,
}: {
  artifact: ArtifactRef;
  onDelete?: (id: string) => void;
}) {
  const [status, setStatus] = useState<'idle' | 'opening' | 'unavailable'>('idle');
  const displayName = artifact.label?.trim() || artifact.name || 'Document';

  async function handleOpen() {
    if (status === 'opening') return;
    setStatus('opening');
    try {
      const url = await getArtifactObjectUrl(artifact.id);
      if (!url) {
        setStatus('unavailable');
        return;
      }
      // Open in a new tab; the object URL is short-lived but valid long enough
      // for the browser to load it. noopener for safety on the spawned context.
      const win = typeof window !== 'undefined' ? window.open(url, '_blank', 'noopener,noreferrer') : null;
      if (!win) {
        // Pop-up blocked — leave the URL navigable via the same tab as a fallback.
        if (typeof window !== 'undefined') window.location.href = url;
      }
      setStatus('idle');
    } catch {
      setStatus('unavailable');
    }
  }

  const unavailable = status === 'unavailable';

  return (
    <article
      className={styles.card}
      data-kind={artifact.kind}
      data-unavailable={unavailable ? '' : undefined}
    >
      <div className={styles.thumb} aria-hidden="true">
        {artifact.thumbnailDataUri ? (
          // eslint-disable-next-line @next/next/no-img-element -- client data URI, not a remote asset
          <img className={styles.thumbImage} src={artifact.thumbnailDataUri} alt="" draggable={false} />
        ) : (
          <span className={styles.glyph}>
            <KindGlyph kind={artifact.kind} />
            <span className={styles.glyphExt}>{kindLabel(artifact.kind)}</span>
          </span>
        )}
      </div>

      <div className={styles.body}>
        <span className={styles.verified}>
          <ShieldCheck size={12} strokeWidth={2} aria-hidden="true" />
          <span>Verified</span>
        </span>
        <strong className={styles.name} title={displayName}>
          {displayName}
        </strong>

        {unavailable ? (
          <span className={styles.unavailable}>File unavailable</span>
        ) : (
          <button type="button" className={styles.open} onClick={handleOpen} disabled={status === 'opening'}>
            <span>{status === 'opening' ? 'Opening…' : 'Open'}</span>
            <ArrowUpRight size={13} strokeWidth={1.8} aria-hidden="true" className={styles.openIcon} />
          </button>
        )}
      </div>

      {onDelete && (
        <button
          type="button"
          className={styles.remove}
          onClick={() => onDelete(artifact.id)}
          aria-label={`Remove ${displayName}`}
        >
          Remove
        </button>
      )}
    </article>
  );
}

function KindGlyph({ kind }: { kind: string }) {
  if (kind === 'image') return <ImageIcon size={26} strokeWidth={1.5} aria-hidden="true" />;
  if (kind === 'pdf' || kind === 'doc') return <FileText size={26} strokeWidth={1.5} aria-hidden="true" />;
  return <FileIcon size={26} strokeWidth={1.5} aria-hidden="true" />;
}

function kindLabel(kind: string): string {
  switch (kind) {
    case 'pdf':
      return 'PDF';
    case 'image':
      return 'IMAGE';
    case 'doc':
      return 'DOC';
    default:
      return 'FILE';
  }
}
