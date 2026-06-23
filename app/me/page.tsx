import { MeLoader } from './MeLoader';

export const metadata = { title: 'Load my profile · Loom' };

/**
 * /me — the owner's private loader. There is no account system yet; this is the
 * bridge that loads the owner's real profile (lib/profile/owner-profile.ts) into
 * the live, localStorage-driven product so /digital-me, /about, /education,
 * /experience, Studio and Ask all become Yiping. Discoverable by URL only.
 */
export default function MePage() {
  return <MeLoader />;
}
