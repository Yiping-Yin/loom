/**
 * Connections / Correspondents · pure derivation helpers.
 *
 * Sources carry the people and places they came from. Two sources that
 * share a correspondent are connected; when the two sit on different
 * origins (a web host and a local file, or two different hosts) the
 * connection is cross-origin and shown first-class on /connections.
 */

export type NewLoomConnectionSource = {
  id: string;
  title: string;
  /** Where the source came from — a web origin host or 'local'. */
  origin: string;
  href?: string;
  /** The person (or named place) the source came from. */
  correspondent?: string;
};

export type NewLoomSourceConnection = {
  id: string;
  from: NewLoomConnectionSource;
  to: NewLoomConnectionSource;
  /** What the two sources share — the correspondent's name. */
  via: string;
  crossOrigin: boolean;
};

export type NewLoomCorrespondent = {
  name: string;
  sources: NewLoomConnectionSource[];
};

export type NewLoomSourceConnectionMap = {
  correspondents: NewLoomCorrespondent[];
  connections: NewLoomSourceConnection[];
  crossOriginConnections: NewLoomSourceConnection[];
};

export function deriveNewLoomSourceConnections(
  sources: readonly NewLoomConnectionSource[],
): NewLoomSourceConnectionMap {
  const byCorrespondent = new Map<string, NewLoomCorrespondent>();
  for (const source of sources) {
    const name = source.correspondent?.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    const existing = byCorrespondent.get(key) ?? { name, sources: [] };
    existing.sources.push(source);
    byCorrespondent.set(key, existing);
  }

  const correspondents = [...byCorrespondent.values()].sort(
    (a, b) => b.sources.length - a.sources.length || a.name.localeCompare(b.name),
  );

  const connections: NewLoomSourceConnection[] = [];
  for (const correspondent of correspondents) {
    const linked = correspondent.sources;
    for (let i = 0; i < linked.length; i += 1) {
      for (let j = i + 1; j < linked.length; j += 1) {
        const from = linked[i];
        const to = linked[j];
        connections.push({
          id: `${from.id}->${to.id}`,
          from,
          to,
          via: correspondent.name,
          crossOrigin: from.origin !== to.origin,
        });
      }
    }
  }

  const crossOriginConnections = connections.filter((connection) => connection.crossOrigin);

  return { correspondents, connections, crossOriginConnections };
}

export function sourceConnectionDraftHref(link: NewLoomSourceConnection) {
  const params = new URLSearchParams();
  params.set('draftType', 'connection');
  for (const source of [link.from, link.to]) {
    params.append('ref', source.href ?? `loom://source/${encodeURIComponent(source.id)}`);
    params.append('label', source.title);
    params.append('source', source.title);
    params.append('kind', 'source');
  }
  params.set('excerpt', `Connected via ${link.via} (${link.from.origin} ↔ ${link.to.origin})`);
  return `/studio?edit=new&${params.toString()}`;
}
