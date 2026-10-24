import * as THREE from 'three';
import { makeGrainTexture, rng } from './textures';

const smooth01 = (t) => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};
const mix = (a, b, t) => a + (b - a) * t;

// Seeded 2D gradient noise (roughly -0.7…0.7), used to make the heap lumpy and ragged.
function makeNoise(r) {
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  const perm = new Uint8Array(512).map((_, i) => p[i & 255]);
  const gx = new Float32Array(256).map((_, i) => Math.cos((i / 256) * Math.PI * 2));
  const gy = new Float32Array(256).map((_, i) => Math.sin((i / 256) * Math.PI * 2));
  const grad = (h, x, y) => gx[h] * x + gy[h] * y;
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  return (x, y) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const X = xi & 255;
    const Y = yi & 255;
    const u = fade(xf);
    const v = fade(yf);
    const x1 = mix(grad(perm[X + perm[Y]], xf, yf), grad(perm[X + 1 + perm[Y]], xf - 1, yf), u);
    const x2 = mix(grad(perm[X + perm[Y + 1]], xf, yf - 1), grad(perm[X + 1 + perm[Y + 1]], xf - 1, yf - 1), u);
    return mix(x1, x2, v);
  };
}

// Fine, crisp granule. Tiny points read as powder; soft blobs read as smoke.
const GRAIN_FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec2 d = gl_PointCoord - 0.5;
    float r = length(d);
    if (r > 0.5) discard;
    float a = vAlpha * smoothstep(0.5, 0.36, r);
    if (a < 0.01) discard;
    gl_FragColor = vec4(vColor * (1.06 - r * 0.4), a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const PUFF_FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec2 d = gl_PointCoord - 0.5;
    float a = vAlpha * exp(-dot(d, d) * 20.0);
    if (a < 0.004) discard;
    gl_FragColor = vec4(vColor, a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const MOUND_VERT = /* glsl */ `
  attribute vec3 aColor;
  attribute vec4 aRand;
  uniform float uTime;
  uniform float uScatter;
  uniform float uPuff;
  uniform float uSize;
  uniform float uScale;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    float s = clamp(uScatter * (0.7 + aRand.x * 0.7), 0.0, 1.0);
    float ang = s * (0.6 + aRand.y * 1.2);
    float c = cos(ang), sn = sin(ang);
    p.xz = mat2(c, -sn, sn, c) * p.xz;
    vec2 dir = normalize(p.xz + vec2(0.0001, 0.0));
    vec2 spread = dir * vec2(1.0, 0.35); // drift sideways and up, not toward the camera
    p.xz += spread * s * (0.4 + aRand.z * 1.2);
    p.y += s * (0.25 + aRand.w * 1.4);
    p.x += sin(uTime * (0.6 + aRand.y) + aRand.x * 6.283) * s * 0.15;
    p.y += sin(uTime * (0.8 + aRand.z) + aRand.w * 6.283) * s * 0.1;

    // landing puff: surface grains hop outward and settle back
    float puff = uPuff * (0.3 + aRand.y) * smoothstep(0.02, 0.2, position.y + 0.05);
    p.xz += dir * puff * 0.12;
    p.y += puff * 0.08 * aRand.z;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = max(1.0, uSize * uScale * (0.55 + aRand.x * 0.9) * (1.0 - s * 0.4) / -mv.z);
    vColor = aColor;
    vAlpha = 1.0 - smoothstep(0.06, 0.38 + aRand.w * 0.3, s);
  }
`;

// A heap of matcha powder (units: tin heights), shaped like the product shot: piled up
// around a tin pressed into the middle, with a fine dusting and a few clumps around it.
// It's a solid surface (so nothing shows through) covered in tiny grains, all lit and
// shadowed ahead of time. setScatter(0…1) blows it into the air as the visitor scrolls.
export function createMound({ lite = false } = {}) {
  const r = rng(21);
  const group = new THREE.Group();

  const TIN_R = 0.43;
  const TIN_BOTTOM = 0.06;
  const TIN_TOP = 1.06;
  const L = new THREE.Vector3(4, 6, 6).normalize(); // matches the key light
  const jitter = [
    [0.08, 0, 0.05],
    [-0.07, 0.03, -0.04],
    [0.03, -0.05, 0.08],
    [-0.04, 0.06, -0.07],
  ].map(([x, y, z]) => new THREE.Vector3(L.x + x, L.y + y, L.z + z).normalize());

  const bumps = Array.from({ length: 14 }, () => {
    const s = 0.05 + r() * 0.14;
    return { x: (r() - 0.5) * 2.2, z: (r() - 0.5) * 1.6, s2: s * s, h: (r() - 0.35) * 0.05 };
  });

  const noise = makeNoise(r);
  const fbm = (x, z) => noise(x, z) * 0.5 + noise(x * 2 + 5.2, z * 2 + 1.3) * 0.25 + noise(x * 4 + 9.1, z * 4 + 3.7) * 0.125;

  // Distance from the centre in "heap radii", warped so the outline is ragged, not an ellipse.
  const reach = (x, z) => Math.hypot(x / 0.95, z / 0.75) * (1 + 0.24 * noise(x * 1.4 + 3.1, z * 1.4 + 7.7));

  const heightAt = (x, z) => {
    const e = reach(x, z);
    const s = smooth01((e - 0.15) / 1.0);
    let h = 0.42 * Math.pow(1 - s, 1.25);
    const d = Math.hypot(x, z);
    h += 0.05 * Math.exp(-(((d - 0.47) / 0.07) ** 2)); // ridge pushed up by the tin
    h += fbm(x * 3.2, z * 3.2) * 0.075 * (1 - s * 0.7); // lumps
    h += noise(x * 15, z * 15) * 0.012 * (1 - s); // crumbly detail
    for (const b of bumps) {
      const q = (x - b.x) ** 2 + (z - b.z) ** 2;
      if (q < b.s2 * 9) h += b.h * Math.exp(-q / b.s2) * (1 - s * 0.6);
    }
    const dent = smooth01((d - 0.38) / 0.1); // pressed flat where the tin sits
    return Math.max(0, h * dent + 0.05 * (1 - dent));
  };

  // Surface normal by forward differences from a known height h0 (two extra samples).
  const n = new THREE.Vector3();
  const normalAt = (x, z, h0) => {
    const e = 0.004;
    return n.set(-(heightAt(x + e, z) - h0) / e, 1, -(heightAt(x, z + e) - h0) / e).normalize();
  };

  // Share of a soft key light blocked by the tin (a vertical cylinder at the origin).
  const shadowAt = (x, y, z) => {
    let hit = 0;
    for (const l of jitter) {
      const a = l.x * l.x + l.z * l.z;
      const b = 2 * (x * l.x + z * l.z);
      const c = x * x + z * z - TIN_R * TIN_R;
      const disc = b * b - 4 * a * c;
      if (disc < 0) continue;
      const sq = Math.sqrt(disc);
      const t1 = Math.max(0, (-b - sq) / (2 * a));
      const t2 = (-b + sq) / (2 * a);
      if (t2 < 0) continue;
      if (y + t1 * l.y < TIN_TOP && y + t2 * l.y > TIN_BOTTOM) hit++;
    }
    return hit / jitter.length;
  };

  const albedo = new THREE.Color('#82a233');
  // h0: the heap height at (x, z); y: the actual point height (grains sit slightly above).
  const shadeAt = (x, z, h0, y = h0) => {
    const nn = normalAt(x, z, h0);
    const d = Math.hypot(x, z);
    const diffuse = Math.max(0, nn.dot(L));
    const ao = 0.6 + 0.4 * smooth01((d - 0.42) / 0.38);
    const lit = 1 - 0.62 * shadowAt(x, y, z);
    return (0.3 + 0.9 * diffuse * lit) * ao;
  };

  // --- solid heap surface ---------------------------------------------------
  const RINGS = lite ? 72 : 120;
  const SEGS = lite ? 130 : 220;
  const E_MAX = 1.75;
  const vCount = (RINGS + 1) * (SEGS + 1);
  const mPos = new Float32Array(vCount * 3);
  const mCol = new Float32Array(vCount * 4);
  const mUv = new Float32Array(vCount * 2);
  const tmp = new THREE.Color();
  let v = 0;
  for (let i = 0; i <= RINGS; i++) {
    const e = (i / RINGS) * E_MAX;
    for (let j = 0; j <= SEGS; j++) {
      const a = (j / SEGS) * Math.PI * 2;
      const x = Math.cos(a) * e * 0.95;
      const z = Math.sin(a) * e * 0.75;
      const y = heightAt(x, z);
      mPos.set([x, y, z], v * 3);
      tmp.copy(albedo).multiplyScalar(shadeAt(x, z, y));
      mCol.set([tmp.r, tmp.g, tmp.b, 1 - smooth01((reach(x, z) - 0.98) / 0.24)], v * 4);
      mUv.set([x * 2.6, z * 2.6], v * 2);
      v++;
    }
  }
  const idx = [];
  for (let i = 0; i < RINGS; i++) {
    for (let j = 0; j < SEGS; j++) {
      const a0 = i * (SEGS + 1) + j;
      const b0 = a0 + SEGS + 1;
      idx.push(a0, b0, a0 + 1, b0, b0 + 1, a0 + 1);
    }
  }
  const mGeo = new THREE.BufferGeometry();
  mGeo.setAttribute('position', new THREE.BufferAttribute(mPos, 3));
  mGeo.setAttribute('color', new THREE.BufferAttribute(mCol, 4));
  mGeo.setAttribute('uv', new THREE.BufferAttribute(mUv, 2));
  mGeo.setIndex(idx);
  const grain = makeGrainTexture();
  const meshMat = new THREE.MeshBasicMaterial({
    map: grain,
    vertexColors: true,
    transparent: true,
    depthWrite: true,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(mGeo, meshMat);
  mesh.renderOrder = 0;
  group.add(mesh);

  // --- grains ---------------------------------------------------------------
  const SURF = lite ? 26000 : 52000;
  const LOOSE = lite ? 4500 : 9000;
  const CLUMPS = 16;
  const PER_CLUMP = lite ? 120 : 220;
  const N = SURF + LOOSE + CLUMPS * PER_CLUMP;
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  const rnd = new Float32Array(N * 4);
  const palette = ['#5f7f22', '#7a9b2e', '#8fb03c', '#a7c552'].map((h) => new THREE.Color(h));

  let k = 0;
  const put = (x, y, z, shade) => {
    pos[k * 3] = x;
    pos[k * 3 + 1] = y;
    pos[k * 3 + 2] = z;
    const a = palette[Math.floor(r() * 3)];
    const b = palette[Math.floor(r() * 3) + 1];
    tmp.copy(a).lerp(b, r()).multiplyScalar(shade * (0.86 + r() * 0.28));
    col[k * 3] = tmp.r;
    col[k * 3 + 1] = tmp.g;
    col[k * 3 + 2] = tmp.b;
    for (let j = 0; j < 4; j++) rnd[k * 4 + j] = r();
    k++;
  };

  while (k < SURF) {
    const a = r() * Math.PI * 2;
    const e = 1.35 * Math.sqrt(r());
    const x = Math.cos(a) * e * 0.95;
    const z = Math.sin(a) * e * 0.75;
    const re = reach(x, z);
    if (re > 1.12 || (re > 0.98 && r() < (re - 0.98) / 0.14)) continue; // thin out at the ragged edge
    if (Math.hypot(x, z) < TIN_R && r() < 0.8) continue; // hidden under the tin anyway
    const h0 = heightAt(x, z);
    const y = h0 + 0.002 + r() * 0.004;
    put(x, y, z, shadeAt(x, z, h0, y));
  }

  for (let i = 0; i < LOOSE; i++) {
    const a = r() * Math.PI * 2;
    const e = 0.95 + Math.pow(r(), 1.7) * 0.85;
    const x = Math.cos(a) * e * 0.95 * (1 + 0.24 * noise(Math.cos(a) * 1.3 + 3.1, Math.sin(a) * 1.0 + 7.7));
    const z = Math.sin(a) * e * 0.75;
    const h0 = heightAt(x, z);
    put(x, h0 + 0.002, z, shadeAt(x, z, h0) * (0.95 + r() * 0.1));
  }

  for (let c = 0; c < CLUMPS; c++) {
    const a = r() * Math.PI * 2;
    const e = 1.05 + r() * 0.55;
    const cx = Math.cos(a) * e * 0.95;
    const cz = Math.sin(a) * e * 0.75;
    const rad = 0.014 + r() * 0.028;
    for (let i = 0; i < PER_CLUMP; i++) {
      const u = r() * Math.PI * 2;
      const w = Math.acos(r());
      n.set(Math.sin(w) * Math.cos(u), Math.cos(w), Math.sin(w) * Math.sin(u));
      const shade = (0.42 + 0.7 * Math.max(0, n.dot(L))) * (1 - 0.5 * shadowAt(cx, 0.01, cz));
      put(cx + n.x * rad, n.y * rad * 0.8, cz + n.z * rad, shade);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aRand', new THREE.BufferAttribute(rnd, 4));

  const uniforms = {
    uTime: { value: 0 },
    uScatter: { value: 0 },
    uPuff: { value: 0 },
    uSize: { value: 0.006 },
    uScale: { value: 1 },
  };
  const points = new THREE.Points(
    geo,
    new THREE.ShaderMaterial({
      vertexShader: MOUND_VERT,
      fragmentShader: GRAIN_FRAG,
      transparent: true,
      depthWrite: true,
      uniforms,
    })
  );
  points.frustumCulled = false;
  points.renderOrder = 1;
  group.add(points);

  return {
    group,
    uniforms,
    // the solid surface sinks and fades while the grains fly off
    setScatter(s) {
      uniforms.uScatter.value = s;
      mesh.scale.y = Math.max(0.02, 1 - s * 2.2);
      meshMat.opacity = 1 - smooth01((s - 0.04) / 0.28);
      mesh.visible = meshMat.opacity > 0.01;
    },
  };
}

const PUFF_VERT = /* glsl */ `
  attribute float aAlpha;
  attribute float aSize;
  attribute float aShade;
  uniform float uScale;
  uniform vec3 uLight;
  uniform vec3 uDark;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = max(1.0, aSize * uScale / -mv.z);
    vColor = mix(uDark, uLight, aShade);
    vAlpha = aAlpha;
  }
`;

// Short-lived matcha dust in world space: the trail behind the flying tin, the puff when
// it lands, and the wisps that rise when the lid comes off.
export class PowderEmitter {
  constructor(max = 2600) {
    this.max = max;
    this.next = 0;
    this.pos = new Float32Array(max * 3);
    this.vel = new Float32Array(max * 3);
    this.age = new Float32Array(max).fill(1);
    this.life = new Float32Array(max).fill(1);
    this.alpha = new Float32Array(max);
    this.size = new Float32Array(max);
    this.shade = new Float32Array(max);
    this.peak = new Float32Array(max);

    const geo = new THREE.BufferGeometry();
    this.aPos = new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage);
    this.aAlpha = new THREE.BufferAttribute(this.alpha, 1).setUsage(THREE.DynamicDrawUsage);
    this.aSize = new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage);
    this.aShade = new THREE.BufferAttribute(this.shade, 1).setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', this.aPos);
    geo.setAttribute('aAlpha', this.aAlpha);
    geo.setAttribute('aSize', this.aSize);
    geo.setAttribute('aShade', this.aShade);

    const mat = new THREE.ShaderMaterial({
      vertexShader: PUFF_VERT,
      fragmentShader: PUFF_FRAG,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uScale: { value: 1 },
        uLight: { value: new THREE.Color('#b9d265') },
        uDark: { value: new THREE.Color('#5f8222') },
      },
    });
    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 2;
  }

  spawn(x, y, z, vx, vy, vz, size, life, peak = 0.6) {
    const i = this.next;
    this.next = (this.next + 1) % this.max;
    this.pos[i * 3] = x;
    this.pos[i * 3 + 1] = y;
    this.pos[i * 3 + 2] = z;
    this.vel[i * 3] = vx;
    this.vel[i * 3 + 1] = vy;
    this.vel[i * 3 + 2] = vz;
    this.age[i] = 0;
    this.life[i] = life;
    this.size[i] = size;
    this.peak[i] = peak;
    this.shade[i] = Math.random();
  }

  update(dt) {
    const drag = Math.exp(-dt * 1.4);
    for (let i = 0; i < this.max; i++) {
      if (this.age[i] >= this.life[i]) {
        this.alpha[i] = 0;
        continue;
      }
      this.age[i] += dt;
      const j = i * 3;
      this.vel[j] *= drag;
      this.vel[j + 1] = this.vel[j + 1] * drag - 0.05 * dt;
      this.vel[j + 2] *= drag;
      this.pos[j] += this.vel[j] * dt;
      this.pos[j + 1] += this.vel[j + 1] * dt;
      this.pos[j + 2] += this.vel[j + 2] * dt;
      const p = this.age[i] / this.life[i];
      this.alpha[i] = Math.sin(Math.PI * Math.min(1, p)) * this.peak[i];
    }
    this.aPos.needsUpdate = true;
    this.aAlpha.needsUpdate = true;
    this.aSize.needsUpdate = true;
    this.aShade.needsUpdate = true;
  }
}

const DUST_VERT = /* glsl */ `
  attribute vec4 aRand;
  uniform float uTime;
  uniform float uScroll;
  uniform float uScale;
  uniform vec2 uHalf;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float depth = mix(-3.0, 2.5, aRand.z);
    float spanY = uHalf.y * 2.6;
    float y = aRand.y * spanY + uTime * (0.03 + aRand.w * 0.05) + uScroll * uHalf.y * (0.4 + aRand.z * 0.8);
    y = mod(y, spanY) - spanY * 0.5;
    float x = (aRand.x * 2.0 - 1.0) * uHalf.x * 1.25 + sin(uTime * 0.25 + aRand.w * 6.283) * 0.25;
    vec4 mv = modelViewMatrix * vec4(x, y, depth, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = max(1.0, (0.008 + aRand.w * 0.016) * uScale / -mv.z);
    vColor = vec3(0.93, 0.97, 0.78);
    vAlpha = (0.3 + 0.45 * aRand.x) * (0.6 + 0.4 * sin(uTime * (0.8 + aRand.y) + aRand.z * 6.283));
  }
`;

// Faint motes drifting through the whole viewport, like dust in a sunbeam.
export function createDust(count = 320) {
  const r = rng(9);
  const rnd = new Float32Array(count * 4).map(() => r());
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geo.setAttribute('aRand', new THREE.BufferAttribute(rnd, 4));
  const mat = new THREE.ShaderMaterial({
    vertexShader: DUST_VERT,
    fragmentShader: PUFF_FRAG,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uScale: { value: 1 },
      uHalf: { value: new THREE.Vector2(1, 1) },
    },
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  points.renderOrder = 3;
  return points;
}
