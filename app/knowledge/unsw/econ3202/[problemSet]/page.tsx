import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { LoomGlobalNav } from '../../../../../components/verified-dossier/LoomGlobalNav';
import { FileBadge } from '../../../../../components/verified-dossier/FileBadge';
import {
  getUnswEcon3202ProblemSet,
  UNSW_ECON3202_PROBLEM_SET_SLUGS,
  UNSW_ECON3202_PROBLEM_SETS,
  UNSW_ECON3202_WEEKS,
} from '../../../../../lib/new-loom/unsw-shelf';
import styles from '../../UnswDossier.module.css';
import { UnswCrestMark } from '../../UnswCrestMark';
import { UnswStudyNav } from '../../UnswStudyNav';

export async function generateStaticParams() {
  return UNSW_ECON3202_PROBLEM_SET_SLUGS.map((problemSet) => ({ problemSet }));
}

export async function generateMetadata({ params }: { params: Promise<{ problemSet: string }> }) {
  const { problemSet } = await params;
  const set = getUnswEcon3202ProblemSet(problemSet);
  return {
    title: set ? `${set.label} · ECON3202 · Loom` : 'ECON3202 · Loom',
  };
}

export default async function Econ3202ProblemSetPage({
  params,
}: {
  params: Promise<{ problemSet: string }>;
}) {
  const { problemSet } = await params;
  const set = getUnswEcon3202ProblemSet(problemSet);
  if (!set) notFound();

  const relatedWeeks = UNSW_ECON3202_WEEKS.filter((week) => set.relatedWeeks.includes(week.label));
  const currentIndex = UNSW_ECON3202_PROBLEM_SETS.findIndex((item) => item.slug === set.slug);
  const previousSet = currentIndex > 0 ? UNSW_ECON3202_PROBLEM_SETS[currentIndex - 1] : null;
  const nextSet =
    currentIndex < UNSW_ECON3202_PROBLEM_SETS.length - 1
      ? UNSW_ECON3202_PROBLEM_SETS[currentIndex + 1]
      : null;

  return (
    <main className={styles.page} aria-labelledby="problem-set-title">
      <LoomGlobalNav ariaLabel={`${set.label} knowledge navigation`} />
      <UnswStudyNav active={set.slug} />

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.sectionLabel}>ECON3202 / {set.label}</p>
          <h1 id="problem-set-title">{set.focus}.</h1>
          <p className={styles.heroLead}>{set.claim}</p>
        </div>

        <aside className={styles.coursePanel} aria-labelledby="problem-set-state">
          <div className={styles.identityLine}>
            <UnswCrestMark />
            <p className={styles.sectionLabel}>Evidence state</p>
          </div>
          <h2 id="problem-set-state">{set.label}</h2>
          <dl className={styles.factGrid}>
            <Fact label="Opened" value={set.opened} />
            <Fact label="Due" value={set.due} />
            <Fact label="Weight" value={set.weight} />
            <Fact label="Related weeks" value={set.relatedWeeks.join(' / ')} />
          </dl>
        </aside>
      </section>

      <SplitSection
        label="01"
        title="Source bundle"
        intro="Each file keeps its role visible so assignment, answer, and explanation layers are not mixed."
      >
        <ol className={styles.fileList}>
          {set.files.map((file) => (
            <li key={file.localPath} className={styles.fileItem}>
              <span className={styles.problemIndex}>{file.role}</span>
              <div className={styles.fileBody}>
                <a className={styles.textLink} href={file.href}>
                  <FileBadge kind="pdf" label={file.label} compact />
                </a>
                <p className={styles.meta}>{file.pages ?? 'Local file'}</p>
              </div>
            </li>
          ))}
        </ol>
      </SplitSection>

      <SplitSection
        label="02"
        title="Reasoning process"
        intro="The process layer explains how source material becomes worked mathematical evidence."
      >
        <ProcessList items={set.processSteps} />
      </SplitSection>

      <SplitSection
        label="03"
        title="Boundary rules"
        intro="Loom keeps source truth, private answer work, and AI explanation files visibly distinct."
      >
        <ProcessList items={set.sourceBoundary} />
      </SplitSection>

      <SplitSection
        label="04"
        title="Connected weeks"
        intro="Problem-set evidence is linked back to the course sequence that supports it."
      >
        <ol className={styles.weekList}>
          {relatedWeeks.map((week) => (
            <li key={week.label} className={styles.weekRow}>
              <span className={styles.weekMarker}>{week.label}</span>
              <div className={styles.rowBody}>
                <h3>{week.focus}</h3>
                <p>{week.question}</p>
                <p className={styles.meta}>{week.output}</p>
              </div>
            </li>
          ))}
        </ol>
      </SplitSection>

      <section className={styles.splitSection} aria-labelledby="portfolio-use">
        <div className={styles.sectionHeader}>
          <p className={styles.sectionLabel}>05</p>
          <h2 id="portfolio-use">Portfolio use</h2>
          <p>The detail page explains why this work is useful beyond the course page.</p>
        </div>
        <aside className={styles.answerPanel}>
          <p>{set.portfolioUse}</p>
        </aside>
      </section>

      <nav aria-label={`${set.label} navigation`} className={styles.bottomNav}>
        <a className={styles.textLink} href="/knowledge/unsw/econ3202">
          ECON3202 overview
        </a>
        {previousSet ? (
          <a className={styles.textLink} href={`/knowledge/unsw/econ3202/${previousSet.slug}`}>
            Previous {previousSet.label}
          </a>
        ) : null}
        {nextSet ? (
          <a className={styles.textLink} href={`/knowledge/unsw/econ3202/${nextSet.slug}`}>
            Next {nextSet.label}
          </a>
        ) : null}
      </nav>
    </main>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.fact}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
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

function ProcessList({ items }: { items: { title: string; text: string }[] }) {
  return (
    <ol className={styles.outputList}>
      {items.map((item) => (
        <li key={item.title} className={styles.outputRow}>
          <h3>{item.title}</h3>
          <p>{item.text}</p>
        </li>
      ))}
    </ol>
  );
}

function sectionId(title: string) {
  return `econ3202-problem-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}
