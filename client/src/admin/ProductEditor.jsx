import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { CATEGORIES } from '../../../shared/constants.js';
import { inr, toPaise, toRupees } from '../lib/format';
import { adminApi } from './adminApi';
import ImageManager from './ImageManager';
import { Loading, PageHead, Toggle, useToast } from './ui';

const BLANK = {
  name: '',
  slug: '',
  tagline: '',
  description: '',
  price: '',
  compareAt: '',
  size: '',
  category: 'matcha',
  badges: '',
  stock: '',
  sortOrder: '0',
  isActive: true,
  isFeatured: false,
};

const slugify = (s) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);

const toForm = (p) => ({
  name: p.name,
  slug: p.slug,
  tagline: p.tagline,
  description: p.description,
  price: toRupees(p.price),
  compareAt: toRupees(p.compareAt),
  size: p.size,
  category: p.category,
  badges: p.badges.join(', '),
  stock: p.stock === null ? '' : String(p.stock),
  sortOrder: String(p.sortOrder),
  isActive: p.isActive,
  isFeatured: p.isFeatured,
});

function toPayload(f) {
  const errors = {};
  const price = Number(f.price);
  if (!f.name.trim() || f.name.trim().length < 2) errors.name = 'Give the product a name.';
  if (f.price === '' || !Number.isFinite(price) || price < 0) errors.price = 'Enter a price in rupees.';
  if (f.compareAt !== '' && !(Number(f.compareAt) >= 0)) errors.compareAt = 'Enter a number, or leave empty.';
  if (f.stock !== '' && !(Number.isInteger(Number(f.stock)) && Number(f.stock) >= 0)) errors.stock = 'Whole number, or empty to not track stock.';
  if (f.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(f.slug)) errors.slug = 'Lowercase letters, numbers and dashes only.';
  return {
    errors,
    payload: {
      name: f.name.trim(),
      ...(f.slug ? { slug: f.slug } : {}),
      tagline: f.tagline.trim(),
      description: f.description.trim(),
      price: toPaise(f.price || 0),
      compareAt: f.compareAt === '' ? null : toPaise(f.compareAt),
      size: f.size.trim(),
      category: f.category,
      badges: f.badges
        .split(',')
        .map((b) => b.trim())
        .filter(Boolean)
        .slice(0, 6),
      stock: f.stock === '' ? null : Number(f.stock),
      sortOrder: Number.parseInt(f.sortOrder, 10) || 0,
      isActive: f.isActive,
      isFeatured: f.isFeatured,
    },
  };
}

