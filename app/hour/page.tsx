import HourClient from './HourClient';

/**
 * /hour — The Hour, ticking. A support surface for the current
 * thinking window: a live watch, the minute's breath bar, and the
 * material you touched inside this hour. No alerts — the page shows
 * the present without demanding it.
 */

export const metadata = { title: 'The Hour · Loom' };

export default function HourPage() {
  return <HourClient />;
}
