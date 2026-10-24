import { existsSync } from 'node:fs';
import path from 'node:path';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import multer from 'multer';
import { LEGACY_REDIRECTS } from '../shared/legacyRedirects.js';
import { config } from './config.js';
import { HttpError } from './lib/http.js';
import { adminRouter } from './routes/admin.js';
import { publicRouter } from './routes/public.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1); // correct client IPs (rate limits) and https detection behind a host's proxy

  const supabaseOrigin = config.supabase.url ? new URL(config.supabase.url).origin : null;
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
          imgSrc: ["'self'", 'data:', 'blob:', ...(supabaseOrigin ? [supabaseOrigin] : [])],
          connectSrc: ["'self'"],
          frameAncestors: ["'none'"],
          upgradeInsecureRequests: config.isProd ? [] : null,
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );
  app.use(compression());
  app.use(cookieParser());
  app.use(express.json({ limit: '200kb' }));

  app.get('/api/health', (_req, res) => res.json({ ok: true, mode: config.mode }));
  app.use('/api', publicRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api', (_req, _res, next) => next(new HttpError(404, 'Not found.')));

  // Old Shopify URLs -> new pages (permanent, so search engines move their ranking across).
  app.use((req, res, next) => {
    const to = req.method === 'GET' && LEGACY_REDIRECTS[req.path.replace(/\/+$/, '').toLowerCase()];
    if (to) return res.redirect(301, to);
    next();
  });

  // Local-mode product images (Supabase mode serves them from Supabase Storage).
  app.use('/uploads', express.static(config.paths.uploads, { maxAge: '30d', immutable: true, fallthrough: false }));

  // The built storefront + admin (npm run build). Unknown paths get index.html for client-side routing.
  if (existsSync(config.paths.dist)) {
    app.use(
      express.static(config.paths.dist, {
        index: false,
        setHeaders: (res, file) => {
          if (file.includes(`${path.sep}assets${path.sep}`)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        },
      })
    );
    app.use((req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') return next();
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(path.join(config.paths.dist, 'index.html'));
    });
  }

  // Errors: known ones keep their status and message; anything else is a logged 500.
  app.use((err, _req, res, _next) => {
    if (err instanceof multer.MulterError) {
      const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      const message = err.code === 'LIMIT_FILE_SIZE' ? 'Each image must be under 12 MB.' : 'Too many files at once (12 max).';
      return res.status(status).json({ error: message });
    }
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message, ...err.details });
    if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON.' });
    if (err?.status === 404 || err?.statusCode === 404) return res.status(404).json({ error: 'Not found.' });
    console.error(err);
    res.status(500).json({ error: 'Something went wrong on our side.' });
  });

  return app;
}
