'use client';

import { useEffect, useState } from 'react';
import {
  VERIFIED_DOSSIER_HISTORY,
  VERIFIED_DOSSIER_LOOM_INTRO,
  VERIFIED_DOSSIER_PRESENTATION_CATEGORIES,
  VERIFIED_DOSSIER_PROFILE,
  VERIFIED_DOSSIER_SECTIONS,
  VERIFIED_DOSSIER_TOP_NAV,
  VERIFIED_DOSSIER_UNSW_COURSES,
  VERIFIED_DOSSIER_WORKBENCH,
  resolveVerifiedDossierArtifact,
} from '../../lib/new-loom/verified-dossier-home';
import type { VerifiedDossierPresentationCategory } from '../../lib/new-loom/verified-dossier-home';
import {
  draftRecordDetailHref,
  loadLatestDraftRecord,
  NEW_LOOM_DRAFT_RECORDS_KEY,
  type NewLoomDraftRecord,
} from '../../lib/new-loom/draft-records';
import {
  ActiveEvidenceStory,
  ProvenanceChain,
  SourceGraph,
} from './EvidenceWorkbench';
import { InstitutionMark } from './InstitutionMark';

export type VerifiedDossierHomeProps = {
  activitySummary: string;
  ready: boolean;
  hasRecent: boolean;
  onOpenSources: () => void;
  onOpenRecent: () => void;
};

const FEATURED_UNSW_SECTION = VERIFIED_DOSSIER_SECTIONS.find((section) => section.id === 'unsw');
const PRIMARY_NAV_LABELS = new Set(['About', 'Education', 'Experience', 'Digital Me']);

