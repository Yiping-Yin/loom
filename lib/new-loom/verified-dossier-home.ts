export type VerifiedDossierFileKind = 'pdf' | 'word' | 'ppt' | 'excel' | 'markdown' | 'html' | 'text';

export type VerifiedDossierNavItem = {
  label: string;
  href: string;
};

export type VerifiedDossierProfileLink = {
  label: 'LinkedIn' | 'GitHub' | 'Website';
  href: string;
};

export type VerifiedDossierMembership = {
  label: string;
  kind: 'unsw' | 'wqu' | 'quantnet';
};

export type VerifiedDossierArtifact = {
  id: string;
  label: string;
  kind: VerifiedDossierFileKind;
  shelf: 'about' | 'unsw' | 'quantnet' | 'wqu' | 'claude';
  role: string;
  href: string;
  sourcePath?: string;
  sourceFolder?: string;
  pageCount?: number;
  fileSize?: string;
  modifiedAt?: string;
  thumbnailSrc?: string;
  preview?: {
    title: string;
    kicker: string;
    metadata: string;
    tag: string;
    lines: readonly string[];
  };
};

export const VERIFIED_DOSSIER_ARTIFACTS = [
  {
    id: 'about-doc',
    label: 'About me page.docx',
    kind: 'word',
    shelf: 'about',
    role: 'Profile notes, values, direction',
    href: '/about',
    preview: {
      title: 'About Me',
      kicker: 'Yiping Yin / Personal Knowledge Postcard',
      metadata: 'DOCX - Profile notes - Updated Jun 2026',
      tag: 'Identity brief',
      lines: [
        'Student / Builder / Learner',
        'Learning path, work, and process',
        'Linked to sources and Draft',
      ],
    },
  },
  {
    id: 'econ-ps2',
    label: 'Problem Set 02.pdf',
    kind: 'pdf',
    shelf: 'unsw',
    role: 'Problem-set evidence',
    href: '/knowledge/unsw/econ3202/ps02',
    sourcePath: 'UNSW/ECON 3202/03_Problem_Set/Problem Set 02.pdf',
    sourceFolder: '03_Problem_Set',
    pageCount: 2,
    fileSize: '79 KB',
    modifiedAt: '15 Mar 2026',
    thumbnailSrc: '/verified-sources/econ3202/problem-set-02.png',
    preview: {
      title: 'Problem Set 02',
      kicker: 'ECON3202 - Mathematical Economics',
      metadata: '2 pages - 79 KB - modified 15 Mar 2026',
      tag: '03_Problem_Set',
      lines: ['UNSW/ECON 3202/03_Problem_Set', 'PDF metadata verified locally', 'Set 2 - Term 1, 2026'],
    },
  },
  {
    id: 'econ-slides',
    label: 'W8 A Concave-Functions.pdf',
    kind: 'pdf',
    shelf: 'unsw',
    role: 'Lecture source',
    href: '/knowledge/unsw/econ3202',
    sourcePath: 'UNSW/ECON 3202/02_Week/W08/W8 A Concave-Functions.pdf',
    sourceFolder: '02_Week/W08',
    pageCount: 27,
    fileSize: '227 KB',
    modifiedAt: '06 Apr 2026',
    thumbnailSrc: '/verified-sources/econ3202/w8-a-concave-functions.png',
    preview: {
      title: 'Concave Functions',
      kicker: 'Week 8 - ECON3202',
      metadata: '27 pages - 227 KB - modified 06 Apr 2026',
      tag: '02_Week/W08',
      lines: ['UNSW/ECON 3202/02_Week/W08', 'Beamer lecture deck', 'Week 8A - Term 1, 2026'],
    },
  },
  {
    id: 'econ-tutorial',
    label: 'W8 C Suggested Exercises.pdf',
    kind: 'pdf',
    shelf: 'unsw',
    role: 'Exercise source',
    href: '/knowledge/unsw/econ3202',
    sourcePath: 'UNSW/ECON 3202/02_Week/W08/W8 C Suggested Exercises.pdf',
    sourceFolder: '02_Week/W08',
    pageCount: 2,
    fileSize: '81 KB',
    modifiedAt: '06 Apr 2026',
    thumbnailSrc: '/verified-sources/econ3202/w8-c-suggested-exercises.png',
    preview: {
      title: 'Suggested Exercises',
      kicker: 'Week 8 - Practice layer',
      metadata: '2 pages - 81 KB - modified 06 Apr 2026',
      tag: '02_Week/W08',
      lines: ['UNSW/ECON 3202/02_Week/W08', 'Exercise source file', 'Suggested exercises for Week 8'],
    },
  },
  {
    id: 'econ-notes',
    label: 'Problem2.pdf',
    kind: 'pdf',
    shelf: 'unsw',
    role: 'Answer artifact',
    href: '/knowledge/unsw/econ3202/ps02',
    sourcePath: 'UNSW/ECON 3202/03_Problem_Set/Problem2.pdf',
    sourceFolder: '03_Problem_Set',
    pageCount: 5,
    fileSize: '1.5 MB',
    modifiedAt: '18 May 2026',
    thumbnailSrc: '/verified-sources/econ3202/problem2-answer.png',
    preview: {
      title: 'Problem 2 Answer',
      kicker: 'Private working answer',
      metadata: '5 pages - 1.5 MB - modified 18 May 2026',
      tag: '03_Problem_Set',
      lines: ['UNSW/ECON 3202/03_Problem_Set', 'Handwritten answer scan', 'Private synthesis, not official source truth'],
    },
  },
  {
    id: 'quantnet-cpp-course',
    label: 'QuantNet Online C++ Course.pdf',
    kind: 'pdf',
    shelf: 'quantnet',
    role: 'Course source',
    href: '/knowledge/quantnet/quantnet-online-cpp-course',
    sourcePath: 'Quant/C++/00_Course_Info/QuantNet_Online_C++_Course.pdf',
    sourceFolder: 'C++/00_Course_Info',
    pageCount: 9,
    fileSize: '52 KB',
    modifiedAt: '29 Apr 2025',
    thumbnailSrc: '/verified-sources/quantnet/quantnet-online-cpp-course.png',
    preview: {
      title: 'C++ Programming for Financial Engineering',
      kicker: 'QuantNet / C++ course source',
      metadata: '9 pages - 52 KB - modified 29 Apr 2025',
      tag: '00_Course_Info',
      lines: ['Quant/C++/00_Course_Info', 'Financial engineering course source', 'Real local PDF'],
    },
  },
  {
    id: 'quantnet-python-foundations',
    label: 'Python Foundations.pdf',
    kind: 'pdf',
    shelf: 'quantnet',
    role: 'Programming source',
    href: '/knowledge/quantnet/python-foundations',
    sourcePath: 'Quant/Python for Quant/Python Foundations/Section 1 Orientation/Python Foundations.pdf',
    sourceFolder: 'Python for Quant/Python Foundations',
    pageCount: 117,
    fileSize: '7.6 MB',
    modifiedAt: '03 Oct 2025',
    thumbnailSrc: '/verified-sources/quantnet/python-foundations.png',
    preview: {
      title: 'Python Foundations',
      kicker: 'QuantNet / Python for Quant',
      metadata: '117 pages - 7.6 MB - modified 03 Oct 2025',
      tag: 'Python Foundations',
      lines: ['Quant/Python for Quant/Python Foundations', 'Install the Python Quant Stack', 'Real local PDF'],
    },
  },
  {
    id: 'wqu-index',
    label: 'WQU index.html',
    kind: 'html',
    shelf: 'wqu',
    role: 'Credential source',
    href: '/knowledge/wqu/wqu-index',
    sourcePath: 'WQU/index.html',
    sourceFolder: 'WQU',
    fileSize: '2.3 KB',
    modifiedAt: '31 May 2026',
    thumbnailSrc: '/verified-sources/wqu/wqu-index.png',
    preview: {
      title: 'WQU',
      kicker: 'WorldQuant University / local source',
      metadata: 'HTML - 2.3 KB - modified 31 May 2026',
      tag: 'Program page',
      lines: ['WQU/index.html', 'WorldQuant University material home', 'Real local HTML source'],
    },
  },
  {
    id: 'claude-certificate',
    label: 'Claude Certificate.html',
    kind: 'html',
    shelf: 'claude',
    role: 'Certificate source',
    href: '/knowledge/claude/claude-certificate',
    sourcePath: 'Claude Certificate/Claude Certificate.html',
    sourceFolder: 'Claude Certificate',
    fileSize: '18 KB',
    modifiedAt: '28 May 2026',
    thumbnailSrc: '/verified-sources/claude/claude-certificate.png',
    preview: {
      title: 'Anthropic Official Certificates',
      kicker: 'Claude / certificate source',
      metadata: 'HTML - 18 KB - modified 28 May 2026',
      tag: 'Credential evidence',
      lines: ['Claude Certificate/Claude Certificate.html', 'Official-first certificate record', 'Real local HTML source'],
    },
  },
] as const satisfies readonly VerifiedDossierArtifact[];

