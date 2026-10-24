import { useState } from 'react';
import { adminApi } from './adminApi';
import { Empty, Loading, PageHead, useLoad, useToast } from './ui';

export default function Promos() {
  const toast = useToast();
  const { data, loading, error, setData } = useLoad(() => adminApi('/promos').then((d) => d.promos));
  const [code, setCode] = useState('');
  const [percent, setPercent] = useState('10');
  const [busy, setBusy] = useState(false);

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { promo } = await adminApi('/promos', { method: 'POST', body: { code: code.trim(), percentOff: Number(percent) } });
      setData([...(data || []), promo].sort((a, b) => a.code.localeCompare(b.code)));
      setCode('');
      toast(`${promo.code} created`);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (promo) => {
    try {
      const res = await adminApi(`/promos/${promo.code}`, { method: 'PATCH', body: { active: !promo.active } });
      setData(data.map((p) => (p.code === promo.code ? res.promo : p)));
      toast(`${promo.code} ${res.promo.active ? 'turned on' : 'turned off'}`);
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const remove = async (promo) => {
    if (!window.confirm(`Delete ${promo.code}?`)) return;
    try {
      await adminApi(`/promos/${promo.code}`, { method: 'DELETE' });
      setData(data.filter((p) => p.code !== promo.code));
      toast(`${promo.code} deleted`);
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  return (
    <div className="a-page">
      <PageHead title="Promo codes" sub="Percentage discounts customers can enter at checkout." />

      <form className="a-card a-inline-form" onSubmit={create}>
        <label className="a-field">
          <span>Code</span>
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))} placeholder="DIWALI20" maxLength={30} required minLength={3} />
        </label>
        <label className="a-field a-field--narrow">
          <span>% off</span>
          <input type="number" min="1" max="90" value={percent} onChange={(e) => setPercent(e.target.value)} required />
        </label>
        <button type="submit" className="a-btn a-btn--primary" disabled={busy || code.length < 3}>
          Add code
        </button>
      </form>

      {loading && <Loading />}
      {error && <p className="a-error">{error.message}</p>}
      {data && data.length === 0 && <Empty title="No promo codes yet" />}
      {data && data.length > 0 && (
        <div className="a-card a-card--flush">
          <table className="a-table">
            <thead>
              <tr>
                <th>Code</th>
                <th className="a-num">Discount</th>
                <th>Active</th>
                <th className="a-num" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.code}>
                  <td>
                    <code className="a-code">{p.code}</code>
                  </td>
                  <td className="a-num">{p.percentOff}%</td>
                  <td>
                    <label className="mini-switch">
                      <input type="checkbox" checked={p.active} onChange={() => toggle(p)} aria-label={`${p.code} active`} />
                      <span />
                    </label>
                  </td>
                  <td className="a-num">
                    <button type="button" className="a-linkbtn a-linkbtn--danger" onClick={() => remove(p)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
