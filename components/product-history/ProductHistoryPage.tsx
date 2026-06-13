import { ArrowUpRight } from 'lucide-react';

import { FileBadge } from '../verified-dossier/FileBadge';
import { LoomGlobalNav } from '../verified-dossier/LoomGlobalNav';
import {
  resolveVerifiedDossierArtifact,
  type VerifiedDossierArtifactId,
} from '../../lib/new-loom/verified-dossier-home';
import { FirstContact } from './first-contact/FirstContact';
import styles from './HistoryDossier.module.css';

/**
 * Source hrefs that resolve to a raw static asset (.pdf/.html file) or an
 * external URL open in a new tab. A same-tab link to a PDF silently navigates
 * away or triggers a download — it reads as "clicked, nothing happened." In-app
 * routes (/knowledge/…) stay same-tab. */
function externalTargetProps(href: string): { target?: '_blank'; rel?: 'noreferrer' } {
  const isStaticFile = /\.(pdf|html?)(\?|#|$)/i.test(href);
  const isExternal = /^https?:\/\//i.test(href);
  return isStaticFile || isExternal ? { target: '_blank', rel: 'noreferrer' } : {};
}

const FEATURED_SOURCE_IDS: readonly VerifiedDossierArtifactId[] = [
  'about-doc',
  'econ-slides',
  'quantnet-python-foundations',
  'claude-certificate',
];

const SOURCE_PRINCIPLE_NOTE = 'Interface recedes. Evidence remains.';
const SYSTEM_LOOP_NOTE = 'Folded record.';
const EARLY_ARCHIVE_NOTE = 'Atmosphere first.';
const EVOLUTION_INTENT = 'Source material, not skin.';
const TAGLINE_INTENT = 'Proof changed the line.';
const PRODUCT_LAYERS_ARCHIVE_LABEL = 'Five product layers';
const FUNCTION_REUSE_ARCHIVE_LABEL = 'Functional reuse and innovation';
const PRODUCT_EVOLUTION_ARCHIVE_LABEL = 'Product evolution';
const EVIDENCE_ASSETS_ARCHIVE_LABEL = 'Real evidence assets';

const ROLE_SPLIT = [
  {
    title: 'Human',
    text: 'Sees. Compares. Chooses.',
  },
  {
    title: 'System',
    text: 'Anchors. Orders. Preserves.',
  },
  {
    title: 'AI',
    text: 'Infers. Drafts. Cites.',
  },
] as const;

const GROWTH_LOOP = [
  'Source',
  'Attention',
  'Question',
  'Judgment',
  'Practice',
  'Draft',
  'Output',
  'Identity',
  'Next source',
] as const;

const SYSTEM_LOOP_STEPS = [
  {
    label: 'Source workspace',
    text: 'Add files.',
  },
  {
    label: 'Reader notes',
    text: 'Mark passages.',
  },
  {
    label: 'Draft references',
    text: 'Write with references.',
  },
] as const;

const PRODUCT_LAYERS = [
  {
    title: 'Identity surface',
    legacyTitle: 'Public identity surface',
    text: 'Person first.',
  },
  {
    title: 'Evidence layer',
    legacyTitle: 'Evidence and source layer',
    text: 'Inspectable claims.',
  },
  {
    title: 'Growth layer',
    legacyTitle: 'Growth and capability layer',
    text: 'Practice to capability.',
  },
  {
    title: 'Structure layer',
    legacyTitle: 'Cognitive structuring layer',
    text: 'Structured thought.',
  },
  {
    title: 'Output layer',
    legacyTitle: 'AI and production layer',
    text: 'Evidence to output.',
  },
] as const;

const FUNCTION_REUSE = [
  {
    old: 'source shelf',
    current: 'evidence shelf',
  },
  {
    old: 'anchors',
    current: 'cited answers',
    legacyCurrent: 'citation-backed Digital Me answers',
  },
  {
    old: 'Ask AI on passages',
    current: 'grounded answers',
  },
  {
    old: 'Sources to Draft',
    current: 'replay to output',
    legacyCurrent: 'process replay and output production',
  },
  {
    old: 'panel / weave / pattern',
    current: 'private ontology',
  },
  { old: 'web capture and native importer', current: 'acquisition' },
  { old: 'command palette role split', current: 'AI architecture' },
] as const;

const EARLY_VERSION_FRAMES = [
  {
    src: '/loom/history/early-version/01-reading-thinking-environment.jpg',
    title: 'Reading and thinking',
    text: 'Source-bound atmosphere.',
    alt: 'Early Loom dark hero stating Loom is a reading-and-thinking environment',
  },
  {
    src: '/loom/history/early-version/02-name-mark-library-eyes-memory.jpg',
    title: 'Library / Eyes / Memory',
    text: 'The first ontology.',
    alt: 'Early Loom acronym blueprint with Library, Eyes, and Memory',
  },
  {
    src: '/loom/history/early-version/05-weaver-vocabulary.jpg',
    title: 'Weaver vocabulary',
    text: 'Language before product.',
    alt: 'Early Loom vocabulary page beside a comet-like woven image',
  },
  {
    src: '/loom/history/early-version/08-paper-reading-source.jpg',
    title: 'Source-bound reading',
    text: 'Manifesto becomes surface.',
    alt: 'Early Loom paper reading screen with a source document centered on a dark interface',
  },
] as const;

const EVOLUTION_STAGES = [
  {
    date: '2026-04-15',
    title: 'Source-bound system',
    src: '/loom/history/early-version/08-paper-reading-source.jpg',
    alt: 'Early Loom reading screen with a paper centered inside a dark source interface',
    note: 'Source before interface.',
  },
  {
    date: '2026-04-17',
    title: 'Structural mark',
    src: '/loom/history/evolution/2026-04-17-wordmark-structure.png',
    alt: 'Structural Loom wordmark exploration on a black field',
    note: 'The mark carries logic.',
  },
  {
    date: '2026-04-24',
    title: 'Frontispiece',
    src: '/loom/history/evolution/2026-04-24-frontispiece-vellum.jpg',
    alt: 'Vellum frontispiece for Loom with a room for slow reading',
    note: 'Atmosphere needed proof.',
  },
  {
    date: '2026-06-02',
    title: 'Personal Loom',
    src: '/loom/history/evolution/2026-06-02-profile-home.png',
    alt: 'Earlier Yiping Loom homepage with profile sidebar and knowledge shelves',
    note: 'A real person, not a demo.',
  },
  {
    date: '2026-06-03',
    title: 'Verified dossier',
    src: '/loom/history/evolution/2026-06-03-source-dossier.png',
    alt: 'Source dossier homepage showing profile, memberships, verified files, and answer inspector',
    note: 'Trust needs visible files.',
  },
  {
    date: '2026-06-04',
    title: 'Evidence workspace',
    src: '/loom/history/evolution/2026-06-04-evidence-workbench.png',
    alt: 'Evidence workbench homepage with source graph and cited answer inspector',
    note: 'Workflow became concrete.',
  },
  {
    date: '2026-06-04',
    title: 'Reference instance',
    src: '/loom/history/evolution/2026-06-04-current-home.png',
    alt: 'Current dark Loom homepage with About, Education, Experience, and Digital Me surfaces',
    note: 'Person first. System beneath.',
  },
] as const;

// The product's own one-line statement, kept as sediment. Each tagline was
// true when written, then outgrown for the same reason — knowledge should not
// only be read or displayed, it should live and answer. Earlier lines still
// surface verbatim in older surfaces (e.g. the App Store subtitle "A screen
// that replaces paper"); preserved here so the lineage stays inspectable.
const TAGLINE_LINEAGE = [
  {
    date: '2026-04-15',
    line: 'A screen that replaces paper.',
    note: 'Reading surface.',
  },
  {
    date: '2026-04-17',
    line: 'A reading and thinking environment.',
    note: 'Thinking room.',
  },
  {
    date: '2026-04-24',
    line: 'A small room for slow reading.',
    note: 'Slow atmosphere.',
  },
  {
    date: '2026-06-02',
    line: 'A personal knowledge display platform.',
    note: 'Proof appears.',
  },
  {
    date: '2026-06-11',
    line: 'A living knowledge identity that can answer for you.',
    note: 'Source-backed self. Living archive.',
    current: true,
  },
] as const;

const HERO_STATEMENT =
  'Loom is a cognitive growth system: it turns source-backed thinking into personal growth, evidence, output, and Digital Me.';

export function ProductHistoryPage() {
  const featuredSources = FEATURED_SOURCE_IDS.map(resolveVerifiedDossierArtifact);

  return (
    <main className={styles.page} aria-labelledby="history-title">
      <LoomGlobalNav ariaLabel="Product system navigation" brandCurrent />

      <section className={styles.hero}>
        <FirstContact />
        <span className={styles.heroLight} aria-hidden="true" />
        <span className={styles.heroDust} aria-hidden="true" />
        <div className={styles.heroCopy}>
          <h1 id="history-title">History</h1>
          <p className={styles.heroLead}>{HERO_STATEMENT}</p>
        </div>
        <figure
          className={styles.heroMedia}
          aria-label="Early Loom mark study showing Library, Eyes, and Memory"
        >
          <div
            className={styles.heroStudy}
            aria-label="Touch or focus to read the Loom mark: L is Library, OO is Eyes, and M is Memory."
            tabIndex={0}
          >
            <span className={styles.studyScan} aria-hidden="true" />
            <div className={styles.studyBlueprint}>
              <div className={styles.studyMark}>
                <span className={styles.studyLetter}>L</span>
                <span className={styles.studyEyes}>
                  <span />
                  <span />
                </span>
                <span className={styles.studyLetter}>M</span>
              </div>
            </div>
            <div className={styles.markAnnotations} aria-hidden="true">
              <span>
                <strong>L</strong>
                <em>Library</em>
                <small>Source atlas</small>
              </span>
              <span>
                <strong>OO</strong>
                <em>Eyes</em>
                <small>Weaver gaze</small>
              </span>
              <span>
                <strong>M</strong>
                <em>Memory</em>
                <small>Woven pattern</small>
              </span>
            </div>
          </div>
        </figure>
        <div className={styles.heroArchiveRow} aria-label="Original Loom record">
          <time className={styles.heroYear} dateTime="2024">
            2024
          </time>
          <article className={styles.heroOriginCard}>
            <time dateTime="2024-04">APR 2024</time>
            <h2>Original Loom</h2>
            <p>The first version of Loom was built as a private wiki to connect sources to personal insight.</p>
            <a href="#early-title">
              <span>View archive</span>
              <ArrowUpRight aria-hidden="true" size={14} strokeWidth={1.8} />
            </a>
          </article>
        </div>
      </section>

      <section className={styles.roleSplit} aria-labelledby="role-title">
        <header className={styles.sectionHeader}>
          <p className={styles.label}>Human / System / AI</p>
          <h2 id="role-title">Judgment.</h2>
        </header>
        <div className={styles.roleGrid}>
          {ROLE_SPLIT.map((item) => (
            <article key={item.title} data-note={item.text}>
              <span>{item.title}</span>
            </article>
          ))}
        </div>
      </section>

      <section
        className={styles.sourcePrinciple}
        aria-labelledby="source-sacred-title"
        data-note={SOURCE_PRINCIPLE_NOTE}
      >
        <div>
          <p className={styles.label}>Source is sacred</p>
          <h2 id="source-sacred-title">Source first.</h2>
        </div>
        <div className={styles.sourcePlate}>
          {featuredSources.slice(0, 2).map((source) => (
            <a key={source.id} href={source.href} {...externalTargetProps(source.href)}>
              <span className={source.thumbnailSrc ? undefined : styles.sourceFallback}>
                {source.thumbnailSrc ? (
                  <img src={source.thumbnailSrc} alt="" />
                ) : (
                  <>
                    <FileBadge kind={source.kind} label={source.label} compact />
                    <em>{source.preview?.title ?? source.label}</em>
                  </>
                )}
              </span>
              <strong>{source.preview?.title ?? source.label}</strong>
            </a>
          ))}
        </div>
      </section>

      <section className={styles.growthLoop} aria-labelledby="growth-title">
        <header className={styles.sectionHeader}>
          <p className={styles.label}>Personal growth loop</p>
          <h2 id="growth-title">Practice loop.</h2>
        </header>
        <ol className={styles.growthRail}>
          {GROWTH_LOOP.map((step, index) => (
            <li key={step}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{step}</strong>
            </li>
          ))}
        </ol>
      </section>

      <details
        id="system-loop"
        className={`${styles.systemLoop} ${styles.foldedArchive}`}
        data-note={SYSTEM_LOOP_NOTE}
      >
        <summary>
          <span className={styles.label}>Folded note</span>
          <strong id="system-loop-title">System loop</strong>
        </summary>
        <ol className={styles.systemLoopRail}>
          {SYSTEM_LOOP_STEPS.map((step, index) => (
            <li key={step.label}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div>
                <strong>{step.label}</strong>
                <p>{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </details>

      <section className={styles.earlyArchive} aria-labelledby="early-title" data-note={EARLY_ARCHIVE_NOTE}>
        <header className={styles.earlyHeader}>
          <p className={styles.label}>Early version</p>
          <h2 id="early-title">Dark manifesto.</h2>
        </header>
        <div className={styles.earlyGrid}>
          {EARLY_VERSION_FRAMES.map((frame) => (
            <figure key={frame.src} className={styles.earlyFrame}>
              <span className={styles.earlyImage}>
                <img src={frame.src} alt={frame.alt} />
              </span>
              <figcaption>
                <strong>{frame.title}</strong>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section
        className={styles.evolutionSection}
        aria-labelledby="evolution-title"
        data-note={EVOLUTION_INTENT}
        data-archive-label={PRODUCT_EVOLUTION_ARCHIVE_LABEL}
      >
        <header className={styles.evolutionIntro}>
          <div>
            <p className={styles.label}>Evolution</p>
            <h2 id="evolution-title">Archive.</h2>
          </div>
        </header>
        <ol className={styles.evolutionRail}>
          {EVOLUTION_STAGES.map((stage) => (
            <li key={`${stage.date}-${stage.title}`} className={styles.evolutionStage}>
              <figure>
                <span className={styles.evolutionImage}>
                  <img src={stage.src} alt={stage.alt} />
                </span>
                <figcaption>
                  <time>{stage.date}</time>
                  <strong>{stage.title}</strong>
                </figcaption>
              </figure>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.taglineLineage} aria-labelledby="tagline-title" data-note={TAGLINE_INTENT}>
        <header className={styles.sectionHeader}>
          <p className={styles.label}>Tagline sediment</p>
          <h2 id="tagline-title">Lineage.</h2>
        </header>
        <ol className={styles.taglineRail}>
          {TAGLINE_LINEAGE.map((entry) => (
            <li
              key={entry.date}
              className={styles.taglineEntry}
              data-current={'current' in entry && entry.current ? 'true' : undefined}
            >
              <time className={styles.taglineDate} dateTime={entry.date}>
                {entry.date}
              </time>
              <div className={styles.taglineBody}>
                <p className={styles.taglineLine}>&ldquo;{entry.line}&rdquo;</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <details
        className={`${styles.productLayers} ${styles.foldedArchive}`}
        data-archive-label={PRODUCT_LAYERS_ARCHIVE_LABEL}
      >
        <summary>
          <span className={styles.label}>Layers</span>
          <strong id="layers-title">Product layers</strong>
        </summary>
        <div className={styles.layerRows}>
          {PRODUCT_LAYERS.map((item, index) => (
            <article key={item.title} data-legacy-title={item.legacyTitle}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{item.title}</h3>
            </article>
          ))}
        </div>
      </details>

      <details
        className={`${styles.functionReuse} ${styles.foldedArchive}`}
        data-archive-label={FUNCTION_REUSE_ARCHIVE_LABEL}
      >
        <summary>
          <span className={styles.label}>Reuse</span>
          <strong id="function-title">Reused functions</strong>
        </summary>
        <div className={styles.functionRows}>
          {FUNCTION_REUSE.map((item) => (
            <article key={item.old} data-legacy-current={'legacyCurrent' in item ? item.legacyCurrent : undefined}>
              <strong>{item.old}</strong>
              <span>{item.current}</span>
            </article>
          ))}
        </div>
      </details>

      <section
        className={styles.sources}
        aria-labelledby="source-title"
        data-archive-label={EVIDENCE_ASSETS_ARCHIVE_LABEL}
      >
        <header className={styles.sectionHeader}>
          <p className={styles.label}>Evidence assets</p>
          <h2 id="source-title">Proof attached.</h2>
        </header>
        <div className={styles.sourceRows}>
          {featuredSources.map((source) => (
            <a
              key={source.id}
              className={styles.sourceRow}
              href={source.href}
              {...externalTargetProps(source.href)}
            >
              <span className={styles.sourceThumb}>
                {source.thumbnailSrc ? (
                  <img src={source.thumbnailSrc} alt={`${source.label} thumbnail`} />
                ) : (
                  <span>{source.kind.toUpperCase()}</span>
                )}
              </span>
              <span className={styles.sourceCopy}>
                <FileBadge kind={source.kind} label={source.label} compact />
                <strong>{source.preview?.title ?? source.label}</strong>
              </span>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}

export default ProductHistoryPage;
