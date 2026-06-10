import {
  VERIFIED_DOSSIER_ARTIFACTS_BY_ID,
  type VerifiedDossierArtifact,
  type VerifiedDossierArtifactId,
} from './verified-dossier-home';

export type DigitalMeEvidenceStatus = 'strong' | 'partial' | 'direction' | 'missing';

export type DigitalMeArtifactModeId =
  | 'capability-map'
  | 'interview-answer'
  | 'gap-roadmap'
  | 'source-graph'
  | 'portfolio-case';

export type DigitalMeRoleLens = {
  id: 'quant-researcher-trader';
  label: 'Quant Researcher / Trader';
  thesis: string;
  criteria: readonly string[];
};

export type DigitalMeEvidenceNode = {
  id: string;
  artifactId: VerifiedDossierArtifactId;
  supportedCapability: string;
  roleUse: string;
};

export type DigitalMeClaimNode = {
  id: string;
  text: string;
  roleRelevance: string;
  evidenceStatus: DigitalMeEvidenceStatus;
  evidenceIds: readonly DigitalMeEvidenceNode['id'][];
  artifactActions: readonly string[];
};

export type DigitalMeArtifactMode = {
  id: DigitalMeArtifactModeId;
  label: string;
  summary: string;
};

export type DigitalMeProofPath = {
  roleLensId: DigitalMeRoleLens['id'];
  activeArtifactMode: DigitalMeArtifactModeId;
  claims: readonly DigitalMeClaimNode[];
  evidence: readonly DigitalMeEvidenceNode[];
  /** Claim-specific next growth actions, keyed by claim id. */
  nextGrowthActions: Readonly<Record<string, string>>;
};

export const DIGITAL_ME_QUANT_ROLE_LENS = {
  id: 'quant-researcher-trader',
  label: 'Quant Researcher / Trader',
  thesis:
    'Digital Me defaults to a Quant Researcher / Trader lens: mathematical reasoning, source discipline, and implementation practice are evaluated as one career proof path.',
  criteria: [
    'mathematical reasoning',
    'optimisation and convex analysis',
    'Python and C++ implementation',
    'market and credential context',
    'source-backed explanation',
  ],
} as const satisfies DigitalMeRoleLens;

export const DIGITAL_ME_ROLE_LENSES = [
  DIGITAL_ME_QUANT_ROLE_LENS,
] as const satisfies readonly DigitalMeRoleLens[];

export const DIGITAL_ME_ARTIFACT_MODES = [
  {
    id: 'capability-map',
    label: 'Capability Map',
    summary: 'Groups source-backed claims into the quant role capabilities they support.',
  },
  {
    id: 'interview-answer',
    label: 'Interview Answer',
    summary: 'Turns verified claims into concise role-specific answers with evidence references.',
  },
  {
    id: 'gap-roadmap',
    label: 'Gap Roadmap',
    summary: 'Separates proven strengths from missing proof and practical next learning work.',
  },
  {
    id: 'source-graph',
    label: 'Source Graph',
    summary: 'Shows how each role claim connects back to real dossier artifacts.',
  },
  {
    id: 'portfolio-case',
    label: 'Portfolio Case',
    summary: 'Packages one claim, its evidence, and its role use as a portfolio-ready case.',
  },
] as const satisfies readonly DigitalMeArtifactMode[];

const DIGITAL_ME_EVIDENCE = [
  {
    id: 'econ-ps2-math',
    artifactId: 'econ-ps2',
    supportedCapability: 'mathematical reasoning',
    roleUse: 'Shows the ability to work from formal problem statements into quant-relevant reasoning.',
  },
  {
    id: 'econ-notes-solution',
    artifactId: 'econ-notes',
    supportedCapability: 'source-backed explanation',
    roleUse: 'Shows private working output that can be explained, checked, and connected to source material.',
  },
  {
    id: 'econ-slides-optimisation',
    artifactId: 'econ-slides',
    supportedCapability: 'optimisation and convex analysis',
    roleUse: 'Connects concavity and optimisation concepts to the math layer used in research and trading.',
  },
  {
    id: 'python-foundations-programming',
    artifactId: 'quantnet-python-foundations',
    supportedCapability: 'Python implementation foundations',
    roleUse: 'Anchors programming preparation in a real Python for Quant source rather than an unsupported claim.',
  },
  {
    id: 'cpp-course-implementation',
    artifactId: 'quantnet-cpp-course',
    supportedCapability: 'C++ implementation direction',
    roleUse: 'Signals the systems-language path expected in financial engineering and trading infrastructure.',
  },
  {
    id: 'wqu-credential-context',
    artifactId: 'wqu-index',
    supportedCapability: 'structured quantitative finance learning',
    roleUse: 'Places the role path inside an external finance education context that can be inspected.',
  },
  {
    id: 'about-role-direction',
    artifactId: 'about-doc',
    supportedCapability: 'personal role framing',
    roleUse: 'Ties the role lens back to the profile direction and keeps Digital Me grounded in identity evidence.',
  },
  {
    id: 'optibook-live-market-practice',
    artifactId: 'optibook-market-lens',
    supportedCapability: 'live market implementation practice',
    roleUse:
      'Shows pair-trading and order-book strategy practice on Optibook from the Optiver & UNSW trading academy.',
  },
] as const satisfies readonly DigitalMeEvidenceNode[];

