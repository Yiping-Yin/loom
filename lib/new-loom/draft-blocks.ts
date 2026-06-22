import {
  draftBlocksFromBody,
  type NewLoomDraftReference,
} from './draft-storage';

export type NewLoomDraftDocBlock =
  | { id: string; kind: 'text'; text: string }
  | { id: string; kind: 'code'; text: string; lang?: string; source?: string }
  | { id: string; kind: 'cite'; href: string; label: string; excerpt?: string };

export type DocBlockKind = NewLoomDraftDocBlock['kind'];

export function newDocBlock(kind: DocBlockKind, createId: () => string): NewLoomDraftDocBlock {
  const id = createId();
  if (kind === 'code') return { id, kind: 'code', text: '' };
  if (kind === 'cite') return { id, kind: 'cite', href: '', label: '' };
  return { id, kind: 'text', text: '' };
}

const LANG_BY_EXT: Record<string, string> = {
  py: 'python', ts: 'ts', tsx: 'tsx', js: 'js', jsx: 'jsx', go: 'go',
  rs: 'rust', java: 'java', c: 'c', cpp: 'cpp', sql: 'sql', sh: 'bash', json: 'json', css: 'css', html: 'html',
};
const PROSE_EXT = new Set(['md', 'markdown', 'txt', '']);

export function fileToDocBlock(name: string, text: string, createId: () => string): NewLoomDraftDocBlock {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (PROSE_EXT.has(ext)) return { id: createId(), kind: 'text', text };
  return { id: createId(), kind: 'code', text, lang: LANG_BY_EXT[ext], source: name };
}

export function blocksToBody(blocks: NewLoomDraftDocBlock[]): string {
  return blocks
    .map((b) => {
      if (b.kind === 'code') {
        const fence = ['```' + [b.lang, b.source].filter(Boolean).join(' ')].join('');
        return `${fence}\n${b.text}\n\`\`\``;
      }
      if (b.kind === 'cite') {
        const quote = (b.excerpt ?? '').trim();
        const cite = `[${b.label}](${b.href})`;
        return quote ? `> ${quote}\n> — ${cite}` : `— ${cite}`;
      }
      return b.text;
    })
    .join('\n\n')
    .trim();
}

export function bodyToBlocks(
  body: string,
  references: NewLoomDraftReference[],
  createId: () => string,
): NewLoomDraftDocBlock[] {
  const derived = draftBlocksFromBody(body, references); // existing parser (draft-storage.ts:1445)
  if (derived.length === 0) {
    return body.trim() ? [{ id: createId(), kind: 'text', text: body }] : [];
  }
  return derived.map((d) => {
    if (d.kind === 'code') {
      const lines = d.text.split('\n');
      const fence = lines[0]?.startsWith('```') ? lines[0].slice(3).trim() : '';
      const [lang, source] = fence.split(/\s+/);
      const inner = lines
        .filter((l, i) => !(i === 0 && l.startsWith('```')) && l.trim() !== '```')
        .join('\n');
      return { id: createId(), kind: 'code', text: inner, lang: lang || undefined, source: source || undefined };
    }
    return { id: createId(), kind: 'text', text: d.text };
  });
}
