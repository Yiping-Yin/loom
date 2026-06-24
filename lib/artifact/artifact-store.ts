/**
 * lib/artifact/artifact-store · client-side IndexedDB store for uploaded proof.
 *
 * A beginner uploads documents (CV, transcript, certificate, screenshots…) as
 * inspectable PROOF. The bytes live in IndexedDB — the only client store that
 * works offline, in the web build, AND in the shipped static macOS app
 * (`loom://bundle`, no Node server; `scripts/build-static-export.mjs` shelves
 * `app/api`, so a server upload route would 404 in the installed app).
 *
 * Storage split (deliberate):
 *   - BLOB  → IndexedDB, keyed by a generated id. Can be large; never touches
 *             localStorage's ~5MB quota and is read lazily only on "Open".
 *   - META  → the BeginnerProfile in localStorage (an `ArtifactRef`: id, name,
 *             kind, optional label, small thumbnail data URI, and a bounded text
 *             excerpt). This is the *citeable, grounded* record the cited-answer
 *             engine draws on (M2b), and it's tiny enough to live beside the rest
 *             of the profile. The excerpt is what lets an answer ground in the
 *             document's REAL text instead of the user's typed fields.
 *
 * SSR-safety: nothing here touches `indexedDB`, `window`, `crypto`, `Image`, or
 * `pdfjs` at module load. Every entry point guards for a browser first and
 * returns a null/empty fallback during SSR or in sandboxed/private contexts.
 * `pdfjs-dist` is imported dynamically (and only client-side) so it never lands
 * in the server bundle.
 *
 * API:
 *   putArtifact(file)          → ArtifactMeta   (store blob + compute thumbnail)
 *   getArtifactObjectUrl(id)   → string | null  (createObjectURL for opening)
 *   listArtifactMeta()         → ArtifactMeta[]  (newest-first)
 *   deleteArtifact(id)         → void
 */

import { notifyArtifactAdded, notifyArtifactDeleted } from './artifact-events';

let remoteFallback: ((id: string) => Promise<boolean>) | null = null;
/**
 * Install/clear the remote lazy-pull fallback consulted by getArtifactObjectUrl on a
 * local miss (Phase 2). Just a function pointer — no supabase/profile import here, so
 * artifact-store stays dependency-clean and SSR/static-app-safe.
 */
export function setArtifactRemoteFallback(fn: ((id: string) => Promise<boolean>) | null): void {
  remoteFallback = fn;
}

export type ArtifactKind = 'pdf' | 'image' | 'doc' | 'other';

/**
 * The full meta record kept inside IndexedDB alongside the blob. The smaller
 * `ArtifactRef` (in beginner-profile.ts) is the localStorage projection of this.
 */
export type ArtifactMeta = {
  id: string;
  name: string;
  kind: ArtifactKind;
  /** Byte size of the stored blob. */
  size: number;
  /** Tiny PNG/JPEG data URI preview, when one could be produced. */
  thumbnailDataUri?: string;
  /**
   * A bounded plain-text excerpt pulled from the document (PDF first pages only;
   * images/unknown get nothing — no OCR). This is what turns an uploaded artifact
   * into a GROUNDED citation: the cited-answer engine searches and answers from
   * this real text, not the user's typed fields. Capped + control-stripped at the
   * profile seam (normalizeBeginnerProfile) so a tampered profile can't smuggle a
   * giant or forged excerpt.
   */
  extractedText?: string;
  /** Unix ms timestamp of upload. */
  addedAt: number;
};

const DB_NAME = 'loom-artifacts';
const DB_VERSION = 1;
const STORE = 'artifacts';

/** Max edge (px) of the generated thumbnail; downscaled to keep the data URI small. */
const THUMB_MAX_EDGE = 320;

/**
 * How many leading PDF pages to pull text from, and the hard ceiling on the
 * excerpt. Bounded so a huge PDF can't drive an unbounded localStorage profile
 * or token cost — the first few pages are the high-signal part (a CV header,
 * a transcript's grades, a certificate's body). ~4KB is the spec target; the
 * normalize seam re-caps to the same bound defensively.
 */
const EXTRACT_MAX_PAGES = 4;
const EXTRACT_MAX_CHARS = 4000;

// ── id generation (client-only; never at module load) ───────────────────────

