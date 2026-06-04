'use client';

import React, { useState } from 'react';

import { FileBadge } from '../../components/verified-dossier/FileBadge';
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
  'mathematical-reasoning':
    'The current proof is coursework and private answer work; it should not be overstated as market research performance.',
  'optimisation-thinking':
    'The optimisation source is real, but the role path still needs a project that applies it to portfolio or strategy decisions.',
  'programming-foundations':
    'Python and C++ sources prove direction and preparation, not yet a complete research or trading system.',
  'finance-learning-context':
    'Finance learning context is visible, but live market structure analysis still needs a dated output artifact.',
  'live-market-project-proof':
    'This is intentionally marked missing until analysis, implementation, evaluation, and reflection are all inspectable.',
};

const NEXT_GROWTH_ACTION =
  'Create a small quant research project with data, a hypothesis, model notes, evaluation, and limits.';

function getClaimTitle(claim: DigitalMeClaimNode) {
  return CLAIM_TITLES[claim.id] ?? claim.id.replaceAll('-', ' ');
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
        <h2>How does your evidence support Quant Researcher / Trader readiness?</h2>
        <p>
          My strongest current proof is {getClaimTitle(selectedClaim).toLowerCase()}. The
          evidence comes from inspectable About, Education, and Experience sources rather than a
          generic profile claim, so I can explain what is proven, what is partial, and what is still
          missing.
        </p>
        <ul>
          {selectedEvidence.map((node) => {
            const artifact = resolveDigitalMeEvidenceArtifact(node);
            return (
              <li key={node.id}>
                <a href={artifact.href}>
                  <FileBadge kind={artifact.kind} label={artifact.label} compact />
                </a>
                <span>{node.roleUse}</span>
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
        <h2>From current proof to role-ready output</h2>
        <ol>
          <li>{NEXT_GROWTH_ACTION}</li>
          {DIGITAL_ME_PROOF_PATH.nextGrowthActions.map((action) => (
            <li key={action}>{action}</li>
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
        <p>{selectedClaim.text}</p>
        <p>{selectedClaim.roleRelevance}</p>
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
      <h2>Quant Researcher / Trader capability map</h2>
      {DIGITAL_ME_PROOF_PATH.claims.map((claim) => (
        <button
          key={claim.id}
          type="button"
          data-active={claim.id === selectedClaim.id}
          onClick={() => onSelectClaim(claim.id)}
        >
          <strong>{getClaimTitle(claim)}</strong>
          <span>{STATUS_LABELS[claim.evidenceStatus]}</span>
          <small>{claim.roleRelevance}</small>
        </button>
      ))}
    </article>
  );
}

export default function DigitalMeRoleOSClient() {
  const [selectedClaimId, setSelectedClaimId] = useState(DIGITAL_ME_PROOF_PATH.claims[0].id);
  const [activeArtifactMode, setActiveArtifactMode] = useState<DigitalMeArtifactModeId>(
    DIGITAL_ME_PROOF_PATH.activeArtifactMode,
  );

  const selectedClaim = getDigitalMeClaimById(selectedClaimId) ?? DIGITAL_ME_PROOF_PATH.claims[0];
  const selectedEvidence = getDigitalMeEvidenceForClaim(selectedClaim.id);
  const activeMode =
    DIGITAL_ME_ARTIFACT_MODES.find((mode) => mode.id === activeArtifactMode) ??
    DIGITAL_ME_ARTIFACT_MODES[0];

  return (
    <main className={styles.roleOsPage} aria-labelledby="digital-me-title">
      <nav className={styles.nav} aria-label="Digital Me navigation">
        <a href="/loom">Loom</a>
        <a href="/about">About</a>
        <a href="/education">Education</a>
        <a href="/experience">Experience</a>
        <a aria-current="page" href="/digital-me">
          Digital Me
        </a>
      </nav>

      <header className={styles.roleLens}>
        <p>Role Lens</p>
        <h1 id="digital-me-title">{DIGITAL_ME_QUANT_ROLE_LENS.label}</h1>
        <span>{DIGITAL_ME_QUANT_ROLE_LENS.thesis}</span>
        <ul className={styles.roleLensCriteria} aria-label="Quant role criteria">
          {DIGITAL_ME_QUANT_ROLE_LENS.criteria.map((criterion) => (
            <li key={criterion}>{criterion}</li>
          ))}
        </ul>
      </header>

      <section className={styles.proofPath} aria-label="Digital Me proof path">
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
            <span>{activeMode.summary}</span>
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
          <span>{selectedClaim.text}</span>
          <div className={styles.evidenceList}>
            {selectedEvidence.length ? (
              selectedEvidence.map((node) => {
                const artifact = resolveDigitalMeEvidenceArtifact(node);
                return (
                  <a key={node.id} href={artifact.href}>
                    <FileBadge kind={artifact.kind} label={artifact.label} compact />
                    <small>{node.roleUse}</small>
                  </a>
                );
              })
            ) : (
              <div className={styles.emptyEvidence}>No files attached yet for this proof gap.</div>
            )}
          </div>
          <section className={styles.boundaryPanel} aria-label="Boundary and Next Growth Action">
            <strong>Boundary</strong>
            <p>{CLAIM_BOUNDARIES[selectedClaim.id]}</p>
            <strong>Next Growth Action</strong>
            <p>{NEXT_GROWTH_ACTION}</p>
          </section>
        </aside>
      </section>

      <section
        className={styles.foundationStrip}
        aria-label="Built from About, Education, and Experience"
      >
        <strong>Built from About, Education, and Experience</strong>
        <a href="/about">About foundation</a>
        <a href="/education">Education foundation</a>
        <a href="/experience">Experience foundation</a>
        <span>Sources stay inspectable; Draft turns selected evidence into role-specific proof.</span>
      </section>
    </main>
  );
}
