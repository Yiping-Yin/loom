'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  VERIFIED_DOSSIER_ARTIFACTS,
  VERIFIED_DOSSIER_SECTIONS,
  resolveVerifiedDossierArtifact,
  type VerifiedDossierArtifactId,
} from '../../lib/new-loom/verified-dossier-home';
import { DocumentPreviewCard } from '../../components/verified-dossier/DocumentPreviewCard';
import { FileBadge } from '../../components/verified-dossier/FileBadge';
import { InstitutionMark } from '../../components/verified-dossier/InstitutionMark';
import { LoomGlobalNav } from '../../components/verified-dossier/LoomGlobalNav';
import styles from './KnowledgeHomeStatic.module.css';

type SourceLibraryItem = {
  slug: string;
  label: string;
  count: number;
  groupId?: string;
};

type SourceLibraryGroup = {
  id?: string;
  label: string;
  items: SourceLibraryItem[];
};

type ResolvedSourceLibraryGroup = {
  id: string;
  label: string;
  items: Array<SourceLibraryItem & { groupId: string }>;
};

const FEATURED_SOURCE_ARTIFACTS: VerifiedDossierArtifactId[] = [
  'econ-ps2',
  'econ-slides',
  'about-doc',
  'wqu-index',
];

const SOURCE_FLOW = [
  {
    title: 'Add files',
    text: 'Bring course material, project records, certificates, notes, and AI conversations into Sources.',
  },
  {
    title: 'Shelve evidence',
    text: 'Group source categories without changing the original files or losing provenance.',
  },
  {
    title: 'Draft with proof',
    text: 'Turn the source trail into work, explanations, portfolio pages, and grounded AI answers.',
  },
];

