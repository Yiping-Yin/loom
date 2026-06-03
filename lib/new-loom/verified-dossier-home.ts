export type VerifiedDossierFileKind = 'pdf' | 'word' | 'ppt' | 'excel' | 'markdown' | 'text';

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
    label: 'ECON3202 Problem Set 2.pdf',
    kind: 'pdf',
    shelf: 'unsw',
    role: 'Problem-set evidence',
    href: '/knowledge/unsw',
    preview: {
      title: 'Problem Set 2',
      kicker: 'ECON3202 - Macroeconomic Analysis',
      metadata: 'PDF - 1.2 MB - 12 Apr 2024',
      tag: 'Problem set',
      lines: ['Due 23 Apr 2024, 5:00pm AEST', 'Phillips Curve and aggregate demand', 'Answer all questions with working'],
    },
  },
  {
    id: 'econ-slides',
    label: 'Lecture 8 Slides.pptx',
    kind: 'ppt',
    shelf: 'unsw',
    role: 'Lecture source',
    href: '/knowledge/unsw',
    preview: {
      title: 'Lecture 8',
      kicker: 'Aggregate Demand I',
      metadata: 'PPTX - 8.7 MB - 10 Apr 2024',
      tag: 'Lecture slides',
      lines: ['Macroeconomic Analysis', 'Aggregate demand and output', 'Policy impacts in the short run'],
    },
  },
  {
    id: 'econ-tutorial',
    label: 'Tutorial 3 Solutions.pdf',
    kind: 'pdf',
    shelf: 'unsw',
    role: 'Tutorial solution source',
    href: '/knowledge/unsw',
    preview: {
      title: 'Tutorial 3',
      kicker: 'Phillips Curve solution',
      metadata: 'PDF - 1.1 MB - 11 Apr 2024',
      tag: 'Solutions',
      lines: ['Inflation pi and unemployment u', 'Short-run relationship diagram', 'Expectations-augmented curve'],
    },
  },
  {
    id: 'econ-notes',
    label: 'Lecture 8 Notes.pdf',
    kind: 'pdf',
    shelf: 'unsw',
    role: 'Course notes',
    href: '/knowledge/unsw',
    preview: {
      title: 'Lecture 8 Notes',
      kicker: 'Aggregate demand and supply shocks',
      metadata: 'PDF - 642 KB - 10 Apr 2024',
      tag: 'Lecture notes',
      lines: ['Key topics: AD, C, I, G, NX', 'Expectations and supply shocks', 'Short-run fluctuations'],
    },
  },
  {
    id: 'quant-market-making',
    label: 'Market Making Interview Notes.pdf',
    kind: 'pdf',
    shelf: 'quantnet',
    role: 'Quant interview preparation',
    href: '/knowledge/quantnet',
  },
  {
    id: 'quant-python',
    label: 'Python Foundations.pdf',
    kind: 'pdf',
    shelf: 'quantnet',
    role: 'Programming path',
    href: '/knowledge/quantnet',
  },
  {
    id: 'wqu-bhp',
    label: 'BHP Case Study.xlsx',
    kind: 'excel',
    shelf: 'wqu',
    role: 'Case-study artifact',
    href: '/knowledge/wqu',
  },
  {
    id: 'claude-prompts',
    label: 'Prompt library.md',
    kind: 'markdown',
    shelf: 'claude',
    role: 'Prompt and conversation memory',
    href: '/knowledge/claude',
  },
  {
    id: 'claude-cert',
    label: 'Claude certificate.pdf',
    kind: 'pdf',
    shelf: 'claude',
    role: 'Certificate evidence',
    href: '/knowledge/claude',
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

export const VERIFIED_DOSSIER_TOP_NAV: VerifiedDossierNavItem[] = [
  { label: 'About', href: '/about' },
  { label: 'Sources', href: '/knowledge' },
  { label: 'UNSW', href: '/knowledge/unsw' },
  { label: 'Quantnet', href: '/knowledge/quantnet' },
  { label: 'WQU', href: '/knowledge/wqu' },
  { label: 'Claude', href: '/knowledge/claude' },
  { label: 'History', href: '/product-history' },
];

export const VERIFIED_DOSSIER_HOME_COPY = {
  headline: 'A knowledge profile people can inspect and ask.',
  body: 'Sources, drafts, projects, and conversations become a public record with evidence behind every answer.',
  shortDefinition:
    'Loom turns your sources, learning path, work, process records, and AI conversations into an inspectable personal knowledge identity.',
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
    summary: 'Quant interviews, programming practice, and market reasoning.',
    status: 'Skill proof',
    artifactIds: ['quant-market-making', 'quant-python'],
  },
  {
    id: 'wqu',
    label: 'WQU',
    href: '/knowledge/wqu',
    summary: 'Credential work, case studies, and professional learning records.',
    status: 'Credential evidence',
    artifactIds: ['wqu-bhp'],
  },
  {
    id: 'claude',
    label: 'Claude',
    href: '/knowledge/claude',
    summary: 'AI conversations, prompts, certificates, and grounded persona memory.',
    status: 'AI memory',
    artifactIds: ['claude-prompts', 'claude-cert'],
  },
];

export const VERIFIED_DOSSIER_AI_PROMPT = {
  question: 'What is the Phillips Curve and how is it used in ECON3202?',
  answer:
    'In ECON3202, the Phillips Curve frames the short-run trade-off between inflation and unemployment. When aggregate demand rises, unemployment can fall while inflation rises. The course also uses expectations and supply shocks to explain why the curve shifts over time.',
  citations: ['econ-ps2', 'econ-slides', 'econ-tutorial'],
} satisfies VerifiedDossierAiPrompt;

export const VERIFIED_DOSSIER_ARTIFACTS_BY_ID = Object.fromEntries(
  VERIFIED_DOSSIER_ARTIFACTS.map((artifact) => [artifact.id, artifact]),
) as Record<VerifiedDossierArtifactId, VerifiedDossierArtifact>;

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
    title: 'Platform for everyone',
    text: 'From one real instance toward Loom for everyone.',
    date: 'Next',
  },
];
