import { createRequire } from 'module';
const require = createRequire('/opt/homebrew/lib/node_modules/');
const pptxgen = require('pptxgenjs');

const IMG = '/Users/yinyiping/Desktop/Private Wiki/LOOM/docs/images/product';
const OUT = '/Users/yinyiping/Desktop/Private Wiki/LOOM/docs/deck/loom.pptx';

// ---- palette (the product's own language: cool-black, silver lift, signature cyan) ----
const BG = '070809', PANEL = '181B1E', PANEL2 = '111315';
const SIGNATURE = '4BC5DE', SIGNATURE_HI = '8AF7E6';
const INK = 'E7E9EA', INK2 = 'A4A9AD', INK3 = '666D72';
const HAIR = '2A2F34', GREEN = '3FB37A', CYAN = '6CE7F2';
const SERIF = 'Georgia', SANS = 'Helvetica Neue', MONO = 'Consolas';

const p = new pptxgen();
p.defineLayout({ name: 'W', width: 13.333, height: 7.5 });
p.layout = 'W';
p.author = 'Yiping Yin';
p.title = 'Loom — a living knowledge identity';
const W = 13.333, H = 7.5;

const shadow = () => ({ type: 'outer', color: '000000', blur: 14, offset: 5, angle: 90, opacity: 0.55 });

function base(slide) { slide.background = { color: BG }; }
function eyebrow(slide, text, x, y, color = SIGNATURE) {
  slide.addText(text.toUpperCase(), { x, y, w: 9, h: 0.3, fontFace: MONO, fontSize: 11, color, charSpacing: 3, align: 'left', margin: 0 });
}
function pageMark(slide, n) {
  slide.addText(n, { x: W - 1.0, y: H - 0.62, w: 0.6, h: 0.3, fontFace: MONO, fontSize: 10, color: INK3, align: 'right', margin: 0 });
  slide.addText('LOOM', { x: 0.62, y: H - 0.62, w: 2, h: 0.3, fontFace: MONO, fontSize: 10, color: INK3, charSpacing: 2, align: 'left', margin: 0 });
}
// framed screenshot (16:9 source) with hairline + shadow
function shot16x9(slide, file, x, y, w) {
  const h = w * 9 / 16;
  slide.addShape(p.shapes.RECTANGLE, { x: x - 0.03, y: y - 0.03, w: w + 0.06, h: h + 0.06, fill: { color: PANEL }, line: { color: HAIR, width: 1 }, shadow: shadow() });
  slide.addImage({ path: `${IMG}/${file}`, x, y, w, h });
  return h;
}

// ============ 1 · TITLE ============
let s = p.addSlide(); base(s);
s.addShape(p.shapes.RECTANGLE, { x: 0, y: 0, w: W, h: H, fill: { color: BG } });
// faint signature-cyan rule motif top
s.addText('YIPING YIN  ·  PERSONAL KNOWLEDGE IN THE AI ERA', { x: 0.9, y: 0.85, w: 11, h: 0.3, fontFace: MONO, fontSize: 12, color: INK3, charSpacing: 3, margin: 0 });
s.addText('Loom', { x: 0.82, y: 2.2, w: 11.6, h: 2.0, fontFace: SERIF, fontSize: 130, bold: true, color: INK, margin: 0 });
s.addText('Build a digital extension of yourself.', { x: 0.9, y: 4.25, w: 11.5, h: 0.7, fontFace: SERIF, italic: true, fontSize: 30, color: SIGNATURE_HI, margin: 0 });
s.addText('A living knowledge identity — your learning, projects, work, and AI conversations,\nwoven into one source-backed self that grows over time and can answer for you.', { x: 0.92, y: 5.15, w: 11.4, h: 1.1, fontFace: SANS, fontSize: 16, color: INK2, lineSpacingMultiple: 1.25, margin: 0 });
s.addShape(p.shapes.LINE, { x: 0.92, y: 6.55, w: 2.2, h: 0, line: { color: SIGNATURE, width: 1.5 } });
s.addText('2026', { x: W - 2.0, y: 6.4, w: 1.2, h: 0.3, fontFace: MONO, fontSize: 12, color: INK3, align: 'right', margin: 0 });

