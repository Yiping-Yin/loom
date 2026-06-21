/**
 * Pure onboarding step logic — the scripted step machine's prompts, progress
 * mapping, total-beat count, and the pure transition function (applyAnswer).
 *
 * Pure module: no React, no CSS import, no next imports. Depends only on the
 * step-machine shape + answer predicates (./chat-gate) and the BeginnerProfile
 * types (../profile/beginner-profile). This is what lets a new cover surface
 * reuse the EXACT same engine, and it keeps the contract tests synchronous —
 * no React/jsdom harness needed.
 *
 * The ConvoStep type, isSkip/isYes, fieldOf/stepKey, and the pure gate decision
 * (decideChatGate) live in ./chat-gate. This module owns only the rendering-
 * agnostic pure helpers (stepPrompt, progressOf, applyAnswer, TOTAL_STEPS) and
 * the pure ChatMessage union.
 */
import {
  type ConvoStep,
  isSkip,
  isYes,
} from './chat-gate';
import {
  type BeginnerProfile,
  type EducationEntry,
  type ExperienceEntry,
  type WorkItem,
} from '../profile/beginner-profile';

export type { ConvoStep };

// ── Chat message types ────────────────────────────────────────────────────────

/** A single bubble in the onboarding transcript. Pure (a plain union). */
export type ChatMessage =
  | { from: 'loom'; text: string }
  | { from: 'user'; text: string };

// ── Step machine ─────────────────────────────────────────────────────────────

export const TOTAL_STEPS = 15; // name + headline + summary + edu(3) + exp(4) + edu_more + exp_more + works(4) ≈ 15 logical beats

export function stepPrompt(step: ConvoStep): string {
  switch (step.id) {
    case 'name':
      return "What's your full name?";
    case 'headline':
      return "Great! Now a one-line headline — what do you do and where? (e.g. Quant developer · Sydney)";
    case 'summary':
      return "Perfect. Write a short bio for your About page — a sentence or two about who you are and what you work on. Or type \"skip\" to leave it for later.";
    case 'edu_institution':
      return step.entryIdx === 0
        ? "Let's add your education. Which institution did you (or do you) attend? (or type \"skip\" to move on)"
        : "Another institution?";
    case 'edu_qualification':
      return "What qualification or degree? (e.g. BSc Mathematics)";
    case 'edu_years':
      return "Start and end years? (e.g. 2019–2022, or just \"2022\", or \"skip\")";
    case 'edu_more':
      return "Add another education entry? (yes / no)";
    case 'exp_role':
      return step.entryIdx === 0
        ? "Now let's add your experience. What was your role or job title? (or type \"skip\" to move on)"
        : "Another role?";
    case 'exp_organization':
      return "Which organisation or company?";
    case 'exp_years':
      return "Dates? (e.g. Jan 2021–Present, or \"skip\")";
    case 'exp_highlight':
      return "One highlight bullet — what did you accomplish or build? (or \"skip\")";
    case 'exp_more':
      return "Add another experience entry? (yes / no)";
    case 'work_title':
      return step.entryIdx === 0
        ? "Now let's add your works or projects. What's the project title? (or type \"skip\" to finish)"
        : "Another project?";
    case 'work_description':
      return "One-line description — what did you build or create? (or \"skip\")";
    case 'work_link':
      return "A link to the project, portfolio, or write-up? (URL or \"skip\")";
    case 'work_more':
      return "Add another project? (yes / no)";
    case 'review':
      return "You're all set! Here's what I have. Hit Save to publish your profile, or go back to the form to edit anything.";
  }
}

export function progressOf(step: ConvoStep): number {
  // Returns a 1-based index out of TOTAL_STEPS for display
  switch (step.id) {
    case 'name': return 1;
    case 'headline': return 2;
    case 'summary': return 3;
    case 'edu_institution': return 4;
    case 'edu_qualification': return 5;
    case 'edu_years': return 6;
    case 'edu_more': return 7;
    case 'exp_role': return 8;
    case 'exp_organization': return 9;
    case 'exp_years': return 10;
    case 'exp_highlight': return 11;
    case 'exp_more': return 11;
    case 'work_title': return 12;
    case 'work_description': return 13;
    case 'work_link': return 14;
    case 'work_more': return 14;
    case 'review': return TOTAL_STEPS;
  }
}

/**
 * Pure, exported transition function. Takes the current profile + step + user
 * answer and returns { next: ConvoStep, profile: BeginnerProfile }.
 *
 * This is unit-tested directly via applyAnswer in tests/onboarding-steps.test.ts
 * and tests/conversational-onboarding.test.tsx.
 */
