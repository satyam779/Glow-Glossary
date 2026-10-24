import { useId } from 'react';
import { LEAVES_PATH } from '../brand/logoPath';

// The Glow Glossary disc with its tea-palm cut out (so whatever is behind shows through).
export default function Logo({ className, title }) {
  const maskId = `gg-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`;
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
          <rect width="100" height="100" fill="#fff" />
          <path d={LEAVES_PATH} fill="#000" />
        </mask>
      </defs>
      <circle cx="50" cy="50" r="48" fill="currentColor" mask={`url(#${maskId})`} />
    </svg>
  );
}
