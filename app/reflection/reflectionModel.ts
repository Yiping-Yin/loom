export type WorkflowKey =
  | 'input'
  | 'assumption'
  | 'decision'
  | 'outcome'
  | 'reflection'
  | 'memory';

export type ReflectionSource = {
  id: string;
  folder: string;
  label: string;
  kind: string;
  meta: string;
  excerpt: string;
  mimeType?: string;
  localPreviewUrl?: string;
  localFile?: File;
};

export type WorkspaceMode = 'reflection' | 'reader';

export type ThreadMessage = {
  id: string;
  role: 'human' | 'loom';
  eyebrow: string;
  body: string;
};

export type UnderstandingVersion = {
  id: string;
  number: string;
  title: string;
  state: string;
  material: string;
  anchor: string;
  audit: string[];
  accent?: boolean;
};

export type GroundingRow = {
  label: string;
  value: string;
};

export type CommitTarget = {
  key: WorkflowKey;
  label: string;
  helper: string;
  placeholder: string;
  buttonLabel: string;
};

export type ReflectionCase = {
  id: string;
  title: string;
  project: string;
  status: string;
  updatedAt: string;
  summary: string;
  tags: string[];
  sources: ReflectionSource[];
  sections: Record<WorkflowKey, string[]>;
  messages: ThreadMessage[];
};

export const TEXT_FILE_PATTERN =
  /\.(txt|md|mdx|markdown|csv|json|html?|css|js|jsx|ts|tsx|swift|py|rb|java|c|cpp|h|hpp|go|rs|sql|ya?ml|xml|rtf)$/i;

const LEARNING_EVIDENCE_MARKER = '\nEvidence:';

export const WORKFLOW: Array<{ key: WorkflowKey; label: string; description: string }> = [
  { key: 'input', label: 'Input', description: 'What actually happened' },
  { key: 'assumption', label: 'Assumption', description: 'What had to be true' },
  { key: 'decision', label: 'Decision Trace', description: 'Why this path won' },
  { key: 'outcome', label: 'Outcome', description: 'What reality returned' },
  { key: 'reflection', label: 'Reflection', description: 'What changed in judgment' },
  { key: 'memory', label: 'Judgment Memory', description: 'What should be reused' },
];

export const WORKFLOW_BY_KEY = Object.fromEntries(
  WORKFLOW.map((item) => [item.key, item]),
) as Record<WorkflowKey, { key: WorkflowKey; label: string; description: string }>;

export function commitTargetForCase(reflectionCase: ReflectionCase): CommitTarget {
  if (reflectionCase.project === 'Learning pass') {
    return {
      key: 'input',
      label: 'Add understanding',
      helper: 'meaning / question / correction / principle',
      placeholder: 'Add one meaning, question, correction, or principle...',
      buttonLabel: 'Commit',
    };
  }

  const nextStep = WORKFLOW.find((step) => reflectionCase.sections[step.key].length === 0) ?? WORKFLOW[0]!;
  return {
    key: nextStep.key,
    label: `${nextStep.label} version`,
    helper: `target: ${nextStep.label}`,
    placeholder:
      nextStep.key === 'input'
        ? 'Paste a product event, user reaction, decision, or launch result...'
        : `Commit the next ${nextStep.label.toLowerCase()}...`,
    buttonLabel: 'Commit',
  };
}

export function formatLearningCommit(text: string, sourceAnchor: string) {
  const lower = text.toLowerCase();
  const focus =
    lower.startsWith('principle:') || lower.startsWith('memory:') || lower.startsWith('原则')
      ? 'principle'
      : lower.startsWith('correction:') ||
          lower.startsWith('correct:') ||
          lower.startsWith('修正') ||
          lower.startsWith('纠正')
        ? 'correction'
        : lower.startsWith('question:') ||
            lower.startsWith('问题') ||
            text.includes('?') ||
            text.includes('？')
          ? 'question'
          : 'user meaning';

  return `Captured user trace from ${sourceAnchor} [${focus}]: ${text}`;
}