export type VerifiedDossierArtifactId = (typeof VERIFIED_DOSSIER_ARTIFACTS)[number]['id'];

export type VerifiedDossierSection = {
  id: 'about' | 'unsw' | 'quantnet' | 'wqu' | 'claude';
  label: string;
  href: string;
  summary: string;
  status: string;
  artifactIds: readonly VerifiedDossierArtifactId[];
};

export type VerifiedDossierHistoryItem = {
  title: string;
  text: string;
  date: string;
};

export type VerifiedDossierAiPrompt = {
  question: string;
  answer: string;
  citations: readonly VerifiedDossierArtifactId[];
};

export type VerifiedDossierWorkbenchStep = {
  number: string;
  title: 'Sources' | 'Draft' | 'Answer';
  summary: string;
  detail: string;
};

export type VerifiedDossierGraphNode = {
  id: string;
  label: string;
  eyebrow: string;
  kind: 'source' | 'draft' | 'answer';
  artifactId?: VerifiedDossierArtifactId;
};

export type VerifiedDossierGraphEdge = {
  from: string;
  to: string;
  label: string;
};

export type VerifiedDossierWorkbench = {
  activeSectionId: 'unsw';
  activeArtifactIds: readonly VerifiedDossierArtifactId[];
  sourceGraph: {
    nodes: readonly VerifiedDossierGraphNode[];
    edges: readonly VerifiedDossierGraphEdge[];
  };
  provenanceSteps: readonly VerifiedDossierWorkbenchStep[];
};

