'use client';

import {
  PERSONAL_PLATFORM_NARRATIVE_LAYERS,
  PERSONAL_PLATFORM_PRODUCT_THESIS,
  PERSONAL_PLATFORM_REFERENCE_INSTANCE,
  PERSONAL_PLATFORM_STACK,
} from '../../lib/new-loom/personal-platform';
import {
  VERIFIED_DOSSIER_HISTORY,
  VERIFIED_DOSSIER_PROFILE,
  VERIFIED_DOSSIER_SECTIONS,
  VERIFIED_DOSSIER_TOP_NAV,
  resolveVerifiedDossierArtifact,
  type VerifiedDossierArtifactId,
} from '../../lib/new-loom/verified-dossier-home';
import { ArtifactCitationCard, DocumentPreviewCard } from '../../components/verified-dossier/DocumentPreviewCard';
import { FileBadge } from '../../components/verified-dossier/FileBadge';
import { InstitutionMark } from '../../components/verified-dossier/InstitutionMark';
import styles from './AboutClient.module.css';

const PROFILE_ARTIFACTS: VerifiedDossierArtifactId[] = [
  'about-doc',
  'econ-ps2',
  'quantnet-cpp-course',
  'wqu-index',
];

const CITED_PROFILE_SOURCES: VerifiedDossierArtifactId[] = [
  'about-doc',
  'econ-slides',
  'claude-certificate',
];

const COMMITMENTS = [
  {
    title: 'Source is sacred.',
    text: 'The source file stays visible as the first object. Loom does not ask people to trust a claim without the material behind it.',
  },
  {
    title: 'Draft is earned.',
    text: 'Draft is working judgment. It appears after sources, notes, decisions, and revisions have enough structure to become useful output.',
  },
  {
    title: 'Relations are evidenced.',
    text: 'A relation between shelves has to show why two pieces of work belong together, not only that a link exists.',
  },
  {
    title: 'Conversation is grounded.',
    text: 'The personal AI layer should answer from the person\'s real archive, not from a detached prompt.',
  },
];

const IDENTITY_FACTS = [
  ['Current base', VERIFIED_DOSSIER_PROFILE.location],
  ['Public role', VERIFIED_DOSSIER_PROFILE.roles.join(' / ')],
  ['First proof shelf', 'UNSW'],
  ['Product direction', 'Personal knowledge identity'],
];

const LOOM_NAME = [
  {
    label: 'LO',
    title: 'Human logic',
    text: 'The person keeps judgment: framing questions, choosing standards, deciding what matters, and knowing when something is worth keeping.',
  },
  {
    label: 'OM',
    title: 'AI reach',
    text: 'The machine widens recall, adjacency, synthesis, and pattern visibility at a scale one person cannot manually hold.',
  },
  {
    label: 'LOOM',
    title: 'A structure for identity',
    text: 'The name points to weaving scattered material into one inspectable surface: source, process, output, and conversation.',
  },
];

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

