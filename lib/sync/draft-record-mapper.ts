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
    // sourceLabels[i] and sourceHrefs[i] are positionally paired (the UI renders
    // them by index). Drop an unsafe-href pair WHOLE so the surviving labels stay
    // aligned with their hrefs — filtering only one array would misattribute
    // citations (a high-severity provenance bug).
    const labels: string[] = [];
    const hrefs: string[] = [];
    const count = Math.max(data.sourceLabels.length, data.sourceHrefs.length);
    for (let i = 0; i < count; i += 1) {
      const href = data.sourceHrefs[i];
      if (href !== undefined && safeHref(href) === '') continue;
      if (i < data.sourceLabels.length) labels.push(data.sourceLabels[i]!);
      if (href !== undefined) hrefs.push(href);
    }
    return { ...data, sourceLabels: labels, sourceHrefs: hrefs };
  },
};
