import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

// --- toasts --------------------------------------------------------------------
const ToastContext = createContext(() => {});
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const id = useRef(0);
  const push = useCallback((message, tone = 'ok') => {
    const key = ++id.current;
    setToasts((t) => [...t, { key, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.key !== key)), 3800);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.key} className={`toast toast--${t.tone}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// --- small pieces ------------------------------------------------------------------
export function StatusBadge({ status }) {
  return <span className={`status status--${status}`}>{status}</span>;
}

export function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle__track" aria-hidden="true" />
      <span className="toggle__text">
        {label}
        {hint && <small>{hint}</small>}
      </span>
    </label>
  );
}

export function PageHead({ title, sub, children }) {
  return (
    <header className="a-head">
      <div>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {children && <div className="a-head__actions">{children}</div>}
    </header>
  );
}

export function Empty({ title, children }) {
  return (
    <div className="a-empty">
      <p className="a-empty__title">{title}</p>
      {children}
    </div>
  );
}

export function Loading() {
  return <div className="a-loading" aria-busy="true" aria-label="Loading" />;
}

// Load data on mount (and when deps change), with a reload function.
export function useLoad(load, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const run = useCallback(() => {
    setState((s) => ({ ...s, loading: true }));
    return load()
      .then((data) => setState({ data, error: null, loading: false }))
      .catch((error) => setState({ data: null, error, loading: false }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => {
    run();
  }, [run]);
  return { ...state, reload: run, setData: (data) => setState((s) => ({ ...s, data })) };
}
