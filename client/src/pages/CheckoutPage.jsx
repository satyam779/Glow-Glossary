import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Cash, Truck } from '../components/Icons';
import QuantityStepper from '../components/QuantityStepper';
import { useCart } from '../context/CartContext';
import { api } from '../lib/api';
import { COD_FEE_PAISE } from '../../../shared/constants.js';
import { inr } from '../lib/format';
import { fetchProducts } from '../lib/products';
import PageShell from './PageShell';

const STATES = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir',
  'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

const EMPTY = { name: '', email: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', notes: '' };

function Field({ label, name, form, setForm, errors, optional, wide, ...input }) {
  const id = `co-${name}`;
  return (
    <label className={`field ${wide ? 'field--wide' : ''} ${errors[name] ? 'has-error' : ''}`} htmlFor={id}>
      <span>
        {label}
        {optional && <em> (optional)</em>}
      </span>
      <input
        id={id}
        name={name}
        value={form[name]}
        onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
        required={!optional}
        aria-invalid={Boolean(errors[name])}
        aria-describedby={errors[name] ? `${id}-err` : undefined}
        {...input}
      />
      {errors[name] && (
        <small id={`${id}-err`} className="field__error">
          {errors[name]}
        </small>
      )}
    </label>
  );
}

export default function CheckoutPage() {
  const { items, setQuantity, replace, clear } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [problem, setProblem] = useState('');
  const [notice, setNotice] = useState('');
  const [promoInput, setPromoInput] = useState('');
  const [promo, setPromo] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [busy, setBusy] = useState(false);

  // Re-price the cart against the live catalogue and drop anything that's gone.
  useEffect(() => {
    let alive = true;
    fetchProducts()
      .then((products) => {
        if (!alive) return;
        const byId = new Map(products.map((p) => [p.id, p]));
        let dropped = 0;
        const next = items
          .filter((i) => {
            const p = byId.get(i.id);
            if (!p || p.soldOut) dropped++;
            return p && !p.soldOut;
          })
          .map((i) => {
            const p = byId.get(i.id);
            return { ...i, name: p.name, price: p.price, slug: p.slug, size: p.size, image: p.images[0]?.url || i.image };
          });
        if (JSON.stringify(next) !== JSON.stringify(items)) replace(next);
        if (dropped) setNotice(`${dropped} item${dropped > 1 ? 's are' : ' is'} no longer available and ${dropped > 1 ? 'were' : 'was'} removed from your bag.`);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subtotal = items.reduce((n, i) => n + i.price * i.quantity, 0);
  // Same rule as the server: rounded down to whole rupees.
  const discount = promo ? Math.floor((subtotal * promo.percentOff) / 10000) * 100 : 0;
  const total = subtotal - discount + COD_FEE_PAISE;

  const applyPromo = async (e) => {
    e.preventDefault();
    setPromoError('');
    if (!promoInput.trim()) return;
    try {
      const { promo: p } = await api('/promo/validate', { method: 'POST', body: { code: promoInput.trim() } });
      setPromo(p);
      setPromoInput('');
    } catch (err) {
      setPromo(null);
      setPromoError(err.message);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setProblem('');
    setErrors({});
    setBusy(true);
    try {
      const { order } = await api('/orders', {
        method: 'POST',
        body: {
          customer: { ...form, email: form.email.trim() },
          items: items.map((i) => ({ productId: i.id, quantity: i.quantity })),
          promoCode: promo?.code || '',
        },
      });
      clear();
      navigate(`/order/${order.id}?token=${order.token}`, { replace: true });
    } catch (err) {
      const match = /^customer\.(\w+): (.*)$/.exec(err.message);
      if (match) {
        setErrors({ [match[1]]: match[2].charAt(0).toUpperCase() + match[2].slice(1) });
        document.getElementById(`co-${match[1]}`)?.focus();
      } else {
        setProblem(err.message);
      }
    } finally {
      setBusy(false);
    }
  };

  if (!items.length) {
    return (
      <PageShell title="Checkout" className="checkoutpage">
        <div className="state state--page">
          <h1>Your bag is empty.</h1>
          {notice && <p>{notice}</p>}
          <Link className="btn" to="/shop">
            Browse the shop
          </Link>
        </div>
      </PageShell>
    );
  }

  const fieldProps = { form, setForm, errors };

  return (
    <PageShell title="Checkout" className="checkoutpage">
      <h1 className="checkout__title">Checkout</h1>
      {notice && <p className="banner-note">{notice}</p>}

      <form className="checkout" onSubmit={submit} noValidate={false}>
        <div className="checkout__form">
          <fieldset>
            <legend>Contact</legend>
            <div className="fields">
              <Field label="Full name" name="name" autoComplete="name" maxLength={80} wide {...fieldProps} />
              <Field label="Email" name="email" type="email" autoComplete="email" maxLength={120} {...fieldProps} />
              <Field
                label="Mobile number"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="10-digit mobile"
                maxLength={16}
                {...fieldProps}
              />
            </div>
          </fieldset>

          <fieldset>
            <legend>Delivery address</legend>
            <div className="fields">
              <Field label="Address" name="line1" autoComplete="address-line1" maxLength={160} wide placeholder="House no., street, area" {...fieldProps} />
              <Field label="Apartment, landmark" name="line2" autoComplete="address-line2" maxLength={160} wide optional {...fieldProps} />
              <Field label="City" name="city" autoComplete="address-level2" maxLength={60} {...fieldProps} />
              <label className={`field ${errors.state ? 'has-error' : ''}`} htmlFor="co-state">
                <span>State</span>
                <select
                  id="co-state"
                  value={form.state}
                  onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                  required
                  autoComplete="address-level1"
                >
                  <option value="" disabled>
                    Choose…
                  </option>
                  {STATES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                {errors.state && <small className="field__error">{errors.state}</small>}
              </label>
              <Field
                label="PIN code"
                name="pincode"
                inputMode="numeric"
                autoComplete="postal-code"
                pattern="[1-9][0-9]{5}"
                maxLength={6}
                {...fieldProps}
              />
            </div>
          </fieldset>

          <fieldset>
            <legend>Payment</legend>
            <label className="pay-option is-selected">
              <input type="radio" name="payment" checked readOnly />
              <Cash />
              <span>
                <b>Cash on delivery</b>
                <small>Pay when your order arrives.{COD_FEE_PAISE > 0 && ` A ${inr(COD_FEE_PAISE)} handling fee applies.`}</small>
              </span>
            </label>
          </fieldset>

          <label className="field field--wide" htmlFor="co-notes">
            <span>
              Order notes <em>(optional)</em>
            </span>
            <textarea
              id="co-notes"
              rows={3}
              maxLength={500}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Delivery instructions, a gift message…"
            />
          </label>
        </div>

        <aside className="summary" aria-label="Order summary">
          <h2>Order summary</h2>
          <ul className="summary__items">
            {items.map((i) => (
              <li key={i.id} className="cline">
                <Link to={`/shop/${i.slug}`} className="cline__img">
                  {i.image && <img src={i.image} alt="" />}
                </Link>
                <div className="cline__body">
                  <span className="cline__name">{i.name}</span>
                  {i.size && <span className="cline__meta">{i.size}</span>}
                  <QuantityStepper value={i.quantity} onChange={(q) => setQuantity(i.id, q)} label={i.name} small />
                </div>
                <span className="cline__price">{inr(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>

          <div className="promo">
            {promo ? (
              <p className="promo__applied">
                <span>
                  <b>{promo.code}</b> applied · {promo.percentOff}% off
                </span>
                <button type="button" className="link" onClick={() => setPromo(null)}>
                  Remove
                </button>
              </p>
            ) : (
              <div className="promo__form">
                <input
                  aria-label="Promo code"
                  placeholder="Promo code"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && applyPromo(e)}
                  maxLength={30}
                />
                <button type="button" className="btn btn--ghost" onClick={applyPromo}>
                  Apply
                </button>
              </div>
            )}
            {promoError && <small className="field__error">{promoError}</small>}
          </div>

          <dl className="totals">
            <div>
              <dt>Subtotal</dt>
              <dd>{inr(subtotal)}</dd>
            </div>
            {discount > 0 && (
              <div className="totals__discount">
                <dt>Discount</dt>
                <dd>−{inr(discount)}</dd>
              </div>
            )}
            <div>
              <dt>Shipping</dt>
              <dd>Free</dd>
            </div>
            {COD_FEE_PAISE > 0 && (
              <div>
                <dt>Cash on delivery fee</dt>
                <dd>{inr(COD_FEE_PAISE)}</dd>
              </div>
            )}
            <div className="totals__grand">
              <dt>Total</dt>
              <dd>{inr(total)}</dd>
            </div>
          </dl>

          {problem && (
            <p className="form-error" role="alert">
              {problem}
            </p>
          )}
          <button type="submit" className="btn btn--block" disabled={busy}>
            {busy ? 'Placing your order…' : `Place order · ${inr(total)}`}
          </button>
          <p className="summary__note">
            <Truck /> Free shipping across India. Dispatched within 24 hours.
          </p>
        </aside>
      </form>
    </PageShell>
  );
}
