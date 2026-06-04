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

export type VerifiedDossierPresentationCategoryId = 'about' | 'education' | 'experience' | 'digital-me';

export type VerifiedDossierPresentationCategory = {
  id: VerifiedDossierPresentationCategoryId;
  label: string;
  href: string;
  summary: string;
  proof: string;
  sourceSectionIds: readonly VerifiedDossierSection['id'][];
  artifactIds: readonly VerifiedDossierArtifactId[];
  capabilities: readonly string[];
  foundationCategoryIds?: readonly Exclude<VerifiedDossierPresentationCategoryId, 'digital-me'>[];
};

export type VerifiedDossierLoomIntroStep = {
  label: 'Sources' | 'Draft' | 'Digital Me';
  text: string;
};

export type VerifiedDossierLoomIntro = {
  title: string;
  summary: string;
  blocking: boolean;
  steps: readonly VerifiedDossierLoomIntroStep[];
};

export type VerifiedDossierCourseFolder = {
  id: string;
  code: string;
  folder: string;
  status: string;
  fileCount: number;
  href: string;
  sampleArtifactId?: VerifiedDossierArtifactId;
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

export type VerifiedDossierDigitalMeCanvas = {
  id: string;
  topic: string;
  promptExample: string;
  description: string;
  triggerTerms: readonly string[];
  foundationCategoryIds: readonly Exclude<VerifiedDossierPresentationCategoryId, 'digital-me'>[];
  columns: readonly {
    label: string;
    summary: string;
    items: readonly {
      label: string;
      detail: string;
      href?: string;
      artifactIds?: readonly VerifiedDossierArtifactId[];
    }[];
  }[];
};

export const VERIFIED_DOSSIER_TOP_NAV: VerifiedDossierNavItem[] = [
  { label: 'About', href: '/about' },
  { label: 'Education', href: '/education' },
  { label: 'Experience', href: '/experience' },
  { label: 'Digital Me', href: '/digital-me' },
];

export const VERIFIED_DOSSIER_HOME_COPY = {
  headline: 'Yiping Yin',
  body: 'Source-backed personal profile',
  shortDefinition:
    'About, education, experience, and Digital Me are backed by real sources, drafts, and cited outputs.',
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
    label: 'UNSW',
    href: '/knowledge/unsw',
    summary: 'Course folders, official sources, weekly material, and study evidence.',
    status: 'Course source shelf',
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

export const VERIFIED_DOSSIER_LOOM_INTRO = {
  title: 'Built with Loom',
  summary:
    'Loom is the underlying trust mechanism for this profile: real sources become drafts, and Digital Me answers from the same archive.',
  blocking: false,
  steps: [
    { label: 'Sources', text: 'Real files, courses, credentials, projects, and evidence stay inspectable.' },
    { label: 'Draft', text: 'Source material turns into cited notes, answers, and portfolio-ready work.' },
    { label: 'Digital Me', text: 'The AI-facing layer answers, cites, explains process, and walks through evidence.' },
  ],
} as const satisfies VerifiedDossierLoomIntro;

export const VERIFIED_DOSSIER_PRESENTATION_CATEGORIES = [
  {
    id: 'about',
    label: 'About',
    href: '/about',
    summary: 'Self-introduction, direction, public links, and source-backed identity.',
    proof: 'Profile record',
    sourceSectionIds: ['about'],
    artifactIds: ['about-doc'],
    capabilities: ['Identity summary', 'Public context', 'Source-backed profile'],
  },
  {
    id: 'education',
    label: 'Education',
    href: '/education',
    summary: 'Courses, coursework, certificates, and learning outputs backed by real files.',
    proof: 'UNSW, QuantNet, WQU, Claude Certificate',
    sourceSectionIds: ['unsw', 'quantnet', 'wqu', 'claude'],
    artifactIds: ['econ-ps2', 'econ-slides', 'quantnet-cpp-course', 'wqu-index', 'claude-certificate'],
    capabilities: ['Course folders', 'Credential evidence', 'Learning process'],
  },
  {
    id: 'experience',
    label: 'Experience',
    href: '/experience',
    summary: 'Projects, work, competitions, and built systems shown with process evidence.',
    proof: 'Project and build records',
    sourceSectionIds: ['about', 'unsw', 'quantnet'],
    artifactIds: ['about-doc', 'quantnet-python-foundations', 'econ-notes'],
    capabilities: ['Project evidence', 'Competition records', 'Build process'],
  },
  {
    id: 'digital-me',
    label: 'Digital Me',
    href: '/digital-me',
    summary:
      'A grounded interaction layer that can answer, cite, and turn conversations into presentation canvases built from About, Education, and Experience.',
    proof: 'About + Education + Experience',
    sourceSectionIds: ['about', 'unsw', 'quantnet', 'wqu', 'claude'],
    artifactIds: ['about-doc', 'econ-ps2', 'econ-slides', 'quantnet-python-foundations', 'claude-certificate'],
    capabilities: [
      'Citation-backed answers',
      'Topic-to-canvas routing',
      'Process replay',
      'Knowledge and experience display',
      'Draft-backed output generation',
    ],
    foundationCategoryIds: ['about', 'education', 'experience'],
  },
] as const satisfies readonly VerifiedDossierPresentationCategory[];

export const VERIFIED_DOSSIER_DIGITAL_ME_CANVASES = [
  {
    id: 'trading',
    topic: 'Trading',
    promptExample: 'Show my trading knowledge and how it connects to programming and experience.',
    description:
      'When an ask turns toward Trading, Digital Me can turn a conversation into a structured presentation canvas that connects identity, learning, and work evidence.',
    triggerTerms: ['Trading', 'market making', 'quant finance', 'portfolio construction'],
    foundationCategoryIds: ['about', 'education', 'experience'],
    columns: [
      {
        label: 'Trading Knowledge',
        summary: 'Course and mathematical foundations that explain the trading lens.',
        items: [
          {
            label: 'FINS 3666',
            detail: 'Quant analysis, financial markets, trading intuition, and market structure context.',
            href: '/knowledge/unsw#all-unsw-course-folders',
          },
          {
            label: 'MATH 2991',
            detail: 'Mathematical tools for modelling, probability, optimisation, and analytical reasoning.',
            href: '/knowledge/unsw#all-unsw-course-folders',
          },
          {
            label: 'ECON 3202',
            detail: 'Optimisation, concavity, and economic choice foundations used in trading decisions.',
            href: '/knowledge/unsw/econ3202',
            artifactIds: ['econ-slides', 'econ-ps2'],
          },
        ],
      },
      {
        label: 'Programming',
        summary: 'Implementation layer for research, backtesting, and quantitative workflow.',
        items: [
          {
            label: 'Python',
            detail: 'Python Foundations and quant tooling for data work, modelling, and notebooks.',
            href: '/knowledge/quantnet/python-foundations',
            artifactIds: ['quantnet-python-foundations'],
          },
          {
            label: 'C++',
            detail: 'Financial engineering programming foundation for performance-sensitive systems.',
            href: '/knowledge/quantnet/quantnet-online-cpp-course',
            artifactIds: ['quantnet-cpp-course'],
          },
        ],
      },
      {
        label: 'Experience and Process',
        summary: 'How the knowledge becomes portfolio material, answers, and visible reasoning.',
        items: [
          {
            label: 'Problem-set reasoning',
            detail: 'Worked ECON3202 material shows the mathematical process behind an answer.',
            href: '/knowledge/unsw/econ3202/ps02',
            artifactIds: ['econ-ps2', 'econ-notes'],
          },
          {
            label: 'Source-to-answer workflow',
            detail: 'Sources are transformed into Draft-backed explanations before they appear in Digital Me.',
            artifactIds: ['econ-slides', 'econ-tutorial'],
          },
          {
            label: 'Personal direction',
            detail: 'The About layer explains goals, public context, and why these topics belong together.',
            href: '/about',
            artifactIds: ['about-doc'],
          },
        ],
      },
    ],
  },
] as const satisfies readonly VerifiedDossierDigitalMeCanvas[];

export const VERIFIED_DOSSIER_UNSW_COURSES = [
  {
    id: 'econ-3202',
    code: 'ECON 3202',
    folder: 'UNSW/ECON 3202',
    status: 'Course dossier',
    fileCount: 51,
    href: '/knowledge/unsw/econ3202',
    sampleArtifactId: 'econ-ps2',
  },
  {
    id: 'math-2991',
    code: 'MATH 2991',
    folder: 'UNSW/MATH 2991',
    status: 'Generated manual',
    fileCount: 5,
    href: '/knowledge/unsw#all-unsw-course-folders',
  },
  {
    id: 'fins-3666',
    code: 'FINS 3666',
    folder: 'UNSW/FINS 3666',
    status: 'Quant finance',
    fileCount: 174,
    href: '/knowledge/unsw#all-unsw-course-folders',
  },
  {
    id: 'fins-3640',
    code: 'FINS 3640',
    folder: 'UNSW/FINS 3640',
    status: 'Weekly archive',
    fileCount: 73,
    href: '/knowledge/unsw#all-unsw-course-folders',
  },
  {
    id: 'math-3856',
    code: 'MATH 3856',
    folder: 'UNSW/MATH 3856',
    status: 'ML references',
    fileCount: 6,
    href: '/knowledge/unsw#all-unsw-course-folders',
  },
  {
    id: 'infs-3822',
    code: 'INFS 3822',
    folder: 'UNSW/INFS 3822',
    status: 'Data archive',
    fileCount: 2929,
    href: '/knowledge/unsw#all-unsw-course-folders',
  },
  {
    id: 'comm-3030',
    code: 'COMM 3030',
    folder: 'UNSW/COMM 3030',
    status: 'Project course',
    fileCount: 77,
    href: '/knowledge/unsw#all-unsw-course-folders',
  },
  {
    id: 'fins-3616',
    code: 'FINS 3616',
    folder: 'UNSW/FINS 3616',
    status: 'Course archive',
    fileCount: 40,
    href: '/knowledge/unsw#all-unsw-course-folders',
  },
  {
    id: 'fins-3635',
    code: 'FINS 3635',
    folder: 'UNSW/FINS 3635',
    status: 'Market source',
    fileCount: 35,
    href: '/knowledge/unsw#all-unsw-course-folders',
  },
  {
    id: 'fins-3646',
    code: 'FINS 3646',
    folder: 'UNSW/FINS 3646',
    status: 'Project archive',
    fileCount: 219,
    href: '/knowledge/unsw#all-unsw-course-folders',
  },
  {
    id: 'math-1141',
    code: 'MATH 1141',
    folder: 'UNSW/MATH 1141',
    status: 'Math notes',
    fileCount: 5,
    href: '/knowledge/unsw#all-unsw-course-folders',
  },
  {
    id: 'math-1241',
    code: 'MATH 1241',
    folder: 'UNSW/MATH 1241',
    status: 'Math notes',
    fileCount: 4,
    href: '/knowledge/unsw#all-unsw-course-folders',
  },
  {
    id: 'math-2018',
    code: 'MATH 2018',
    folder: 'UNSW/MATH 2018',
    status: 'Tutorial source',
    fileCount: 62,
    href: '/knowledge/unsw#all-unsw-course-folders',
  },
  {
    id: 'math-2089',
    code: 'MATH 2089',
    folder: 'UNSW/MATH 2089',
    status: 'Numerical methods',
    fileCount: 1,
    href: '/knowledge/unsw#all-unsw-course-folders',
  },
  {
    id: 'math-2901',
    code: 'MATH 2901',
    folder: 'UNSW/MATH 2901',
    status: 'Assessment archive',
    fileCount: 29,
    href: '/knowledge/unsw#all-unsw-course-folders',
  },
] as const satisfies readonly VerifiedDossierCourseFolder[];

export function formatVerifiedDossierCourseFileCount(fileCount: number) {
  return `${fileCount.toLocaleString()} ${fileCount === 1 ? 'file' : 'files'}`;
}

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
      summary: 'UNSW course shelf',
      detail: 'Course folders, official PDFs, weekly material, and answer evidence stay in Sources.',
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
