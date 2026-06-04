import { FileBadge } from '../../components/verified-dossier/FileBadge';
import {
  VERIFIED_DOSSIER_TOP_NAV,
  resolveVerifiedDossierArtifact,
  type VerifiedDossierArtifactId,
} from '../../lib/new-loom/verified-dossier-home';
import styles from './HistoryDossier.module.css';

export const metadata = { title: 'Product System · Loom' };

const FEATURED_SOURCE_IDS: readonly VerifiedDossierArtifactId[] = [
  'about-doc',
  'econ-slides',
  'quantnet-python-foundations',
  'claude-certificate',
];

const HERO_STATEMENT =
  'Loom is a cognitive growth system: it turns source-backed thinking into personal growth, evidence, output, and Digital Me.';

const THESIS_POINTS = [
  'The person sees, compares, judges, and chooses.',
  'The system anchors, organizes, connects, and preserves.',
  'AI accelerates inference without replacing judgment.',
  'The lasting output is structured understanding, not a chat log.',
] as const;

const TIME_STRUCTURE = [
  {
    title: 'Library',
    text: 'Past material reaches the present through documents, courses, archives, and source files.',
  },
  {
    title: 'Eyes',
    text: 'Present attention becomes judgment through reading, comparison, question, and decision.',
  },
  {
    title: 'Memory',
    text: 'Judged understanding reaches the future as drafts, outputs, capability, and Digital Me.',
  },
] as const;

