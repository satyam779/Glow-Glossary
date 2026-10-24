export function Chevron() {
  return (
    <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M3 1l4 4-4 4" />
    </svg>
  );
}

export function Arrow() {
  return (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M3 9l6-6M4 3h5v5" />
    </svg>
  );
}

export function Star() {
  return (
    <svg viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
      <path d="M6 .8l1.6 3.4 3.7.4-2.8 2.5.8 3.7L6 8.9l-3.3 1.9.8-3.7L.7 4.6l3.7-.4z" />
    </svg>
  );
}

export function LeafBullet() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M2.5 13.5C2.5 7 6.5 2.5 14 2.5c0 7.5-4.5 11-11.5 11z" />
      <path d="M2.5 13.5L9 7" stroke="#fff" strokeWidth="1.1" fill="none" strokeLinecap="round" />
    </svg>
  );
}

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

// Line icons for the ritual steps (scoop, whisk, base, pour), drawn on a 32px grid.
export function StepIcon({ name }) {
  if (name === 'scoop') {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true" {...stroke}>
        <path d="M5 19h22" />
        <path d="M6.5 19c.6 5.2 4.4 8.5 9.5 8.5s8.9-3.3 9.5-8.5" />
        <ellipse cx="12.5" cy="9.2" rx="3.6" ry="2.1" transform="rotate(-28 12.5 9.2)" />
        <path d="M15.6 7.6L26 3" />
        <circle cx="14" cy="14" r=".5" fill="currentColor" />
        <circle cx="17" cy="15.6" r=".5" fill="currentColor" />
        <circle cx="12" cy="16.2" r=".5" fill="currentColor" />
      </svg>
    );
  }
  if (name === 'whisk') {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true" {...stroke}>
        <path d="M16 2.5v8" />
        <path d="M14.2 10.5h3.6" />
        <path d="M16 10.5c-4.5 3-5.6 8.6-3 12.5M16 10.5c4.5 3 5.6 8.6 3 12.5M16 10.5c-1.8 3.6-2 8.4-.6 12.4M16 10.5c1.8 3.6 2 8.4.6 12.4" />
        <path d="M5 23.5c.8 3.4 5 5.5 11 5.5s10.2-2.1 11-5.5" />
      </svg>
    );
  }
  if (name === 'pour') {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true" {...stroke}>
        <path d="M3 8.5l12-3.5c.9 4.2-1.4 8-5.2 9S3.6 12.6 3 8.5z" />
        <path d="M15 6.2c2.6 1.2 3.6 4.4 3.4 9" />
        <path d="M13.5 16.5h10l-1.4 12.5h-7.2z" />
        <path d="M14.1 22h8.8" />
      </svg>
    );
  }
  // base: a glass with ice
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" {...stroke}>
      <path d="M9 9.5h14l-1.8 19H10.8z" />
      <rect x="12" y="15" width="3.6" height="3.6" rx=".8" />
      <rect x="16.4" y="18.5" width="3.6" height="3.6" rx=".8" />
      <path d="M20 3.5c3 0 5 1.2 5.5 3.3" />
      <path d="M25.5 6.8c-1 1.4-2.8 2.4-4.5 2.7" />
    </svg>
  );
}

const line = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' };

export function Bag() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...line}>
      <path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8z" />
      <path d="M9 10V7a3 3 0 0 1 6 0v3" />
    </svg>
  );
}

export function Close() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...line}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function Plus() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...line}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function Minus() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...line}>
      <path d="M5 12h14" />
    </svg>
  );
}

export function Trash() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...line}>
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
    </svg>
  );
}

export function ArrowLeft() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...line}>
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </svg>
  );
}

export function Truck() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...line}>
      <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7" />
      <circle cx="7" cy="17.5" r="1.8" />
      <circle cx="17.5" cy="17.5" r="1.8" />
    </svg>
  );
}

export function Leaf() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...line}>
      <path d="M5 19C5 10 10 5 20 4c0 10-5 15-14 15zM5 19l8-8" />
    </svg>
  );
}

export function Cash() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...line}>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 9.5v5M18 9.5v5" />
    </svg>
  );
}

export function Upload() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...line}>
      <path d="M12 16V4M7 9l5-5 5 5M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

export function Grip() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <circle cx="9" cy="6" r="1.4" />
      <circle cx="15" cy="6" r="1.4" />
      <circle cx="9" cy="12" r="1.4" />
      <circle cx="15" cy="12" r="1.4" />
      <circle cx="9" cy="18" r="1.4" />
      <circle cx="15" cy="18" r="1.4" />
    </svg>
  );
}

// --- solid icons for the contact page (Watermelon UI blocks use react-icons' FontAwesome set) ---
export function Seedling() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 21v-7.2C12 9.6 8.6 6 4.2 6H3v1.2C3 11.4 6.4 15 10.8 15H12M12 13.8c0-4.6 3.6-8.4 8-8.4H21v1.2c0 4.6-3.6 8.4-8 8.4h-1" />
      <rect x="11" y="13" width="2" height="9" rx="1" />
    </svg>
  );
}

export function Mail() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3 6.5A2.5 2.5 0 0 1 5.5 4h13A2.5 2.5 0 0 1 21 6.5v.4l-9 5.6-9-5.6z" />
      <path d="M3 9.3l8.5 5.3a1 1 0 0 0 1 0L21 9.3v8.2a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z" />
    </svg>
  );
}

export function Phone() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6.6 2.9l2.3-.6a1.5 1.5 0 0 1 1.7.8l1.5 3.4a1.5 1.5 0 0 1-.4 1.7l-1.9 1.6a11 11 0 0 0 4.4 4.4l1.6-1.9a1.5 1.5 0 0 1 1.7-.4l3.4 1.5a1.5 1.5 0 0 1 .8 1.7l-.6 2.3a1.5 1.5 0 0 1-1.4 1.1C10.8 18.5 5.5 13.2 5.5 4.3a1.5 1.5 0 0 1 1.1-1.4z" />
    </svg>
  );
}

export function ArrowRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function Chat() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3zm4.4 12.4c-.2.5-1.1 1-1.6 1-.4.1-.9.1-1.5-.1a13 13 0 0 1-1.3-.5 10.4 10.4 0 0 1-4-3.5c-.3-.4-.8-1.2-.8-2.2s.5-1.6.7-1.8c.2-.2.4-.3.6-.3h.4c.1 0 .3 0 .5.4l.7 1.6c.1.1.1.3 0 .4l-.2.4-.3.3c-.1.1-.2.2-.1.4.1.2.6 1 1.3 1.6.9.8 1.6 1 1.8 1.1.2.1.4.1.5-.1l.7-.8c.2-.2.3-.2.5-.1l1.5.7c.2.1.4.2.4.3.1.1.1.6-.1 1.2z" />
    </svg>
  );
}

export function MapPin() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a7 7 0 0 0-7 7c0 5.2 6.1 12.1 6.4 12.4a.8.8 0 0 0 1.2 0C12.9 21.1 19 14.2 19 9a7 7 0 0 0-7-7zm0 9.6A2.6 2.6 0 1 1 12 6.4a2.6 2.6 0 0 1 0 5.2z" />
    </svg>
  );
}

export function Check() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

export function Instagram() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
