import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { categoryLabel, COD_FEE_PAISE } from '../../../shared/constants.js';
import ProductCard from '../components/ProductCard';
import QuantityStepper from '../components/QuantityStepper';
import { Cash, Leaf, Truck, StepIcon } from '../components/Icons';
import { CONTACT_EMAIL, RITUAL, WHATSAPP } from '../content';
import { useCart } from '../context/CartContext';
import { inr, paragraphs, savingsPercent } from '../lib/format';
import { useProduct, useProducts } from '../lib/products';
import PageShell from './PageShell';

function Gallery({ images, name }) {
  const [index, setIndex] = useState(0);
  useEffect(() => setIndex(0), [images]);
  if (!images.length) return <div className="gallery__main gallery__main--empty" />;
  const current = images[Math.min(index, images.length - 1)];
  const go = (d) => setIndex((i) => (i + d + images.length) % images.length);
  return (
    <div className="gallery">
      <div className="gallery__main">
        <img src={current.url} alt={current.alt || name} />
        {images.length > 1 && (
          <>
            <button type="button" className="gallery__nav gallery__nav--prev" onClick={() => go(-1)} aria-label="Previous photo">
              ‹
            </button>
            <button type="button" className="gallery__nav gallery__nav--next" onClick={() => go(1)} aria-label="Next photo">
              ›
            </button>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="gallery__thumbs" role="tablist" aria-label="Product photos">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              className={i === index ? 'is-active' : ''}
              onClick={() => setIndex(i)}
            >
              <img src={img.url} alt={`Photo ${i + 1}`} loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Details({ title, children, open = false }) {
  return (
    <details className="details" open={open}>
      <summary>{title}</summary>
      <div className="details__body">{children}</div>
    </details>
  );
}

export default function ProductPage() {
  const { slug } = useParams();
  const { data: product, error, loading } = useProduct(slug);
  const { data: all } = useProducts();
  const { add, setOpen } = useCart();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  useEffect(() => setQty(1), [slug]);

  if (loading) {
    return (
      <PageShell title="Loading…" className="productpage">
        <div className="pdp pdp--skeleton">
          <div className="gallery__main skeleton" />
          <div>
            <div className="skeleton skeleton--title" />
            <div className="skeleton skeleton--text" />
            <div className="skeleton skeleton--text" />
          </div>
        </div>
      </PageShell>
    );
  }

  if (error || !product) {
    return (
      <PageShell title="Not found" className="productpage">
        <div className="state state--page">
          <h1>We couldn’t find that product.</h1>
          <p>It may have sold out or moved.</p>
          <Link className="btn" to="/shop">
            Back to the shop
          </Link>
        </div>
      </PageShell>
    );
  }

  const off = savingsPercent(product.price, product.compareAt);
  const related = (all || [])
    .filter((p) => p.id !== product.id)
    .sort((a, b) => (b.category === product.category) - (a.category === product.category))
    .slice(0, 4);

  const addToBag = () => {
    add(product, qty);
    setOpen(true);
  };
  const buyNow = () => {
    add(product, qty);
    navigate('/checkout');
  };

  return (
    <PageShell title={product.name} className="productpage">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/shop">Shop</Link>
        <span aria-hidden="true">/</span>
        <Link to={`/shop?category=${product.category}`}>{categoryLabel(product.category)}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{product.name}</span>
      </nav>

      <div className="pdp">
        <Gallery images={product.images} name={product.name} />

        <div className="pdp__info">
          <p className="pdp__eyebrow">{categoryLabel(product.category)}</p>
          <h1 className="pdp__name">{product.name}</h1>
          {product.tagline && <p className="pdp__tagline">{product.tagline}</p>}

          <div className="pdp__price">
            <strong>{inr(product.price)}</strong>
            {off > 0 && (
              <>
                <s>{inr(product.compareAt)}</s>
                <span className="tag tag--sale">Save {off}%</span>
              </>
            )}
          </div>
          {product.size && (
            <p className="pdp__meta">
              <span>{product.size}</span>
            </p>
          )}

          {product.badges.length > 0 && (
            <ul className="pdp__badges">
              {product.badges.map((b) => (
                <li className="tag" key={b}>
                  {b}
                </li>
              ))}
            </ul>
          )}

          {product.soldOut ? (
            <div className="pdp__soldout">
              <p>
                <strong>Sold out for now.</strong> Message us and we’ll tell you when it’s back.
              </p>
              <a className="btn btn--ghost" href={WHATSAPP} target="_blank" rel="noopener noreferrer">
                WhatsApp us
              </a>
            </div>
          ) : (
            <div className="pdp__buy">
              <QuantityStepper value={qty} onChange={(q) => setQty(Math.max(1, q))} label={product.name} />
              <button type="button" className="btn pdp__add" onClick={addToBag}>
                Add to bag · {inr(product.price * qty)}
              </button>
              <button type="button" className="btn btn--ghost pdp__now" onClick={buyNow}>
                Buy now
              </button>
            </div>
          )}

          <ul className="pdp__trust">
            <li>
              <Truck /> Free shipping on every order
            </li>
            <li>
              <Cash /> Cash on delivery
            </li>
            <li>
              <Leaf /> USDA + JAS certified organic matcha
            </li>
          </ul>

          <div className="pdp__desc">
            {paragraphs(product.description).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          {['matcha', 'kits'].includes(product.category) && (
            <Details title="How to make it" open>
              <ol className="mini-steps">
                {RITUAL.steps.map((s) => (
                  <li key={s.title}>
                    <span className="mini-steps__icon">
                      <StepIcon name={s.icon} />
                    </span>
                    <span>
                      <b>{s.title}.</b> {s.text}
                    </span>
                  </li>
                ))}
              </ol>
            </Details>
          )}
          <Details title="Shipping & payment">
            <p>Free shipping across India on every order. Orders are dispatched within 24 hours (except Sundays and public holidays) and usually arrive within 3 business days.</p>
            <p>Pay with cash when your order arrives{COD_FEE_PAISE > 0 ? ` (a ${inr(COD_FEE_PAISE)} cash-on-delivery handling fee applies)` : ''}. <Link to="/shipping">Full shipping policy</Link>.</p>
            <p>
              Questions about an order? Write to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> or{' '}
              <a href={WHATSAPP} target="_blank" rel="noopener noreferrer">
                WhatsApp us
              </a>
              .
            </p>
          </Details>
        </div>
      </div>

      {related.length > 0 && (
        <section className="related" aria-labelledby="related-title">
          <h2 id="related-title">You might also like</h2>
          <div className="grid grid--four">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </PageShell>
  );
}
