import type { NewLoomDraftRecord, NewLoomDraftReference } from './draft-storage';

export type NativeDraftStorage = {
  list(): Promise<NewLoomDraftRecord[]>;
  create(input: {
    title?: string;
    body?: string;
    references?: NewLoomDraftReference[];
  }): Promise<NewLoomDraftRecord>;
  update(
    id: string,
    patch: Partial<
      Pick<NewLoomDraftRecord, 'title' | 'body' | 'references' | 'includedInDigitalMe'>
    >,
  ): Promise<NewLoomDraftRecord>;
};

/// The installed app exposes `LoomDraftStore` to the webview through a
/// `WKScriptMessageHandlerWithReply` registered under `loomDrafts`. Posting a
/// message returns a Promise that resolves with the native reply, so web Draft
/// and native Draft share the same on-disk store instead of splitting between
/// WebView `localStorage` and the native JSON index. In plain browser/dev mode
/// the bridge is absent and `nativeDraftStorage()` returns `null`, so callers
/// fall back to the localStorage adapter.
type LoomDraftsBridgeWindow = {
  webkit?: {
    messageHandlers?: {
      loomDrafts?: { postMessage: (msg: unknown) => Promise<unknown> };
    };
  };
};

function loomDraftsBridge() {
  if (typeof window === 'undefined') return null;
  try {
    return (window as unknown as LoomDraftsBridgeWindow).webkit?.messageHandlers?.loomDrafts ?? null;
  } catch (_) {
    return null;
  }
}

export function nativeDraftStorage(): NativeDraftStorage | null {
  const bridge = loomDraftsBridge();
  if (!bridge?.postMessage) return null;

  return {
    async list() {
      const reply = await bridge.postMessage({ action: 'list' });
      return Array.isArray(reply) ? (reply as NewLoomDraftRecord[]) : [];
    },
    async create(input) {
      const reply = await bridge.postMessage({ action: 'create',
        title: input.title,
        body: input.body,
        references: input.references,
      });
      return reply as NewLoomDraftRecord;
    },
    async update(id, patch) {
      const reply = await bridge.postMessage({ action: 'update',
        id,
        title: patch.title,
        body: patch.body,
        references: patch.references,
        includedInDigitalMe: patch.includedInDigitalMe,
      });
      return reply as NewLoomDraftRecord;
    },
  };
}
