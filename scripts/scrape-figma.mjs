import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const FILE_KEY = process.env.FIGMA_FILE_KEY || 'zQPq6p4mfaPpbXAB1D3sZ2';
const TOKEN = process.env.FIGMA_TOKEN || process.argv[2];

if (!TOKEN) {
  console.error('\x1b[31mError: Figma Personal Access Token is required.\x1b[0m');
  console.log('\nUsage:');
  console.log('  node scripts/scrape-figma.mjs <YOUR_FIGMA_PERSONAL_ACCESS_TOKEN>\n');
  process.exitCode = 1;
}

const outDir = path.join(rootDir, 'docs', 'designs');
const screensDir = path.join(outDir, 'screens');
const moverScreensDir = path.join(screensDir, 'mover');
const driverScreensDir = path.join(screensDir, 'driver');
const otherScreensDir = path.join(screensDir, 'other');

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(moverScreensDir, { recursive: true });
fs.mkdirSync(driverScreensDir, { recursive: true });
fs.mkdirSync(otherScreensDir, { recursive: true });

async function apiFetch(endpoint) {
  const url = `https://api.figma.com/v1/${endpoint}`;
  const res = await fetch(url, {
    headers: {
      'X-Figma-Token': TOKEN,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Figma API returned ${res.status} (${res.statusText}): ${body}`);
  }

  return res.json();
}

async function downloadFile(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.statusText}`);
  const buffer = await res.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(buffer));
}

async function main() {
  console.log(`\n\x1b[36m=== TaniAfrika Figma Design Extractor ===\x1b[0m`);
  console.log(`File Key: ${FILE_KEY}`);
  console.log(`Fetching document tree from Figma API...\n`);

  const fileData = await apiFetch(`files/${FILE_KEY}`);
  console.log(`\x1b[32m✔ Connected to Figma successfully!\x1b[0m`);
  console.log(`Document Name: ${fileData.name}`);
  console.log(`Last Modified: ${fileData.lastModified}`);

  // Cache raw response
  fs.writeFileSync(path.join(outDir, 'figma-raw.json'), JSON.stringify(fileData, null, 2));

  // 1. Extract published styles
  try {
    const stylesData = await apiFetch(`files/${FILE_KEY}/styles`);
    fs.writeFileSync(
      path.join(outDir, 'styles.json'),
      JSON.stringify(stylesData.meta?.styles || {}, null, 2)
    );
  } catch (err) {
    console.warn(`Styles fetch warning: ${err.message}`);
  }

  // 2. Discover frames under pages
  const screens = [];
  const colorMap = new Map();
  const textStyles = new Map();

  function traverse(node, pageName = '', pathTrail = '') {
    if (!node) return;

    const box = node.absoluteBoundingBox || {};
    const width = Math.round(box.width || node.size?.x || 0);
    const height = Math.round(box.height || node.size?.y || 0);

    // Identify target flows
    let flow = 'other';
    const lowerTrail = (pathTrail + '/' + node.name).toLowerCase();
    if (lowerTrail.includes('mover') || lowerTrail.includes('client')) {
      flow = 'mover';
    } else if (lowerTrail.includes('driver')) {
      flow = 'driver';
    }

    // A screen is an artboard or frame representing a mobile or desktop view
    // Not giant canvas sections (>2000px wide) or tiny elements (<240px wide)
    const isCandidateScreen =
      (node.type === 'FRAME' || node.type === 'COMPONENT') &&
      width >= 240 &&
      width <= 1440 &&
      height >= 400 &&
      width < 2000 &&
      height < 5000;

    if (isCandidateScreen) {
      screens.push({
        id: node.id,
        name: node.name,
        page: pageName,
        flow,
        width,
        height,
        path: pathTrail,
      });
    }

    // Color extraction from solid fills
    if (Array.isArray(node.fills)) {
      for (const fill of node.fills) {
        if (fill.type === 'SOLID' && fill.color && fill.visible !== false) {
          const r = Math.round(fill.color.r * 255);
          const g = Math.round(fill.color.g * 255);
          const b = Math.round(fill.color.b * 255);
          const a = fill.opacity !== undefined ? fill.opacity : (fill.color.a !== undefined ? fill.color.a : 1);
          const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
          colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
        }
      }
    }

    // Typography extraction
    if (node.type === 'TEXT' && node.style) {
      const { fontFamily, fontWeight, fontSize, lineHeightPx } = node.style;
      const key = `${fontFamily || 'Sans'} ${fontWeight || 400} ${fontSize || 14}px`;
      textStyles.set(key, (textStyles.get(key) || 0) + 1);
    }

    // Recurse children
    if (node.children) {
      for (const child of node.children) {
        traverse(child, pageName, `${pathTrail}/${node.name}`);
      }
    }
  }

  const pages = fileData.document?.children || [];
  for (const page of pages) {
    traverse(page, page.name, page.name);
  }

  const moverScreens = screens.filter((s) => s.flow === 'mover');
  const driverScreens = screens.filter((s) => s.flow === 'driver');
  const otherScreens = screens.filter((s) => s.flow === 'other');

  console.log(`\nIdentified:`);
  console.log(` - ${screens.length} total screens:`);
  console.log(`   • ${moverScreens.length} Mover/Client screens`);
  console.log(`   • ${driverScreens.length} Driver screens`);
  console.log(`   • ${otherScreens.length} Shared/Other screens`);
  console.log(` - ${colorMap.size} unique color values`);
  console.log(` - ${textStyles.size} typography variations`);

  // Save color palette
  const sortedColors = Array.from(colorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([hex, count]) => ({ hex, usages: count }));

  fs.writeFileSync(path.join(outDir, 'palette.json'), JSON.stringify(sortedColors, null, 2));
  fs.writeFileSync(path.join(outDir, 'screens-catalog.json'), JSON.stringify(screens, null, 2));

  // 3. Render screen images in batches of 30
  console.log(`\nRequesting frame render URLs for screens (PNG 2x)...`);
  const screensToDownload = screens.slice(0, 80); // download up to 80 main screens
  const batchSize = 30;

  for (let i = 0; i < screensToDownload.length; i += batchSize) {
    const batch = screensToDownload.slice(i, i + batchSize);
    const ids = batch.map((s) => s.id).join(',');

    try {
      const renderRes = await apiFetch(`images/${FILE_KEY}?ids=${ids}&format=png&scale=2`);
      const images = renderRes.images || {};

      for (const screen of batch) {
        const imgUrl = images[screen.id];
        if (imgUrl) {
          const targetSubdir =
            screen.flow === 'mover'
              ? moverScreensDir
              : screen.flow === 'driver'
              ? driverScreensDir
              : otherScreensDir;

          const sanitizedName = screen.name.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50);
          const filename = `${sanitizedName}_${screen.id.replace(':', '-')}.png`;
          await downloadFile(imgUrl, path.join(targetSubdir, filename));
        }
      }
      console.log(` ✔ Rendered and downloaded batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(screensToDownload.length / batchSize)}`);
    } catch (err) {
      console.warn(` Batch ${i} download warning: ${err.message}`);
    }
  }

  // 4. Generate updated Markdown summary
  const markdownReport = [
    `# TaniAfrika Figma Design Specs & Tokens`,
    ``,
    `* **File Name:** ${fileData.name}`,
    `* **File Key:** \`${FILE_KEY}\``,
    `* **Last Modified:** ${fileData.lastModified}`,
    `* **Total Screens Identified:** ${screens.length}`,
    `  - **Mover (Client) Screens:** ${moverScreens.length}`,
    `  - **Driver Screens:** ${driverScreens.length}`,
    `  - **Other Screens:** ${otherScreens.length}`,
    ``,
    `## Top Color Palette`,
    `| Hex Code | Sample Usage Count | Role / Guess |`,
    `|---|---|---|`,
    ...sortedColors.slice(0, 16).map((c) => {
      let role = 'Neutral / Text';
      if (c.hex === '#006044' || c.hex === '#1F5F3F') role = 'Brand Primary Green';
      if (c.hex === '#7A9080') role = 'Secondary Accent Sage';
      if (c.hex === '#F7F1E5' || c.hex === '#FFF8F4' || c.hex === '#F9F9F9') role = 'Warm Background / Paper';
      if (c.hex === '#FFFFFF') role = 'Surface / Card White';
      if (c.hex === '#000000' || c.hex === '#1F1B17' || c.hex === '#2A2A28') role = 'Primary Ink / Text';
      return `| \`${c.hex}\` | ${c.usages} | ${role} |`;
    }),
    ``,
    `## Mover PWA Screens (${moverScreens.length})`,
    ...moverScreens.map((s) => `- **${s.name}** (\`${s.id}\`) — ${s.width}x${s.height}px`),
    ``,
    `## Driver Screens (${driverScreens.length})`,
    ...driverScreens.map((s) => `- **${s.name}** (\`${s.id}\`) — ${s.width}x${s.height}px`),
    ``,
    `## Common Typography`,
    ...Array.from(textStyles.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([spec, count]) => `- \`${spec}\` (${count} occurrences)`),
  ].join('\n');

  fs.writeFileSync(path.join(outDir, 'FIGMA_SPECS.md'), markdownReport);

  console.log(`\n\x1b[32m✔ Successfully extracted and rendered designs into docs/designs/\x1b[0m\n`);
}

main().catch((err) => {
  console.error('\n\x1b[31mExtraction failed:\x1b[0m', err.message);
  process.exitCode = 1;
});
