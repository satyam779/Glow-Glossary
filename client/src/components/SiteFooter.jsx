import { Link } from 'react-router';
import { CONTACT_EMAIL, FOOTER } from '../content';
import Logo from './Logo';

const external = (href) => href.startsWith('http') && !href.includes('glowglossary.com');

// Compact footer for the shop, product, checkout and order pages.
export default function SiteFooter() {
  const { brand, tagline, hours, columns, legal } = FOOTER;
  return (
    <footer className="sitefoot" id="contact">
      <div className="sitefoot__brand">
        <Link to="/" className="sitefoot__logo" aria-label="Glow Glossary home">
          <Logo />
          <strong>{brand}</strong>
        </Link>
        <p>{tagline}</p>
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        <span>{hours}</span>
      </div>
      <nav className="sitefoot__cols" aria-label="Footer">
        {columns.map((col, i) => (
          <div key={i}>
            {col.map((l) =>
              l.href.startsWith('/') ? (
                <Link key={l.label} to={l.href}>
                  {l.label}
                </Link>
              ) : (
                <a key={l.label} href={l.href} {...(external(l.href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                  {l.label}
                </a>
              )
            )}
          </div>
        ))}
      </nav>
      <p className="sitefoot__legal">
        © {new Date().getFullYear()} {legal}
      </p>
    </footer>
  );
}
