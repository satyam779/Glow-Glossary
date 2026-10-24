import { Link } from 'react-router';
import { HERO, SHOP } from '../content';
import { Chevron } from './Icons';
import LeafShadow from './LeafShadow';
import TinSlot from './TinSlot';

export default function Hero() {
  const { lines, accent, blurb, cta } = HERO;
  return (
    <section className="hero" id="top" data-theme="light">
      <div className="hero__bokeh" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      <LeafShadow />

      <h1 data-speed="0.5" aria-label={`${lines[0]} ${lines[1]} ${accent}`}>
        <span className="line" aria-hidden="true">
          <span>{lines[0]}</span>
        </span>
        <span className="line" aria-hidden="true">
          <span>
            {lines[1]} <em>{accent}</em>
          </span>
        </span>
      </h1>

      <TinSlot className="tin-slot--hero" yaw={-22} tilt={16} lean={-9} powder={1} fallback="/images/tin-powder.webp" />

      <div className="hero__side">
        <p>{blurb}</p>
        <Link className="join" to={`/shop/${SHOP.featuredSlug}`}>
          <i>
            <Chevron />
          </i>
          {cta}
        </Link>
      </div>
    </section>
  );
}