export function applyAnswer(
  profile: BeginnerProfile,
  step: ConvoStep,
  answer: string,
): { next: ConvoStep; profile: BeginnerProfile } {
  const trimmed = answer.trim();

  switch (step.id) {
    case 'name': {
      const next: BeginnerProfile = {
        ...profile,
        home: { ...profile.home, name: trimmed },
      };
      return { next: { id: 'headline' }, profile: next };
    }
    case 'headline': {
      const next: BeginnerProfile = {
        ...profile,
        home: { ...profile.home, headline: trimmed },
      };
      return { next: { id: 'summary' }, profile: next };
    }
    case 'summary': {
      const summary = isSkip(trimmed) ? profile.about.summary : trimmed;
      const next: BeginnerProfile = {
        ...profile,
        about: { ...profile.about, summary },
      };
      return { next: { id: 'edu_institution', entryIdx: 0 }, profile: next };
    }
    case 'edu_institution': {
      if (isSkip(trimmed)) {
        return { next: { id: 'exp_role', entryIdx: 0 }, profile };
      }
      // Start a new education entry. Index the just-appended slot rather than
      // step.entryIdx — on a returning/pre-populated profile the new entry lands
      // at the end of an already-populated array, not at index 0.
      const edu: EducationEntry = { institution: trimmed, qualification: '' };
      const education = [...profile.education, edu];
      const next: BeginnerProfile = { ...profile, education };
      return {
        next: { id: 'edu_qualification', entryIdx: education.length - 1 },
        profile: next,
      };
    }
    case 'edu_qualification': {
      const idx = step.entryIdx;
      const updated = profile.education.map((e, i) =>
        i === idx ? { ...e, qualification: trimmed } : e,
      );
      return {
        next: { id: 'edu_years', entryIdx: idx },
        profile: { ...profile, education: updated },
      };
    }
    case 'edu_years': {
      const idx = step.entryIdx;
      const yearsStr = isSkip(trimmed) ? '' : trimmed;
      // Parse "2019–2022", "2019-2022", or single year
      const parts = yearsStr.split(/[–—-]/).map((p) => p.trim());
      const start = parts[0] || undefined;
      const end = parts[1] || undefined;
      const updated = profile.education.map((e, i) =>
        i === idx ? { ...e, start, end } : e,
      );
      return { next: { id: 'edu_more' }, profile: { ...profile, education: updated } };
    }
    case 'edu_more': {
      if (isYes(trimmed)) {
        const nextIdx = profile.education.length;
        return { next: { id: 'edu_institution', entryIdx: nextIdx }, profile };
      }
      return { next: { id: 'exp_role', entryIdx: 0 }, profile };
    }
    case 'exp_role': {
      if (isSkip(trimmed)) {
        // Skipping experience must still let a user (e.g. a student with
        // projects but no jobs) reach the Works section, not jump to review.
        return { next: { id: 'work_title', entryIdx: 0 }, profile };
      }
      const exp: ExperienceEntry = { role: trimmed, organization: '', bullets: [] };
      const experience = [...profile.experience, exp];
      const next: BeginnerProfile = { ...profile, experience };
      return {
        next: { id: 'exp_organization', entryIdx: experience.length - 1 },
        profile: next,
      };
    }
    case 'exp_organization': {
      const idx = step.entryIdx;
      const updated = profile.experience.map((e, i) =>
        i === idx ? { ...e, organization: trimmed } : e,
      );
      return {
        next: { id: 'exp_years', entryIdx: idx },
        profile: { ...profile, experience: updated },
      };
    }
    case 'exp_years': {
      const idx = step.entryIdx;
      const yearsStr = isSkip(trimmed) ? '' : trimmed;
      const parts = yearsStr.split(/[–—-]/).map((p) => p.trim());
      const start = parts[0] || undefined;
      // Preserve "Present" if it was part of the answer
      const endRaw = parts.slice(1).join('-').trim();
      const end = endRaw || undefined;
      const updated = profile.experience.map((e, i) =>
        i === idx ? { ...e, start, end } : e,
      );
      return {
        next: { id: 'exp_highlight', entryIdx: idx },
        profile: { ...profile, experience: updated },
      };
    }
    case 'exp_highlight': {
      const idx = step.entryIdx;
      const bullets = isSkip(trimmed) ? [] : [trimmed];
      const updated = profile.experience.map((e, i) =>
        i === idx ? { ...e, bullets: [...e.bullets, ...bullets] } : e,
      );
      return {
        next: { id: 'exp_more' },
        profile: { ...profile, experience: updated },
      };
    }
    case 'exp_more': {
      if (isYes(trimmed)) {
        const nextIdx = profile.experience.length;
        return { next: { id: 'exp_role', entryIdx: nextIdx }, profile };
      }
      return { next: { id: 'work_title', entryIdx: 0 }, profile };
    }
    case 'work_title': {
      if (isSkip(trimmed)) {
        return { next: { id: 'review' }, profile };
      }
      const work: WorkItem = { title: trimmed };
      const works = [...profile.works, work];
      const next: BeginnerProfile = { ...profile, works };
      return {
        next: { id: 'work_description', entryIdx: works.length - 1 },
        profile: next,
      };
    }
    case 'work_description': {
      const idx = step.entryIdx;
      const description = isSkip(trimmed) ? undefined : trimmed;
      const updated = profile.works.map((w, i) =>
        i === idx ? { ...w, description } : w,
      );
      return {
        next: { id: 'work_link', entryIdx: idx },
        profile: { ...profile, works: updated },
      };
    }
    case 'work_link': {
      const idx = step.entryIdx;
      const link = isSkip(trimmed) ? undefined : trimmed;
      const updated = profile.works.map((w, i) =>
        i === idx ? { ...w, link } : w,
      );
      return {
        next: { id: 'work_more' },
        profile: { ...profile, works: updated },
      };
    }
    case 'work_more': {
      if (isYes(trimmed)) {
        const nextIdx = profile.works.length;
        return { next: { id: 'work_title', entryIdx: nextIdx }, profile };
      }
      return { next: { id: 'review' }, profile };
    }
    case 'review':
      // No further transitions from review — caller handles save
      return { next: { id: 'review' }, profile };
  }
}
