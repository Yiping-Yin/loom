/**
 * The owner's (Yiping Yin's) real profile, authored as a standard `BeginnerProfile`
 * so it can be loaded into the LIVE product (the localStorage-driven surfaces:
 * /digital-me, /about, /education, /experience, Studio, Ask) via the /me loader.
 *
 * There is no account system yet — this is the pragmatic bridge from the
 * hardcoded /example showcase to "the live product IS me", with no login.
 *
 * Source of truth: the data was gathered from the in-repo owner records
 * (lib/new-loom/verified-dossier-home.ts and lib/new-loom/digital-me-role-os.ts).
 * Proof FILES (the actual ECON/QuantNet PDFs) are NOT seeded — they live in the
 * owner's local IndexedDB uploads, not the repo — so capabilities here are
 * narrative-grounded (max 'partial'); re-upload proof in the Proof section to
 * earn 'strong'. See [[loom-product-english-only]] — all copy is English.
 */
import type { BeginnerProfile } from './beginner-profile';
import { normalizeBeginnerProfile } from './beginner-profile';
import { deriveCapabilitiesHeuristic } from '../capability/capability-graph';

/** The owner's profile WITHOUT capabilities — the narrative the map derives from. */
const OWNER_NARRATIVE: BeginnerProfile = {
  version: 1,
  home: {
    name: 'Yiping Yin',
    headline: 'Quant Researcher / Trader · AI Founder',
  },
  about: {
    summary:
      'Quant researcher and trader in training, and an AI founder. I work from ' +
      'source-backed systems: disciplined mathematical reasoning from ECON3202, ' +
      'live market-making practice rebuilt into QBook, and growing implementation ' +
      'proof across Python and C++. Based between Wuhan and Sydney.',
    links: [
      { label: 'LinkedIn', href: 'https://www.linkedin.com/in/yiping-yin/' },
      { label: 'GitHub', href: 'https://github.com/Yiping-Yin' },
    ],
  },
  education: [
    {
      institution: 'UNSW Sydney',
      qualification: 'BSc (in progress) — Quantitative Finance & Economics',
      field: 'Mathematical economics, trading & market-making, AI for business',
      start: '2025',
      end: 'Present',
      notes:
        'ECON3202 Mathematical Economics · FINS3666 Trading & Market Making · ' +
        'INFS3822 AI for Business Analytics · MATH2901 Higher Theory of Statistics',
    },
    {
      institution: 'WorldQuant University',
      qualification: 'Quantitative finance coursework',
      start: 'Enrolled',
      end: 'In progress',
    },
    {
      institution: 'QuantNet',
      qualification: 'C++ & Python for Financial Engineering',
      start: 'Enrolled',
      end: 'In progress',
    },
  ],
  experience: [
    {
      role: 'Trading Academy Participant',
      organization: 'Optiver & UNSW Trading Academy',
      start: 'May 2026',
      end: 'Aug 2026',
      location: 'Sydney, Australia',
      bullets: [
        'Python trading algorithms, order books, VWAP and market making',
        'Pair-trading and order-book statistics rebuilt into QBook',
      ],
    },
    {
      role: 'Business Analytics Consultant (Team Project)',
      organization: 'Gumtree Smart Listing Assistant',
      start: 'Feb 2026',
      end: 'Apr 2026',
      location: 'Sydney, Australia',
      bullets: [
        'Machine-learning price guidance from listing signals',
        'LLM-assisted listing-copy rewriting for sellers',
      ],
    },
    {
      role: 'Project Contributor',
      organization: "Jiangren — Let's GO Travel Planning App",
      start: '2025',
      end: '2026',
      location: 'Remote, Australia',
      bullets: [
        '17-contributor React / TypeScript app with maps and itinerary workflow',
        'Supabase, Playwright and Storybook in the stack',
      ],
    },
  ],
  works: [
    {
      title: 'QBook — Market-Making Simulator',
      description:
        'Personal live market-making simulator inspired by the Optiver & UNSW ' +
        'trading academy. Pair-trading and order-book strategy practice on real ' +
        'market data.',
      role: 'Solo author',
      date: '2026',
    },
    {
      title: 'Python Financial Data & Portfolio Analytics',
      description:
        'Price data, corporate actions, earnings signals and holdings processed ' +
        'into portfolio analytics. Scored 96.25/100 individual, 92.71/100 group.',
      role: 'Student project',
      date: 'Feb–May 2026',
    },
  ],
  artifacts: [],
  capabilities: [],
};

/**
 * The owner's complete profile, with a grounded capability map derived from the
 * narrative by the same heuristic the live "Build capabilities" action uses, so
 * evidence refIds (edu-/exp-/work-) resolve in the capability map.
 *
 * Passed through `normalizeBeginnerProfile` so the exported value is EXACTLY what
 * the storage seam persists (caps, safe-href filtering, canonical optional keys).
 * This makes the seed identical to its stored form — loading it is idempotent.
 */
export const OWNER_PROFILE: BeginnerProfile = normalizeBeginnerProfile({
  ...OWNER_NARRATIVE,
  capabilities: deriveCapabilitiesHeuristic(OWNER_NARRATIVE),
});
