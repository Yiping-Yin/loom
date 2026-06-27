import type { ReactNode } from 'react';
import { LoomGlobalNav } from '../../../components/verified-dossier/LoomGlobalNav';
import { DocumentPreviewCard } from '../../../components/verified-dossier/DocumentPreviewCard';
import {
  VERIFIED_DOSSIER_UNSW_COURSES,
  formatVerifiedDossierCourseFileCount,
  formatVerifiedDossierCourseMeta,
  resolveVerifiedDossierArtifact,
  type VerifiedDossierArtifactId,
} from '../../../lib/new-loom/verified-dossier-home';
import {
  UNSW_ECON3202_PROBLEM_SETS,
  UNSW_SHELF_NEXT_ACTIONS,
  UNSW_SHELF_OUTPUTS,
  UNSW_SHELF_PATH,
  UNSW_SHELF_SOURCE_GROUPS,
  UNSW_SHELF_SOURCE_LINKS,
} from '../../../lib/new-loom/unsw-shelf';
import styles from './UnswDossier.module.css';
import { UnswCrestMark } from './UnswCrestMark';
import { UnswStudyNav } from './UnswStudyNav';

export const metadata = { title: 'UNSW · Loom' };

const FEATURED_ARTIFACTS: VerifiedDossierArtifactId[] = [
  'econ-ps2',
  'econ-slides',
  'econ-tutorial',
  'econ-notes',
];

const HERO_COURSE_PREVIEW_LIMIT = 6;
const HERO_COURSE_FOLDERS = VERIFIED_DOSSIER_UNSW_COURSES.slice(0, HERO_COURSE_PREVIEW_LIMIT);
const HIDDEN_COURSE_COUNT = VERIFIED_DOSSIER_UNSW_COURSES.length - HERO_COURSE_FOLDERS.length;
const MOODLE_BACKED_COURSE_COUNT = VERIFIED_DOSSIER_UNSW_COURSES.filter(
  (course) => course.moodleHref,
).length;
const HANDBOOK_BACKED_COURSE_COUNT = VERIFIED_DOSSIER_UNSW_COURSES.filter(
  (course) => course.handbookYear,
).length;

const METRICS = [
  {
    value: String(VERIFIED_DOSSIER_UNSW_COURSES.length),
    label: 'Course folders',
  },
  {
    value: String(MOODLE_BACKED_COURSE_COUNT),
    label: 'Moodle-backed',
  },
  {
    value: String(HANDBOOK_BACKED_COURSE_COUNT),
    label: 'Handbook-backed',
  },
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
      <LoomGlobalNav ariaLabel="UNSW knowledge navigation" />
      <UnswStudyNav active="unsw" />

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.sectionLabel}>Course source shelf</p>
          <h1 id="unsw-title">UNSW</h1>
          <p className={styles.heroLead}>
            Course folders, official source records, weekly material, and Draft-ready study evidence
            stay together before any single course dossier opens.
          </p>
          <div className={styles.heroActions}>
            <a className={styles.buttonLink} href="/knowledge/unsw/econ3202">
              Open ECON3202 dossier
            </a>
            <a className={styles.textLink} href="#all-unsw-course-folders">
              View course folders
            </a>
          </div>
        </div>

        <aside
          className={`${styles.coursePanel} ${styles.courseShelfPanel}`}
          aria-labelledby="unsw-course-title"
        >
          <div className={styles.identityLine}>
            <UnswCrestMark />
            <p className={styles.sectionLabel}>Source folders</p>
          </div>
          <h2 id="unsw-course-title">{VERIFIED_DOSSIER_UNSW_COURSES.length} course folders</h2>
          <div className={styles.courseFolderGrid} aria-label="Featured UNSW course folders">
            {HERO_COURSE_FOLDERS.map((course) => (
              <a
                key={course.id}
                className={styles.courseFolderCard}
                href={course.href}
                title={courseTitle(course)}
              >
                <span className={styles.courseFolderIcon} aria-hidden="true" />
                <span>
                  <strong>{course.code}</strong>
                  <small>
                    {formatVerifiedDossierCourseMeta(course) ||
                      formatVerifiedDossierCourseFileCount(course.fileCount)}
                  </small>
                </span>
                <em>{course.moodleTitle ?? course.status}</em>
              </a>
            ))}
          </div>
          {HIDDEN_COURSE_COUNT > 0 ? (
            <a className={styles.courseFolderMore} href="#all-unsw-course-folders">
              +{HIDDEN_COURSE_COUNT} more
            </a>
          ) : null}
        </aside>
      </section>

      <section
        id="all-unsw-course-folders"
        className={`${styles.section} ${styles.courseDirectory}`}
        aria-labelledby="all-unsw-course-folders-title"
      >
        <div className={styles.courseDirectoryHeader}>
          <div>
            <p className={styles.sectionLabel}>UNSW directory</p>
            <h2 id="all-unsw-course-folders-title">Course folders</h2>
          </div>
          <strong>{VERIFIED_DOSSIER_UNSW_COURSES.length} folders</strong>
        </div>
        <div className={styles.courseDirectoryGrid} aria-label="All UNSW course folders">
          {VERIFIED_DOSSIER_UNSW_COURSES.map((course) => (
            <a
              key={course.id}
              className={styles.courseFolderCard}
              href={course.href}
              title={courseTitle(course)}
            >
              <span className={styles.courseFolderIcon} aria-hidden="true" />
              <span>
                <strong>{course.code}</strong>
                <small>
                  {formatVerifiedDossierCourseMeta(course) ||
                    formatVerifiedDossierCourseFileCount(course.fileCount)}
                </small>
              </span>
              <em>{course.moodleTitle ?? course.status}</em>
            </a>
          ))}
        </div>
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
        title="Featured ECON3202 evidence"
        intro="ECON3202 is the first detailed course dossier inside the broader UNSW shelf."
      >
        <div className={styles.documentGrid} aria-label="Featured ECON3202 document previews">
          {FEATURED_ARTIFACTS.map((artifactId) => (
            <DocumentPreviewCard
              key={artifactId}
              artifact={resolveVerifiedDossierArtifact(artifactId)}
            />
          ))}
        </div>
        <div className={styles.chain} aria-label="Sources to Studio to Digital Me">
          <article className={styles.chainStep}>
            <span>01</span>
            <h3>Sources</h3>
            <p>Official sources, weekly PDFs, exercise files, and problem-set briefs.</p>
          </article>
          <article className={styles.chainStep}>
            <span>02</span>
            <h3>Studio</h3>
            <p>Private notes and worked answers become cited forms with provenance attached.</p>
          </article>
          <article className={styles.chainStep}>
            <span>03</span>
            <h3>Digital Me</h3>
            <p>Public explanations and answers cite the source objects people can inspect.</p>
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
            <section
              key={phase.title}
              className={styles.phase}
              aria-labelledby={sectionId(phase.title)}
            >
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

function courseTitle(course: (typeof VERIFIED_DOSSIER_UNSW_COURSES)[number]) {
  return (
    [course.moodleTitle, course.handbookYear ? `UNSW Handbook ${course.handbookYear}` : null]
      .filter(Boolean)
      .join(' / ') || course.status
  );
}
