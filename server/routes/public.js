// Storefront API: catalogue, promo codes and checkout. No authentication.
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { CATEGORY_VALUES } from '../../shared/constants.js';
import { HttpError, parse, uuidParam } from '../lib/http.js';
import { contactCreate, orderCreate, promoCode } from '../lib/schemas.js';
import { config } from '../config.js';
import { store } from '../store/index.js';

export const publicRouter = Router();

// Keep-alive: Vercel Cron (daily) and a GitHub Action (every 3 days) call this so the
// free Supabase project never sits idle long enough to be paused.
publicRouter.get('/cron/keepalive', async (req, res) => {
  if (config.cronSecret && req.get('authorization') !== `Bearer ${config.cronSecret}`) throw new HttpError(401, 'Unauthorized.');
  const started = Date.now();
  await store.ping();
  res.set('Cache-Control', 'no-store').json({ ok: true, mode: store.mode, ms: Date.now() - started, at: new Date().toISOString() });
});

const limiter = (limit, windowMinutes = 15, options = {}) =>
  rateLimit({ windowMs: windowMinutes * 60 * 1000, limit, standardHeaders: 'draft-8', legacyHeaders: false, ...options });

// Products are public, so trim the fields customers don't need.
const forCustomers = ({ stock, isActive, sortOrder, createdAt, updatedAt, ...p }) => ({
  ...p,
  soldOut: stock !== null && stock <= 0,
});

publicRouter.get('/products', async (req, res) => {
  const category = CATEGORY_VALUES.includes(req.query.category) ? req.query.category : undefined;
  const featured = req.query.featured === '1' || req.query.featured === 'true';
  const products = await store.listProducts({ category, featured });
  res.set('Cache-Control', 'public, max-age=30');
  res.json({ products: products.map(forCustomers) });
});

publicRouter.get('/products/:slug', async (req, res) => {
  const product = await store.getProduct({ slug: String(req.params.slug).toLowerCase() });
  if (!product) throw new HttpError(404, 'Product not found.');
  res.set('Cache-Control', 'public, max-age=30');
  res.json({ product: forCustomers(product) });
});

publicRouter.post('/promo/validate', limiter(30), async (req, res) => {
  const code = parse(promoCode, req.body?.code);
  const promo = await store.validatePromo(code);
  if (!promo) throw new HttpError(404, 'That code isn’t valid.');
  res.json({ promo });
});

publicRouter.post('/orders', limiter(15), async (req, res) => {
  const input = parse(orderCreate, req.body);
  const order = await store.createOrder(input);
  res.status(201).json({ order: { id: order.id, number: order.number, token: order.publicToken, total: order.total } });
});

// Rejected submissions store nothing, so they don't count against the sender's allowance.
publicRouter.post('/contact', limiter(6, 15, { skipFailedRequests: true }), async (req, res) => {
  const { website, ...message } = parse(contactCreate, req.body);
  // Honeypot filled in: it's a bot. Pretend it worked, store nothing.
  if (website) return res.status(201).json({ ok: true });
  await store.createMessage(message);
  res.status(201).json({ ok: true });
});

publicRouter.get('/orders/:id', async (req, res) => {
  const id = uuidParam(req.params.id, 'Order');
  const token = uuidParam(req.query.token, 'Order');
  const order = await store.getPublicOrder(id, token);
  if (!order) throw new HttpError(404, 'Order not found.');
  res.set('Cache-Control', 'no-store');
  res.json({ order });
});
