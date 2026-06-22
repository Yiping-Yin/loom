'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { AskYiping } from '../../components/verified-dossier/AskYiping';
import { CapabilityMap } from '../../components/CapabilityMap';
import { LandingNav } from '../LandingNav';
import { type BeginnerCapability } from '../../lib/capability/capability-graph';
import { buildCapabilities } from '../../lib/capability/derive-capabilities';
import { type BeginnerProfile } from '../../lib/profile/beginner-profile';
import {
  readBeginnerProfileLocal,
  writeBeginnerProfileLocal,
} from '../../lib/profile/profile-storage';
import shell from '../about/AboutClient.module.css';
import styles from './BeginnerDigitalMe.module.css';
import { BeginnerJourney } from './BeginnerJourney';
import { BeginnerProofSection } from './BeginnerProofSection';

/**
 * Beginner-profile Digital Me view.
 *
 * Renders a clean digital card for the logged-in beginner: name, headline,
 * optional summary, links, and the AskYiping widget as the centrepiece. The
 * widget already reads localStorage and sends the stored beginner profile to
 * /api/ask, so answers are grounded in THIS person's content.
 *
 * Intentionally omits all Yiping-specific Role-OS richness: proof-path grid,
 * evidence graph, artifact runtime, QBook room — a beginner has none of these.
 *
 * AskYiping's suggested-question chips and input placeholder are overridden
 * here with generic prompts (suggestedQuestions + placeholder props) so the
 * visitor sees questions about this person, not Yiping's specific topics.
 * Answers remain grounded in the beginner's profile via the localStorage data
 * that /api/ask receives automatically.
 *
 * NOTE (follow-up): the owner's EvidenceSignal SVG (the cyan evidence-weight
 * graph on /example/digital-me) is intentionally NOT ported here. It needs
 * per-claim evidence-weight data a beginner does not yet have — that belongs to
 * the moat's artifact step, not this presentation polish.
 */
