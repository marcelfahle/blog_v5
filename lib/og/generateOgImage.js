const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const OUTPUT_DIR = path.join(process.cwd(), 'img', 'og', 'generated');
const WIDTH = 1200;
const HEIGHT = 630;
const TITLE_MAX_LENGTH = 140;
const DESCRIPTION_MAX_LENGTH = 220;
const TITLE_CHARS_PER_LINE = 22;
const DESCRIPTION_CHARS_PER_LINE = 40;

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
      return `<tspan x="${options.x}" y="${y}">${line}</tspan>`;
    })
    .join('');
}

async function buildSvg({ title, description }) {
  const fontBase64 = await loadFontBase64();
  const safeTitle = clamp(title, TITLE_MAX_LENGTH);
  const safeDescription = clamp(description, DESCRIPTION_MAX_LENGTH);

  const titleLines = wrapText(safeTitle, TITLE_CHARS_PER_LINE);
  const descriptionLines = wrapText(safeDescription, DESCRIPTION_CHARS_PER_LINE);

  const titleBlock = buildTextBlock(titleLines, {
    x: 96,
    startY: 240,
    lineHeight: 76,
  });

  const descriptionBlock = buildTextBlock(descriptionLines, {
    x: 96,
    startY: 240 + titleLines.length * 80 + 40,
    lineHeight: 46,
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="70%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
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
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)" rx="32"/>
  <g opacity="0.45">
    <circle cx="240" cy="180" r="220" fill="#38bdf866"/>
    <circle cx="980" cy="500" r="260" fill="#5eead433"/>
  </g>
  <text x="96" y="160" fill="#38bdf8" font-family="'Cabinet Grotesk', sans-serif" font-size="28" letter-spacing="14">
    MARCEL FAHLE
  </text>
  <text fill="#f8fafc" font-family="'Cabinet Grotesk', sans-serif" font-weight="700" font-size="68" letter-spacing="1">
    ${titleBlock}
  </text>
  ${descriptionLines.length ? `<text fill="#cbd5f5" font-family="'Cabinet Grotesk', sans-serif" font-size="34" letter-spacing="0.5">
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