export function cleanVersionMaterial(value: string) {
  return value
    .replace(/^(principle|memory|correction|correct|question|meaning|translation)[:：]\s*/i, '')
    .replace(/^(原则|记忆|修正|纠正|问题|意思|含义|翻译)[:：]?\s*/i, '')
    .trim();
}

function parseLearningEvidence(value: string) {
  return value
    .split(';')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => {
      const [label, ...rest] = segment.split('=');
      return {
        label: String(label ?? '').trim().toLowerCase(),
        value: rest.join('=').trim(),
      };
    })
    .filter((entry) => entry.label && entry.value)
    .map((entry) => `${entry.label}: ${entry.value}`);
}

function prioritizeLearningEvidence(items: string[]) {
  const priorityPrefixes = [
    'anchor precision:',
    'anchor note:',
    'path:',
    'page:',
    'cell:',
    'file:',
    'app:',
    'window:',
    'kind:',
    'bundle:',
    'captured at:',
  ];

  return items
    .map((item, index) => ({ item, index }))
    .sort((left, right) => {
      const leftPriority = priorityPrefixes.findIndex((prefix) => left.item.startsWith(prefix));
      const rightPriority = priorityPrefixes.findIndex((prefix) => right.item.startsWith(prefix));
      const normalizedLeft = leftPriority === -1 ? priorityPrefixes.length : leftPriority;
      const normalizedRight = rightPriority === -1 ? priorityPrefixes.length : rightPriority;
      if (normalizedLeft !== normalizedRight) return normalizedLeft - normalizedRight;
      return left.index - right.index;
    })
    .map(({ item }) => item);
}

export function auditValue(audit: string[], label: string) {
  const prefix = `${label.toLowerCase()}:`;
  return audit
    .find((line) => line.toLowerCase().startsWith(prefix))
    ?.slice(prefix.length)
    .trim();
}

export function groundingRowsForVersion(version: UnderstandingVersion): GroundingRow[] {
  return [
    { label: 'anchor', value: version.anchor },
    { label: 'precision', value: auditValue(version.audit, 'anchor precision') ?? '' },
    { label: 'evidence rung', value: auditValue(version.audit, 'evidence rung') ?? '' },
    { label: 'note', value: auditValue(version.audit, 'anchor note') ?? '' },
    { label: 'fallback', value: auditValue(version.audit, 'fallback note') ?? '' },
    { label: 'native tool', value: auditValue(version.audit, 'native tool') ?? '' },
    { label: 'language pair', value: auditValue(version.audit, 'language pair') ?? '' },
    { label: 'visual extraction', value: auditValue(version.audit, 'visual extraction') ?? '' },
    { label: 'visual precision', value: auditValue(version.audit, 'visual precision') ?? '' },
    { label: 'pass', value: auditValue(version.audit, 'pass') ?? '' },
    { label: 'focus', value: auditValue(version.audit, 'focus') ?? '' },
    { label: 'state', value: version.state },
  ].filter((row) => row.value);
}

function splitLearningEvidence(value: string) {
  const markerIndex = value.indexOf(LEARNING_EVIDENCE_MARKER);
  if (markerIndex === -1) {
    return { content: value, evidence: [] as string[] };
  }

  return {
    content: value.slice(0, markerIndex),
    evidence: parseLearningEvidence(value.slice(markerIndex + LEARNING_EVIDENCE_MARKER.length)),
  };
}

