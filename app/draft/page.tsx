import { DraftClient } from './DraftClient';

export const metadata = {
  title: 'Draft · Loom',
  description: 'Write source-grounded drafts from verified Loom evidence.',
};

type DraftPageSearchParams = {
  draftType?: string | string[];
};

type DraftPageProps = {
  searchParams?: Promise<DraftPageSearchParams>;
};

export default async function DraftPage({ searchParams }: DraftPageProps) {
  const params = (await searchParams) ?? {};
  const draftType = Array.isArray(params.draftType) ? params.draftType[0] : params.draftType;

  return <DraftClient initialDraftTypeId={draftType} />;
}
