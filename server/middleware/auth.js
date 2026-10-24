import { config } from '../config.js';
import { HttpError } from '../lib/http.js';
import { readSession, SESSION_COOKIE } from '../lib/session.js';

// Admin routes need a valid session cookie, and (in Supabase mode) an email that is still on the list.
export function requireAdmin(req, _res, next) {
  const session = readSession(req.cookies?.[SESSION_COOKIE]);
  if (!session) throw new HttpError(401, 'Please sign in.');
  if (config.mode === 'supabase' && !config.adminEmails.includes(session.email)) {
    throw new HttpError(403, 'This account no longer has admin access.');
  }
  req.admin = { id: session.sub, email: session.email };
  next();
}

// Cookie-authenticated writes must come from our own pages (blocks cross-site request forgery).
export function sameOrigin(req, _res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.get('origin');
  if (!origin) return next(); // same-origin form posts and server-to-server calls send no Origin
  let host;
  try {
    host = new URL(origin).host;
  } catch {
    throw new HttpError(403, 'Bad request origin.');
  }
  // req.host honours X-Forwarded-Host behind a trusted proxy (app sets 'trust proxy').
  if (host === req.host || host === req.get('host') || config.allowedOrigins.includes(origin.toLowerCase())) return next();
  throw new HttpError(403, 'Cross-site requests are not allowed.');
}
