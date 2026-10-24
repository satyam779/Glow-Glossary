// The app talks to whichever store the config selects; both expose the same functions.
// Only the selected one is loaded, so local mode never needs Supabase keys.
import { config } from '../config.js';

export const store =
  config.mode === 'supabase'
    ? (await import('./supabase.js')).supabaseStore
    : (await import('./local.js')).localStore;
