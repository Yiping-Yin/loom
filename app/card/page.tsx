import { CardGate } from './CardGate';

// Re-export the postcard so render tests can import it from this module.
export { DigitalPostcard } from './DigitalPostcard';

export const metadata = { title: 'Digital postcard · Loom' };

/**
 * /card — the shareable digital postcard, the pillar-3 deliverable.
 *
 * The page is a server component (keeps `export const metadata`); CardGate reads
 * the URL hash (a shared card) first, then localStorage (the owner's own card),
 * then falls back to a calm CTA. SSR / first paint renders a neutral shell.
 */
export default function CardPage() {
  return <CardGate />;
}
