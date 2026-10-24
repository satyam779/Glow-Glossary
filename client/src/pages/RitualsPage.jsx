import { useState } from 'react';
import { Link } from 'react-router';
import ProductCard from '../components/ProductCard';
import { StepIcon } from '../components/Icons';
import { RITUALS } from '../content';
import { useReveal } from '../hooks/useScrollEffects';
import { useProducts } from '../lib/products';
import PageShell from './PageShell';

export default function RitualsPage() {
  const { eyebrow, title, accent, lede, tools, recipes, tips, faq, kitSlug, shopSlugs } = RITUALS;
  const [recipeId, setRecipeId] = useState(recipes[0].id);
  const recipe = recipes.find((r) => r.id === recipeId);
  const { data: products } = useProducts();
  const shop = shopSlugs.map((s) => products?.find((p) => p.slug === s)).filter(Boolean);
  useReveal([products]);

  return (
    <PageShell title="Rituals" className="ritualspage">
      <header className="rt-hero reveal-group">
        <p className="eyebrow reveal">{eyebrow}</p>
        <h1 className="rt-hero__title reveal d1">
          {title} <em>{accent}</em>
        </h1>
        <p className="rt-hero__lede reveal d2">{lede}</p>
        <nav className="rt-jump reveal d3" aria-label="On this page">
          <a href="#tools">The tools</a>
          <a href="#recipes">Recipes</a>
          <a href="#tips">Tips</a>
          <a href="#faq">FAQ</a>
        </nav>
      </header>

      <section id="tools" className="rt-section reveal-group" aria-labelledby="tools-title">
        <div className="rt-section__head">
          <h2 id="tools-title" className="reveal">
            The tools
          </h2>
          <p className="reveal d1">
            Three traditional pieces, all in our{' '}
            <Link to={`/shop/${kitSlug}`} className="inline-link">
              Matcha Ritual Kit
            </Link>
            .
          </p>
        </div>
        <ul className="rt-tools">
          {tools.map((t, i) => (
            <li key={t.title} className={`rt-tool reveal d${i + 1}`}>
              <h3>{t.title}</h3>
              <p>{t.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section id="recipes" className="rt-section reveal-group" aria-labelledby="recipes-title">
        <div className="rt-section__head">
          <h2 id="recipes-title" className="reveal">
            Recipes
          </h2>
          <div className="rt-tabs reveal d1" role="tablist" aria-label="Choose a recipe">
            {recipes.map((r) => (
              <button
                key={r.id}
                type="button"
                role="tab"
                id={`tab-${r.id}`}
                aria-selected={r.id === recipeId}
                aria-controls={`panel-${r.id}`}
                className={r.id === recipeId ? 'is-active' : ''}
                onClick={() => setRecipeId(r.id)}
              >
                {r.name}
              </button>
            ))}
          </div>
        </div>
        <article className="rt-recipe reveal d2" role="tabpanel" id={`panel-${recipe.id}`} aria-labelledby={`tab-${recipe.id}`}>
          <figure className="rt-recipe__photo">
            <img src={recipe.photo} alt="" />
          </figure>
          <div className="rt-recipe__body">
            <p className="rt-recipe__note">{recipe.note}</p>
            <h3>{recipe.name}</h3>
            <ul className="rt-chips" aria-label="You’ll need">
              {recipe.chips.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
            <ol className="rt-steps">
              {recipe.steps.map((s, i) => (
                <li key={s.title}>
                  <span className="rt-steps__icon">
                    <StepIcon name={s.icon} />
                  </span>
                  <div>
                    <h4>
                      <small>0{i + 1}</small> {s.title}
                    </h4>
                    <p>{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </article>
      </section>

      <section id="tips" className="rt-section reveal-group" aria-labelledby="tips-title">
        <div className="rt-section__head">
          <h2 id="tips-title" className="reveal">
            For a perfect cup
          </h2>
        </div>
        <ul className="rt-tips">
          {tips.map((t, i) => (
            <li key={t.title} className={`reveal d${i + 1}`}>
              <span className="rt-tips__num">0{i + 1}</span>
              <h3>{t.title}</h3>
              <p>{t.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section id="faq" className="rt-section rt-faq reveal-group" aria-labelledby="faq-title">
        <div className="rt-section__head">
          <h2 id="faq-title" className="reveal">
            Questions, answered
          </h2>
          <p className="reveal d1">
            Can’t find yours?{' '}
            <Link to="/contact" className="inline-link">
              Ask us
            </Link>
            .
          </p>
        </div>
        <div className="faq reveal d2">
          {faq.map((item, i) => (
            <details key={item.q} className="faq__item" open={i === 0}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {shop.length > 0 && (
        <section className="rt-section reveal-group" aria-labelledby="shop-title">
          <div className="rt-section__head">
            <h2 id="shop-title" className="reveal">
              Shop the ritual
            </h2>
            <Link to="/shop" className="link reveal d1">
              Shop all
            </Link>
          </div>
          <div className="grid grid--three reveal d2">
            {shop.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </PageShell>
  );
}
