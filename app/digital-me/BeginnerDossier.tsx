'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { BeginnerProfile } from '../../lib/profile/beginner-profile';
import type { BeginnerCapability } from '../../lib/capability/capability-graph';
import { buildCapabilities } from '../../lib/capability/derive-capabilities';
import { readBeginnerProfileLocal, writeBeginnerProfileLocal } from '../../lib/profile/profile-storage';
import { LandingNav } from '../LandingNav';
import { CapabilityMap } from '../../components/CapabilityMap';
import { BeginnerProofSection } from './BeginnerProofSection';

/**
 * BeginnerDossier — the new-user Digital Me, presented as the SAME premium
 * "ledger cover" dossier as /example (VerifiedDossierHome): a two-column shell
 * (identity rail + numbered "Verified source" evidence ledger), reusing the
 * `.lcv` styles in globals.css so a stranger's result reads as the quality bar,
 * not a plainer app page.
 *
 * Unlike the owner showcase, the cover assets are driven by the user's own
 * BeginnerProfile (CV artifact, education, experience, derived capabilities), and
 * the rail carries the live editing affordances (Keep building / Add proof) since
 * this is the person's editable surface, not a read-only showcase.
 */

const NUM: Record<string, string> = { about: '01', education: '02', experience: '03', 'digital-me': '04' };

function Verified({ label }: { label: string }) {
  return (
    <span className="lcv-verified">
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
        <circle cx="12" cy="12" r="9" />
        <path d="M8.5 12.5l2.4 2.4 4.6-5" />
      </svg>
      {label}
    </span>
  );
}

