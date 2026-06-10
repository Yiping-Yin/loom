export type UnswShelfCourse = {
  code: string;
  title: string;
  units: string;
  offering: string;
  delivery: string;
  owner: string;
  summary: string;
};

export type UnswShelfLink = {
  label: string;
  href: string;
  note: string;
};

export type UnswShelfPathBlock = {
  label: string;
  focus: string;
  sources: string[];
};

export type UnswShelfProblemSet = {
  label: string;
  question: string;
  answer: string;
  pages: string;
};

export type UnswShelfOutput = {
  title: string;
  text: string;
};

export type UnswEcon3202LocalFile = {
  label: string;
  role: string;
  localPath: string;
  href: string;
  pages?: string;
};

export type UnswEcon3202Week = {
  label: string;
  focus: string;
  question: string;
  files: UnswEcon3202LocalFile[];
  references: string[];
  output: string;
};

export type UnswEcon3202ProblemSet = {
  slug: string;
  label: string;
  focus: string;
  opened: string;
  due: string;
  weight: string;
  files: UnswEcon3202LocalFile[];
  evidence: string;
  claim: string;
  relatedWeeks: string[];
  processSteps: UnswEcon3202ProcessStep[];
  sourceBoundary: UnswEcon3202ProcessStep[];
  portfolioUse: string;
};

export type UnswEcon3202ProcessStep = {
  title: string;
  text: string;
};

export type UnswEcon3202ReferenceBridge = {
  label: string;
  source: string;
  span: string;
  use: string;
};

const ECON3202_LOCAL_ROOT = '/Users/yinyiping/Desktop/Private Wiki/UNSW/ECON 3202';
const ECON3202_FILE_ROOT = 'file:///Users/yinyiping/Desktop/Private%20Wiki/UNSW/ECON%203202';
const ECON3202_MANUAL_ROOT =
  'file:///Users/yinyiping/Desktop/Private%20Wiki/UNSW/UNSW%20HTML/ECON%203202';

function econFile(
  relativePath: string,
  label: string,
  role: string,
  pages?: string,
): UnswEcon3202LocalFile {
  const encodedPath = relativePath.split('/').map(encodeURIComponent).join('/');
  return {
    label,
    role,
    localPath: `${ECON3202_LOCAL_ROOT}/${relativePath}`,
    href: `${ECON3202_FILE_ROOT}/${encodedPath}`,
    pages,
  };
}

export const UNSW_SHELF_COURSE: UnswShelfCourse = {
  code: 'ECON3202',
  title: 'Mathematical Economics',
  units: '6 UOC',
  offering: '2026 · Term 1 · T1',
  delivery: 'In Person · Standard · Kensington',
  owner: 'UNSW Business School · School of Economics',
  summary:
    'ECON 3202 is the first full UNSW course path in Loom: official source truth, weekly mathematical spine, problem-set work, and portfolio-ready study evidence.',
};

export const UNSW_SHELF_SOURCE_LINKS: UnswShelfLink[] = [
  {
    label: 'Handbook',
    href: 'https://www.handbook.unsw.edu.au/undergraduate/courses/2026/ECON3202',
    note: 'Official course identity and UOC reference.',
  },
  {
    label: 'MATH2991 Handbook',
    href: 'https://handbook.unsw.edu.au/undergraduate/courses/2026/MATH2991',
    note: 'Official 2026 catalogue page for Data and Algorithms in Trading.',
  },
  {
    label: 'Course outline',
    href: 'https://www.unsw.edu.au/course-outlines/course-outline#year=2026&term=Term%201&deliveryMode=In%20Person&deliveryFormat=Standard&teachingPeriod=T1&deliveryLocation=Kensington&courseCode=ECON3202&activityGroupId=1',
    note: 'Assessment, CLO, offering, and delivery source.',
  },
  {
    label: 'Moodle source',
    href: 'https://moodle.telt.unsw.edu.au/course/view.php?id=97199',
    note: 'Week sequence and course material source.',
  },
  {
    label: 'Moodle dashboard',
    href: 'https://moodle.telt.unsw.edu.au/my/',
    note: 'Course overview captured on 04 Jun 2026 for official course ids, offerings, and MATH2991 T2 status.',
  },
];

