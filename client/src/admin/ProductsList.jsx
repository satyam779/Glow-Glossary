import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { categoryLabel } from '../../../shared/constants.js';
import { inr } from '../lib/format';
import { adminApi } from './adminApi';
import { Empty, Loading, PageHead, useLoad, useToast } from './ui';

export default function ProductsList() {
  const { data, loading, error, setData } = useLoad(() => adminApi('/products').then((d) => d.products));
  const [query, setQuery] = useState('');
  const toast = useToast();
  const navigate = useNavigate();

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data || []).filter((p) => !q || p.name.toLowerCase().includes(q) || p.slug.includes(q));
  }, [data, query]);

  // Quick toggles straight from the list.
  const patch = async (product, change, message) => {
    const before = data;
    setData(data.map((p) => (p.id === product.id ? { ...p, ...change } : p)));
    try {
      await adminApi(`/products/${product.id}`, { method: 'PATCH', body: change });
      toast(message);
    } catch (err) {
      setData(before);
      toast(err.message, 'error');
    }
  };

  return (
    <div className="a-page">
      <PageHead title="Products" sub={data ? `${data.length} products · ${data.filter((p) => p.isActive).length} live` : ''}>
        <Link to="/admin/products/new" className="a-btn a-btn--primary">
          + Add product
        </Link>
      </PageHead>

      <div className="a-toolbar">
        <input className="a-search" type="search" placeholder="Search products…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search products" />
      </div>

      {loading && <Loading />}
      {error && <p className="a-error">{error.message}</p>}
      {data && shown.length === 0 && (
        <Empty title={query ? 'No products match your search' : 'No products yet'}>
          {!query && (
            <Link to="/admin/products/new" className="a-btn a-btn--primary">
              Add your first product
            </Link>
          )}
        </Empty>
      )}
      {shown.length > 0 && (
        <div className="a-card a-card--flush">
          <table className="a-table">
            <thead>
              <tr>
                <th>Product</th>
                <th className="hide-sm">Category</th>
                <th className="a-num">Price</th>
                <th className="a-num hide-sm">Stock</th>
                <th>Live</th>
                <th className="hide-sm">Featured</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((p) => (
                <tr key={p.id} className="is-clickable" onClick={() => navigate(`/admin/products/${p.id}`)}>
                  <td>
                    <div className="a-prod">
                      <span className="a-thumb">{p.images[0] ? <img src={p.images[0].url} alt="" loading="lazy" /> : null}</span>
                      <span>
                        <Link to={`/admin/products/${p.id}`} onClick={(e) => e.stopPropagation()} className="a-prod__name">
                          {p.name}
                        </Link>
                        <small>
                          /{p.slug} · {p.images.length} photo{p.images.length === 1 ? '' : 's'}
                        </small>
                      </span>
                    </div>
                  </td>
                  <td className="hide-sm">{categoryLabel(p.category)}</td>
                  <td className="a-num">
                    {inr(p.price)}
                    {p.compareAt > p.price && <s className="a-was">{inr(p.compareAt)}</s>}
                  </td>
                  <td className="a-num hide-sm">{p.stock === null ? <span className="a-muted">—</span> : p.stock}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <label className="mini-switch" title={p.isActive ? 'Live on the store' : 'Hidden'}>
                      <input
                        type="checkbox"
                        checked={p.isActive}
                        onChange={(e) => patch(p, { isActive: e.target.checked }, e.target.checked ? `${p.name} is live` : `${p.name} is hidden`)}
                        aria-label={`${p.name} live`}
                      />
                      <span />
                    </label>
                  </td>
                  <td className="hide-sm" onClick={(e) => e.stopPropagation()}>
                    <label className="mini-switch">
                      <input
                        type="checkbox"
                        checked={p.isFeatured}
                        onChange={(e) => patch(p, { isFeatured: e.target.checked }, e.target.checked ? 'Featured' : 'No longer featured')}
                        aria-label={`${p.name} featured`}
                      />
                      <span />
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
