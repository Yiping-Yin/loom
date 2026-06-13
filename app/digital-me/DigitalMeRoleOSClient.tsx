'use client';

import React, { useEffect, useRef, useState } from 'react';

import { AskYiping } from '../../components/verified-dossier/AskYiping';
import { FileBadge } from '../../components/verified-dossier/FileBadge';
import { LoomGlobalNav } from '../../components/verified-dossier/LoomGlobalNav';
import {
  DIGITAL_ME_ARTIFACT_MODES,
  DIGITAL_ME_PROOF_PATH,
  DIGITAL_ME_QUANT_ROLE_LENS,
  getDigitalMeClaimById,
  getDigitalMeEvidenceForClaim,
  resolveDigitalMeEvidenceArtifact,
  type DigitalMeArtifactModeId,
  type DigitalMeClaimNode,
  type DigitalMeEvidenceStatus,
} from '../../lib/new-loom/digital-me-role-os';
import styles from './DigitalMeRoleOS.module.css';

const STATUS_LABELS: Record<DigitalMeEvidenceStatus, string> = {
  strong: 'Strong evidence',
  partial: 'Partial evidence',
  direction: 'Direction only',
  missing: 'Missing proof',
};

const CLAIM_TITLES: Record<string, string> = {
  'mathematical-reasoning': 'Mathematical reasoning',
  'optimisation-thinking': 'Optimisation thinking',
  'programming-foundations': 'Programming foundations',
  'finance-learning-context': 'Market structure',
  'live-market-project-proof': 'Research output gap',
};

const CLAIM_BOUNDARIES: Record<string, string> = {
  'mathematical-reasoning': 'Coursework proof, not market performance.',
  'optimisation-thinking': 'Real source; applied portfolio proof still needed.',
  'programming-foundations':
    'Python and C++ direction, not yet a complete trading system.',
  'finance-learning-context': 'Finance context visible; dated market output still needed.',
  'live-market-project-proof':
    'QBook is partial proof; evaluation still needs to be visible.',
};

const CLAIM_SUMMARIES: Record<string, string> = {
  'mathematical-reasoning': 'Formal math to checked work.',
  'optimisation-thinking': 'Concavity, optimisation, limits.',
  'programming-foundations': 'Python and C++ foundations.',
  'finance-learning-context': 'Finance learning context.',
  'live-market-project-proof': 'QBook as partial live-market proof.',
};

const CLAIM_NEXT_STEPS: Record<string, string> = {
  'mathematical-reasoning': 'Small research project.',
  'optimisation-thinking': 'Portfolio case.',
  'programming-foundations': 'Implementation proof.',
  'finance-learning-context': 'Market-structure note.',
  'live-market-project-proof': 'QBook evaluation.',
};

const MODE_SUMMARIES: Record<DigitalMeArtifactModeId, string> = {
  'capability-map': 'Claims by capability.',
  'interview-answer': 'Short answer with sources.',
  'gap-roadmap': 'Proof and gaps.',
  'source-graph': 'Claims to artifacts.',
  'portfolio-case': 'One claim as case.',
};

function getClaimTitle(claim: DigitalMeClaimNode) {
  return CLAIM_TITLES[claim.id] ?? claim.id.replaceAll('-', ' ');
}

function getClaimGrowthAction(claimId: string) {
  const actions: Readonly<Record<string, string>> = DIGITAL_ME_PROOF_PATH.nextGrowthActions;
  return actions[claimId] ?? '';
}

/* Evidence strength scored per claim, so the signal line traces real proof
   depth across the role's capability chain rather than a decorative wiggle. */
const EVIDENCE_WEIGHT: Record<DigitalMeEvidenceStatus, number> = {
  strong: 1,
  partial: 0.62,
  direction: 0.34,
  missing: 0.12,
};

/* Evidence Signal — the cyan thread-of-light over the role's capability chain.
   A line with a soft glow above a cyan→transparent area fill (the validated
   "chart area fill" recipe): defs linearGradient, accent @ 0.28 → 0, a filled
   path closed to the baseline, fill=url(#grad). Cyan = the data-signal. */