export function BeginnerDigitalMe({ profile }: { profile: BeginnerProfile }) {
  const { home, about } = profile;
  const displayName = home.name || 'Your name';
  const rootRef = useScrollReveal();

  // Local capability state — seeded from the profile's persisted capabilities.
  const [caps, setCaps] = useState<BeginnerCapability[]>(profile.capabilities ?? []);
  const [building, setBuilding] = useState(false);
  const [buildError, setBuildError] = useState('');
  // Once-only guard for the on-entry auto-build (CE-T5). A ref (not state) so it
  // is set synchronously before the async build resolves — preventing a second
  // run if the effect re-fires before `caps` updates.
  const autoBuiltRef = useRef(false);

  /** Count of capabilities whose status is 'strong' (backed by real proof). */
  const strongCount = caps.filter((c) => c.status === 'strong').length;

  // A brand-new / thin profile (nothing proof-backed yet) should be guided to
  // ENRICH first — sharing a near-empty postcard is premature. So when thin,
  // "Keep building" takes the primary (cyan) slot and the postcard drops to the
  // secondary (ghost) slot; once there's proof, the postcard leads again.
  const thin = strongCount === 0;
  const primaryCta = thin
    ? { href: '/onboarding/profile', label: 'Keep building' }
    : { href: '/card', label: 'Get your digital postcard' };
  const secondaryCta = thin
    ? { href: '/card', label: 'Get your digital postcard' }
    : { href: '/onboarding/profile', label: 'Keep building' };

  // Progressive disclosure: a brand-new profile (just name/headline/bio + an
  // auto-derived "direction") is shown as identity + the next step only. The
  // heavier sections — the capability star-river and Ask Me — appear once the
  // profile has real substance: journey entries, uploaded proof, or a capability
  // actually backed by evidence. This keeps a fresh Digital Me calm, not a wall
  // of near-empty sections.
  const hasJourney =
    profile.education.length > 0 ||
    profile.experience.length > 0 ||
    profile.works.length > 0;
  const hasProof = (profile.artifacts?.length ?? 0) > 0;
  const hasBackedCaps = caps.some((c) => c.evidence.length > 0);
  const established = hasJourney || hasProof || hasBackedCaps;

  async function handleBuildCapabilities() {
    if (building) return;
    setBuilding(true);
    setBuildError('');
    try {
      // Read the freshest profile from storage rather than the prop captured at
      // mount: an artifact uploaded via the Proof section after page load lives
      // only in localStorage, so writing the stale prop back would silently drop
      // it (orphaning the blob + its grounded text). Derive from `current` too so
      // the map reflects newly-uploaded proof.
      const current = readBeginnerProfileLocal() ?? profile;
      const derived = await buildCapabilities(current);
      setCaps(derived);
      const saved = writeBeginnerProfileLocal({ ...current, capabilities: derived });
      if (!saved) {
        setBuildError(
          "Couldn't save your capability map — your browser may be blocking local storage (private mode) or it's full.",
        );
      }
    } finally {
      setBuilding(false);
    }
  }

  // CE-T5 — auto-build the star-river ONCE on first entry when the profile has no
  // persisted capabilities yet, so a returning user lands on a populated map
  // instead of an empty-until-click prompt. This front-runs the manual button by
  // reusing the exact same `handleBuildCapabilities` path — no duplicated
  // derive/merge/persist logic, so the prior hardening holds:
  //   • once-only: `autoBuiltRef` flips synchronously before the async build
  //     resolves, and we only enter when `caps.length === 0`, so it never loops
  //     and never runs when capabilities already exist.
  //   • fail-open: `buildCapabilities` never throws and falls back to the offline
  //     heuristic for every failure mode (no /api on the static loom://bundle,
  //     offline, AI off…), exactly like the manual path — a failed/empty derive
  //     leaves the UI usable.
  //   • non-clobbering: it goes through handleBuildCapabilities, which reads the
  //     freshest profile and merges `{ ...current, capabilities }`, preserving
  //     existing artifacts (prior Fix #4/#1).
  useEffect(() => {
    if (autoBuiltRef.current) return;
    if (caps.length > 0) return;
    autoBuiltRef.current = true;
    void handleBuildCapabilities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main ref={rootRef} className={shell.page} aria-labelledby="digital-me-title">
      <div className="loom-cosmic-field" aria-hidden="true" />
      <LandingNav />

      <div className={`${shell.shell} ${styles.shell}`}>
        {/* Identity header */}
        <header className={styles.header} data-reveal="">
          <p className={styles.eyebrow}>Digital Me</p>
          <h1 id="digital-me-title" className={styles.name}>
            {displayName}
          </h1>
          {home.headline && <strong className={styles.headline}>{home.headline}</strong>}
          {about.summary && <p className={styles.summary}>{about.summary}</p>}
          {about.links.length > 0 && (
            <nav aria-label="Profile links" className={styles.links}>
              {about.links.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.chip}
                >
                  <span>{link.label}</span>
                  <ArrowUpRight
                    className={styles.chipIcon}
                    aria-hidden="true"
                    size={12}
                    strokeWidth={1.8}
                  />
                </a>
              ))}
            </nav>
          )}

          {/* Primary action (cyan): "Keep building" for a thin profile, the
              shareable digital postcard (pillar 3) once there's proof to show.
              Both always render — only the emphasis/order swaps. The postcard
              lives on the beginner surface, never in the owner's shared top nav. */}
          <a href={primaryCta.href} className={styles.postcard}>
            <span>{primaryCta.label}</span>
            <ArrowUpRight
              className={styles.postcardIcon}
              aria-hidden="true"
              size={13}
              strokeWidth={1.8}
            />
          </a>

          {/* Secondary action (ghost). /onboarding/profile preloads the stored
              profile and returns here on save — "add more", not "start over". */}
          <a href={secondaryCta.href} className={styles.keepBuilding}>
            <span>{secondaryCta.label}</span>
            <ArrowUpRight
              className={styles.keepBuildingIcon}
              aria-hidden="true"
              size={13}
              strokeWidth={1.8}
            />
          </a>
        </header>

        {/* Capabilities — centerpiece section showing what this person can do,
            derived from their profile data and backed by evidence.
            Build/refresh action writes back to localStorage so caps persist.
            Progressive disclosure: hidden until the profile is `established`, so a
            brand-new user isn't shown a near-empty star-river + build controls. */}
        {established && (
        <section className={styles.capabilitiesSection} aria-labelledby="capabilities-title" data-reveal="">
          <header className={styles.capabilitiesHeader}>
            <p className={styles.eyebrow}>CAPABILITIES</p>
            <h2 id="capabilities-title" className={styles.capabilitiesHeading}>
              What I can do
            </h2>
          </header>

          <div className={styles.capabilitiesActions}>
            <button
              type="button"
              className={styles.buildButton}
              onClick={handleBuildCapabilities}
              disabled={building}
              aria-busy={building}
            >
              {building
                ? 'Building…'
                : caps.length === 0
                  ? 'Build capability map'
                  : 'Refresh capability map'}
            </button>

            {/* Compounding summary — hidden when no caps yet (CapabilityMap shows
                its own empty prompt). */}
            {caps.length > 0 && (
              <p className={styles.capabilitiesSummary} aria-live="polite">
                {caps.length} {caps.length === 1 ? 'capability' : 'capabilities'}
                {' · '}
                {strongCount} backed by proof
              </p>
            )}

            {/* Sparse profile → guide, don't strand: when nothing is proof-backed
                yet, point at the next action instead of leaving a bare "0". */}
            {caps.length > 0 && strongCount === 0 && (
              <p className={styles.capabilitiesNudge}>
                Add proof below to turn these into evidence-backed strengths.
              </p>
            )}

            {buildError && (
              <p className={styles.capabilitiesError} role="alert">
                {buildError}
              </p>
            )}
          </div>

          <CapabilityMap capabilities={caps} profile={profile} />
        </section>
        )}

        {/* Journey timeline — derived from education + experience + works.
            Rendered only when the profile has at least one entry in any section. */}
        <div data-reveal="">
          <BeginnerJourney profile={profile} />
        </div>

        {/* Proof & documents — uploaded artifacts as inspectable, verified proof.
            Additive moat slice M2a: blobs in IndexedDB, citeable meta in the
            profile (localStorage). M2b wires the cited-answer engine to these. */}
        <div data-reveal="">
          <BeginnerProofSection initialArtifacts={profile.artifacts ?? []} />
        </div>

        {/* Ask widget — centrepiece: answers are grounded in the beginner's
            localStorage profile which /api/ask receives automatically.
            All owner-specific copy is overridden here with generic text so
            the visitor sees prompts about this person, not Yiping's topics.
            example={null} starts in a neutral idle state (no owner seed). */}
        <div data-reveal="">
          <AskYiping
            eyebrow="Ask me"
            title={home.name ? `Ask ${home.name} anything` : 'Ask me anything'}
            lede="Grounded, cited answers."
            readOnlyNote="Live answers need an AI key — this deploy is read-only; the verified sources below are what this person's answer draws from."
            example={null}
            suggestedQuestions={[
              "What's their experience?",
              'What are they strongest at?',
              'What have they studied?',
              'Why work with them?',
            ]}
            placeholder="Ask me anything…"
          />
        </div>
      </div>
    </main>
  );
}

