import { HomeGate } from './HomeGate';

export default function Home() {
  // F2 step 2: the default `/` route is a generic product surface. A no-profile
  // STRANGER sees the neutral HomeLanding (rendered by HomeGate); a beginner
  // with a localStorage profile sees HomeProfileView. The owner verified dossier
  // is no longer the default — it lives at /example. There is no server-side
  // content-root redirect: the landing's CTAs are the entry points.
  return <HomeGate />;
}
