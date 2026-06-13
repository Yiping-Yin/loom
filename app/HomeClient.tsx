'use client';

import { VerifiedDossierHome } from '../components/verified-dossier/VerifiedDossierHome';
import { NEW_LOOM_CAPABILITIES } from '../lib/new-loom/product-shell';
import './HomeClient.module.css';

export function HomeClient() {
  return (
    <>
      <VerifiedDossierHome />
      <div className="new-loom-home-capabilities">
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
      </div>
    </>
  );
}
