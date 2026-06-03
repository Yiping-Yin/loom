import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import test from 'node:test';
import React from 'react';

import { AnswerInspector } from '../components/verified-dossier/AnswerInspector';
import { ArtifactCitationCard, DocumentPreviewCard } from '../components/verified-dossier/DocumentPreviewCard';
import {
  ActiveEvidenceStory,
  ProvenanceChain,
  SourceGraph,
  SourceIndex,
} from '../components/verified-dossier/EvidenceWorkbench';
import { FileBadge } from '../components/verified-dossier/FileBadge';
import {
  InstitutionMark,
  type InstitutionMarkKind,
} from '../components/verified-dossier/InstitutionMark';
import {
  VERIFIED_DOSSIER_AI_PROMPT,
  VERIFIED_DOSSIER_SECTIONS,
  VERIFIED_DOSSIER_WORKBENCH,
  resolveVerifiedDossierArtifact,
  type VerifiedDossierFileKind,
} from '../lib/new-loom/verified-dossier-home';

const fileCases: Array<[VerifiedDossierFileKind, string, string]> = [
  ['pdf', 'Problem Set 02.pdf', 'PDF'],
  ['word', 'About me page.docx', 'DOCX'],
  ['ppt', 'Presentation deck.pptx', 'PPTX'],
  ['excel', 'Financial model.xlsx', 'XLSX'],
  ['markdown', 'Research note.md', 'MD'],
  ['html', 'Claude Certificate.html', 'HTML'],
  ['text', 'Reading notes.txt', 'TXT'],
];

const institutionImageCases: Array<[InstitutionMarkKind, string, string, string]> = [
  ['about', 'About', '/profile/yiping-avatar.png', 'AB'],
  ['unsw', 'UNSW Sydney', '/brand/unsw/unsw-crest.png', 'UNSW'],
  ['quantnet', 'QuantNet', '/brand/quantnet/quantnet-logo.png', 'QN'],
  ['wqu', 'WorldQuant University', '/brand/wqu/wqu-logo.svg', 'WQU'],
  ['claude', 'Claude', '/brand/claude/claude-icon.png', 'Claude'],
];

function render(node: React.ReactElement) {
  Object.assign(globalThis, { React });
  const { renderToStaticMarkup } = require('react-dom/server') as {
    renderToStaticMarkup: (node: React.ReactElement) => string;
  };

  return renderToStaticMarkup(node);
}

