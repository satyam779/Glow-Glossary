import { Link } from 'react-router';
import { CONTACT_EMAIL, SHIPPING_POLICY } from '../content';
import PageShell from './PageShell';

export default function ShippingPage() {
  const { title, intro, sections } = SHIPPING_POLICY;
  return (
    <PageShell title={title} className="policypage">
      <article className="policy">
        <p className="eyebrow">Help</p>
        <h1>{title}</h1>
        <p className="policy__intro">{intro}</p>
        {sections.map((s) => (
          <section key={s.h}>
            <h2>{s.h}</h2>
            {s.p.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </section>
        ))}
        <aside className="policy__help">
          <h2>Need help?</h2>
          <p>
            Write to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> or use our <Link to="/contact">contact page</Link>. We’re always happy to
            help.
          </p>
        </aside>
      </article>
    </PageShell>
  );
}
