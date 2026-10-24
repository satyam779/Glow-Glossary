import { CRAFT } from '../content';
import TinSlot from './TinSlot';

export default function Craft() {
  const { num, title, copy, points, photo } = CRAFT;
  return (
    <section className="craft" id="craft" data-theme="dark">
      <div className="craft__text">
        <div className="num reveal">{num}</div>
        <h2 className="title reveal d1">
          {title.map((l) => (
            <span className="line" key={l}>
              {l}
            </span>
          ))}
        </h2>
        <p className="copy reveal d2">{copy}</p>
        <dl className="points reveal d3">
          {points.map((p) => (
            <div key={p.k}>
              <dt>{p.k}</dt>
              <dd>{p.v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <TinSlot yaw={-28} tilt={20} lean={-6} lid={1} />

      <figure className="photo craft__photo reveal d2">
        <img src={photo.src} alt={photo.alt} loading="lazy" data-speed="-0.08" />
        <figcaption>{photo.caption}</figcaption>
      </figure>
    </section>
  );
}
