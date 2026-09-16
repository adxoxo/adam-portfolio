// Generate src/lib/assets/favicon.png from the aquryu mark (src/lib/assets/mark.png,
// the same file the navbar and footer use as a css mask). The mark's alpha is
// tinted with the brand green (#3D5F40, --accent-deep) on a transparent square.
// Run: node scripts/gen-favicon.cjs   (uses sharp, present through wrangler; no
// project dependency is added)
const path = require('path');
const sharp = require('sharp');

const src = path.join(__dirname, '../src/lib/assets/mark.png');
const out = path.join(__dirname, '../src/lib/assets/favicon.png');
const SIZE = 512;
const PAD = 40; // the mark is taller than wide; it is centred inside the square

(async () => {
	const alpha = await sharp(src).ensureAlpha().extractChannel('alpha').resize({ height: SIZE - 2 * PAD, fit: 'inside' }).toBuffer();
	const meta = await sharp(alpha).metadata();
	// solid brand colour, shaped by the mark's alpha
	const mark = await sharp({ create: { width: meta.width, height: meta.height, channels: 3, background: '#3D5F40' } })
		.joinChannel(alpha)
		.png()
		.toBuffer();
	await sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
		.composite([{ input: mark, gravity: 'centre' }])
		.png({ compressionLevel: 9 })
		.toFile(out);
	const done = await sharp(out).metadata();
	console.log(`wrote ${out}: ${done.width}x${done.height}, ${done.channels} channels`);
})();
