import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';

import { AnswerInspector } from '../components/verified-dossier/AnswerInspector';
import {
  ActiveEvidenceStory,
  ProvenanceChain,
  SourceGraph,
  SourceIndex,
} from '../components/verified-dossier/EvidenceWorkbench';
import { FileBadge } from '../components/verified-dossier/FileBadge';
import {
  VERIFIED_DOSSIER_AI_PROMPT,
  VERIFIED_DOSSIER_SECTIONS,
  VERIFIED_DOSSIER_WORKBENCH,
  type VerifiedDossierFileKind,
} from '../lib/new-loom/verified-dossier-home';

const fileCases: Array<[VerifiedDossierFileKind, string, string]> = [
  ['pdf', 'Example source.pdf', 'PDF'],
  ['word', 'Example brief.docx', 'DOCX'],
  ['ppt', 'Example deck.pptx', 'PPTX'],
  ['excel', 'Example model.xlsx', 'XLSX'],
  ['markdown', 'Example note.md', 'MD'],
  ['html', 'Example page.html', 'HTML'],
  ['text', 'Example notes.txt', 'TXT'],
];

function render(node: React.ReactElement) {
  Object.assign(globalThis, { React });
  const { renderToStaticMarkup } = require('react-dom/server') as {
    renderToStaticMarkup: (node: React.ReactElement) => string;
  };

  return renderToStaticMarkup(node);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
  const html = render(<FileBadge kind="pdf" label="Example source.pdf" compact />);

  assert.match(html, /vd-file-badge--compact/);
  assert.match(html, />PDF</);
  assert.match(html, /Example source\.pdf/);
});

test('FileBadge preserves concrete file-first direction', () => {
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
  assert.match(html, /aria-label="UNSW Sydney"/);
  assert.match(html, /vd-active-story__title/);
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
  assert.match(html, /<ul class="vd-source-graph__canvas" aria-label="Source graph nodes">/);
  assert.match(html, /<ul class="vd-source-graph__edges" aria-label="Source graph relationships">/);
  assert.match(html, /<li class="vd-source-graph__node vd-source-graph__node--source" aria-label="Problem Set 02\.pdf"/);
  assert.match(html, /Problem Set 02\.pdf/);
  assert.match(html, /W8 A Concave-Functions\.pdf/);
  assert.match(html, /Concavity and optimisation summary\.md/);
  assert.match(html, /Grounded explanation/);
  assert.match(html, /Problem context/);
  assert.match(html, /Concept source/);
  assert.match(html, /Cited output/);
  assert.match(html, /aria-label="Problem Set 02\.pdf: Problem context to Concavity and optimisation summary\.md"/);
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
  assert.match(html, /for="vd-followup-input"/);
  assert.match(html, /id="vd-followup-input"/);
  assert.match(html, /<button type="button" disabled="" aria-disabled="true">/);
  assert.match(html, />Send</);
  assert.doesNotMatch(html, />Ask this profile</);
});

test('SourceIndex renders supplied secondary shelves compactly', () => {
  const secondarySections = VERIFIED_DOSSIER_SECTIONS.filter((section) => section.id !== 'unsw');
  const html = render(<SourceIndex sections={secondarySections} />);
  const expectedFileCount = secondarySections.reduce((count, section) => count + section.artifactIds.length, 0);

  assert.match(html, /vd-source-index/);
  assert.match(html, /Source index/);
  assert.equal((html.match(/vd-source-index__card/g) ?? []).length, secondarySections.length);
  assert.equal((html.match(/vd-file-badge--compact/g) ?? []).length, expectedFileCount);

  for (const section of secondarySections) {
    assert.match(html, new RegExp(escapeRegExp(section.label)));
    assert.match(html, new RegExp(escapeRegExp(section.status)));
  }

  const activeSection = VERIFIED_DOSSIER_SECTIONS.find((section) => section.id === 'unsw');
  assert.ok(activeSection, 'UNSW section should exist');
  assert.doesNotMatch(html, new RegExp(escapeRegExp(activeSection.label)));
});
