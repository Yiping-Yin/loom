import {
  normalizeBeginnerProfile,
  type BeginnerProfile,
} from './beginner-profile';

/**
 * Merge a model-extracted BeginnerProfile into an in-progress one.
 *
 * Used by the onboarding "paste a résumé" flow: the user may already have typed
 * a name/headline/summary before pasting, so extraction must ENRICH rather than
 * clobber. The rule is "fill the gaps the user hasn't filled":
 *
 *   - home.name / home.headline / about.summary: keep the user's value if they
 *     already entered one; otherwise take the extracted value.
 *   - about.links: union — keep existing, append extracted links not already
 *     present (deduped by href).
 *   - education / experience / works: append extracted entries to whatever the
 *     user already has (extraction adds, it does not replace prior entries).
 *   - artifacts / capabilities: preserved from the user's in-progress profile
 *     (an extracted profile carries neither). Omitting them here would let the
 *     trailing normalize default them to [] — silently wiping an uploaded
 *     résumé's citeable artifact, the grounded-cited moat this flow exists for.
 *
 * The result is run through normalizeBeginnerProfile so the merged object is
 * always a clean, capped, href-sanitized profile regardless of inputs. Pure and
 * side-effect free so it can be unit-tested directly.
 */
export function mergeExtractedProfile(
  current: BeginnerProfile,
  extracted: BeginnerProfile,
): BeginnerProfile {
  // Normalize both inputs first so trimming / empties are consistent before we
  // decide which side "has a value".
  const cur = normalizeBeginnerProfile(current);
  const ext = normalizeBeginnerProfile(extracted);

  // Scalar fields: the user's own input wins; extraction only fills blanks.
  const name = cur.home.name.trim() ? cur.home.name : ext.home.name;
  const headline = cur.home.headline.trim() ? cur.home.headline : ext.home.headline;
  const summary = cur.about.summary.trim() ? cur.about.summary : ext.about.summary;

  // Links: union by href (existing first, then new extracted links).
  const seenHrefs = new Set(cur.about.links.map((l) => l.href));
  const links = [
    ...cur.about.links,
    ...ext.about.links.filter((l) => !seenHrefs.has(l.href)),
  ];

  // List sections: append extracted entries after the user's existing ones.
  const merged: BeginnerProfile = {
    version: 1,
    home: { name, headline },
    about: { summary, links },
    education: [...cur.education, ...ext.education],
    experience: [...cur.experience, ...ext.experience],
    works: [...cur.works, ...ext.works],
    // Keep the user's uploaded artifacts + derived capabilities through the
    // merge (cur/ext are already normalized, so these are guaranteed arrays).
    artifacts: [...(cur.artifacts ?? []), ...(ext.artifacts ?? [])],
    capabilities: [...(cur.capabilities ?? []), ...(ext.capabilities ?? [])],
  };

  // Final pass through the trusted seam (re-caps the now-larger arrays, etc.).
  return normalizeBeginnerProfile(merged);
}
