// Development store: everything in data/db.json, images in data/uploads.
// Same interface and behaviour as the Supabase store, so the app runs before Supabase is set up.
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';
import { HttpError } from '../lib/http.js';
import { processImage } from '../lib/images.js';
import { slugify, uniqueSlug } from '../lib/slug.js';
import { PRODUCT_DEFAULTS, publicOrder, totals } from './shared.js';

const DB_FILE = path.join(config.paths.data, 'db.json');
const empty = () => ({ products: [], images: [], orders: [], promos: [], messages: [], nextOrderNumber: 1001, meta: {} });

let db = null;
let writing = Promise.resolve();

async function load() {
  if (db) return db;
  try {
    db = { ...empty(), ...JSON.parse(await readFile(DB_FILE, 'utf8')) };
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
    db = empty();
  }
  return db;
}

// Writes are queued and atomic (temp file + rename), so concurrent requests can't corrupt the file.
function save() {
  const snapshot = JSON.stringify(db, null, 2);
  writing = writing.then(async () => {
    await mkdir(config.paths.data, { recursive: true });
    const tmp = `${DB_FILE}.${process.pid}.tmp`;
    await writeFile(tmp, snapshot);
    await rename(tmp, DB_FILE);
  });
  return writing;
}

const now = () => new Date().toISOString();
const clone = (v) => structuredClone(v);

function withImages(product) {
  const images = db.images
    .filter((i) => i.productId === product.id)
    .sort((a, b) => a.position - b.position)
    .map(({ id, url, alt, position }) => ({ id, url, alt, position }));
  return clone({ ...product, images });
}

const sortProducts = (a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt);