// ============ 2 · PROBLEM ============
s = p.addSlide(); base(s);
eyebrow(s, 'The problem', 0.9, 0.8);
s.addText('We lose ourselves in fragments.', { x: 0.85, y: 1.25, w: 11.6, h: 1.0, fontFace: SERIF, fontSize: 44, bold: true, color: INK, margin: 0 });
s.addText('Years of learning, projects, portfolios, and AI conversations pile up — then scatter across documents, notes, chats, certificates, and platforms.', { x: 0.9, y: 2.5, w: 7.0, h: 1.4, fontFace: SANS, fontSize: 18, color: INK2, lineSpacingMultiple: 1.3, margin: 0 });
s.addText('So every interview, collaboration, application, or introduction means rebuilding your story from scratch — and most of what you know never shows.', { x: 0.9, y: 4.0, w: 7.0, h: 1.4, fontFace: SANS, fontSize: 18, color: INK2, lineSpacingMultiple: 1.3, margin: 0 });
// fragment cards on the right
const frags = ['Documents', 'Notes', 'AI chats', 'Certificates', 'Projects', 'Platforms'];
frags.forEach((t, i) => {
  const col = i % 2, row = Math.floor(i / 2);
  const fx = 8.4 + col * 2.35, fy = 2.5 + row * 1.25;
  s.addShape(p.shapes.RECTANGLE, { x: fx, y: fy, w: 2.1, h: 1.0, fill: { color: PANEL }, line: { color: HAIR, width: 1 } });
  s.addText(t, { x: fx, y: fy, w: 2.1, h: 1.0, fontFace: SANS, fontSize: 14, color: INK2, align: 'center', valign: 'middle', margin: 0 });
});
pageMark(s, '02');

// ============ 3 · SOLUTION ============
s = p.addSlide(); base(s);
eyebrow(s, 'The solution', 0.9, 0.8);
s.addText('Loom weaves it into one living identity.', { x: 0.85, y: 1.25, w: 7.3, h: 1.8, fontFace: SERIF, fontSize: 40, bold: true, color: INK, lineSpacingMultiple: 0.95, margin: 0 });
s.addText([
  { text: 'Loom connects your learning journey, projects, experiences, and AI conversations into a single searchable knowledge base — one that ', options: {} },
  { text: 'grows with you', options: { color: SIGNATURE_HI, italic: true } },
  { text: '.', options: {} },
], { x: 0.9, y: 3.2, w: 6.7, h: 1.5, fontFace: SANS, fontSize: 17, color: INK2, lineSpacingMultiple: 1.3, margin: 0 });
s.addText([
  { text: 'Every claim is source-backed. Over time it becomes a ', options: {} },
  { text: 'personalised AI', options: { color: SIGNATURE_HI, bold: true } },
  { text: ' that can represent and communicate what you know.', options: {} },
], { x: 0.9, y: 4.7, w: 6.7, h: 1.4, fontFace: SANS, fontSize: 17, color: INK2, lineSpacingMultiple: 1.3, margin: 0 });
shot16x9(s, 'cover.png', 8.05, 2.0, 4.7);
s.addText('The live reference instance — yiping.loom', { x: 8.05, y: 4.75, w: 4.7, h: 0.3, fontFace: MONO, fontSize: 10, color: INK3, align: 'center', margin: 0 });
pageMark(s, '03');

// ============ 4 · PRODUCT: DOSSIER ============
s = p.addSlide(); base(s);
eyebrow(s, 'Product · the verified dossier', 0.9, 0.7);
s.addText('Not a résumé. A source-backed self.', { x: 0.85, y: 1.1, w: 11.6, h: 0.8, fontFace: SERIF, fontSize: 36, bold: true, color: INK, margin: 0 });
shot16x9(s, 'cover.png', 0.9, 2.15, 7.6);
const dossierPoints = [
  ['Numbered dossier', 'About · Education · Experience · Digital Me — one coherent identity.'],
  ['Every claim verified', 'Each card resolves to a real file: CV, course folders, project artifacts.'],
  ['Inspect, don’t trust', 'Visitors open the source behind any statement — proof, not assertion.'],
];
dossierPoints.forEach(([h1, h2], i) => {
  const y = 2.3 + i * 1.5;
  s.addShape(p.shapes.RECTANGLE, { x: 8.9, y, w: 0.06, h: 1.2, fill: { color: SIGNATURE } });
  s.addText(h1, { x: 9.15, y, w: 3.4, h: 0.4, fontFace: SANS, fontSize: 16, bold: true, color: INK, margin: 0 });
  s.addText(h2, { x: 9.15, y: y + 0.42, w: 3.5, h: 0.9, fontFace: SANS, fontSize: 12.5, color: INK2, lineSpacingMultiple: 1.2, margin: 0 });
});
pageMark(s, '04');

