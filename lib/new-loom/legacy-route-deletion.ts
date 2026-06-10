import { NEW_LOOM_LEGACY_ROUTES } from './product-shell';

export type NewLoomLegacyRoute = (typeof NEW_LOOM_LEGACY_ROUTES)[number];

export type NewLoomLegacyRouteDeletionChecklist = {
  hiddenFromPrimaryNavigation: boolean;
  notRequiredByRuntime: boolean;
  replacementEvidenceExists: boolean;
  hiddenForOneReleaseCycle: boolean;
};

export type NewLoomLegacyRouteDeletionReview = {
  route: NewLoomLegacyRoute;
  replacementEvidence: string[];
  blockers: string[];
  checklist: NewLoomLegacyRouteDeletionChecklist;
  readyForDeletion: boolean;
};

const DEFAULT_BLOCKERS = [
  'No release cycle has shipped with this compatibility route hidden.',
  'Keep the redirect until the next deletion review confirms there is no external dependency.',
];

const ROUTE_REPLACEMENT_EVIDENCE: Partial<Record<NewLoomLegacyRoute, string[]>> = {
  '/uploads': ['/sources Add files replaces the old upload entry while preserving source-library evidence.'],
  '/knowledge': ['/sources owns source library browsing and knowledge entry points.'],
  '/desk': ['/sources owns the reading desk and source review path.'],
  '/notes': ['/sources#reader-notes owns reader notes in the new source-backed surface.'],
  '/coworks': ['/draft owns collaboration output and working draft continuation.'],
  '/diagrams': ['/draft owns structured output, diagrams, and explainable draft artifacts.'],
};

function replacementEvidenceFor(route: NewLoomLegacyRoute) {
  return ROUTE_REPLACEMENT_EVIDENCE[route] ?? [
    `${route} remains a compatibility redirect covered by the legacy migration plan; replacement lives in Sources or Draft.`,
  ];
}

function isReadyForDeletion(
  checklist: NewLoomLegacyRouteDeletionChecklist,
  blockers: string[],
) {
  return Object.values(checklist).every(Boolean) && blockers.length === 0;
}

export const NEW_LOOM_LEGACY_ROUTE_DELETION_REVIEWS: NewLoomLegacyRouteDeletionReview[] =
  NEW_LOOM_LEGACY_ROUTES.map((route) => {
    const checklist: NewLoomLegacyRouteDeletionChecklist = {
      hiddenFromPrimaryNavigation: true,
      notRequiredByRuntime: true,
      replacementEvidenceExists: true,
      hiddenForOneReleaseCycle: false,
    };
    const blockers = [...DEFAULT_BLOCKERS];

    return {
      route,
      replacementEvidence: replacementEvidenceFor(route),
      blockers,
      checklist,
      readyForDeletion: isReadyForDeletion(checklist, blockers),
    };
  });

export function getLegacyRouteDeletionReview(route: string) {
  return NEW_LOOM_LEGACY_ROUTE_DELETION_REVIEWS.find((review) => review.route === route);
}

export function listLegacyRoutesReadyForDeletion() {
  return NEW_LOOM_LEGACY_ROUTE_DELETION_REVIEWS
    .filter((review) => review.readyForDeletion)
    .map((review) => review.route);
}
