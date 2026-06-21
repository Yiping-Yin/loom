import { type BeginnerProfile } from '../../lib/profile/beginner-profile';
import styles from './BeginnerJourney.module.css';

type MilestoneType = 'education' | 'experience' | 'work';

interface Milestone {
  id: string;
  type: MilestoneType;
  label: string;
  sublabel: string;
  dateLabel: string | null;
  /** Numeric sort key: parsed year or null when date is absent/unparseable */
  sortYear: number | null;
  /** Original index within its source array — used for stable tie-breaking */
  sourceIndex: number;
}

/** Extract the first 4-digit year from a freeform date string, or null. */
function extractYear(s: string | undefined): number | null {
  if (!s) return null;
  const m = s.match(/\b(19|20)\d{2}\b/);
  return m ? parseInt(m[0], 10) : null;
}

/** Build a human-readable date range from optional start/end strings. */
function dateRange(start: string | undefined, end: string | undefined): string | null {
  if (!start && !end) return null;
  if (start && end) return `${start} – ${end}`;
  if (start) return `${start} –`;
  if (end) return `– ${end}`;
  return null;
}

/**
 * Derive an ordered list of milestones from a BeginnerProfile.
 *
 * Ordering: oldest-first (ascending year) so reading top-to-bottom traces the
 * journey from its origins. Items with no parseable date sink to the end in
 * stable (source) order — we never fabricate order for undated items.
 */
function buildMilestones(profile: BeginnerProfile): Milestone[] {
  const milestones: Milestone[] = [];

  for (let i = 0; i < profile.education.length; i++) {
    const e = profile.education[i];
    const label = [e.qualification, e.field].filter(Boolean).join(', ') || e.qualification;
    milestones.push({
      id: `edu-${i}`,
      type: 'education',
      label,
      sublabel: e.institution,
      dateLabel: dateRange(e.start, e.end),
      sortYear: extractYear(e.start) ?? extractYear(e.end),
      sourceIndex: i,
    });
  }

  for (let i = 0; i < profile.experience.length; i++) {
    const x = profile.experience[i];
    milestones.push({
      id: `exp-${i}`,
      type: 'experience',
      label: x.role,
      sublabel: x.organization,
      dateLabel: dateRange(x.start, x.end),
      sortYear: extractYear(x.start) ?? extractYear(x.end),
      sourceIndex: i,
    });
  }

  for (let i = 0; i < profile.works.length; i++) {
    const w = profile.works[i];
    milestones.push({
      id: `work-${i}`,
      type: 'work',
      label: w.title,
      sublabel: w.role ?? '',
      dateLabel: w.date ?? null,
      sortYear: extractYear(w.date),
      sourceIndex: i,
    });
  }

  // Stable sort: dated items ascending by year; undated items follow in
  // original (source-array) order. We never invent an ordering for missing dates.
  const dated = milestones
    .filter((m) => m.sortYear !== null)
    .sort((a, b) => (a.sortYear as number) - (b.sortYear as number));
  const undated = milestones.filter((m) => m.sortYear === null);

  return [...dated, ...undated];
}

function tagClass(type: MilestoneType): string {
  if (type === 'education') return styles.tagEducation;
  if (type === 'experience') return styles.tagExperience;
  return styles.tagWork;
}

function tagLabel(type: MilestoneType): string {
  if (type === 'education') return 'Education';
  if (type === 'experience') return 'Experience';
  return 'Work';
}

/** Section route a milestone links to, so the timeline is navigable. */
function hrefFor(type: MilestoneType): string {
  if (type === 'education') return '/education';
  if (type === 'experience') return '/experience';
  return '/works';
}

/**
 * BeginnerJourney — a clean vertical timeline derived from a beginner's profile.
 *
 * Combines education + experience + works into a single chronological list,
 * sorted oldest-first. Items with no parseable date appear at the end in
 * stable order. Empty profiles render nothing.
 */
export function BeginnerJourney({ profile }: { profile: BeginnerProfile }) {
  const milestones = buildMilestones(profile);
  if (milestones.length === 0) return null;

  return (
    <section className={styles.section} aria-labelledby="beginner-journey-heading">
      <header>
        <p className={styles.eyebrow} aria-hidden="true">Journey</p>
        <h2 id="beginner-journey-heading" className={styles.heading}>
          Experience &amp; Education
        </h2>
      </header>

      <ol className={styles.timeline} aria-label="Career and education timeline">
        {milestones.map((m) => (
          <li key={m.id} className={styles.milestone} data-type={m.type}>
            {/* Rail node */}
            <span className={styles.node} aria-hidden="true">
              <span className={styles.nodeDot} />
            </span>

            {/* Content — a link to the matching section so the timeline is
                navigable; the type tag names where the row leads. */}
            <a
              className={styles.row}
              href={hrefFor(m.type)}
              aria-label={`${m.label}${m.sublabel ? ` — ${m.sublabel}` : ''} · ${tagLabel(m.type)}`}
            >
              <p className={styles.label}>{m.label}</p>
              {m.sublabel && <p className={styles.sublabel}>{m.sublabel}</p>}
              <div className={styles.meta}>
                <span className={`${styles.tag} ${tagClass(m.type)}`}>
                  {tagLabel(m.type)}
                </span>
                {m.dateLabel && (
                  <time className={styles.date}>{m.dateLabel}</time>
                )}
              </div>
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