export function KnowledgeHomeStatic({
  sourceLibraryGroups,
  groups,
  totalCollections,
  totalDocs,
  isAddingGroup = false,
  newGroupLabel = '',
  onStartAddGroup = () => {},
  onCancelAddGroup = () => {},
  onChangeNewGroupLabel = () => {},
  onSubmitNewGroup = () => {},
  editingGroupId = null,
  editingGroupLabel = '',
  onStartRenameGroup = () => {},
  onCancelRenameGroup = () => {},
  onChangeEditingGroupLabel = () => {},
  onSubmitRenameGroup = () => {},
  confirmingDeleteGroupId = null,
  onRequestDeleteGroup = () => {},
  onCancelDeleteGroup = () => {},
  onConfirmDeleteGroup = () => {},
  confirmingHideCategorySlug = null,
  onRequestHideCategory = () => {},
  onCancelHideCategory = () => {},
  onConfirmHideCategory = () => {},
  onMoveCategory = () => {},
  busyKey = null,
  isPending = false,
  errorMessage = null,
  initialSearchQuery = '',
}: {
  sourceLibraryGroups?: SourceLibraryGroup[];
  groups?: SourceLibraryGroup[];
  totalCollections: number;
  totalDocs: number;
  isAddingGroup?: boolean;
  newGroupLabel?: string;
  onStartAddGroup?: () => void;
  onCancelAddGroup?: () => void;
  onChangeNewGroupLabel?: (value: string) => void;
  onSubmitNewGroup?: () => void;
  editingGroupId?: string | null;
  editingGroupLabel?: string;
  onStartRenameGroup?: (groupId: string, currentLabel: string) => void;
  onCancelRenameGroup?: () => void;
  onChangeEditingGroupLabel?: (value: string) => void;
  onSubmitRenameGroup?: (groupId: string, currentLabel: string) => void;
  confirmingDeleteGroupId?: string | null;
  onRequestDeleteGroup?: (groupId: string) => void;
  onCancelDeleteGroup?: () => void;
  onConfirmDeleteGroup?: (groupId: string) => void;
  confirmingHideCategorySlug?: string | null;
  onRequestHideCategory?: (categorySlug: string) => void;
  onCancelHideCategory?: () => void;
  onConfirmHideCategory?: (categorySlug: string) => void;
  onMoveCategory?: (categorySlug: string, groupId: string) => void;
  busyKey?: string | null;
  isPending?: boolean;
  errorMessage?: string | null;
  initialSearchQuery?: string;
}) {
  const [sourceSearchQuery, setSourceSearchQuery] = useState(initialSearchQuery);
  useEffect(() => {
    setSourceSearchQuery(initialSearchQuery);
  }, [initialSearchQuery]);

  const resolvedGroups: ResolvedSourceLibraryGroup[] = (sourceLibraryGroups ?? groups ?? []).map(
    (group) => {
      const id =
        group.id ??
        (group.label
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '') ||
          'ungrouped');

      return {
        ...group,
        id,
        items: group.items.map((item) => ({
          ...item,
          groupId: item.groupId ?? id,
        })),
      };
    },
  );
  const activeGroups = resolvedGroups.filter((group) => group.items.length > 0).length;
  const topGroup = resolvedGroups
    .flatMap((group) => group.items.map((item) => ({ group, item })))
    .sort((a, b) => b.item.count - a.item.count)[0];
  const normalizedSearchQuery = normalizeSourceSearch(sourceSearchQuery);
  const visibleGroups = useMemo(() => {
    if (!normalizedSearchQuery) return resolvedGroups;

    return resolvedGroups
      .map((group) => {
        const groupMatches = normalizeSourceSearch(group.label).includes(normalizedSearchQuery);
        const items = groupMatches
          ? group.items
          : group.items.filter((item) =>
              normalizeSourceSearch(`${item.label} ${item.slug} ${sourceCategorySignal(item)}`).includes(
                normalizedSearchQuery,
              ),
            );

        return { ...group, items };
      })
      .filter((group) => group.items.length > 0);
  }, [normalizedSearchQuery, resolvedGroups]);
  const visibleItemCount = visibleGroups.reduce((sum, group) => sum + group.items.length, 0);

  return (
    <main className={`vd-home ${styles.page}`} aria-labelledby="sources-title">
      <div className="loom-cosmic-field" aria-hidden="true" />
      <LoomGlobalNav ariaLabel="Verified dossier navigation" />

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.sectionLabel}>Sources</p>
          <h1 id="sources-title">Sources are the proof layer.</h1>
          <p>
            Sources hold the files, categories, and provenance behind the profile. Re-shelving
            changes Loom provenance only; original source files stay unchanged.
          </p>
          {normalizedSearchQuery ? (
            <div className={styles.searchCallout} role="status" aria-label="Active source search">
              <span>Active search</span>
              <strong>{sourceSearchQuery.trim()}</strong>
              <p>
                {formatCount(visibleItemCount, 'matching source')} across{' '}
                {formatCount(visibleGroups.length, 'shelf')}
              </p>
              <div>
                <a href="#source-library-title">Review matching shelves</a>
                <button type="button" onClick={() => setSourceSearchQuery('')}>
                  Clear search
                </button>
              </div>
            </div>
          ) : null}
        </div>
        <aside className={styles.metrics} aria-label="Sources summary">
          <div>
            <span>{formatCount(totalCollections, 'shelf')}</span>
            <strong>Active evidence categories</strong>
          </div>
          <div>
            <span>{formatCount(totalDocs, 'indexed source')}</span>
            <strong>Files available for Draft and AI answers</strong>
          </div>
          <div>
            <span>{formatCount(activeGroups, 'group')}</span>
            <strong>Groups with material</strong>
          </div>
          <div>
            <span>{topGroup ? topGroup.item.label : 'No source group yet'}</span>
            <strong>Largest current shelf</strong>
          </div>
        </aside>
      </section>

      <section className={styles.featuredSection} aria-labelledby="sources-proof-title">
        <div className={styles.sectionHeader}>
          <p className={styles.sectionLabel}>Source to output</p>
          <h2 id="sources-proof-title">The library connects evidence to usable work.</h2>
          <p>
            Every source can become a profile claim, a knowledge-base page, a portfolio artifact,
            or a grounded answer. The visible structure should make that path obvious.
          </p>
        </div>
        <div className={styles.proofBoard}>
          <div className={`vd-document-grid ${styles.documentGrid}`} aria-label="Featured source artifacts">
            {FEATURED_SOURCE_ARTIFACTS.map((artifactId) => (
              <DocumentPreviewCard key={artifactId} artifact={resolveVerifiedDossierArtifact(artifactId)} />
            ))}
          </div>
          <div className={styles.flowRows} aria-label="Source workflow">
            {SOURCE_FLOW.map((item, index) => (
              <article key={item.title}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.referenceSection} aria-labelledby="sources-reference-title">
        <div className={styles.sectionHeader}>
          <p className={styles.sectionLabel}>Reference shelves</p>
          <h2 id="sources-reference-title">The first five shelves define the product shape.</h2>
        </div>
        <div className={styles.referenceRows}>
          {VERIFIED_DOSSIER_SECTIONS.map((section) => (
            <a key={section.id} className={styles.referenceRow} href={section.href}>
              <InstitutionMark kind={section.id} />
              <span>
                <strong>{section.label}</strong>
                <small>{section.status}</small>
              </span>
              <span>{section.summary}</span>
              <span className={styles.fileStack}>
                {section.artifactIds.slice(0, 2).map((artifactId) => {
                  const artifact = resolveVerifiedDossierArtifact(artifactId);
                  return (
                    <FileBadge
                      key={artifact.id}
                      kind={artifact.kind}
                      label={artifact.label}
                      compact
                    />
                  );
                })}
              </span>
            </a>
          ))}
        </div>
      </section>

      <section className={styles.librarySection} aria-labelledby="source-library-title">
        <div className={styles.sectionHeader}>
          <p className={styles.sectionLabel}>Source library</p>
          <h2 id="source-library-title">Manage the shelves that feed Draft.</h2>
          <p>
            Move source categories between groups, hide categories from the index, and keep the
            original files read-only. Archive shelves remain a provenance concept, not a visual
            metaphor.
          </p>
        </div>
        <div className={`${styles.library} loom-source-cabinet`} aria-label="Sources library">
          {errorMessage ? (
            <div className={styles.error} role="status">
              {errorMessage}
            </div>
          ) : null}

          <div className={styles.libraryToolbar}>
            <span>
              {normalizedSearchQuery
                ? `${formatCount(visibleItemCount, 'matching source')} for ${sourceSearchQuery.trim()}`
                : `${formatCount(totalCollections, 'shelf')} / ${formatCount(totalDocs, 'indexed source')}`}
            </span>
            <form
              className={styles.librarySearch}
              role="search"
              onSubmit={(event) => event.preventDefault()}
            >
              <input
                value={sourceSearchQuery}
                onChange={(event) => setSourceSearchQuery(event.target.value)}
                placeholder="Search shelves and sources"
                aria-label="Search shelves and sources"
              />
              {sourceSearchQuery ? (
                <button type="button" onClick={() => setSourceSearchQuery('')}>
                  Clear
                </button>
              ) : null}
            </form>
            {isAddingGroup ? (
              <form
                className={styles.groupForm}
                onSubmit={(event) => {
                  event.preventDefault();
                  onSubmitNewGroup();
                }}
              >
                <input
                  value={newGroupLabel}
                  onChange={(event) => onChangeNewGroupLabel(event.target.value)}
                  placeholder="New shelf name"
                  aria-label="New shelf name"
                  autoFocus
                />
                <button type="submit" aria-busy={busyKey === 'group:add' || isPending}>
                  Create shelf
                </button>
                <button type="button" onClick={onCancelAddGroup}>
                  Cancel
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={onStartAddGroup}
                aria-busy={busyKey === 'group:add' || isPending}
                title="New group"
              >
                New shelf
              </button>
            )}
          </div>

          <div className={styles.groupRows}>
            {visibleGroups.length === 0 && normalizedSearchQuery ? (
              <div className={styles.emptySearch} role="status">
                No shelves match this search.
              </div>
            ) : null}
            {visibleGroups.map((group, index) => {
              const empty = group.items.length === 0;
              const isEditing = editingGroupId === group.id;
              const isDeleting = confirmingDeleteGroupId === group.id;

              return (
                <section
                  key={group.id}
                  className={`${styles.groupRow} loom-atlas-group loom-archive-shelf`}
                  data-group-drop-target={group.id}
                  onDragOver={(event) => {
                    if (!event.dataTransfer.types.includes('application/x-loom-category-slug'))
                      return;
                    event.preventDefault();
                    event.dataTransfer.dropEffect = 'move';
                    event.currentTarget.setAttribute('data-drop-active', 'true');
                  }}
                  onDragLeave={(event) => {
                    const related = event.relatedTarget as Node | null;
                    if (related && event.currentTarget.contains(related)) return;
                    event.currentTarget.removeAttribute('data-drop-active');
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    event.currentTarget.removeAttribute('data-drop-active');
                    const slug = event.dataTransfer.getData('application/x-loom-category-slug');
                    if (slug) onMoveCategory(slug, group.id);
                  }}
                >
                  <header className={styles.groupHeader}>
                    <div>
                      <p>{`Shelf ${formatOrdinal(index + 1)}`}</p>
                      {isEditing ? (
                        <form
                          className={styles.groupForm}
                          onSubmit={(event) => {
                            event.preventDefault();
                            onSubmitRenameGroup(group.id, group.label);
                          }}
                        >
                          <input
                            value={editingGroupLabel}
                            onChange={(event) => onChangeEditingGroupLabel(event.target.value)}
                            aria-label={`Relabel ${group.label}`}
                            autoFocus
                          />
                          <button
                            type="submit"
                            aria-busy={busyKey === `group:rename:${group.id}` || isPending}
                          >
                            Save
                          </button>
                          <button type="button" onClick={onCancelRenameGroup}>
                            Cancel
                          </button>
                        </form>
                      ) : (
                        <>
                          <h3>{group.label}</h3>
                          <span>{sourceStateTags(group).join(' / ')}</span>
                        </>
                      )}
                    </div>
                    <div className={styles.groupActions}>
                      <strong>{formatCount(group.items.length, 'collection')}</strong>
                      {group.id !== 'ungrouped' && !isEditing ? (
                        isDeleting ? (
                          <>
                            <span>Remove shelf? Items return to Ungrouped.</span>
                            <button
                              type="button"
                              onClick={() => onConfirmDeleteGroup(group.id)}
                              aria-busy={busyKey === `group:delete:${group.id}` || isPending}
                            >
                              Remove now
                            </button>
                            <button type="button" onClick={onCancelDeleteGroup}>
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => onStartRenameGroup(group.id, group.label)}
                              aria-busy={busyKey === `group:rename:${group.id}` || isPending}
                            >
                              Relabel
                            </button>
                            <button
                              type="button"
                              onClick={() => onRequestDeleteGroup(group.id)}
                              aria-busy={busyKey === `group:delete:${group.id}` || isPending}
                            >
                              Remove
                            </button>
                          </>
                        )
                      ) : null}
                    </div>
                  </header>

                  {empty ? (
                    <div className={styles.emptyGroup} data-atlas-empty-group>
                      <span>No source category is shelved here yet.</span>
                      <span>Drop a source category here.</span>
                    </div>
                  ) : (
                    <div className={styles.sourceRows}>
                      {group.items.map((item, itemIndex) => (
                        <CollectionCard
                          key={item.slug}
                          item={item}
                          itemIndex={itemIndex}
                          allGroups={resolvedGroups}
                          confirmingHide={confirmingHideCategorySlug === item.slug}
                          onRequestHideCategory={onRequestHideCategory}
                          onCancelHideCategory={onCancelHideCategory}
                          onConfirmHideCategory={onConfirmHideCategory}
                          onMoveCategory={onMoveCategory}
                          busy={
                            busyKey === `membership:${item.slug}` ||
                            busyKey === `category:hide:${item.slug}` ||
                            isPending
                          }
                        />
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>

          <SourceBlock id="reader-notes" title="Reader notes" empty="No reader notes yet."></SourceBlock>
        </div>
      </section>
    </main>
  );
}

function CollectionCard({
  item,
  itemIndex,
  allGroups,
  confirmingHide,
  onRequestHideCategory,
  onCancelHideCategory,
  onConfirmHideCategory,
  onMoveCategory,
  busy,
}: {
  item: SourceLibraryItem & { groupId: string };
  itemIndex: number;
  allGroups: Array<{
    id: string;
    label: string;
  }>;
  confirmingHide: boolean;
  onRequestHideCategory: (categorySlug: string) => void;
  onCancelHideCategory: () => void;
  onConfirmHideCategory: (categorySlug: string) => void;
  onMoveCategory: (categorySlug: string, groupId: string) => void;
  busy: boolean;
}) {
  const representativeArtifact = VERIFIED_DOSSIER_ARTIFACTS[stableHash(item.slug) % VERIFIED_DOSSIER_ARTIFACTS.length];

  return (
    <div
      className={`${styles.sourceRow} loom-source-sample-card loom-atlas-card`}
      draggable
      title="Drag to another shelf, or use the Re-shelve menu."
      onDragStart={(event) => {
        event.dataTransfer.setData('application/x-loom-category-slug', item.slug);
        event.dataTransfer.setData('text/plain', item.label);
        event.dataTransfer.effectAllowed = 'move';
        (event.currentTarget as HTMLElement).style.opacity = '0.5';
      }}
      onDragEnd={(event) => {
        (event.currentTarget as HTMLElement).style.opacity = '';
      }}
    >
      <Link
        href={`/knowledge/${item.slug}`}
        className={`${styles.sourceLink} loom-source-sample`}
        aria-label={`Open shelf ${item.label}`}
      >
        <FileBadge
          kind={representativeArtifact.kind}
          label={representativeArtifact.label}
          compact
        />
        <span>
          <strong>{item.label}</strong>
          <small>
            {formatCount(item.count, 'source')} / sample {formatOrdinal(itemIndex + 1)}
          </small>
        </span>
        <em>{sourceCategorySignal(item)}</em>
      </Link>

      <div className={styles.sourceTools}>
        {confirmingHide ? (
          <div className={styles.confirmTools}>
            <span>Hide from shelves?</span>
            <button type="button" onClick={() => onConfirmHideCategory(item.slug)} aria-busy={busy}>
              Hide
            </button>
            <button type="button" onClick={onCancelHideCategory}>
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="loom-source-sample__remove"
            onClick={() => onRequestHideCategory(item.slug)}
            aria-label={`Hide ${item.label} from shelves`}
            title="Hide from shelves (original files stay read-only)"
            aria-busy={busy}
          >
            Hide
          </button>
        )}

        {allGroups.length > 1 ? (
          <select
            className="loom-source-sample__move loom-atlas-card-move"
            value={item.groupId ?? 'ungrouped'}
            onChange={(event) => onMoveCategory(item.slug, event.target.value)}
            disabled={busy}
            aria-label="Re-shelve source"
            title="Move this source group"
          >
            {allGroups.map((group) => (
              <option key={group.id} value={group.id}>
                Re-shelve to {group.label}
              </option>
            ))}
          </select>
        ) : null}
      </div>
    </div>
  );
}

function SourceBlock({ id, title, empty }: { id?: string; title: string; empty: string }) {
  return (
    <section id={id} className="loom-source-block">
      <h3>{title}</h3>
      <p>{empty}</p>
    </section>
  );
}

function sourceStateTags(group: ResolvedSourceLibraryGroup) {
  if (group.items.length === 0) return ['No files added yet.'];
  const hasDraft = group.items.some((item) => item.count > 0);
  return [
    'Sources ready',
    hasDraft ? 'Has draft' : 'Needs draft',
    `${formatCount(group.items.length, 'category')}`,
  ];
}

function sourceCategorySignal(item: SourceLibraryItem) {
  const key = `${item.slug} ${item.label}`.toLowerCase();
  if (/unsw|econ|course|lecture|tutorial|problem/.test(key)) return 'Course evidence';
  if (/quant|market|trading|python/.test(key)) return 'Skill proof';
  if (/wqu|credential|case/.test(key)) return 'Credential evidence';
  if (/claude|ai|prompt|conversation/.test(key)) return 'AI memory';
  if (/about|profile|bio/.test(key)) return 'Identity context';
  return 'Source group';
}

function normalizeSourceSearch(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function stableHash(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function formatOrdinal(value: number) {
  return value.toString().padStart(2, '0');
}

function formatCount(count: number, noun: string) {
  if (noun === 'shelf') return `${count} ${count === 1 ? 'shelf' : 'shelves'}`;
  if (noun === 'category') return `${count} ${count === 1 ? 'category' : 'categories'}`;
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}
