/**
 * Draft → artifact mapping (the moat mechanism).
 *
 * The clean way to make a user's INCLUDED Studio writing feed BOTH the Ask
 * corpus AND capability derivation is to map an opted-in draft to an
 * `ArtifactRef` and route it through the EXISTING artifact pipeline. Artifacts
 * already drive both seams:
 *   - the Ask corpus folds each artifact in as a grounded, citeable
 *     `me-artifact-*` source (see lib/new-loom/beginner-ask-corpus.ts), and
 *   - capability derivation reads `profile.artifacts` as evidence (see
 *     lib/capability/capability-graph.ts).
 * So one mapping unlocks both, with no new pipeline.
 *
 * Curation is opt-in: only drafts the user explicitly marked
 * `includedInDigitalMe` are exposed. Everything else stays private.
 */

import type { ArtifactRef, BeginnerProfile } from '../profile/beginner-profile';
import { readBeginnerProfileLocal } from '../profile/profile-storage';
import {
  browserDraftStorage,
  listDrafts,
  type DraftStorageAdapter,
  type NewLoomDraftRecord,
} from './draft-storage';

/**
 * Distinguishes a draft-derived artifact id from an uploaded artifact id (whose
 * id is the IndexedDB blob key). The prefix guarantees the two id spaces never
 * collide when both kinds live in `profile.artifacts`.
 *
 * Exported because the Ask corpus needs it to tell a draft-derived artifact
 * apart from an uploaded one: an uploaded artifact's citation opens its
 * IndexedDB blob by id, but a draft has NO blob — its citation must instead
 * navigate to the Studio editor (`/studio?edit=<draftId>`). See
 * `resolveBeginnerSource` in beginner-ask-corpus.ts.
 */
export const DRAFT_ARTIFACT_ID_PREFIX = 'draft-';

/**
 * Build the Studio editor href for a draft-derived artifact id. Strips the
 * `draft-` prefix back to the raw draft id and points at the edit-mode route
 * (`/studio?edit=<draftId>`). Returns null when the id is not a draft artifact id, so callers
 * can fall back to the uploaded-artifact (blob-open) path.
 */
export function draftArtifactEditHref(artifactId: string): string | null {
  if (!artifactId.startsWith(DRAFT_ARTIFACT_ID_PREFIX)) return null;
  const draftId = artifactId.slice(DRAFT_ARTIFACT_ID_PREFIX.length);
  if (!draftId) return null;
  return `/studio?edit=${encodeURIComponent(draftId)}`;
}

/**
 * The closest existing ArtifactRef kind for a written document. The uploaded
 * pipeline narrows kinds to 'pdf'|'image'|'doc'|'other' and the corpus already
 * falls back to 'doc' for documents — a draft is a typed document, so 'doc'.
 */
const DRAFT_ARTIFACT_KIND = 'doc';

const UNTITLED_DOCUMENT_NAME = 'Untitled document';

// Mirror the extracted-text bound that the storage seam applies to uploaded
// artifacts (ARTIFACT_TEXT_MAX in beginner-profile.ts): a legitimate excerpt
// survives intact, while an oversized/control-char-laden body is sanitized and
// capped here so a draft ref never carries garbage into the corpus. (The
// profile normalizer re-applies the same discipline as a final guard, but
// bounding at this seam keeps the ref well-formed on its own.)
const DRAFT_ARTIFACT_TEXT_MAX = 4000;

/** Strip control chars (keeping ordinary whitespace), collapse runs, cap. */
function boundExtractedText(value: string): string | undefined {
  const cleaned = value
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return undefined;
  return cleaned.length > DRAFT_ARTIFACT_TEXT_MAX
    ? cleaned.slice(0, DRAFT_ARTIFACT_TEXT_MAX)
    : cleaned;
}

/**
 * Map one draft record to an `ArtifactRef`. Pure: no storage, no side effects.
 *
 * - `id`           : `draft-<draft.id>` so it can't collide with an uploaded
 *                    artifact's blob-key id.
 * - `name`/`label` : the draft title (a placeholder for an untitled draft).
 * - `kind`         : 'doc' (the document kind in the artifact pipeline).
 * - `extractedText`: the synced markdown body, sanitized + bounded like an
 *                    uploaded artifact's excerpt. This is the grounded slice the
 *                    corpus searches/cites and capability derivation reads.
 */