const ROLE_SPLIT = [
  {
    title: 'Human',
    text: 'Attention, questions, judgment, and relation choices remain with the person.',
  },
  {
    title: 'System',
    text: 'Anchoring, organization, connection, and preservation remove the burden of arranging thought.',
  },
  {
    title: 'AI',
    text: 'AI accelerates inference, explanation, draft assistance, and process replay without becoming the protagonist.',
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

const PRODUCT_LAYERS = [
  {
    title: 'Public identity surface',
    text: 'About, Education, Experience, and Digital Me introduce the person and point into deeper proof.',
  },
  {
    title: 'Evidence and source layer',
    text: 'Files, institution marks, document previews, source paths, dates, and citations make claims inspectable.',
  },
  {
    title: 'Growth and capability layer',
    text: 'Learning paths, projects, practice artifacts, and judgment changes show how capability forms over time.',
  },
  {
    title: 'Cognitive structuring layer',
    text: 'Source, anchor, judgment, relation, panel, weave, pattern, and Thought Map describe how understanding forms.',
  },
  {
    title: 'AI and production layer',
    text: 'Grounded answers, source retrieval, draft generation, process replay, and capability canvases turn evidence into output.',
  },
] as const;

const FUNCTION_REUSE = [
  {
    old: 'source shelf',
    current: 'Education and Experience evidence',
  },
  {
    old: 'anchors',
    current: 'citation-backed Digital Me answers',
  },
  {
    old: 'Ask AI on passages',
    current: 'grounded answer mode',
  },
  {
    old: 'Sources to Draft',
    current: 'process replay and output production',
  },
  {
    old: 'panel / weave / pattern',
    current: 'internal cognitive ontology',
  },
  {
    old: 'web capture and native importer',
    current: 'future source acquisition layer',
  },
  {
    old: 'command palette role split',
    current: 'long-term AI interaction architecture',
  },
] as const;

const EARLY_VERSION_FRAMES = [
  {
    src: '/loom/history/early-version/01-reading-thinking-environment.jpg',
    title: 'Reading and thinking',
    text: 'The first promise: source-bound understanding woven into memory.',
    alt: 'Early Loom dark hero stating Loom is a reading-and-thinking environment',
  },
  {
    src: '/loom/history/early-version/02-name-mark-library-eyes-memory.jpg',
    title: 'Library / Eyes / Memory',
    text: 'The name system treated Loom as source atlas, active gaze, and retained pattern.',
    alt: 'Early Loom acronym blueprint with Library, Eyes, and Memory',
  },
  {
    src: '/loom/history/early-version/05-weaver-vocabulary.jpg',
    title: 'Weaver vocabulary',
    text: 'Source, thought-anchor, panel, weave, pattern, atlas, and comet became the early product language.',
    alt: 'Early Loom vocabulary page beside a comet-like woven image',
  },
  {
    src: '/loom/history/early-version/08-paper-reading-source.jpg',
    title: 'Source-bound reading',
    text: 'The product moved from manifesto into actual reading surfaces for papers and technical material.',
    alt: 'Early Loom paper reading screen with a source document centered on a dark interface',
  },
] as const;

const EVOLUTION_STAGES = [
  {
    date: '2026-04-15',
    title: 'Source-bound system',
    src: '/loom/history/early-version/08-paper-reading-source.jpg',
    alt: 'Early Loom reading screen with a paper centered inside a dark source interface',
    learned: 'A source must remain more important than the surrounding interface.',
    kept: 'Source, panel, and weave became real product objects.',
    changed: 'The thesis moved from atmosphere into inspectable structure.',
  },
  {
    date: '2026-04-17',
    title: 'Structural mark',
    src: '/loom/history/evolution/2026-04-17-wordmark-structure.png',
    alt: 'Structural Loom wordmark exploration on a black field',
    learned: 'The mark should carry product logic, not only visual taste.',
    kept: 'The mark had to carry the product logic inside the letters.',
    changed: 'Decoration was rejected in favor of one structural move.',
  },
  {
    date: '2026-04-24',
    title: 'Frontispiece',
    src: '/loom/history/evolution/2026-04-24-frontispiece-vellum.jpg',
    alt: 'Vellum frontispiece for Loom with a room for slow reading',
    learned: 'Atmosphere matters, but atmosphere alone does not prove the product.',
    kept: 'Quiet editorial confidence and slow-reading pace.',
    changed: 'Too poetic alone; it needed source evidence behind it.',
  },
  {
    date: '2026-06-02',
    title: 'Personal Loom',
    src: '/loom/history/evolution/2026-06-02-profile-home.png',
    alt: 'Earlier Yiping Loom homepage with profile sidebar and knowledge shelves',
    learned: 'The first reference instance needs a real person, not an abstract demo.',
    kept: 'Yiping became the reference instance instead of an abstract demo.',
    changed: 'The page still exposed too much internal product taxonomy.',
  },
  {
    date: '2026-06-03',
    title: 'Verified dossier',
    src: '/loom/history/evolution/2026-06-03-source-dossier.png',
    alt: 'Source dossier homepage showing profile, memberships, verified files, and answer inspector',
    learned: 'Trust becomes visible when real files, marks, citations, and thumbnails appear.',
    kept: 'Real files, institution marks, citations, and thumbnails made trust visible.',
    changed: 'The layout read like an operating console rather than a public profile.',
  },
  {
    date: '2026-06-04',
    title: 'Evidence workspace',
    src: '/loom/history/evolution/2026-06-04-evidence-workbench.png',
    alt: 'Evidence workbench homepage with source graph and cited answer inspector',
    learned: 'Sources to Draft to Answer is a real workflow, not only a diagram.',
    kept: 'Sources to Draft to Answer became a concrete workflow.',
    changed: 'The workflow needed to move below the personal story.',
  },
  {
    date: '2026-06-04',
    title: 'Reference instance',
    src: '/loom/history/evolution/2026-06-04-current-home.png',
    alt: 'Current dark Loom homepage with About, Education, Experience, and Digital Me surfaces',
    learned: 'Home should present the person; Loom explains the system underneath.',
    kept: 'The early atmosphere returned, now backed by real profile assets.',
    changed: 'Loom became the underlying product layer, not the whole first screen.',
  },
] as const;

export default function ProductHistoryPage() {
  const featuredSources = FEATURED_SOURCE_IDS.map(resolveVerifiedDossierArtifact);

  return (
    <main className={styles.page} aria-labelledby="history-title">
      <nav className={styles.nav} aria-label="Product system navigation">
        <a className={styles.wordmark} href="/" aria-label="Open Loom home">
          Loom
        </a>
        <div className={styles.navLinks}>
          {VERIFIED_DOSSIER_TOP_NAV.map((item) => (
            <a key={item.label} href={item.href}>
              {item.label}
            </a>
          ))}
        </div>
      </nav>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.label}>Loom product system</p>
          <h1 id="history-title">Loom is a cognitive growth system.</h1>
          <p className={styles.lead}>{HERO_STATEMENT}</p>
          <div className={styles.thesisList}>
            {THESIS_POINTS.map((point) => (
              <span key={point}>{point}</span>
            ))}
          </div>
        </div>
        <figure className={styles.heroMedia}>
          <img
            src="/loom/history/early-version/02-name-mark-library-eyes-memory.jpg"
            alt="Early Loom wordmark blueprint showing Library, Eyes, and Memory"
          />
          <figcaption>Early Loom mark study, reinterpreted as product ontology</figcaption>
        </figure>
      </section>

      <section className={styles.timeStructure} aria-labelledby="time-title">
        <header className={styles.sectionHeader}>
          <p className={styles.label}>Library / Eyes / Memory</p>
          <h2 id="time-title">Knowledge moves through time.</h2>
        </header>
        <div className={styles.timeGrid}>
          {TIME_STRUCTURE.map((item) => (
            <article key={item.title}>
              <strong>{item.title}</strong>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.roleSplit} aria-labelledby="role-title">
        <header className={styles.sectionHeader}>
          <p className={styles.label}>Human / System / AI</p>
          <h2 id="role-title">The product keeps judgment human.</h2>
        </header>
        <div className={styles.roleGrid}>
          {ROLE_SPLIT.map((item) => (
            <article key={item.title}>
              <span>{item.title}</span>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.sourcePrinciple} aria-labelledby="source-sacred-title">
        <div>
          <p className={styles.label}>Source is sacred</p>
          <h2 id="source-sacred-title">The source stays foreground.</h2>
          <p>
            Notes, controls, and AI should appear when needed and recede when not
            needed. Source authority comes before system self-display.
          </p>
        </div>
        <div className={styles.sourcePlate}>
          {featuredSources.slice(0, 2).map((source) => (
            <a key={source.id} href={source.href}>
              <span>
                {source.thumbnailSrc ? (
                  <img src={source.thumbnailSrc} alt="" />
                ) : (
                  source.kind.toUpperCase()
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
          <h2 id="growth-title">A person changes through source-backed practice.</h2>
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

      <section className={styles.earlyArchive} aria-labelledby="early-title">
        <header className={styles.earlyHeader}>
          <p className={styles.label}>Early Loom version</p>
          <h2 id="early-title">A dark manifesto became a working product.</h2>
          <p>
            The first version was not a portfolio page. It was a product thesis:
            hold tension, keep sources visible, and let judgment become memory.
          </p>
        </header>
        <div className={styles.earlyGrid}>
          {EARLY_VERSION_FRAMES.map((frame) => (
            <figure key={frame.src} className={styles.earlyFrame}>
              <span className={styles.earlyImage}>
                <img src={frame.src} alt={frame.alt} />
              </span>
              <figcaption>
                <strong>{frame.title}</strong>
                <span>{frame.text}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className={styles.evolutionSection} aria-labelledby="evolution-title">
        <header className={styles.evolutionIntro}>
          <div>
            <p className={styles.label}>Product evolution</p>
            <h2 id="evolution-title">Old versions became product learning.</h2>
          </div>
          <p>
            Each stage records what was learned, what was kept, and what was
            changed. Earlier versions are source material for the current product
            system, not skins to imitate.
          </p>
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
              <dl className={styles.evolutionDecision}>
                <div>
                  <dt>Learned</dt>
                  <dd>{stage.learned}</dd>
                </div>
                <div>
                  <dt>Kept</dt>
                  <dd>{stage.kept}</dd>
                </div>
                <div>
                  <dt>Changed</dt>
                  <dd>{stage.changed}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.productLayers} aria-labelledby="layers-title">
        <header className={styles.sectionHeader}>
          <p className={styles.label}>Five product layers</p>
          <h2 id="layers-title">Not a showcase. A product system.</h2>
        </header>
        <div className={styles.layerRows}>
          {PRODUCT_LAYERS.map((item, index) => (
            <article key={item.title}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.functionReuse} aria-labelledby="function-title">
        <header className={styles.sectionHeader}>
          <p className={styles.label}>Functional reuse and innovation</p>
          <h2 id="function-title">Old concepts become current capabilities.</h2>
        </header>
        <div className={styles.functionRows}>
          {FUNCTION_REUSE.map((item) => (
            <article key={item.old}>
              <strong>{item.old}</strong>
              <span>{item.current}</span>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.sources} aria-labelledby="source-title">
        <header className={styles.sectionHeader}>
          <p className={styles.label}>Real evidence assets</p>
          <h2 id="source-title">The philosophy is attached to visible files.</h2>
        </header>
        <div className={styles.sourceRows}>
          {featuredSources.map((source) => (
            <a key={source.id} className={styles.sourceRow} href={source.href}>
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
                <span>{source.sourcePath ?? source.preview?.metadata ?? source.role}</span>
              </span>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
