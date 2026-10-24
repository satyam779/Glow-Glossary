import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { ORDER_STATUSES } from '../../../shared/constants.js';
import { dateTime, inr } from '../lib/format';
import { adminApi } from './adminApi';
import { Loading, PageHead, StatusBadge, useLoad, useToast } from './ui';

const NEXT_STEP = { pending: 'confirmed', confirmed: 'shipped', shipped: 'delivered' };

export default function OrderDetail() {
  const { id } = useParams();
  const toast = useToast();
  const { data: order, loading, error, setData } = useLoad(() => adminApi(`/orders/${id}`).then((d) => d.order), [id]);
  const [busy, setBusy] = useState(false);

  const setStatus = async (status) => {
    if (status === 'cancelled' && !window.confirm('Cancel this order? Stock isn’t returned automatically.')) return;
    setBusy(true);
    try {
      const res = await adminApi(`/orders/${id}`, { method: 'PATCH', body: { status } });
      setData(res.order);
      toast(`Order marked ${status}`);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="a-page"><Loading /></div>;
  if (error) {
    return (
      <div className="a-page">
        <p className="a-error">{error.message}</p>
        <Link to="/admin/orders">← Back to orders</Link>
      </div>
    );
  }

  const c = order.customer;
  const phoneDigits = c.phone.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
  const whatsapp = `https://wa.me/91${phoneDigits}?text=${encodeURIComponent(`Hi ${c.name.split(' ')[0]}, this is Glow Glossary about your order #${order.number}.`)}`;
  const next = NEXT_STEP[order.status];

  return (
    <div className="a-page">
      <PageHead title={`Order #${order.number}`} sub={<Link to="/admin/orders">← All orders</Link>}>
        <StatusBadge status={order.status} />
      </PageHead>

      <div className="a-editor__grid">
        <div className="a-editor__main">
          <section className="a-card">
            <h2 className="a-card__title">Items</h2>
            <ul className="a-lines">
              {order.items.map((i, idx) => (
                <li key={idx}>
                  <span className="a-thumb">{i.image && <img src={i.image} alt="" />}</span>
                  <span className="a-lines__name">
                    {i.productId ? (
                      <Link to={`/admin/products/${i.productId}`}>{i.name}</Link>
                    ) : (
                      i.name
                    )}
                    <small>
                      {i.quantity} × {inr(i.unitPrice)}
                    </small>
                  </span>
                  <span className="a-num">{inr(i.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <dl className="a-totals">
              <div>
                <dt>Subtotal</dt>
                <dd>{inr(order.subtotal)}</dd>
              </div>
              {order.discount > 0 && (
                <div>
                  <dt>Discount {order.promoCode && `(${order.promoCode})`}</dt>
                  <dd>−{inr(order.discount)}</dd>
                </div>
              )}
              <div>
                <dt>Shipping</dt>
                <dd>{order.shipping ? inr(order.shipping) : 'Free'}</dd>
              </div>
              {order.codFee > 0 && (
                <div>
                  <dt>COD fee</dt>
                  <dd>{inr(order.codFee)}</dd>
                </div>
              )}
              <div className="a-totals__grand">
                <dt>Total · cash on delivery</dt>
                <dd>{inr(order.total)}</dd>
              </div>
            </dl>
          </section>

          {c.notes && (
            <section className="a-card">
              <h2 className="a-card__title">Customer note</h2>
              <p className="a-note">{c.notes}</p>
            </section>
          )}
        </div>

        <div className="a-editor__side">
          <section className="a-card">
            <h2 className="a-card__title">Status</h2>
            {next && (
              <button type="button" className="a-btn a-btn--primary a-btn--block" disabled={busy} onClick={() => setStatus(next)}>
                Mark as {next}
              </button>
            )}
            <label className="a-field">
              <span>Set status</span>
              <select value={order.status} disabled={busy} onChange={(e) => setStatus(e.target.value)}>
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <p className="a-hint">
              Placed {dateTime(order.createdAt)}
              {order.updatedAt !== order.createdAt && <> · updated {dateTime(order.updatedAt)}</>}
            </p>
          </section>

          <section className="a-card">
            <h2 className="a-card__title">Customer</h2>
            <p className="a-contact">
              <b>{c.name}</b>
              <a href={`mailto:${c.email}?subject=${encodeURIComponent(`Your Glow Glossary order #${order.number}`)}`}>{c.email}</a>
              <a href={`tel:${c.phone}`}>{c.phone}</a>
            </p>
            <a className="a-btn a-btn--block" href={whatsapp} target="_blank" rel="noopener noreferrer">
              WhatsApp customer
            </a>
          </section>

          <section className="a-card">
            <h2 className="a-card__title">Ship to</h2>
            <address className="a-address">
              {c.name}
              <br />
              {c.line1}
              {c.line2 && (
                <>
                  <br />
                  {c.line2}
                </>
              )}
              <br />
              {c.city}, {c.state} {c.pincode}
            </address>
            <button
              type="button"
              className="a-btn a-btn--block"
              onClick={() =>
                navigator.clipboard
                  ?.writeText([c.name, c.line1, c.line2, `${c.city}, ${c.state} ${c.pincode}`, c.phone].filter(Boolean).join('\n'))
                  .then(() => toast('Address copied'))
              }
            >
              Copy address
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
