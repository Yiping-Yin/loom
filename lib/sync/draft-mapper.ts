/**
 * Maps Studio block-document records (loom.new.drafts.v1) to/from the jsonb row
 * `data`. On ingest, unsafe reference hrefs are dropped (same hardening the
 * profile mapper applies), and a malformed row returns null so a collection
 * never materializes a bogus draft.
 */
import type { CollectionMapper } from './collection-sync';
import { isDraftRecord, type NewLoomDraftRecord } from '../new-loom/draft-storage';
import { safeHref } from '../profile/safe-href';

export type StudioDraft = NewLoomDraftRecord;

export const draftMapper: CollectionMapper<StudioDraft> = {
  toData: (value) => value,
  fromData: (data) => {
    if (!isDraftRecord(data)) return null;
    return {
      ...data,
      references: data.references.filter((reference) => safeHref(reference.href) !== ''),
    };
  },
};
