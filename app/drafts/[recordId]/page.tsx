import { DraftDetailClient } from './DraftDetailClient';

export default async function DraftDetailPage({
  params,
}: {
  params: Promise<{ recordId: string }>;
}) {
  const { recordId } = await params;
  return <DraftDetailClient recordId={decodeURIComponent(recordId)} />;
}
