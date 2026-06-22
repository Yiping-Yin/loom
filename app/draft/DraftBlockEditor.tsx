'use client';

import React from 'react';
import {
  type NewLoomDraftDocBlock,
  type DocBlockKind,
  newDocBlock,
} from '../../lib/new-loom/draft-blocks';

function makeId(): string {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  } catch {}
  return `b-${Math.round(performance?.now?.() ?? 0)}-${Math.floor(Math.random() * 1e6)}`;
}

export function DraftBlockEditor({
  blocks,
  onChange,
}: {
  blocks: NewLoomDraftDocBlock[];
  onChange: (next: NewLoomDraftDocBlock[]) => void;
}) {
  const replace = (id: string, patch: Partial<NewLoomDraftDocBlock>) =>
    onChange(blocks.map((b) => (b.id === id ? ({ ...b, ...patch } as NewLoomDraftDocBlock) : b)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const copy = blocks.slice();
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
    onChange(copy);
  };
  const remove = (id: string) => onChange(blocks.filter((b) => b.id !== id));
  const addAfter = (i: number, kind: DocBlockKind) => {
    const copy = blocks.slice();
    copy.splice(i + 1, 0, newDocBlock(kind, makeId));
    onChange(copy);
  };

  return (
    <div className="new-loom-draft__blocks" role="list" aria-label="Document blocks">
      {blocks.map((b, i) => (
        <article key={b.id} className={`new-loom-draft__block new-loom-draft__block--${b.kind}`} role="listitem">
          <div className="new-loom-draft__block-rail" aria-hidden="true">{b.kind}</div>
          <div className="new-loom-draft__block-body">
            {b.kind === 'text' && (
              <textarea
                className="new-loom-draft__block-text"
                aria-label="Text block"
                value={b.text}
                onChange={(e) => replace(b.id, { text: e.target.value })}
              />
            )}
            {b.kind === 'code' && (
              <>
                <div className="new-loom-draft__block-codemeta">
                  <input
                    className="new-loom-draft__block-lang"
                    aria-label="Code language"
                    placeholder="lang"
                    value={b.lang ?? ''}
                    onChange={(e) => replace(b.id, { lang: e.target.value })}
                  />
                  <input
                    className="new-loom-draft__block-source"
                    aria-label="Code source"
                    placeholder="source (repo / path)"
                    value={b.source ?? ''}
                    onChange={(e) => replace(b.id, { source: e.target.value })}
                  />
                </div>
                <textarea
                  className="new-loom-draft__block-code"
                  aria-label="Code block"
                  value={b.text}
                  spellCheck={false}
                  onChange={(e) => replace(b.id, { text: e.target.value })}
                />
              </>
            )}
            {b.kind === 'cite' && (
              <a className="new-loom-draft__block-cite" href={b.href || undefined}>
                <span className="new-loom-draft__block-cite-label">{b.label || 'Untitled source'}</span>
                {b.excerpt ? <span className="new-loom-draft__block-cite-excerpt">{b.excerpt}</span> : null}
              </a>
            )}
          </div>
          <div className="new-loom-draft__block-tools">
            <button type="button" aria-label="Move up" onClick={() => move(i, -1)}>↑</button>
            <button type="button" aria-label="Move down" onClick={() => move(i, 1)}>↓</button>
            <button type="button" aria-label="Delete block" onClick={() => remove(b.id)}>✕</button>
          </div>
          <div className="new-loom-draft__block-add">
            <button type="button" onClick={() => addAfter(i, 'text')}>+ Text</button>
            <button type="button" onClick={() => addAfter(i, 'code')}>+ Code</button>
          </div>
        </article>
      ))}
      {blocks.length === 0 && (
        <button type="button" className="new-loom-draft__block-add" onClick={() => onChange([newDocBlock('text', makeId)])}>
          + Start writing
        </button>
      )}
    </div>
  );
}
