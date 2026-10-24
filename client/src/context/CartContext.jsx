import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { MAX_QTY } from '../../../shared/constants.js';

// The cart lives in the browser (localStorage), synced across tabs.
// Prices here are only for display; the server re-prices everything at checkout.
const KEY = 'gg-cart-v1';
const CartContext = createContext(null);

function load() {
  try {
    const items = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(items) ? items.filter((i) => i && i.id && i.quantity > 0) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(load);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* private mode: cart just won't persist */
    }
  }, [items]);

  useEffect(() => {
    const onStorage = (e) => e.key === KEY && setItems(load());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const add = useCallback((product, quantity = 1) => {
    setItems((list) => {
      const existing = list.find((i) => i.id === product.id);
      if (existing) {
        return list.map((i) => (i.id === product.id ? { ...i, quantity: Math.min(MAX_QTY, i.quantity + quantity) } : i));
      }
      return [
        ...list,
        {
          id: product.id,
          slug: product.slug,
          name: product.name,
          price: product.price,
          size: product.size,
          image: product.images?.[0]?.url || null,
          quantity: Math.min(MAX_QTY, quantity),
        },
      ];
    });
  }, []);

  const setQuantity = useCallback((id, quantity) => {
    setItems((list) =>
      quantity <= 0 ? list.filter((i) => i.id !== id) : list.map((i) => (i.id === id ? { ...i, quantity: Math.min(MAX_QTY, quantity) } : i))
    );
  }, []);

  const remove = useCallback((id) => setItems((list) => list.filter((i) => i.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);
  const replace = useCallback((next) => setItems(next), []);

  const value = useMemo(
    () => ({
      items,
      count: items.reduce((n, i) => n + i.quantity, 0),
      subtotal: items.reduce((n, i) => n + i.price * i.quantity, 0),
      add,
      setQuantity,
      remove,
      clear,
      replace,
      open,
      setOpen,
    }),
    [items, add, setQuantity, remove, clear, replace, open]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
