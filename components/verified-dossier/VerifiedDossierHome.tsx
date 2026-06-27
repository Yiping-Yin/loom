import {
  VERIFIED_DOSSIER_EXPERIENCE_ENTRIES,
  VERIFIED_DOSSIER_PRESENTATION_CATEGORIES,
  VERIFIED_DOSSIER_PROFILE,
  VERIFIED_DOSSIER_UNSW_COURSES,
  VERIFIED_DOSSIER_WORKBENCH,
} from '../../lib/new-loom/verified-dossier-home';
import type {
  VerifiedDossierPresentationCategory,
  VerifiedDossierProfileLink,
} from '../../lib/new-loom/verified-dossier-home';
import { LoomGlobalNav } from './LoomGlobalNav';

// Home v12: ledger cover. Two-column dossier — identity rail + numbered
// evidence ledger. All styles are namespaced under `.lcv` in globals.css so
// they are fully isolated from the retired `.vd-*cover*` sediment.

const CATEGORY_NUMBER: Record<VerifiedDossierPresentationCategory['id'], string> = {
  about: '01',
  education: '02',
  experience: '03',
  'digital-me': '04',
};

const category = (id: VerifiedDossierPresentationCategory['id']) =>
  VERIFIED_DOSSIER_PRESENTATION_CATEGORIES.find((c) => c.id === id)!;

const HERO_COURSE_TITLES: Record<string, string> = {
  'ECON 3202': 'Mathematical Economics',
  'MATH 2991': 'Data and Algorithms in Trading',
  'FINS 3666': 'Trading & Market Making',
};