export default function ProductEditor() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState(BLANK);
  const [saved, setSaved] = useState(BLANK);
  const [images, setImages] = useState([]);
  const [pending, setPending] = useState([]);
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(!isNew);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (isNew) {
      setForm(BLANK);
      setSaved(BLANK);
      setImages([]);
      setSlugTouched(false);
      return;
    }
    setLoading(true);
    adminApi(`/products/${id}`)
      .then(({ product }) => {
        setForm(toForm(product));
        setSaved(toForm(product));
        setImages(product.images);
        setSlugTouched(true);
      })
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(saved) || pending.length > 0, [form, saved, pending]);

  useEffect(() => {
    const warn = (e) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const set = (key) => (e) => {
    const value = e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e;
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === 'name' && !slugTouched) next.slug = slugify(value);
      return next;
    });
  };

  const save = async (e) => {
    e.preventDefault();
    const { errors: errs, payload } = toPayload(form);
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast('Please fix the highlighted fields', 'error');
      return;
    }
    setBusy(true);
    try {
      if (isNew) {
        const { product } = await adminApi('/products', { method: 'POST', body: payload });
        if (pending.length) {
          for (let i = 0; i < pending.length; i += 4) {
            const fd = new FormData();
            pending.slice(i, i + 4).forEach((p) => fd.append('images', p.file));
            await adminApi(`/products/${product.id}/images`, { method: 'POST', body: fd });
          }
        }
        setPending([]);
        setSaved(form);
        toast(`${product.name} created`);
        navigate(`/admin/products/${product.id}`, { replace: true });
      } else {
        const { product } = await adminApi(`/products/${id}`, { method: 'PATCH', body: payload });
        setForm(toForm(product));
        setSaved(toForm(product));
        toast('Changes saved');
      }
    } catch (err) {
      const field = /^(\w+):/.exec(err.message)?.[1];
      if (field) setErrors({ [field]: err.message.replace(/^\w+:\s*/, '') });
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const destroy = async () => {
    if (!window.confirm(`Delete “${form.name}” and all its photos? This can’t be undone.`)) return;
    try {
      await adminApi(`/products/${id}`, { method: 'DELETE' });
      toast('Product deleted');
      navigate('/admin/products', { replace: true });
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  if (loading) return <div className="a-page"><Loading /></div>;
  if (loadError) {
    return (
      <div className="a-page">
        <p className="a-error">{loadError}</p>
        <Link to="/admin/products">← Back to products</Link>
      </div>
    );
  }

  const err = (k) => errors[k] && <small className="a-field__error">{errors[k]}</small>;
  const priceNum = Number(form.price);
  const compareNum = Number(form.compareAt);
  const saving = form.compareAt !== '' && compareNum > priceNum ? Math.round(((compareNum - priceNum) / compareNum) * 100) : 0;

  return (
    <form className="a-page a-editor" onSubmit={save} noValidate>
      <PageHead title={isNew ? 'New product' : form.name || 'Edit product'} sub={<Link to="/admin/products">← All products</Link>}>
        {!isNew && form.isActive && (
          <a className="a-btn" href={`/shop/${saved.slug}`} target="_blank" rel="noopener noreferrer">
            View in store ↗
          </a>
        )}
        <button type="submit" className="a-btn a-btn--primary" disabled={busy || (!dirty && !isNew)}>
          {busy ? 'Saving…' : isNew ? 'Create product' : dirty ? 'Save changes' : 'Saved'}
        </button>
      </PageHead>

      <div className="a-editor__grid">
        <div className="a-editor__main">
          <section className="a-card">
            <h2 className="a-card__title">Details</h2>
            <label className={`a-field ${errors.name ? 'has-error' : ''}`}>
              <span>Name</span>
              <input value={form.name} onChange={set('name')} maxLength={120} required placeholder="e.g. GG Matcha Green" />
              {err('name')}
            </label>
            <label className="a-field">
              <span>Tagline</span>
              <input value={form.tagline} onChange={set('tagline')} maxLength={160} placeholder="One line shown under the name" />
            </label>
            <label className="a-field">
              <span>Description</span>
              <textarea value={form.description} onChange={set('description')} rows={7} maxLength={6000} placeholder="Leave a blank line between paragraphs." />
            </label>
            <label className={`a-field ${errors.slug ? 'has-error' : ''}`}>
              <span>URL</span>
              <div className="a-prefix">
                <em>/shop/</em>
                <input
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set('slug')(e.target.value.toLowerCase());
                  }}
                  maxLength={120}
                  placeholder="made-from-the-name"
                />
              </div>
              {err('slug')}
            </label>
          </section>

          <section className="a-card">
            <h2 className="a-card__title">Photos</h2>
            <ImageManager productId={isNew ? null : id} images={images} onChange={setImages} pending={pending} onPendingChange={setPending} />
          </section>
        </div>

        <div className="a-editor__side">
          <section className="a-card">
            <h2 className="a-card__title">Visibility</h2>
            <Toggle checked={form.isActive} onChange={set('isActive')} label="Live on the store" hint="Hidden products can’t be bought." />
            <Toggle checked={form.isFeatured} onChange={set('isFeatured')} label="Featured" hint="Shown first and on the home page." />
          </section>

          <section className="a-card">
            <h2 className="a-card__title">Pricing</h2>
            <div className="a-row">
              <label className={`a-field ${errors.price ? 'has-error' : ''}`}>
                <span>Price (₹)</span>
                <input type="number" min="0" step="0.01" inputMode="decimal" value={form.price} onChange={set('price')} required />
                {err('price')}
              </label>
              <label className={`a-field ${errors.compareAt ? 'has-error' : ''}`}>
                <span>Compare-at (₹)</span>
                <input type="number" min="0" step="0.01" inputMode="decimal" value={form.compareAt} onChange={set('compareAt')} placeholder="Optional" />
                {err('compareAt')}
              </label>
            </div>
            <p className="a-hint">
              {form.price !== '' && Number.isFinite(priceNum) ? <>Shows as <b>{inr(toPaise(form.price))}</b></> : 'Customers pay this price.'}
              {saving > 0 && <> · <b>{saving}% off</b> label</>}
            </p>
          </section>

          <section className="a-card">
            <h2 className="a-card__title">Organisation</h2>
            <label className="a-field">
              <span>Category</span>
              <select value={form.category} onChange={set('category')}>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="a-field">
              <span>Size / pack</span>
              <input value={form.size} onChange={set('size')} maxLength={60} placeholder="e.g. 30 g tin" />
            </label>
            <label className="a-field">
              <span>Badges</span>
              <input value={form.badges} onChange={set('badges')} placeholder="New, USDA + JAS Organic" />
              <small className="a-field__hint">Comma-separated, up to 6. The first one shows on product cards.</small>
            </label>
            <div className="a-row">
              <label className={`a-field ${errors.stock ? 'has-error' : ''}`}>
                <span>Stock</span>
                <input type="number" min="0" step="1" inputMode="numeric" value={form.stock} onChange={set('stock')} placeholder="Not tracked" />
                {err('stock')}
              </label>
              <label className="a-field">
                <span>Sort order</span>
                <input type="number" step="1" value={form.sortOrder} onChange={set('sortOrder')} />
              </label>
            </div>
            <small className="a-field__hint">Leave stock empty to sell without limits. Lower sort numbers show first.</small>
          </section>

          {!isNew && (
            <section className="a-card a-card--danger">
              <h2 className="a-card__title">Delete product</h2>
              <p className="a-hint">Removes the product and its photos. Past orders keep their details.</p>
              <button type="button" className="a-btn a-btn--danger" onClick={destroy}>
                Delete product
              </button>
            </section>
          )}
        </div>
      </div>
    </form>
  );
}
