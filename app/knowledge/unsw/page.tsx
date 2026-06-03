import type { ReactNode } from 'react';
import { DocumentPreviewCard } from '../../../components/verified-dossier/DocumentPreviewCard';
import {
  resolveVerifiedDossierArtifact,
  type VerifiedDossierArtifactId,
} from '../../../lib/new-loom/verified-dossier-home';
import {
  UNSW_ECON3202_MANUAL,
  UNSW_ECON3202_PROBLEM_SETS,
  UNSW_SHELF_COURSE,
  UNSW_SHELF_NEXT_ACTIONS,
  UNSW_SHELF_OUTPUTS,
  UNSW_SHELF_PATH,
  UNSW_SHELF_SOURCE_GROUPS,
  UNSW_SHELF_SOURCE_LINKS,
} from '../../../lib/new-loom/unsw-shelf';
import styles from './UnswDossier.module.css';
import { UnswStudyNav } from './UnswStudyNav';

export const metadata = { title: 'UNSW · Loom' };

const FEATURED_ARTIFACTS: VerifiedDossierArtifactId[] = [
  'econ-ps2',
  'econ-slides',
  'econ-tutorial',
  'econ-notes',
];

const METRICS = [
  {
    value: String(UNSW_SHELF_SOURCE_LINKS.length),
    label: 'Official sources',
  },
  {
    value: String(UNSW_SHELF_PATH.length),
    label: 'Mapped weeks',
  },
  {
    value: String(UNSW_ECON3202_PROBLEM_SETS.length),
    label: 'Problem sets',
  },
  {
    value: String(UNSW_SHELF_OUTPUTS.length),
    label: 'Portfolio outputs',
  },
];

const LEARNING_PHASES = [
  {
    title: 'Foundations',
    weeks: ['W01', 'W02', 'W03', 'W04'],
    text: 'Logic, sets, topology, continuity, and existence results create the proof language.',
  },
  {
    title: 'Methods',
    weeks: ['W05', 'W07', 'W08'],
    text: 'Differentiation, implicit functions, and concavity turn definitions into tools.',
  },
  {
    title: 'Optimisation',
    weeks: ['W09', 'W10'],
    text: 'Unconstrained and constrained optimisation close the course arc.',
  },
];

