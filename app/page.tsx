import { HomeClient } from './HomeClient';

export default function Home() {
  // The `/` route IS the owner dossier (ONE-digital-me, owner 2026-07-08).
  // The two-door landing funnel (HomeGate -> conversational cosmic cover for
  // strangers) was GTM-era web product; LOOM is a local-first single-owner
  // app, so the front door renders the verified dossier directly — same
  // surface the native You window opens at /you.
  return <HomeClient />;
}