export function draftRecordToArtifactRef(draft: NewLoomDraftRecord): ArtifactRef {
  const name = draft.title.trim() || UNTITLED_DOCUMENT_NAME;
  const extractedText = boundExtractedText(draft.body);
  return {
    id: `${DRAFT_ARTIFACT_ID_PREFIX}${draft.id}`,
    name,
    label: name,
    kind: DRAFT_ARTIFACT_KIND,
    ...(extractedText ? { extractedText } : {}),
  };
}

/**
 * Collect the curated drafts as ArtifactRefs: only those the user explicitly
 * opted into Digital Me. This is the single point that folds a beginner's own
 * writing into the artifact pipeline (and thus into both the Ask corpus and
 * capability derivation).
 */
export function includedDraftArtifacts(
  adapter: DraftStorageAdapter,
  key?: string,
): ArtifactRef[] {
  return listDrafts(adapter, key)
    .filter((draft) => draft.includedInDigitalMe)
    .map(draftRecordToArtifactRef);
}

/**
 * Transiently fold draft-derived artifacts into a profile for capability
 * derivation. Returns a NEW profile whose `artifacts` is the user's OWN
 * artifacts followed by the draft refs — so an included draft backs capabilities
 * as evidence, exactly like an uploaded artifact.
 *
 * Discipline (mirrors prior Fix #4 non-clobbering):
 *   - PURE: the input profile (and its artifacts array) is never mutated. The
 *     caller persists ONLY the derived capabilities, never this merged profile —
 *     so the user's real `profile.artifacts` are never overwritten with the
 *     draft copies.
 *   - NON-CLOBBERING: the profile's own artifacts come first and WIN on id
 *     collision; a draft ref whose `draft-<id>` already exists as a real
 *     artifact is dropped, never overwriting the real one or duplicating the id.
 */
export function mergeDraftArtifactsForDerivation(
  profile: BeginnerProfile,
  draftArtifacts: ArtifactRef[],
): BeginnerProfile {
  const own = profile.artifacts ?? [];
  if (draftArtifacts.length === 0) {
    return { ...profile, artifacts: [...own] };
  }
  const seen = new Set(own.map((a) => a.id));
  const additions = draftArtifacts.filter((ref) => !seen.has(ref.id));
  return { ...profile, artifacts: [...own, ...additions] };
}

/**
 * Fold the user's INCLUDED Studio drafts into a profile for the Ask path — the
 * Ask half of the moat. PURE + testable: takes the profile and a draft adapter,
 * no globals.
 *
 * This is the shared seam the Ask CLIENT calls before sending its profile to
 * /api/ask. The persisted beginner profile (read from localStorage) carries NO
 * draft artifacts — drafts live in separate draft-storage — so without this the
 * corpus never sees a curated draft and the me-artifact-* draft source + its
 * openable citation are unreachable at runtime. Folding the drafts in here makes
 * an included draft genuinely reach the corpus, count toward the grounding floor,
 * and resolve to a /studio?edit=<draftId> citation.
 *
 * Discipline mirrors handleBuildCapabilities exactly (capability-derivation path):
 *   - NULL profile → null. forceOwnerCorpus, or no local profile, passes null so
 *     /api/ask falls back to the Yiping corpus exactly as before.
 *   - NULL adapter (SSR / no localStorage) → the profile unchanged, never throws.
 *   - NON-CLOBBERING + TRANSIENT: real uploaded artifacts win on id collision and
 *     the input profile is never mutated. The result is sent, never persisted, so
 *     the user's real profile.artifacts are preserved.
 */
export function withIncludedDraftArtifacts(
  profile: BeginnerProfile | null,
  adapter: DraftStorageAdapter | null,
): BeginnerProfile | null {
  if (!profile) return null;
  if (!adapter) return profile;
  return mergeDraftArtifactsForDerivation(profile, includedDraftArtifacts(adapter));
}

/**
 * Browser wrapper around `withIncludedDraftArtifacts`: reads the persisted
 * beginner profile and the live draft storage, then folds the user's included
 * drafts into the profile the Ask widget posts to /api/ask. Returns null when
 * there is no usable local profile (the Yiping-corpus fallback).
 *
 * SSR-safe: both reads return null outside a browser, so this returns null and
 * the caller posts only the question.
 */
export function readBeginnerProfileForAsk(): BeginnerProfile | null {
  return withIncludedDraftArtifacts(readBeginnerProfileLocal(), browserDraftStorage());
}
