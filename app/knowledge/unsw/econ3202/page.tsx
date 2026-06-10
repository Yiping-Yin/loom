import type { ReactNode } from 'react';
import { FileBadge } from '../../../../components/verified-dossier/FileBadge';
import {
  UNSW_ECON3202_FACTS,
  UNSW_ECON3202_MANUAL,
  UNSW_ECON3202_PORTFOLIO_OUTPUTS,
  UNSW_ECON3202_PROBLEM_SETS,
  UNSW_ECON3202_PROCESS,
  UNSW_ECON3202_REFERENCE_BRIDGE,
  UNSW_ECON3202_WEEKS,
  UNSW_SHELF_COURSE,
} from '../../../../lib/new-loom/unsw-shelf';
import styles from '../UnswDossier.module.css';
import { UnswCrestMark } from '../UnswCrestMark';
import { UnswStudyNav } from '../UnswStudyNav';

export const metadata = { title: 'ECON3202 · Loom' };

export default function Econ3202Page() {
  return (
    <main className={styles.page} aria-labelledby="econ3202-title">
      <UnswStudyNav active="econ3202" />

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.sectionLabel}>UNSW / ECON3202</p>
          <h1 id="econ3202-title">Mathematical Economics with inspectable proof.</h1>
          <p className={styles.heroLead}>
            A learning evidence chain that connects source truth, weekly mathematical topics,
            problem-set answers, reference anchors, and portfolio-ready explanations.
          </p>
          <div className={styles.heroActions}>
            <a className={styles.buttonLink} href="#weekly-proof-trail">
              Review weekly trail
            </a>
            <a className={styles.textLink} href={UNSW_ECON3202_MANUAL.href}>
              Open local course manual
            </a>
          </div>
        </div>

        <aside className={styles.coursePanel} aria-labelledby="econ3202-source-object">
          <div className={styles.identityLine}>
            <UnswCrestMark />
            <p className={styles.sectionLabel}>Current source object</p>
          </div>
          <h2 id="econ3202-source-object">
            {UNSW_SHELF_COURSE.code} · {UNSW_SHELF_COURSE.title}
          </h2>
          <p>{UNSW_ECON3202_MANUAL.summary}</p>
        </aside>
      </section>

      <section className={styles.section} aria-label="ECON3202 course facts">
        <dl className={`${styles.metricGrid} ${styles.metricGridFive}`}>
          {UNSW_ECON3202_FACTS.map((fact) => (
            <div key={fact.label} className={styles.metric}>
              <span>{fact.label}</span>
              <strong>{fact.value}</strong>
            </div>
          ))}
        </dl>
      </section>

      <SplitSection
        label="01"
        title="Operating model"
        intro="The course page separates official truth, local archive, working proof, and portfolio use."
      >
        <div className={styles.chain}>
          {UNSW_ECON3202_PROCESS.map((step, index) => (
            <article key={step.title} className={styles.chainStep}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </SplitSection>

      <SplitSection
        label="02"
        title="Weekly proof trail"
        intro="Each week keeps the question, source files, references, and output in one row."
      >
        <ol id="weekly-proof-trail" className={styles.weekList}>
          {UNSW_ECON3202_WEEKS.map((week) => (
            <li key={week.label} className={styles.weekRow}>
              <span className={styles.weekMarker}>{week.label}</span>
              <div className={styles.rowBody}>
                <h3>{week.focus}</h3>
                <p>{week.question}</p>
                <p>{week.output}</p>
                <div className={styles.badgeLine} aria-label={`${week.label} local files`}>
                  {week.files.map((file) => (
                    <a key={file.localPath} className={styles.textLink} href={file.href}>
                      <FileBadge kind="pdf" label={file.label} compact />
                    </a>
                  ))}
                </div>
                <p className={styles.meta}>Reference bridge: {week.references.join(' / ')}</p>
              </div>
            </li>
          ))}
        </ol>
      </SplitSection>

      <section className={styles.splitSection} aria-labelledby="problem-set-trail">
        <div className={styles.sectionHeader}>
          <p className={styles.sectionLabel}>03</p>
          <h2 id="problem-set-trail">Problem-set trail</h2>
          <p>Problem sets are the strongest visible proof that the shelf contains real work.</p>
        </div>
        <div className={styles.answerLayout}>
          <ol className={styles.problemList}>
            {UNSW_ECON3202_PROBLEM_SETS.map((set) => (
              <li key={set.slug} className={styles.problemRow}>
                <span className={styles.problemIndex}>{set.label}</span>
                <div className={styles.rowBody}>
                  <h3>
                    <a className={styles.textLink} href={`/knowledge/unsw/econ3202/${set.slug}`}>
                      {set.focus}
                    </a>
                  </h3>
                  <p className={styles.meta}>
                    Opened {set.opened} / Due {set.due} / {set.weight}
                  </p>
                  <p>{set.claim}</p>
                  <div className={styles.badgeLine} aria-label={`${set.label} evidence files`}>
                    {set.files.map((file) => (
                      <a key={file.localPath} className={styles.textLink} href={file.href}>
                        <FileBadge kind="pdf" label={file.label} compact />
                      </a>
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ol>

          <aside className={styles.answerPanel} aria-labelledby="econ-answer-preview">
            <p className={styles.sectionLabel}>Ask this course</p>
            <h2 id="econ-answer-preview">How does concavity connect to optimisation?</h2>
            <p>
              Concavity gives ECON3202 a way to move from derivatives to evidence. When a function
              is concave, first-order conditions can identify a maximum with stronger economic
              meaning, which is why Week 8 connects directly to later optimisation work.
            </p>
            <div className={styles.fileBadges}>
              <FileBadge kind="pdf" label="W8 A Concave-Functions.pdf" compact />
              <FileBadge kind="pdf" label="W8 C Suggested Exercises.pdf" compact />
              <FileBadge kind="pdf" label="Problem2.pdf" compact />
            </div>
          </aside>
        </div>
      </section>

      <SplitSection
        label="04"
        title="Reference bridge"
        intro="The page names where the durable mathematical ideas come from."
      >
        <ol className={styles.referenceList}>
          {UNSW_ECON3202_REFERENCE_BRIDGE.map((reference) => (
            <li key={reference.label} className={styles.referenceRow}>
              <h3>{reference.label}</h3>
              <div className={styles.rowBody}>
                <p>{reference.source}</p>
                <p className={styles.meta}>
                  {reference.span} / {reference.use}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </SplitSection>

      <SplitSection
        label="05"
        title="Portfolio outputs"
        intro="The course becomes proof for finance, trading, quantitative study, and AI-assisted learning."
      >
        <ol className={styles.outputList}>
          {UNSW_ECON3202_PORTFOLIO_OUTPUTS.map((output) => (
            <li key={output.title} className={styles.outputRow}>
              <h3>{output.title}</h3>
              <p>{output.text}</p>
            </li>
          ))}
        </ol>
      </SplitSection>

      <nav aria-label="ECON3202 navigation" className={styles.bottomNav}>
        <a className={styles.textLink} href="/knowledge/unsw">
          UNSW shelf
        </a>
        <a className={styles.textLink} href="/sources">
          Sources
        </a>
        <a className={styles.textLink} href="/about">
          About
        </a>
      </nav>
    </main>
  );
}

function SplitSection({
  label,
  title,
  intro,
  children,
}: {
  label: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.splitSection} aria-labelledby={sectionId(title)}>
      <div className={styles.sectionHeader}>
        <p className={styles.sectionLabel}>{label}</p>
        <h2 id={sectionId(title)}>{title}</h2>
        <p>{intro}</p>
      </div>
      <div className={styles.evidencePanel}>{children}</div>
    </section>
  );
}

function sectionId(title: string) {
  return `econ3202-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}
