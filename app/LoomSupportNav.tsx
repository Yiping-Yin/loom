import { LoomGlobalNav } from '../components/verified-dossier/LoomGlobalNav';

/**
 * LoomSupportNav keeps the support page API stable while delegating to the
 * single global Loom navigation component.
 */

export type LoomSupportNavKey =
  | '/system'
  | '/discipline'
  | '/year'
  | '/hour'
  | '/connections'
  | '/colophon';

export function LoomSupportNav({ active }: { active: LoomSupportNavKey }) {
  return <LoomGlobalNav ariaLabel="Loom support navigation" activeHref={active} />;
}