export const VERIFIED_DOSSIER_TOP_NAV: VerifiedDossierNavItem[] = [
  { label: 'Sources', href: '/knowledge' },
  { label: 'UNSW / ECON3202', href: '/knowledge/unsw' },
  { label: 'Quantnet', href: '/knowledge/quantnet' },
  { label: 'WQU', href: '/knowledge/wqu' },
  { label: 'Claude', href: '/knowledge/claude' },
  { label: 'History', href: '/product-history' },
];

export const VERIFIED_DOSSIER_HOME_COPY = {
  headline: 'Sources become cited work',
  body: 'Verified source workspace',
  shortDefinition: 'Sources stay inspectable. Draft turns them into cited answers.',
};

export const VERIFIED_DOSSIER_PROFILE = {
  name: 'Yiping Yin',
  roles: ['Student', 'Builder', 'Learner'],
  location: 'Sydney, Australia',
  photoSrc: '/profile/yiping-avatar.png',
  links: [
    { label: 'LinkedIn', href: '/about#linkedin' },
    { label: 'GitHub', href: '/about#github' },
    { label: 'Website', href: 'https://fanpu.io' },
  ] satisfies VerifiedDossierProfileLink[],
  memberships: [
    { label: 'UNSW Sydney', kind: 'unsw' },
    { label: 'WorldQuant University', kind: 'wqu' },
    { label: 'QuantNet', kind: 'quantnet' },
  ] satisfies VerifiedDossierMembership[],
};

export const VERIFIED_DOSSIER_SECTIONS: VerifiedDossierSection[] = [
  {
    id: 'about',
    label: 'About',
    href: '/about',
    summary: 'Identity, values, current direction, and public context.',
    status: 'Profile layer',
    artifactIds: ['about-doc'],
  },
  {
    id: 'unsw',
    label: 'UNSW / ECON3202',
    href: '/knowledge/unsw',
    summary: 'Course sources, problem-set work, and learning evidence.',
    status: 'Featured evidence story',
    artifactIds: ['econ-ps2', 'econ-slides', 'econ-tutorial', 'econ-notes'],
  },
  {
    id: 'quantnet',
    label: 'Quantnet',
    href: '/knowledge/quantnet',
    summary: 'QuantNet course material, Python practice, and market reasoning.',
    status: 'Skill proof',
    artifactIds: ['quantnet-cpp-course', 'quantnet-python-foundations'],
  },
  {
    id: 'wqu',
    label: 'WQU',
    href: '/knowledge/wqu',
    summary: 'WorldQuant University material and professional learning records.',
    status: 'Credential evidence',
    artifactIds: ['wqu-index'],
  },
  {
    id: 'claude',
    label: 'Claude',
    href: '/knowledge/claude',
    summary: 'AI learning, certificate evidence, and grounded persona memory.',
    status: 'AI memory',
    artifactIds: ['claude-certificate'],
  },
];

