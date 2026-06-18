import { ArrowUpRight } from 'lucide-react';

import { FileBadge } from '../verified-dossier/FileBadge';
import { LoomGlobalNav } from '../verified-dossier/LoomGlobalNav';
import {
  resolveVerifiedDossierArtifact,
  type VerifiedDossierArtifactId,
} from '../../lib/new-loom/verified-dossier-home';
import { HistoryRuntime } from './HistoryRuntime';
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

// Section sediment notes — preserved as data so the prose lineage stays
// inspectable in source even where the new design no longer renders them.
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
  { title: 'Human', text: 'Sees. Compares. Chooses.' },
  { title: 'System', text: 'Anchors. Orders. Preserves.' },
  { title: 'AI', text: 'Infers. Drafts. Cites.' },
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
  { label: 'Source workspace', text: 'Add files.' },
  { label: 'Reader notes', text: 'Mark passages.' },
  { label: 'Draft references', text: 'Write with references.' },
] as const;

const PRODUCT_LAYERS = [
  { title: 'Identity surface', legacyTitle: 'Public identity surface', text: 'Person first.' },
  { title: 'Evidence layer', legacyTitle: 'Evidence and source layer', text: 'Inspectable claims.' },
  { title: 'Growth layer', legacyTitle: 'Growth and capability layer', text: 'Practice to capability.' },
  { title: 'Structure layer', legacyTitle: 'Cognitive structuring layer', text: 'Structured thought.' },
  { title: 'Output layer', legacyTitle: 'AI and production layer', text: 'Evidence to output.' },
] as const;