// ============ 5 · PRODUCT: DIGITAL ME ============
s = p.addSlide(); base(s);
eyebrow(s, 'Product · Digital Me', 0.9, 0.7);
s.addText('Ask my knowledge. Get cited answers.', { x: 0.85, y: 1.1, w: 11.6, h: 0.8, fontFace: SERIF, fontSize: 36, bold: true, color: INK, margin: 0 });
shot16x9(s, 'digital-me-hero.png', 4.7, 2.15, 8.05);
const dmPoints = [
  ['Conversational core', 'Ask Yiping anything — answers drawn only from verified evidence, with citations.'],
  ['Role OS', 'Claims mapped to evidence, scored by how strongly the sources back them.'],
  ['Live proof', 'A working QBook market-making terminal embedded as runnable evidence.'],
];
dmPoints.forEach(([h1, h2], i) => {
  const y = 2.35 + i * 1.55;
  s.addShape(p.shapes.RECTANGLE, { x: 0.9, y, w: 0.06, h: 1.25, fill: { color: SIGNATURE } });
  s.addText(h1, { x: 1.15, y, w: 3.2, h: 0.4, fontFace: SANS, fontSize: 16, bold: true, color: INK, margin: 0 });
  s.addText(h2, { x: 1.15, y: y + 0.42, w: 3.3, h: 1.0, fontFace: SANS, fontSize: 12.5, color: INK2, lineSpacingMultiple: 1.2, margin: 0 });
});
pageMark(s, '05');

// ============ 6 · PROOF: QBOOK ============
s = p.addSlide(); base(s);
eyebrow(s, 'Proof · capability made tangible', 0.9, 0.7);
s.addText('A working exchange — not a screenshot.', { x: 0.85, y: 1.1, w: 11.6, h: 0.8, fontFace: SERIF, fontSize: 36, bold: true, color: INK, margin: 0 });
shot16x9(s, 'optibook-landing.png', 0.9, 2.15, 7.6);
s.addText([
  { text: 'QBook — a self-contained trading terminal inspired by the Optiver & UNSW trading academy — order book, leaderboard, and market-making practice that keeps running ', options: {} },
  { text: 'offline, after the source retires.', options: { color: SIGNATURE_HI, bold: true } },
], { x: 8.9, y: 2.3, w: 3.6, h: 2.0, fontFace: SANS, fontSize: 15, color: INK2, lineSpacingMultiple: 1.3, margin: 0 });
[['44', 'teams'], ['26', 'instruments'], ['0', 'remote calls']].forEach(([n, l], i) => {
  const y = 4.55 + i * 0.82;
  s.addText(n, { x: 8.9, y, w: 1.0, h: 0.6, fontFace: SERIF, fontSize: 30, bold: true, color: CYAN, align: 'left', margin: 0 });
  s.addText(l, { x: 9.95, y: y + 0.12, w: 2.5, h: 0.4, fontFace: SANS, fontSize: 13, color: INK2, align: 'left', valign: 'middle', margin: 0 });
});
pageMark(s, '06');

// ============ 7 · WHY IT MATTERS ============
s = p.addSlide(); s.background = { color: PANEL2 };
s.addText('WHY IT MATTERS', { x: 0.9, y: 1.5, w: 9, h: 0.3, fontFace: MONO, fontSize: 12, color: SIGNATURE, charSpacing: 3, margin: 0 });
s.addText([
  { text: 'In the AI era, your most valuable asset isn’t your résumé.\nIt’s your ', options: {} },
  { text: 'accumulated knowledge.', options: { color: SIGNATURE_HI } },
], { x: 0.85, y: 2.1, w: 11.6, h: 2.2, fontFace: SERIF, fontSize: 46, bold: true, color: INK, lineSpacingMultiple: 1.05, margin: 0 });
s.addText('Loom helps people preserve it, showcase it, and unlock its value — turning a lifetime of scattered learning into compounding advantage.', { x: 0.9, y: 4.7, w: 10.5, h: 1.2, fontFace: SANS, fontSize: 18, color: INK2, lineSpacingMultiple: 1.35, margin: 0 });
pageMark(s, '07');

