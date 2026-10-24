import { COMMUNITY } from '../content';
import { Star } from './Icons';

// Reviews from the store drifting past in two rows, photos from the community,
// and the cafes that pour GG Matcha.
export default function Community() {
  const { title, summary, quotes, photos, partnersLabel, partners } = COMMUNITY;
  const rows = [quotes.slice(0, 4), quotes.slice(4)];
  return (
    <section className="community" id="community" aria-labelledby="community-title" data-theme="light">
      <div className="community__head">
        <h2 className="title reveal" id="community-title">
          {title}
        </h2>
        <p className="community__summary reveal d1">
          <span className="community__stars" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} />
            ))}
          </span>
          {summary}
        </p>
      </div>

      <ul className="sr-only">
        {quotes.map((q) => (
          <li key={q.name}>
            “{q.text}” {q.name}
          </li>
        ))}
      </ul>
      {rows.map((row, r) => (
        <div className={`marquee ${r ? 'marquee--rev' : ''}`} key={r} aria-hidden="true">
          <div className="marquee__track">
            {[...row, ...row, ...row].map((q, i) => (
              <figure className="quote" key={i}>
                <blockquote>“{q.text}”</blockquote>
                <figcaption>{q.name}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      ))}

      <div className="community__photos">
        {photos.map((p, i) => (
          <figure className={`photo reveal d${i + 1} ${p.wide ? 'is-wide' : ''}`} key={p.src}>
            <img src={p.src} alt={p.alt} loading="lazy" data-speed={i % 2 ? '-0.04' : '-0.07'} />
          </figure>
        ))}
      </div>

      <div className="partners" id="partners">
        <p className="partners__label reveal">{partnersLabel}</p>
        <ul className="partners__list reveal d1">
          {partners.map((p) => (
            <li key={p.name}>
              <img src={p.src} alt={p.name} loading="lazy" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
