// ONE-digital-me + web-retirement (owner, 2026-07-08): Studio/Draft and the
// web Digital Me elevation retired — the native workbench and the native You
// dossier won. Sources remains the one web workspace until its own cluster.
export type NewLoomCapabilityId = 'sources';
export type NewLoomRouteClass = 'primary' | 'runtime' | 'legacy' | 'support' | 'internal';

export type NewLoomCapability = {
  id: NewLoomCapabilityId;
  label: 'Sources';
  shortLabel: 'Source context';
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
];

export const NEW_LOOM_PRIMARY_ROUTES: readonly string[] = [
  '/',
  '/sources',
];

// (The /loom-render runtime magazine retired in web-retirement 3/7: its only
// native mounts died with the minimal shell; snapshot html still lands on
// disk next to each capture and opens via QuickLook / the in-app reader.)
export const NEW_LOOM_RUNTIME_ROUTES: readonly string[] = [];

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

export const NEW_LOOM_SUPPORT_ROUTES: readonly string[] = [
  '/about',
  '/help',
  '/offline',
  '/colophon',
  '/product-history',
  '/system',
  '/discipline',
  '/year',
  '/hour',
  '/connections',
];

export const NEW_LOOM_INTERNAL_ROUTES: readonly string[] = [
  '/demo',
  '/dev/principles',
  '/dev/traces',
  '/doc',
  '/graph',
  '/kesi',
  '/llm-wiki',
  '/quizzes',
];

export const NEW_LOOM_INTERNAL_ROUTE_PREFIXES: readonly string[] = [
  '/wiki',
  '/card',
  '/education',
  '/example',
  '/experience',
  '/works',
  '/knowledge/[category]',
  '/knowledge/unsw',
  '/loom',
  '/uploads/[name]',
];

export const NEW_LOOM_ROUTE_CLASSIFICATION = {
  primary: NEW_LOOM_PRIMARY_ROUTES,
  runtime: NEW_LOOM_RUNTIME_ROUTES,
  legacy: NEW_LOOM_LEGACY_ROUTES,
  support: NEW_LOOM_SUPPORT_ROUTES,
  internal: NEW_LOOM_INTERNAL_ROUTES,
} as const satisfies Record<NewLoomRouteClass, readonly string[]>;
