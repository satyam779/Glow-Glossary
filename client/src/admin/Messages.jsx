import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { topicLabel } from '../../../shared/constants.js';
import { dateTime } from '../lib/format';
import { adminApi } from './adminApi';
import { Empty, Loading, PageHead, useLoad, useToast } from './ui';

const TABS = [
  { value: '', label: 'Inbox' },
  { value: 'new', label: 'New' },
  { value: 'archived', label: 'Archived' },
];

const whatsappFor = (m) => {
  const digits = m.phone.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
  if (digits.length < 10) return null;
  const number = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${number}?text=${encodeURIComponent(`Hi ${m.name.split(' ')[0]}, this is Glow Glossary replying to your message.`)}`;
};

export default function Messages() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || '';
  const toast = useToast();
  const { data, loading, error, setData } = useLoad(() => adminApi(`/messages${status ? `?status=${status}` : ''}`).then((d) => d.messages), [status]);
  const [openId, setOpenId] = useState(null);

  const update = async (msg, next, note) => {
    try {
      const res = await adminApi(`/messages/${msg.id}`, { method: 'PATCH', body: { status: next } });
      const stillListed = status ? res.message.status === status : res.message.status !== 'archived';
      setData(stillListed ? data.map((m) => (m.id === msg.id ? res.message : m)) : data.filter((m) => m.id !== msg.id));
      if (note) toast(note);
      window.dispatchEvent(new Event('gg:messages-changed'));
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const toggle = (msg) => {
    const opening = openId !== msg.id;
    setOpenId(opening ? msg.id : null);
    if (opening && msg.status === 'new') update(msg, 'read');
  };

  const remove = async (msg) => {
    if (!window.confirm(`Delete the message from ${msg.name}? This can’t be undone.`)) return;
    try {
      await adminApi(`/messages/${msg.id}`, { method: 'DELETE' });
      setData(data.filter((m) => m.id !== msg.id));
      toast('Message deleted');
      window.dispatchEvent(new Event('gg:messages-changed'));
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  return (
    <div className="a-page">
      <PageHead title="Messages" sub="Sent from the Contact page on the store." />

      <div className="a-toolbar">
        <div className="a-tabs" role="tablist" aria-label="Filter messages">
          {TABS.map((t) => (
            <button
              key={t.value || 'inbox'}
              type="button"
              role="tab"
              aria-selected={status === t.value}
              className={status === t.value ? 'is-active' : ''}
              onClick={() => setParams(t.value ? { status: t.value } : {}, { replace: true })}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <Loading />}
      {error && <p className="a-error">{error.message}</p>}
      {data && data.length === 0 && (
        <Empty title={status === 'archived' ? 'Nothing archived' : 'No messages yet'}>
          <p>Messages people send from the Contact page will appear here.</p>
        </Empty>
      )}
      {data && data.length > 0 && (
        <ul className="a-msgs">
          {data.map((m) => {
            const open = openId === m.id;
            const wa = whatsappFor(m);
            return (
              <li key={m.id} className={`a-msg ${m.status === 'new' ? 'is-new' : ''} ${open ? 'is-open' : ''}`}>
                <button type="button" className="a-msg__head" onClick={() => toggle(m)} aria-expanded={open}>
                  <span className="a-msg__dot" aria-label={m.status === 'new' ? 'New' : undefined} />
                  <span className="a-msg__who">
                    <b>{m.name}</b>
                    <small>{m.email}</small>
                  </span>
                  <span className="a-msg__topic">{topicLabel(m.topic)}</span>
                  <span className="a-msg__preview">{m.message}</span>
                  <time className="a-msg__time">{dateTime(m.createdAt)}</time>
                </button>
                {open && (
                  <div className="a-msg__body">
                    <p className="a-msg__text">{m.message}</p>
                    <p className="a-msg__meta">
                      {m.email}
                      {m.phone && <> · {m.phone}</>}
                    </p>
                    <div className="a-msg__actions">
                      <a className="a-btn a-btn--primary" href={`mailto:${m.email}?subject=${encodeURIComponent('Re: your message to Glow Glossary')}`}>
                        Reply by email
                      </a>
                      {wa && (
                        <a className="a-btn" href={wa} target="_blank" rel="noopener noreferrer">
                          WhatsApp
                        </a>
                      )}
                      {m.status !== 'archived' ? (
                        <button type="button" className="a-btn" onClick={() => update(m, 'archived', 'Archived')}>
                          Archive
                        </button>
                      ) : (
                        <button type="button" className="a-btn" onClick={() => update(m, 'read', 'Moved to inbox')}>
                          Move to inbox
                        </button>
                      )}
                      {m.status === 'read' && (
                        <button type="button" className="a-btn" onClick={() => update(m, 'new', 'Marked unread')}>
                          Mark unread
                        </button>
                      )}
                      <button type="button" className="a-btn a-btn--danger" onClick={() => remove(m)}>
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
