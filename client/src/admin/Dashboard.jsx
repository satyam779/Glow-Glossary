import { Link, useNavigate, useOutletContext } from 'react-router';
import { dateTime, inr } from '../lib/format';
import { adminApi } from './adminApi';
import { Empty, Loading, PageHead, StatusBadge, useLoad } from './ui';

export default function Dashboard() {
  const me = useOutletContext();
  const navigate = useNavigate();
  const { data, loading, error } = useLoad(() => adminApi('/stats'));

  return (
    <div className="a-page">
      <PageHead title="Dashboard" sub={`Signed in as ${me.user.email}`}>
        <Link to="/admin/products/new" className="a-btn a-btn--primary">
          + Add product
        </Link>
      </PageHead>

      {me.mode === 'local' && (
        <div className="a-callout">
          <b>Local data mode.</b> Products, photos and orders are saved on this computer (the <code>data/</code> folder). Add your
          Supabase keys to <code>.env</code> to store them in Supabase instead.
        </div>
      )}

      {loading && <Loading />}
      {error && <p className="a-error">{error.message}</p>}
      {data && (
        <>
          <div className="a-stats">
            <div className="a-stat">
              <span>Revenue</span>
              <strong>{inr(data.revenue)}</strong>
              <small>excluding cancelled orders</small>
            </div>
            <div className="a-stat">
              <span>Orders</span>
              <strong>{data.orders}</strong>
              <small>all time</small>
            </div>
            <Link className="a-stat a-stat--link" to="/admin/orders?status=pending">
              <span>Waiting to confirm</span>
              <strong>{data.pending}</strong>
              <small>pending orders →</small>
            </Link>
            <Link className="a-stat a-stat--link" to="/admin/messages?status=new">
              <span>New messages</span>
              <strong>{data.newMessages ?? 0}</strong>
              <small>from the contact page →</small>
            </Link>
            <Link className="a-stat a-stat--link" to="/admin/products">
              <span>Live products</span>
              <strong>{data.products}</strong>
              <small>of {data.totalProducts} total →</small>
            </Link>
          </div>

          <section className="a-card">
            <header className="a-card__head">
              <h2>Recent orders</h2>
              <Link to="/admin/orders">View all</Link>
            </header>
            {data.recent.length === 0 ? (
              <Empty title="No orders yet">
                <p>Orders placed on the store will show up here.</p>
              </Empty>
            ) : (
              <table className="a-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th className="hide-sm">Placed</th>
                    <th>Status</th>
                    <th className="a-num">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent.map((o) => (
                    <tr key={o.id} className="is-clickable" onClick={() => navigate(`/admin/orders/${o.id}`)}>
                      <td>
                        <Link to={`/admin/orders/${o.id}`} onClick={(e) => e.stopPropagation()}>
                          #{o.number}
                        </Link>
                      </td>
                      <td>{o.customer.name}</td>
                      <td className="hide-sm">{dateTime(o.createdAt)}</td>
                      <td>
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="a-num">{inr(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </div>
  );
}
