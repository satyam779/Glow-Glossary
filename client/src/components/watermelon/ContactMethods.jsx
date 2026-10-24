// Adapted from Watermelon UI "contact-5" (MIT, © Watermelon Contributors)
// https://ui.watermelon.sh/block/contact-5
// Ported from Tailwind to plain CSS (watermelon.css); each method can link somewhere.

export default function ContactMethods({ badge, heading, description, methods, footerText }) {
  return (
    <section className="wm-c5">
      <div className="wm-c5__inner">
        <header className="wm-c5__head">
          {badge && <span className="wm-badge wm-badge--lg">{badge}</span>}
          <h2>{heading}</h2>
          {description && <p>{description}</p>}
        </header>

        <div className="wm-c5__grid">
          {methods.map(({ id, icon: Icon, title, description: text, details, href, linkLabel, external }) => (
            <div key={id} className="wm-c5__item">
              <div className="wm-c5__icon">
                <Icon />
              </div>
              <h3>{title}</h3>
              <p className="wm-c5__text">{text}</p>
              <div className="wm-c5__details">{details}</div>
              {href && (
                <a className="wm-c5__link" href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                  {linkLabel}
                </a>
              )}
            </div>
          ))}
        </div>

        {footerText && <p className="wm-c5__foot">{footerText}</p>}
      </div>
    </section>
  );
}
