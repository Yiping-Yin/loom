/**
 * Maps "AI answer" records (loom.new.draft-records.v1) to/from the jsonb row
 * `data`. Drops unsafe sourceHrefs on ingest; malformed row returns null.
 */
import type { CollectionMapper } from './collection-sync';
import { isDraftAnswerRecord, type NewLoomDraftRecord as AnswerRecord } from '../new-loom/draft-records';
import { safeHref } from '../profile/safe-href';

export type { AnswerRecord };

export const draftRecordMapper: CollectionMapper<AnswerRecord> = {
  toData: (value) => value,
  fromData: (data) => {
    if (!isDraftAnswerRecord(data)) return null;
    return {
      ...data,
      sourceHrefs: data.sourceHrefs.filter((href) => safeHref(href) !== ''),
    };
  },
};
