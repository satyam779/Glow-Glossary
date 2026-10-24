import { useEffect } from 'react';
import { Link } from 'react-router';
import { ArrowRight } from '../components/Icons';
import PageShell from './PageShell';

const LINKS = [
  { to: '/shop', label: 'Shop matcha', note: 'Ceremonial grade, free shipping' },
  { to: '/rituals', label: 'Rituals', note: 'Recipes and FAQ' },
  { to: '/our-story', label: 'Our story', note: 'How Glow Glossary began' },
  { to: '/contact', label: 'Contact', note: 'We reply Mon–Fri' },
];

export default function NotFound() {
  // Keep missing pages out of search results.
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  return (
    <PageShell title="Page not found" className="nfpage">
      <section className="nf">
        <p className="nf__code" aria-hidden="true">
          404
        </p>
        <h1>This page doesn’t exist</h1>
        <p className="nf__text">It may have moved, or the link may be mistyped. Let’s get you back to the matcha.</p>
        <div className="nf__actions">
          <Link className="btn" to="/shop">
            Visit the shop
          </Link>
          <Link className="btn btn--ghost" to="/">
            Back to home
          </Link>
        </div>
        <ul className="nf__links">
          {LINKS.map((l) => (
            <li key={l.to}>
              <Link to={l.to}>
                <span>
                  <b>{l.label}</b>
                  <small>{l.note}</small>
                </span>
                <ArrowRight />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  );
}
