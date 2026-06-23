import { AccountClient } from './AccountClient';

export const metadata = { title: 'Account · Loom' };

/** /account — sign in to enable cloud sync of your Digital Me across devices. */
export default function AccountPage() {
  return <AccountClient />;
}
