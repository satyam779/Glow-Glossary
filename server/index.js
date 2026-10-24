import { createApp } from './app.js';
import { config } from './config.js';
import { store } from './store/index.js';

// In local mode, a fresh checkout starts with the real catalogue already in place.
// The "seeded" flag means it happens once (and resumes if a restart interrupted it),
// so products an admin deletes later don't come back.
if (config.mode === 'local' && !(await store.getMeta('seeded'))) {
  const { seed } = await import('./seed.js');
  console.log('[seed] Adding the starting catalogue to the local store…');
  await seed({ log: (line) => console.log(`[seed]${line}`) });
  await store.setMeta('seeded', true);
}

createApp().listen(config.port, () => {
  console.log(`Glow Glossary API on http://localhost:${config.port}  (store: ${config.mode})`);
  if (config.mode === 'local') {
    console.log('  Local mode: data in data/db.json, images in data/uploads.');
    console.log('  Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env to use Supabase.');
  }
});
