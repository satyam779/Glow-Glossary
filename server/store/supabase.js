// Production store: Supabase Postgres for data, Supabase Storage for product images.
// Uses the service-role key, so it must only ever run on the server.
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';
import { HttpError } from '../lib/http.js';
import { processImage } from '../lib/images.js';
import { slugify, uniqueSlug } from '../lib/slug.js';
import { COD_FEE_PAISE } from '../../shared/constants.js';
import { PRODUCT_DEFAULTS, publicOrder } from './shared.js';

const sb = createClient(config.supabase.url, config.supabase.serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const bucket = () => sb.storage.from(config.supabase.bucket);

function check({ data, error }, notFoundMessage) {
  if (error) {
    if (error.code === '23505') throw new HttpError(409, 'That value is already in use.');
    console.error('[supabase]', error);
    throw new HttpError(500, 'The database request failed.');
  }
  if (notFoundMessage && !data) throw new HttpError(404, notFoundMessage);
  return data;
}

// --- row <-> API shape -------------------------------------------------------
const PRODUCT_SELECT = '*, product_images(id, url, alt, position)';

const toImage = (r) => ({ id: r.id, url: r.url, alt: r.alt || '', position: r.position });

const toProduct = (r) => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  tagline: r.tagline || '',
  description: r.description || '',
  price: r.price_paise,
  compareAt: r.compare_at_paise,
  size: r.size || '',
  category: r.category,
  badges: r.badges || [],
  stock: r.stock,
  isActive: r.is_active,
  isFeatured: r.is_featured,
  sortOrder: r.sort_order,
  images: (r.product_images || []).sort((a, b) => a.position - b.position).map(toImage),
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const PRODUCT_COLUMNS = {
  slug: 'slug',
  name: 'name',
  tagline: 'tagline',
  description: 'description',
  price: 'price_paise',
  compareAt: 'compare_at_paise',
  size: 'size',
  category: 'category',
  badges: 'badges',
  stock: 'stock',
  isActive: 'is_active',
  isFeatured: 'is_featured',
  sortOrder: 'sort_order',
};
const toRow = (input) =>
  Object.fromEntries(Object.entries(input).filter(([k]) => k in PRODUCT_COLUMNS).map(([k, v]) => [PRODUCT_COLUMNS[k], v]));

const toOrder = (r) => ({
  id: r.id,
  number: r.order_number,
  publicToken: r.public_token,
  status: r.status,
  customer: {
    name: r.customer_name,
    email: r.email,
    phone: r.phone,
    line1: r.address_line1,
    line2: r.address_line2 || '',
    city: r.city,
    state: r.state,
    pincode: r.pincode,
    notes: r.notes || '',
  },
  items: (r.order_items || []).map((i) => ({
    productId: i.product_id,
    name: i.name,
    image: i.image_url,
    unitPrice: i.unit_price_paise,
    quantity: i.quantity,
    lineTotal: i.line_total_paise,
  })),
  subtotal: r.subtotal_paise,
  discount: r.discount_paise,
  shipping: r.shipping_paise,
  codFee: r.cod_fee_paise || 0,
  total: r.total_paise,
  promoCode: r.promo_code,
  paymentMethod: r.payment_method,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const toPromo = (r) => ({ code: r.code, percentOff: r.percent_off, active: r.active, createdAt: r.created_at });

const toMessage = (r) => ({
  id: r.id,
  name: r.name,
  email: r.email,
  phone: r.phone || '',
  topic: r.topic,
  message: r.message,
  status: r.status,
  createdAt: r.created_at,
});

// Messages raised by the create_order() database function.
function orderError(error) {
  const msg = error?.message || '';
  if (msg.includes('OUT_OF_STOCK')) return new HttpError(409, `${msg.split(':').slice(1).join(':').trim() || 'An item'} doesn't have enough stock left.`);
  if (msg.includes('PRODUCT_UNAVAILABLE')) return new HttpError(409, 'One of the products in your cart is no longer available.');
  if (msg.includes('BAD_QUANTITY') || msg.includes('EMPTY_CART')) return new HttpError(400, 'Please check the quantities in your cart.');
  console.error('[supabase] create_order', error);
  return new HttpError(500, 'We could not place your order. Please try again.');
}

export const supabaseStore = {
  mode: 'supabase',

  // One tiny real query, so Supabase counts the project as active (free projects pause after 7 idle days).
  async ping() {
    const { error } = await sb.from('products').select('id', { head: true, count: 'exact' }).limit(1);
    if (error) throw new HttpError(503, `Database unavailable: ${error.message}`);
  },

  async listProducts({ includeInactive = false, category, featured } = {}) {
    let q = sb
      .from('products')
      .select(PRODUCT_SELECT)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (!includeInactive) q = q.eq('is_active', true);
    if (category) q = q.eq('category', category);
    if (featured) q = q.eq('is_featured', true);
    return check(await q).map(toProduct);
  },

  async getProduct({ id, slug, includeInactive = false }) {
    let q = sb.from('products').select(PRODUCT_SELECT);
    q = id ? q.eq('id', id) : q.eq('slug', slug);
    if (!includeInactive) q = q.eq('is_active', true);
    const row = check(await q.maybeSingle());
    return row ? toProduct(row) : null;
  },

  async createProduct(input) {
    const base = input.slug || slugify(input.name);
    const taken = check(await sb.from('products').select('slug').like('slug', `${base}%`)).map((r) => r.slug);
    const row = toRow({ ...PRODUCT_DEFAULTS, ...input, slug: uniqueSlug(base, taken) });
    const created = check(await sb.from('products').insert(row).select(PRODUCT_SELECT).single());
    return toProduct(created);
  },

  async updateProduct(id, patch) {
    const updated = check(
      await sb.from('products').update(toRow(patch)).eq('id', id).select(PRODUCT_SELECT).maybeSingle(),
      'Product not found.'
    );
    return toProduct(updated);
  },

  async deleteProduct(id) {
    const images = check(await sb.from('product_images').select('path').eq('product_id', id));
    check(await sb.from('products').delete().eq('id', id));
    const paths = images.map((i) => i.path).filter(Boolean);
    if (paths.length) await bucket().remove(paths);
  },

  async addImages(productId, files) {
    const product = check(await sb.from('products').select('id').eq('id', productId).maybeSingle(), 'Product not found.');
    const existing = check(await sb.from('product_images').select('position').eq('product_id', product.id));
    let position = Math.max(-1, ...existing.map((r) => r.position)) + 1;
    const added = [];
    for (const file of files) {
      const img = await processImage(file.buffer);
      const path = `products/${productId}/${randomUUID()}.${img.ext}`;
      const { error } = await bucket().upload(path, img.buffer, { contentType: img.contentType, cacheControl: '31536000', upsert: false });
      if (error) {
        console.error('[supabase] storage upload', error);
        throw new HttpError(500, 'Uploading the image failed.');
      }
      const url = bucket().getPublicUrl(path).data.publicUrl;
      const row = check(
        await sb
          .from('product_images')
          .insert({ product_id: productId, url, path, alt: file.alt || '', position: position++ })
          .select('id, url, alt, position')
          .single()
      );
      added.push(toImage(row));
    }
    return added;
  },

  async reorderImages(productId, order) {
    for (const [i, imageId] of order.entries()) {
      check(await sb.from('product_images').update({ position: i }).eq('id', imageId).eq('product_id', productId));
    }
    const rows = check(
      await sb.from('product_images').select('id, url, alt, position').eq('product_id', productId).order('position')
    );
    return rows.map(toImage);
  },

  async updateImage(imageId, patch) {
    const row = check(
      await sb.from('product_images').update({ alt: patch.alt }).eq('id', imageId).select('id, url, alt, position').maybeSingle(),
      'Image not found.'
    );
    return toImage(row);
  },

  async deleteImage(imageId) {
    const row = check(await sb.from('product_images').select('id, path').eq('id', imageId).maybeSingle(), 'Image not found.');
    check(await sb.from('product_images').delete().eq('id', imageId));
    if (row.path) await bucket().remove([row.path]);
  },

  async validatePromo(code) {
    const row = check(
      await sb.from('promo_codes').select('*').eq('code', code.trim().toUpperCase()).eq('active', true).maybeSingle()
    );
    return row ? { code: row.code, percentOff: row.percent_off } : null;
  },

  // One database transaction: reads catalogue prices, checks and decrements stock, writes the order.
  async createOrder({ customer, items, promoCode }) {
    const { data, error } = await sb.rpc('create_order', {
      p_customer: customer,
      p_items: items.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
      p_promo: promoCode || null,
      p_cod_fee: COD_FEE_PAISE,
    });
    if (error) throw orderError(error);
    const order = Array.isArray(data) ? data[0] : data;
    return this.getOrder(order.id);
  },

  async getPublicOrder(id, token) {
    const row = check(
      await sb.from('orders').select('*, order_items(*)').eq('id', id).eq('public_token', token).maybeSingle()
    );
    return row ? publicOrder(toOrder(row)) : null;
  },

  async listOrders({ status } = {}) {
    let q = sb.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }).limit(500);
    if (status) q = q.eq('status', status);
    return check(await q).map(toOrder);
  },

  async getOrder(id) {
    const row = check(await sb.from('orders').select('*, order_items(*)').eq('id', id).maybeSingle());
    return row ? toOrder(row) : null;
  },

  async updateOrderStatus(id, status) {
    check(await sb.from('orders').update({ status }).eq('id', id).select('id').maybeSingle(), 'Order not found.');
    return this.getOrder(id);
  },

  async listPromos() {
    return check(await sb.from('promo_codes').select('*').order('code')).map(toPromo);
  },

  async createPromo({ code, percentOff, active }) {
    const row = check(await sb.from('promo_codes').insert({ code, percent_off: percentOff, active }).select().single());
    return toPromo(row);
  },

  async updatePromo(code, patch) {
    const row = {};
    if (patch.percentOff !== undefined) row.percent_off = patch.percentOff;
    if (patch.active !== undefined) row.active = patch.active;
    return toPromo(check(await sb.from('promo_codes').update(row).eq('code', code).select().maybeSingle(), 'Promo code not found.'));
  },

  async deletePromo(code) {
    check(await sb.from('promo_codes').delete().eq('code', code).select('code').maybeSingle(), 'Promo code not found.');
  },

  // --- contact messages ---
  async createMessage({ name, email, phone, topic, message }) {
    return toMessage(check(await sb.from('contact_messages').insert({ name, email, phone, topic, message }).select().single()));
  },

  async listMessages({ status } = {}) {
    let q = sb.from('contact_messages').select('*').order('created_at', { ascending: false }).limit(500);
    q = status ? q.eq('status', status) : q.neq('status', 'archived');
    return check(await q).map(toMessage);
  },

  async updateMessage(id, { status }) {
    return toMessage(check(await sb.from('contact_messages').update({ status }).eq('id', id).select().maybeSingle(), 'Message not found.'));
  },

  async deleteMessage(id) {
    check(await sb.from('contact_messages').delete().eq('id', id).select('id').maybeSingle(), 'Message not found.');
  },

  async stats() {
    const count = async (q) => {
      const { count: n, error } = await q;
      if (error) check({ error });
      return n || 0;
    };
    const [products, totalProducts, orders, pending, newMessages, totalsRows, recentRows] = await Promise.all([
      count(sb.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true)),
      count(sb.from('products').select('id', { count: 'exact', head: true })),
      count(sb.from('orders').select('id', { count: 'exact', head: true })),
      count(sb.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending')),
      count(sb.from('contact_messages').select('id', { count: 'exact', head: true }).eq('status', 'new')),
      sb.from('orders').select('total_paise').neq('status', 'cancelled').limit(100000),
      sb.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }).limit(6),
    ]);
    return {
      products,
      totalProducts,
      orders,
      pending,
      newMessages,
      revenue: check(totalsRows).reduce((sum, r) => sum + r.total_paise, 0),
      recent: check(recentRows).map(toOrder),
    };
  },

  async isEmpty() {
    const { count, error } = await sb.from('products').select('id', { count: 'exact', head: true });
    if (error) check({ error });
    return !count;
  },
};

// Admin sign-in through Supabase Auth (email + password users created in the Supabase dashboard).
export async function verifySupabaseLogin(email, password) {
  const auth = createClient(config.supabase.url, config.supabase.anonKey || config.supabase.serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await auth.auth.signInWithPassword({ email, password });
  if (error || !data?.user) return null;
  return { id: data.user.id, email: data.user.email.toLowerCase() };
}
