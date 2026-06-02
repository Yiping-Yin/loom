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
};

export const VERIFIED_DOSSIER_ARTIFACTS = [
  {
    id: 'about-doc',
    label: 'About me page.docx',
    kind: 'word',
    shelf: 'about',
    role: 'Profile notes, values, direction',
    href: '/about',
  },
  {
    id: 'econ-ps2',
    label: 'ECON3202 Problem Set 2.pdf',
    kind: 'pdf',
    shelf: 'unsw',
    role: 'Problem-set evidence',
    href: '/knowledge/unsw',
  },
  {
    id: 'econ-slides',
    label: 'Lecture 8 Slides.pptx',
    kind: 'ppt',
    shelf: 'unsw',
    role: 'Lecture source',
    href: '/knowledge/unsw',
  },
  {
    id: 'econ-tutorial',
    label: 'Tutorial 3 Solutions.pdf',
    kind: 'pdf',
    shelf: 'unsw',
    role: 'Tutorial solution source',
    href: '/knowledge/unsw',
  },
  {
    id: 'econ-notes',
    label: 'Lecture 8 Notes.pdf',
    kind: 'pdf',
    shelf: 'unsw',
    role: 'Course notes',
    href: '/knowledge/unsw',
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
  chineseHeadline: '一个可展示、可追溯、可交流的个人知识身份。',
  chineseBody:
    'Loom 将资料、学习路径、作品、过程记录和 AI 对话织成一个真实的个人知识档案。它既是作品集，也是知识库，最终也是一个基于本人知识的虚拟个人 AI。',
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
) as Record<VerifiedDossierArtifactId, (typeof VERIFIED_DOSSIER_ARTIFACTS)[number]>;

export function resolveVerifiedDossierArtifact(id: VerifiedDossierArtifactId) {
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
