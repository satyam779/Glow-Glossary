import * as THREE from 'three';
import { LEAVES_PATH } from '../brand/logoPath';

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

// Small seeded PRNG so the generated artwork looks the same on every load.
export function rng(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function spacing(ctx, px) {
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${px}px`;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// The brand disc with the palm knocked out, drawn at (x, y) with the given diameter.
function drawLogo(ctx, x, y, size, color = '#fff') {
  const c = makeCanvas(size, size);
  const g = c.getContext('2d');
  g.scale(size / 100, size / 100);
  g.fillStyle = color;
  g.beginPath();
  g.arc(50, 50, 48, 0, Math.PI * 2);
  g.fill();
  g.globalCompositeOperation = 'destination-out';
  g.fill(new Path2D(LEAVES_PATH));
  ctx.drawImage(c, x, y);
}

function stepIcon(ctx, kind, cx, cy) {
  ctx.save();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  if (kind === 0) {
    // spoon over a bowl
    ctx.moveTo(cx - 30, cy + 4);
    ctx.lineTo(cx + 30, cy + 4);
    ctx.moveTo(cx - 27, cy + 4);
    ctx.bezierCurveTo(cx - 25, cy + 30, cx + 25, cy + 30, cx + 27, cy + 4);
    ctx.moveTo(cx + 2, cy - 30);
    ctx.lineTo(cx + 34, cy - 50);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx - 8, cy - 25, 11, 6, -0.55, 0, Math.PI * 2);
  } else if (kind === 1) {
    // whisk in a bowl
    ctx.moveTo(cx, cy - 56);
    ctx.lineTo(cx, cy - 30);
    for (const dx of [-14, -6, 6, 14]) {
      ctx.moveTo(cx, cy - 30);
      ctx.quadraticCurveTo(cx + dx * 1.3, cy - 14, cx + dx * 0.6, cy + 4);
    }
    ctx.moveTo(cx - 32, cy + 2);
    ctx.bezierCurveTo(cx - 28, cy + 30, cx + 28, cy + 30, cx + 32, cy + 2);
  } else {
    // pouring into a glass
    ctx.moveTo(cx - 20, cy - 28);
    ctx.lineTo(cx + 20, cy - 28);
    ctx.lineTo(cx + 15, cy + 28);
    ctx.lineTo(cx - 15, cy + 28);
    ctx.closePath();
    ctx.moveTo(cx + 12, cy - 56);
    ctx.lineTo(cx + 40, cy - 46);
    ctx.moveTo(cx + 12, cy - 56);
    ctx.quadraticCurveTo(cx + 4, cy - 46, cx + 4, cy - 34);
  }
  ctx.stroke();
  ctx.restore();
}

// Wrap-around label: sky-to-field motion blur, the front panel from the real tin,
// brewing steps on the right, a short description on the left and the importer on the back.
export function makeLabelTexture(renderer, origin = 'Kagoshima') {
  const W = 4096;
  const H = 700;
  const c = makeCanvas(W, H);
  const ctx = c.getContext('2d');
  const r = rng(11);

  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#d6edf6');
  g.addColorStop(0.18, '#acd7ec');
  g.addColorStop(0.38, '#7fc2da');
  g.addColorStop(0.5, '#5daf9f');
  g.addColorStop(0.62, '#3f9d5f');
  g.addColorStop(0.8, '#2c8846');
  g.addColorStop(1, '#1d6a34');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Horizontal streaks, drawn three times so they wrap across the seam, then blurred in one pass.
  const streaks = makeCanvas(W, H);
  const sctx = streaks.getContext('2d');
  for (let i = 0; i < 280; i++) {
    const y = r() * H;
    const len = 300 + r() * 1800;
    const x = r() * W;
    const th = 2 + r() * 13;
    const sky = y < H * 0.46;
    const col = sky ? (r() < 0.6 ? '255,255,255' : '150,205,232') : r() < 0.5 ? '150,220,150' : '10,78,38';
    sctx.fillStyle = `rgba(${col},${(sky ? 0.08 : 0.1) + r() * 0.18})`;
    for (const off of [0, -W, W]) {
      sctx.beginPath();
      sctx.ellipse(x + off, y, len / 2, th / 2, 0, 0, Math.PI * 2);
      sctx.fill();
    }
  }
  ctx.save();
  ctx.filter = 'blur(5px)';
  ctx.drawImage(streaks, 0, 0);
  ctx.restore();

  const haze = ctx.createLinearGradient(0, H * 0.3, 0, H * 0.64);
  haze.addColorStop(0, 'rgba(255,255,255,0)');
  haze.addColorStop(0.5, 'rgba(236,250,244,0.3)');
  haze.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, H * 0.3, W, H * 0.34);

  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'alphabetic';
  ctx.shadowColor = 'rgba(0, 40, 20, 0.22)';
  ctx.shadowBlur = 14;

  // Front panel (u = 0.5 faces the viewer)
  const cx = W / 2;
  const x0 = cx - 480;
  drawLogo(ctx, x0, 62, 132);
  ctx.font = '700 64px Poppins';
  spacing(ctx, -1);
  ctx.fillText('GLOW', x0 + 152, 122);
  ctx.fillText('GLOSSARY', x0 + 152, 186);
  ctx.font = '600 232px Poppins';
  spacing(ctx, -3);
  ctx.fillText('MATCHA', x0 - 10, 438);
  ctx.font = '500 31px Poppins';
  spacing(ctx, 1.5);
  ctx.fillText(`MASTERCRAFT SINGLE CULTIVAR FROM ${origin.toUpperCase()}`, x0, 498);
  ctx.fillText('RICH · NUTTY · NON BITTER · FULL BODIED', x0, 542);
  ctx.font = '500 27px Poppins';
  spacing(ctx, 1);
  const pill = 'NET WT. 30 GMS';
  const pw = ctx.measureText(pill).width + 46;
  ctx.shadowBlur = 0;
  roundRect(ctx, x0, 582, pw, 52, 26);
  ctx.lineWidth = 2.6;
  ctx.strokeStyle = '#fff';
  ctx.stroke();
  ctx.fillText(pill, x0 + 23, 618);
  ctx.shadowBlur = 10;

  // Right panel: how to prepare
  const x1 = cx + 640;
  const steps = [
    ['SCOOP 2 G OF MATCHA', 'INTO A BOWL'],
    ['ADD 30 ML WARM', 'WATER AND WHISK'],
    ['POUR OVER ICE AND', 'MILK. STIR WELL.'],
  ];
  ctx.font = '500 25px Poppins';
  spacing(ctx, 1);
  steps.forEach((lines, i) => {
    const y = 175 + i * 175;
    stepIcon(ctx, i, x1, y);
    ctx.fillText(lines[0], x1 + 66, y - 6);
    ctx.fillText(lines[1], x1 + 66, y + 28);
  });

  // Left panel: description
  const x2 = cx - 1010;
  ctx.font = '400 25px Poppins';
  spacing(ctx, 0.5);
  [
    'Pure shade-grown green tea',
    'leaves, slowly stone-ground',
    'into a fine, vivid powder.',
    '',
    'Store in a cool, dry place,',
    'away from direct sunlight.',
  ].forEach((line, i) => ctx.fillText(line, x2, 260 + i * 40));

  // Back panel, centred on the seam (drawn at both ends so it joins up)
  ctx.textAlign = 'center';
  ctx.font = '500 24px Poppins';
  spacing(ctx, 2);
  for (const bx of [0, W]) {
    drawLogo(ctx, bx - 45, 170, 90);
    ctx.fillText('IMPORTED & PACKED BY', bx, 330);
    ctx.font = '600 30px Poppins';
    ctx.fillText('GLOW GLOSSARY PVT. LTD.', bx, 375);
    ctx.font = '500 24px Poppins';
    ctx.fillText('CONTACT@GLOWGLOSSARY.IN', bx, 425);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return tex;
}

// The tin's embossed damask: a tiling height field of small swirls, turned into a normal map.
export function makeEmbossNormalMap() {
  const S = 1024;
  const c = makeCanvas(S, S);
  const ctx = c.getContext('2d');
  const r = rng(3);
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, S, S);
  ctx.lineCap = 'round';
  for (let i = 0; i < 2400; i++) {
    const x = r() * S;
    const y = r() * S;
    const rad = 5 + r() * 17;
    const a0 = r() * Math.PI * 2;
    const sweep = 1.2 + r() * 3;
    const v = r() < 0.55 ? 170 + r() * 60 : 45 + r() * 45;
    ctx.strokeStyle = `rgba(${v},${v},${v},0.6)`;
    ctx.lineWidth = 1.3 + r() * 1.8;
    for (const ox of [0, -S, S]) {
      for (const oy of [0, -S, S]) {
        ctx.beginPath();
        ctx.arc(x + ox, y + oy, rad, a0, a0 + sweep);
        ctx.stroke();
      }
    }
  }

  const b = makeCanvas(S, S);
  const bctx = b.getContext('2d');
  bctx.filter = 'blur(1.2px)';
  bctx.drawImage(c, 0, 0);
  bctx.filter = 'none';
  const src = bctx.getImageData(0, 0, S, S).data;
  const out = bctx.createImageData(S, S);
  const o = out.data;
  const h = (x, y) => src[((((y + S) % S) * S + ((x + S) % S)) << 2)] / 255;
  const k = 2.2;
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const dx = (h(x + 1, y) - h(x - 1, y)) * k;
      const dy = (h(x, y + 1) - h(x, y - 1)) * k;
      const len = Math.sqrt(dx * dx + dy * dy + 1);
      const i = (y * S + x) << 2;
      o[i] = (-dx / len) * 127.5 + 127.5;
      o[i + 1] = (dy / len) * 127.5 + 127.5;
      o[i + 2] = (1 / len) * 127.5 + 127.5;
      o[i + 3] = 255;
    }
  }
  bctx.putImageData(out, 0, 0);
  const tex = new THREE.CanvasTexture(b);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

// Neutral speckle (values around 0.75–1.0) that multiplies the powder heap's colour,
// giving it a fine granular surface.
export function makeGrainTexture() {
  const S = 512;
  const c = makeCanvas(S, S);
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(S, S);
  const d = img.data;
  const r = rng(17);
  for (let i = 0; i < S * S; i++) {
    const p = r();
    let v = 0.74 + r() * 0.26;
    if (p < 0.04) v = 0.56;
    else if (p > 0.97) v = 1;
    const g = v * 255;
    d[i * 4] = g;
    d[i * 4 + 1] = g;
    d[i * 4 + 2] = g;
    d[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

// Mottled green surface of the powder inside the tin.
export function makePowderTexture() {
  const S = 256;
  const c = makeCanvas(S, S);
  const ctx = c.getContext('2d');
  const r = rng(5);
  ctx.fillStyle = '#7f9e33';
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 5000; i++) {
    const l = r();
    ctx.fillStyle = l < 0.5 ? `rgba(70,100,25,${0.25 + r() * 0.3})` : `rgba(175,205,90,${0.2 + r() * 0.3})`;
    const s = 1 + r() * 2.5;
    ctx.fillRect(r() * S, r() * S, s, s);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// A tea leaf: glossy green with a pale midrib and curved side veins.
export function makeLeafTexture() {
  const W = 256;
  const H = 512;
  const c = makeCanvas(W, H);
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, H, 0, 0);
  g.addColorStop(0, '#4c7a1e');
  g.addColorStop(0.6, '#6f9e2e');
  g.addColorStop(1, '#8cb63f');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const edge = ctx.createLinearGradient(0, 0, W, 0);
  edge.addColorStop(0, 'rgba(30,60,10,0.45)');
  edge.addColorStop(0.5, 'rgba(30,60,10,0)');
  edge.addColorStop(1, 'rgba(30,60,10,0.45)');
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(214,236,160,0.75)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(W / 2, H);
  ctx.lineTo(W / 2, 0);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(214,236,160,0.4)';
  for (let i = 1; i < 10; i++) {
    const y = H - i * (H / 10.5);
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(W / 2, y);
      ctx.quadraticCurveTo(W / 2 + side * W * 0.22, y - 30, W / 2 + side * W * 0.46, y - 70);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
