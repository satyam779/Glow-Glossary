import { Link } from 'react-router';
import { STORY } from '../content';
import { ArrowRight } from './Icons';
import Entry from './Entry';
import TinSlot from './TinSlot';

export default function Story() {
  const { num, entry, title, copy, photo, facts } = STORY;
  return (
    <section className="story" id="story" data-theme="light">
      <figure className="photo story__photo reveal">
        <img src={photo.src} alt={photo.alt} loading="lazy" data-speed="-0.08" />
        <figcaption>{photo.caption}</figcaption>
      </figure>

      <TinSlot yaw={24} tilt={10} lean={7} />

      <div className="story__text">
        <div className="num reveal">{num}</div>
        <Entry {...entry} className="reveal d1" />
        <h2 className="title reveal d1">
          {title.map((l) => (
            <span className="line" key={l}>
              {l}
            </span>
          ))}
        </h2>
        <p className="copy reveal d2">{copy}</p>
        <ul className="facts reveal d3">
          {facts.map((f) => (
            <li key={f.k}>
              <b>{f.k}</b>
              {f.v}
            </li>
          ))}
        </ul>
        <p className="reveal d3">
          <Link className="more-link" to="/our-story">
            Read our story <ArrowRight />
          </Link>
        </p>
      </div>
    </section>
  );
}
