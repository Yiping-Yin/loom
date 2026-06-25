/**
 * Draft the prose layer of a course from its woven files — the "you only edit" step.
 *
 * Once the files are woven into weeks + problem sets, a beginner still faces blank
 * focus / question / output / claim fields. This fills them with grounded first drafts
 * (anchored in the real file topics), so the user edits instead of writing from zero.
 *
 * It is heuristic + offline by design (works with no LLM key). When a key is configured
 * the same shape can be produced by the model for richer drafts; the fields and the
 * "never clobber a user edit" contract stay identical.
 */

import { type CourseRecord } from './course-storage';
import { type WovenFile } from './auto-weave';

function stem(name: string): string {
  return name.replace(/\.[a-z0-9]+$/i, '').trim();
}

/** The human topic of a week/PS: the first lecture file, stripped of its "W1 A " prefix. */
function topicOf(files: WovenFile[]): string {
  const lead = files.find((f) => f.role === 'lecture') ?? files[0];
  if (!lead) return '';
  return stem(lead.name)
    .replace(/^W\d+\s+[A-Za-z]\s+/i, '') // "W1 A Elements Logic" → "Elements Logic"
    .replace(/^(?:problem\s*set|PS|problem)\s*\d+\s*[:-]?\s*/i, '')
    .trim();
}

export function draftCourse(course: CourseRecord): CourseRecord {
  const weeks = (course.weeks ?? []).map((w) => {
    const topic = topicOf(w.files) || w.label;
    return {
      ...w,
      focus: w.focus || topic,
      question:
        w.question ||
        `What does ${topic} establish, and how does it carry into the rest of the course?`,
      output: w.output || `Worked understanding of ${topic}, ready to apply in the problem sets.`,
    };
  });

  const problemSets = (course.problemSets ?? []).map((p) => ({
    ...p,
    claim:
      p.claim ||
      `${p.label} turns the course's definitions into worked, inspectable answers — visible proof of reasoning, not just stored files.`,
  }));

  const topics = weeks.map((w) => w.focus).filter((t): t is string => Boolean(t));
  const span =
    topics.length >= 2
      ? `${topics[0]} to ${topics[topics.length - 1]}`
      : topics[0] ?? 'the fundamentals';
  const n = problemSets.length;
  const draftedOverview = `${[course.code, course.name].filter(Boolean).join(' · ')} builds from ${span}, evidenced week by week and proven through ${n} problem set${n === 1 ? '' : 's'}.`;
  const overview = course.overview?.trim()
    ? course.overview
    : weeks.length || n
      ? draftedOverview
      : '';

  return { ...course, overview, weeks, problemSets };
}
