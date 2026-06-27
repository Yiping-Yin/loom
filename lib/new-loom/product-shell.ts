export type NewLoomCapabilityId = 'sources' | 'studio' | 'digital-me';
export type NewLoomRouteClass = 'primary' | 'runtime' | 'legacy' | 'support' | 'internal';

export type NewLoomCapability = {
  id: NewLoomCapabilityId;
  label: 'Sources' | 'Studio' | 'Digital Me';
  shortLabel: 'Source context' | 'Form workbench' | 'Living representation';
  href: string;
  description: string;
  primaryAction: string;
  nativeAction?: string;
};

export const NEW_LOOM_CAPABILITIES: NewLoomCapability[] = [
  {
    id: 'sources',
    label: 'Sources',
    shortLabel: 'Source context',
    href: '/sources',
    description: 'Collect resources for learning paths, projects, captures, notes, and prior work, then resolve them into claims, quotes, examples, contradictions, gaps, and questions that can shape the next form.',
    primaryAction: 'Open Sources',
  },
  {
    id: 'studio',
    label: 'Studio',
    shortLabel: 'Form workbench',
    href: '/studio',
    description: 'Shape resolved source pieces into block documents, cited answers, process pages, portfolio explanations, proofs, and artifacts. Draft remains the compatibility storage name; Studio is the product surface.',
    primaryAction: 'Open Studio',
  },
  {
    id: 'digital-me',
    label: 'Digital Me',
    shortLabel: 'Living representation',
    href: '/digital-me',
    description: 'Present selected Studio forms and source-backed claims as a living representation that can answer with citations to the real work behind it.',
    primaryAction: 'Open Digital Me',
  },
];

export const NEW_LOOM_PRIMARY_ROUTES = [
  '/',
  '/sources',
  '/studio',
  '/digital-me',
] as const;

export const NEW_LOOM_RUNTIME_ROUTES = [
  '/loom-render/capture',
  '/loom-render/captures',
  '/loom-render/snapshot',
] as const;

export const NEW_LOOM_LEGACY_ROUTES = [
  '/knowledge',
  '/atlas',
  '/atlas/shelf',
  '/browse',
  '/weaves',
  '/patterns',
  '/panel',
  '/panel/[id]',
  '/panels/[id]',
  '/pursuits',
  '/pursuit',
  '/pursuit/[id]',
  '/pursuits/[id]',
  '/workbench',
  '/coworks',
  '/atelier',
  '/letter',
  '/diagrams',
  '/collect',
  '/collection',
  '/constellation',
  '/soan',
  '/salon',
  '/palimpsest',
  '/branching',
  '/desk',
  '/today',
  '/contents',
  '/notes',
  '/highlights',
  '/uploads',
  '/cover',
  '/frontispiece',
] as const;

export const NEW_LOOM_SUPPORT_ROUTES = [
  '/about',
  '/draft',
  '/help',
  '/offline',
  '/onboarding',
  '/onboarding/profile',
  '/onboarding/profile/form',
  '/colophon',
  '/product-history',
  '/system',
  '/discipline',
  '/year',
  '/hour',
  '/connections',
] as const;

export const NEW_LOOM_INTERNAL_ROUTES = [
  '/account',
  '/demo',
  '/dev/principles',
  '/dev/traces',
  '/doc',
  '/graph',
  '/kesi',
  '/llm-wiki',
  '/me',
  '/quizzes',
] as const;

export const NEW_LOOM_INTERNAL_ROUTE_PREFIXES = [
  '/wiki',
  '/card',
  '/drafts',
  '/education',
  '/example',
  '/experience',
  '/works',
  '/knowledge/[category]',
  '/knowledge/unsw',
  '/loom',
  '/uploads/[name]',
] as const;

export const NEW_LOOM_ROUTE_CLASSIFICATION = {
  primary: NEW_LOOM_PRIMARY_ROUTES,
  runtime: NEW_LOOM_RUNTIME_ROUTES,
  legacy: NEW_LOOM_LEGACY_ROUTES,
  support: NEW_LOOM_SUPPORT_ROUTES,
  internal: NEW_LOOM_INTERNAL_ROUTES,
} as const satisfies Record<NewLoomRouteClass, readonly string[]>;
