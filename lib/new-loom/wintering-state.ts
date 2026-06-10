/**
 * Wintering state · "locked, kept, returned to".
 *
 * Material in Loom is never force-deleted by time. It cools instead:
 * untouched items start wintering after 45 days and settle into the
 * archive after a year. Nothing is destroyed — wintered and archived
 * items stay on The Year's ribbon, waiting for the next return.
 */

export type NewLoomWinteringState = 'active' | 'wintering' | 'archived';

export type NewLoomWinteringThresholds = {
  /** Days without a touch before an item starts wintering. */
  winteringAfter: number;
  /** Days without a touch before an item settles into the archive. */
  archivedAfter: number;
};

export const NEW_LOOM_WINTERING_THRESHOLDS: NewLoomWinteringThresholds = {
  winteringAfter: 45,
  archivedAfter: 365,
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function deriveNewLoomWinteringState(
  lastTouchedAt: number,
  now: number = Date.now(),
  thresholds: NewLoomWinteringThresholds = NEW_LOOM_WINTERING_THRESHOLDS,
): NewLoomWinteringState {
  if (!Number.isFinite(lastTouchedAt) || lastTouchedAt <= 0) return 'archived';
  const idleDays = Math.max(0, now - lastTouchedAt) / DAY_MS;
  if (idleDays >= thresholds.archivedAfter) return 'archived';
  if (idleDays >= thresholds.winteringAfter) return 'wintering';
  return 'active';
}

export type NewLoomWinteringBuckets<T> = {
  active: T[];
  wintering: T[];
  archived: T[];
};

export function bucketNewLoomWinteringItems<T extends { at: number }>(
  items: readonly T[],
  now: number = Date.now(),
  thresholds: NewLoomWinteringThresholds = NEW_LOOM_WINTERING_THRESHOLDS,
): NewLoomWinteringBuckets<T> {
  const buckets: NewLoomWinteringBuckets<T> = { active: [], wintering: [], archived: [] };
  for (const item of items) {
    buckets[deriveNewLoomWinteringState(item.at, now, thresholds)].push(item);
  }
  return buckets;
}
