import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import Logo from '../components/Logo';
import { CONTACT_EMAIL, whatsappLink } from '../content';
import { api } from '../lib/api';
import { dateTime, inr } from '../lib/format';
import PageShell from './PageShell';

const STATUS_COPY = {
  pending: 'Received: we’ll confirm it shortly.',
  confirmed: 'Confirmed and being packed.',
  shipped: 'On its way to you.',
  delivered: 'Delivered. Enjoy your matcha!',
  cancelled: 'This order was cancelled.',
};

export default function OrderPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [state, setState] = useState({ order: null, error: null });

  useEffect(() => {
    const ctrl = new AbortController();
    api(`/orders/${encodeURIComponent(id)}?token=${encodeURIComponent(token)}`, { signal: ctrl.signal })
      .then(({ order }) => setState({ order, error: null }))
      .catch((error) => error.name !== 'AbortError' && setState({ order: null, error }));
    return () => ctrl.abort();
  }, [id, token]);

  const { order, error } = state;

  if (error) {
    return (
      <PageShell title="Order" className="orderpage">
        <div className="state state--page">
          <h1>We couldn’t find that order.</h1>
          <p>Use the link from your confirmation, or write to {CONTACT_EMAIL}.</p>
          <Link className="btn" to="/shop">
            Back to the shop
          </Link>
        </div>
      </PageShell>
    );
  }

  if (!order) {
    return (
      <PageShell title="Order" className="orderpage">
        <div className="state state--page" aria-busy="true">
          <Logo className="spin-logo" />
        </div>
      </PageShell>
    );
  }

  const whatsapp = whatsappLink(`Hi Glow Glossary, about my order #${order.number}`);

  return (
    <PageShell title={`Order #${order.number}`} className="orderpage">
      <div className="receipt">
        <header className="receipt__head">
          <Logo className="receipt__logo" />
          <p className="receipt__eyebrow">Order #{order.number}</p>
          <h1>Thank you, {order.customer.name.split(' ')[0]}!</h1>
          <p className="receipt__status">
            <span className={`status status--${order.status}`}>{order.status}</span> {STATUS_COPY[order.status]}
          </p>
          <p className="receipt__date">Placed {dateTime(order.createdAt)} · Cash on delivery</p>
        </header>

        <ul className="receipt__items">
          {order.items.map((i, idx) => (
            <li key={idx} className="cline">
              <span className="cline__img">{i.image && <img src={i.image} alt="" />}</span>
              <div className="cline__body">
                <span className="cline__name">{i.name}</span>
                <span className="cline__meta">
                  {i.quantity} × {inr(i.unitPrice)}
                </span>
              </div>
              <span className="cline__price">{inr(i.lineTotal)}</span>
            </li>
          ))}
        </ul>

        <dl className="totals">
          <div>
            <dt>Subtotal</dt>
            <dd>{inr(order.subtotal)}</dd>
          </div>
          {order.discount > 0 && (
            <div className="totals__discount">
              <dt>Discount {order.promoCode ? `(${order.promoCode})` : ''}</dt>
              <dd>−{inr(order.discount)}</dd>
            </div>
          )}
          <div>
            <dt>Shipping</dt>
            <dd>{order.shipping ? inr(order.shipping) : 'Free'}</dd>
          </div>
          {order.codFee > 0 && (
            <div>
              <dt>Cash on delivery fee</dt>
              <dd>{inr(order.codFee)}</dd>
            </div>
          )}
          <div className="totals__grand">
            <dt>To pay on delivery</dt>
            <dd>{inr(order.total)}</dd>
          </div>
        </dl>

        <p className="receipt__help">
          Save this page to check your order later. Questions? Write to{' '}
          <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Order #${order.number}`)}`}>{CONTACT_EMAIL}</a>.
        </p>
        <div className="receipt__actions">
          <a className="btn" href={whatsapp} target="_blank" rel="noopener noreferrer">
            WhatsApp us about this order
          </a>
          <Link className="btn btn--ghost" to="/shop">
            Keep shopping
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
