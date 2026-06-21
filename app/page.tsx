import { HomeGate } from './HomeGate';

export default function Home() {
  // The `/` route is the two-door entry (HomeGate): a new visitor (no profile)
  // gets the conversation-first cosmic cover; a returning user (localStorage
  // profile) is routed straight into their LOOM at /digital-me. The owner
  // verified dossier lives at /example.
  return <HomeGate />;
}