/**
 * Restrained scroll-reveal for the page's major blocks (header, journey, ask).
 *
 * Mirrors the owner Role-OS hook: the global [data-reveal] CSS rule fails safe
 * to fully visible and only hides an element once an ancestor gains
 * [data-reveal-ready="true"]. We set that flag ONLY after first marking any
 * already-visible target as revealed, so nothing flashes hidden, and we never
 * set it at all when there are no targets. Under prefers-reduced-motion or when
 * IntersectionObserver is unavailable, every target is revealed immediately.
 * If this effect never runs (SSR / JS disabled), the fail-safe keeps the page
 * fully visible.
 */
function useScrollReveal() {
  const rootRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const targets = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (targets.length === 0) return;

    const revealVisibleTargets = () => {
      targets.forEach((el) => {
        if (el.hasAttribute('data-revealed')) return;
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.96 && rect.bottom > 0) {
          el.setAttribute('data-revealed', '');
        }
      });
    };

    // Reveal anything already in view BEFORE arming the hide-gate, so the
    // first paint never flashes blank.
    revealVisibleTargets();
    root.setAttribute('data-reveal-ready', 'true');

    const reduce =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce || typeof IntersectionObserver === 'undefined') {
      targets.forEach((el) => el.setAttribute('data-revealed', ''));
      return;
    }

    window.addEventListener('scroll', revealVisibleTargets, { passive: true });
    window.addEventListener('resize', revealVisibleTargets);

    const observer = new IntersectionObserver(
      (entries, obs) => {
        const arriving = entries.filter((entry) => entry.isIntersecting);
        arriving.forEach((entry, i) => {
          const el = entry.target as HTMLElement;
          el.style.transitionDelay = `${Math.min(i * 0.07, 0.21)}s`;
          el.setAttribute('data-revealed', '');
          obs.unobserve(el);
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
    );
    targets.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', revealVisibleTargets);
      window.removeEventListener('resize', revealVisibleTargets);
      root.removeAttribute('data-reveal-ready');
    };
  }, []);
  return rootRef;
}
