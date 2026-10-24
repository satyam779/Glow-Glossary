import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router';
import { useCart } from '../context/CartContext';
import { inr } from '../lib/format';
import { Close, Bag } from './Icons';
import QuantityStepper from './QuantityStepper';
import { PROMO } from '../content';

export default function CartDrawer() {
  const { items, subtotal, count, open, setOpen, setQuantity, remove } = useCart();
  const panel = useRef(null);
  const lastFocus = useRef(null);
  const location = useLocation();

  // Close when the page changes (e.g. after clicking a product in the cart).
  useEffect(() => setOpen(false), [location.pathname, setOpen]);

  useEffect(() => {
    if (!open) return undefined;
    lastFocus.current = document.activeElement;
    panel.current?.focus();
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.documentElement.classList.add('drawer-open');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.documentElement.classList.remove('drawer-open');
      lastFocus.current?.focus?.();
    };
  }, [open, setOpen]);

  return (
    <div className={`drawer ${open ? 'is-open' : ''}`} aria-hidden={!open}>
      <div className="drawer__scrim" onClick={() => setOpen(false)} />
      <aside
        className="drawer__panel"
        role="dialog"
        aria-modal="true"
        aria-label="Your bag"
        tabIndex={-1}
        ref={panel}
        data-lenis-prevent
      >
        <header className="drawer__head">
          <h2>
            Your bag <span>{count ? `(${count})` : ''}</span>
          </h2>
          <button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label="Close bag">
            <Close />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="drawer__empty">
            <Bag />
            <p>Your bag is empty.</p>
            <Link className="btn" to="/shop" onClick={() => setOpen(false)}>
              Browse the shop
            </Link>
          </div>
        ) : (
          <>
            <ul className="drawer__items">
              {items.map((item) => (
                <li key={item.id} className="cline">
                  <Link to={`/shop/${item.slug}`} className="cline__img">
                    {item.image ? <img src={item.image} alt="" /> : null}
                  </Link>
                  <div className="cline__body">
                    <Link to={`/shop/${item.slug}`} className="cline__name">
                      {item.name}
                    </Link>
                    {item.size && <span className="cline__meta">{item.size}</span>}
                    <div className="cline__row">
                      <QuantityStepper
                        value={item.quantity}
                        onChange={(q) => setQuantity(item.id, q)}
                        label={item.name}
                        small
                      />
                      <button type="button" className="cline__remove" onClick={() => remove(item.id)}>
                        Remove
                      </button>
                    </div>
                  </div>
                  <span className="cline__price">{inr(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <footer className="drawer__foot">
              <div className="drawer__total">
                <span>Subtotal</span>
                <strong>{inr(subtotal)}</strong>
              </div>
              <p className="drawer__note">
                Free shipping across India. {PROMO.text} at checkout.
              </p>
              <Link className="btn btn--block" to="/checkout" onClick={() => setOpen(false)}>
                Checkout
              </Link>
              <button type="button" className="link drawer__continue" onClick={() => setOpen(false)}>
                Continue shopping
              </button>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