function ProfileLinkIcon({ label }: { label: VerifiedDossierProfileLink['label'] }) {
  if (label === 'LinkedIn') {
    return (
      <svg className="lcv-link-icon lcv-link-icon--linkedin" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4.98 3.5a2.5 2.5 0 11-.02 5 2.5 2.5 0 01.02-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21H20v-5.4c0-1.3 0-2.95-1.8-2.95s-2.08 1.4-2.08 2.85V21H12z" />
      </svg>
    );
  }
  if (label === 'GitHub') {
    return (
      <svg className="lcv-link-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2.3a9.7 9.7 0 00-3.07 18.9c.49.09.66-.21.66-.47v-1.8c-2.7.59-3.27-1.15-3.27-1.15-.44-1.12-1.08-1.42-1.08-1.42-.88-.6.07-.59.07-.59.97.07 1.48 1 1.48 1 .87 1.48 2.28 1.05 2.84.8.09-.63.34-1.05.62-1.29-2.16-.25-4.43-1.08-4.43-4.8 0-1.06.38-1.93 1-2.61-.1-.25-.43-1.24.1-2.58 0 0 .81-.26 2.67 1a9.3 9.3 0 014.86 0c1.85-1.26 2.67-1 2.67-1 .53 1.34.2 2.33.1 2.58.62.68 1 1.55 1 2.61 0 3.73-2.27 4.55-4.44 4.79.35.31.66.9.66 1.82v2.7c0 .26.17.56.67.47A9.7 9.7 0 0012 2.3z" />
      </svg>
    );
  }
  return (
    <svg className="lcv-link-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.5 2.5 16 0 18M12 3c-2.5 2.5-2.5 16 0 18" />
    </svg>
  );
}

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

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function CoverAsset({ category: cat }: { category: VerifiedDossierPresentationCategory }) {
  // About — CV document mock + verified file meta.
  if (cat.id === 'about') {
    return (
      <div className="lcv-panel lcv-about">
        <div className="lcv-cv">
          <div className="lcv-cv__sheet">
            <span className="lcv-cv__kicker">CURRICULUM VITAE</span>
            <span className="lcv-cv__name">YIPING YIN</span>
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
            (Verified)
          </b>
          <small>
            Updated
            <br />
            2026-05-20
            <br />
            PDF · 1.2 MB
          </small>
        </div>
      </div>
    );
  }

  // Education — institution logo strip + hero course chips.
  if (cat.id === 'education') {
    const heroCourses = ['ECON 3202', 'MATH 2991', 'FINS 3666']
      .map((code) => VERIFIED_DOSSIER_UNSW_COURSES.find((c) => c.code === code))
      .filter(Boolean) as (typeof VERIFIED_DOSSIER_UNSW_COURSES)[number][];
    const remaining = VERIFIED_DOSSIER_UNSW_COURSES.length - heroCourses.length;
    return (
      <div className="lcv-panel lcv-edu">
        {/* one composition pattern across all four cells: a single centered
            contained logo (no 3+1 wordmark split), equal optical footprint */}
        <div className="lcv-edu__logos">
          <span>
            <img src="/brand/unsw/unsw-crest.png" alt="" draggable={false} />
          </span>
          <span>
            <img src="/brand/wqu/wqu-logo.svg" alt="" draggable={false} />
          </span>
          <span>
            <img className="lcv-edu__wide" src="/brand/quantnet/quantnet-logo.png" alt="" draggable={false} />
          </span>
          <span>
            <img src="/brand/claude/claude-icon.png" alt="" draggable={false} />
          </span>
        </div>
        <div className="lcv-edu__chips">
          {heroCourses.map((course) => (
            <div key={course.id}>
              <span className="lcv-edu__code">{course.code}</span>
              <span className="lcv-edu__title">{HERO_COURSE_TITLES[course.code] ?? course.code}</span>
            </div>
          ))}
          <div className="lcv-edu__more">
            <span>+ {remaining} more courses</span>
          </div>
        </div>
      </div>
    );
  }

  // Experience — two CV-backed work/program cards.
  if (cat.id === 'experience') {
    const optiver = VERIFIED_DOSSIER_EXPERIENCE_ENTRIES.find((e) => e.id === 'optiver-unsw-trading-academy')!;
    const unsw = VERIFIED_DOSSIER_EXPERIENCE_ENTRIES.find((e) => e.id === 'unsw-research-assistant')!;
    return (
      <div className="lcv-exp">
        <article className="lcv-exp__card">
          <header className="lcv-exp__head">
            <span className="lcv-serif lcv-exp__optiver">Optiver</span>
            <span className="lcv-exp__tri" aria-hidden="true">▲</span>
          </header>
          <h3>{optiver.role}</h3>
          <p>{optiver.organisation} · Trading &amp; Technology</p>
          <footer className="lcv-exp__foot">
            <Verified label="Verified source" />
            <span className="lcv-exp__ext" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M7 17L17 7M9 7h8v8" />
              </svg>
            </span>
          </footer>
        </article>
        <article className="lcv-exp__card">
          <header className="lcv-exp__head">
            <img className="lcv-exp__crest" src="/brand/unsw/unsw-crest.png" alt="" draggable={false} />
            <span className="lcv-serif lcv-exp__unsw">
              UNSW<small>SYDNEY</small>
            </span>
          </header>
          <h3>{unsw.role}</h3>
          <p>Quantitative Finance</p>
          <footer className="lcv-exp__foot">
            <Verified label="Verified source" />
            <span className="lcv-exp__ext" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M7 17L17 7M9 7h8v8" />
              </svg>
            </span>
          </footer>
        </article>
      </div>
    );
  }

  // Digital Me — Sources → Studio → Digital Me flow + reasoning artifact.
  const steps = VERIFIED_DOSSIER_WORKBENCH.provenanceSteps;
  return (
    <div className="lcv-panel lcv-dm">
      <p className="lcv-dm__q">How does concavity connect to optimisation in ECON3202?</p>
      <div className="lcv-dm__flow">
        {steps.map((step, i) => (
          <div className="lcv-dm__flowitem" key={step.title}>
            <span className="lcv-dm__step">
              {step.title === 'Sources' && (
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="6" cy="6" r="2.4" />
                  <circle cx="18" cy="6" r="2.4" />
                  <circle cx="12" cy="18" r="2.4" />
                  <path d="M7.6 7.6l3 8M16.4 7.6l-3 8" />
                </svg>
              )}
              {step.title === 'Studio' && (
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M5 4h10l4 4v12H5z" />
                  <path d="M9 12h6M9 16h6" />
                </svg>
              )}
              {step.title === 'Digital Me' && (
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M8.5 12.5l2.4 2.4 4.6-5" />
                </svg>
              )}
              {step.title}
            </span>
            {i < steps.length - 1 ? <span className="lcv-dm__arrow" aria-hidden="true" /> : null}
          </div>
        ))}
      </div>
      <div className="lcv-dm__body">
        <div className="lcv-dm__srcs" aria-hidden="true">
          <span className="lcv-dm__src" />
          <span className="lcv-dm__src" />
          <span className="lcv-dm__more">+2 more</span>
        </div>
        <table className="lcv-dm__table">
          <tbody>
            <tr>
              <th>Concept</th>
              <th>Notes</th>
              <th>Example</th>
            </tr>
            <tr>
              <td>Concavity</td>
              <td className="lcv-dm__f">f&apos;&apos;(x) ≤ 0</td>
              <td>
                <svg className="lcv-dm__spark" viewBox="0 0 34 12" aria-hidden="true">
                  <defs>
                    <linearGradient id="lcv-dm-spark-concavity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#4BC5DE" stopOpacity="0.28" />
                      <stop offset="1" stopColor="#4BC5DE" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path className="lcv-dm__spark-area" d="M1 10C8 9 12 2 17 2s9 7 16 6 L33 12 L1 12 Z" fill="url(#lcv-dm-spark-concavity)" stroke="none" />
                  <path d="M1 10C8 9 12 2 17 2s9 7 16 6" fill="none" />
                </svg>
              </td>
            </tr>
            <tr>
              <td>
                First-order
                <br />
                condition
              </td>
              <td className="lcv-dm__f">f&apos;(x) = 0</td>
              <td>
                <svg className="lcv-dm__spark" viewBox="0 0 34 12" aria-hidden="true">
                  <defs>
                    <linearGradient id="lcv-dm-spark-foc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#4BC5DE" stopOpacity="0.28" />
                      <stop offset="1" stopColor="#4BC5DE" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path className="lcv-dm__spark-area" d="M1 6h32 L33 12 L1 12 Z" fill="url(#lcv-dm-spark-foc)" stroke="none" />
                  <path d="M1 6h14M19 6h14" fill="none" />
                  <circle cx="17" cy="6" r="1.6" />
                </svg>
              </td>
            </tr>
            <tr className="lcv-dm__table-more">
              <td colSpan={3}>+4 more concepts</td>
            </tr>
          </tbody>
        </table>
        <div className="lcv-dm__graph">
          <span className="lcv-dm__graphlbl">Concave f(x)</span>
          <svg viewBox="0 0 150 90" aria-hidden="true" preserveAspectRatio="none">
            <defs>
              <linearGradient id="lcv-dm-graph-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#4BC5DE" stopOpacity="0.28" />
                <stop offset="1" stopColor="#4BC5DE" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path className="lcv-dm__axes" d="M16 78 V8 M16 78 H140" fill="none" />
            {/* cyan area fill: follows the concave curve, closed down to the baseline */}
            <path className="lcv-dm__area" d="M20 70 Q72 6 132 60 L132 78 L20 78 Z" fill="url(#lcv-dm-graph-fill)" stroke="none" />
            <path className="lcv-dm__curve" d="M20 70 Q72 6 132 60" fill="none" />
            <circle className="lcv-dm__peak" cx="74" cy="22" r="3" />
            <path className="lcv-dm__drop" d="M74 22 V78" fill="none" strokeDasharray="3 3" />
            <text x="70" y="88">x*</text>
            <text x="134" y="74">x</text>
          </svg>
        </div>
      </div>
    </div>
  );
}

