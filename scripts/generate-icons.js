const sharp = require('sharp');
const fs    = require('fs');
const path  = require('path');

const SRC  = path.join(__dirname, '..', 'app-icon.svg');
const DEST = path.join(__dirname, '..', 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset');

// Every size Apple requires, expressed as the pixel dimension of the PNG file.
const SIZES = [20, 29, 40, 58, 60, 76, 80, 87, 120, 152, 167, 180, 1024];

// Contents.json entries — maps each pixel size to the Xcode idiom/scale/size metadata.
const IMAGE_ENTRIES = [
  { size: 20,   idiom: 'iphone', scale: '1x',  pointSize: '20x20'   },
  { size: 40,   idiom: 'iphone', scale: '2x',  pointSize: '20x20'   },
  { size: 60,   idiom: 'iphone', scale: '3x',  pointSize: '20x20'   },
  { size: 29,   idiom: 'iphone', scale: '1x',  pointSize: '29x29'   },
  { size: 58,   idiom: 'iphone', scale: '2x',  pointSize: '29x29'   },
  { size: 87,   idiom: 'iphone', scale: '3x',  pointSize: '29x29'   },
  { size: 40,   idiom: 'iphone', scale: '2x',  pointSize: '40x40'   },
  { size: 80,   idiom: 'iphone', scale: '2x',  pointSize: '40x40'   },
  { size: 120,  idiom: 'iphone', scale: '3x',  pointSize: '40x40'   },
  { size: 120,  idiom: 'iphone', scale: '2x',  pointSize: '60x60'   },
  { size: 180,  idiom: 'iphone', scale: '3x',  pointSize: '60x60'   },
  { size: 76,   idiom: 'ipad',   scale: '1x',  pointSize: '76x76'   },
  { size: 152,  idiom: 'ipad',   scale: '2x',  pointSize: '76x76'   },
  { size: 167,  idiom: 'ipad',   scale: '2x',  pointSize: '83.5x83.5' },
  { size: 1024, idiom: 'ios-marketing', scale: '1x', pointSize: '1024x1024' },
];

async function main() {
  const svgBuffer = fs.readFileSync(SRC);

  // Generate each unique pixel size exactly once
  const generated = new Set();
  for (const px of SIZES) {
    if (generated.has(px)) continue;
    generated.add(px);
    const filename = `AppIcon-${px}.png`;
    await sharp(svgBuffer, { density: 300 })
      .resize(px, px)
      .png()
      .toFile(path.join(DEST, filename));
    console.log(`  ✓ ${filename}`);
  }

  // Build Contents.json
  const images = IMAGE_ENTRIES.map(({ size, idiom, scale, pointSize }) => ({
    filename: `AppIcon-${size}.png`,
    idiom,
    scale,
    size: pointSize,
  }));

  const contents = { images, info: { author: 'xcode', version: 1 } };
  fs.writeFileSync(
    path.join(DEST, 'Contents.json'),
    JSON.stringify(contents, null, 2) + '\n'
  );
  console.log('  ✓ Contents.json updated');
}

main().catch((err) => { console.error(err); process.exit(1); });