function learningVersionFromLine(line: string, index: number): UnderstandingVersion {
  const captured = line.match(/^Captured (.+?) from (.+?) \[(.+?)\]\s*([:.])?\s*([\s\S]+)$/);
  if (captured) {
    const [, traceType, source, focus, , rawText] = captured;
    const evidenceSplit = splitLearningEvidence(rawText ?? '');
    const supportingEvidence = prioritizeLearningEvidence(evidenceSplit.evidence);
    const title = focus.includes('vocabulary')
      ? 'Selected word'
      : focus.includes('phrase')
        ? 'Selected phrase'
        : focus.includes('sentence')
          ? 'Selected sentence'
          : focus.includes('passage')
            ? 'Selected passage'
            : focus.includes('data')
              ? 'Selected data'
              : focus.includes('translation')
                ? 'Native translation'
                : focus === 'question'
                  ? 'Question'
                  : focus === 'correction'
                    ? 'Correction'
                    : focus === 'principle'
                      ? 'Principle'
                      : 'User meaning';
    const needsMeaning = /vocabulary|phrase|sentence|passage|data|document|text|file/.test(focus);
    return {
      id: `learning-${index}-${line}`,
      number: `v${index + 1}`,
      title,
      state: focus === 'principle' ? 'memory candidate' : focus === 'question' ? 'open question' : needsMeaning ? 'needs meaning' : 'committed',
      material: cleanVersionMaterial(evidenceSplit.content || line),
      anchor: source ?? 'Original file',
      audit: [`type: ${traceType}`, `focus: ${focus}`, ...supportingEvidence, `raw: ${line}`],
      accent: focus === 'principle',
    };
  }

  return {
    id: `learning-${index}-${line}`,
    number: `v${index + 1}`,
    title: line.startsWith('Opened ') || line.startsWith('Imported ') ? 'Source anchor' : 'Learning record',
    state: line.startsWith('Opened ') || line.startsWith('Imported ') ? 'source preserved' : 'committed',
    material: line,
    anchor: 'Original file',
    audit: [`raw: ${line}`],
  };
}

function learningReviewVersionFromLine(line: string, index: number, phase: 'review' | 'memory'): UnderstandingVersion {
  return {
    id: `learning-${phase}-${index}-${line}`,
    number: `v${index + 1}`,
    title: phase === 'memory' ? 'Reusable principle' : 'Second-pass review',
    state: phase === 'memory' ? 'memory candidate' : 'synthesis draft',
    material: cleanVersionMaterial(line),
    anchor: phase === 'memory' ? 'Reuse after review' : 'Review path',
    audit: [`phase: ${phase}`, `raw: ${line}`],
    accent: true,
  };
}

export function understandingVersionsFromCase(reflectionCase: ReflectionCase): UnderstandingVersion[] {
  if (reflectionCase.project === 'Learning pass') {
    const capturedLines = reflectionCase.sections.input.filter((line) => line.startsWith('Captured '));
    const versions = [
      ...capturedLines.map((line, index) => learningVersionFromLine(line, index)),
      ...reflectionCase.sections.reflection.map((line, index) =>
        learningReviewVersionFromLine(line, capturedLines.length + index, 'review'),
      ),
      ...reflectionCase.sections.memory.map((line, index) =>
        learningReviewVersionFromLine(
          line,
          capturedLines.length + reflectionCase.sections.reflection.length + index,
          'memory',
        ),
      ),
    ];
    return versions.map((version, index) => ({ ...version, number: `v${index + 1}` }));
  }

  const rows: UnderstandingVersion[] = [];
  WORKFLOW.forEach((step) => {
    reflectionCase.sections[step.key].forEach((line) => {
      rows.push({
        id: `${step.key}-${rows.length}-${line}`,
        number: `v${rows.length + 1}`,
        title: step.label,
        state: step.key === 'memory' ? 'memory candidate' : 'committed',
        material: line,
        anchor: step.description,
        audit: [`stage: ${step.label}`, `source: ${reflectionCase.title}`],
        accent: step.key === 'reflection' || step.key === 'memory',
      });
    });
  });
  return rows;
}

export function latestLearningAnchor(reflectionCase: ReflectionCase, activeSource: ReflectionSource | null) {
  const learningVersions = understandingVersionsFromCase(reflectionCase);
  const unresolvedAnchor = [...learningVersions]
    .reverse()
    .find((version) => {
      return (
        version.state === 'needs meaning' ||
        version.state === 'needs interpretation' ||
        version.title.startsWith('Selected')
      );
    })?.anchor;

  return unresolvedAnchor || activeSource?.label || reflectionCase.sources[0]?.label || 'Original file';
}

export function currentEvidenceVersion(
  reflectionCase: ReflectionCase,
  activeVersionId?: string | null,
): UnderstandingVersion | null {
  const versions = understandingVersionsFromCase(reflectionCase);
  if (activeVersionId) {
    return versions.find((version) => version.id === activeVersionId) ?? versions.at(-1) ?? null;
  }
  return versions.at(-1) ?? null;
}