function LedgerRow({
  category: cat,
  verifiedLabel,
}: {
  category: VerifiedDossierPresentationCategory;
  verifiedLabel: string;
}) {
  return (
    <a className={`lcv-row lcv-row--${cat.id}`} href={cat.href} aria-label={cat.label}>
      <div className="lcv-row__head">
        <span className="lcv-row__num">{CATEGORY_NUMBER[cat.id]}</span>
        <h2 className="lcv-row__title lcv-serif">{cat.label}</h2>
        <p className="lcv-row__desc">{cat.summary}</p>
        <Verified label={verifiedLabel} />
        <span className="lcv-row__open">
          Open
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>
      </div>
      <div className="lcv-row__asset">
        <CoverAsset category={cat} />
      </div>
    </a>
  );
}

export function VerifiedDossierHome() {
  const about = category('about');
  const education = category('education');
  const experience = category('experience');
  const digitalMe = category('digital-me');

  return (
    <main className="vd-home lcv" aria-labelledby="verified-dossier-title">
      <LoomGlobalNav activeHref="/" ariaLabel="Verified dossier navigation" />

      <div className="lcv-shell">
        <aside className="lcv-rail" aria-label="Personal identity">
          <img
            className="lcv-photo"
            src={VERIFIED_DOSSIER_PROFILE.photoSrc}
            alt=""
            aria-hidden="true"
            draggable={false}
          />
          <h1 id="verified-dossier-title" className="lcv-name lcv-serif">
            {VERIFIED_DOSSIER_PROFILE.name}
          </h1>
          <p className="lcv-loc">{VERIFIED_DOSSIER_PROFILE.location}</p>
          <p className="lcv-role">{VERIFIED_DOSSIER_PROFILE.roles.join('  |  ')}</p>

          <hr className="lcv-rule" />

          <nav className="lcv-links" aria-label="Profile links">
            {VERIFIED_DOSSIER_PROFILE.links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                aria-current={link.href === '/' ? 'page' : undefined}
              >
                <ProfileLinkIcon label={link.label} />
                {link.label}
              </a>
            ))}
          </nav>

          <hr className="lcv-rule" />

          <blockquote className="lcv-quote">
            <span className="lcv-quote__mark lcv-serif" aria-hidden="true">
              &ldquo;
            </span>
            <p>Turning scattered knowledge into verifiable insight and compounding advantage.</p>
          </blockquote>

          <hr className="lcv-rule" />

          <ul className="lcv-members" aria-label="Memberships">
            {VERIFIED_DOSSIER_PROFILE.memberships.map((membership) => (
              <li key={membership.label} className={`lcv-members__item lcv-members__item--${membership.kind}`}>
                <span className="lcv-members__dot" aria-hidden="true" />
                {membership.label}
              </li>
            ))}
          </ul>
          <p className="lcv-member">MEMBER SINCE APRIL 2024</p>
        </aside>

        <div className="lcv-ledger">
          <LedgerRow category={about} verifiedLabel="Verified source" />
          <LedgerRow category={education} verifiedLabel="Verified sources" />
          <LedgerRow category={experience} verifiedLabel="Verified sources" />
          <LedgerRow category={digitalMe} verifiedLabel="Verified sources" />
        </div>
      </div>

      <footer className="lcv-foot">
        <span>LOOM — PERSONAL KNOWLEDGE, BACKED BY REAL SOURCES.</span>
        <a className="lcv-foot__all" href="/sources">
          VIEW ALL SOURCES
          <Arrow />
        </a>
      </footer>
    </main>
  );
}
