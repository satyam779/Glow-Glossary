// Fills the store with the starting catalogue and its images.
// `npm run seed` runs it against the configured store (Supabase or local). Products that already
// exist (same slug) are kept as they are, so it's safe to run more than once; a product left
// without photos by an interrupted run gets them on the next run.
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { config } from './config.js';
import { seedProducts, seedPromos } from './seed/products.js';
import { store } from './store/index.js';

async function seedImages(slug, alt) {
  const dir = path.join(config.paths.seedImages, slug);
  const files = (await readdir(dir).catch(() => [])).sort();
  return Promise.all(files.map(async (f) => ({ buffer: await readFile(path.join(dir, f)), alt })));
}

export async function seed({ log = console.log } = {}) {
  let created = 0;
  for (const { alt, ...product } of seedProducts) {
    let saved = await store.getProduct({ slug: product.slug, includeInactive: true });
    if (saved && saved.images.length) {
      log(`  skip  ${product.slug} (already exists)`);
      continue;
    }
    if (!saved) {
      saved = await store.createProduct(product);
      created++;
    }
    const images = await seedImages(product.slug, alt);
    if (images.length) await store.addImages(saved.id, images);
    log(`  added ${product.slug} (${images.length} images)`);
  }

  const promos = await store.listPromos();
  for (const promo of seedPromos) {
    if (promos.some((p) => p.code === promo.code)) continue;
    await store.createPromo(promo);
    log(`  added promo ${promo.code}`);
  }
  return created;
}

// Run directly: node server/seed.js
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(`Seeding the ${config.mode} store…`);
  seed()
    .then((n) => {
      console.log(`Done. ${n} product(s) added.`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seeding failed:', err.message);
      process.exit(1);
    });
}