export function BeginnerDossier({ profile }: { profile: BeginnerProfile }) {
  const [caps, setCaps] = useState<BeginnerCapability[]>(profile.capabilities ?? []);
  const autoBuilt = useRef(false);

  // Auto-derive the capability map once if none persisted (mirrors BeginnerDigitalMe).
  useEffect(() => {
    if (autoBuilt.current || caps.length > 0) return;
    autoBuilt.current = true;
    void (async () => {
      const current = readBeginnerProfileLocal() ?? profile;
      const derived = await buildCapabilities(current);
      setCaps(derived);
      writeBeginnerProfileLocal({ ...current, capabilities: derived });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const name = profile.home.name || 'Your name';
  const roles = profile.home.headline;
  const links = profile.about.links ?? [];
  const mission = profile.about.summary;
  const artifacts = profile.artifacts ?? [];
  const hasCv = artifacts.length > 0;
  const hasEducation = profile.education.length > 0;
  const hasExperience = profile.experience.length > 0;
  const hasBackedCaps = caps.some((c) => c.evidence.length > 0);

  // initials for the identity mark (no owner photo for a stranger)
  const initials = useMemo(
    () => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join(''),
    [name],
  );

  return (
    <main className="vd-home lcv" aria-labelledby="dossier-title">
      <div className="loom-cosmic-field" aria-hidden="true" />
      <LandingNav />

      <div className="lcv-shell">
        <aside className="lcv-rail" aria-label="Personal identity">
          <span className="lcv-mark" aria-hidden="true">{initials}</span>
          <h1 id="dossier-title" className="lcv-name lcv-serif">
            {name}
          </h1>
          {roles && <p className="lcv-role">{roles}</p>}

          <hr className="lcv-rule" />

          {links.length > 0 && (
            <>
              <nav className="lcv-links" aria-label="Profile links">
                {links.map((link) => (
                  <a key={link.label} href={link.href} target="_blank" rel="noreferrer">
                    {link.label}
                  </a>
                ))}
              </nav>
              <hr className="lcv-rule" />
            </>
          )}

          {mission && (
            <>
              <blockquote className="lcv-quote">
                <span className="lcv-quote__mark lcv-serif" aria-hidden="true">&ldquo;</span>
                <p>{mission}</p>
              </blockquote>
              <hr className="lcv-rule" />
            </>
          )}

          {/* Live editing entry points — this is the person's own editable surface. */}
          <div className="lcv-rail__actions">
            {!hasCv && (
              <a className="lcv-rail__cta lcv-rail__cta--primary" href="#dossier-proof">
                Add proof
              </a>
            )}
            <a className="lcv-rail__cta" href="/onboarding/profile/form">
              Keep building
            </a>
          </div>
        </aside>

        <div className="lcv-ledger">
          {/* 01 About */}
          <section className="lcv-row lcv-row--about" aria-label="About">
            <div className="lcv-row__head">
              <span className="lcv-row__num">{NUM.about}</span>
              <h2 className="lcv-row__title lcv-serif">About</h2>
              <p className="lcv-row__desc">{mission ? 'CV and identity.' : 'Add a CV to verify your identity.'}</p>
              {hasCv ? <Verified label="Verified source" /> : null}
            </div>
            <div className="lcv-row__asset">
              <div className="lcv-panel lcv-about">
                <div className="lcv-cv">
                  <div className="lcv-cv__sheet">
                    <span className="lcv-cv__kicker">CURRICULUM VITAE</span>
                    <span className="lcv-cv__name">{name.toUpperCase()}</span>
                    <span className="lcv-cv__line lcv-cv__line--s" />
                    <div className="lcv-cv__cols">
                      <div>
                        <span className="lcv-cv__line" />
                        <span className="lcv-cv__line lcv-cv__line--s" />
                        <span className="lcv-cv__line" />
                      </div>
                      <div>
                        <span className="lcv-cv__line" />
                        <span className="lcv-cv__line lcv-cv__line--s" />
                        <span className="lcv-cv__line" />
                      </div>
                    </div>
                    <span className="lcv-cv__line" />
                    <span className="lcv-cv__line lcv-cv__line--s" />
                  </div>
                </div>
                <div className="lcv-about__meta">
                  <span className="lcv-about__doc" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M6 2h8l4 4v16H6z" />
                      <path d="M14 2v4h4" />
                    </svg>
                  </span>
                  <b>
                    CV / Résumé
                    <br />
                    {hasCv ? '(Verified)' : '(Not added)'}
                  </b>
                  <small>{hasCv ? `${artifacts.length} document${artifacts.length === 1 ? '' : 's'}` : 'Add a CV below'}</small>
                </div>
              </div>
            </div>
          </section>

          {/* 02 Education */}
          <section className="lcv-row lcv-row--education" aria-label="Education">
            <div className="lcv-row__head">
              <span className="lcv-row__num">{NUM.education}</span>
              <h2 className="lcv-row__title lcv-serif">Education</h2>
              <p className="lcv-row__desc">Coursework and credentials.</p>
              {hasEducation ? <Verified label={`${profile.education.length} entr${profile.education.length === 1 ? 'y' : 'ies'}`} /> : null}
            </div>
            <div className="lcv-row__asset">
              <div className="lcv-panel lcv-edu">
                <div className="lcv-edu__chips">
                  {profile.education.slice(0, 3).map((e, i) => (
                    <div key={i}>
                      <span className="lcv-edu__code">{e.qualification || 'Degree'}</span>
                      <span className="lcv-edu__title">{e.institution}</span>
                    </div>
                  ))}
                  {profile.education.length === 0 && (
                    <div className="lcv-edu__more"><span>No education yet</span></div>
                  )}
                  {profile.education.length > 3 && (
                    <div className="lcv-edu__more"><span>+ {profile.education.length - 3} more</span></div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* 03 Experience */}
          <section className="lcv-row lcv-row--experience" aria-label="Experience">
            <div className="lcv-row__head">
              <span className="lcv-row__num">{NUM.experience}</span>
              <h2 className="lcv-row__title lcv-serif">Experience</h2>
              <p className="lcv-row__desc">Work and project proof.</p>
              {hasExperience ? <Verified label={`${profile.experience.length} entr${profile.experience.length === 1 ? 'y' : 'ies'}`} /> : null}
            </div>
            <div className="lcv-row__asset">
              <div className="lcv-exp">
                {profile.experience.slice(0, 2).map((x, i) => (
                  <article className="lcv-exp__card" key={i}>
                    <h3>{x.role}</h3>
                    <p>{x.organization}</p>
                    <footer className="lcv-exp__foot">
                      <Verified label="From your CV" />
                    </footer>
                  </article>
                ))}
                {profile.experience.length === 0 && (
                  <article className="lcv-exp__card">
                    <h3>No experience yet</h3>
                    <p>Add your work history.</p>
                  </article>
                )}
              </div>
            </div>
          </section>

          {/* 04 Digital Me — the capability light-curtain is the signature cover. */}
          <section className="lcv-row lcv-row--digital-me" aria-label="Digital Me" id="dossier-capabilities">
            <div className="lcv-row__head">
              <span className="lcv-row__num">{NUM['digital-me']}</span>
              <h2 className="lcv-row__title lcv-serif">Digital Me</h2>
              <p className="lcv-row__desc">What you can do — backed by proof.</p>
              {hasBackedCaps ? <Verified label="Backed by sources" /> : null}
            </div>
            <div className="lcv-row__asset lcv-row__asset--dm">
              <CapabilityMap capabilities={caps} profile={profile} />
            </div>
          </section>
        </div>
      </div>

      {/* Proof upload — the person's own surface needs the live editing affordance. */}
      <div id="dossier-proof" className="lcv-proofmount">
        <BeginnerProofSection initialArtifacts={artifacts} />
      </div>

      <footer className="lcv-foot">
        <span>LOOM — PERSONAL KNOWLEDGE, BACKED BY REAL SOURCES.</span>
      </footer>
    </main>
  );
}