export const UNSW_SHELF_SOURCE_GROUPS = [
  {
    title: 'Official source layer',
    items: ['Handbook', 'MATH2991 Handbook', 'Course outline', 'Moodle source', 'Moodle dashboard'],
  },
  {
    title: 'Reference layer',
    items: [
      'Advanced Microeconomic Theory, Jehle and Reny',
      'Fundamental Methods of Mathematical Economics, Chiang',
      'A First Course in Optimization Theory, Sundaram',
    ],
  },
  {
    title: 'Working layer',
    items: ['Weekly PDFs', 'Suggested exercises', 'Problem set briefs', 'Codex explanation PDFs'],
  },
];

export const UNSW_SHELF_PATH: UnswShelfPathBlock[] = [
  {
    label: 'W01',
    focus: 'Logic, set theory, and Euclidean spaces',
    sources: ['W1 A Elements Logic', 'W1 B Set Theory', 'W1 C Euclidean Spaces'],
  },
  {
    label: 'W02',
    focus: 'Convex sets, topology, and open sets',
    sources: ['W2 A Convex Sets', 'W2 B Elements Topology', 'W2 C Open Sets'],
  },
  {
    label: 'W03',
    focus: 'Functions and continuity',
    sources: ['W3 A Functions', 'W3 B Continuity', 'W3 C Continuity in Multidim Spaces'],
  },
  {
    label: 'W04',
    focus: 'Sequences, limits, continuity, and existence theorem',
    sources: ['W4 A Sequences', 'W4 B Limits and Continuity', 'W4 C Existence Theorem'],
  },
  {
    label: 'W05',
    focus: 'Linear functions and univariate differentiation',
    sources: ['W5 A Linear Functions', 'W5 B Univariate Differentiation', 'W5 C Properties'],
  },
  {
    label: 'W07',
    focus: 'Differentiation in multidimensional spaces',
    sources: [
      'W7 A Differentiation Multidim Spaces',
      'W7 B Partial Derivatives',
      'W7 C Implicit Function Theorem',
    ],
  },
  {
    label: 'W08',
    focus: 'Concave functions',
    sources: [
      'W8 A Concave-Functions',
      'W8 B Multidim Concave Functions',
      'W8 C Suggested Exercises',
    ],
  },
  {
    label: 'W09',
    focus: 'Unconstrained optimisation',
    sources: [
      'W9 A Unconstrained Optimisation 1',
      'W9 B Unconstrained Optimisation n',
      'W9 C Exercises',
    ],
  },
  {
    label: 'W10',
    focus: 'Lagrange method',
    sources: ['W10 A Lagrange'],
  },
];

export const UNSW_SHELF_PROBLEM_SETS: UnswShelfProblemSet[] = [
  {
    label: 'PS01',
    question: 'Problem Set 01.pdf',
    answer: 'Problem1.pdf',
    pages: '2 question pages · 4 answer pages',
  },
  {
    label: 'PS02',
    question: 'Problem Set 02.pdf',
    answer: 'Problem2.pdf',
    pages: '2 question pages · 5 answer pages',
  },
  {
    label: 'PS03',
    question: 'Problem Set 03.pdf',
    answer: 'Problem 3.pdf',
    pages: '1 question page · 5 answer pages',
  },
  {
    label: 'PS04',
    question: 'Problem Set 04.pdf',
    answer: 'Problem 4.pdf',
    pages: '2 brief pages · 8 answer pages',
  },
];

export const UNSW_SHELF_OUTPUTS: UnswShelfOutput[] = [
  {
    title: 'Course map',
    text: 'A source-aware map that separates official source truth, Moodle sequence, assessment track, and local file library.',
  },
  {
    title: 'Problem explanations',
    text: 'Codex explanation PDFs for problem-set work become inspectable study evidence rather than hidden scratch output.',
  },
  {
    title: 'Portfolio-ready learning path',
    text: 'The shelf can show how mathematical economics work turns into proof for finance, trading, and quantitative study.',
  },
];

