// Shapes of everything the API accepts. Money is always integer paise.
import { z } from 'zod';
import { CATEGORY_VALUES, CONTACT_TOPIC_VALUES, MAX_QTY, MESSAGE_STATUSES, ORDER_STATUSES } from '../../shared/constants.js';

const money = z.number().int().min(0).max(100_000_000);
const slug = z
  .string()
  .trim()
  .toLowerCase()
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'use lowercase letters, numbers and dashes');

const productFields = {
  name: z.string().trim().min(2).max(120),
  slug,
  tagline: z.string().trim().max(160),
  description: z.string().trim().max(6000),
  price: money,
  compareAt: money.nullable(),
  size: z.string().trim().max(60),
  category: z.enum(CATEGORY_VALUES),
  badges: z.array(z.string().trim().min(1).max(40)).max(6),
  stock: z.number().int().min(0).max(1_000_000).nullable(), // null = not tracked
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  sortOrder: z.number().int().min(-10_000).max(10_000),
};

export const productCreate = z.object(productFields).partial().required({ name: true, price: true, category: true });
export const productPatch = z.object(productFields).partial();

export const imageReorder = z.object({ order: z.array(z.uuid()).min(1).max(50) });
export const imagePatch = z.object({ alt: z.string().trim().max(200) });

const phone = z
  .string()
  .transform((v) => v.replace(/[\s()-]/g, ''))
  .pipe(z.string().regex(/^(\+?91)?[6-9]\d{9}$/, 'enter a valid 10-digit mobile number'));

export const customer = z.object({
  name: z.string().trim().min(2, 'please enter your name').max(80),
  email: z.email('enter a valid email address').max(120),
  phone,
  line1: z.string().trim().min(3, 'please enter your address').max(160),
  line2: z.string().trim().max(160).optional().default(''),
  city: z.string().trim().min(2, 'please enter your city').max(60),
  state: z.string().trim().min(2, 'please enter your state').max(60),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, 'enter a 6-digit PIN code'),
  notes: z.string().trim().max(500).optional().default(''),
});

export const orderCreate = z.object({
  customer,
  items: z
    .array(z.object({ productId: z.uuid(), quantity: z.number().int().min(1).max(MAX_QTY) }))
    .min(1, 'your cart is empty')
    .max(30),
  promoCode: z.string().trim().max(30).optional().default(''),
});

export const orderStatus = z.object({ status: z.enum(ORDER_STATUSES) });

export const promoCode = z
  .string()
  .trim()
  .toUpperCase()
  .min(3)
  .max(30)
  .regex(/^[A-Z0-9_-]+$/, 'use letters, numbers, dashes or underscores');

export const promoCreate = z.object({
  code: promoCode,
  percentOff: z.number().int().min(1).max(90),
  active: z.boolean().optional().default(true),
});
export const promoPatch = z.object({ percentOff: z.number().int().min(1).max(90), active: z.boolean() }).partial();

export const login = z.object({
  email: z.email().max(160),
  password: z.string().min(1).max(200),
});

// Contact form. `website` is a honeypot: hidden from people, so only bots fill it in.
export const contactCreate = z.object({
  name: z.string().trim().min(2, 'please enter your name').max(80),
  email: z.email('enter a valid email address').max(120),
  phone: z
    .string()
    .transform((v) => v.replace(/[\s()-]/g, ''))
    .pipe(z.union([z.literal(''), z.string().regex(/^\+?\d{7,15}$/, 'enter a valid phone number, or leave it empty')]))
    .optional()
    .default(''),
  topic: z.enum(CONTACT_TOPIC_VALUES, 'choose what your message is about'),
  message: z.string().trim().min(10, 'please write a little more (10+ characters)').max(3000),
  website: z.string().max(500).optional().default(''),
});

export const messageStatus = z.object({ status: z.enum(MESSAGE_STATUSES) });
