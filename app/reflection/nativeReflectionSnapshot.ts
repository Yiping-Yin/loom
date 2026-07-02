// Stage 5 (workbench mirror): the web /reflection surface reads the SAME
// typed workspace the native app persists — one schema, no second parser.
// Mirrors macos-app/Loom/Sources/ReflectionModel.swift +
// ReflectionTraceRecord.swift synthesized-Codable JSON exactly.
// Encoder: plain JSONEncoder() (ReflectionWorkspaceStore.save) —
// Date → NUMBER (seconds since 2001-01-01T00:00:00Z), URL → string,
// nil optionals → key absent, no-payload enum case → { "case": {} }.

import type { ReflectionCase, ReflectionSource, ThreadMessage, WorkflowKey } from './reflectionModel';

/** Swift Date reference epoch (2001-01-01T00:00:00Z) in JS milliseconds. */
export const SWIFT_REFERENCE_EPOCH_MS = 978_307_200_000;

export function dateFromSwiftInterval(seconds: number): Date {
  return new Date(SWIFT_REFERENCE_EPOCH_MS + seconds * 1000);
}

export type NativeTraceEvidence = {
  label: string;
  value: string;
};

export type NativeTraceRecord = {
  schemaVersion: number;
  id: string;
  kind: string;
  traceType: string;
  sourceAnchor: string;
  focus: string;
  text: string;
  evidence: NativeTraceEvidence[];
  createdAt?: number;
  legacyItem: string;
};

export type NativeReflectionSource = {
  id: string;
  folder: string;
  label: string;
  kind: string;
  meta: string;
  excerpt: string;
  fileURL?: string;
};

export type NativeReflectionStep = {
  id: string;
  title: string;
  subtitle: string;
  items: string[];
};

export type NativeMessageRole =
  | { human: Record<string, never> }
  | { loom: Record<string, never> };

export type NativeReflectionMessage = {
  id: string;
  role: NativeMessageRole;
  eyebrow: string;
  body: string;
};

export type NativeReflectionCase = {
  id: string;
  title: string;
  project: string;
  status: string;
  updatedAt: string;
  summary: string;
  tags: string[];
  sources: NativeReflectionSource[];
  steps: NativeReflectionStep[];
  messages: NativeReflectionMessage[];
  traceRecords?: NativeTraceRecord[];
};

export type NativeReflectionWorkspaceSnapshot = {
  cases: NativeReflectionCase[];
  selectedCaseID: string;
  selectedSourceID?: string;
  schemaVersion?: number;
  savedAt?: number;
};

export function roleName(role: NativeMessageRole): 'human' | 'loom' {
  return 'human' in role ? 'human' : 'loom';
}

const STEP_ID_TO_KEY: Partial<Record<string, WorkflowKey>> = {
  input: 'input',
  assumption: 'assumption',
  decision: 'decision',
  outcome: 'outcome',
  reflection: 'reflection',
  memory: 'memory',
};

// ReflectionCase.samples steps carry UUID ids (init default), so titles are
// the fallback. normalize() retitles the learning memory step to 'Principle'.
const STEP_TITLE_TO_KEY: Partial<Record<string, WorkflowKey>> = {
  Input: 'input',
  Assumption: 'assumption',
  'Decision Trace': 'decision',
  Outcome: 'outcome',
  Reflection: 'reflection',
  'Judgment Memory': 'memory',
  Principle: 'memory',
};

function workflowKeyForStep(step: NativeReflectionStep): WorkflowKey | null {
  return STEP_ID_TO_KEY[step.id] ?? STEP_TITLE_TO_KEY[step.title] ?? null;
}

export function reflectionCaseFromNative(native: NativeReflectionCase): ReflectionCase {
  const sections: Record<WorkflowKey, string[]> = {
    input: [],
    assumption: [],
    decision: [],
    outcome: [],
    reflection: [],
    memory: [],
  };
  for (const step of native.steps) {
    const key = workflowKeyForStep(step);
    if (key) sections[key] = [...sections[key], ...step.items];
  }
  const sources: ReflectionSource[] = native.sources.map((source) => ({
    id: source.id,
    folder: source.folder,
    label: source.label,
    kind: source.kind,
    meta: source.meta,
    excerpt: source.excerpt,
  }));
  const messages: ThreadMessage[] = native.messages.map((message) => ({
    id: message.id,
    role: roleName(message.role),
    eyebrow: message.eyebrow,
    body: message.body,
  }));
  return {
    id: native.id,
    title: native.title,
    project: native.project,
    status: native.status,
    updatedAt: native.updatedAt,
    summary: native.summary,
    tags: [...native.tags],
    sources,
    sections,
    messages,
  };
}

/** Resolves only inside the native WKWebView (loom:// scheme handler); in a
 *  stock browser the fetch throws synchronously and the caller falls back. */
export async function fetchNativeReflectionSnapshot(): Promise<NativeReflectionWorkspaceSnapshot | null> {
  try {
    const response = await fetch('loom://native/reflection-workspace-snapshot.json');
    if (!response.ok) return null;
    const data = (await response.json()) as NativeReflectionWorkspaceSnapshot;
    if (!data || !Array.isArray(data.cases) || data.cases.length === 0) return null;
    return data;
  } catch {
    return null;
  }
}