export const UNSW_SHELF_NEXT_ACTIONS = [
  'Connect each week to its current strongest note or problem-set output.',
  'Separate official facts from private summaries before publishing any course claim.',
  'Turn PS01 to PS04 into a visible worked-example trail.',
  'Use ECON 3202 as the template for MATH2991 and future UNSW courses.',
];

export const UNSW_ECON3202_MANUAL = {
  title: 'Generated ECON3202 course manual',
  href: `${ECON3202_MANUAL_ROOT}/COURSE.html`,
  localPath: '/Users/yinyiping/Desktop/Private Wiki/UNSW/UNSW HTML/ECON 3202/COURSE.html',
  summary:
    'The existing local manual already separates source state, term sequence, assessment track, and file library. Loom now turns that archive into a public-facing learning evidence chain.',
};

export const UNSW_ECON3202_FACTS = [
  { label: 'Course', value: 'ECON3202 Mathematical Economics' },
  { label: 'Source state', value: '2 assessments · 5 CLOs · published 03 Feb 2026' },
  { label: 'Archive state', value: '51 files · 102.7 MB · 51 visible files' },
  { label: 'Assessment split', value: 'Problem Sets 48% · Final Exam 52%' },
  { label: 'Final exam', value: 'Wed 6 May 2026 · 2:30 PM' },
];

export const UNSW_ECON3202_PROCESS: UnswEcon3202ProcessStep[] = [
  {
    title: 'Official truth',
    text: 'Handbook, course outline, timetable, and Moodle define course identity, dates, assessments, and week order.',
  },
  {
    title: 'Local archive',
    text: 'Weekly PDFs, reference books, problem sets, and generated previews are preserved as a source library rather than mixed into prose.',
  },
  {
    title: 'Working proof',
    text: 'Problem-set answers and Codex explanations become visible evidence of mathematical reasoning and study process.',
  },
  {
    title: 'Portfolio layer',
    text: 'The course becomes inspectable proof for finance, trading, quantitative study, and future AI-persona answers.',
  },
];

