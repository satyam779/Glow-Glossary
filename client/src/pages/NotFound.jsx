import { Link } from 'react-router';
import PageShell from './PageShell';

export default function NotFound() {
  return (
    <PageShell title="Page not found">
      <div className="state state--page">
        <p className="state__kanji" lang="ja" aria-hidden="true">
          迷子
        </p>
        <h1>This page wandered off.</h1>
        <p>
          <em>Maigo</em>: lost child. Let’s get you back to the matcha.
        </p>
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
