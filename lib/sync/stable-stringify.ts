/**
 * Deterministic JSON: object keys sorted recursively so two structurally-equal
 * values stringify identically regardless of key insertion order. Arrays keep
 * their order. Used to key append-only trace events for cross-device dedup (events
 * have no stable id) and as a cheap record-equality check in the sync engine.
 */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`;
}
