import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import Logo from '../components/Logo';
import { api } from '../lib/api';
import { adminApi } from './adminApi';
import { ToastProvider } from './ui';

const LINKS = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/messages', label: 'Messages', badge: 'messages' },
  { to: '/admin/promos', label: 'Promo codes' },
];

export default function AdminLayout() {
  const [me, setMe] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [newMessages, setNewMessages] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.title = 'Admin · Glow Glossary';
    const toLogin = () => navigate(`/admin/login?next=${encodeURIComponent(location.pathname)}`, { replace: true });
    api('/admin/session')
      .then((s) => (s.user ? setMe(s) : toLogin()))
      .catch(toLogin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  // Unread-message count for the sidebar badge (refreshed on navigation and after inbox changes).
  useEffect(() => {
    if (!me) return undefined;
    const refresh = () =>
      adminApi('/messages?status=new')
        .then((d) => setNewMessages(d.messages.length))
        .catch(() => {});
    refresh();
    window.addEventListener('gg:messages-changed', refresh);
    return () => window.removeEventListener('gg:messages-changed', refresh);
  }, [me, location.pathname]);

  const logout = async () => {
    await adminApi('/logout', { method: 'POST' }).catch(() => {});
    navigate('/admin/login', { replace: true });
  };

  if (!me) return <div className="admin admin--boot" aria-busy="true" />;

  return (
    <ToastProvider>
      <div className={`admin ${menuOpen ? 'menu-open' : ''}`}>
        <aside className="a-side">
          <Link to="/admin" className="a-side__brand">
            <Logo />
            <span>
              Glow Glossary
              <small>Admin</small>
            </span>
          </Link>
          <nav className="a-side__nav" aria-label="Admin">
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end}>
                {l.label}
                {l.badge && newMessages > 0 && <span className="a-count">{newMessages}</span>}
              </NavLink>
            ))}
          </nav>
          <div className="a-side__foot">
            <a href="/" target="_blank" rel="noopener noreferrer">
              View store ↗
            </a>
            <p title={me.user.email}>{me.user.email}</p>
            {me.mode === 'local' && <span className="a-mode">Local data mode</span>}
            <button type="button" onClick={logout}>
              Sign out
            </button>
          </div>
        </aside>
        <div className="a-main">
          <div className="a-topbar">
            <button type="button" className="a-burger" onClick={() => setMenuOpen((o) => !o)} aria-expanded={menuOpen} aria-label="Menu">
              <span />
              <span />
            </button>
            <Logo />
            <span>Admin</span>
          </div>
          <Outlet context={me} />
        </div>
        <button type="button" className="a-scrim" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
      </div>
    </ToastProvider>
  );
}
