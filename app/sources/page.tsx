import { getSourceLibraryCategories, getSourceLibraryGroups } from '../../lib/knowledge-store';
import {
  appendReferenceCategoriesToSourceGroups,
  mergeReferenceCategories,
} from '../../lib/new-loom/reference-source-registry';
import { KnowledgeHomeClient } from '../knowledge/KnowledgeHomeClient';

export const metadata = { title: 'Sources · Loom' };

type SourcesPageSearchParams = {
  search?: string | string[];
  q?: string | string[];
};

type SourcesPageProps = {
  searchParams?: Promise<SourcesPageSearchParams>;
};

function cleanSearchParam(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  return typeof raw === 'string' ? raw.trim() : '';
}

export default async function SourcesPage({ searchParams }: SourcesPageProps) {
  const params = (await searchParams) ?? {};
  const initialSearchQuery = cleanSearchParam(params.search) || cleanSearchParam(params.q);
  const [rawCategories, rawGroups] = await Promise.all([
    getSourceLibraryCategories(),
    getSourceLibraryGroups(),
  ]);

  const categories = mergeReferenceCategories(rawCategories);
  const groups = appendReferenceCategoriesToSourceGroups(rawGroups).map((group) => ({
    id: group.id,
    label: group.label,
    items: group.categories.map((category) => ({
      slug: category.slug,
      label: category.label,
      count: category.count,
      groupId: group.id,
    })),
  }));

  const totalDocs = categories.reduce((sum, category) => sum + category.count, 0);

  return (
    <KnowledgeHomeClient
      sourceLibraryGroups={groups}
      totalCollections={categories.length}
      totalDocs={totalDocs}
      initialSearchQuery={initialSearchQuery}
    />
  );
}
