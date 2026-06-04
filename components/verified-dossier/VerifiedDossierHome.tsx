'use client';

import { useEffect, useState } from 'react';
import {
  VERIFIED_DOSSIER_AI_PROMPT,
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
import {
  loadReferenceCitationCandidates,
  type ReferenceCitationClientCandidate,
} from '../../lib/new-loom/reference-citation-client';
import {
  loadDraftAnswerPreview,
  NEW_LOOM_DRAFT_ANSWER_PREVIEW_KEY,
  type NewLoomDraftAnswerPreview,
} from '../../lib/new-loom/draft-answer-preview';
import {
  draftRecordDetailHref,
  loadLatestDraftRecord,
  NEW_LOOM_DRAFT_RECORDS_KEY,
  type NewLoomDraftRecord,
} from '../../lib/new-loom/draft-records';
import { AnswerInspector } from './AnswerInspector';
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
const HOMEPAGE_ACTIVITY_FALLBACK = 'Education: UNSW courses, Digital Me: cited answer';

function useReferenceCitationCandidates() {
  const [citationCandidates, setCitationCandidates] = useState<ReferenceCitationClientCandidate[]>([]);

  useEffect(() => {
    let cancelled = false;

    void loadReferenceCitationCandidates()
      .then((candidates) => {
        if (!cancelled) setCitationCandidates(candidates);
      })
      .catch(() => {
        if (!cancelled) setCitationCandidates([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return citationCandidates;
}

function useDraftAnswerPreview() {
  const [draftAnswerPreview, setDraftAnswerPreview] = useState<NewLoomDraftAnswerPreview | null>(null);

  useEffect(() => {
    setDraftAnswerPreview(loadDraftAnswerPreview());

    const handleStorage = (event: StorageEvent) => {
      if (event.key === NEW_LOOM_DRAFT_ANSWER_PREVIEW_KEY) {
        setDraftAnswerPreview(loadDraftAnswerPreview());
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return draftAnswerPreview;
}

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

export function VerifiedDossierHome({
  activitySummary,
  ready,
  hasRecent,
  onOpenSources,
  onOpenRecent,
}: VerifiedDossierHomeProps) {
  const citationCandidates = useReferenceCitationCandidates();
  const draftAnswerPreview = useDraftAnswerPreview();
  const recentDraftRecord = useLatestDraftRecord();
  const hasWorkflowDraft = Boolean(recentDraftRecord) || hasRecent;
  const citationRegistryShelfLabels = new Set(citationCandidates
    .map((candidate) => candidate.category ?? candidate.label ?? candidate.title)
    .filter((label): label is string => Boolean(label)));
  const citationRegistryLabels = Array.from(citationRegistryShelfLabels).slice(0, 3);

  return (
    <main className="vd-home" aria-labelledby="verified-dossier-title">
      <nav className="vd-nav" aria-label="Verified dossier navigation">
        <a className="vd-wordmark" href="/" aria-label="Loom home">
          Loom
        </a>
        <div className="vd-nav__links">
          {VERIFIED_DOSSIER_TOP_NAV.filter((item) => PRIMARY_NAV_LABELS.has(item.label)).map((item) => (
            <a key={item.label} className={item.label === 'Sources' ? 'is-active' : undefined} href={item.href}>
              {item.label}
            </a>
          ))}
        </div>
        <a className="vd-search vd-loom-intro-link" href="#loom-intro" aria-label="How this profile is built with Loom">
          <span>Built with Loom</span>
          <ArrowIcon />
        </a>
        <a className="vd-avatar" href="/about" aria-label="Open Yiping Yin profile">
          <img src={VERIFIED_DOSSIER_PROFILE.photoSrc} alt="Yiping Yin" draggable={false} />
        </a>
      </nav>

      <div className="vd-layout">
        <aside className="vd-identity" aria-label="Identity sidebar">
          <section className="vd-profile-card" aria-labelledby="verified-dossier-profile">
            <a className="vd-profile-photo" href="/about" aria-label="Open full profile">
              <img src={VERIFIED_DOSSIER_PROFILE.photoSrc} alt="Yiping Yin" draggable={false} />
            </a>
            <h2 id="verified-dossier-profile">Yiping Yin</h2>
            <p>{VERIFIED_DOSSIER_PROFILE.roles.join(' · ')}</p>
            <p>{VERIFIED_DOSSIER_PROFILE.location}</p>
            <nav className="vd-profile-links" aria-label="Profile links">
              {VERIFIED_DOSSIER_PROFILE.links.map((link) => (
                <a key={link.label} className="vd-profile-link" href={link.href}>
                  {link.label}
                </a>
              ))}
            </nav>
          </section>

          <section className="vd-memberships" aria-labelledby="verified-dossier-memberships">
            <h2 id="verified-dossier-memberships">Memberships</h2>
            <div className="vd-membership-list">
              {VERIFIED_DOSSIER_PROFILE.memberships.map((membership) => (
                <div key={membership.label} className="vd-membership-row">
                  <InstitutionMark kind={membership.kind} />
                  <span className="vd-membership-copy">
                    <strong>{membership.label}</strong>
                    <span>Connected shelf</span>
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="vd-workflow" aria-labelledby="verified-dossier-workflow">
            <h2 id="verified-dossier-workflow">Workflow</h2>
            <div className="vd-workflow-actions">
              <button className="vd-action-button vd-action-button--primary" type="button" onClick={onOpenSources}>
                <FolderIcon />
                <span>Open Sources</span>
                <ArrowIcon />
              </button>
              {recentDraftRecord ? (
                <a className="vd-action-button" href={draftRecordDetailHref(recentDraftRecord)}>
                  <DraftIcon />
                  <span className="vd-action-button__copy">
                    <strong>{recentDraftRecord.title}</strong>
                    <small>{formatDraftRecordStatus(recentDraftRecord.status)}</small>
                  </span>
                  <ArrowIcon />
                </a>
              ) : hasRecent ? (
                <button className="vd-action-button" type="button" onClick={onOpenRecent}>
                  <DraftIcon />
                  <span>Open recent Draft</span>
                  <ArrowIcon />
                </button>
              ) : (
                <button className="vd-action-button" type="button" disabled>
                  <DraftIcon />
                  <span>No recent Draft</span>
                </button>
              )}
            </div>
          </section>

          <section className="vd-activity" aria-label="Native activity">
            <h2>Activity</h2>
            <p>
              <span className="vd-status-dot" aria-hidden="true" />
              {ready ? activitySummary : HOMEPAGE_ACTIVITY_FALLBACK}
            </p>
            {!hasWorkflowDraft ? <span className="vd-activity__hint">Draft opens after a saved record.</span> : null}
          </section>
        </aside>

        <section className="vd-main" aria-label="Verified dossier">
          <section className="vd-evidence-hero" aria-labelledby="verified-dossier-title">
            <div className="vd-evidence-hero__header">
              <div>
                <p className="vd-section-kicker">Source-backed personal profile</p>
                <div className="vd-title-lockup">
                  <a className="vd-title-avatar" href="/about" aria-label="Open Yiping Yin profile">
                    <img src={VERIFIED_DOSSIER_PROFILE.photoSrc} alt="" draggable={false} />
                  </a>
                  <h1 id="verified-dossier-title" className="vd-title">
                    Yiping Yin
                  </h1>
                </div>
                <p className="vd-hero-summary">
                  About, education, experience, and Digital Me are backed by real sources, drafts, and cited outputs.
                </p>
              </div>
              <a className="vd-hero-link" href="/digital-me">
                Open Digital Me <ArrowIcon />
              </a>
            </div>

            <section className="vd-personal-categories" aria-label="Personal presentation sections">
              {VERIFIED_DOSSIER_PRESENTATION_CATEGORIES.map((category) => (
                <a key={category.id} className="vd-personal-category-card" href={category.href}>
                  <p>{category.proof}</p>
                  <h2>{category.label}</h2>
                  <p>{category.summary}</p>
                  <span>{category.capabilities.slice(0, 2).join(' / ')}</span>
                  <small>
                    {category.artifactIds
                      .map((artifactId) => resolveVerifiedDossierArtifact(artifactId).label)
                      .join(' / ')}
                  </small>
                </a>
              ))}
            </section>

            <section id="loom-intro" className="vd-loom-intro" aria-labelledby="loom-intro-title">
              <div>
                <p className="vd-section-kicker">Trust mechanism</p>
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
                <h2 id="verified-profile-proof-title">Sources and Draft proof</h2>
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

        <aside id="cited-answer" className="vd-inspector" aria-label="Cited answer">
          <AnswerInspector
            prompt={VERIFIED_DOSSIER_AI_PROMPT}
            citationRegistryCount={citationCandidates.length}
            citationRegistryLabels={citationRegistryLabels}
            draftAnswerPreview={draftAnswerPreview}
            draftRecord={recentDraftRecord}
          />
        </aside>
      </div>
    </main>
  );
}

function formatDraftRecordStatus(status: NewLoomDraftRecord['status']) {
  if (status === 'previewed') return 'Previewed';
  if (status === 'published') return 'Published';
  return 'Drafting';
}
