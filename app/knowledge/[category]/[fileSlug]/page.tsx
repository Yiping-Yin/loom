import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DocViewer } from '../../../../components/DocViewer';
import { StageShell } from '../../../../components/StageShell';
import { readKnowledgeDocBody } from '../../../../lib/knowledge-doc-cache';
import { findDoc } from '../../../../lib/knowledge-store';
import type { KnowledgeDoc } from '../../../../lib/knowledge-types';
import {
  findReferenceDoc,
  findReferenceManifestDoc,
  readReferenceDocBody,
} from '../../../../lib/new-loom/reference-artifact-bindings';

function sourceUrlFor(doc: KnowledgeDoc, isReference: boolean) {
  if (isReference) return `/api/reference-source?id=${encodeURIComponent(doc.id)}`;
  return `/api/source?p=${encodeURIComponent(doc.sourcePath)}`;
}

async function bodyFor(doc: KnowledgeDoc, isReference: boolean) {
  if (isReference) {
    const body = await readReferenceDocBody(doc.id);
    return body || doc.preview;
  }
  const cached = await readKnowledgeDocBody(doc.id);
  return cached?.body ?? '';
}

export default async function KnowledgeSourcePage({
  params,
}: {
  params: Promise<{ category: string; fileSlug: string }>;
}) {
  const { category, fileSlug } = await params;
  const referenceDoc =
    findReferenceDoc(category, fileSlug) ?? findReferenceManifestDoc(category, fileSlug);
  const manifestDoc = referenceDoc ? null : await findDoc(category, fileSlug);
  const doc = referenceDoc ?? manifestDoc;
  if (!doc) notFound();

  const isReference = Boolean(referenceDoc);
  const body = await bodyFor(doc, isReference);
  const sourceUrl = sourceUrlFor(doc, isReference);

  return (
    <StageShell
      variant="archive"
      contentVariant="archive"
      innerStyle={{
        maxWidth: 'min(1120px, calc(100vw - 48px))',
        paddingTop: '5.5rem',
        paddingBottom: '4rem',
      }}
    >
      <article className="loom-source-prose" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <nav
          className="t-caption2"
          aria-label="Breadcrumb"
          style={{ color: 'var(--muted)', display: 'flex', gap: 8, flexWrap: 'wrap' }}
        >
          <Link href="/" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            Loom
          </Link>
          <span aria-hidden>›</span>
          <Link href="/knowledge" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            Sources
          </Link>
          <span aria-hidden>›</span>
          <Link href={`/knowledge/${doc.categorySlug}`} style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            {doc.category}
          </Link>
          <span aria-hidden>›</span>
          <span>{doc.title}</span>
        </nav>

        <header
          style={{
            paddingBottom: 18,
            borderBottom: '0.5px solid var(--mat-border)',
          }}
        >
          <p className="loom-smallcaps" style={{ color: 'var(--muted)', margin: '0 0 10px' }}>
            {isReference ? 'Bound reference source' : 'Indexed source'}
          </p>
          <h1 style={{ margin: 0, maxWidth: 820 }}>{doc.title}</h1>
          <p style={{ color: 'var(--muted)', maxWidth: 760 }}>
            {doc.subcategory ? `${doc.subcategory} · ` : ''}
            {doc.ext.replace(/^\./, '').toUpperCase()} source object opened from the Loom knowledge shelf.
          </p>
        </header>

        <DocViewer ext={doc.ext} sourceUrl={sourceUrl} body={body} title={doc.title} />
      </article>
    </StageShell>
  );
}
