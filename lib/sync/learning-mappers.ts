/**
 * Row<->record mappers for the learning-engine collections (Phase 4). Each
 * validates a stored row has a string `id` + numeric `updatedAt`, else fromData
 * returns null (a garbage row is skipped, never materialized). Traces additionally
 * require an `events` array (the merge unions it).
 */
import type { AsyncCollectionMapper } from './async-collection-sync';
import type { Trace } from '../trace/types';
import type { Panel } from '../panel/types';
import type { Weave } from '../weave/types';

export function idUpdatedAtMapper<T extends { id: string; updatedAt: number }>(): AsyncCollectionMapper<T> {
  return {
    toData: (value) => value,
    fromData: (data) => {
      if (!data || typeof data !== 'object') return null;
      const record = data as Record<string, unknown>;
      if (typeof record.id !== 'string' || typeof record.updatedAt !== 'number') return null;
      return data as T;
    },
  };
}

export const traceMapper: AsyncCollectionMapper<Trace> = {
  toData: (value) => value,
  fromData: (data) => {
    const base = idUpdatedAtMapper<Trace>().fromData(data);
    if (!base || !Array.isArray((base as Trace).events)) return null;
    return base;
  },
};

export const panelMapper = idUpdatedAtMapper<Panel>();
export const weaveMapper = idUpdatedAtMapper<Weave>();