/**
 * Generate a stable id at CALL time, in the browser. Prefers
 * `crypto.randomUUID`; falls back to a timestamp + random suffix. Never run at
 * module load, so SSR determinism is preserved (no hydration mismatch risk).
 */
function generateArtifactId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `af_${crypto.randomUUID()}`;
    }
  } catch {
    // fall through to the timestamp fallback
  }
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `af_${ts}_${rand}`;
}

// ── IndexedDB plumbing (all guarded for the browser) ────────────────────────

/** True only in a browser context with a usable IndexedDB. */
function getIndexedDB(): IDBFactory | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.indexedDB ?? null;
  } catch {
    // Access can throw in some privacy / sandboxed contexts.
    return null;
  }
}

/** Open (and lazily create) the artifact object store. Null when IDB is absent. */
function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    const idb = getIndexedDB();
    if (!idb) {
      resolve(null);
      return;
    }
    let request: IDBOpenDBRequest;
    try {
      request = idb.open(DB_NAME, DB_VERSION);
    } catch {
      resolve(null);
      return;
    }
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        // keyPath 'id' so the meta record (which carries the same id) is the value.
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });
}

/** The shape persisted per row: meta fields + the raw blob. */
type ArtifactRecord = ArtifactMeta & { blob: Blob };

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

// ── thumbnailing (client-only; pdfjs imported dynamically) ──────────────────