export default function AboutClient() {
  return (
    <main className={`vd-home ${styles.page}`} aria-labelledby="about-title">
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

      <section className={styles.hero}>
        <aside className={styles.profilePanel} aria-label="Profile postcard">
          <img
            className={styles.profilePhoto}
            src={VERIFIED_DOSSIER_PROFILE.photoSrc}
            alt="Yiping Yin"
            draggable={false}
          />
          <div>
            <h1 id="about-title" className={styles.profileName}>
              {VERIFIED_DOSSIER_PROFILE.name}
            </h1>
            <p className={styles.profileRole}>{VERIFIED_DOSSIER_PROFILE.roles.join(' / ')}</p>
            <p className={styles.profileLocation}>{VERIFIED_DOSSIER_PROFILE.location}</p>
          </div>
          <div className={styles.profileLinks} aria-label="Profile links">
            {VERIFIED_DOSSIER_PROFILE.links.map((link) => (
              <a key={link.label} href={link.href}>
                {link.label}
                <ArrowIcon />
              </a>
            ))}
          </div>
          <div className={styles.memberships} aria-label="Verified memberships">
            {VERIFIED_DOSSIER_PROFILE.memberships.map((membership) => (
              <div key={membership.label} className={styles.membershipRow}>
                <InstitutionMark kind={membership.kind} />
                <span>{membership.label}</span>
              </div>
            ))}
          </div>
        </aside>

        <div className={styles.heroCopy}>
          <p className={styles.sectionLabel}>Personal knowledge postcard</p>
          <h2>A profile built from sources, work, process, and AI conversations.</h2>
          <p>
            Loom starts here: a public identity that can be inspected and talked to. Learning paths,
            projects, process records, drafts, and conversations are connected to the evidence that
            made them credible.
          </p>
          <p>{PERSONAL_PLATFORM_PRODUCT_THESIS}</p>
          <dl className={styles.factGrid}>
            {IDENTITY_FACTS.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className={styles.evidenceSection} aria-labelledby="about-evidence-title">
        <div className={styles.sectionHeader}>
          <p className={styles.sectionLabel}>Evidence profile</p>
          <h2 id="about-evidence-title">Proof before biography.</h2>
          <p>
            The About page is not only a written self-description. It is a structured record that
            connects identity to sources, portfolio evidence, knowledge shelves, and grounded AI.
          </p>
        </div>

        <div className={styles.evidenceGrid}>
          <div className={`vd-document-grid ${styles.artifactGrid}`} aria-label="Profile artifacts">
            {PROFILE_ARTIFACTS.map((artifactId) => (
              <DocumentPreviewCard key={artifactId} artifact={resolveVerifiedDossierArtifact(artifactId)} />
            ))}
          </div>
          <aside className={`vd-inspector-card ${styles.askPanel}`} aria-labelledby="about-ask-title">
            <div className="vd-inspector-card__header">
              <h2 id="about-ask-title">Ask this profile</h2>
              <span>Grounded</span>
            </div>
            <div className="vd-question-card">
              <strong>What does this profile prove beyond a normal portfolio?</strong>
            </div>
            <div className="vd-answer-block">
              <h3>Answer</h3>
              <p>
                It shows the person, the work, and the evidence together. A visitor can inspect
                sources, follow the learning path, review artifacts, and ask questions that are
                grounded in the same archive.
              </p>
            </div>
            <h3 className="vd-citation-heading">Profile sources</h3>
            <div className="vd-citation-list">
              {CITED_PROFILE_SOURCES.map((artifactId) => (
                <ArtifactCitationCard
                  key={artifactId}
                  artifact={resolveVerifiedDossierArtifact(artifactId)}
                />
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className={styles.shelfSection} aria-labelledby="about-shelves-title">
        <div className={styles.sectionHeader}>
          <p className={styles.sectionLabel}>Five shelves</p>
          <h2 id="about-shelves-title">The profile is backed by a knowledge base.</h2>
          <p>{PERSONAL_PLATFORM_REFERENCE_INSTANCE.text}</p>
        </div>
        <div className={styles.shelfRows}>
          {VERIFIED_DOSSIER_SECTIONS.map((section) => (
            <a key={section.id} className={styles.shelfRow} href={section.href}>
              <InstitutionMark kind={section.id} />
              <span>
                <strong>{section.label}</strong>
                <small>{section.status}</small>
              </span>
              <span>{section.summary}</span>
              <span className={styles.fileStack}>
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

      <section className={styles.stackSection} aria-labelledby="about-stack-title">
        <div className={styles.sectionHeader}>
          <p className={styles.sectionLabel}>How Loom serves the archive</p>
          <h2 id="about-stack-title">One identity, four surfaces.</h2>
        </div>
        <div className={styles.stackRows}>
          {PERSONAL_PLATFORM_STACK.map((item, index) => (
            <article key={item.title} className={styles.stackRow}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.principlesSection} aria-labelledby="about-principles-title">
        <div className={styles.sectionHeader}>
          <p className={styles.sectionLabel}>Operating principles</p>
          <h2 id="about-principles-title">The rules that keep the profile credible.</h2>
        </div>
        <div className={styles.principleRows}>
          {COMMITMENTS.map((item) => (
            <article key={item.title} className={styles.principleRow}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.storySection} aria-labelledby="about-story-title">
        <div className={styles.sectionHeader}>
          <p className={styles.sectionLabel}>Product story</p>
          <h2 id="about-story-title">The history stays part of the product.</h2>
          <p>
            The name and history matter because Loom is not only a page template. It is a system
            for turning scattered material into a source-bound memory system people can inspect.
          </p>
        </div>
        <div className={styles.storyGrid}>
          <ol className={styles.timeline}>
            {VERIFIED_DOSSIER_HISTORY.map((item) => (
              <li key={item.title}>
                <time>{item.date}</time>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </li>
            ))}
          </ol>
          <div className={styles.nameRows} aria-label="Why Loom is called Loom">
            <h3>Why Loom is called Loom</h3>
            {LOOM_NAME.map((item) => (
              <article key={item.label}>
                <span>{item.label}</span>
                <div>
                  <h4>{item.title}</h4>
                  <p>{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.layerSection} aria-labelledby="about-layer-title">
        <div className={styles.sectionHeader}>
          <p className={styles.sectionLabel}>Narrative layers</p>
          <h2 id="about-layer-title">Portfolio, proof, and personal AI stay connected.</h2>
        </div>
        <div className={styles.layerRows}>
          {PERSONAL_PLATFORM_NARRATIVE_LAYERS.map((item) => (
            <article key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <nav className={styles.bottomNav} aria-label="About navigation">
        <a href="/">Home</a>
        <a href="/knowledge">Sources</a>
        <a href="/knowledge/unsw">UNSW evidence</a>
        <a href="/product-history">Full product history</a>
      </nav>
    </main>
  );
}
