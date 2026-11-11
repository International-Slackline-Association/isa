import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { PDFDocument } from 'pdf-lib';
import puppeteer from 'puppeteer-core';

import { certificates } from './certificates.mjs';
import { signatories } from './signatories.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(ROOT, '..');
const FONTS_DIR = path.join(ROOT, '../../fonts');
const PREVIEW_DIR = path.join(ROOT, '.preview');
const FONTS = path.relative(PREVIEW_DIR, FONTS_DIR);
const CHROME_PATH =
  process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const PAGE = { width: 841.89, height: 595.28 };
const TEXT = '#231f20';
const GREY = '#464547';
const WEIGHTS = { regular: 400, semibold: 600, bold: 700 };

// Fixed design elements, positions in pt from the top-left of the page
const LOGO = { x: 66, y: 504 };
const SEAL = { x: 379.6, y: 420.6 };
const BADGE = { x: 680.5, y: 221.3 };
const QR_BOX = { x: 688.51, y: 430.33, width: 74.98, height: 87.64 };
const TITLE_DASH_GAP = 10;
const SIGNER_SLOTS = [
  { lineX: 186, lineY: 469.19, lineWidth: 170.3 },
  { lineX: 485.4, lineY: 468.05, lineWidth: 170.4 },
];

// Natural size in pt of an SVG (viewBox) or PNG (header, 1px = 1pt; only the ratio matters)
const imageSize = (file) => {
  const buf = fs.readFileSync(file);
  if (file.endsWith('.png')) return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  const [, , width, height] = buf
    .toString()
    .match(/viewBox="([^"]+)"/)[1]
    .split(/\s+/)
    .map(Number);
  return { width, height };
};

const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const text = ({ text, x, y, size = 11, weight = 'regular', align, fill = TEXT, id }) => {
  const anchor = { left: 'start', right: 'end' }[align] || 'middle';
  return `<text${id ? ` id="${id}"` : ''} x="${x ?? PAGE.width / 2}" y="${y}" font-size="${size}" font-weight="${WEIGHTS[weight]}" text-anchor="${anchor}" fill="${fill}">${escape(text)}</text>`;
};

// Bold title with a tapered dash on each side; the dashes are placed once the font has loaded
// and the title width is known (see the script in html())
const title = ({
  text: content,
  y,
}) => `${text({ text: content, y, size: 27.3, weight: 'bold', id: 'title' })}
<polygon id="title-dash-left" points="-24.25,0 0,-1 0,1" fill="#000" transform="translate(0 ${y - 9.1})" />
<polygon id="title-dash-right" points="0,-1 24.25,0 0,1" fill="#000" transform="translate(0 ${y - 9.1})" />`;

const image = (href, x, y, { width, height }) =>
  `<image href="${href}" x="${x}" y="${y}" width="${width}" height="${height}" />`;

const art = (name, x, y) =>
  image(`../art/${name}.svg`, x, y, imageSize(path.join(ROOT, 'art', `${name}.svg`)));

const signer = (key, { lineX, lineY, lineWidth }) => {
  const person = signatories[key];
  if (!person) throw new Error(`Unknown signatory "${key}" — add it to signatories.mjs`);
  const { file, width, height, dx = 0, dy = 0 } = person.signature;
  const natural = imageSize(path.join(ROOT, 'signatures', file));
  const ratio = natural.width / natural.height;
  const size = width ? { width, height: width / ratio } : { width: height * ratio, height };
  const centre = lineX + lineWidth / 2;

  return [
    image(`../signatures/${file}`, centre + dx - size.width / 2, lineY + dy - size.height, size),
    `<rect x="${lineX}" y="${lineY}" width="${lineWidth}" height="1" fill="${GREY}" />`,
    text({ text: person.name.toUpperCase(), x: centre, y: lineY + 20.3, size: 10, weight: 'bold' }),
    ...person.role.map((line, i) =>
      text({ text: line, x: centre, y: lineY + 31.3 + i * 9.3, size: 7 }),
    ),
  ].join('\n');
};

