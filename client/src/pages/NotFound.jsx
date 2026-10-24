import { Link } from 'react-router';
import PageShell from './PageShell';

export default function NotFound() {
  return (
    <PageShell title="Page not found">
      <div className="state state--page">
        <h1>Page not found</h1>
        <p>The page you’re looking for doesn’t exist or has moved.</p>
        <div className="receipt__actions">
          <Link className="btn" to="/shop">
            Visit the shop
          </Link>
          <Link className="btn btn--ghost" to="/">
            Home
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
