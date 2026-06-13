'use client';

export type AiStageId =
  | 'clarify-passage'
  | 'commit-anchor'
  | 'free-recompile'
  | 'rehearsal-transform'
  | 'examiner-question'
  | 'examiner-grade'
  | 'blind-recall-grade'
  | 'ingestion-summary'
  | 'capture-organize'
  | 'cowork-tidy'
  | 'cowork-suggest'
  | 'draft-compose'
  | 'selection-tighten'
  | 'selection-expand'
  | 'selection-rewrite';

export type AiSurfaceId =
  | 'selection'
  | 'free'
  | 'rehearsal'
  | 'examiner'
  | 'ingestion'
  | 'capture'
  | 'draft';

export type AiSurfaceSpec = {
  id: AiSurfaceId;
  title: string;
  launcherTitle: string;
  helper?: string;
  placeholder?: string;
  followupPlaceholder?: string;
  emptyMessage?: string;
};

export type AiStageSpec = {
  id: AiStageId;
  family: AiSurfaceId;
  title: string;
  role: string;
  output: string;
};

const SURFACES: Record<AiSurfaceId, AiSurfaceSpec> = {
  selection: {
    id: 'selection',
    title: 'Clarify one passage',
    launcherTitle: 'Passage chat',
    helper: 'One passage · one answer · one anchor',
    placeholder: 'Clarify one passage…',
    followupPlaceholder: 'Clarify this passage again…',
  },
  free: {
    id: 'free',
    title: 'Ask across your sources',
    launcherTitle: 'Ask Loom',
    helper: 'One free prompt · one live artifact',
    placeholder: 'Ask across your sources…',
  },
  rehearsal: {
    id: 'rehearsal',
    title: 'Deepen from memory',
    launcherTitle: 'Rehearsal',
    helper: '⌘K shape · ⌘S save · Save & ask',
    emptyMessage: 'Pick a doc above and begin the next memory pass.',
  },
  examiner: {
    id: 'examiner',
    title: 'Ask one verifying question',
    launcherTitle: 'Examiner',
    helper: 'One question at a time',
    emptyMessage: 'Pick a doc above to begin one verifying question.',
  },
  ingestion: {
    id: 'ingestion',
    title: 'Add one source',
    launcherTitle: 'Add source',
    helper: 'Drop one source, then let Loom hold the first reader note',
  },
  capture: {
    id: 'capture',
    title: 'Create a reader note',
    launcherTitle: 'Capture',
    helper: 'One source page · one reader note',
    placeholder: 'Start writing, paste rough notes, or drop one source…',
  },
  draft: {
    id: 'draft',
    title: 'Compose a draft',
    launcherTitle: 'Draft',
    helper: 'Source-backed writing · citations stay close',
    placeholder: 'Continue this source-backed draft...',
  },
};

const STAGES: Record<AiStageId, AiStageSpec> = {
  'clarify-passage': {
    id: 'clarify-passage',
    family: 'selection',
    title: SURFACES.selection.title,
    role: 'clarifier',
    output: 'one passage-bound discussion',
  },
  'commit-anchor': {
    id: 'commit-anchor',
    family: 'selection',
    title: 'Commit one anchor',
    role: 'distiller',
    output: 'one anchored understanding',
  },
  'free-recompile': {
    id: 'free-recompile',
    family: 'free',
    title: SURFACES.free.title,
    role: 'recompiler',
    output: 'one free-mode live artifact update',
  },
  'rehearsal-transform': {
    id: 'rehearsal-transform',
    family: 'rehearsal',
    title: SURFACES.rehearsal.title,
    role: 'formatter',
    output: 'one transformed rehearsal fragment',
  },
  'examiner-question': {
    id: 'examiner-question',
    family: 'examiner',
    title: SURFACES.examiner.title,
    role: 'examiner',
    output: 'one probing question',
  },
  'examiner-grade': {
    id: 'examiner-grade',
    family: 'examiner',
    title: 'Grade one answer',
    role: 'verifier',
    output: 'one pass/retry judgment',
  },
  'blind-recall-grade': {
    id: 'blind-recall-grade',
    family: 'examiner',
    title: 'Grade a blind recall',
    role: 'recall-grader',
    output: 'one remembered/misremembered/missed scorecard',
  },
  'ingestion-summary': {
    id: 'ingestion-summary',
    family: 'ingestion',
    title: SURFACES.ingestion.title,
    role: 'ingester',
    output: 'one structured source summary',
  },
  'capture-organize': {
    id: 'capture-organize',
    family: 'capture',
    title: SURFACES.capture.title,
    role: 'organizer',
    output: 'one structured source note rewrite',
  },
  'cowork-tidy': {
    id: 'cowork-tidy',
    family: 'capture',
    title: 'Tidy cowork scratch',
    role: 'formatter',
    output: 'one tidied draft that reformats user scratch without adding content',
  },
  'cowork-suggest': {
    id: 'cowork-suggest',
    family: 'capture',
    title: 'Suggest related library material',
    role: 'recommender',
    output: 'one ranked list of related library docs',
  },
  'draft-compose': {
    id: 'draft-compose',
    family: 'draft',
    title: SURFACES.draft.title,
    role: 'drafting partner',
    output: 'one source-backed draft continuation or edit',
  },
  'selection-tighten': {
    id: 'selection-tighten',
    family: 'capture',
    title: 'Tighten a selection',
    role: 'tightener',
    output: 'one shorter rewrite preserving all claims',
  },
  'selection-expand': {
    id: 'selection-expand',
    family: 'capture',
    title: 'Expand a selection',
    role: 'expander',
    output: 'one longer rewrite with citations from provided context',
  },
  'selection-rewrite': {
    id: 'selection-rewrite',
    family: 'capture',
    title: 'Rewrite a selection',
    role: 'rewriter',
    output: 'one rewrite per user instruction, with citations for any new claims',
  },
};

export function getAiSurface(surface: AiSurfaceId): AiSurfaceSpec {
  return SURFACES[surface];
}

export function getAiStage(stage: AiStageId): AiStageSpec {
  return STAGES[stage];
}