export const UNSW_ECON3202_WEEKS: UnswEcon3202Week[] = [
  {
    label: 'W01',
    focus: 'Logic, set theory, and Euclidean spaces',
    question: 'What language does mathematical economics use before models appear?',
    files: [
      econFile('02_Week/W01/W1 A Elements Logic.pdf', 'W1 A Elements Logic.pdf', 'Lecture'),
      econFile('02_Week/W01/W1 B Set Theory.pdf', 'W1 B Set Theory.pdf', 'Lecture'),
      econFile('02_Week/W01/W1 C Euclidean Spaces.pdf', 'W1 C Euclidean Spaces.pdf', 'Lecture'),
      econFile(
        '02_Week/W01/W1 D Suggested Exercises.pdf',
        'W1 D Suggested Exercises.pdf',
        'Exercises',
      ),
      econFile(
        '02_Week/W01/W1 E Suggested Solutions.pdf',
        'W1 E Suggested Solutions.pdf',
        'Solutions',
      ),
    ],
    references: ['JR A1.1', 'JR A1.2.1'],
    output: 'Foundation for PS01 and a glossary of proof language.',
  },
  {
    label: 'W02',
    focus: 'Convex sets, topology, and open sets',
    question: 'How do feasible sets and neighbourhoods become economic objects?',
    files: [
      econFile('02_Week/W02/W2 A Convex Sets.pdf', 'W2 A Convex Sets.pdf', 'Lecture'),
      econFile('02_Week/W02/W2 B Elements Topology.pdf', 'W2 B Elements Topology.pdf', 'Lecture'),
      econFile('02_Week/W02/W2 C Open Sets.pdf', 'W2 C Open Sets.pdf', 'Lecture'),
      econFile(
        '02_Week/W02/W2 D Suggested Exercises.pdf',
        'W2 D Suggested Exercises.pdf',
        'Exercises',
      ),
    ],
    references: ['JR A1.2.2', 'JR A1.3'],
    output: 'Convexity and topology notes ready to connect to optimisation.',
  },
  {
    label: 'W03',
    focus: 'Functions and continuity',
    question: 'How does continuity make economic functions stable enough to analyse?',
    files: [
      econFile('02_Week/W03/W3 A Functions.pdf', 'W3 A Functions.pdf', 'Lecture'),
      econFile('02_Week/W03/W3 B Continuity.pdf', 'W3 B Continuity.pdf', 'Lecture'),
      econFile(
        '02_Week/W03/W3 C Continuity in Multidim Spaces.pdf',
        'W3 C Continuity in Multidim Spaces.pdf',
        'Lecture',
      ),
      econFile(
        '02_Week/W03/W3 D Suggested Exercises.pdf',
        'W3 D Suggested Exercises.pdf',
        'Exercises',
      ),
    ],
    references: ['JR A1.3.1'],
    output: 'Continuity language for proof-based model reading.',
  },
  {
    label: 'W04',
    focus: 'Sequences, limits, continuity, and existence theorem',
    question: 'When can a mathematical object be shown to exist?',
    files: [
      econFile('02_Week/W04/W4 A Sequences.pdf', 'W4 A Sequences.pdf', 'Lecture'),
      econFile(
        '02_Week/W04/W4 B Limits and Continuity.pdf',
        'W4 B Limits and Continuity.pdf',
        'Lecture',
      ),
      econFile('02_Week/W04/W4 C Existence Theorem.pdf', 'W4 C Existence Theorem.pdf', 'Lecture'),
      econFile(
        '02_Week/W04/W4 D Sugggested Exercises.pdf',
        'W4 D Sugggested Exercises.pdf',
        'Exercises',
      ),
    ],
    references: ['JR A1.3.2'],
    output: 'Existence-theorem notes that can later support equilibrium reasoning.',
  },
  {
    label: 'W05',
    focus: 'Linear functions and univariate differentiation',
    question: 'How do linear structure and single-variable derivatives enter optimisation?',
    files: [
      econFile('02_Week/W05/W5 A Linear Functions.pdf', 'W5 A Linear Functions.pdf', 'Lecture'),
      econFile(
        '02_Week/W05/W5 B Univariate Differentiation.pdf',
        'W5 B Univariate Differentiation.pdf',
        'Lecture',
      ),
      econFile('02_Week/W05/W5 C Properties.pdf', 'W5 C Properties.pdf', 'Lecture'),
      econFile(
        '02_Week/W05/W5 D Suggested Exercises.pdf',
        'W5 D Suggested Exercises.pdf',
        'Exercises',
      ),
    ],
    references: ['JR A2.1.1', 'Chiang methods review'],
    output: 'Differentiation base for PS02 and later first-order-condition work.',
  },
  {
    label: 'W07',
    focus: 'Differentiation in multidimensional spaces',
    question:
      'How do partial derivatives and implicit functions carry economic comparative statics?',
    files: [
      econFile(
        '02_Week/W07/W7 A Differentiation Multidim Spaces.pdf',
        'W7 A Differentiation Multidim Spaces.pdf',
        'Lecture',
      ),
      econFile(
        '02_Week/W07/W7 B Partial Derivatives.pdf',
        'W7 B Partial Derivatives.pdf',
        'Lecture',
      ),
      econFile(
        '02_Week/W07/W7 C Implicit Function Theorem.pdf',
        'W7 C Implicit Function Theorem.pdf',
        'Lecture',
      ),
      econFile(
        '02_Week/W07/W7 D Suggested Exercises.pdf',
        'W7 D Suggested Exercises.pdf',
        'Exercises',
      ),
    ],
    references: ['JR A2.1.2'],
    output: 'Implicit-function and comparative-statics bridge for portfolio explanation.',
  },
  {
    label: 'W08',
    focus: 'Concave functions',
    question: 'How does concavity turn optimisation into economically meaningful structure?',
    files: [
      econFile('02_Week/W08/W8 A Concave-Functions.pdf', 'W8 A Concave-Functions.pdf', 'Lecture'),
      econFile(
        '02_Week/W08/W8 B Multidim Concave Functions.pdf',
        'W8 B Multidim Concave Functions.pdf',
        'Lecture',
      ),
      econFile(
        '02_Week/W08/W8 C Suggested Exercises.pdf',
        'W8 C Suggested Exercises.pdf',
        'Exercises',
      ),
    ],
    references: ['JR A1.4.2'],
    output: 'Concavity evidence for PS03 and optimisation interpretation.',
  },
  {
    label: 'W09',
    focus: 'Unconstrained optimisation',
    question: 'How do first-order and second-order conditions produce optimal choices?',
    files: [
      econFile(
        '02_Week/W09/W9 A Unconstrained Optimisation 1 .pdf',
        'W9 A Unconstrained Optimisation 1 .pdf',
        'Lecture',
      ),
      econFile(
        '02_Week/W09/W9 B Unconstrained Optimisation n.pdf',
        'W9 B Unconstrained Optimisation n.pdf',
        'Lecture',
      ),
      econFile('02_Week/W09/W9 C Exercises.pdf', 'W9 C Exercises.pdf', 'Exercises'),
    ],
    references: ['Sundaram optimisation theory'],
    output: 'Unconstrained optimisation path for PS04 and final review.',
  },
  {
    label: 'W10',
    focus: 'Lagrange method',
    question: 'How do constraints change the optimisation story?',
    files: [econFile('02_Week/W10/W10 A Lagrange.pdf', 'W10 A Lagrange.pdf', 'Lecture')],
    references: ['Sundaram constrained optimisation'],
    output: 'Constrained-optimisation close for exam preparation.',
  },
];

