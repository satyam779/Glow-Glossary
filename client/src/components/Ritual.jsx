import { Link } from 'react-router';
import { RITUAL } from '../content';
import { ArrowRight, StepIcon } from './Icons';
import LeafShadow from './LeafShadow';
import TinSlot from './TinSlot';

export default function Ritual() {
  const { num, title, copy, steps } = RITUAL;
  return (
    <section className="ritual" id="ritual" data-theme="light">
      <LeafShadow flip />

      <div className="ritual__text">
        <div className="num reveal">{num}</div>
        <h2 className="title reveal d1">
          {title.map((l) => (
            <span className="line" key={l}>
              {l}
            </span>
          ))}
        </h2>
        <p className="copy reveal d2">{copy}</p>
        <ol className="steps">
          {steps.map((s, i) => (
            <li key={s.title} className={`reveal d${i + 2}`}>
              <span className="steps__icon">
                <StepIcon name={s.icon} />
              </span>
              <div>
                <h3>
                  <small>0{i + 1}</small>
                  {s.title}
                </h3>
                <p>{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="reveal d4">
          <Link className="more-link" to="/rituals">
            More recipes &amp; matcha FAQ <ArrowRight />
          </Link>
        </p>
      </div>

      <div className="ritual__media">
        <figure className="photo ritual__photo reveal d1">
          <img
            src="/images/box-latte.webp"
            alt="The Glow Glossary gift box next to an iced matcha latte and a spoonful of matcha powder"
            loading="lazy"
            data-speed="-0.06"
          />
        </figure>
        <TinSlot yaw={-16} tilt={14} lean={10} />
      </div>
    </section>
  );
}
