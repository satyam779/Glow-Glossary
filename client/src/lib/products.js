import { useEffect, useState } from 'react';
import { api } from './api';

// Tiny cache so moving between shop pages doesn't refetch everything.
const cache = new Map();
const TTL = 30_000;

async function cached(key, load) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.value;
  const value = await load();
  cache.set(key, { at: Date.now(), value });
  return value;
}

export const fetchProducts = () => cached('products', () => api('/products').then((d) => d.products));
export const fetchProduct = (slug) => cached(`product:${slug}`, () => api(`/products/${encodeURIComponent(slug)}`).then((d) => d.product));

function useAsync(load, deps) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    load()
      .then((data) => alive && setState({ data, error: null, loading: false }))
      .catch((error) => alive && setState({ data: null, error, loading: false }));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}

export const useProducts = () => useAsync(fetchProducts, []);
export const useProduct = (slug) => useAsync(() => fetchProduct(slug), [slug]);
