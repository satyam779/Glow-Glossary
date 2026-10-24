import { Link } from 'react-router';
import { LeafBullet } from '../components/Icons';
import Press from '../components/Press';
import { COMMUNITY, OUR_STORY } from '../content';
import { useReveal } from '../hooks/useScrollEffects';
import PageShell from './PageShell';

export default function OurStoryPage() {
  const { eyebrow, title, accent, lede, founder, story, quote, values, facts, chapters } = OUR_STORY;
  useReveal();

  return (
    <PageShell title="Our story" className="storypage">
      <header className="os-hero reveal-group">
        <div className="os-hero__text">
          <p className="eyebrow reveal">{eyebrow}</p>
          <h1 className="os-hero__title reveal d1">
            {title} <em>{accent}</em>
          </h1>
          <p className="os-hero__lede reveal d2">{lede}</p>
          <ul className="os-facts reveal d3">
            {facts.map((f) => (
              <li key={f.k}>
                <b>{f.k}</b>
                {f.v}
              </li>
            ))}
          </ul>
        </div>
        <figure className="os-hero__photo reveal d1">
          <img src={founder.photo} alt={`${founder.name}, ${founder.role}`} />
          <figcaption>
            <b>{founder.name}</b>
            {founder.role}
          </figcaption>
        </figure>
      </header>

      <section className="os-story reveal-group" aria-label="Founder’s story">
        <div className="os-story__body">
          {story.map((p, i) => (
            <p key={i} className={`reveal d${Math.min(i + 1, 4)}`}>
              {p}
            </p>
          ))}
        </div>
        <ul className="os-values reveal d2" aria-label="What we stand for">
          {values.map((v) => (
            <li key={v}>
              <LeafBullet />
              {v}
            </li>
          ))}
        </ul>
      </section>

      <blockquote className="os-quote reveal-group">
        <p className="reveal">“{quote}”</p>
        <footer className="reveal d1">
          {founder.name}, {founder.role}
        </footer>
      </blockquote>

      <div className="os-chapters">
        {chapters.map((c, i) => (
          <section key={c.num} className={`os-chapter reveal-group ${i % 2 ? 'is-flipped' : ''}`}>
            <figure className="os-chapter__photo reveal">
              <img src={c.photo.src} alt={c.photo.alt} loading="lazy" />
            </figure>
            <div className="os-chapter__text">
              <span className="os-chapter__num reveal">{c.num}</span>
              <h2 className="reveal d1">{c.title}</h2>
              {c.body.map((p, j) => (
                <p key={j} className="reveal d2">
                  {p}
                </p>
              ))}
              {c.list && (
                <ul className="os-list reveal d3">
                  {c.list.map((item) => (
                    <li key={item}>
                      <LeafBullet />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        ))}
      </div>

      <div className="os-press">
        <Press />
      </div>

      <section className="os-partners reveal-group" aria-labelledby="os-partners-title">
        <h2 id="os-partners-title" className="reveal">
          {COMMUNITY.partnersLabel}
        </h2>
        <ul className="reveal d1">
          {COMMUNITY.partners.map((p) => (
            <li key={p.name}>
              <img src={p.src} alt={p.name} loading="lazy" />
            </li>
          ))}
        </ul>
      </section>

      <section className="cta-band reveal-group">
        <h2 className="reveal">Taste the ritual</h2>
        <p className="reveal d1">Ceremonial grade A, stone-ground in Shizuoka. Ready in five minutes.</p>
        <div className="cta-band__actions reveal d2">
          <Link className="btn" to="/shop">
            Shop matcha
          </Link>
          <Link className="btn btn--ghost" to="/rituals">
            How to make it
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
