import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { CATEGORIES } from '../../../shared/constants.js';
import ProductCard from '../components/ProductCard';
import { Leaf, Truck, Cash } from '../components/Icons';
import { PROMO } from '../content';
import { useProducts } from '../lib/products';
import PageShell from './PageShell';

const SORTS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'name', label: 'Name' },
];

export default function ShopPage() {
  const { data: products, error, loading } = useProducts();
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || 'all';
  const sort = params.get('sort') || 'featured';

  const set = (key, value, fallback) => {
    const next = new URLSearchParams(params);
    if (value === fallback) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true, preventScrollReset: true });
  };

  // Only offer the categories that actually have products.
  const available = useMemo(
    () => CATEGORIES.filter((c) => (products || []).some((p) => p.category === c.value)),
    [products]
  );

  const visible = useMemo(() => {
    const list = (products || []).filter((p) => category === 'all' || p.category === category);
    const sorted = [...list];
    if (sort === 'price-asc') sorted.sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') sorted.sort((a, b) => b.price - a.price);
    if (sort === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [products, category, sort]);

  return (
    <PageShell title="Shop" className="shoppage">
      <header className="shophead">
        <p className="shophead__eyebrow">The shop</p>
        <h1 className="shophead__title">
          Matcha, made a <em>ritual.</em>
        </h1>
        <p className="shophead__lede">
          Organic ceremonial grade A matcha, stone-ground from first-harvest leaves in Shizuoka, plus the kits and collagen to
          go with it.
        </p>
        <ul className="perks" aria-label="Why shop with us">
          <li>
            <Truck /> Free shipping
          </li>
          <li>
            <Leaf /> USDA + JAS organic
          </li>
          <li>
            <Cash /> Cash on delivery
          </li>
        </ul>
      </header>

      <div className="shopbar">
        <div className="chips" role="tablist" aria-label="Filter by category">
          {[{ value: 'all', label: 'All' }, ...available].map((c) => (
            <button
              key={c.value}
              type="button"
              role="tab"
              aria-selected={category === c.value}
              className={`chip ${category === c.value ? 'is-active' : ''}`}
              onClick={() => set('category', c.value, 'all')}
            >
              {c.label}
            </button>
          ))}
        </div>
        <label className="sort">
          <span>Sort</span>
          <select value={sort} onChange={(e) => set('sort', e.target.value, 'featured')}>
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? (
        <div className="state">
          <p>We couldn’t load the shop right now.</p>
          <button type="button" className="btn" onClick={() => window.location.reload()}>
            Try again
          </button>
        </div>
      ) : (
        <div className="grid" aria-busy={loading}>
          {loading
            ? Array.from({ length: 6 }, (_, i) => <div className="pcard pcard--skeleton" key={i} />)
            : visible.map((p) => <ProductCard key={p.id} product={p} />)}
          {!loading && visible.length === 0 && <p className="state">Nothing here yet. Try another category.</p>}
        </div>
      )}

      <aside className="promo-strip">
        <p>
          New here? <strong>{PROMO.text}</strong> at checkout.
        </p>
      </aside>
    </PageShell>
  );
}
