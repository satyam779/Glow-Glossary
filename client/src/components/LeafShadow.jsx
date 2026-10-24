// Soft, swaying shadow of a tea branch, like sun through a shade net (komorebi).
// Built once as a single path: a curved stem with lens-shaped leaves along it.

function branchPath() {
  const stem = (t) => {
    // quadratic curve from top-right to bottom-left
    const p0 = [590, -10];
    const p1 = [330, 160];
    const p2 = [70, 600];
    const x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t ** 2 * p2[0];
    const y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t ** 2 * p2[1];
    const dx = 2 * (1 - t) * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]);
    const dy = 2 * (1 - t) * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
    return [x, y, Math.atan2(dy, dx)];
  };

  let d = '';
  // stem as a thin band
  const left = [];
  const right = [];
  for (let i = 0; i <= 20; i++) {
    const [x, y, a] = stem(i / 20);
    const w = 3 + (i / 20) * 3;
    left.push(`${(x + Math.sin(a) * w).toFixed(1)} ${(y - Math.cos(a) * w).toFixed(1)}`);
    right.push(`${(x - Math.sin(a) * w).toFixed(1)} ${(y + Math.cos(a) * w).toFixed(1)}`);
  }
  d += `M${left.join('L')}L${right.reverse().join('L')}Z`;

  for (let i = 0; i < 9; i++) {
    const t = 0.08 + i * 0.105;
    const [x, y, a] = stem(t);
    const side = i % 2 ? 1 : -1;
    const ang = a + side * (0.85 + (i % 3) * 0.12);
    const len = 120 + ((i * 37) % 60);
    const w = len * 0.22;
    const tx = x + Math.cos(ang) * len;
    const ty = y + Math.sin(ang) * len;
    const nx = -Math.sin(ang) * w;
    const ny = Math.cos(ang) * w;
    const m1 = [x + Math.cos(ang) * len * 0.3, y + Math.sin(ang) * len * 0.3];
    const m2 = [x + Math.cos(ang) * len * 0.75, y + Math.sin(ang) * len * 0.75];
    d +=
      `M${x.toFixed(1)} ${y.toFixed(1)}` +
      `C${(m1[0] + nx).toFixed(1)} ${(m1[1] + ny).toFixed(1)} ${(m2[0] + nx).toFixed(1)} ${(m2[1] + ny).toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)}` +
      `C${(m2[0] - nx).toFixed(1)} ${(m2[1] - ny).toFixed(1)} ${(m1[0] - nx).toFixed(1)} ${(m1[1] - ny).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}Z`;
  }
  return d;
}

const BRANCH = branchPath();

export default function LeafShadow({ className = '', flip = false }) {
  return (
    <svg
      className={`leaf-shadow ${className}`}
      viewBox="0 0 600 600"
      aria-hidden="true"
      style={flip ? { scale: '-1 1' } : undefined}
    >
      <path d={BRANCH} fill="currentColor" />
    </svg>
  );
}
