// Logic both stores share: defaults for new products, order totals, and public order views.
import { COD_FEE_PAISE, SHIPPING_PAISE } from '../../shared/constants.js';

export const PRODUCT_DEFAULTS = {
  tagline: '',
  description: '',
  compareAt: null,
  size: '',
  badges: [],
  stock: null,
  isActive: true,
  isFeatured: false,
  sortOrder: 0,
};

// Discounts are rounded down to whole rupees (100 paise), so totals stay tidy.
export const discountFor = (subtotal, percentOff) => (percentOff ? Math.floor((subtotal * percentOff) / 10000) * 100 : 0);

export function totals(subtotal, percentOff) {
  const discount = discountFor(subtotal, percentOff);
  return {
    subtotal,
    discount,
    shipping: SHIPPING_PAISE,
    codFee: COD_FEE_PAISE,
    total: subtotal - discount + SHIPPING_PAISE + COD_FEE_PAISE,
  };
}

// What a customer may see about their order (no internal ids beyond the order's own).
export function publicOrder(order) {
  return {
    id: order.id,
    number: order.number,
    status: order.status,
    createdAt: order.createdAt,
    customer: { name: order.customer.name, city: order.customer.city },
    items: order.items.map(({ name, image, quantity, unitPrice, lineTotal }) => ({ name, image, quantity, unitPrice, lineTotal })),
    subtotal: order.subtotal,
    discount: order.discount,
    shipping: order.shipping,
    codFee: order.codFee || 0,
    total: order.total,
    promoCode: order.promoCode,
    paymentMethod: order.paymentMethod,
  };
}
