import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import Logo from './Logo';
import { Bag, Instagram, Mail } from './Icons';
import { CONTACT_EMAIL, INSTAGRAM, NAV, WHATSAPP } from '../content';
import { useCart } from '../context/CartContext';

export function Loader({ done }) {
  return (
    <div className={`loader ${done ? 'done' : ''}`} aria-hidden={done}>
      <div className="loader__inner">
        <Logo className="loader__mark" />
        <span className="loader__word">GLOW GLOSSARY</span>
        <span className="loader__bar" />
      </div>
    </div>
  );
}

// Full-screen page menu for phones (the inline links are hidden under 760px).
function MobileMenu({ open, onClose }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.documentElement.classList.add('drawer-open');
    return () => {
      window.removeEventListener('keydown', onKey);
      document.documentElement.classList.remove('drawer-open');
    };
  }, [open, onClose]);

  return (
    <div id="mobile-menu" className={`mnav ${open ? 'is-open' : ''}`} data-lenis-prevent>
      <ul className="mnav__links">
        {NAV.links.map((l, i) => (
          <li key={l.to} style={{ '--i': i }}>
            <NavLink to={l.to} onClick={onClose}>
              {l.label}
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="mnav__foot">
        <a href={WHATSAPP} target="_blank" rel="noopener noreferrer">
          WhatsApp us
        </a>
        <a href={`mailto:${CONTACT_EMAIL}`}>
          <Mail /> {CONTACT_EMAIL}
        </a>
        <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer">
          <Instagram /> @Glow_Glossary
        </a>
      </div>
    </div>
  );
}

export function Nav() {
  const { count, setOpen } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  useEffect(() => closeMenu(), [pathname, closeMenu]);

  return (
    <>
      <MobileMenu open={menuOpen} onClose={closeMenu} />
      <nav className={`nav ${menuOpen ? 'is-menu-open' : ''}`} aria-label="Main">
        <Link className="brandmark" to="/" aria-label="Glow Glossary home">
          <Logo />
          <span className="brandmark__word" aria-hidden="true">
            GLOW
            <br />
            GLOSSARY
          </span>
        </Link>
        <div className="nav__links">
          {NAV.links.map((l) =>
            l.to.includes('#') ? (
              <Link key={l.to} to={l.to}>
                {l.label}
              </Link>
            ) : (
              <NavLink key={l.to} to={l.to} end={false}>
                {l.label}
              </NavLink>
            )
          )}
        </div>
        <Link className="nav__shop" to="/shop">
          Shop
        </Link>
        <button
          type="button"
          className="nav__cart"
          onClick={() => {
            closeMenu();
            setOpen(true);
          }}
          aria-label={`Open cart, ${count} item${count === 1 ? '' : 's'}`}
        >
          <Bag />
          <span className="nav__cart-label">Bag</span>
          <span className={`nav__count ${count ? 'has-items' : ''}`}>{count}</span>
        </button>
        <button
          type="button"
          className="nav__burger"
          onClick={() => setMenuOpen((o) => !o)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          <span />
          <span />
        </button>
      </nav>
    </>
  );
}
