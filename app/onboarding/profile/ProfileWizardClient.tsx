'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowLeft, Plus, X } from 'lucide-react';
import Link from 'next/link';
import {
  emptyBeginnerProfile,
  type BeginnerProfile,
  type EducationEntry,
  type ExperienceEntry,
  type ProfileLink,
} from '../../../lib/profile/beginner-profile';
import {
  readBeginnerProfileLocal,
  writeBeginnerProfileLocal,
} from '../../../lib/profile/profile-storage';
import { assessHomeFields, type HomeHints } from '../../../lib/onboarding/form-gate';
import styles from './ProfileWizard.module.css';

type Step = 'home' | 'about' | 'education' | 'experience' | 'review';
const STEPS: Step[] = ['home', 'about', 'education', 'experience', 'review'];
const STEP_LABELS: Record<Step, string> = {
  home: 'Home',
  about: 'About',
  education: 'Education',
  experience: 'Experience',
  review: 'Review',
};

const LINK_LABEL_OPTIONS = ['LinkedIn', 'GitHub', 'Website', 'Other'];

/** Build the POST payload — pure helper so it's unit-testable. */
export function buildProfilePayload(profile: BeginnerProfile): string {
  return JSON.stringify({ profile });
}

export function ProfileWizardClient({ initial }: { initial?: BeginnerProfile | null } = {}) {
  const router = useRouter();
  const [profile, setProfile] = useState<BeginnerProfile>(
    initial ?? emptyBeginnerProfile(),
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [homeHints, setHomeHints] = useState<HomeHints>({});

  // Edit / resume: when no initial profile was supplied, hydrate from the
  // localStorage store on mount so a returning user sees their saved profile.
  useEffect(() => {
    if (initial) return;
    const stored = readBeginnerProfileLocal();
    if (stored) setProfile(stored);
    // Only on first mount; `initial` is stable for the wizard's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentStep = STEPS[stepIndex];

  const goNext = () => setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  const goBack = () => setStepIndex((i) => Math.max(i - 1, 0));

  // Quiet, advisory floor for the HOME step: compute hints on Next, but never
  // block navigation — the hints are guidance, not a gate.
  const goNextChecked = () => {
    if (currentStep === 'home') setHomeHints(assessHomeFields(profile.home));
    goNext(); // never blocked — hints are advisory
  };

  const updateHome = (key: keyof BeginnerProfile['home'], value: string) =>
    setProfile((p) => ({ ...p, home: { ...p.home, [key]: value } }));

  const updateAbout = (key: keyof BeginnerProfile['about'], value: unknown) =>
    setProfile((p) => ({ ...p, about: { ...p.about, [key]: value } }));

  // Education helpers
  const addEducation = () =>
    setProfile((p) => ({
      ...p,
      education: [...p.education, { institution: '', qualification: '' }],
    }));

  const removeEducation = (idx: number) =>
    setProfile((p) => ({ ...p, education: p.education.filter((_, i) => i !== idx) }));

  const updateEducation = (idx: number, key: keyof EducationEntry, value: string) =>
    setProfile((p) => {
      const updated = p.education.map((e, i) =>
        i === idx ? { ...e, [key]: value || undefined } : e,
      );
      // institution and qualification must always be strings (not undefined)
      const entry = updated[idx];
      if (key === 'institution' || key === 'qualification') {
        updated[idx] = { ...entry, [key]: value };
      }
      return { ...p, education: updated };
    });

  // Experience helpers
  const addExperience = () =>
    setProfile((p) => ({
      ...p,
      experience: [...p.experience, { role: '', organization: '', bullets: [] }],
    }));

  const removeExperience = (idx: number) =>
    setProfile((p) => ({ ...p, experience: p.experience.filter((_, i) => i !== idx) }));

  const updateExperience = (idx: number, key: keyof ExperienceEntry, value: unknown) =>
    setProfile((p) => {
      const updated = p.experience.map((e, i) =>
        i === idx ? { ...e, [key]: value } : e,
      );
      return { ...p, experience: updated };
    });

  const addBullet = (expIdx: number) =>
    setProfile((p) => {
      const exp = p.experience[expIdx];
      return {
        ...p,
        experience: p.experience.map((e, i) =>
          i === expIdx ? { ...exp, bullets: [...exp.bullets, ''] } : e,
        ),
      };
    });

  const updateBullet = (expIdx: number, bulletIdx: number, value: string) =>
    setProfile((p) => ({
      ...p,
      experience: p.experience.map((e, i) =>
        i === expIdx
          ? { ...e, bullets: e.bullets.map((b, j) => (j === bulletIdx ? value : b)) }
          : e,
      ),
    }));

  const removeBullet = (expIdx: number, bulletIdx: number) =>
    setProfile((p) => ({
      ...p,
      experience: p.experience.map((e, i) =>
        i === expIdx ? { ...e, bullets: e.bullets.filter((_, j) => j !== bulletIdx) } : e,
      ),
    }));

  // Link helpers
  const addLink = () =>
    updateAbout('links', [...profile.about.links, { label: 'LinkedIn', href: '' }]);

  const removeLink = (idx: number) =>
    updateAbout(
      'links',
      profile.about.links.filter((_, i) => i !== idx),
    );

  const updateLink = (idx: number, key: keyof ProfileLink, value: string) =>
    updateAbout(
      'links',
      profile.about.links.map((l, i) => (i === idx ? { ...l, [key]: value } : l)),
    );

  const handleSave = () => {
    setSaving(true);
    setSaveError('');
    // Persist client-side: works in dev, web, and the shipped static macOS app
    // (which has no Node server / API route). A false return means the write was
    // blocked (private mode / quota) — stay put and surface the error rather than
    // navigating to a profile page that would read back null.
    const ok = writeBeginnerProfileLocal(profile);
    if (!ok) {
      setSaveError(
        "Couldn't save your profile — your browser is blocking local storage (e.g. private browsing). Try a normal window, then save again.",
      );
      setSaving(false);
      return;
    }
    router.push('/digital-me');
  };

  return (
    <>
      <main className={styles.page}>
        <div className={styles.shell}>
          {/* Eyebrow + title */}
          <div className={styles.eyebrow}>Profile · Setup</div>
          <h1 className={styles.title}>
            Build your{' '}
            <span className={styles.titleAccent}>profile.</span>
          </h1>

          {/* Step progress */}
          <nav aria-label="Wizard steps" className={styles.progress}>
            {STEPS.map((step, i) => (
              <div
                key={step}
                className={[
                  styles.progressStep,
                  i === stepIndex ? styles.progressStepActive : '',
                  i < stepIndex ? styles.progressStepDone : '',
                ].join(' ')}
                aria-current={i === stepIndex ? 'step' : undefined}
              >
                {STEP_LABELS[step]}
              </div>
            ))}
          </nav>

          {/* Step content */}
          <div className={styles.stepContent}>
            {currentStep === 'home' && (
              <HomeStep profile={profile} updateHome={updateHome} hints={homeHints} />
            )}
            {currentStep === 'about' && (
              <AboutStep
                profile={profile}
                updateAbout={updateAbout}
                addLink={addLink}
                removeLink={removeLink}
                updateLink={updateLink}
              />
            )}
            {currentStep === 'education' && (
              <EducationStep
                profile={profile}
                addEducation={addEducation}
                removeEducation={removeEducation}
                updateEducation={updateEducation}
              />
            )}
            {currentStep === 'experience' && (
              <ExperienceStep
                profile={profile}
                addExperience={addExperience}
                removeExperience={removeExperience}
                updateExperience={updateExperience}
                addBullet={addBullet}
                updateBullet={updateBullet}
                removeBullet={removeBullet}
              />
            )}
            {currentStep === 'review' && (
              <ReviewStep profile={profile} />
            )}
          </div>

          {/* Navigation */}
          <div className={styles.navRow}>
            <div className={styles.navLeft}>
              {stepIndex > 0 && (
                <button type="button" className={styles.ghostButton} onClick={goBack}>
                  <ArrowLeft aria-hidden="true" size={13} strokeWidth={1.8} />
                  &nbsp;Back
                </button>
              )}
            </div>
            <div className={styles.navRight}>
              {saveError && (
                <span className={styles.errorNote}>{saveError}</span>
              )}
              {saving && (
                <span className={styles.savingNote}>Saving…</span>
              )}
              {currentStep !== 'review' ? (
                <button type="button" className={styles.primaryButton} onClick={goNextChecked}>
                  Next
                  <ArrowRight aria-hidden="true" size={14} strokeWidth={1.8} />
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={() => void handleSave()}
                  disabled={saving}
                  aria-label="Save profile"
                >
                  {saving ? 'Saving…' : 'Save profile'}
                  {!saving && <ArrowRight aria-hidden="true" size={14} strokeWidth={1.8} />}
                </button>
              )}
            </div>
          </div>

          {/* Mode-switch footer */}
          <div className={styles.modeSwitch}>
            <Link href="/onboarding/profile" className={styles.modeSwitchLink}>
              Prefer a guided chat? →
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}

/* ─── Step sub-components ─────────────────────────────────────────────────── */

function HomeStep({
  profile,
  updateHome,
  hints,
}: {
  profile: BeginnerProfile;
  updateHome: (key: keyof BeginnerProfile['home'], value: string) => void;
  hints?: HomeHints;
}) {
  return (
    <>
      <p className={styles.stepDescription}>
        Your name and headline appear at the top of your public profile page.
      </p>
      <div className={styles.fieldGroup}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="home-name">
            Full name
          </label>
          <input
            id="home-name"
            className={styles.input}
            type="text"
            value={profile.home.name}
            onChange={(e) => updateHome('name', e.target.value)}
            placeholder="Ada Lovelace"
            autoComplete="name"
          />
          {hints?.name && <p className={styles.fieldHint}>{hints.name}</p>}
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="home-headline">
            Headline
          </label>
          <input
            id="home-headline"
            className={styles.input}
            type="text"
            value={profile.home.headline}
            onChange={(e) => updateHome('headline', e.target.value)}
            placeholder="Quant developer · Sydney"
          />
          {hints?.headline && <p className={styles.fieldHint}>{hints.headline}</p>}
        </div>
      </div>
    </>
  );
}

function AboutStep({
  profile,
  updateAbout,
  addLink,
  removeLink,
  updateLink,
}: {
  profile: BeginnerProfile;
  updateAbout: (key: keyof BeginnerProfile['about'], value: unknown) => void;
  addLink: () => void;
  removeLink: (idx: number) => void;
  updateLink: (idx: number, key: keyof ProfileLink, value: string) => void;
}) {
  return (
    <>
      <p className={styles.stepDescription}>
        A short bio and links to your online presence.
      </p>
      <div className={styles.fieldGroup}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="about-summary">
            Summary
          </label>
          <textarea
            id="about-summary"
            className={styles.textarea}
            value={profile.about.summary}
            onChange={(e) => updateAbout('summary', e.target.value)}
            placeholder="I build quantitative models for options markets. Previously at…"
          />
        </div>

        <div className={styles.field}>
          <div className={styles.label}>
            Links
            <span className={styles.labelOptional}>optional</span>
          </div>
          {profile.about.links.map((link, i) => (
            <div key={i} className={styles.linkRow}>
              <select
                aria-label={`Link ${i + 1} label`}
                className={styles.select}
                value={link.label}
                onChange={(e) => updateLink(i, 'label', e.target.value)}
              >
                {LINK_LABEL_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <input
                aria-label={`Link ${i + 1} URL`}
                className={styles.input}
                type="url"
                value={link.href}
                onChange={(e) => updateLink(i, 'href', e.target.value)}
                placeholder="https://linkedin.com/in/you"
              />
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => removeLink(i)}
                aria-label={`Remove link ${i + 1}`}
              >
                <X size={13} strokeWidth={1.8} aria-hidden="true" />
              </button>
            </div>
          ))}
          <button type="button" className={styles.addBtn} onClick={addLink}>
            <Plus size={13} strokeWidth={1.8} aria-hidden="true" />
            Add a link
          </button>
        </div>
      </div>
    </>
  );
}

function EducationStep({
  profile,
  addEducation,
  removeEducation,
  updateEducation,
}: {
  profile: BeginnerProfile;
  addEducation: () => void;
  removeEducation: (idx: number) => void;
  updateEducation: (idx: number, key: keyof EducationEntry, value: string) => void;
}) {
  return (
    <>
      <p className={styles.stepDescription}>
        Add your degrees and qualifications. Start with the most recent.
      </p>
      <div className={styles.cardList}>
        {profile.education.map((edu, i) => (
          <div key={i} className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardIndex}>Education {i + 1}</span>
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => removeEducation(i)}
                aria-label={`Remove education entry ${i + 1}`}
              >
                Remove
              </button>
            </div>

            <div className={styles.fieldGroup}>
              <div className={styles.cardRow}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor={`edu-institution-${i}`}>
                    Institution
                  </label>
                  <input
                    id={`edu-institution-${i}`}
                    className={styles.input}
                    type="text"
                    value={edu.institution}
                    onChange={(e) => updateEducation(i, 'institution', e.target.value)}
                    placeholder="University of Sydney"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor={`edu-qual-${i}`}>
                    Qualification
                  </label>
                  <input
                    id={`edu-qual-${i}`}
                    className={styles.input}
                    type="text"
                    value={edu.qualification}
                    onChange={(e) => updateEducation(i, 'qualification', e.target.value)}
                    placeholder="BSc Mathematics"
                  />
                </div>
              </div>

              <div className={styles.cardRow}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor={`edu-field-${i}`}>
                    Field
                    <span className={styles.labelOptional}>optional</span>
                  </label>
                  <input
                    id={`edu-field-${i}`}
                    className={styles.input}
                    type="text"
                    value={edu.field ?? ''}
                    onChange={(e) => updateEducation(i, 'field', e.target.value)}
                    placeholder="Quantitative Finance"
                  />
                </div>
                <div className={styles.cardRow}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor={`edu-start-${i}`}>
                      Start
                      <span className={styles.labelOptional}>optional</span>
                    </label>
                    <input
                      id={`edu-start-${i}`}
                      className={styles.input}
                      type="text"
                      value={edu.start ?? ''}
                      onChange={(e) => updateEducation(i, 'start', e.target.value)}
                      placeholder="2019"
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor={`edu-end-${i}`}>
                      End
                      <span className={styles.labelOptional}>optional</span>
                    </label>
                    <input
                      id={`edu-end-${i}`}
                      className={styles.input}
                      type="text"
                      value={edu.end ?? ''}
                      onChange={(e) => updateEducation(i, 'end', e.target.value)}
                      placeholder="2022"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button type="button" className={styles.addBtn} onClick={addEducation}>
        <Plus size={13} strokeWidth={1.8} aria-hidden="true" />
        Add {profile.education.length === 0 ? 'an entry' : 'another'}
      </button>
    </>
  );
}

function ExperienceStep({
  profile,
  addExperience,
  removeExperience,
  updateExperience,
  addBullet,
  updateBullet,
  removeBullet,
}: {
  profile: BeginnerProfile;
  addExperience: () => void;
  removeExperience: (idx: number) => void;
  updateExperience: (idx: number, key: keyof ExperienceEntry, value: unknown) => void;
  addBullet: (expIdx: number) => void;
  updateBullet: (expIdx: number, bulletIdx: number, value: string) => void;
  removeBullet: (expIdx: number, bulletIdx: number) => void;
}) {
  return (
    <>
      <p className={styles.stepDescription}>
        Add your work history. Each entry can include bullet points describing what you did.
      </p>
      <div className={styles.cardList}>
        {profile.experience.map((exp, i) => (
          <div key={i} className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardIndex}>Experience {i + 1}</span>
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => removeExperience(i)}
                aria-label={`Remove experience entry ${i + 1}`}
              >
                Remove
              </button>
            </div>

            <div className={styles.fieldGroup}>
              <div className={styles.cardRow}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor={`exp-role-${i}`}>
                    Role
                  </label>
                  <input
                    id={`exp-role-${i}`}
                    className={styles.input}
                    type="text"
                    value={exp.role}
                    onChange={(e) => updateExperience(i, 'role', e.target.value)}
                    placeholder="Quantitative Researcher"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor={`exp-org-${i}`}>
                    Organization
                  </label>
                  <input
                    id={`exp-org-${i}`}
                    className={styles.input}
                    type="text"
                    value={exp.organization}
                    onChange={(e) => updateExperience(i, 'organization', e.target.value)}
                    placeholder="Acme Capital"
                  />
                </div>
              </div>

              <div className={styles.cardRow}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor={`exp-start-${i}`}>
                    Start
                    <span className={styles.labelOptional}>optional</span>
                  </label>
                  <input
                    id={`exp-start-${i}`}
                    className={styles.input}
                    type="text"
                    value={exp.start ?? ''}
                    onChange={(e) => updateExperience(i, 'start', e.target.value || undefined)}
                    placeholder="Jan 2021"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor={`exp-end-${i}`}>
                    End
                    <span className={styles.labelOptional}>optional</span>
                  </label>
                  <input
                    id={`exp-end-${i}`}
                    className={styles.input}
                    type="text"
                    value={exp.end ?? ''}
                    onChange={(e) => updateExperience(i, 'end', e.target.value || undefined)}
                    placeholder="Present"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor={`exp-loc-${i}`}>
                    Location
                    <span className={styles.labelOptional}>optional</span>
                  </label>
                  <input
                    id={`exp-loc-${i}`}
                    className={styles.input}
                    type="text"
                    value={exp.location ?? ''}
                    onChange={(e) =>
                      updateExperience(i, 'location', e.target.value || undefined)
                    }
                    placeholder="Sydney"
                  />
                </div>
              </div>

              {/* Bullets */}
              <div>
                <div className={styles.bulletsLabel}>
                  Highlights
                  <span className={styles.labelOptional}>optional</span>
                </div>
                {exp.bullets.map((bullet, j) => (
                  <div key={j} className={styles.bulletRow}>
                    <span className={styles.bulletDot} aria-hidden="true">·</span>
                    <input
                      aria-label={`Bullet ${j + 1} for experience ${i + 1}`}
                      className={styles.bulletInput}
                      type="text"
                      value={bullet}
                      onChange={(e) => updateBullet(i, j, e.target.value)}
                      placeholder="Built a volatility surface model reducing pricing errors by 40%"
                    />
                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={() => removeBullet(i, j)}
                      aria-label={`Remove bullet ${j + 1}`}
                    >
                      <X size={12} strokeWidth={1.8} aria-hidden="true" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className={styles.addBtn}
                  onClick={() => addBullet(i)}
                  style={{ marginTop: '0.65rem' }}
                >
                  <Plus size={12} strokeWidth={1.8} aria-hidden="true" />
                  Add bullet
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button type="button" className={styles.addBtn} onClick={addExperience}>
        <Plus size={13} strokeWidth={1.8} aria-hidden="true" />
        Add {profile.experience.length === 0 ? 'an entry' : 'another'}
      </button>
    </>
  );
}

function ReviewStep({ profile }: { profile: BeginnerProfile }) {
  return (
    <>
      <p className={styles.stepDescription}>
        Review what you&apos;ve entered. You can go back to edit any section, then save to publish
        your profile pages.
      </p>

      {/* Home */}
      <div className={styles.reviewSection}>
        <div className={styles.reviewSectionTitle}>Home</div>
        {profile.home.name ? (
          <div className={styles.reviewLine}>{profile.home.name}</div>
        ) : (
          <div className={styles.reviewEmpty}>No name entered</div>
        )}
        {profile.home.headline && (
          <div className={`${styles.reviewLine} ${styles.reviewMuted}`}>
            {profile.home.headline}
          </div>
        )}
      </div>

      {/* About */}
      <div className={styles.reviewSection}>
        <div className={styles.reviewSectionTitle}>About</div>
        {profile.about.summary ? (
          <div className={styles.reviewLine}>{profile.about.summary}</div>
        ) : (
          <div className={styles.reviewEmpty}>No summary entered</div>
        )}
        {profile.about.links.length > 0 && (
          <div className={`${styles.reviewLine} ${styles.reviewMuted}`}>
            {profile.about.links.map((l) => l.label).join(' · ')}
          </div>
        )}
      </div>

      {/* Education */}
      <div className={styles.reviewSection}>
        <div className={styles.reviewSectionTitle}>Education</div>
        {profile.education.length === 0 ? (
          <div className={styles.reviewEmpty}>No education entries</div>
        ) : (
          profile.education.map((edu, i) => (
            <div key={i} className={styles.reviewLine}>
              {edu.qualification}
              {edu.institution ? (
                <span className={styles.reviewMuted}> · {edu.institution}</span>
              ) : null}
              {(edu.start || edu.end) && (
                <span className={styles.reviewMuted}>
                  {' '}({[edu.start, edu.end].filter(Boolean).join('–')})
                </span>
              )}
            </div>
          ))
        )}
      </div>

      {/* Experience */}
      <div className={styles.reviewSection}>
        <div className={styles.reviewSectionTitle}>Experience</div>
        {profile.experience.length === 0 ? (
          <div className={styles.reviewEmpty}>No experience entries</div>
        ) : (
          profile.experience.map((exp, i) => (
            <div key={i} className={styles.reviewLine}>
              {exp.role}
              {exp.organization ? (
                <span className={styles.reviewMuted}> · {exp.organization}</span>
              ) : null}
              {(exp.start || exp.end) && (
                <span className={styles.reviewMuted}>
                  {' '}({[exp.start, exp.end].filter(Boolean).join('–')})
                </span>
              )}
              {exp.bullets.length > 0 && (
                <span className={styles.reviewMuted}> — {exp.bullets.length} highlight{exp.bullets.length !== 1 ? 's' : ''}</span>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}
