const sharp = require('sharp');
const fs    = require('fs');
const path  = require('path');

const SRC  = path.join(__dirname, '..', 'app-icon.svg');
const DEST = path.join(__dirname, '..', 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset');

// Every required slot: { file, px, idiom, scale, pointSize }
// Files are named Icon-<px>px.png so the pixel dimension is unambiguous.
// Slots that need the same pixel size (e.g. iphone 20@2x and ipad 20@2x)
// share one file on disk — Contents.json references the same filename twice.
const SLOTS = [
  // ── iPhone ──────────────────────────────────────────────────────
  { file: 'Icon-20px.png',   px: 20,   idiom: 'iphone', scale: '1x', size: '20x20'     },
  { file: 'Icon-40px.png',   px: 40,   idiom: 'iphone', scale: '2x', size: '20x20'     },
  { file: 'Icon-60px.png',   px: 60,   idiom: 'iphone', scale: '3x', size: '20x20'     },
  { file: 'Icon-29px.png',   px: 29,   idiom: 'iphone', scale: '1x', size: '29x29'     },
  { file: 'Icon-58px.png',   px: 58,   idiom: 'iphone', scale: '2x', size: '29x29'     },
  { file: 'Icon-87px.png',   px: 87,   idiom: 'iphone', scale: '3x', size: '29x29'     },
  { file: 'Icon-80px.png',   px: 80,   idiom: 'iphone', scale: '2x', size: '40x40'     },
  { file: 'Icon-120px.png',  px: 120,  idiom: 'iphone', scale: '3x', size: '40x40'     },
  { file: 'Icon-120px.png',  px: 120,  idiom: 'iphone', scale: '2x', size: '60x60'     },
  { file: 'Icon-180px.png',  px: 180,  idiom: 'iphone', scale: '3x', size: '60x60'     },
  // ── iPad ────────────────────────────────────────────────────────
  { file: 'Icon-20px.png',   px: 20,   idiom: 'ipad',   scale: '1x', size: '20x20'     },
  { file: 'Icon-40px.png',   px: 40,   idiom: 'ipad',   scale: '2x', size: '20x20'     },
  { file: 'Icon-29px.png',   px: 29,   idiom: 'ipad',   scale: '1x', size: '29x29'     },
  { file: 'Icon-58px.png',   px: 58,   idiom: 'ipad',   scale: '2x', size: '29x29'     },
  { file: 'Icon-40px.png',   px: 40,   idiom: 'ipad',   scale: '1x', size: '40x40'     },
  { file: 'Icon-80px.png',   px: 80,   idiom: 'ipad',   scale: '2x', size: '40x40'     },
  { file: 'Icon-152px.png',  px: 152,  idiom: 'ipad',   scale: '2x', size: '76x76'     },
  { file: 'Icon-167px.png',  px: 167,  idiom: 'ipad',   scale: '2x', size: '83.5x83.5' },
  // ── App Store ───────────────────────────────────────────────────
  { file: 'AppIcon-1024.png', px: 1024, idiom: 'ios-marketing', scale: '1x', size: '1024x1024' },
];

async function main() {
  const svgBuffer = fs.readFileSync(SRC);

  // Generate each unique pixel size exactly once
  const generated = new Set();
  for (const { file, px } of SLOTS) {
    if (generated.has(file)) continue;
    generated.add(file);
    if (file === 'AppIcon-1024.png') continue; // already exists
    await sharp(svgBuffer, { density: 300 })
      .resize(px, px)
      .png()
      .toFile(path.join(DEST, file));
    console.log(`  ✓ ${file}  (${px}×${px})`);
  }

  // Build Contents.json
  const images = SLOTS.map(({ file, idiom, scale, size }) => ({
    filename: file,
    idiom,
    scale,
    size,
  }));

  const contents = { images, info: { author: 'xcode', version: 1 } };
  fs.writeFileSync(
    path.join(DEST, 'Contents.json'),
    JSON.stringify(contents, null, 2) + '\n'
  );
  console.log('  ✓ Contents.json written');
  console.log(`\n  Total slots: ${SLOTS.length}`);
  console.log(`  Unique files generated: ${generated.size - 1} (+ AppIcon-1024.png kept)`);
}

main().catch(err => { console.error(err); process.exit(1); });