export const LEARNING_CASES: ReflectionCase[] = [
  {
    id: 'pdf-learning-week-1-notes',
    title: 'Week 1 Notes.pdf',
    project: 'Learning pass',
    status: 'Second pass ready',
    updatedAt: 'learning',
    summary: 'Native PDF reading kept Preview primary while Loom captured meaning versions.',
    tags: ['learning', 'pdf', 'native'],
    sources: [
      {
        id: 'week-1-notes-pdf',
        folder: 'Original file',
        label: 'Week 1 Notes.pdf',
        kind: 'pdf',
        meta: 'page 1',
        excerpt:
          'An Introduction to Trading 1.1 The Big Picture. In modern times, trading of financial instruments is primarily done through code.',
      },
    ],
    sections: {
      input: [
        'Opened original file for learning: Week 1 Notes.pdf.',
        'First language pass: keep the original file surface primary and capture vocabulary, pronunciation, phrases, sentence meaning, grammar, questions, concepts, and page context as anchored traces.',
        'Captured PDF passage from Week 1 Notes.pdf, page 1 [sentence meaning]: An Introduction to Trading 1.1 The Big Picture In modern times, trading of financial instruments is primarily done through the execution of code.\nEvidence: app=Preview; window=Week 1 Notes.pdf Page 1; kind=pdf; file=Week 1 Notes.pdf; page=1; bundle=com.apple.Preview; anchor precision=file+page; evidence rung=selected text + file + page',
        'Captured PDF passage from Week 1 Notes.pdf, page 1 [phrase meaning]: trading of\nEvidence: app=Preview; window=Week 1 Notes.pdf Page 1; kind=pdf; file=Week 1 Notes.pdf; page=1; bundle=com.apple.Preview; anchor precision=file+page; evidence rung=selected text + file + page',
        'Captured native translation from Week 1 Notes.pdf, page 2 [translation receipt]: Financial markets -> 金融市场. User meaning: markets where financial assets are issued, traded, and priced.\nEvidence: app=Preview; window=Week 1 Notes.pdf Page 2; kind=pdf; file=Week 1 Notes.pdf; page=2; native tool=macOS Translate; language pair=en-US->zh-Hans; visual extraction=appshot OCR candidate; anchor precision=file+page; evidence rung=selected text + file + page + appshot; visual precision=visual context only',
        'Captured user trace from Week 1 Notes.pdf, page 1 [user meaning]: Meaning confirmed trading of is the current concept to explain in your own words before promoting it to reusable memory.',
      ],
      assumption: [
        'First-pass learning is not final understanding; raw captures need review before they become reusable thinking.',
      ],
      decision: [
        'Kept the original PDF surface primary and used Loom only to commit anchored traces from Week 1 Notes.pdf.',
      ],
      outcome: [
        'Captured sentence, phrase, and user-confirmed meaning versions without replacing Preview.',
      ],
      reflection: [
        'Second-pass synthesis should review captured meanings, then separate language understanding from domain knowledge.',
      ],
      memory: [
        'Reuse this pattern: original file activity -> anchored learning trace -> second-pass synthesis -> reusable memory.',
      ],
    },
    messages: [
      {
        id: 'pdf-learning-m1',
        role: 'loom',
        eyebrow: 'Loom sidecar',
        body:
          'Read in the native file surface first. Use Loom only to capture anchored meanings, questions, or concepts that should survive the reading pass.',
      },
    ],
  },
  {
    id: 'word-learning-notes',
    title: 'Loom Word Learning Notes.docx',
    project: 'Learning pass',
    status: 'Second pass ready',
    updatedAt: 'learning',
    summary: 'Native Word reading captured a document meaning version without replacing Word.',
    tags: ['learning', 'word', 'native'],
    sources: [
      {
        id: 'word-learning-source',
        folder: 'Original file',
        label: 'Loom Word Learning Notes.docx',
        kind: 'document',
        meta: 'document selection',
        excerpt: 'The key sentence I want to remember from this document.',
      },
    ],
    sections: {
      input: [
        'Opened original file for learning: Loom Word Learning Notes.docx.',
        'First language pass: keep the original file surface primary and capture document meaning as anchored traces.',
        'Captured document selection from Loom Word Learning Notes.docx [document meaning]: The key sentence I want to remember from this document.\nEvidence: app=Microsoft Word; window=Loom Word Learning Notes.docx; kind=document; file=Loom Word Learning Notes.docx; bundle=com.microsoft.Word; anchor precision=file; evidence rung=selected text + file',
      ],
      assumption: ['A document selection becomes useful only when the user later confirms its meaning.'],
      decision: ['Kept Word primary and used Loom as the external learning trail.'],
      outcome: ['Captured one document meaning version anchored to the original file.'],
      reflection: ['Document meaning should be reviewed before becoming memory.'],
      memory: ['Word stays Word; Loom keeps the understanding trail beside it.'],
    },
    messages: [
      {
        id: 'word-learning-m1',
        role: 'loom',
        eyebrow: 'Loom sidecar',
        body: 'The original document remains the source of work. Loom records what changed in understanding.',
      },
    ],
  },
  {
    id: 'excel-learning-table',
    title: 'Loom Excel Learning Table.csv',
    project: 'Learning pass',
    status: 'Second pass ready',
    updatedAt: 'learning',
    summary: 'Native spreadsheet reading captured selected data as an interpretable version.',
    tags: ['learning', 'excel', 'native'],
    sources: [
      {
        id: 'excel-learning-source',
        folder: 'Original file',
        label: 'Loom Excel Learning Table.csv',
        kind: 'spreadsheet',
        meta: 'selected cells',
        excerpt: 'Metric\tValue\nActivation\t42%\nRetention\t31%',
      },
    ],
    sections: {
      input: [
        'Opened original file for learning: Loom Excel Learning Table.csv.',
        'Data reading pass: keep the original spreadsheet primary and capture selected cells as anchored traces.',
        'Captured spreadsheet cells from Loom Excel Learning Table.csv [data meaning]: Metric\tValue\nActivation\t42%\nRetention\t31%\nEvidence: app=Microsoft Excel; window=Loom Excel Learning Table.csv; kind=spreadsheet; file=Loom Excel Learning Table.csv; bundle=com.microsoft.Excel; anchor precision=file+cell; evidence rung=selected text + file + cell',
      ],
      assumption: ['Spreadsheet values are not understanding until the user states what the selected cells mean.'],
      decision: ['Kept Excel primary and used Loom only to capture selected data meaning.'],
      outcome: ['Captured one data meaning version anchored to the spreadsheet.'],
      reflection: ['Second pass should ask what changed in interpretation, not just store the table.'],
      memory: ['Excel stays Excel; Loom preserves the versioned interpretation of selected cells.'],
    },
    messages: [
      {
        id: 'excel-learning-m1',
        role: 'loom',
        eyebrow: 'Loom sidecar',
        body: 'The spreadsheet remains the working surface. Loom records what the selected data came to mean.',
      },
    ],
  },
];