/** Classify a File into an ArtifactKind from its MIME type / extension. */
function classifyKind(file: File): ArtifactKind {
  const type = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();
  if (type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  if (type.startsWith('image/')) return 'image';
  const docExts = ['.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt', '.md', '.rtf', '.odt'];
  const docTypes = ['msword', 'officedocument', 'opendocument', 'text/plain', 'text/markdown', 'rtf'];
  if (docExts.some((e) => name.endsWith(e)) || docTypes.some((t) => type.includes(t))) return 'doc';
  return 'other';
}

/**
 * Downscale a source <canvas>/<img> onto a capped-edge canvas and return a
 * compressed data URI. Returns null if canvas 2d is unavailable.
 */
function canvasToThumb(
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
  mime: string,
): string | null {
  if (typeof document === 'undefined' || !srcW || !srcH) return null;
  const scale = Math.min(1, THUMB_MAX_EDGE / Math.max(srcW, srcH));
  const w = Math.max(1, Math.round(srcW * scale));
  const h = Math.max(1, Math.round(srcH * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  try {
    ctx.drawImage(source, 0, 0, w, h);
    return canvas.toDataURL(mime, 0.72);
  } catch {
    return null;
  }
}

/** Thumbnail an image File by drawing it downscaled. Null on any failure. */
async function imageThumb(file: File): Promise<string | null> {
  if (typeof window === 'undefined' || typeof Image === 'undefined' || !window.URL) return null;
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement | null>((resolve) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => resolve(null);
      el.src = url;
    });
    if (!img) return null;
    return canvasToThumb(img, img.naturalWidth, img.naturalHeight, 'image/jpeg');
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Thumbnail a PDF File by rendering its first page with pdfjs to a downscaled
 * PNG. pdfjs is imported dynamically and only in the browser, so it never lands
 * in the SSR/server bundle. Disables the worker to avoid a worker-URL config
 * (rendering one small page on the main thread is fine). Null on any failure.
 */
async function pdfThumb(file: File): Promise<string | null> {
  if (typeof window === 'undefined' || typeof document === 'undefined') return null;
  try {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    // Render on the main thread — no separate worker asset to host in the
    // static app. Guard: the option exists on the modern API.
    try {
      (pdfjs as { GlobalWorkerOptions?: { workerSrc: string } }).GlobalWorkerOptions!.workerSrc = '';
    } catch {
      /* older builds: ignore */
    }
    const data = new Uint8Array(await file.arrayBuffer());
    const doc = await pdfjs.getDocument({ data, verbosity: 0, disableWorker: true } as Parameters<typeof pdfjs.getDocument>[0]).promise;
    try {
      const page = await doc.getPage(1);
      const baseViewport = page.getViewport({ scale: 1 });
      const scale = Math.min(2, THUMB_MAX_EDGE / Math.max(baseViewport.width, baseViewport.height));
      const viewport = page.getViewport({ scale: Math.max(scale, 0.2) });
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.ceil(viewport.width));
      canvas.height = Math.max(1, Math.ceil(viewport.height));
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      await page.render({ canvasContext: ctx, viewport, canvas } as Parameters<typeof page.render>[0]).promise;
      try {
        return canvas.toDataURL('image/png');
      } catch {
        return null;
      }
    } finally {
      await doc.destroy();
    }
  } catch {
    return null;
  }
}

/**
 * Collapse whitespace and strip ASCII control chars from raw extracted text, then
 * hard-cap its length. Mirrors the normalize seam so the value the store returns
 * is already clean (the seam re-applies the same bound defensively on read).
 */
function sanitizeExcerpt(raw: string): string {
  const cleaned = raw
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.length > EXTRACT_MAX_CHARS ? cleaned.slice(0, EXTRACT_MAX_CHARS) : cleaned;
}

/**
 * Pull a bounded plain-text excerpt from a PDF's first pages with pdfjs. Reuses
 * the SAME dynamic, browser-only import that renders the thumbnail (worker
 * disabled, main-thread parse), so it never lands in the SSR/server bundle and
 * needs no separate worker asset. Returns undefined on any failure or when the
 * PDF carries no extractable text (e.g. a pure scan — no OCR here).
 */
async function pdfText(file: File): Promise<string | undefined> {
  if (typeof window === 'undefined') return undefined;
  try {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    try {
      (pdfjs as { GlobalWorkerOptions?: { workerSrc: string } }).GlobalWorkerOptions!.workerSrc = '';
    } catch {
      /* older builds: ignore */
    }
    const data = new Uint8Array(await file.arrayBuffer());
    const doc = await pdfjs.getDocument({ data, verbosity: 0, disableWorker: true } as Parameters<typeof pdfjs.getDocument>[0]).promise;
    try {
      const pageCount = Math.min(doc.numPages, EXTRACT_MAX_PAGES);
      const parts: string[] = [];
      let total = 0;
      for (let pageNum = 1; pageNum <= pageCount && total < EXTRACT_MAX_CHARS; pageNum += 1) {
        const page = await doc.getPage(pageNum);
        const content = await page.getTextContent();
        // Each item is a text run; join with spaces to recover word boundaries.
        const pageText = content.items
          .map((item) => (typeof (item as { str?: unknown }).str === 'string' ? (item as { str: string }).str : ''))
          .join(' ');
        parts.push(pageText);
        total += pageText.length;
      }
      const excerpt = sanitizeExcerpt(parts.join('\n'));
      return excerpt.length > 0 ? excerpt : undefined;
    } finally {
      await doc.destroy();
    }
  } catch {
    return undefined;
  }
}

/** Best-effort text excerpt for a File based on its kind. Never throws. PDFs only. */
async function makeExtractedText(file: File, kind: ArtifactKind): Promise<string | undefined> {
  try {
    if (kind === 'pdf') return await pdfText(file);
  } catch {
    // A missing excerpt is fine — the artifact still grounds on its name + label.
  }
  return undefined;
}

/** Best-effort thumbnail for a File based on its kind. Never throws. */
async function makeThumbnail(file: File, kind: ArtifactKind): Promise<string | undefined> {
  try {
    if (kind === 'pdf') return (await pdfThumb(file)) ?? undefined;
    if (kind === 'image') return (await imageThumb(file)) ?? undefined;
  } catch {
    // fall through — a missing thumbnail is fine; the card shows a kind glyph.
  }
  return undefined;
}

// ── public API ──────────────────────────────────────────────────────────────

/**
 * Store a File's bytes in IndexedDB under a fresh id and return its meta.
 *
 * Computes a small thumbnail where possible (PDF first page / downscaled image).
 * Throws only if IndexedDB is unavailable or the write fails — callers surface a
 * friendly message. The returned `ArtifactMeta` carries everything the profile
 * needs to build a citeable `ArtifactRef`.
 */
export async function putArtifact(file: File): Promise<ArtifactMeta> {
  const db = await openDb();
  if (!db) throw new Error('Document storage is unavailable in this browser.');

  const kind = classifyKind(file);
  // Thumbnail (PDF/image) and the searchable text excerpt (PDF only) are both
  // best-effort and independent — run them together. Both reuse the same dynamic
  // browser-only pdfjs import and never throw.
  const [thumbnailDataUri, extractedText] = await Promise.all([
    makeThumbnail(file, kind),
    makeExtractedText(file, kind),
  ]);

  const meta: ArtifactMeta = {
    id: generateArtifactId(),
    name: file.name || 'Untitled',
    kind,
    size: file.size,
    thumbnailDataUri,
    extractedText,
    addedAt: Date.now(),
  };
  const record: ArtifactRecord = { ...meta, blob: file };

  try {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(record);
    await txDone(tx);
  } catch (err) {
    throw new Error('Could not save the document. ' + (err instanceof Error ? err.message : ''));
  } finally {
    db.close();
  }
  notifyArtifactAdded(meta.id);
  return meta;
}

/**
 * Resolve an object URL for opening a stored blob (e.g. `window.open` in a new
 * tab). Returns null when the blob is missing (cleared IndexedDB), during SSR,
 * or when storage is unavailable. The caller owns revoking the URL.
 */
export async function getArtifactObjectUrl(id: string): Promise<string | null> {
  if (typeof window === 'undefined' || !window.URL) return null;
  const db = await openDb();
  if (!db) return null;
  try {
    const record = await new Promise<ArtifactRecord | undefined>((resolve) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () => resolve(req.result as ArtifactRecord | undefined);
      req.onerror = () => resolve(undefined);
    });
    if (!record?.blob) {
      // Lazy-pull (Phase 2): if a remote fallback is installed, let it download +
      // cache the blob, then retry the read once on this open connection.
      if (remoteFallback) {
        let pulled = false;
        try { pulled = await remoteFallback(id); } catch { pulled = false; }
        if (pulled) {
          const again = await new Promise<ArtifactRecord | undefined>((resolve) => {
            const retryReq = db.transaction(STORE, 'readonly').objectStore(STORE).get(id);
            retryReq.onsuccess = () => resolve(retryReq.result as ArtifactRecord | undefined);
            retryReq.onerror = () => resolve(undefined);
          });
          if (again?.blob) {
            try { return URL.createObjectURL(again.blob); } catch { return null; }
          }
        }
      }
      return null;
    }
    try {
      return URL.createObjectURL(record.blob);
    } catch {
      return null;
    }
  } finally {
    db.close();
  }
}

/** True when a blob for this id is present in the local store. */
export async function hasArtifact(id: string): Promise<boolean> {
  const db = await openDb();
  if (!db) return false;
  try {
    return await new Promise<boolean>((resolve) => {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).getKey(id);
      req.onsuccess = () => resolve(req.result !== undefined);
      req.onerror = () => resolve(false);
    });
  } finally {
    db.close();
  }
}

