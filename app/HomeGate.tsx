'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HomeConversationalCover } from './HomeConversationalCover';
import { readBeginnerProfileLocal } from '../lib/profile/profile-storage';

/**
 * Two-door entry at `/` (the guaranteed cold-open target via loom://bundle/index.html):
 * - No profile (new user) → the conversation-first cosmic cover.
 * - Profile present (returning) → straight into their usable LOOM at /digital-me.
 * SSR/first paint always renders the cover (localStorage is invisible server-side);
 * after mount, a returning user is redirected. A brief cover flash is acceptable
 * (instant under reduced motion). The old beginner profile view is retired as
 * the `/` default.
 */
export function HomeGate() {
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (readBeginnerProfileLocal()) {
      setRedirecting(true);
      router.replace('/digital-me');
    }
  }, [router]);

  if (redirecting) return <div className="loom-cosmic-field" aria-hidden />;
  return <HomeConversationalCover />;
}