export default function UnswShelfPage() {
  return (
    <main className={styles.page} aria-labelledby="unsw-title">
      <UnswStudyNav active="unsw" />

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.sectionLabel}>UNSW evidence shelf</p>
          <h1 id="unsw-title">Academic work with inspectable proof.</h1>
          <p className={styles.heroLead}>
            The UNSW shelf turns official sources, weekly mathematics, problem-set answers, and
            explanation files into a public learning record that can be inspected before it is
            trusted.
          </p>
          <div className={styles.heroActions}>
            <a className={styles.buttonLink} href="/knowledge/unsw/econ3202">
              Open ECON3202 dossier
            </a>
            <a className={styles.textLink} href={UNSW_ECON3202_MANUAL.href}>
              Open local course manual
            </a>
          </div>
        </div>

        <aside className={styles.coursePanel} aria-labelledby="unsw-course-title">
          <div className={styles.identityLine}>
            <span className={styles.unswMark} aria-label="UNSW Sydney">
              UNSW
            </span>
            <p className={styles.sectionLabel}>First real course instance</p>
          </div>
          <h2 id="unsw-course-title">
            {UNSW_SHELF_COURSE.code} · {UNSW_SHELF_COURSE.title}
          </h2>
          <p>{UNSW_SHELF_COURSE.summary}</p>
          <dl className={styles.factGrid}>
            <Fact label="Offering" value={UNSW_SHELF_COURSE.offering} />
            <Fact label="Units" value={UNSW_SHELF_COURSE.units} />
            <Fact label="Delivery" value={UNSW_SHELF_COURSE.delivery} />
            <Fact label="Owner" value={UNSW_SHELF_COURSE.owner} />
          </dl>
        </aside>
      </section>

      <section className={styles.section} aria-label="UNSW evidence metrics">
        <dl className={styles.metricGrid}>
          {METRICS.map((metric) => (
            <div key={metric.label} className={styles.metric}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </div>
          ))}
        </dl>
      </section>

      <SplitSection
        label="01"
        title="Real artifacts"
        intro="The shelf opens with file objects from the course archive, not abstract feature tiles."
      >
        <div className={styles.documentGrid} aria-label="Featured ECON3202 document previews">
          {FEATURED_ARTIFACTS.map((artifactId) => (
            <DocumentPreviewCard key={artifactId} artifact={resolveVerifiedDossierArtifact(artifactId)} />
          ))}
        </div>
        <div className={styles.chain} aria-label="Sources to Draft to Answer">
          <article className={styles.chainStep}>
            <span>01</span>
            <h3>Sources</h3>
            <p>Official sources, weekly PDFs, exercise files, and problem-set briefs.</p>
          </article>
          <article className={styles.chainStep}>
            <span>02</span>
            <h3>Draft</h3>
            <p>Private notes and worked answers remain labeled as synthesis.</p>
          </article>
          <article className={styles.chainStep}>
            <span>03</span>
            <h3>Answer</h3>
            <p>Public explanations cite the source objects people can inspect.</p>
          </article>
        </div>
      </SplitSection>

      <SplitSection
        label="02"
        title="Source map"
        intro="Official truth, references, and local work stay separated so the page does not overclaim."
      >
        <div id="unsw-source-map" className={styles.sourceGrid}>
          {UNSW_SHELF_SOURCE_LINKS.map((source) => (
            <a key={source.label} className={styles.sourcePanel} href={source.href}>
              <h3>{source.label}</h3>
              <p>{source.note}</p>
            </a>
          ))}
        </div>
        <ol className={styles.evidenceList} aria-label="Source layers">
          {UNSW_SHELF_SOURCE_GROUPS.map((group, index) => (
            <li key={group.title} className={styles.evidenceItem}>
              <span className={styles.problemIndex}>{String(index + 1).padStart(2, '0')}</span>
              <div className={styles.evidenceCopy}>
                <h3>{group.title}</h3>
                <p>{group.items.join(' / ')}</p>
              </div>
            </li>
          ))}
        </ol>
      </SplitSection>

      <SplitSection
        label="03"
        title="Learning spine"
        intro="The weekly sequence is grouped into a readable course arc instead of a flat file dump."
      >
        <div id="unsw-learning-spine" className={styles.phaseGrid}>
          {LEARNING_PHASES.map((phase) => (
            <section key={phase.title} className={styles.phase} aria-labelledby={sectionId(phase.title)}>
              <h3 id={sectionId(phase.title)}>{phase.title}</h3>
              <p>{phase.text}</p>
              <ol className={styles.weekList}>
                {phase.weeks.map((weekLabel) => {
                  const week = findWeek(weekLabel);
                  return (
                    <li key={week.label} className={styles.weekRow}>
                      <span className={styles.weekMarker}>{week.label}</span>
                      <div className={styles.rowBody}>
                        <h3>{week.focus}</h3>
                        <p>{week.sources.join(' / ')}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      </SplitSection>

      <SplitSection
        label="04"
        title="Problem work"
        intro="Assignments, answers, and explanations become a visible proof trail."
      >
        <ol id="unsw-problem-work" className={styles.problemList}>
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
                <p>{set.evidence}</p>
                <p className={styles.meta}>{set.files.map((file) => file.role).join(' / ')}</p>
              </div>
            </li>
          ))}
        </ol>
      </SplitSection>

      <SplitSection
        label="05"
        title="Outputs"
        intro="The shelf converts study residue into reusable public evidence."
      >
        <ol id="unsw-outputs" className={styles.outputList}>
          {UNSW_SHELF_OUTPUTS.map((output) => (
            <li key={output.title} className={styles.outputRow}>
              <h3>{output.title}</h3>
              <p>{output.text}</p>
            </li>
          ))}
        </ol>
        <ol className={styles.evidenceList} aria-label="Next actions">
          {UNSW_SHELF_NEXT_ACTIONS.map((item, index) => (
            <li key={item} className={styles.evidenceItem}>
              <span className={styles.problemIndex}>{String(index + 1).padStart(2, '0')}</span>
              <div className={styles.evidenceCopy}>
                <h3>Next action</h3>
                <p>{item}</p>
              </div>
            </li>
          ))}
        </ol>
      </SplitSection>

      <nav aria-label="UNSW navigation" className={styles.bottomNav}>
        <a className={styles.textLink} href="/knowledge/unsw/econ3202">
          ECON3202 overview
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

function sectionId(title: string) {
  return `unsw-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

function findWeek(label: string) {
  const week = UNSW_SHELF_PATH.find((block) => block.label === label);
  if (!week) {
    throw new Error(`Missing UNSW week ${label}`);
  }
  return week;
}
