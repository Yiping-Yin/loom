'use client';

import { type NewLoomDraftOutputTypeId } from '../../lib/new-loom/draft-storage';

export type StudioStarterChoice = {
  outputTypeId: NewLoomDraftOutputTypeId;
  blank?: boolean;
};

type StudioStartersProps = {
  userInitial: string;
  onStart: (choice: StudioStarterChoice) => void;
};

/**
 * The four friendly starters map onto real output types behind the scenes, so a
 * normal user never sees the internal type taxonomy.
 */
export const STUDIO_STARTERS: ReadonlyArray<{
  id: string;
  label: string;
  outputTypeId: NewLoomDraftOutputTypeId;
}> = [
  { id: 'experience', label: 'A piece of experience', outputTypeId: 'portfolio-case-study' },
  { id: 'project', label: 'A project', outputTypeId: 'product-story' },
  { id: 'idea', label: 'An idea', outputTypeId: 'course-note' },
  { id: 'else', label: 'Something else', outputTypeId: 'about-section' },
];

/**
 * The calm empty-state entry to the Studio: one heading, one hint, four warm
 * starters, and a "just start writing" escape hatch. No chips, counters, or
 * inspector — the power surface only appears once there is a draft to work on.
 */
export function StudioStarters({ userInitial, onStart }: StudioStartersProps) {
  return (
    <section className="new-loom-draft__starters" aria-label="Add to your Digital Me">
      <div className="new-loom-draft__starters-top">
        <a className="new-loom-draft__home" href="/digital-me">← Digital Me</a>
        <span className="new-loom-draft__starters-avatar" aria-hidden="true">{userInitial}</span>
      </div>
      <div className="new-loom-draft__starters-body">
        <h1 className="new-loom-draft__starters-title">Add to your Digital Me</h1>
        <p className="new-loom-draft__starters-hint">Pick a place to start — or just write.</p>
        <div className="new-loom-draft__starters-grid">
          {STUDIO_STARTERS.map((starter) => (
            <button
              type="button"
              key={starter.id}
              className="new-loom-draft__starter"
              onClick={() => onStart({ outputTypeId: starter.outputTypeId })}
            >
              {starter.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="new-loom-draft__starters-blank"
          onClick={() => onStart({ outputTypeId: 'course-note', blank: true })}
        >
          or just start writing →
        </button>
      </div>
    </section>
  );
}
