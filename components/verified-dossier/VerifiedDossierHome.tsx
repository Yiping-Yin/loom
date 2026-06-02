'use client';

import {
  VERIFIED_DOSSIER_AI_PROMPT,
  VERIFIED_DOSSIER_HISTORY,
  VERIFIED_DOSSIER_HOME_COPY,
  VERIFIED_DOSSIER_PROFILE,
  VERIFIED_DOSSIER_SECTIONS,
  VERIFIED_DOSSIER_TOP_NAV,
  resolveVerifiedDossierArtifact,
  type VerifiedDossierArtifactId,
} from '../../lib/new-loom/verified-dossier-home';
import { FileBadge } from './FileBadge';
import { InstitutionMark } from './InstitutionMark';

export type VerifiedDossierHomeProps = {
  activitySummary: string;
  ready: boolean;
  hasRecent: boolean;
  onOpenSources: () => void;
  onOpenRecent: () => void;
};

const FEATURED_UNSW_ARTIFACTS: VerifiedDossierArtifactId[] = [
  'econ-ps2',
  'econ-slides',
  'econ-tutorial',
  'econ-notes',
];

const FEATURED_UNSW_SECTION = VERIFIED_DOSSIER_SECTIONS.find((section) => section.id === 'unsw');

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
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

export function VerifiedDossierHome({
  activitySummary,
  ready,
  hasRecent,
  onOpenSources,
  onOpenRecent,
}: VerifiedDossierHomeProps) {
  return (
    <main className="vd-home" aria-labelledby="verified-dossier-title">
      <nav className="vd-nav" aria-label="Verified dossier navigation">
        <a className="vd-wordmark" href="/" aria-label="Loom home">
          Loom
        </a>
        <div className="vd-nav__links">
          {VERIFIED_DOSSIER_TOP_NAV.map((item) => (
            <a key={item.label} href={item.href}>
              {item.label}
            </a>
          ))}
        </div>
        <label className="vd-search">
          <SearchIcon />
          <input type="search" placeholder="Search this profile" aria-label="Search this profile" />
        </label>
        <a className="vd-avatar" href="/about" aria-label="Open Yiping Yin profile">
          <img src={VERIFIED_DOSSIER_PROFILE.photoSrc} alt="Yiping Yin" draggable={false} />
        </a>
      </nav>

      <div className="vd-layout">
        <aside className="vd-identity" aria-label="Identity sidebar">
          <a className="vd-profile-photo" href="/about" aria-label="Open full profile">
            <img src={VERIFIED_DOSSIER_PROFILE.photoSrc} alt="Yiping Yin" draggable={false} />
          </a>
          <section aria-labelledby="verified-dossier-profile">
            <h2 id="verified-dossier-profile">Yiping Yin</h2>
            <p>{VERIFIED_DOSSIER_PROFILE.roles.join(' / ')}</p>
            <p>{VERIFIED_DOSSIER_PROFILE.location}</p>
          </section>

          <section aria-label="Profile links">
            {VERIFIED_DOSSIER_PROFILE.links.map((link) => (
              <a key={link.label} className="vd-profile-link" href={link.href}>
                {link.label}
              </a>
            ))}
          </section>

          <section aria-labelledby="verified-dossier-memberships">
            <h2 id="verified-dossier-memberships">Verified memberships</h2>
            <div className="vd-section-lanes">
              {VERIFIED_DOSSIER_PROFILE.memberships.map((membership) => (
                <div key={membership.label} className="vd-section-row">
                  <InstitutionMark kind={membership.kind} />
                  <strong>{membership.label}</strong>
                  <span>Evidence shelf connected to this profile.</span>
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="verified-dossier-workflow">
            <h2 id="verified-dossier-workflow">Workflow</h2>
            <p>
              <strong>Sources</strong> hold the evidence. <strong>Draft</strong> turns that evidence into
              working output.
            </p>
            <button type="button" onClick={onOpenSources}>
              Open Sources <ArrowIcon />
            </button>
            <button type="button" onClick={onOpenRecent} disabled={!hasRecent}>
              Open recent Draft <ArrowIcon />
            </button>
          </section>

          <section aria-label="Native activity">
            <h2>Activity</h2>
            <p>{ready ? activitySummary : 'Sources and Draft ready'}</p>
          </section>
        </aside>

        <section className="vd-main" aria-label="Verified dossier">
          <p>{VERIFIED_DOSSIER_HOME_COPY.chineseHeadline}</p>
          <h1 id="verified-dossier-title" className="vd-title">
            {VERIFIED_DOSSIER_HOME_COPY.headline}
          </h1>
          <p className="vd-subtitle">{VERIFIED_DOSSIER_HOME_COPY.body}</p>
          <p className="vd-subtitle">{VERIFIED_DOSSIER_HOME_COPY.chineseBody}</p>

          <section className="vd-featured-story" aria-labelledby="featured-unsw-title">
            <div>
              <InstitutionMark kind="unsw" />
              <h2 id="featured-unsw-title">Featured UNSW / ECON3202 evidence</h2>
              <p>
                A course story anchored in source files, notes, tutorial solutions, and problem-set
                work.
              </p>
            </div>
            <div className="vd-artifact-stage">
              <div className="vd-file-stack" aria-label="Featured artifacts">
                {FEATURED_UNSW_ARTIFACTS.map((artifactId) => {
                  const artifact = resolveVerifiedDossierArtifact(artifactId);
                  return (
                    <a key={artifact.id} className="vd-text-link" href={artifact.href}>
                      <FileBadge kind={artifact.kind} label={artifact.label} />
                    </a>
                  );
                })}
              </div>
              <div className="vd-inspector-card">
                <h2>Sources to Draft to Answer</h2>
                <p>
                  Course files become a draft trail and then a cited answer people can inspect.
                </p>
                {FEATURED_UNSW_SECTION ? (
                  <a className="vd-text-link" href={FEATURED_UNSW_SECTION.href}>
                    Open UNSW evidence <ArrowIcon />
                  </a>
                ) : null}
              </div>
            </div>
          </section>

          <section aria-labelledby="evidence-lanes-title">
            <h2 id="evidence-lanes-title">Evidence lanes</h2>
            <div className="vd-section-lanes">
              {VERIFIED_DOSSIER_SECTIONS.map((section) => (
                <a key={section.id} className="vd-section-row" href={section.href}>
                  <InstitutionMark kind={section.id} />
                  <span>
                    <strong>{section.label}</strong>
                    <br />
                    {section.status}
                  </span>
                  <span>
                    {section.summary}
                    <br />
                    {section.artifactIds.map((artifactId) => {
                      const artifact = resolveVerifiedDossierArtifact(artifactId);
                      return (
                        <FileBadge
                          key={artifact.id}
                          kind={artifact.kind}
                          label={artifact.label}
                          compact
                        />
                      );
                    })}
                  </span>
                </a>
              ))}
            </div>
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

        <aside id="ask-this-profile" className="vd-inspector" aria-labelledby="ask-profile-title">
          <section className="vd-inspector-card">
            <h2 id="ask-profile-title">Ask this profile</h2>
            <p>{VERIFIED_DOSSIER_AI_PROMPT.question}</p>
            <p>{VERIFIED_DOSSIER_AI_PROMPT.answer}</p>
            <div className="vd-citation-list" aria-label="Cited artifacts">
              {VERIFIED_DOSSIER_AI_PROMPT.citations.map((artifactId) => {
                const artifact = resolveVerifiedDossierArtifact(artifactId);
                return (
                  <a key={artifact.id} className="vd-text-link" href={artifact.href}>
                    <FileBadge kind={artifact.kind} label={artifact.label} compact />
                  </a>
                );
              })}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
