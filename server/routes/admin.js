// Admin API. Everything except /login requires a signed-in admin.
import { timingSafeEqual } from 'node:crypto';
import { Router } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { config } from '../config.js';
import { HttpError, parse, uuidParam } from '../lib/http.js';
import * as schemas from '../lib/schemas.js';
import { createSession, SESSION_COOKIE, sessionCookieOptions } from '../lib/session.js';
import { requireAdmin, sameOrigin } from '../middleware/auth.js';
import { store } from '../store/index.js';

export const adminRouter = Router();
adminRouter.use(sameOrigin);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024, files: 12 },
  fileFilter: (_req, file, cb) =>
    /^image\/(jpeg|png|webp|avif|gif)$/.test(file.mimetype)
      ? cb(null, true)
      : cb(new HttpError(400, `${file.originalname} isn't supported. Use JPG, PNG, WebP or AVIF.`)),
});

// --- auth --------------------------------------------------------------------
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false });

const sameSecret = (a, b) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

async function verifyLogin(email, password) {
  if (config.mode === 'supabase') {
    const { verifySupabaseLogin } = await import('../store/supabase.js');
    const user = await verifySupabaseLogin(email, password);
    if (!user) return null;
    if (!config.adminEmails.includes(user.email)) throw new HttpError(403, 'This account is not an admin.');
    return user;
  }
  if (!config.localAdmin.password) {
    throw new HttpError(503, 'Admin login is not set up. Add ADMIN_PASSWORD to the .env file.');
  }
  const ok = email === config.localAdmin.email && sameSecret(password, config.localAdmin.password);
  return ok ? { id: 'local-admin', email } : null;
}

adminRouter.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = parse(schemas.login, req.body);
  const user = await verifyLogin(email.toLowerCase(), password);
  if (!user) throw new HttpError(401, 'Wrong email or password.');
  res.cookie(SESSION_COOKIE, createSession(user), sessionCookieOptions(req));
  res.json({ user: { email: user.email }, mode: config.mode });
});

adminRouter.post('/logout', (req, res) => {
  res.clearCookie(SESSION_COOKIE, { ...sessionCookieOptions(req), maxAge: undefined });
  res.json({ ok: true });
});

// "Am I signed in?" without an error status when the answer is no.
adminRouter.get('/session', (req, res) => {
  try {
    requireAdmin(req, res, () => {});
    res.json({ user: { email: req.admin.email }, mode: config.mode });
  } catch {
    res.json({ user: null, mode: config.mode });
  }
});

adminRouter.use(requireAdmin);

adminRouter.get('/me', (req, res) => res.json({ user: { email: req.admin.email }, mode: config.mode }));

adminRouter.get('/stats', async (_req, res) => res.json(await store.stats()));

// --- products ----------------------------------------------------------------
adminRouter.get('/products', async (_req, res) => {
  res.json({ products: await store.listProducts({ includeInactive: true }) });
});

adminRouter.post('/products', async (req, res) => {
  const input = parse(schemas.productCreate, req.body);
  res.status(201).json({ product: await store.createProduct(input) });
});

adminRouter.get('/products/:id', async (req, res) => {
  const product = await store.getProduct({ id: uuidParam(req.params.id, 'Product'), includeInactive: true });
  if (!product) throw new HttpError(404, 'Product not found.');
  res.json({ product });
});

adminRouter.patch('/products/:id', async (req, res) => {
  const patch = parse(schemas.productPatch, req.body);
  res.json({ product: await store.updateProduct(uuidParam(req.params.id, 'Product'), patch) });
});

adminRouter.delete('/products/:id', async (req, res) => {
  await store.deleteProduct(uuidParam(req.params.id, 'Product'));
  res.json({ ok: true });
});

// --- product images ------------------------------------------------------------
adminRouter.post('/products/:id/images', upload.array('images', 12), async (req, res) => {
  const id = uuidParam(req.params.id, 'Product');
  if (!req.files?.length) throw new HttpError(400, 'Choose at least one image.');
  const alts = [].concat(req.body?.alt ?? []);
  const files = req.files.map((f, i) => ({ buffer: f.buffer, alt: String(alts[i] || '').slice(0, 200) }));
  res.status(201).json({ images: await store.addImages(id, files) });
});

adminRouter.patch('/products/:id/images', async (req, res) => {
  const { order } = parse(schemas.imageReorder, req.body);
  res.json({ images: await store.reorderImages(uuidParam(req.params.id, 'Product'), order) });
});

adminRouter.patch('/images/:imageId', async (req, res) => {
  const patch = parse(schemas.imagePatch, req.body);
  res.json({ image: await store.updateImage(uuidParam(req.params.imageId, 'Image'), patch) });
});

adminRouter.delete('/images/:imageId', async (req, res) => {
  await store.deleteImage(uuidParam(req.params.imageId, 'Image'));
  res.json({ ok: true });
});

// --- orders --------------------------------------------------------------------
adminRouter.get('/orders', async (req, res) => {
  const status = schemas.orderStatus.shape.status.safeParse(req.query.status).data;
  res.json({ orders: await store.listOrders({ status }) });
});

adminRouter.get('/orders/:id', async (req, res) => {
  const order = await store.getOrder(uuidParam(req.params.id, 'Order'));
  if (!order) throw new HttpError(404, 'Order not found.');
  res.json({ order });
});

adminRouter.patch('/orders/:id', async (req, res) => {
  const { status } = parse(schemas.orderStatus, req.body);
  res.json({ order: await store.updateOrderStatus(uuidParam(req.params.id, 'Order'), status) });
});

// --- contact messages ------------------------------------------------------------
adminRouter.get('/messages', async (req, res) => {
  const status = schemas.messageStatus.shape.status.safeParse(req.query.status).data;
  res.json({ messages: await store.listMessages({ status }) });
});

adminRouter.patch('/messages/:id', async (req, res) => {
  const { status } = parse(schemas.messageStatus, req.body);
  res.json({ message: await store.updateMessage(uuidParam(req.params.id, 'Message'), { status }) });
});

adminRouter.delete('/messages/:id', async (req, res) => {
  await store.deleteMessage(uuidParam(req.params.id, 'Message'));
  res.json({ ok: true });
});

// --- promo codes ---------------------------------------------------------------
adminRouter.get('/promos', async (_req, res) => res.json({ promos: await store.listPromos() }));

adminRouter.post('/promos', async (req, res) => {
  res.status(201).json({ promo: await store.createPromo(parse(schemas.promoCreate, req.body)) });
});

adminRouter.patch('/promos/:code', async (req, res) => {
  const code = parse(schemas.promoCode, req.params.code);
  res.json({ promo: await store.updatePromo(code, parse(schemas.promoPatch, req.body)) });
});

adminRouter.delete('/promos/:code', async (req, res) => {
  await store.deletePromo(parse(schemas.promoCode, req.params.code));
  res.json({ ok: true });
});
