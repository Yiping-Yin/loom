export type NewLoomCapabilityId = 'sources' | 'draft';
export type NewLoomRouteClass = 'primary' | 'runtime' | 'legacy' | 'support' | 'internal';

export type NewLoomCapability = {
  id: NewLoomCapabilityId;
  label: 'Sources' | 'Draft';
  shortLabel: 'Source archive' | 'Grounded draft';
  href: string;
  description: string;
  primaryAction: string;
  nativeAction?: string;
};

export const NEW_LOOM_CAPABILITIES: NewLoomCapability[] = [
  {
    id: 'sources',
    label: 'Sources',
    shortLabel: 'Source archive',
    href: '/sources',
    description: 'Collect learning paths. Add, capture, and review source material for Overview, Path, Sources, Process, and Outputs: resources, course material, certificate evidence, and portfolio process records.',
    primaryAction: 'Open sources',
  },
  {
    id: 'draft',
    label: 'Draft',
    shortLabel: 'Grounded draft',
    href: '/draft',
    description: 'Turn sources into personal explanations, portfolio notes, public writeups, detailed process pages, and portfolio Outputs that stay grounded in the Path.',
    primaryAction: 'Start draft',
  },
];

export const NEW_LOOM_PRIMARY_ROUTES = [
  '/',
  '/sources',
  '/draft',
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
  '/help',
  '/offline',
  '/onboarding',
  '/colophon',
  '/product-history',
  '/system',
  '/discipline',
  '/year',
  '/hour',
  '/connections',
] as const;

export const NEW_LOOM_INTERNAL_ROUTES = [
  '/demo',
  '/dev/principles',
  '/dev/traces',
  '/doc',
  '/graph',
  '/kesi',
  '/llm-wiki',
  '/quizzes',
] as const;

export const NEW_LOOM_INTERNAL_ROUTE_PREFIXES = [
  '/wiki',
  '/digital-me',
  '/drafts',
  '/education',
  '/experience',
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