test('FileBadge renders real artifact extensions for every supported file kind', () => {
  for (const [kind, label, extension] of fileCases) {
    const html = render(<FileBadge kind={kind} label={label} />);

    assert.match(html, new RegExp(`vd-file-badge--${kind}`));
    assert.match(html, /vd-file-badge__icon/);
    assert.match(html, /vd-file-badge__label/);
    assert.match(html, new RegExp(`>${extension}<`));
    assert.match(html, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('FileBadge compact mode keeps the artifact extension visible', () => {
  const html = render(<FileBadge kind="pdf" label="Problem Set 02.pdf" compact />);

  assert.match(html, /vd-file-badge--compact/);
  assert.match(html, />PDF</);
  assert.match(html, /Problem Set 02\.pdf/);
});

test('InstitutionMark renders accessible labels backed by real image assets', () => {
  for (const [kind, accessibleLabel, imageSrc, oldTextFallback] of institutionImageCases) {
    const html = render(<InstitutionMark kind={kind} />);
    const publicAssetPath = `public${imageSrc}`;

    assert.match(html, new RegExp(`vd-institution-mark--${kind}`));
    assert.match(html, new RegExp(`aria-label="${accessibleLabel}"`));
    assert.match(html, new RegExp(`<img src="${imageSrc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}" alt=""`));
    assert.ok(existsSync(publicAssetPath), `${imageSrc} should exist`);
    assert.doesNotMatch(html, new RegExp(`>${oldTextFallback}<`));
  }
});

test('artifact components preserve concrete file-first direction', () => {
  const html = render(
    <div>
      {fileCases.map(([kind, label]) => (
        <FileBadge key={kind} kind={kind} label={label} />
      ))}
    </div>,
  );

  for (const extension of ['PDF', 'DOCX', 'PPTX', 'XLSX', 'MD', 'HTML', 'TXT']) {
    assert.match(html, new RegExp(`>${extension}<`));
  }
  assert.doesNotMatch(html, /toy icon|generic icon|file type/i);
});

test('DocumentPreviewCard renders inspectable file preview metadata', () => {
  const artifact = resolveVerifiedDossierArtifact('econ-slides');
  const html = render(<DocumentPreviewCard artifact={artifact} />);

  assert.match(html, /vd-document-card/);
  assert.match(html, /vd-document-preview--pdf/);
  assert.match(html, /src="\/verified-sources\/econ3202\/w8-a-concave-functions\.png"/);
  assert.match(html, /alt="W8 A Concave-Functions\.pdf first page preview"/);
  assert.match(html, /27 pages - 227 KB - modified 06 Apr 2026/);
  assert.match(html, /UNSW\/ECON 3202\/02_Week\/W08\/W8 A Concave-Functions\.pdf/);
  assert.match(html, /02_Week\/W08/);
});

test('ArtifactCitationCard keeps cited source thumbnails visible', () => {
  const artifact = resolveVerifiedDossierArtifact('econ-ps2');
  const html = render(<ArtifactCitationCard artifact={artifact} />);

  assert.match(html, /vd-citation-card/);
  assert.match(html, /vd-citation-card__thumb--pdf/);
  assert.match(html, /Problem Set 02\.pdf/);
  assert.match(html, /src="\/verified-sources\/econ3202\/problem-set-02\.png"/);
  assert.match(html, /2 pages - 79 KB - modified 15 Mar 2026/);
});

test('ActiveEvidenceStory renders the UNSW workbench proof case', () => {
  const unswSection = VERIFIED_DOSSIER_SECTIONS.find((section) => section.id === 'unsw');
  assert.ok(unswSection, 'UNSW section should exist');

  const html = render(
    <ActiveEvidenceStory
      section={unswSection}
      artifactIds={VERIFIED_DOSSIER_WORKBENCH.activeArtifactIds}
    />,
  );

  assert.match(html, /vd-active-story/);
  assert.match(html, /Active evidence story/);
  assert.match(html, /UNSW \/ ECON3202/);
  assert.match(html, /4 files/);
  assert.match(html, /Problem Set 02\.pdf/);
  assert.match(html, /W8 A Concave-Functions\.pdf/);
  assert.match(html, /W8 C Suggested Exercises\.pdf/);
  assert.match(html, /Problem2\.pdf/);
});

test('SourceGraph renders semantic source relationships from real artifacts', () => {
  const html = render(<SourceGraph graph={VERIFIED_DOSSIER_WORKBENCH.sourceGraph} />);

  assert.match(html, /vd-source-graph/);
  assert.match(html, /aria-label="Source relationship graph"/);
  assert.match(html, /Problem Set 02\.pdf/);
  assert.match(html, /W8 A Concave-Functions\.pdf/);
  assert.match(html, /Concavity and optimisation summary\.md/);
  assert.match(html, /Grounded explanation/);
  assert.match(html, /Problem context/);
  assert.match(html, /Concept source/);
  assert.match(html, /Cited output/);
});

test('ProvenanceChain renders Sources to Draft to Answer as the product explanation', () => {
  const html = render(<ProvenanceChain steps={VERIFIED_DOSSIER_WORKBENCH.provenanceSteps} />);

  assert.match(html, /vd-provenance-chain/);
  assert.match(html, /Sources/);
  assert.match(html, /Draft/);
  assert.match(html, /Answer/);
  assert.match(html, /4 ECON3202 files/);
  assert.match(html, /Concavity and optimisation summary\.md/);
  assert.match(html, /Grounded explanation/);
});

test('AnswerInspector is citation-first and no longer titled as a chatbot', () => {
  const html = render(
    <AnswerInspector
      prompt={VERIFIED_DOSSIER_AI_PROMPT}
      citationRegistryCount={12}
      citationRegistryLabels={['UNSW', 'Quantnet', 'Claude']}
    />,
  );

  assert.match(html, /vd-answer-inspector/);
  assert.match(html, />Answer inspector</);
  assert.match(html, />Grounded</);
  assert.match(html, /Cited sources/);
  assert.match(html, /Problem Set 02\.pdf/);
  assert.match(html, /12 registry sources available/);
  assert.doesNotMatch(html, />Ask this profile</);
});

test('SourceIndex keeps secondary shelves compact and excludes the active UNSW story', () => {
  const html = render(<SourceIndex sections={VERIFIED_DOSSIER_SECTIONS.filter((section) => section.id !== 'unsw')} />);

  assert.match(html, /vd-source-index/);
  assert.match(html, /Source index/);
  assert.match(html, /About/);
  assert.match(html, /Quantnet/);
  assert.match(html, /WQU/);
  assert.match(html, /Claude/);
  assert.doesNotMatch(html, /UNSW \/ ECON3202/);
});