export const localStore = {
  mode: 'local',

  async listProducts({ includeInactive = false, category, featured } = {}) {
    await load();
    return db.products
      .filter((p) => (includeInactive || p.isActive) && (!category || p.category === category) && (!featured || p.isFeatured))
      .sort(sortProducts)
      .map(withImages);
  },

  async getProduct({ id, slug, includeInactive = false }) {
    await load();
    const p = db.products.find((x) => (id ? x.id === id : x.slug === slug));
    if (!p || (!includeInactive && !p.isActive)) return null;
    return withImages(p);
  },

  async createProduct(input) {
    await load();
    const slug = uniqueSlug(
      input.slug || slugify(input.name),
      db.products.map((p) => p.slug)
    );
    const product = { ...PRODUCT_DEFAULTS, ...input, slug, id: randomUUID(), createdAt: now(), updatedAt: now() };
    db.products.push(product);
    await save();
    return withImages(product);
  },

  async updateProduct(id, patch) {
    await load();
    const p = db.products.find((x) => x.id === id);
    if (!p) throw new HttpError(404, 'Product not found.');
    if (patch.slug && patch.slug !== p.slug && db.products.some((x) => x.slug === patch.slug)) {
      throw new HttpError(409, 'Another product already uses that URL slug.');
    }
    Object.assign(p, patch, { updatedAt: now() });
    await save();
    return withImages(p);
  },

  async deleteProduct(id) {
    await load();
    const idx = db.products.findIndex((x) => x.id === id);
    if (idx === -1) throw new HttpError(404, 'Product not found.');
    db.products.splice(idx, 1);
    db.images = db.images.filter((i) => i.productId !== id);
    await save();
    await rm(path.join(config.paths.uploads, 'products', id), { recursive: true, force: true });
  },

  // files: [{ buffer, alt }]
  async addImages(productId, files) {
    await load();
    if (!db.products.some((p) => p.id === productId)) throw new HttpError(404, 'Product not found.');
    const dir = path.join(config.paths.uploads, 'products', productId);
    await mkdir(dir, { recursive: true });
    let position = Math.max(-1, ...db.images.filter((i) => i.productId === productId).map((i) => i.position)) + 1;
    const added = [];
    for (const file of files) {
      const img = await processImage(file.buffer);
      const name = `${randomUUID()}.${img.ext}`;
      await writeFile(path.join(dir, name), img.buffer);
      const row = {
        id: randomUUID(),
        productId,
        url: `/uploads/products/${productId}/${name}`,
        path: `products/${productId}/${name}`,
        alt: file.alt || '',
        position: position++,
        createdAt: now(),
      };
      db.images.push(row);
      added.push({ id: row.id, url: row.url, alt: row.alt, position: row.position });
    }
    await save();
    return added;
  },

  async reorderImages(productId, order) {
    await load();
    const mine = db.images.filter((i) => i.productId === productId);
    order.forEach((imageId, i) => {
      const img = mine.find((m) => m.id === imageId);
      if (img) img.position = i;
    });
    await save();
    return withImages(db.products.find((p) => p.id === productId)).images;
  },

  async updateImage(imageId, patch) {
    await load();
    const img = db.images.find((i) => i.id === imageId);
    if (!img) throw new HttpError(404, 'Image not found.');
    Object.assign(img, patch);
    await save();
    return { id: img.id, url: img.url, alt: img.alt, position: img.position };
  },

  async deleteImage(imageId) {
    await load();
    const img = db.images.find((i) => i.id === imageId);
    if (!img) throw new HttpError(404, 'Image not found.');
    db.images = db.images.filter((i) => i.id !== imageId);
    await save();
    await rm(path.join(config.paths.uploads, img.path), { force: true });
  },

  async validatePromo(code) {
    await load();
    const promo = db.promos.find((p) => p.code === code.trim().toUpperCase() && p.active);
    return promo ? { code: promo.code, percentOff: promo.percentOff } : null;
  },

  // Prices come from the catalogue, never from the client. Checks everything before changing anything.
  async createOrder({ customer, items, promoCode }) {
    await load();
    const wanted = new Map();
    for (const { productId, quantity } of items) wanted.set(productId, (wanted.get(productId) || 0) + quantity);

    const lines = [];
    for (const [productId, quantity] of wanted) {
      const p = db.products.find((x) => x.id === productId && x.isActive);
      if (!p) throw new HttpError(409, 'One of the products in your cart is no longer available.');
      if (p.stock !== null && p.stock < quantity) {
        throw new HttpError(409, p.stock === 0 ? `${p.name} is sold out.` : `Only ${p.stock} of ${p.name} left in stock.`);
      }
      lines.push({ p, quantity });
    }

    const promo = promoCode ? await this.validatePromo(promoCode) : null;
    const subtotal = lines.reduce((sum, { p, quantity }) => sum + p.price * quantity, 0);
    for (const { p, quantity } of lines) if (p.stock !== null) p.stock -= quantity;

    const order = {
      id: randomUUID(),
      number: db.nextOrderNumber++,
      publicToken: randomUUID(),
      status: 'pending',
      customer,
      items: lines.map(({ p, quantity }) => ({
        productId: p.id,
        name: p.name,
        image: withImages(p).images[0]?.url || null,
        unitPrice: p.price,
        quantity,
        lineTotal: p.price * quantity,
      })),
      ...totals(subtotal, promo?.percentOff),
      promoCode: promo?.code || null,
      paymentMethod: 'cod',
      createdAt: now(),
      updatedAt: now(),
    };
    db.orders.push(order);
    await save();
    return clone(order);
  },

  async getPublicOrder(id, token) {
    await load();
    const order = db.orders.find((o) => o.id === id && o.publicToken === token);
    return order ? publicOrder(order) : null;
  },

  async listOrders({ status } = {}) {
    await load();
    return clone(
      db.orders.filter((o) => !status || o.status === status).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    );
  },

  async getOrder(id) {
    await load();
    const order = db.orders.find((o) => o.id === id);
    return order ? clone(order) : null;
  },

  async updateOrderStatus(id, status) {
    await load();
    const order = db.orders.find((o) => o.id === id);
    if (!order) throw new HttpError(404, 'Order not found.');
    order.status = status;
    order.updatedAt = now();
    await save();
    return clone(order);
  },

  async listPromos() {
    await load();
    return clone(db.promos).sort((a, b) => a.code.localeCompare(b.code));
  },

  async createPromo({ code, percentOff, active }) {
    await load();
    if (db.promos.some((p) => p.code === code)) throw new HttpError(409, 'That code already exists.');
    const promo = { code, percentOff, active, createdAt: now() };
    db.promos.push(promo);
    await save();
    return clone(promo);
  },

  async updatePromo(code, patch) {
    await load();
    const promo = db.promos.find((p) => p.code === code);
    if (!promo) throw new HttpError(404, 'Promo code not found.');
    Object.assign(promo, patch);
    await save();
    return clone(promo);
  },

  async deletePromo(code) {
    await load();
    const before = db.promos.length;
    db.promos = db.promos.filter((p) => p.code !== code);
    if (db.promos.length === before) throw new HttpError(404, 'Promo code not found.');
    await save();
  },

  // --- contact messages ---
  async createMessage(input) {
    await load();
    const msg = { id: randomUUID(), ...input, status: 'new', createdAt: now() };
    db.messages.push(msg);
    await save();
    return clone(msg);
  },

  async listMessages({ status } = {}) {
    await load();
    return clone(
      db.messages.filter((m) => (status ? m.status === status : m.status !== 'archived')).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    );
  },

  async updateMessage(id, { status }) {
    await load();
    const msg = db.messages.find((m) => m.id === id);
    if (!msg) throw new HttpError(404, 'Message not found.');
    msg.status = status;
    await save();
    return clone(msg);
  },

  async deleteMessage(id) {
    await load();
    const before = db.messages.length;
    db.messages = db.messages.filter((m) => m.id !== id);
    if (db.messages.length === before) throw new HttpError(404, 'Message not found.');
    await save();
  },

  async stats() {
    await load();
    const live = db.orders.filter((o) => o.status !== 'cancelled');
    return {
      products: db.products.filter((p) => p.isActive).length,
      totalProducts: db.products.length,
      orders: db.orders.length,
      pending: db.orders.filter((o) => o.status === 'pending').length,
      newMessages: db.messages.filter((m) => m.status === 'new').length,
      revenue: live.reduce((sum, o) => sum + o.total, 0),
      recent: clone([...db.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6)),
    };
  },

  async isEmpty() {
    await load();
    return db.products.length === 0;
  },

  // Small key/value flags (e.g. whether the starting catalogue has been loaded).
  async getMeta(key) {
    await load();
    return db.meta?.[key];
  },

  async setMeta(key, value) {
    await load();
    db.meta = { ...db.meta, [key]: value };
    await save();
  },
};
