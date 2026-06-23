/**
 * Last-write-wins by millisecond timestamp. Pure, no I/O. Tie prefers local so a
 * just-made local edit is never clobbered by an equal-stamp remote.
 */
export type Stamped<T> = { value: T; updatedAt: number };
export type Winner<T> = { value: T; updatedAt: number; source: 'local' | 'remote' };

export function pickWinner<T>(local: Stamped<T> | null, remote: Stamped<T> | null): Winner<T> | null {
  if (local && remote) {
    return remote.updatedAt > local.updatedAt
      ? { ...remote, source: 'remote' }
      : { ...local, source: 'local' };
  }
  if (local) return { ...local, source: 'local' };
  if (remote) return { ...remote, source: 'remote' };
  return null;
}
