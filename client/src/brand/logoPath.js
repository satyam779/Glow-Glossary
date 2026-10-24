// Vector trace of the Glow Glossary mark: a white disc with a tea-palm cut out of it.
// Coordinates live in a 100x100 box (disc centre 50,50, radius 48). The same path
// feeds the React <Logo> (as an SVG mask) and the 3D tin label (as a canvas Path2D).

const HUB = [50.2, 48.7];

// Leaf tips relative to the hub, traced from the lid sticker.
const TIPS = [
  [4.8, -40.0],
  [-18.7, -36.8],
  [-35.2, -19.1],
  [-41.5, 0.4],
  [39.1, -13.3],
  [39.4, 9.9],
  [29.0, 28.0],
  [11.8, 40.0],
];

const f = (n) => +n.toFixed(2);

function leaf([dx, dy], halfWidth = 2.9) {
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const nx = -uy * halfWidth * 1.3;
  const ny = ux * halfWidth * 1.3;
  const [hx, hy] = HUB;
  const at = (t, side) => [hx + ux * len * t + nx * side, hy + uy * len * t + ny * side];
  const tip = [hx + dx, hy + dy];
  const a1 = at(0.22, 1);
  const a2 = at(0.68, 1);
  const b1 = at(0.68, -1);
  const b2 = at(0.22, -1);
  return (
    `M${f(hx)} ${f(hy)}` +
    `C${f(a1[0])} ${f(a1[1])} ${f(a2[0])} ${f(a2[1])} ${f(tip[0])} ${f(tip[1])}` +
    `C${f(b1[0])} ${f(b1[1])} ${f(b2[0])} ${f(b2[1])} ${f(hx)} ${f(hy)}Z`
  );
}

// The trunk: a tapered band along a cubic curve that runs out through the disc's edge.
function stem() {
  const P = [HUB, [44.6, 62], [37.6, 78], [34.6, 101]];
  const bez = (t, i) =>
    (1 - t) ** 3 * P[0][i] + 3 * (1 - t) ** 2 * t * P[1][i] + 3 * (1 - t) * t ** 2 * P[2][i] + t ** 3 * P[3][i];
  const left = [];
  const right = [];
  const steps = 18;
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const x = bez(t, 0);
    const y = bez(t, 1);
    const e = Math.min(1, t + 0.01);
    const b = Math.max(0, t - 0.01);
    const tx = bez(e, 0) - bez(b, 0);
    const ty = bez(e, 1) - bez(b, 1);
    const tl = Math.hypot(tx, ty);
    const w = 1.1 + 2.1 * t;
    left.push([x - (ty / tl) * w, y + (tx / tl) * w]);
    right.push([x + (ty / tl) * w, y - (tx / tl) * w]);
  }
  const pts = [...left, ...right.reverse()];
  return 'M' + pts.map(([x, y]) => `${f(x)} ${f(y)}`).join('L') + 'Z';
}

export const LEAVES_PATH = TIPS.map((t) => leaf(t)).join('') + stem();