/** Raw stored blob for an id, or null. Used by the sync layer to read bytes to upload. */
export async function getArtifactBlob(id: string): Promise<Blob | null> {
  const db = await openDb();
  if (!db) return null;
  try {
    const record = await new Promise<ArtifactRecord | undefined>((resolve) => {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(id);
      req.onsuccess = () => resolve(req.result as ArtifactRecord | undefined);
      req.onerror = () => resolve(undefined);
    });
    return record?.blob ?? null;
  } finally {
    db.close();
  }
}

/**
 * Cache a record verbatim (NO thumbnail/excerpt recompute) — used to store a blob
 * pulled from Storage, with meta supplied by the caller (from the synced ArtifactRef).
 */
export async function putArtifactRecord(meta: ArtifactMeta, blob: Blob): Promise<void> {
  const db = await openDb();
  if (!db) return;
  try {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put({ ...meta, blob } as ArtifactRecord);
    await txDone(tx);
  } catch {
    /* best-effort cache */
  } finally {
    db.close();
  }
}

/** List all stored artifact meta, newest-first. Returns [] when IDB is absent. */
export async function listArtifactMeta(): Promise<ArtifactMeta[]> {
  const db = await openDb();
  if (!db) return [];
  try {
    const records = await new Promise<ArtifactRecord[]>((resolve) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => resolve((req.result as ArtifactRecord[]) ?? []);
      req.onerror = () => resolve([]);
    });
    return records
      .map(({ blob: _blob, ...meta }) => meta as ArtifactMeta)
      .sort((a, b) => b.addedAt - a.addedAt);
  } finally {
    db.close();
  }
}

/** Delete a stored artifact blob by id. Silent no-op when IDB is absent. */
export async function deleteArtifact(id: string): Promise<void> {
  const db = await openDb();
  if (!db) return;
  try {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    await txDone(tx);
  } catch {
    // Best-effort delete; the meta is removed from the profile regardless.
  } finally {
    db.close();
  }
  notifyArtifactDeleted(id);
}