const FUNCTION_REUSE = [
  { old: 'source shelf', current: 'evidence shelf' },
  { old: 'anchors', current: 'cited answers', legacyCurrent: 'citation-backed Digital Me answers' },
  { old: 'Ask AI on passages', current: 'grounded answers' },
  { old: 'Sources to Draft', current: 'replay to output', legacyCurrent: 'process replay and output production' },
  { old: 'panel / weave / pattern', current: 'private ontology' },
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

// Evolution as a vertical timeline. The "Original Loom" lead (2024) was added
// for the redesign; the remaining stages reuse the curated public assets.
const EVOLUTION_STAGES = [
  {
    date: '2024-04',
    display: '2024 · 04',
    title: 'Original Loom',
    src: '/loom/history/early-version/01-reading-thinking-environment.jpg',
    alt: 'The first private-wiki Loom: a dark reading-and-thinking environment',
    note: 'A private wiki connecting sources to insight.',
  },
  {
    date: '2026-04-15',
    display: '2026 · 04 · 15',
    title: 'Source-bound system',
    src: '/loom/history/early-version/08-paper-reading-source.jpg',
    alt: 'Early Loom reading screen with a paper centered inside a dark source interface',
    note: 'Source before interface.',
  },
  {
    date: '2026-04-17',
    display: '2026 · 04 · 17',
    title: 'Structural mark',
    src: '/loom/history/evolution/2026-04-17-wordmark-structure.png',
    alt: 'Structural Loom wordmark exploration on a black field',
    note: 'The mark carries logic.',
  },
  {
    date: '2026-04-24',
    display: '2026 · 04 · 24',
    title: 'Frontispiece',
    src: '/loom/history/evolution/2026-04-24-frontispiece-vellum.jpg',
    alt: 'Vellum frontispiece for Loom with a room for slow reading',
    note: 'Atmosphere needed proof.',
  },
  {
    date: '2026-06-02',
    display: '2026 · 06 · 02',
    title: 'Personal Loom',
    src: '/loom/history/evolution/2026-06-02-profile-home.png',
    alt: 'Earlier Yiping Loom homepage with profile sidebar and knowledge shelves',
    note: 'A real person, not a demo.',
  },
  {
    date: '2026-06-03',
    display: '2026 · 06 · 03',
    title: 'Verified dossier',
    src: '/loom/history/evolution/2026-06-03-source-dossier.png',
    alt: 'Source dossier homepage showing profile, memberships, verified files, and answer inspector',
    note: 'Trust needs visible files.',
  },
  {
    date: '2026-06-04',
    display: '2026 · 06 · 04',
    title: 'Evidence workspace',
    src: '/loom/history/evolution/2026-06-04-evidence-workbench.png',
    alt: 'Evidence workbench homepage with source graph and cited answer inspector',
    note: 'Workflow became concrete.',
  },
  {
    date: '2026-06-04',
    display: '2026 · 06 · 04',
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
  { date: '2026-04-15', line: 'A screen that replaces paper.', note: 'Reading surface.' },
  { date: '2026-04-17', line: 'A reading and thinking environment.', note: 'Thinking room.' },
  { date: '2026-04-24', line: 'A small room for slow reading.', note: 'Slow atmosphere.' },
  { date: '2026-06-02', line: 'A personal knowledge display platform.', note: 'Proof appears.' },
  {
    date: '2026-06-11',
    line: 'A living knowledge identity that can answer for you.',
    note: 'Source-backed self. Living archive.',
    current: true,
  },
] as const;

// The acrostic carried by the wordmark — Library / Eyes / Memory.
const MARK_ACROSTIC = [
  { glyph: 'L', name: 'Library', note: 'The source archive — every reading you keep.' },
  { glyph: 'OO', name: 'Eyes', note: 'The critical eye — reading that questions back.' },
  { glyph: 'M', name: 'Memory', note: 'The mark it leaves — patterns that settle and stay.' },
] as const;

// The weave — three threads woven into one figure (the astronaut = a Digital Me).
const WEAVE_THREADS = [
  { glyph: 'L', name: 'Library', verb: 'Gather', tail: '— the world you’ve read.', orb: 'earth' },
  { glyph: 'OO', name: 'Eyes', verb: 'Read', tail: '— the gaze that questions.', orb: 'eyes' },
  { glyph: 'M', name: 'Memory', verb: 'Keep', tail: '— what orbits, and stays.', orb: 'moon' },
] as const;

// Decorative starfield twinkles in the hero void (top/left percentages + timing).
const HERO_TWINKLES = [
  { top: '10%', left: '73%', size: 3, dur: '4.2s', delay: '0s' },
  { top: '7%', left: '84%', size: 2, dur: '5.1s', delay: '0.6s' },
  { top: '16%', left: '90%', size: 3, dur: '3.8s', delay: '1.2s' },
  { top: '22%', left: '78%', size: 2, dur: '4.6s', delay: '0.3s' },
  { top: '13%', left: '66%', size: 2, dur: '5.4s', delay: '0.9s' },
  { top: '30%', left: '88%', size: 3, dur: '4.0s', delay: '1.5s' },
  { top: '24%', left: '31%', size: 2, dur: '4.4s', delay: '0.75s' },
  { top: '6%', left: '32%', size: 3, dur: '5.0s', delay: '0.2s' },
  { top: '42%', left: '29%', size: 2, dur: '4.8s', delay: '1.1s' },
] as const;

// The "Eyes" weave orb — a small observation satellite. Injected verbatim (it
// is decorative, aria-hidden) to avoid lossy hand-conversion of the SVG.
const SATELLITE_SVG = `<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false"><defs><linearGradient id="hubBody" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5a6166"/><stop offset="0.5" stop-color="#d7dce0"/><stop offset="1" stop-color="#6b7176"/></linearGradient><linearGradient id="hubFoil" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#a9893f"/><stop offset="0.5" stop-color="#e9cd8c"/><stop offset="1" stop-color="#9c7d44"/></linearGradient></defs><g transform="rotate(-15 50 50)"><rect x="15" y="40" width="17" height="20" rx="0.6" fill="rgba(34,74,104,0.5)" stroke="rgba(126,206,238,0.6)" stroke-width="0.5"/><line x1="19.25" y1="40" x2="19.25" y2="60" stroke="rgba(126,206,238,0.32)" stroke-width="0.35"/><line x1="23.50" y1="40" x2="23.50" y2="60" stroke="rgba(126,206,238,0.32)" stroke-width="0.35"/><line x1="27.75" y1="40" x2="27.75" y2="60" stroke="rgba(126,206,238,0.32)" stroke-width="0.35"/><line x1="15" y1="46.67" x2="32" y2="46.67" stroke="rgba(126,206,238,0.32)" stroke-width="0.35"/><line x1="15" y1="53.33" x2="32" y2="53.33" stroke="rgba(126,206,238,0.32)" stroke-width="0.35"/><rect x="68" y="40" width="17" height="20" rx="0.6" fill="rgba(34,74,104,0.5)" stroke="rgba(126,206,238,0.6)" stroke-width="0.5"/><line x1="72.25" y1="40" x2="72.25" y2="60" stroke="rgba(126,206,238,0.32)" stroke-width="0.35"/><line x1="76.50" y1="40" x2="76.50" y2="60" stroke="rgba(126,206,238,0.32)" stroke-width="0.35"/><line x1="80.75" y1="40" x2="80.75" y2="60" stroke="rgba(126,206,238,0.32)" stroke-width="0.35"/><line x1="68" y1="46.67" x2="85" y2="46.67" stroke="rgba(126,206,238,0.32)" stroke-width="0.35"/><line x1="68" y1="53.33" x2="85" y2="53.33" stroke="rgba(126,206,238,0.32)" stroke-width="0.35"/><line x1="32" y1="50" x2="40" y2="50" stroke="rgba(170,180,188,0.7)" stroke-width="0.7"/><line x1="60" y1="50" x2="68" y2="50" stroke="rgba(170,180,188,0.7)" stroke-width="0.7"/><rect x="40" y="24" width="20" height="52" rx="9" fill="url(#hubBody)" stroke="rgba(190,220,238,0.55)" stroke-width="0.6"/><rect x="40" y="52" width="20" height="12" fill="url(#hubFoil)" opacity="0.85"/><line x1="40" y1="52" x2="60" y2="52" stroke="rgba(120,95,40,0.5)" stroke-width="0.4"/><line x1="40" y1="64" x2="60" y2="64" stroke="rgba(120,95,40,0.5)" stroke-width="0.4"/><line x1="50" y1="25" x2="50" y2="75" stroke="rgba(255,255,255,0.18)" stroke-width="0.4"/><ellipse cx="50" cy="24.5" rx="9.2" ry="3.1" fill="#06121c" stroke="rgba(150,235,250,0.8)" stroke-width="0.7"/><ellipse cx="50" cy="24.2" rx="5" ry="1.7" fill="rgba(58,168,212,0.55)"/><circle cx="48" cy="23.6" r="1" fill="rgba(224,250,255,0.95)"/><ellipse cx="50" cy="24.5" rx="10.2" ry="3.5" fill="none" stroke="rgba(120,200,235,0.4)" stroke-width="0.5"/><ellipse cx="50" cy="76" rx="9" ry="2.6" fill="#3a4046" stroke="rgba(150,170,182,0.45)" stroke-width="0.5"/><line x1="58" y1="38" x2="70" y2="30" stroke="rgba(170,180,188,0.7)" stroke-width="0.7"/><ellipse cx="71.5" cy="28.8" rx="3.4" ry="2.2" fill="rgba(20,40,56,0.7)" stroke="rgba(150,235,250,0.7)" stroke-width="0.5" transform="rotate(-30 71.5 28.8)"/></g></svg>`;

function pad2(index: number): string {
  return String(index + 1).padStart(2, '0');
}

// Short, comp-style evidence-tile labels (DOC / PDF / WEB / IMG).
const KIND_BADGE: Record<string, string> = {
  word: 'DOC',
  doc: 'DOC',
  docx: 'DOC',
  pdf: 'PDF',
  web: 'WEB',
  link: 'WEB',
  url: 'WEB',
  image: 'IMG',
  img: 'IMG',
};

function kindBadge(kind: string): string {
  return KIND_BADGE[kind.toLowerCase()] ?? kind.slice(0, 3).toUpperCase();
}

export function ProductHistoryPage({ brandCurrent = false }: { brandCurrent?: boolean } = {}) {
  const featuredSources = FEATURED_SOURCE_IDS.map(resolveVerifiedDossierArtifact);

  return (
    <main className={styles.page} aria-labelledby="history-title">
      <span className={styles.skyfield} data-parallax="sky" aria-hidden="true" />
      <span className={styles.nebula} data-parallax="nebula" aria-hidden="true" />
      <span className={styles.grain} aria-hidden="true" />
      <span className={styles.vignette} aria-hidden="true" />

      <LoomGlobalNav ariaLabel="Product system navigation" brandCurrent={brandCurrent} />

      {/* ============================== HERO ============================== */}
      <section id="top" className={styles.hero} data-screen-label="History · hero">
        <span className={styles.heroPlate} aria-hidden="true" />
        <span className={styles.heroFade} aria-hidden="true" />
        <span className={styles.heroFadeSide} aria-hidden="true" />
        <span className={styles.heroAura} aria-hidden="true" />
        <span className={styles.heroMilky} aria-hidden="true" />
        <span className={styles.heroRim} aria-hidden="true" />
        <span className={styles.heroSun} aria-hidden="true" />
        <span className={styles.heroSheen} aria-hidden="true" />
        {HERO_TWINKLES.map((t, i) => (
          <span
            key={i}
            className={styles.twinkle}
            aria-hidden="true"
            style={{
              top: t.top,
              left: t.left,
              width: `${t.size}px`,
              height: `${t.size}px`,
              animationDuration: t.dur,
              animationDelay: t.delay,
            }}
          />
        ))}
        <img className={styles.heroComet} src="/loom/history/comet-clean.png" alt="" aria-hidden="true" draggable={false} />
        <span className={styles.hotMoon} aria-hidden="true" />
        <span className={styles.hotEarth} aria-hidden="true" />

        <div className={styles.heroGrid}>
          <h1 id="history-title">History</h1>
          <div className={styles.heroEyebrow}>
            <span className={styles.heroEyebrowLine} aria-hidden="true" />
            <span>2024 — PRESENT</span>
          </div>
        </div>

        <div className={styles.heroArchive}>
          <div className={styles.heroArchiveRow} aria-label="Original Loom record">
            <time className={styles.heroYear} dateTime="2024">
              2024
            </time>
            <article className={styles.heroOriginCard}>
              <span className={styles.heroNode} aria-hidden="true" />
              <time dateTime="2024-04">APR 2024</time>
              <h2>Original Loom</h2>
              <p>The first version of Loom was built as a private wiki to connect sources to personal insight.</p>
              <a href="#early-title">
                <span>View archive</span>
                <ArrowUpRight aria-hidden="true" size={13} strokeWidth={1.8} />
              </a>
            </article>
          </div>
        </div>
      </section>

      {/* ============================ ORIGINS ============================ */}
      <section className={styles.origins} data-reveal aria-labelledby="origins-title">
        <span className={styles.originsLimb} data-parallax="limb" aria-hidden="true" />
        <div className={styles.originsBody}>
          <p className={styles.numeral}>I · Origins · MMXXVI</p>
          <h2 id="origins-title">Before a system, a room for slow reading.</h2>
          <div className={styles.diamondRule} aria-hidden="true">
            <span />
            <span className={styles.diamond}>◆</span>
            <span />
          </div>
        </div>
      </section>

      {/* ====================== EARLY · Dark manifesto ====================== */}
      <section className={styles.earlyArchive} data-reveal aria-labelledby="early-title" data-note={EARLY_ARCHIVE_NOTE}>
        <header className={styles.earlyHeader}>
          <p className={styles.label}>
            <span className={styles.numeralMark}>II</span> · Early version
          </p>
          <h2 id="early-title">Dark manifesto.</h2>
          <p className={styles.earlyLead}>
            The first Loom was atmosphere before product — a reading-and-thinking environment, set in the dark.
          </p>
        </header>
        <div className={styles.earlyGrid}>
          {EARLY_VERSION_FRAMES.map((frame) => (
            <figure key={frame.src} className={styles.earlyFrame}>
              <span className={styles.earlyImage}>
                <img src={frame.src} alt={frame.alt} loading="lazy" />
              </span>
              <figcaption>
                <strong>{frame.title}</strong>
                <span>{frame.text}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ======================= EVOLUTION · Archive ======================= */}
      <section
        className={styles.evolutionSection}
        data-reveal
        aria-labelledby="evolution-title"
        data-note={EVOLUTION_INTENT}
        data-archive-label={PRODUCT_EVOLUTION_ARCHIVE_LABEL}
      >
        <header className={styles.evolutionIntro}>
          <p className={styles.label}>
            <span className={styles.numeralMark}>III</span> · Evolution
          </p>
          <h2 id="evolution-title">Archive.</h2>
          <p className={styles.evolutionLead}>
            Source material, not skin. Each stage kept as evidence — from a dark reading room to a living,
            source-backed self.
          </p>
        </header>
        <ol className={styles.evolutionRail}>
          <span className={styles.evolutionThread} aria-hidden="true" />
          {EVOLUTION_STAGES.map((stage, index) => (
            <li
              key={`${stage.date}-${stage.title}`}
              className={styles.evolutionStage}
              data-current={index === EVOLUTION_STAGES.length - 1 ? 'true' : undefined}
            >
              <span className={styles.evolutionNode} aria-hidden="true" />
              <figure>
                <figcaption>
                  <time dateTime={stage.date}>{stage.display}</time>
                  <strong>{stage.title}</strong>
                </figcaption>
                <span className={styles.evolutionImage}>
                  <img src={stage.src} alt={stage.alt} loading="lazy" />
                </span>
              </figure>
            </li>
          ))}
        </ol>
      </section>

      {/* ===================== What Loom became ===================== */}
      <section className={styles.became} data-reveal aria-labelledby="became-title">
        <p className={styles.eyebrowAccent}>What Loom became</p>
        <h2 id="became-title">A living knowledge identity that can answer for you.</h2>
      </section>

      {/* ====================== The name & the mark ====================== */}
      <section className={styles.nameMark} data-reveal aria-labelledby="name-mark-title">
        <p className={styles.label}>The name &amp; the mark</p>
        <h2 id="name-mark-title" className={styles.markWord}>
          L<span className={styles.markEye}>OO</span>M
        </h2>
        <div className={styles.diamondRule} aria-hidden="true">
          <span />
          <span className={styles.diamond}>◆</span>
          <span />
        </div>
        <ul className={styles.markRows}>
          {MARK_ACROSTIC.map((row) => (
            <li key={row.name} className={styles.markRow}>
              <strong>{row.glyph}</strong>
              <span className={styles.markName}>{row.name}</span>
              <span className={styles.markNote}>{row.note}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* =========================== The weave =========================== */}
      <section className={styles.weave} data-reveal aria-labelledby="weave-title">
        <header className={styles.sectionHeader}>
          <p className={styles.eyebrowAccent}>The weave</p>
          <h2 id="weave-title">Three threads, one figure.</h2>
          <p className={styles.weaveLead}>
            The astronaut is you — a <em>Digital Me</em>. The Earth in the visor, the eyes that read it, the moon
            left behind — Loom weaves all three into that self.
          </p>
        </header>
        <div className={styles.weaveGrid}>
          <span className={styles.weaveThread} aria-hidden="true" />
          {WEAVE_THREADS.map((thread) => (
            <div key={thread.name} className={styles.weaveThreadCol}>
              {thread.orb === 'earth' ? (
                // Decorative span by default; HistoryRuntime upgrades it to a
                // keyboard-operable button only when JS is present.
                <span className={styles.weaveOrbEarth} data-earth-open data-earth-label="Open the Earth in the visor">
                  <span className={styles.weaveEarthLights} aria-hidden="true" />
                  <span className={styles.weaveEarthShade} aria-hidden="true" />
                </span>
              ) : thread.orb === 'eyes' ? (
                <span
                  className={styles.weaveOrbEyes}
                  aria-hidden="true"
                  dangerouslySetInnerHTML={{ __html: SATELLITE_SVG }}
                />
              ) : (
                <span className={styles.weaveOrbMoon} aria-hidden="true" />
              )}
              <span className={styles.weaveGlyph} aria-hidden="true">
                {thread.glyph}
              </span>
              <strong>{thread.name}</strong>
              <span className={styles.weaveNote}>
                <span className={styles.weaveVerb}>{thread.verb}</span> {thread.tail}
              </span>
            </div>
          ))}
        </div>
        <p className={styles.weaveClose}>
          Library, seen through Eyes, kept as Memory — <span className={styles.weaveAccentRun}>L · OO · M</span>, woven
          into one identity that can answer for you.
        </p>
      </section>

      {/* =========================== Judgment =========================== */}
      <section className={styles.roleSplit} data-reveal aria-labelledby="role-title">
        <header className={styles.sectionHeader}>
          <p className={styles.label}>Human / System / AI</p>
          <h2 id="role-title">Judgment.</h2>
        </header>
        <div className={styles.roleGrid}>
          {ROLE_SPLIT.map((item) => (
            <article key={item.title} data-note={item.text}>
              <span>{item.title}</span>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ========================= Source first ========================= */}
      <section
        className={styles.sourcePrinciple}
        data-reveal
        aria-labelledby="source-sacred-title"
        data-note={SOURCE_PRINCIPLE_NOTE}
      >
        <div>
          <p className={styles.label}>Source is sacred</p>
          <h2 id="source-sacred-title">Source first.</h2>
          <p className={styles.sourceLead}>
            Interface recedes. Evidence remains. Every claim resolves to a file you can open.
          </p>
        </div>
        <div className={styles.sourcePlate}>
          {featuredSources.slice(0, 2).map((source) => (
            <a key={source.id} href={source.href} {...externalTargetProps(source.href)}>
              <span className={source.thumbnailSrc ? styles.sourceCardArt : styles.sourceFallback}>
                {source.thumbnailSrc ? (
                  <img src={source.thumbnailSrc} alt="" loading="lazy" />
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

      {/* ========================= Practice loop ========================= */}
      <section className={styles.growthLoop} data-reveal aria-labelledby="growth-title">
        <header className={styles.sectionHeader}>
          <p className={styles.label}>Personal growth loop</p>
          <h2 id="growth-title">Practice loop.</h2>
        </header>
        <ol className={styles.growthRail}>
          {GROWTH_LOOP.map((step, index) => (
            <li key={step} data-loopclose={index === GROWTH_LOOP.length - 1 ? 'true' : undefined}>
              <span>{pad2(index)}</span>
              <strong>{step}</strong>
            </li>
          ))}
        </ol>
      </section>

      {/* ===================== System loop (folded) ===================== */}
      <details id="system-loop" className={`${styles.systemLoop} ${styles.foldedArchive}`} data-note={SYSTEM_LOOP_NOTE}>
        <summary>
          <span className={styles.summaryCopy}>
            <span className={styles.label}>Folded note</span>
            <strong id="system-loop-title">System loop</strong>
          </span>
          <span className={styles.summaryGlyph} aria-hidden="true" />
        </summary>
        <ol className={styles.systemLoopRail}>
          {SYSTEM_LOOP_STEPS.map((step, index) => (
            <li key={step.label}>
              <span>{pad2(index)}</span>
              <div>
                <strong>{step.label}</strong>
                <p>{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </details>

      {/* ===================== Product layers (folded) ===================== */}
      <details className={`${styles.productLayers} ${styles.foldedArchive}`} data-archive-label={PRODUCT_LAYERS_ARCHIVE_LABEL}>
        <summary>
          <span className={styles.summaryCopy}>
            <span className={styles.label}>Layers</span>
            <strong id="layers-title">Product layers</strong>
          </span>
          <span className={styles.summaryGlyph} aria-hidden="true" />
        </summary>
        <div className={styles.layerRows}>
          {PRODUCT_LAYERS.map((item, index) => (
            <article key={item.title} data-legacy-title={item.legacyTitle}>
              <span>{pad2(index)}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </details>

      {/* ==================== Reused functions (folded) ==================== */}
      <details className={`${styles.functionReuse} ${styles.foldedArchive}`} data-archive-label={FUNCTION_REUSE_ARCHIVE_LABEL}>
        <summary>
          <span className={styles.summaryCopy}>
            <span className={styles.label}>Reuse</span>
            <strong id="function-title">Reused functions</strong>
          </span>
          <span className={styles.summaryGlyph} aria-hidden="true" />
        </summary>
        <div className={styles.functionRows}>
          {FUNCTION_REUSE.map((item) => (
            <article key={item.old} data-legacy-current={'legacyCurrent' in item ? item.legacyCurrent : undefined}>
              <strong>{item.old}</strong>
              <span className={styles.functionArrow} aria-hidden="true">
                →
              </span>
              <span>{item.current}</span>
            </article>
          ))}
        </div>
      </details>

      {/* ======================= Proof attached ======================= */}
      <section
        id="proof"
        className={styles.sources}
        data-reveal
        aria-labelledby="source-title"
        data-archive-label={EVIDENCE_ASSETS_ARCHIVE_LABEL}
      >
        <header className={styles.sectionHeader}>
          <p className={styles.label}>Evidence assets</p>
          <h2 id="source-title">Proof attached.</h2>
        </header>
        <div className={styles.sourceRows}>
          {featuredSources.map((source) => (
            <a key={source.id} className={styles.sourceRow} href={source.href} {...externalTargetProps(source.href)}>
              <span className={styles.sourceThumb}>
                {source.thumbnailSrc ? (
                  <img src={source.thumbnailSrc} alt={`${source.label} thumbnail`} loading="lazy" />
                ) : (
                  <span>{kindBadge(source.kind)}</span>
                )}
              </span>
              <span className={styles.sourceCopy}>
                <FileBadge kind={source.kind} label={source.label} compact />
                <strong>{source.preview?.title ?? source.label}</strong>
              </span>
              <ArrowUpRight className={styles.sourceArrow} aria-hidden="true" size={16} strokeWidth={1.8} />
            </a>
          ))}
        </div>
      </section>

      {/* =========================== Lineage =========================== */}
      <section className={styles.taglineLineage} data-reveal aria-labelledby="tagline-title" data-note={TAGLINE_INTENT}>
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

      {/* ============================ Footer ============================ */}
      <footer className={styles.footer}>
        <span className={styles.footerOrb} aria-hidden="true">
          <img src="/brand/loom_lunar_orb.png" alt="" />
        </span>
        <div className={styles.diamondRule} aria-hidden="true">
          <span />
          <span className={styles.diamond}>◆</span>
          <span />
        </div>
        <p className={styles.footerLine}>Interface recedes. Evidence remains.</p>
        <p className={styles.footerMeta}>Loom · 2024 — 2026 · every source kept</p>
      </footer>

      {/* ===================== Earth-in-the-visor modal ===================== */}
      <div className={styles.earthModal} data-earth-modal role="dialog" aria-modal="true" aria-label="The Earth in the visor" aria-hidden="true">
        <button type="button" className={styles.earthScrim} data-earth-close aria-label="Close" />
        <div className={styles.earthBody} data-earth-body>
          <div className={styles.earthOrbWrap}>
            <div className={styles.earthOrb}>
              <span className={styles.earthOrbLights} aria-hidden="true" />
              <span className={styles.earthOrbShade} aria-hidden="true" />
            </div>
            <span className={styles.earthRing} aria-hidden="true">
              <span className={styles.earthRingLine} />
              <span className={styles.earthOrbit}>
                <span className={styles.earthDot} />
              </span>
            </span>
            <span className={styles.earthRing2} aria-hidden="true">
              <span className={styles.earthRingLine} />
              <span className={`${styles.earthOrbit} ${styles.earthOrbitRev}`}>
                <span className={`${styles.earthDot} ${styles.earthDotSm}`} />
              </span>
            </span>
          </div>
          <div className={styles.earthCaption}>
            <span className={styles.eyebrowAccent}>The world you’ve read</span>
            <p>Everything you’ve read, in orbit.</p>
          </div>
        </div>
        <button type="button" className={styles.earthClose} data-earth-close aria-label="Close">
          ×
        </button>
        <span className={styles.earthHint} aria-hidden="true">
          Click anywhere · Esc to close
        </span>
      </div>

      <HistoryRuntime />
    </main>
  );
}

export default ProductHistoryPage;
