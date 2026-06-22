'use client';

import { useEffect } from 'react';
import { draftStubTarget } from '../../lib/new-loom/draft-routing';

// /draft is no longer a surface — the Studio editor lives inside /digital-me.
// This stub forwards legacy links (bookmarks, the native app's remembered path,
// alias routes) to /digital-me?edit=… so nothing breaks.
export default function DraftRedirect() {
  useEffect(() => {
    window.location.replace(draftStubTarget(window.location.search));
  }, []);
  return <div className="loom-cosmic-field" aria-hidden />;
}
