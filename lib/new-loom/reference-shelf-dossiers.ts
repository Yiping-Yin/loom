import type {
  VerifiedDossierArtifactId,
  VerifiedDossierSection,
} from './verified-dossier-home';

export type ReferenceShelfDossierId = 'quantnet' | 'wqu' | 'claude';

export type ReferenceShelfDossierMetric = {
  label: string;
  value: string;
};

export type ReferenceShelfDossierFlowStep = {
  title: string;
  text: string;
};

export type ReferenceShelfDossier = {
  id: ReferenceShelfDossierId;
  eyebrow: string;
  headline: string;
  lead: string;
  proofLine: string;
  metrics: ReferenceShelfDossierMetric[];
  question: string;
  answer: string;
  citedArtifacts: VerifiedDossierArtifactId[];
  flow: ReferenceShelfDossierFlowStep[];
  outcomeTitle: string;
  outcomeText: string;
};

export const REFERENCE_SHELF_DOSSIERS: Record<ReferenceShelfDossierId, ReferenceShelfDossier> = {
  quantnet: {
    id: 'quantnet',
    eyebrow: 'Market skills shelf',
    headline: 'Quant learning becomes visible skill proof.',
    lead:
      'QuantNet organizes trading concepts, programming practice, interview preparation, and market reasoning into a traceable path from source material to practiced capability.',
    proofLine:
      'The shelf is designed to show how study inputs become examples, notes, interview answers, and portfolio-ready market reasoning.',
    metrics: [
      { label: 'Primary track', value: 'C++ / Python' },
      { label: 'Visible evidence', value: 'Course PDFs and practice outputs' },
      { label: 'Review mode', value: 'Interview-ready proof' },
    ],
    question: 'How does this shelf prove quant capability beyond a resume line?',
    answer:
      'It connects source material to repeated practice: QuantNet C++ course material, Python foundations, order-book reasoning, and draft outputs. A visitor can inspect the learning path instead of only seeing a claim that the person is preparing for quant roles.',
    citedArtifacts: ['quantnet-cpp-course', 'quantnet-python-foundations'],
    flow: [
      {
        title: 'Study market structure',
        text: 'Anchor concepts such as spread, inventory risk, execution, and order-book behaviour in source material.',
      },
      {
        title: 'Practice in code',
        text: 'Use Python and worked examples to turn finance ideas into repeatable analysis.',
      },
      {
        title: 'Convert to proof',
        text: 'Keep interview notes, examples, and drafts visible as evidence of applied reasoning.',
      },
    ],
    outcomeTitle: 'Career-facing evidence',
    outcomeText:
      'The output is a shelf that can support interviews, portfolio pages, and grounded answers about market reasoning.',
  },
  wqu: {
    id: 'wqu',
    eyebrow: 'Credential evidence shelf',
    headline: 'Professional learning is shown as work, not just certification.',
    lead:
      'WQU keeps program requirements, case-study work, financial modelling notes, and assessment outputs in one source-backed credential path.',
    proofLine:
      'The shelf separates official requirements, source material, working analysis, and portfolio-ready artifacts.',
    metrics: [
      { label: 'Primary track', value: 'Applied finance credential' },
      { label: 'Visible evidence', value: 'Program source and records' },
      { label: 'Review mode', value: 'Source-backed progress' },
    ],
    question: 'What does this shelf show that a certificate alone cannot show?',
    answer:
      'It shows how the credential work is grounded: program material, local source records, drafts, and future artifacts can stay attached. The certificate line becomes inspectable because the underlying process remains visible.',
    citedArtifacts: ['wqu-index'],
    flow: [
      {
        title: 'Track requirements',
        text: 'Keep the program path, assessment expectations, and course context separate from personal synthesis.',
      },
      {
        title: 'Build artifacts',
        text: 'Turn case studies, models, notes, and reviews into concrete work products.',
      },
      {
        title: 'Publish evidence',
        text: 'Use completed artifacts to explain both the result and the method behind it.',
      },
    ],
    outcomeTitle: 'Credential with inspection depth',
    outcomeText:
      'The output is a professional learning record that can be reviewed beyond a static credential badge.',
  },
  claude: {
    id: 'claude',
    eyebrow: 'AI collaboration shelf',
    headline: 'AI conversations become grounded persona memory.',
    lead:
      'Claude stores prompt records, AI learning, certificates, work logs, and useful conversations as part of the same source-bound identity system.',
    proofLine:
      'The shelf treats AI output as a traceable process layer, not detached polish.',
    metrics: [
      { label: 'Primary track', value: 'Prompting / AI workflow' },
      { label: 'Visible evidence', value: 'Certificate and workflow record' },
      { label: 'Review mode', value: 'Grounded personal AI' },
    ],
    question: 'How can AI conversations become part of a trustworthy profile?',
    answer:
      'They stay connected to the sources, decisions, and drafts they shaped. Instead of presenting AI text as unexplained output, Loom keeps certificate records, work logs, and revisions available as evidence for a grounded personal AI.',
    citedArtifacts: ['claude-certificate'],
    flow: [
      {
        title: 'Capture useful conversations',
        text: 'Save prompts, revisions, and reasoning exchanges that materially shaped the work.',
      },
      {
        title: 'Attach source context',
        text: 'Keep AI outputs linked to the original materials and decisions they depend on.',
      },
      {
        title: 'Ground the persona',
        text: 'Use source-backed AI memory to answer questions without losing provenance.',
      },
    ],
    outcomeTitle: 'Personal AI with provenance',
    outcomeText:
      'The output is an AI collaboration record that can support a virtual personal AI people can question with trust.',
  },
};

export function referenceShelfDossierFor(
  section: VerifiedDossierSection | undefined,
): ReferenceShelfDossier | null {
  if (!section) return null;
  if (section.id === 'quantnet' || section.id === 'wqu' || section.id === 'claude') {
    return REFERENCE_SHELF_DOSSIERS[section.id];
  }
  return null;
}