// ============ 8 · HOW IT WORKS ============
s = p.addSlide(); base(s);
eyebrow(s, 'The loop', 0.9, 0.8);
s.addText('Preserve. Connect. Showcase. Represent.', { x: 0.85, y: 1.25, w: 11.6, h: 0.8, fontFace: SERIF, fontSize: 36, bold: true, color: INK, margin: 0 });
const steps = [
  ['01', 'Preserve', 'Capture sources — docs, slides, notes, certificates, AI chats — into one place.'],
  ['02', 'Connect', 'Link them into an evidence graph: claims, sources, and the proof between them.'],
  ['03', 'Showcase', 'A dossier anyone can inspect — source-backed, never just asserted.'],
  ['04', 'Represent', 'A personalised AI that answers for you, with citations to your real work.'],
];
steps.forEach(([n, t, d], i) => {
  const x = 0.9 + i * 3.05;
  s.addShape(p.shapes.RECTANGLE, { x, y: 2.6, w: 2.8, h: 3.1, fill: { color: PANEL }, line: { color: HAIR, width: 1 }, shadow: shadow() });
  s.addText(n, { x: x + 0.25, y: 2.85, w: 2, h: 0.5, fontFace: MONO, fontSize: 15, color: SIGNATURE, margin: 0 });
  s.addText(t, { x: x + 0.25, y: 3.4, w: 2.4, h: 0.5, fontFace: SERIF, fontSize: 23, bold: true, color: INK, margin: 0 });
  s.addText(d, { x: x + 0.25, y: 4.05, w: 2.35, h: 1.5, fontFace: SANS, fontSize: 12.5, color: INK2, lineSpacingMultiple: 1.25, margin: 0 });
  if (i < 3) s.addText('→', { x: x + 2.78, y: 3.9, w: 0.35, h: 0.5, fontFace: SANS, fontSize: 20, color: SIGNATURE, align: 'center', margin: 0 });
});
pageMark(s, '08');

// ============ 9 · STATUS ============
s = p.addSlide(); base(s);
eyebrow(s, 'Where it stands', 0.9, 0.8);
s.addText('Real, today — not a mockup.', { x: 0.85, y: 1.25, w: 11.6, h: 0.8, fontFace: SERIF, fontSize: 36, bold: true, color: INK, margin: 0 });
const stats = [
  ['Live', 'reference instance', 'Yiping’s Loom — a full working dossier, public on the web.'],
  ['241', 'contract tests green', 'Built test-first; every surface pinned by a contract.'],
  ['2', 'runtimes', 'A native macOS app and a deployable web app share one core.'],
  ['5', 'real source shelves', 'UNSW · QuantNet · WorldQuant · Claude · Optiver — actual archives.'],
];
stats.forEach(([n, l, d], i) => {
  const col = i % 2, row = Math.floor(i / 2);
  const x = 0.9 + col * 6.05, y = 2.5 + row * 2.05;
  s.addShape(p.shapes.RECTANGLE, { x, y, w: 5.7, h: 1.75, fill: { color: PANEL }, line: { color: HAIR, width: 1 } });
  s.addText(n, { x: x + 0.35, y: y + 0.25, w: 2.0, h: 1.2, fontFace: SERIF, fontSize: 50, bold: true, color: SIGNATURE, valign: 'middle', margin: 0 });
  s.addText(l, { x: x + 2.4, y: y + 0.3, w: 3.1, h: 0.5, fontFace: SANS, fontSize: 16, bold: true, color: INK, margin: 0 });
  s.addText(d, { x: x + 2.4, y: y + 0.78, w: 3.1, h: 0.85, fontFace: SANS, fontSize: 12, color: INK2, lineSpacingMultiple: 1.2, margin: 0 });
});
pageMark(s, '09');

// ============ 10 · VISION / CLOSE ============
s = p.addSlide(); base(s);
s.addText('THE VISION', { x: 0.9, y: 1.4, w: 9, h: 0.3, fontFace: MONO, fontSize: 12, color: SIGNATURE, charSpacing: 3, margin: 0 });
s.addText('A future where everyone can build\na digital extension of themselves.', { x: 0.85, y: 2.0, w: 11.8, h: 2.3, fontFace: SERIF, fontSize: 48, bold: true, color: INK, lineSpacingMultiple: 1.05, margin: 0 });
s.addShape(p.shapes.LINE, { x: 0.92, y: 4.7, w: 2.4, h: 0, line: { color: SIGNATURE, width: 1.5 } });
s.addText([
  { text: 'Yiping Yin', options: { color: INK, bold: true } },
  { text: '   ·   building Loom', options: { color: INK2 } },
], { x: 0.9, y: 5.1, w: 8, h: 0.4, fontFace: SANS, fontSize: 18, margin: 0 });
s.addText('github.com/Yiping-Yin/loom   ·   linkedin.com/in/yiping-yin', { x: 0.9, y: 5.7, w: 11, h: 0.4, fontFace: MONO, fontSize: 13, color: SIGNATURE_HI, margin: 0 });
s.addText('Loom', { x: W - 3.3, y: 6.4, w: 2.7, h: 0.7, fontFace: SERIF, fontSize: 30, bold: true, color: INK3, align: 'right', margin: 0 });

await p.writeFile({ fileName: OUT });
console.log('WROTE', OUT);