export const UNSW_ECON3202_PROBLEM_SETS: UnswEcon3202ProblemSet[] = [
  {
    slug: 'ps01',
    label: 'PS01',
    focus: 'Logic, sets, functions',
    opened: 'Sat 28 Feb 2026 · 12:00 AM',
    due: 'Wed 4 Mar 2026 · 2:00 PM',
    weight: 'Part of Problem Sets 48%',
    files: [
      econFile('03_Problem_Set/Problem Set 01.pdf', 'Problem Set 01.pdf', 'Assignment', '2 pages'),
      econFile('03_Problem_Set/Problem1.pdf', 'Problem1.pdf', 'Answer', '4 pages'),
      econFile(
        '03_Problem_Set/Problem1-codex-explanation.pdf',
        'Problem1-codex-explanation.pdf',
        'Codex explanation',
      ),
    ],
    evidence: 'Shows the first conversion from source PDFs into worked reasoning and explanation.',
    claim:
      'PS01 proves the course is not just being stored: source PDFs, an answer file, and a Codex explanation are already connected as inspectable mathematical work.',
    relatedWeeks: ['W01', 'W02', 'W03'],
    processSteps: [
      {
        title: 'Read the language layer',
        text: 'Logic, sets, Euclidean spaces, convexity, topology, and functions create the vocabulary needed before economic models become rigorous.',
      },
      {
        title: 'Answer the assignment',
        text: 'The problem-set answer file turns early definitions and proof tools into written mathematical work.',
      },
      {
        title: 'Explain the work',
        text: 'The Codex explanation file records a second layer: how the solution can be made understandable as a learning artifact.',
      },
    ],
    sourceBoundary: [
      {
        title: 'Assignment source',
        text: 'Problem Set 01.pdf is the Moodle assignment source and should remain separate from answer or explanation files.',
      },
      {
        title: 'Private working answer',
        text: 'Problem1.pdf is a local answer artifact. It can support portfolio evidence, but it should not be represented as official course material.',
      },
      {
        title: 'AI explanation layer',
        text: 'Problem1-codex-explanation.pdf is a generated explanation layer. Loom should label it as process evidence, not as source truth.',
      },
    ],
    portfolioUse:
      'Use PS01 as the first public proof that the portfolio has a real mathematical study process behind its finance and quant narrative.',
  },
  {
    slug: 'ps02',
    label: 'PS02',
    focus: 'Continuity and differentiation',
    opened: 'Tue 10 Mar 2026 · 12:00 AM',
    due: 'Wed 18 Mar 2026 · 2:00 PM',
    weight: 'Part of Problem Sets 48%',
    files: [
      econFile('03_Problem_Set/Problem Set 02.pdf', 'Problem Set 02.pdf', 'Assignment', '2 pages'),
      econFile('03_Problem_Set/Problem2.pdf', 'Problem2.pdf', 'Answer', '5 pages'),
    ],
    evidence:
      'Connects W03-W05 continuity and derivative material to a marked problem-set sequence.',
    claim:
      'PS02 is the bridge from definitions to calculus-based reasoning: continuity and differentiation become visible answer work.',
    relatedWeeks: ['W03', 'W04', 'W05'],
    processSteps: [
      {
        title: 'Stabilize functions',
        text: 'The work depends on continuity and limits so functions can be used in later optimisation arguments.',
      },
      {
        title: 'Move into derivatives',
        text: 'Univariate differentiation gives the course a working path from abstract definitions toward first-order conditions.',
      },
      {
        title: 'Keep evidence minimal',
        text: 'The assignment and answer files are enough to prove the sequence exists before writing a longer public explanation.',
      },
    ],
    sourceBoundary: [
      {
        title: 'Assignment source',
        text: 'Problem Set 02.pdf remains the course-provided assignment object.',
      },
      {
        title: 'Answer artifact',
        text: 'Problem2.pdf is the private answer artifact and should be displayed as evidence of work, not as official instruction.',
      },
    ],
    portfolioUse:
      'Use PS02 to show the transition from mathematical definitions into derivative-based economic reasoning.',
  },
  {
    slug: 'ps03',
    label: 'PS03',
    focus: 'Concavity and multidimensional work',
    opened: 'Wed 1 Apr 2026 · 12:00 AM',
    due: 'Wed 8 Apr 2026 · 2:00 PM',
    weight: 'Part of Problem Sets 48%',
    files: [
      econFile('03_Problem_Set/Problem Set 03.pdf', 'Problem Set 03.pdf', 'Assignment', '1 page'),
      econFile('03_Problem_Set/Problem 3.pdf', 'Problem 3.pdf', 'Answer', '5 pages'),
      econFile(
        '03_Problem_Set/Problem3-codex-explanation.pdf',
        'Problem3-codex-explanation.pdf',
        'Codex explanation',
      ),
    ],
    evidence: 'Turns concavity and multidimensional differentiation into inspectable work product.',
    claim:
      'PS03 shows the course becoming portfolio-grade: concavity and multidimensional reasoning are connected to an answer and an explanation layer.',
    relatedWeeks: ['W07', 'W08'],
    processSteps: [
      {
        title: 'Use multidimensional tools',
        text: 'Partial derivatives and implicit-function language set up the technical base for higher-dimensional economic reasoning.',
      },
      {
        title: 'Interpret concavity',
        text: 'Concavity becomes the conceptual link between function shape and optimisation logic.',
      },
      {
        title: 'Preserve explanation evidence',
        text: 'The Codex explanation file makes the reasoning path inspectable rather than leaving only final answers.',
      },
    ],
    sourceBoundary: [
      {
        title: 'Assignment source',
        text: 'Problem Set 03.pdf is the assignment object and should stay clearly separated from all local solution artifacts.',
      },
      {
        title: 'Answer artifact',
        text: 'Problem 3.pdf is the local answer file for worked evidence.',
      },
      {
        title: 'AI explanation layer',
        text: 'Problem3-codex-explanation.pdf records reasoning support and must be labeled as an explanation layer.',
      },
    ],
    portfolioUse:
      'Use PS03 as a compact proof of advanced mathematical maturity: multidimensional methods, concavity, and explanation discipline.',
  },
  {
    slug: 'ps04',
    label: 'PS04',
    focus: 'Optimisation and final review',
    opened: 'Tue 14 Apr 2026 · 12:00 AM',
    due: 'Wed 22 Apr 2026 · 2:00 PM',
    weight: 'Part of Problem Sets 48%',
    files: [
      econFile('03_Problem_Set/Problem Set 04.pdf', 'Problem Set 04.pdf', 'Brief', '2 pages'),
      econFile('03_Problem_Set/Problem 4.pdf', 'Problem 4.pdf', 'Answer', '8 pages'),
    ],
    evidence: 'Connects unconstrained and constrained optimisation to the final course arc.',
    claim:
      'PS04 closes the course arc by making optimisation work visible before the final exam layer.',
    relatedWeeks: ['W09', 'W10'],
    processSteps: [
      {
        title: 'Collect optimisation tools',
        text: 'Unconstrained optimisation provides first-order and second-order conditions for choice problems.',
      },
      {
        title: 'Add constraints',
        text: 'The Lagrange method extends the same reasoning into constrained economic settings.',
      },
      {
        title: 'Prepare final synthesis',
        text: 'The answer file can become the final bridge from weekly work to exam preparation and portfolio narrative.',
      },
    ],
    sourceBoundary: [
      {
        title: 'Brief source',
        text: 'Problem Set 04.pdf is a brief source object, so the page should preserve that role instead of calling it a full question file.',
      },
      {
        title: 'Answer artifact',
        text: 'Problem 4.pdf is the local answer artifact and should be treated as worked evidence.',
      },
    ],
    portfolioUse:
      'Use PS04 to show the course endpoint: optimisation, constraints, final review, and a coherent quantitative foundation.',
  },
];

