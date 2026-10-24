// Values shared by the storefront, the admin and the API, so they never drift apart.

export const CATEGORIES = [
  { value: 'matcha', label: 'Matcha' },
  { value: 'kits', label: 'Ritual kits' },
  { value: 'collagen', label: 'Matcha collagen' },
  { value: 'accessories', label: 'Accessories' },
];
export const CATEGORY_VALUES = CATEGORIES.map((c) => c.value);
export const categoryLabel = (value) => CATEGORIES.find((c) => c.value === value)?.label ?? value;

export const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

// Shipping is free on every order (as on the current store).
export const SHIPPING_PAISE = 0;

// Cash-on-delivery handling fee, per the store's shipping policy (₹50). Set to 0 to drop it.
export const COD_FEE_PAISE = 5000;

// Most of one product a customer can order at once.
export const MAX_QTY = 20;

// What a contact-form message is about.
export const CONTACT_TOPICS = [
  { value: 'order', label: 'Help with an order' },
  { value: 'wholesale', label: 'Bulk & wholesale' },
  { value: 'cafe', label: 'Café partnership' },
  { value: 'events', label: 'Workshops & events' },
  { value: 'press', label: 'Press & collaborations' },
  { value: 'other', label: 'Something else' },
];
export const CONTACT_TOPIC_VALUES = CONTACT_TOPICS.map((t) => t.value);
export const topicLabel = (value) => CONTACT_TOPICS.find((t) => t.value === value)?.label ?? value;

export const MESSAGE_STATUSES = ['new', 'read', 'archived'];