export const INITIAL_CASES: ReflectionCase[] = [
  ...LEARNING_CASES,
  {
    id: 'activation-empty-state',
    title: 'Onboarding empty-state drop',
    project: 'LOOM / first session',
    status: 'In reflection',
    updatedAt: '18:41',
    summary: 'A first-run user reached Sources, added nothing, and left before opening Studio.',
    tags: ['activation', 'first-run', 'evidence'],
    sources: [
      {
        id: 'feedback-note',
        folder: 'Input',
        label: 'User feedback note',
        kind: 'feedback',
        meta: '2 quotes',
        excerpt:
          'The user understood that files could be added, but did not understand what a good first file should be.',
      },
      {
        id: 'session-path',
        folder: 'Input',
        label: 'First session path',
        kind: 'trace',
        meta: '4 events',
        excerpt: 'Open app -> Sources -> empty shelf -> Help -> quit. No source imported.',
      },
      {
        id: 'decision-record',
        folder: 'Decision Trace',
        label: 'Entry copy decision',
        kind: 'decision',
        meta: '1 note',
        excerpt:
          'We chose to keep the first screen minimal, assuming the user already had a file in mind.',
      },
      {
        id: 'activation-result',
        folder: 'Outcome',
        label: 'Activation result',
        kind: 'metric',
        meta: 'local sample',
        excerpt: 'Three test sessions reached Sources. Only one imported a file without prompting.',
      },
    ],
    sections: {
      input: [
        'The real material is a failed first session, not a feature request.',
        'The user reached the correct surface but did not know what action had value.',
      ],
      assumption: [
        'If the product exposes Add files clearly, the next step will be obvious.',
        'A sparse interface reduces confusion for a first-run user.',
      ],
      decision: [
        'We removed explanatory onboarding and made Sources the first working surface.',
        'Evidence: repeated complaints about heavy first-run copy in earlier builds.',
      ],
      outcome: ['The screen looked cleaner, but the first useful action was still underspecified.'],
      reflection: [
        'Clean UI was not the same as clear intent. The first action needs a concrete example from the user context.',
      ],
      memory: [
        'For first-run product surfaces, reduce chrome only after the primary action has a meaningful object.',
      ],
    },
    messages: [
      {
        id: 'm1',
        role: 'human',
        eyebrow: 'Material',
        body:
          'User entered Sources, saw an empty shelf, opened Help, then quit. The UI was clean but did not create momentum.',
      },
      {
        id: 'm2',
        role: 'loom',
        eyebrow: 'Loom reflection',
        body:
          'The failure is not missing explanation. The hidden assumption is that an empty source shelf still communicates a useful first move.',
      },
    ],
  },
  {
    id: 'pricing-test',
    title: 'Pricing page trust test',
    project: 'Public site',
    status: 'Needs outcome',
    updatedAt: '16:12',
    summary: 'A simplified pricing page increased clicks but reduced qualified conversations.',
    tags: ['pricing', 'trust', 'conversion'],
    sources: [
      {
        id: 'pricing-screenshot',
        folder: 'Input',
        label: 'Pricing screenshot',
        kind: 'screenshot',
        meta: 'before / after',
        excerpt: 'The simplified page made the price visible earlier and removed most qualifying detail.',
      },
      {
        id: 'sales-feedback',
        folder: 'Outcome',
        label: 'Sales feedback',
        kind: 'feedback',
        meta: '3 notes',
        excerpt:
          'More visitors clicked the call-to-action, but the conversations started with lower understanding.',
      },
    ],
    sections: {
      input: ['The pricing page was shortened to make the offer easier to scan.'],
      assumption: ['Less detail would reduce anxiety and increase qualified intent.'],
      decision: ['We prioritized CTA clarity over qualification detail.'],
      outcome: ['Clicks rose, but qualified conversations weakened.'],
      reflection: ['Reducing friction also removed useful self-selection.'],
      memory: ['For high-trust products, compression must preserve qualification cues.'],
    },
    messages: [
      {
        id: 'm3',
        role: 'human',
        eyebrow: 'Decision',
        body: 'We removed the comparison table because it made the page feel heavy.',
      },
      {
        id: 'm4',
        role: 'loom',
        eyebrow: 'Judgment check',
        body: 'The decision optimized for click clarity, but the outcome should be judged against conversation quality.',
      },
    ],
  },
  {
    id: 'answer-grounding',
    title: 'Cited answer grounding',
    project: 'AI answer surface',
    status: 'Memory ready',
    updatedAt: '11:05',
    summary: 'A polished generated answer looked convincing until source attribution was visible.',
    tags: ['attribution', 'answer', 'trust'],
    sources: [
      {
        id: 'answer-draft',
        folder: 'Input',
        label: 'Generated answer draft',
        kind: 'draft',
        meta: '1 answer',
        excerpt: 'The answer made three confident claims, but only one claim had a direct source.',
      },
      {
        id: 'citation-review',
        folder: 'Reflection',
        label: 'Citation review',
        kind: 'review',
        meta: '3 claims',
        excerpt: 'Attribution changed the evaluation from fluent to inspectable.',
      },
    ],
    sections: {
      input: ['A generated answer sounded ready before citation review.'],
      assumption: ['Fluency would roughly correlate with source support.'],
      decision: ['We kept the answer but exposed source coverage beside it.'],
      outcome: ['Unsupported claims became obvious immediately.'],
      reflection: ['Trust improved when answer quality became inspectable, not when copy became smoother.'],
      memory: ['For AI output, the minimum viable unit is claim plus source, not answer text.'],
    },
    messages: [
      {
        id: 'm5',
        role: 'human',
        eyebrow: 'Observation',
        body: 'The answer was good prose, but I could not tell which parts were earned.',
      },
      {
        id: 'm6',
        role: 'loom',
        eyebrow: 'Judgment memory',
        body: 'Do not evaluate generated work as text alone. Evaluate the claim-source pair.',
      },
    ],
  },
];

