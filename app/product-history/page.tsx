import { FileBadge } from '../../components/verified-dossier/FileBadge';
import {
  PERSONAL_PLATFORM_HISTORY,
  PERSONAL_PLATFORM_NARRATIVE_LAYERS,
  PERSONAL_PLATFORM_PITCH_COPY,
  PERSONAL_PLATFORM_PRODUCT_THESIS,
  PERSONAL_PLATFORM_REFERENCE_INSTANCE,
  PERSONAL_PLATFORM_STACK,
} from '../../lib/new-loom/personal-platform';
import {
  VERIFIED_DOSSIER_HOME_COPY,
  VERIFIED_DOSSIER_TOP_NAV,
} from '../../lib/new-loom/verified-dossier-home';
import styles from './HistoryDossier.module.css';

export const metadata = { title: 'Product History · Loom' };

const HISTORY_METRICS = [
  { label: 'Origin', value: 'Thinking tool' },
  { label: 'Model', value: 'Sources / Draft' },
  { label: 'Reference instance', value: 'Yiping first' },
  { label: 'Future', value: 'For everyone' },
];

const ORIGIN_THREADS = [
  {
    title: 'Name logic',
    text: 'A loom turns many strands into one fabric. Loom uses the same metaphor for sources, drafts, projects, and conversations.',
  },
  {
    title: 'Product logic',
    text: 'The product is not a static profile. It is a structure that keeps identity, work, knowledge, and AI answers traceable.',
  },
  {
    title: 'Platform logic',
    text: 'One person is the first reference instance, but the same model can support anyone with source-backed work.',
  },
];

const HISTORY_ARTIFACTS = [
  {
    title: 'Original Loom notes',
    role: 'Origin record',
    label: 'Original Loom notes.md',
    text: 'The first idea: connect knowledge, projects, and conversations into a readable working surface.',
    kind: 'markdown' as const,
  },
  {
    title: 'Private Wiki foundation',
    role: 'System record',
    label: 'Private Wiki index.html',
    text: 'The private archive became the source layer behind a public, inspectable knowledge identity.',
    kind: 'text' as const,
  },
  {
    title: 'Verified dossier design',
    role: 'Design record',
    label: 'Verified dossier design.md',
    text: 'The product moved from a demo-like page toward a professional dossier with real artifacts and proof.',
    kind: 'markdown' as const,
  },
  {
    title: 'Platform pitch',
    role: 'Pitch record',
    label: 'Loom platform pitch.docx',
    text: 'The story now frames Loom as portfolio with proof, source-backed knowledge base, and grounded personal AI.',
    kind: 'word' as const,
  },
];

const PITCH_ITEMS = [
  ['One line', PERSONAL_PLATFORM_PITCH_COPY.oneLine],
  ['500-character summary', PERSONAL_PLATFORM_PITCH_COPY.applicationSummary500],
  ['Problem', PERSONAL_PLATFORM_PITCH_COPY.problem],
  ['Solution', PERSONAL_PLATFORM_PITCH_COPY.solution],
  ['Customer', PERSONAL_PLATFORM_PITCH_COPY.customer],
] as const;

const NARRATIVE_LAYER_TITLES = ['Portfolio with proof', 'Source to identity', 'AI persona'] as const;

