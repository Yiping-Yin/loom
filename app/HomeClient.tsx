'use client';

import { VerifiedDossierHome } from '../components/verified-dossier/VerifiedDossierHome';
import { NEW_LOOM_CAPABILITIES } from '../lib/new-loom/product-shell';

export function HomeClient() {
  return (
    <>
      <VerifiedDossierHome />
      <nav className="new-loom-home-capabilities" aria-label="Loom workspaces">
        {NEW_LOOM_CAPABILITIES.map((capability) => (
          <a
            key={capability.id}
            href={capability.href}
            data-capability={capability.id}
            className="new-loom-home-capabilities__link"
          >
            {capability.label}
          </a>
        ))}
      </nav>
    </>
  );
}
