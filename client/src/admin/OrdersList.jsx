import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { ORDER_STATUSES } from '../../../shared/constants.js';
import { dateTime, inr } from '../lib/format';
import { adminApi } from './adminApi';
import { Empty, Loading, PageHead, StatusBadge, useLoad } from './ui';

export default function OrdersList() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || '';
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { data, loading, error } = useLoad(() => adminApi(`/orders${status ? `?status=${status}` : ''}`).then((d) => d.orders), [status]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data || [];
    return (data || []).filter(
      (o) =>
        String(o.number).includes(q) ||
        o.customer.name.toLowerCase().includes(q) ||
        o.customer.email.toLowerCase().includes(q) ||
        o.customer.phone.includes(q)
    );
  }, [data, query]);

  return (
    <div className="a-page">
      <PageHead title="Orders" sub={data ? `${data.length} order${data.length === 1 ? '' : 's'}${status ? ` · ${status}` : ''}` : ''} />

      <div className="a-toolbar">
        <div className="a-tabs" role="tablist" aria-label="Filter by status">
          {['', ...ORDER_STATUSES].map((s) => (
            <button
              key={s || 'all'}
              type="button"
              role="tab"
              aria-selected={status === s}
              className={status === s ? 'is-active' : ''}
              onClick={() => setParams(s ? { status: s } : {}, { replace: true })}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
        <input
          className="a-search"
          type="search"
          placeholder="Order #, name, email or phone"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search orders"
        />
      </div>

      {loading && <Loading />}
      {error && <p className="a-error">{error.message}</p>}
      {data && shown.length === 0 && (
        <Empty title={query || status ? 'No matching orders' : 'No orders yet'}>
          <p>New orders from the store will appear here.</p>
        </Empty>
      )}
      {shown.length > 0 && (
        <div className="a-card a-card--flush">
          <table className="a-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th className="hide-sm">Items</th>
                <th className="hide-sm">Placed</th>
                <th>Status</th>
                <th className="a-num">Total</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((o) => (
                <tr key={o.id} className="is-clickable" onClick={() => navigate(`/admin/orders/${o.id}`)}>
                  <td>
                    <Link to={`/admin/orders/${o.id}`} onClick={(e) => e.stopPropagation()}>
                      #{o.number}
                    </Link>
                  </td>
                  <td>
                    {o.customer.name}
                    <small className="a-sub">{o.customer.city}</small>
                  </td>
                  <td className="hide-sm">{o.items.reduce((n, i) => n + i.quantity, 0)}</td>
                  <td className="hide-sm">{dateTime(o.createdAt)}</td>
                  <td>
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="a-num">{inr(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