export default function ProductHistoryPage() {
  return (
    <main className={styles.page} aria-labelledby="history-title">
      <nav className={styles.nav} aria-label="Product history navigation">
        <a className={styles.wordmark} href="/" aria-label="Loom home">
          Loom
        </a>
        <div className={styles.navLinks}>
          {VERIFIED_DOSSIER_TOP_NAV.map((item) => (
            <a key={item.label} href={item.href} aria-current={item.href === '/product-history' ? 'page' : undefined}>
              {item.label}
            </a>
          ))}
        </div>
      </nav>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.label}>Product history</p>
          <h1 id="history-title">Why Loom is called Loom.</h1>
          <p className={styles.lead}>{PERSONAL_PLATFORM_PRODUCT_THESIS}</p>
          <p className={styles.lead}>{VERIFIED_DOSSIER_HOME_COPY.shortDefinition}</p>
          <div className={styles.heroActions}>
            <a className={styles.buttonLink} href="#product-timeline">
              Read timeline
            </a>
            <a className={styles.textLink} href="/about">
              Open reference profile
            </a>
          </div>
        </div>

        <aside className={styles.storyPanel} aria-labelledby="reference-instance">
          <p className={styles.label}>Reference instance</p>
          <h2 id="reference-instance">{PERSONAL_PLATFORM_REFERENCE_INSTANCE.title}</h2>
          <p>{PERSONAL_PLATFORM_REFERENCE_INSTANCE.text}</p>
          <dl className={styles.storyFacts}>
            <div>
              <dt>First shelves</dt>
              <dd>About / UNSW / Quantnet / WQU / Claude</dd>
            </div>
            <div>
              <dt>Product boundary</dt>
              <dd>Not limited to one person</dd>
            </div>
          </dl>
        </aside>
      </section>

      <section className={styles.section} aria-label="Product history metrics">
        <dl className={styles.metrics}>
          {HISTORY_METRICS.map((metric) => (
            <div key={metric.label} className={styles.metric}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </div>
          ))}
        </dl>
      </section>

      <section className={styles.splitSection} aria-labelledby="name-logic">
        <div className={styles.sectionHeader}>
          <p className={styles.label}>01</p>
          <h2 id="name-logic">Name logic</h2>
          <p>The name explains the product model instead of acting as a decorative brand word.</p>
        </div>
        <div className={styles.originGrid}>
          {ORIGIN_THREADS.map((item) => (
            <article key={item.title} className={styles.originRow}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.splitSection} aria-labelledby="product-timeline">
        <div className={styles.sectionHeader}>
          <p className={styles.label}>02</p>
          <h2 id="product-timeline">Product timeline</h2>
          <p>The history records how Loom moved from one personal tool toward a repeatable platform.</p>
        </div>
        <ol className={styles.timeline}>
          {PERSONAL_PLATFORM_HISTORY.map((item, index) => (
            <li key={item.date} className={styles.timelineItem}>
              <time>{item.date}</time>
              <div className={styles.timelineCopy}>
                <h3>{timelineTitle(index)}</h3>
                <p>{item.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.splitSection} aria-labelledby="history-artifacts">
        <div className={styles.sectionHeader}>
          <p className={styles.label}>03</p>
          <h2 id="history-artifacts">Process records</h2>
          <p>The story is stronger when the page shows the types of evidence behind the product evolution.</p>
        </div>
        <div className={styles.artifactGrid}>
          {HISTORY_ARTIFACTS.map((artifact) => (
            <article key={artifact.label} className={styles.evidenceCard}>
              <span className={styles.artifactRole}>{artifact.role}</span>
              <h3>{artifact.title}</h3>
              <FileBadge kind={artifact.kind} label={artifact.label} compact />
              <p>{artifact.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.splitSection} aria-labelledby="three-layer-narrative">
        <div className={styles.sectionHeader}>
          <p className={styles.label}>04</p>
          <h2 id="three-layer-narrative">Three-layer narrative</h2>
          <p>History now connects the original name to the current product architecture.</p>
        </div>
        <div className={styles.layerGrid}>
          {PERSONAL_PLATFORM_NARRATIVE_LAYERS.map((item, index) => (
            <article key={item.title} className={styles.layerItem}>
              <h3>{NARRATIVE_LAYER_TITLES[index] ?? item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.splitSection} aria-labelledby="positioning-stack">
        <div className={styles.sectionHeader}>
          <p className={styles.label}>05</p>
          <h2 id="positioning-stack">Positioning stack</h2>
          <p>Each layer can stand alone, but together they explain why Loom is more than a portfolio page.</p>
        </div>
        <ol className={styles.stackList}>
          {PERSONAL_PLATFORM_STACK.map((item) => (
            <li key={item.title} className={styles.stackRow}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.splitSection} aria-labelledby="pitch-copy">
        <div className={styles.sectionHeader}>
          <p className={styles.label}>06</p>
          <h2 id="pitch-copy">Reusable pitch copy</h2>
          <p>The product story can now be reused in applications, introductions, and investor-style summaries.</p>
        </div>
        <dl className={styles.pitchList}>
          {PITCH_ITEMS.map(([label, text]) => (
            <div key={label} className={styles.pitchPanel}>
              <dt>
                <h3>{label}</h3>
              </dt>
              <dd>
                <p>{text}</p>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <nav aria-label="History navigation" className={styles.bottomNav}>
        <a className={styles.textLink} href="/">
          Home
        </a>
        <a className={styles.textLink} href="/about">
          About
        </a>
        <a className={styles.textLink} href="/knowledge/unsw">
          UNSW evidence
        </a>
      </nav>
    </main>
  );
}

function timelineTitle(index: number) {
  return ['Original Loom', 'Source-bound shelves', 'First proof model', 'Platform for everyone'][index] ?? 'Loom history';
}
