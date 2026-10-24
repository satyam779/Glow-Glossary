import { Link } from 'react-router';
import { CONTACT_EMAIL, FOOTER, SHOP } from '../content';
import { Chevron } from './Icons';
import TinSlot from './TinSlot';

const external = (href) => (href.startsWith('http') && !href.includes('glowglossary.com') ? { target: '_blank', rel: 'noopener noreferrer' } : {});

export default function Footer() {
  const { title, cta, brand, tagline, hours, sign, columns, legal } = FOOTER;
  return (
    <footer>
      <section className="foot" id="contact" data-theme="light">
        <div className="foot__cta">
          <h2 className="title reveal">{title}</h2>
          <Link className="join reveal d1" to={`/shop/${SHOP.featuredSlug}`}>
            <i>
              <Chevron />
            </i>
            {cta}
          </Link>
        </div>

        <TinSlot yaw={0} tilt={14} lean={0} />

        <div className="foot__info">
          <div className="foot__brand reveal">
            <strong>{brand}</strong>
            <span>{tagline}</span>
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            <span>{hours}</span>
          </div>
          <p className="foot__sign reveal d1">
            <b lang="ja">{sign.jp}</b>
            {sign.text}
          </p>
          <nav className="foot__cols reveal d2" aria-label="Footer">
            {columns.map((col, i) => (
              <div key={i}>
                {col.map((l) =>
                  l.href.startsWith('/') ? (
                    <Link key={l.label} to={l.href}>
                      {l.label}
                    </Link>
                  ) : (
                    <a key={l.label} href={l.href} {...external(l.href)}>
                      {l.label}
                    </a>
                  )
                )}
              </div>
            ))}
          </nav>
        </div>

        <div className="foot__giant" aria-hidden="true">
          {brand}
        </div>
        <p className="foot__legal">
          © {new Date().getFullYear()} {legal}
        </p>
      </section>
    </footer>
  );
}
