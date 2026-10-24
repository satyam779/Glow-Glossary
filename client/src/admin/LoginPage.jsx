import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import Logo from '../components/Logo';
import { api } from '../lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next');
  const safeNext = next && next.startsWith('/admin') && !next.startsWith('//') ? next : '/admin';

  useEffect(() => {
    document.title = 'Sign in · Glow Glossary admin';
    // Already signed in? Skip the form.
    api('/admin/session')
      .then((s) => s.user && navigate(safeNext, { replace: true }))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api('/admin/login', { method: 'POST', body: { email: email.trim(), password } });
      navigate(safeNext, { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="a-login">
      <form className="a-login__card" onSubmit={submit}>
        <Logo className="a-login__logo" />
        <h1>Admin sign in</h1>
        <p>Manage products, photos, orders and promo codes.</p>
        <label className="a-field">
          <span>Email</span>
          <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </label>
        <label className="a-field">
          <span>Password</span>
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error && (
          <p className="a-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="a-btn a-btn--primary a-btn--block" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <a href="/" className="a-login__back">
          ← Back to the store
        </a>
      </form>
    </div>
  );
}
