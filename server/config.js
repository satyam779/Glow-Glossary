// Reads settings from the environment (and .env, if present) once, at startup.
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envFile = path.join(root, '.env');
if (existsSync(envFile)) process.loadEnvFile(envFile);

const env = process.env;
const isProd = env.NODE_ENV === 'production';
const list = (value) =>
  (value || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

const supabaseUrl = env.SUPABASE_URL?.trim();
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();

let sessionSecret = env.SESSION_SECRET;
if (!sessionSecret) {
  if (isProd) throw new Error('SESSION_SECRET must be set in production.');
  // Dev only: a fresh secret per run (admins just log in again after a restart).
  sessionSecret = randomBytes(32).toString('hex');
  console.warn('[config] SESSION_SECRET is not set; using a temporary one for this run.');
}

export const config = {
  root,
  isProd,
  port: Number(env.PORT) || 3001,
  // 'supabase' when the project keys are present; otherwise a local JSON store for development.
  mode: supabaseUrl && supabaseServiceKey ? 'supabase' : 'local',
  supabase: {
    url: supabaseUrl,
    serviceKey: supabaseServiceKey,
    anonKey: env.SUPABASE_ANON_KEY?.trim(),
    bucket: env.SUPABASE_BUCKET?.trim() || 'product-images',
  },
  sessionSecret,
  // Supabase mode: Supabase Auth users whose email is listed here can use the admin.
  adminEmails: list(env.ADMIN_EMAILS),
  // Local mode: a single admin login from .env.
  localAdmin: {
    email: (env.ADMIN_EMAIL || 'admin@glowglossary.in').trim().toLowerCase(),
    password: env.ADMIN_PASSWORD || '',
  },
  // Extra origins allowed to send admin requests (comma-separated), e.g. a separate admin domain.
  allowedOrigins: list(env.ALLOWED_ORIGINS),
  paths: {
    dist: path.join(root, 'dist'),
    // Local mode only. Kept outside server/ so the dev watcher doesn't restart on every write.
    uploads: path.join(root, 'data', 'uploads'),
    data: path.join(root, 'data'),
    seedImages: path.join(root, 'seed', 'images'), // outside server/ so reading them never trips the dev watcher
  },
};
