import { Link } from 'react-router';
import { useCart } from '../context/CartContext';
import { inr, savingsPercent } from '../lib/format';
import { Plus } from './Icons';

export default function ProductCard({ product }) {
  const { add, setOpen } = useCart();
  const [first, second] = product.images;
  const off = savingsPercent(product.price, product.compareAt);

  const quickAdd = (e) => {
    e.preventDefault();
    add(product, 1);
    setOpen(true);
  };

  return (
    <article className={`pcard ${second ? 'has-alt' : ''}`}>
      <Link to={`/shop/${product.slug}`} className="pcard__link">
        <div className="pcard__media">
          {first ? <img className="pcard__img" src={first.url} alt={first.alt || product.name} loading="lazy" /> : <div className="pcard__ph" />}
          {second && <img className="pcard__img pcard__img--alt" src={second.url} alt="" loading="lazy" />}
          <div className="pcard__badges">
            {product.soldOut ? <span className="tag tag--dark">Sold out</span> : off ? <span className="tag tag--sale">−{off}%</span> : null}
            {product.badges.slice(0, 1).map((b) => (
              <span className="tag" key={b}>
                {b}
              </span>
            ))}
          </div>
        </div>
        <div className="pcard__body">
          <h3 className="pcard__name">{product.name}</h3>
          {product.tagline && <p className="pcard__tag">{product.tagline}</p>}
          <p className="pcard__price">
            <strong>{inr(product.price)}</strong>
            {off > 0 && <s>{inr(product.compareAt)}</s>}
            {product.size && <span>{product.size}</span>}
          </p>
        </div>
      </Link>
      {!product.soldOut && (
        <div className="pcard__overlay">
          <button type="button" className="pcard__add" onClick={quickAdd} aria-label={`Add ${product.name} to bag`}>
            <Plus />
            <span>Add</span>
          </button>
        </div>
      )}
    </article>
  );
}
