// Adapted from Watermelon UI "contact-4" (MIT, © Watermelon Contributors)
// https://ui.watermelon.sh/block/contact-4
// Ported from Tailwind + shadcn/ui to plain CSS (watermelon.css) and wired to our /api/contact.
import { useState } from 'react';
import { CONTACT_TOPICS } from '../../../../shared/constants.js';
import { api } from '../../lib/api';
import { ArrowRight, Check, Mail, Phone, Seedling } from '../Icons';

const EMPTY = { name: '', email: '', phone: '', topic: '', message: '', website: '' };

// Mirrors the server's contactCreate schema so every problem shows at once, before a round trip.
function validate(form) {
  const errors = {};
  if (form.name.trim().length < 2) errors.name = 'Please enter your name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = 'Enter a valid email address.';
  const phone = form.phone.replace(/[\s()-]/g, '');
  if (phone && !/^\+?\d{7,15}$/.test(phone)) errors.phone = 'Enter a valid phone number, or leave it empty.';
  if (!form.topic) errors.topic = 'Choose what your message is about.';
  if (form.message.trim().length < 10) errors.message = 'Please write a little more (10+ characters).';
  return errors;
}

export default function ContactForm({ badge, headline, headlineAccent, subheadline, contactInfo, ctaLabel, initialTopic = '' }) {
  const [form, setForm] = useState({ ...EMPTY, topic: CONTACT_TOPICS.some((t) => t.value === initialTopic) ? initialTopic : '' });
  const [errors, setErrors] = useState({});
  const [problem, setProblem] = useState('');
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState('');

  const change = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors((x) => ({ ...x, [field]: '' }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setProblem('');
    setErrors({});
    const found = validate(form);
    const first = Object.keys(EMPTY).find((k) => found[k]);
    if (first) {
      setErrors(found);
      document.getElementById(`wm-${first}`)?.focus();
      return;
    }
    setBusy(true);
    try {
      await api('/contact', { method: 'POST', body: { ...form, email: form.email.trim() } });
      setSentTo(form.name.trim().split(' ')[0]);
      setForm({ ...EMPTY });
    } catch (err) {
      const match = /^(\w+): (.*)$/.exec(err.message);
      if (match) {
        setErrors({ [match[1]]: match[2].charAt(0).toUpperCase() + match[2].slice(1) });
        document.getElementById(`wm-${match[1]}`)?.focus();
      } else {
        setProblem(err.message);
      }
    } finally {
      setBusy(false);
    }
  };

  const fieldError = (name) =>
    errors[name] && (
      <small className="wm-error" id={`wm-${name}-err`}>
        {errors[name]}
      </small>
    );
  const described = (name) => (errors[name] ? { 'aria-invalid': true, 'aria-describedby': `wm-${name}-err` } : {});

  return (
    <section className="wm-c4">
      <div className="wm-c4__grid">
        <div className="wm-c4__intro">
          {badge && (
            <span className="wm-badge">
              <Seedling />
              {badge}
            </span>
          )}

          <h1 className="wm-c4__title">
            {headline} <span>{headlineAccent}</span>
          </h1>

          <p className="wm-c4__sub">{subheadline}</p>

          <hr className="wm-c4__rule" />

          <div className="wm-c4__chips">
            <a className="wm-chip" href={contactInfo.emailHref}>
              <span className="wm-chip__icon">
                <Mail />
              </span>
              <span>
                <small>Email</small>
                <strong>{contactInfo.email}</strong>
              </span>
            </a>
            <a className="wm-chip" href={contactInfo.phoneHref} target="_blank" rel="noopener noreferrer">
              <span className="wm-chip__icon">
                <Phone />
              </span>
              <span>
                <small>Phone &amp; WhatsApp</small>
                <strong>{contactInfo.phone}</strong>
              </span>
            </a>
          </div>
        </div>

        <div className="wm-card" aria-live="polite">
          {sentTo ? (
            <div className="wm-sent">
              <span className="wm-sent__icon">
                <Check />
              </span>
              <h2>Thank you{sentTo ? `, ${sentTo}` : ''}!</h2>
              <p>Your message is with the Glow Glossary team. We’ll reply to your email soon.</p>
              <button type="button" className="wm-button wm-button--ghost" onClick={() => setSentTo('')}>
                Send another message
              </button>
            </div>
          ) : (
            <form className="wm-card__form" onSubmit={submit} noValidate>
              <div className="wm-field">
                <label htmlFor="wm-name">Full name</label>
                <input id="wm-name" className="wm-input" placeholder="Your name" autoComplete="name" maxLength={80} value={form.name} onChange={change('name')} required {...described('name')} />
                {fieldError('name')}
              </div>

              <div className="wm-row">
                <div className="wm-field">
                  <label htmlFor="wm-email">Email</label>
                  <input id="wm-email" className="wm-input" type="email" placeholder="you@example.com" autoComplete="email" maxLength={120} value={form.email} onChange={change('email')} required {...described('email')} />
                  {fieldError('email')}
                </div>
                <div className="wm-field">
                  <label htmlFor="wm-phone">
                    Phone <em>(optional)</em>
                  </label>
                  <input id="wm-phone" className="wm-input" type="tel" inputMode="tel" placeholder="+91" autoComplete="tel" maxLength={20} value={form.phone} onChange={change('phone')} {...described('phone')} />
                  {fieldError('phone')}
                </div>
              </div>

              <div className="wm-field">
                <label htmlFor="wm-topic">Area of interest</label>
                <select id="wm-topic" className={`wm-input wm-select ${form.topic ? '' : 'is-empty'}`} value={form.topic} onChange={change('topic')} required {...described('topic')}>
                  <option value="" disabled>
                    Choose a topic…
                  </option>
                  {CONTACT_TOPICS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                {fieldError('topic')}
              </div>

              <div className="wm-field">
                <label htmlFor="wm-message">Message</label>
                <textarea id="wm-message" className="wm-input wm-textarea" rows={4} placeholder="Tell us how we can help…" maxLength={3000} value={form.message} onChange={change('message')} required {...described('message')} />
                {fieldError('message')}
              </div>

              {/* Honeypot: hidden from people; bots that fill it in are quietly ignored. */}
              <div className="wm-hp" aria-hidden="true">
                <label htmlFor="wm-website">Website</label>
                <input id="wm-website" tabIndex={-1} autoComplete="off" value={form.website} onChange={change('website')} />
              </div>

              {problem && (
                <p className="wm-problem" role="alert">
                  {problem}
                </p>
              )}

              <button type="submit" className="wm-button" disabled={busy}>
                {busy ? 'Sending…' : ctaLabel}
                {!busy && <ArrowRight />}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