export const UNSW_ECON3202_PROBLEM_SET_SLUGS = UNSW_ECON3202_PROBLEM_SETS.map((set) => set.slug);

export function getUnswEcon3202ProblemSet(slug: string) {
  return UNSW_ECON3202_PROBLEM_SETS.find((set) => set.slug === slug);
}

export const UNSW_ECON3202_REFERENCE_BRIDGE: UnswEcon3202ReferenceBridge[] = [
  {
    label: 'JR A1.1-A1.3.2',
    source: 'Advanced Microeconomic Theory, Jehle and Reny',
    span: 'Logic, sets, topology, continuity, existence',
    use: 'Supports W01-W04 and the early proof language.',
  },
  {
    label: 'JR A1.4.2',
    source: 'Advanced Microeconomic Theory, Jehle and Reny',
    span: 'Concave functions',
    use: 'Supports W08 and optimisation interpretation.',
  },
  {
    label: 'JR A2.1.1-A2.1.2',
    source: 'Advanced Microeconomic Theory, Jehle and Reny',
    span: 'Single-variable and several-variable functions',
    use: 'Supports W05-W07 differentiation.',
  },
  {
    label: 'Sundaram optimisation',
    source: 'A First Course in Optimization Theory',
    span: 'Unconstrained and constrained optimisation',
    use: 'Supports W09-W10 and final review.',
  },
];

export const UNSW_ECON3202_PORTFOLIO_OUTPUTS = [
  {
    title: 'Mathematical proof trail',
    text: 'A week-by-week record that explains how logic, topology, continuity, differentiation, concavity, and optimisation accumulate.',
  },
  {
    title: 'Problem-set evidence',
    text: 'Assignments, answers, and available Codex explanations form a visible trail of work instead of hidden files.',
  },
  {
    title: 'Quant foundation narrative',
    text: 'The course can become proof that the portfolio has mathematical depth behind finance, trading, and AI-assisted study claims.',
  },
];
