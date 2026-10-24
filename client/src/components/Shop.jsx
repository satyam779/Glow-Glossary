import { Link } from 'react-router';
import { PROMO, SHOP, WHATSAPP } from '../content';
import { useCart } from '../context/CartContext';
import { inr, savingsPercent } from '../lib/format';
import { useProducts } from '../lib/products';
import { Arrow, Chevron, LeafBullet, Star } from './Icons';
import TinSlot from './TinSlot';

// Home-page shop section: the featured tin (with the 3D tin beside it), the banner and the range,
// all priced from the live catalogue.
export default function Shop() {
  const { num, title, featuredSlug, featuredPoints, rating, cta, secondary, banner, rangeTitle, all } = SHOP;
  const { data: products } = useProducts();
  const { add, setOpen } = useCart();
  const featured = products?.find((p) => p.slug === featuredSlug) || products?.find((p) => p.isFeatured) || products?.[0];
  const range = (products || []).filter((p) => p.id !== featured?.id);
  const [promoBefore, promoAfter] = PROMO.text.split(PROMO.code);

  const buy = () => {
    if (!featured) return;
    add(featured, 1);
    setOpen(true);
  };

  return (
    <section className="shop" id="shop" data-theme="light">
      <div className="shop__top">
        <div className="shop__text">
          <div className="num reveal">{num}</div>
          <h2 className="title reveal d1">
            {title.map((l) => (
              <span className="line" key={l}>
                {l}
              </span>
            ))}
          </h2>

          <article className="card reveal d2" aria-label={featured?.name || 'Featured product'} aria-busy={!featured}>
            <div className="card__head">
              <div>
                <h3>
                  {featured ? <Link to={`/shop/${featured.slug}`}>{featured.name}</Link> : <span className="skeleton skeleton--text" />}
                </h3>
                <span className="card__size">{featured?.size}</span>
              </div>
              <div className="card__price">
                {featured ? inr(featured.price) : ''}
                <span className="card__rating">
                  <Star /> {rating.score} · {rating.count} reviews
                </span>
              </div>
            </div>
            <ul>
              {featuredPoints.map((f) => (
                <li key={f}>
                  <LeafBullet />
                  {f}
                </li>
              ))}
            </ul>
            <div className="card__gallery">
              {(featured?.images || []).slice(0, 3).map((g) => (
                <Link className="photo" key={g.id} to={`/shop/${featured.slug}`}>
                  <img src={g.url} alt={g.alt || featured.name} loading="lazy" />
                </Link>
              ))}
            </div>
            <div className="card__actions">
              <button type="button" className="btn" onClick={buy} disabled={!featured || featured.soldOut}>
                {featured?.soldOut ? 'Sold out' : cta}
                <Chevron />
              </button>
              <a className="link" href={WHATSAPP} target="_blank" rel="noopener noreferrer">
                {secondary}
              </a>
            </div>
            <p className="card__promo">
              {promoBefore}
              <span>{PROMO.code}</span>
              {promoAfter}
            </p>
          </article>
        </div>

        <div className="shop__stage">
          <div className="shop__halo" aria-hidden="true" />
          <div className="shop__pedestal" aria-hidden="true" />
          <TinSlot yaw={14} tilt={12} lean={0} fallback="/images/tin-powder.webp" />
        </div>
      </div>

      <Link className="banner reveal" to={banner.to}>
        <picture>
          <source media="(max-width: 760px)" srcSet={banner.tall} />
          <img src={banner.wide} alt={banner.alt} loading="lazy" />
        </picture>
      </Link>

      <div className="range" id="range">
        <div className="range__head">
          <h3 className="range__title reveal">{rangeTitle}</h3>
          <Link className="link reveal" to={all.to}>
            {all.label}
          </Link>
        </div>
        <ul className="range__rail">
          {range.map((p, i) => {
            const off = savingsPercent(p.price, p.compareAt);
            return (
              <li key={p.id} className={`reveal d${Math.min(4, i + 1)}`}>
                <Link className="product" to={`/shop/${p.slug}`}>
                  <span className="product__img">{p.images[0] && <img src={p.images[0].url} alt={p.name} loading="lazy" />}</span>
                  <span className="product__body">
                    <span className="product__name">{p.name}</span>
                    <span className="product__note">{p.tagline}</span>
                    <span className="product__price">
                      {off > 0 && <s>{inr(p.compareAt)}</s>}
                      {inr(p.price)}
                      <Arrow />
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
