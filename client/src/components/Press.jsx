import { PRESS } from '../content';

// "As seen on Shark Tank India, and in…": the press logos drifting past in one quiet row.
export default function Press() {
  const { headline, label, logos } = PRESS;
  return (
    <section className="press" aria-label="Press" data-theme="light">
      <p className="press__headline">{headline}</p>
      <p className="press__label">{label}</p>
      <ul className="sr-only">
        {logos.map((l) => (
          <li key={l.name}>{l.name}</li>
        ))}
      </ul>
      <div className="press__row" aria-hidden="true">
        <div className="press__track">
          {[0, 1].map((copy) => (
            <span className="press__group" key={copy}>
              {logos.map((l) => (
                <img key={l.name} src={l.src} alt="" loading="lazy" />
              ))}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
