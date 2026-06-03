import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';

import { ArtifactCitationCard, DocumentPreviewCard } from '../components/verified-dossier/DocumentPreviewCard';
import { FileBadge } from '../components/verified-dossier/FileBadge';
import {
  InstitutionMark,
  type InstitutionMarkKind,
} from '../components/verified-dossier/InstitutionMark';
import {
  resolveVerifiedDossierArtifact,
  type VerifiedDossierFileKind,
} from '../lib/new-loom/verified-dossier-home';

const fileCases: Array<[VerifiedDossierFileKind, string, string]> = [
  ['pdf', 'ECON3202 Problem Set 2.pdf', 'PDF'],
  ['word', 'About me page.docx', 'DOCX'],
  ['ppt', 'Lecture 8 Slides.pptx', 'PPTX'],
  ['excel', 'BHP Case Study.xlsx', 'XLSX'],
  ['markdown', 'Prompt library.md', 'MD'],
  ['text', 'Reading notes.txt', 'TXT'],
];

const institutionCases: Array<[InstitutionMarkKind, string, string]> = [
  ['about', 'About', 'AB'],
  ['unsw', 'UNSW Sydney', 'UNSW'],
  ['quantnet', 'QuantNet', 'QN'],
  ['wqu', 'WorldQuant University', 'WQU'],
  ['claude', 'Claude', 'Claude'],
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
  const html = render(<FileBadge kind="pdf" label="ECON3202 Problem Set 2.pdf" compact />);

  assert.match(html, /vd-file-badge--compact/);
  assert.match(html, />PDF</);
  assert.match(html, /ECON3202 Problem Set 2\.pdf/);
});

test('InstitutionMark renders accessible labels and recognizable marks', () => {
  for (const [kind, accessibleLabel, markText] of institutionCases) {
    const html = render(<InstitutionMark kind={kind} />);

    assert.match(html, new RegExp(`vd-institution-mark--${kind}`));
    assert.match(html, new RegExp(`aria-label="${accessibleLabel}"`));
    assert.match(html, new RegExp(`>${markText}<`));
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

  for (const extension of ['PDF', 'DOCX', 'PPTX', 'XLSX', 'MD', 'TXT']) {
    assert.match(html, new RegExp(`>${extension}<`));
  }
  assert.doesNotMatch(html, /toy icon|generic icon|file type/i);
});

test('DocumentPreviewCard renders inspectable file preview metadata', () => {
  const artifact = resolveVerifiedDossierArtifact('econ-slides');
  const html = render(<DocumentPreviewCard artifact={artifact} />);

  assert.match(html, /vd-document-card/);
  assert.match(html, /vd-document-preview--ppt/);
  assert.match(html, /Lecture 8/);
  assert.match(html, /Aggregate Demand I/);
  assert.match(html, /PPTX - 8\.7 MB - 10 Apr 2024/);
  assert.match(html, /Lecture slides/);
});

test('ArtifactCitationCard keeps cited source thumbnails visible', () => {
  const artifact = resolveVerifiedDossierArtifact('econ-ps2');
  const html = render(<ArtifactCitationCard artifact={artifact} />);

  assert.match(html, /vd-citation-card/);
  assert.match(html, /vd-citation-card__thumb--pdf/);
  assert.match(html, /ECON3202 Problem Set 2\.pdf/);
  assert.match(html, /Problem Set 2/);
  assert.match(html, /PDF - 1\.2 MB - 12 Apr 2024/);
});