export const VERIFIED_DOSSIER_AI_PROMPT = {
  question: 'How does concavity connect to optimisation in ECON3202?',
  answer:
    'Concavity shapes how a function behaves. In optimisation, it helps show when first-order conditions identify a maximum and when an economic choice problem has a stable interpretation rather than only a derivative calculation.',
  citations: ['econ-ps2', 'econ-slides', 'econ-tutorial'],
} satisfies VerifiedDossierAiPrompt;

export const VERIFIED_DOSSIER_WORKBENCH = {
  activeSectionId: 'unsw',
  activeArtifactIds: ['econ-ps2', 'econ-slides', 'econ-tutorial', 'econ-notes'],
  sourceGraph: {
    nodes: [
      {
        id: 'problem-set-source',
        label: 'Problem Set 02.pdf',
        eyebrow: 'Source PDF',
        kind: 'source',
        artifactId: 'econ-ps2',
      },
      {
        id: 'lecture-source',
        label: 'W8 A Concave-Functions.pdf',
        eyebrow: 'Lecture source',
        kind: 'source',
        artifactId: 'econ-slides',
      },
      {
        id: 'draft-summary',
        label: 'Concavity and optimisation summary.md',
        eyebrow: 'Draft',
        kind: 'draft',
      },
      {
        id: 'grounded-answer',
        label: 'Grounded explanation',
        eyebrow: 'Answer',
        kind: 'answer',
        artifactId: 'econ-notes',
      },
    ],
    edges: [
      { from: 'problem-set-source', to: 'draft-summary', label: 'Problem context' },
      { from: 'lecture-source', to: 'draft-summary', label: 'Concept source' },
      { from: 'draft-summary', to: 'grounded-answer', label: 'Cited output' },
    ],
  },
  provenanceSteps: [
    {
      number: '01',
      title: 'Sources',
      summary: '4 ECON3202 files',
      detail: 'Course materials, weekly PDFs, exercises, and problem-set work.',
    },
    {
      number: '02',
      title: 'Draft',
      summary: 'Concavity and optimisation summary.md',
      detail: 'A working note created from lecture, exercise, and answer evidence.',
    },
    {
      number: '03',
      title: 'Answer',
      summary: 'Grounded explanation',
      detail: 'Cited back to source artifacts people can inspect from this shelf.',
    },
  ],
} as const satisfies VerifiedDossierWorkbench;

export const VERIFIED_DOSSIER_ARTIFACTS_BY_ID = VERIFIED_DOSSIER_ARTIFACTS.reduce(
  (artifactsById, artifact) => {
    artifactsById[artifact.id] = artifact;
    return artifactsById;
  },
  {} as Record<VerifiedDossierArtifactId, VerifiedDossierArtifact>,
);

export function resolveVerifiedDossierArtifact(id: VerifiedDossierArtifactId): VerifiedDossierArtifact {
  return VERIFIED_DOSSIER_ARTIFACTS_BY_ID[id];
}

export const VERIFIED_DOSSIER_HISTORY: VerifiedDossierHistoryItem[] = [
  {
    title: 'Original Loom',
    text: 'The first idea: link knowledge, projects, and conversations.',
    date: 'Apr 2024',
  },
  {
    title: 'Private Wiki',
    text: 'Built the foundation for personal knowledge management.',
    date: 'Jun 2024',
  },
  {
    title: 'Knowledge identity',
    text: 'Sources, drafts, work, process, and AI conversations become inspectable.',
    date: 'Jun 2026',
  },
  {
    title: 'Real-file workflow',
    text: 'Importer and Draft output are checked against local source files before release.',
    date: 'Next',
  },
];