export function cloneCase(value: ReflectionCase): ReflectionCase {
  return {
    ...value,
    tags: [...value.tags],
    sources: value.sources.map((source) => ({ ...source })),
    sections: Object.fromEntries(
      Object.entries(value.sections).map(([key, lines]) => [key, [...lines]]),
    ) as Record<WorkflowKey, string[]>,
    messages: value.messages.map((message) => ({ ...message })),
  };
}

export function makeBlankReflectionCase(now: Date = new Date()): ReflectionCase {
  const id = `reflection-${now.getTime()}`;
  return {
    id,
    title: 'Untitled product reflection',
    project: 'New product practice',
    status: 'Collecting input',
    updatedAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    summary: 'Start with a real product event, decision, result, or user reaction.',
    tags: ['new'],
    sources: [],
    sections: {
      input: [],
      assumption: [],
      decision: [],
      outcome: [],
      reflection: [],
      memory: [],
    },
    messages: [
      {
        id: `${id}-seed`,
        role: 'loom',
        eyebrow: 'Loom reflection',
        body:
          'Start with the concrete material. A decision, a user reaction, a metric change, or a launch result is enough.',
      },
    ],
  };
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 102.4) / 10} KB`;
  return `${Math.round(size / 1024 / 102.4) / 10} MB`;
}

function normalizeExcerpt(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function localFileKind(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension) return extension;
  if (file.type) return file.type.split('/').pop() ?? 'local file';
  return 'local file';
}

export function isPdfSource(source: ReflectionSource) {
  return source.mimeType === 'application/pdf' || source.kind === 'pdf' || /\.pdf$/i.test(source.label);
}

export function isImageSource(source: ReflectionSource) {
  return Boolean(source.mimeType?.startsWith('image/')) || /\.(png|jpe?g|gif|webp|svg)$/i.test(source.label);
}

export function isNativePrimarySource(source: ReflectionSource) {
  return isPdfSource(source) || /\.(docx?|xlsx?|csv)$/i.test(source.label) || ['doc', 'docx', 'xls', 'xlsx', 'csv'].includes(source.kind);
}

export function sourceCanOpenInReader(source: ReflectionSource) {
  return (isImageSource(source) && Boolean(source.localPreviewUrl)) || TEXT_FILE_PATTERN.test(source.label);
}

function isTextLikeFile(file: File) {
  return file.type.startsWith('text/') || file.type === 'application/json' || TEXT_FILE_PATTERN.test(file.name);
}

export async function fileToReflectionSource(file: File): Promise<ReflectionSource> {
  const kind = localFileKind(file);
  const shouldCreatePreviewUrl = file.type.startsWith('image/');
  const localPreviewUrl = shouldCreatePreviewUrl ? URL.createObjectURL(file) : undefined;
  let excerpt = `Imported local file. Type: ${file.type || 'unknown'}; size: ${formatFileSize(file.size)}.`;

  if (isTextLikeFile(file)) {
    try {
      const text = normalizeExcerpt(await file.slice(0, 48_000).text());
      excerpt = text
        ? text.slice(0, 520)
        : `Imported local text file. Size: ${formatFileSize(file.size)}.`;
    } catch {
      excerpt = `Imported local file. Text preview was not readable in the browser. Size: ${formatFileSize(file.size)}.`;
    }
  }

  return {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    folder: 'Input',
    label: file.name,
    kind,
    meta: formatFileSize(file.size),
    excerpt,
    mimeType: file.type || undefined,
    localPreviewUrl,
    localFile: kind === 'pdf' ? file : undefined,
  };
}