const html = (certificate) => `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @font-face { font-family: Montserrat; font-weight: 400; src: url('${FONTS}/Montserrat-Regular.ttf'); }
  @font-face { font-family: Montserrat; font-weight: 600; src: url('${FONTS}/Montserrat-SemiBold.ttf'); }
  @font-face { font-family: Montserrat; font-weight: 700; src: url('${FONTS}/Montserrat-Bold.ttf'); }
  @page { size: ${PAGE.width}pt ${PAGE.height}pt; margin: 0; }
  html, body { margin: 0; }
  svg { display: block; font-family: Montserrat; }
</style>
</head>
<body>
<svg xmlns="http://www.w3.org/2000/svg" width="${PAGE.width}pt" height="${PAGE.height}pt" viewBox="0 0 ${PAGE.width} ${PAGE.height}">
${art('frame', 0, 0)}
${art(certificate.logo === 'plain' ? 'logo' : `logo-${certificate.logo}`, LOGO.x, LOGO.y)}
${art('seal', SEAL.x, SEAL.y)}
${certificate.badge ? art('approved-badge', BADGE.x, BADGE.y) : ''}
${
  certificate.qrBox
    ? `<rect x="${QR_BOX.x}" y="${QR_BOX.y}" width="${QR_BOX.width}" height="${QR_BOX.height}" fill="${GREY}" />
${text({ text: 'SCAN TO VERIFY', x: QR_BOX.x + QR_BOX.width / 2, y: 511.7, size: 7.25, weight: 'semibold', fill: '#fff' })}`
    : ''
}
${certificate.signers.map((key, i) => signer(key, SIGNER_SLOTS[i])).join('\n')}
${text({ text: 'www.slacklineinternational.org', y: 545.5, size: 9 })}
${title(certificate.title)}
${certificate.text.map(text).join('\n')}
</svg>
<script>
  document.fonts.ready.then(() => {
    const { x, width } = document.getElementById('title').getBBox();
    const y = document.getElementById('title-dash-left').transform.baseVal[0].matrix.f;
    document.getElementById('title-dash-left').setAttribute('transform', \`translate(\${x - ${TITLE_DASH_GAP}} \${y})\`);
    document.getElementById('title-dash-right').setAttribute('transform', \`translate(\${x + width + ${TITLE_DASH_GAP}} \${y})\`);
    document.body.dataset.ready = 'true';
  });
</script>
</body>
</html>
`;

// Chrome rounds the paper size a little, but the generators place text relative to the page
// size, so copy the printed page top-aligned onto an exact A4 page
const toExactPageSize = async (printed) => {
  const pdf = await PDFDocument.create();
  const [content] = await pdf.embedPdf(printed);
  pdf
    .addPage([PAGE.width, PAGE.height])
    .drawPage(content, { x: 0, y: PAGE.height - content.height });
  return pdf.save();
};

const only = process.argv.slice(2).map((name) => name.replace(/\.pdf$/, ''));
const selected = certificates.filter(
  (c) => !only.length || only.includes(c.file.replace(/\.pdf$/, '')),
);
if (!selected.length) throw new Error(`No certificate matches ${only.join(', ')}`);

fs.mkdirSync(PREVIEW_DIR, { recursive: true });
const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: true });
try {
  const page = await browser.newPage();
  for (const certificate of selected) {
    const previewFile = path.join(PREVIEW_DIR, certificate.file.replace(/\.pdf$/, '.html'));
    fs.writeFileSync(previewFile, html(certificate));
    await page.goto(pathToFileURL(previewFile).href, { waitUntil: 'load' });
    await page.waitForSelector('body[data-ready]');
    const printed = await page.pdf({
      width: `${PAGE.width / 72}in`,
      height: `${PAGE.height / 72}in`,
      printBackground: true,
    });
    fs.writeFileSync(path.join(OUT_DIR, certificate.file), await toExactPageSize(printed));
    console.log(`✓ ${certificate.file}`);
  }
} finally {
  await browser.close();
}
