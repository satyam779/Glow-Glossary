// A "glossary entry" eyebrow: the Japanese term, its romaji and a short gloss.
export default function Entry({ jp, term, gloss, className = '' }) {
  return (
    <p className={`entry ${className}`}>
      <span className="entry__jp" lang="ja">
        {jp}
      </span>
      <span className="entry__term">{term}</span>
      <span>{gloss}</span>
    </p>
  );
}
