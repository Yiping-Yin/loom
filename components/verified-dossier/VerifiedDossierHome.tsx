import {
  VERIFIED_DOSSIER_PRESENTATION_CATEGORIES,
  VERIFIED_DOSSIER_PROFILE,
  VERIFIED_DOSSIER_TOP_NAV,
} from '../../lib/new-loom/verified-dossier-home';
import type { VerifiedDossierPresentationCategory } from '../../lib/new-loom/verified-dossier-home';
import { InstitutionMark } from './InstitutionMark';

const PRIMARY_NAV_LABELS = new Set(['About', 'Education', 'Experience', 'Digital Me']);
const CATEGORY_META: Record<VerifiedDossierPresentationCategory['id'], string> = {
  about: 'Profile',
  education: 'Course record',
  experience: 'Project evidence',
  'digital-me': 'Answer canvas',
};

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12h13M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CategoryVisualAsset({ category }: { category: VerifiedDossierPresentationCategory }) {
  const asset = category.visualAsset;
  const assetPaths = asset.src ? [asset.src] : asset.srcs ?? [];

  return (
    <div className={`vd-category-visual vd-category-visual--${asset.kind}`} role="img" aria-label={asset.label}>
      <div className="vd-category-visual__media">
        {assetPaths.slice(0, 4).map((src) => (
          <img key={src} src={src} alt="" aria-hidden="true" draggable={false} />
        ))}
      </div>
    </div>
  );
}

export function VerifiedDossierHome() {
  return (
    <main className="vd-home" aria-labelledby="verified-dossier-title">
      <nav className="vd-nav" aria-label="Verified dossier navigation">
        <a className="vd-wordmark" href="/" aria-label="Loom home">
          Loom
        </a>
        <div className="vd-nav__links">
          {VERIFIED_DOSSIER_TOP_NAV.filter((item) => PRIMARY_NAV_LABELS.has(item.label)).map((item) => (
            <a key={item.label} href={item.href}>
              {item.label}
            </a>
          ))}
        </div>
        <a className="vd-avatar" href="/about" aria-label="Open Yiping Yin profile">
          <img src={VERIFIED_DOSSIER_PROFILE.photoSrc} alt="Yiping Yin" draggable={false} />
        </a>
      </nav>

      <div className="vd-page-shell">
        <section className="vd-main" aria-label="Verified dossier">
          <section className="vd-evidence-hero" aria-labelledby="verified-dossier-title">
            <section className="vd-personal-stage">
              <div className="vd-personal-stage__profile">
                <a className="vd-personal-stage__photo" href="/about" aria-label="Open Yiping Yin profile">
                  <img src={VERIFIED_DOSSIER_PROFILE.photoSrc} alt="Yiping Yin" draggable={false} />
                </a>
                <h1 id="verified-dossier-title" className="vd-title">
                  Yiping Yin
                </h1>
                <p className="vd-personal-stage__role">
                  {VERIFIED_DOSSIER_PROFILE.roles.join(' · ')} · {VERIFIED_DOSSIER_PROFILE.location}
                </p>
                <nav className="vd-profile-links" aria-label="Profile links">
                  {VERIFIED_DOSSIER_PROFILE.links.map((link) => (
                    <a key={link.label} className="vd-profile-link" href={link.href}>
                      {link.label}
                    </a>
                  ))}
                </nav>
                <div className="vd-personal-stage__actions">
                  <a className="vd-hero-link vd-hero-link--primary" href="/digital-me">
                    Digital Me <ArrowIcon />
                  </a>
                  <a className="vd-hero-link vd-hero-link--button" href="/about">
                    Profile
                  </a>
                </div>
                <div className="vd-personal-stage__memberships" aria-label="Memberships">
                  {VERIFIED_DOSSIER_PROFILE.memberships.map((membership) => (
                    <span key={membership.label}>
                      <InstitutionMark kind={membership.kind} />
                      {membership.label}
                    </span>
                  ))}
                </div>
              </div>

              <section className="vd-personal-categories" aria-label="Personal presentation sections">
                {VERIFIED_DOSSIER_PRESENTATION_CATEGORIES.map((category) => (
                  <a key={category.id} className="vd-personal-category-card" href={category.href}>
                    <CategoryVisualAsset category={category} />
                    <div className="vd-personal-category-card__body">
                      <h2>{category.label}</h2>
                      <span>{CATEGORY_META[category.id]}</span>
                    </div>
                  </a>
                ))}
              </section>
            </section>
          </section>
        </section>
      </div>
    </main>
  );
}