function useLatestDraftRecord() {
  const [recentDraftRecord, setRecentDraftRecord] = useState<NewLoomDraftRecord | null>(null);

  useEffect(() => {
    setRecentDraftRecord(loadLatestDraftRecord());

    const handleStorage = (event: StorageEvent) => {
      if (event.key === NEW_LOOM_DRAFT_RECORDS_KEY) {
        setRecentDraftRecord(loadLatestDraftRecord());
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return recentDraftRecord;
}

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

function FolderIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3.5 7.5h6.1l1.8 2.1h8.1v10H3.5z"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DraftIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 3.8h7l3 3v13.4H7z" stroke="currentColor" strokeWidth="1.55" />
      <path d="M14 3.8v3h3M9.6 11.2h4.9M9.6 14.5h4.2" stroke="currentColor" strokeWidth="1.55" />
    </svg>
  );
}

function formatCategoryEvidence(artifactCount: number, shelfCount: number) {
  const sourceFileLabel = artifactCount === 1 ? 'source file' : 'source files';
  const shelfLabel = shelfCount === 1 ? 'shelf' : 'shelves';
  return `${artifactCount} ${sourceFileLabel} / ${shelfCount} ${shelfLabel}`;
}

function CategoryVisualAsset({ category }: { category: VerifiedDossierPresentationCategory }) {
  const asset = category.visualAsset;
  const assetPaths = asset.src ? [asset.src] : asset.srcs ?? [];

  return (
    <div className={`vd-category-visual vd-category-visual--${asset.kind}`} aria-label={asset.label}>
      <div className="vd-category-visual__media">
        {assetPaths.slice(0, 4).map((src) => (
          <img key={src} src={src} alt="" aria-hidden="true" draggable={false} />
        ))}
      </div>
      <div className="vd-category-visual__caption">
        <strong>{asset.label}</strong>
        <span>{asset.caption}</span>
      </div>
    </div>
  );
}

export function VerifiedDossierHome({
  hasRecent,
  onOpenSources,
  onOpenRecent,
}: VerifiedDossierHomeProps) {
  const recentDraftRecord = useLatestDraftRecord();
  const hasWorkflowDraft = Boolean(recentDraftRecord) || hasRecent;

  return (
    <main className="vd-home" aria-labelledby="verified-dossier-title">
      <nav className="vd-nav" aria-label="Verified dossier navigation">
        <a className="vd-wordmark" href="#loom-trust-layer" aria-label="Open Loom trust layer">
          Loom
        </a>
        <div className="vd-nav__links">
          {VERIFIED_DOSSIER_TOP_NAV.filter((item) => PRIMARY_NAV_LABELS.has(item.label)).map((item) => (
            <a key={item.label} className={item.label === 'Sources' ? 'is-active' : undefined} href={item.href}>
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
                <p className="vd-section-kicker">Source-backed personal profile</p>
                <h1 id="verified-dossier-title" className="vd-title">
                  Yiping Yin
                </h1>
                <p className="vd-hero-summary">
                  About, education, experience, and Digital Me are backed by real sources, drafts, and cited outputs.
                </p>
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
                    Open Digital Me <ArrowIcon />
                  </a>
                  <button className="vd-hero-link vd-hero-link--button" type="button" onClick={onOpenSources}>
                    <FolderIcon />
                    Open Sources
                  </button>
                  {recentDraftRecord ? (
                    <a className="vd-hero-link vd-hero-link--button" href={draftRecordDetailHref(recentDraftRecord)}>
                      <DraftIcon />
                      {formatDraftRecordStatus(recentDraftRecord.status)}
                    </a>
                  ) : hasWorkflowDraft ? (
                    <button className="vd-hero-link vd-hero-link--button" type="button" onClick={onOpenRecent}>
                      <DraftIcon />
                      Recent Draft
                    </button>
                  ) : null}
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
                      <p>{category.proof}</p>
                      <h2>{category.label}</h2>
                      <span>{category.capabilities.slice(0, 2).join(' / ')}</span>
                      <small>{formatCategoryEvidence(category.artifactIds.length, category.sourceSectionIds.length)}</small>
                    </div>
                  </a>
                ))}
              </section>
            </section>

            <section id="loom-trust-layer" className="vd-loom-intro vd-loom-trust-layer" aria-labelledby="loom-intro-title">
              <div>
                <p className="vd-section-kicker">Loom trust layer</p>
                <h2 id="loom-intro-title">{VERIFIED_DOSSIER_LOOM_INTRO.title}</h2>
                <p>{VERIFIED_DOSSIER_LOOM_INTRO.summary}</p>
              </div>
              <div className="vd-loom-intro__steps" aria-label="How Loom builds this profile">
                {VERIFIED_DOSSIER_LOOM_INTRO.steps.map((step) => (
                  <article key={step.label} className="vd-loom-intro__step">
                    <h3>{step.label}</h3>
                    <p>{step.text}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="vd-proof-band" aria-labelledby="verified-profile-proof-title">
              <div className="vd-proof-band__header">
                <div>
                  <span className="vd-proof-band__label">Cited answer sample</span>
                  <h2 id="verified-profile-proof-title">Sources and Draft proof</h2>
                </div>
                <a className="vd-text-link" href="/knowledge">
                  Open Sources <ArrowIcon />
                </a>
              </div>
              <div className="vd-workbench-grid">
                {FEATURED_UNSW_SECTION ? (
                  <ActiveEvidenceStory
                    section={FEATURED_UNSW_SECTION}
                    artifactIds={VERIFIED_DOSSIER_WORKBENCH.activeArtifactIds}
                    courseFolders={VERIFIED_DOSSIER_UNSW_COURSES}
                    draftRecords={recentDraftRecord ? [recentDraftRecord] : []}
                  />
                ) : null}
                <SourceGraph graph={VERIFIED_DOSSIER_WORKBENCH.sourceGraph} />
              </div>
              <ProvenanceChain steps={VERIFIED_DOSSIER_WORKBENCH.provenanceSteps} />
            </section>
          </section>

          <section className="vd-history" aria-label="Loom history">
            {VERIFIED_DOSSIER_HISTORY.map((item) => (
              <article key={item.title}>
                <p>{item.date}</p>
                <h2>{item.title}</h2>
                <p>{item.text}</p>
              </article>
            ))}
          </section>
        </section>
      </div>
    </main>
  );
}

function formatDraftRecordStatus(status: NewLoomDraftRecord['status']) {
  if (status === 'previewed') return 'Previewed';
  if (status === 'published') return 'Published';
  return 'Drafting';
}
