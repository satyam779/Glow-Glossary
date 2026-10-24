// Prepares every image the site uses. Run with: npm run images
//  - assets-src/photos   : product photos -> web-sized WebP in client/public/images
//  - assets-src/site     : photos and banners from glowglossary.com -> WebP in client/public/images
//  - assets-src/press    : "As seen in" logos -> single-colour transparent PNGs in client/public/images/press
//  - assets-src/partners : cafe partner logos -> single-colour transparent PNGs in client/public/images/partners
//  - assets-src/seed/<product-slug> : product galleries -> seed/images (uploaded by `npm run seed`)
// It also cuts the round lid sticker out of the gift-box shot so the 3D tin can wear it.
import sharp from 'sharp';
import { mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';

const OUT = 'client/public/images';
const SEED_OUT = 'seed/images';
const INK = [20, 32, 16]; // --ink

const photos = [
  ['photos/tin-powder.jpg', 'tin-powder', 1200],
  ['photos/tin-hand.jpg', 'tin-hand', 1200],
  ['photos/box-balance.jpg', 'box-balance', 1200],
  ['photos/box-latte.jpg', 'box-latte', 1800],
  ['photos/lineup-mango.jpg', 'lineup-mango', 1800],
  ['site/founder.png', 'founder', 1000],
  ['site/farm.avif', 'farm', 1000],
  ['site/powder-jar.avif', 'powder-jar', 1000],
  ['site/community.avif', 'community', 1000],
  ['site/friends.png', 'friends', 1600],
  ['site/friends-square.png', 'friends-square', 1000],
  ['site/banner-wide.jpg', 'banner-wide', 1600],
  ['site/banner-tall.jpg', 'banner-tall', 900],
  ['site/tasting.webp', 'tasting', 1000],
  ['site/product-gg-matcha.webp', 'product-gg-matcha', 800],
  ['site/product-ritual-kit.png', 'product-ritual-kit', 800],
  ['site/product-collagen.png', 'product-collagen', 800],
  ['site/product-collagen-kit.png', 'product-collagen-kit', 800],
  ['site/product-duo.png', 'product-duo', 800],
  ['site/product-on-the-go.webp', 'product-on-the-go', 800],
];

await mkdir(OUT, { recursive: true });

for (const [src, name, width] of photos) {
  const info = await sharp(`assets-src/${src}`)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 80, effort: 6 })
    .toFile(`${OUT}/${name}.webp`);
  console.log(`${name}.webp  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KB`);
}

// Lid sticker: centred on the lid in the gift-box shot.
const r = 362;
const sticker = await sharp('assets-src/photos/box-balance.jpg')
  .extract({ left: 1094 - r, top: 1937 - r, width: r * 2, height: r * 2 })
  .resize(1024, 1024)
  .webp({ quality: 86 })
  .toFile(`${OUT}/lid-sticker.webp`);
console.log(`lid-sticker.webp  ${sticker.width}x${sticker.height}  ${(sticker.size / 1024).toFixed(0)} KB`);

// Turn a logo into a single-colour mark. `coverage` maps an RGBA pixel to 0..1 opacity.
async function monochrome(file, outFile, coverage, height) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0; i < info.width * info.height; i++) {
    const [rr, gg, bb, aa] = [data[i * 4], data[i * 4 + 1], data[i * 4 + 2], data[i * 4 + 3]];
    out[i * 4] = INK[0];
    out[i * 4 + 1] = INK[1];
    out[i * 4 + 2] = INK[2];
    out[i * 4 + 3] = Math.round(Math.min(1, Math.max(0, coverage(rr, gg, bb))) * aa);
  }
  const res = await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim({ threshold: 1 })
    .resize({ height, withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toFile(outFile);
  console.log(`${path.basename(outFile)}  ${res.width}x${res.height}`);
}

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// Press logos are white letters on red: keep the white.
await mkdir(`${OUT}/press`, { recursive: true });
for (const f of await readdir('assets-src/press')) {
  await monochrome(
    `assets-src/press/${f}`,
    `${OUT}/press/${path.parse(f).name}.png`,
    (rr, gg, bb) => smooth(0.55, 0.9, Math.min(rr, gg, bb) / 255),
    72
  );
}

// Cafe logos are dark marks on white: keep the dark.
await mkdir(`${OUT}/partners`, { recursive: true });
for (const f of await readdir('assets-src/partners')) {
  await monochrome(
    `assets-src/partners/${f}`,
    `${OUT}/partners/${path.parse(f).name}.png`,
    (rr, gg, bb) => (1 - (0.299 * rr + 0.587 * gg + 0.114 * bb) / 255) * 1.8,
    96
  );
}

// Product galleries for the seed script: one folder per product slug, files in display order.
for (const slug of await readdir('assets-src/seed')) {
  await mkdir(`${SEED_OUT}/${slug}`, { recursive: true });
  for (const f of (await readdir(`assets-src/seed/${slug}`)).sort()) {
    await sharp(`assets-src/seed/${slug}/${f}`)
      .resize({ width: 1400, height: 1400, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80, effort: 5 })
      .toFile(`${SEED_OUT}/${slug}/${path.parse(f).name}.webp`);
  }
  console.log(`seed/${slug}: ${(await readdir(`${SEED_OUT}/${slug}`)).length} images`);
}
