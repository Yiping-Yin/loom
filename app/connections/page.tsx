import ConnectionsClient from './ConnectionsClient';

/**
 * /connections — Connections / Correspondents. A support surface that
 * shows who your sources came from and where two sources meet, with
 * cross-origin links (web ↔ local) treated as first-class.
 */

export const metadata = { title: 'Connections · Loom' };

export default function ConnectionsPage() {
  return <ConnectionsClient />;
}
