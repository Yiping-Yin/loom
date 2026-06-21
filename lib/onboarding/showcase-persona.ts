/**
 * showcase-persona.ts — a FICTIONAL sample identity that powers the landing's
 * "What you're weaving" product showcase. It lets a stranger SEE a finished
 * LOOM (identity + capability star-river) without exposing the real owner's
 * data. Pure data, rendered decoratively; this is not a real profile and is
 * never persisted.
 */
import type { BeginnerCapability } from '../capability/capability-graph';

export const SHOWCASE_PERSONA = {
  name: 'Maya Chen',
  role: 'Product Designer',
  location: 'Berlin',
  summary:
    'Ten years turning research into systems — design ops, prototyping, and a habit of writing things down.',
  sourcesCount: 14,
  artifactsVerified: 3,
} as const;

export const SHOWCASE_CAPABILITIES: BeginnerCapability[] = [
  {
    id: 'cap-design-systems',
    label: 'Design Systems',
    status: 'strong',
    evidence: [
      { kind: 'experience', refId: 'exp-techcorp', label: 'Design Systems Lead, TechCorp' },
      { kind: 'artifact', refId: 'art-tokens-deck', label: 'Token Architecture Deck' },
    ],
  },
  {
    id: 'cap-user-research',
    label: 'User Research',
    status: 'strong',
    evidence: [
      { kind: 'experience', refId: 'exp-research', label: 'Research sprints, 2019–2024' },
      { kind: 'work', refId: 'work-study', label: 'Onboarding study write-up' },
    ],
  },
  {
    id: 'cap-prototyping',
    label: 'Prototyping',
    status: 'strong',
    evidence: [
      { kind: 'artifact', refId: 'art-proto', label: 'Interactive prototype reel' },
      { kind: 'experience', refId: 'exp-proto', label: 'Rapid prototyping practice' },
    ],
  },
  {
    id: 'cap-design-ops',
    label: 'Design Ops',
    status: 'partial',
    evidence: [{ kind: 'experience', refId: 'exp-ops', label: 'Ran the design-ops rituals' }],
  },
  {
    id: 'cap-facilitation',
    label: 'Facilitation',
    status: 'partial',
    evidence: [{ kind: 'work', refId: 'work-workshop', label: 'Discovery workshop kit' }],
  },
  {
    id: 'cap-frontend',
    label: 'Front-end',
    status: 'partial',
    evidence: [{ kind: 'education', refId: 'edu-frontend', label: 'Front-end foundations' }],
  },
  {
    id: 'cap-service-design',
    label: 'Service Design',
    status: 'direction',
    evidence: [],
  },
];
