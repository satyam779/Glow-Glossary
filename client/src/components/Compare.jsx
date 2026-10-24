import { COMPARE } from '../content';
import TinSlot from './TinSlot';

const Tick = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Cross = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

// GG Matcha vs the rest, with the tin standing in the middle as the GG side.
export default function Compare() {
  const { eyebrow, title, ours, theirs, rows } = COMPARE;
  return (
    <section className="compare" id="compare" data-theme="light">
      <header className="compare__head">
        <p className="compare__eyebrow reveal">{eyebrow}</p>
        <h2 className="title reveal d1">{title}</h2>
      </header>

      <div className="compare__grid">
        <div className="compare__col compare__col--ours reveal d1">
          <h3>{ours}</h3>
          <ul>
            {rows.map(([good]) => (
              <li key={good}>
                <Tick />
                {good}
              </li>
            ))}
          </ul>
        </div>

        <TinSlot yaw={0} tilt={12} lean={0} />

        <div className="compare__col compare__col--theirs reveal d2">
          <h3>{theirs}</h3>
          <ul>
            {rows.map(([, bad]) => (
              <li key={bad}>
                <Cross />
                {bad}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
