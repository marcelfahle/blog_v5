const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const OUTPUT_DIR = path.join(process.cwd(), 'img', 'og', 'generated');
const WIDTH = 1200;
const HEIGHT = 630;
const TITLE_MAX_LENGTH = 60;
const DESCRIPTION_MAX_LENGTH = 150;
const TITLE_CHARS_PER_LINE = 18;
const DESCRIPTION_CHARS_PER_LINE = 50;

let fontDataCache = null;

async function loadFontBase64() {
  if (fontDataCache) {
    return fontDataCache;
  }

  const fontPath = path.join(process.cwd(), 'fonts', 'CabinetGrotesk-Variable.woff2');
  const fontBuffer = await fs.promises.readFile(fontPath);
  fontDataCache = fontBuffer.toString('base64');
  return fontDataCache;
}

function sanitizeSlug(slug) {
  return slug.toLowerCase().replace(/[^a-z0-9-_]+/g, '-');
}

function clamp(text, maxLength) {
  if (!text) {
    return '';
  }
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 1).trim()}…`;
}

function wrapText(text, maxCharsPerLine) {
  if (!text) {
    return [];
  }

  const words = text.split(/\s+/);
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    const tentative = currentLine ? `${currentLine} ${word}` : word;
    if (tentative.length > maxCharsPerLine && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = tentative;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function buildTextBlock(lines, options) {
  return lines
    .map((line, index) => {
      const y = options.startY + index * options.lineHeight;
      return `<tspan x="${options.x}" y="${y}">${escapeXml(line)}</tspan>`;
    })
    .join('');
}

function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function buildSvg({ title, description }) {
  const fontBase64 = await loadFontBase64();
  const safeTitle = clamp(title, TITLE_MAX_LENGTH);
  const safeDescription = clamp(description, DESCRIPTION_MAX_LENGTH);

  const titleLines = wrapText(safeTitle, TITLE_CHARS_PER_LINE);
  const descriptionLines = wrapText(safeDescription, DESCRIPTION_CHARS_PER_LINE);

  const titleStartY = 250 + (titleLines.length > 1 ? 0 : 40);
  const titleBlock = buildTextBlock(titleLines, {
    x: 600,
    startY: titleStartY,
    lineHeight: 100,
  });

  const descriptionStartY = titleStartY + titleLines.length * 100 + 40;
  const descriptionBlock = buildTextBlock(descriptionLines, {
    x: 600,
    startY: descriptionStartY,
    lineHeight: 44,
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1a1a1a"/>
      <stop offset="100%" stop-color="#2d2d2d"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#34d399"/>
    </linearGradient>
    <style>
      @font-face {
        font-family: 'Cabinet Grotesk';
        src: url('data:font/woff2;base64,${fontBase64}') format('woff2');
        font-weight: 400 800;
        font-display: swap;
      }
    </style>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
  <rect width="${WIDTH}" height="8" y="0" fill="url(#accent)"/>
  <text x="600" y="550" fill="#10b981" font-family="'Cabinet Grotesk', sans-serif" font-size="42" font-weight="500" text-anchor="middle" letter-spacing="2">
    marcelfahle.net
  </text>
  <text fill="#ffffff" font-family="'Cabinet Grotesk', sans-serif" font-weight="800" font-size="90" text-anchor="middle" letter-spacing="-1">
    ${titleBlock}
  </text>
  ${descriptionLines.length ? `<text fill="#9ca3af" font-family="'Cabinet Grotesk', sans-serif" font-size="32" text-anchor="middle" letter-spacing="0.5">
    ${descriptionBlock}
  </text>` : ''}
</svg>`;
}

async function ensureDirectory(dirPath) {
  await fs.promises.mkdir(dirPath, { recursive: true });
}

async function generateOgImage({ slug, title, description }) {
  if (!slug || !title) {
    return null;
  }

  const safeSlug = sanitizeSlug(slug);
  const outputFile = path.join(OUTPUT_DIR, `${safeSlug}.png`);

  try {
    await ensureDirectory(OUTPUT_DIR);

    if (fs.existsSync(outputFile)) {
      return outputFile;
    }

    const svgMarkup = await buildSvg({ title, description });
    const pngBuffer = await sharp(Buffer.from(svgMarkup)).png({ compressionLevel: 9 }).toBuffer();
    await fs.promises.writeFile(outputFile, pngBuffer);
    return outputFile;
  } catch (error) {
    console.error('Failed to generate OG image for', slug, error);
    return null;
  }
}

module.exports = {
  generateOgImage,
};