function EvidenceSignal({
  claims,
  selectedClaimId,
  onSelectClaim,
}: {
  claims: readonly DigitalMeClaimNode[];
  selectedClaimId: string;
  onSelectClaim: (claimId: string) => void;
}) {
  const W = 100;
  const H = 30;
  const padX = 3;
  const padY = 4;
  const span = W - padX * 2;
  const usable = H - padY * 2;
  const n = claims.length;
  const points = claims.map((claim, i) => {
    const x = n === 1 ? W / 2 : padX + (span * i) / (n - 1);
    const y = padY + usable * (1 - EVIDENCE_WEIGHT[claim.evidenceStatus]);
    return { x, y, claim };
  });
  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ');
  const areaPath =
    `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${H - padY} ` +
    `L ${points[0].x.toFixed(2)} ${H - padY} Z`;

  return (
    <svg
      className={styles.evidenceSignal}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      role="img"
      aria-label="Evidence strength across the quant capability chain"
    >
      <defs>
        <linearGradient id="dmEvidenceFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--role-signal)" stopOpacity="0.28" />
          <stop offset="1" stopColor="var(--role-signal)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path className={styles.evidenceSignalArea} d={areaPath} fill="url(#dmEvidenceFill)" />
      <path className={styles.evidenceSignalLine} d={linePath} fill="none" />
      {points.map((p) => {
        const active = p.claim.id === selectedClaimId;
        return (
          <circle
            key={p.claim.id}
            className={active ? styles.evidenceSignalNodeActive : styles.evidenceSignalNode}
            cx={p.x}
            cy={p.y}
            r={active ? 1.9 : 1.2}
            onClick={() => onSelectClaim(p.claim.id)}
          >
            <title>{`${getClaimTitle(p.claim)} — ${STATUS_LABELS[p.claim.evidenceStatus]}`}</title>
          </circle>
        );
      })}
    </svg>
  );
}

function ArtifactOutput({
  mode,
  selectedClaim,
  onSelectClaim,
}: {
  mode: DigitalMeArtifactModeId;
  selectedClaim: DigitalMeClaimNode;
  onSelectClaim: (claimId: string) => void;
}) {
  const selectedEvidence = getDigitalMeEvidenceForClaim(selectedClaim.id);

  if (mode === 'interview-answer') {
    return (
      <article className={`${styles.artifactOutput} ${styles.answerArtifact}`}>
        <p>Interview Answer</p>
        <h2>Role readiness</h2>
        <p>
          Strongest current proof: {getClaimTitle(selectedClaim).toLowerCase()}.
        </p>
        <ul>
          {selectedEvidence.map((node) => {
            const artifact = resolveDigitalMeEvidenceArtifact(node);
            return (
              <li key={node.id}>
                <a href={artifact.href}>
                  <FileBadge kind={artifact.kind} label={artifact.label} compact />
                </a>
                <span>{node.supportedCapability}</span>
              </li>
            );
          })}
        </ul>
      </article>
    );
  }

  if (mode === 'gap-roadmap') {
    return (
      <article className={`${styles.artifactOutput} ${styles.roadmapArtifact}`}>
        <p>Gap Roadmap</p>
        <h2>Next proof</h2>
        <ol>
          {DIGITAL_ME_PROOF_PATH.claims.map((claim) => (
            <li key={claim.id}>
              <strong>{getClaimTitle(claim)}</strong>
              <span>{CLAIM_BOUNDARIES[claim.id]}</span>
            </li>
          ))}
        </ol>
      </article>
    );
  }

  if (mode === 'source-graph') {
    return (
      <article className={`${styles.artifactOutput} ${styles.sourceGraphArtifact}`}>
        <p>Source Graph</p>
        <h2>{getClaimTitle(selectedClaim)} sources</h2>
        {selectedEvidence.length ? (
          selectedEvidence.map((node) => {
            const artifact = resolveDigitalMeEvidenceArtifact(node);
            return (
              <a key={node.id} href={artifact.href}>
                <FileBadge kind={artifact.kind} label={artifact.label} compact />
                <span>{node.supportedCapability}</span>
                <small>{artifact.sourcePath ?? artifact.role}</small>
              </a>
            );
          })
        ) : (
          <div className={styles.emptyEvidence}>No source has been attached to this proof gap yet.</div>
        )}
      </article>
    );
  }

  if (mode === 'portfolio-case') {
    return (
      <article className={`${styles.artifactOutput} ${styles.caseArtifact}`}>
        <p>Portfolio Case</p>
        <h2>{getClaimTitle(selectedClaim)}</h2>
        <ul>
          {selectedClaim.artifactActions.map((action) => (
            <li key={action}>{action}</li>
          ))}
        </ul>
      </article>
    );
  }

  return (
    <article className={`${styles.artifactOutput} ${styles.capabilityArtifact}`}>
      <p>Capability Map</p>
      <h2>Capability map</h2>
      {DIGITAL_ME_PROOF_PATH.claims.map((claim) => (
        <button
          key={claim.id}
          type="button"
          data-active={claim.id === selectedClaim.id}
          onClick={() => onSelectClaim(claim.id)}
        >
          <strong>{getClaimTitle(claim)}</strong>
          <span>{STATUS_LABELS[claim.evidenceStatus]}</span>
          <small>{CLAIM_SUMMARIES[claim.id]}</small>
        </button>
      ))}
    </article>
  );
}

/* Restrained scroll-reveal: elements marked data-reveal fade + rise into place
   once, staggered, when they enter the viewport. Fully gated on
   prefers-reduced-motion (no observer, no transform) and degrades to visible if
   IntersectionObserver is unavailable. The CSS owns the actual transition. */
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
        // Lightly stagger any group entering together, so the page assembles
        // rather than snapping in all at once.
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

export default function DigitalMeRoleOSClient() {
  const [selectedClaimId, setSelectedClaimId] = useState<string>(DIGITAL_ME_PROOF_PATH.claims[0].id);
  const [activeArtifactMode, setActiveArtifactMode] = useState<DigitalMeArtifactModeId>(
    DIGITAL_ME_PROOF_PATH.activeArtifactMode,
  );
  const revealRoot = useScrollReveal();

  const selectedClaim = getDigitalMeClaimById(selectedClaimId) ?? DIGITAL_ME_PROOF_PATH.claims[0];
  const selectedEvidence = getDigitalMeEvidenceForClaim(selectedClaim.id);
  const activeMode =
    DIGITAL_ME_ARTIFACT_MODES.find((mode) => mode.id === activeArtifactMode) ??
    DIGITAL_ME_ARTIFACT_MODES[0];

  return (
    <main className={styles.roleOsPage} aria-labelledby="digital-me-title" ref={revealRoot}>
      <LoomGlobalNav activeHref="/digital-me" ariaLabel="Digital Me navigation" />

      <header className={styles.roleLens} data-reveal="">
        <p>Role Lens</p>
        <h1 id="digital-me-title">{DIGITAL_ME_QUANT_ROLE_LENS.label}</h1>
        <span>Math. Sources. Implementation.</span>
        <ul className={styles.roleLensCriteria} aria-label="Quant role criteria">
          {DIGITAL_ME_QUANT_ROLE_LENS.criteria.map((criterion) => (
            <li key={criterion}>{criterion}</li>
          ))}
        </ul>
      </header>

      <AskYiping />

      <section className={styles.proofPath} aria-label="Digital Me proof path" data-reveal="">
        <aside className={styles.claimRail} aria-label="Claim Engine">
          <p>Claim Engine</p>
          {DIGITAL_ME_PROOF_PATH.claims.map((claim) => (
            <button
              className={styles.claimButton}
              key={claim.id}
              type="button"
              aria-pressed={claim.id === selectedClaim.id}
              onClick={() => setSelectedClaimId(claim.id)}
            >
              <strong>{getClaimTitle(claim)}</strong>
              <span>{STATUS_LABELS[claim.evidenceStatus]}</span>
            </button>
          ))}
        </aside>

        <section
          className={styles.artifactStage}
          aria-label="Artifact Runtime"
          id="digital-me-answer-title"
        >
          <div className={styles.stageHeader}>
            <p>Artifact Runtime</p>
            <h2>{activeMode.label}</h2>
            <span>{MODE_SUMMARIES[activeMode.id]}</span>
            <div className={styles.evidenceSignalRow}>
              <EvidenceSignal
                claims={DIGITAL_ME_PROOF_PATH.claims}
                selectedClaimId={selectedClaim.id}
                onSelectClaim={setSelectedClaimId}
              />
              <span className={styles.evidenceSignalCaption}>Proof depth</span>
            </div>
          </div>
          <div className={styles.artifactActions}>
            {DIGITAL_ME_ARTIFACT_MODES.map((mode) => (
              <button
                key={mode.id}
                type="button"
                aria-pressed={mode.id === activeArtifactMode}
                onClick={() => setActiveArtifactMode(mode.id)}
              >
                {mode.label}
              </button>
            ))}
          </div>
          <ArtifactOutput
            mode={activeArtifactMode}
            selectedClaim={selectedClaim}
            onSelectClaim={setSelectedClaimId}
          />
        </section>

        <aside className={styles.evidencePanel} aria-label="Evidence Graph">
          <p>Evidence Graph</p>
          <h2>{getClaimTitle(selectedClaim)}</h2>
          <span>{CLAIM_SUMMARIES[selectedClaim.id]}</span>
          <div className={styles.evidenceList}>
            {selectedEvidence.length ? (
              selectedEvidence.map((node) => {
                const artifact = resolveDigitalMeEvidenceArtifact(node);
                return (
                  <a key={node.id} href={artifact.href}>
                    <FileBadge kind={artifact.kind} label={artifact.label} compact />
                    <small>{node.supportedCapability}</small>
                  </a>
                );
              })
            ) : (
              <div className={styles.emptyEvidence}>No files attached yet for this proof gap.</div>
            )}
          </div>
          <details
            className={styles.boundaryPanel}
            aria-label="Boundary and Next Growth Action"
            data-growth-action={getClaimGrowthAction(selectedClaim.id)}
          >
            <summary>Boundary / next</summary>
            <strong>Boundary</strong>
            <p>{CLAIM_BOUNDARIES[selectedClaim.id]}</p>
            <strong>Next Growth Action</strong>
            <p>{CLAIM_NEXT_STEPS[selectedClaim.id] ?? getClaimGrowthAction(selectedClaim.id)}</p>
          </details>
        </aside>
      </section>

      <section className={styles.marketRoom} aria-label="Live Market Room — QBook" data-reveal="">
        <div className={styles.marketRoomBody}>
          <p className={styles.marketRoomEyebrow}>Live Market Room · QBook</p>
          <h2 className={styles.marketRoomTitle}>QBook live.</h2>
          <p className={styles.marketRoomLede}>
            Market-making simulator. Order book, leaderboard, ticker, local runtime.
          </p>
          <div className={styles.marketRoomMeta}>
            <span>44 teams</span>
            <span>26 instruments</span>
            <span>Zero remote dependencies</span>
            <span>Snapshot 2026-06-10</span>
          </div>
          <a
            className={styles.marketRoomLaunch}
            href="/optibook/index.html"
            target="_blank"
            rel="noreferrer"
          >
            Launch QBook
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </a>
        </div>
        {/* Staged device: the live screen recedes into the room as a real lit
            object — perspective parent, a framed screen that tilts back with a
            diagonal glare and a grounding shadow beneath. */}
        <div className={styles.marketRoomStage} aria-hidden="true">
          <div className={styles.marketRoomDevice}>
            <img
              className={styles.marketRoomShot}
              src="/verified-sources/digital-me/optibook-market-lens.png"
              alt=""
              aria-hidden="true"
              draggable={false}
            />
            <span className={styles.marketRoomScrim} aria-hidden="true" />
          </div>
        </div>
      </section>

      <section
        className={styles.foundationStrip}
        aria-label="Built from About, Education, and Experience"
        data-reveal=""
      >
        <strong>Built from About, Education, and Experience</strong>
        <a href="/about">About foundation</a>
        <a href="/education">Education foundation</a>
        <a href="/experience">Experience foundation</a>
        <span>Inspectable sources. Role proof.</span>
      </section>
    </main>
  );
}
