// Small signed session tokens for the admin cookie: base64url(payload).base64url(HMAC-SHA256).
import { createHmac, timingSafeEqual } from 'node:crypto';
import { config } from '../config.js';

export const SESSION_COOKIE = 'gg_admin';
export const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const sign = (data) => createHmac('sha256', config.sessionSecret).update(data).digest('base64url');

export function createSession(user) {
  const payload = Buffer.from(
    JSON.stringify({ sub: user.id, email: user.email, exp: Date.now() + SESSION_MAX_AGE_MS })
  ).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function readSession(token) {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const [payload, signature] = token.split('.');
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature || '');
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return data.exp > Date.now() ? data : null;
  } catch {
    return null;
  }
}

export function sessionCookieOptions(req) {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProd || req.secure,
    path: '/api',
    maxAge: SESSION_MAX_AGE_MS,
  };
}