const DIGITAL_ME_CLAIMS = [
  {
    id: 'mathematical-reasoning',
    text: 'Yiping can reason from formal mathematical economics material into inspectable problem-solving work.',
    roleRelevance: 'Quant research and trading roles depend on disciplined mathematical reasoning under clear assumptions.',
    evidenceStatus: 'strong',
    evidenceIds: ['econ-ps2-math', 'econ-notes-solution'],
    artifactActions: ['Open problem set source', 'Compare answer artifact', 'Generate interview explanation'],
  },
  {
    id: 'optimisation-thinking',
    text: 'Yiping has an active optimisation learning path grounded in concavity and mathematical economics sources.',
    roleRelevance: 'Optimisation is central to portfolio construction, model calibration, and strategy evaluation.',
    evidenceStatus: 'partial',
    evidenceIds: ['econ-slides-optimisation'],
    artifactActions: ['Open lecture source', 'Map concepts to trading use', 'Create gap roadmap'],
  },
  {
    id: 'programming-foundations',
    text: 'Yiping is building implementation foundations through Python for Quant and C++ financial engineering sources.',
    roleRelevance: 'A Quant Researcher / Trader needs to turn models, tests, and market ideas into working code.',
    evidenceStatus: 'partial',
    evidenceIds: ['python-foundations-programming', 'cpp-course-implementation'],
    artifactActions: ['Open Python source', 'Open C++ source', 'Build portfolio case'],
  },
  {
    id: 'finance-learning-context',
    text: 'Yiping can place quant skill-building inside structured finance and market-learning programs.',
    roleRelevance: 'Role readiness improves when math and code practice are tied to finance-specific learning contexts.',
    evidenceStatus: 'direction',
    evidenceIds: ['wqu-credential-context', 'about-role-direction'],
    artifactActions: ['Open credential source', 'Show role lens', 'Draft capability map'],
  },
  {
    id: 'live-market-project-proof',
    text: 'Yiping is assembling live market proof, starting from trading-strategy practice on Optibook in the Optiver & UNSW trading academy.',
    roleRelevance: 'Hiring proof for this role is strongest when analysis, implementation, evaluation, and reflection are visible.',
    evidenceStatus: 'partial',
    evidenceIds: ['optibook-live-market-practice'],
    artifactActions: ['Open the Optibook replica', 'Define source inputs', 'Track implementation output'],
  },
] as const satisfies readonly DigitalMeClaimNode[];

const DIGITAL_ME_EVIDENCE_BY_ID = Object.fromEntries(
  DIGITAL_ME_EVIDENCE.map((evidence) => [evidence.id, evidence]),
) as Record<string, DigitalMeEvidenceNode | undefined>;

export const DIGITAL_ME_PROOF_PATH = {
  roleLensId: 'quant-researcher-trader',
  activeArtifactMode: 'capability-map',
  claims: DIGITAL_ME_CLAIMS,
  evidence: DIGITAL_ME_EVIDENCE,
  nextGrowthActions: {
    'mathematical-reasoning':
      'Create a small quant research project with data, a hypothesis, model notes, evaluation, and limits.',
    'optimisation-thinking':
      'Turn optimisation coursework into a portfolio case that explains assumptions and limits.',
    'programming-foundations':
      'Add implementation proof that connects Python prototypes to C++ performance practice.',
    'finance-learning-context':
      'Connect WQU and UNSW finance learning to one dated market-structure analysis artifact.',
    'live-market-project-proof':
      'Grow the Optibook trading-academy practice into one end-to-end project with data, model notes, code, and evaluation.',
  },
} as const satisfies DigitalMeProofPath;

export function getDigitalMeClaimById(id: string): DigitalMeClaimNode | undefined {
  return DIGITAL_ME_PROOF_PATH.claims.find((claim) => claim.id === id);
}

export function getDigitalMeEvidenceForClaim(claimId: string): DigitalMeEvidenceNode[] {
  const claim = getDigitalMeClaimById(claimId);
  if (!claim) {
    return [];
  }

  return claim.evidenceIds
    .map((evidenceId) => DIGITAL_ME_EVIDENCE_BY_ID[evidenceId])
    .filter((evidence): evidence is DigitalMeEvidenceNode => Boolean(evidence));
}

export function resolveDigitalMeEvidenceArtifact(
  evidence: DigitalMeEvidenceNode,
): VerifiedDossierArtifact {
  return VERIFIED_DOSSIER_ARTIFACTS_BY_ID[evidence.artifactId];
}
