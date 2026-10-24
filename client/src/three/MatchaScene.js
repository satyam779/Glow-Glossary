import * as THREE from 'three';
import { createStudioEnvironment } from './environment';
import { makeEmbossNormalMap, makeLabelTexture, makeLeafTexture, makePowderTexture } from './textures';
import { createTin } from './tin';
import { createDust, createMound, PowderEmitter } from './powder';
import { createLeaves } from './leaves';

const DEG = Math.PI / 180;
const FOV = 30;
const CAM_Z = 10;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const smooth = (t) => t * t * (3 - 2 * t);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// The floating matcha tin. It reads every [data-tin] slot on the page and, as the visitor
// scrolls, flies from one slot to the next: parked in its slot while a section is in view,
// swooping and spinning on the way to the next one.
export class MatchaScene {
  constructor(container, { origin } = {}) {
    this.origin = origin;
    this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // phones and low-core machines get about half the powder grains
    this.lite = window.innerWidth < 760 || (navigator.hardwareConcurrency || 8) <= 4;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'tin-canvas';

    // Throws if WebGL is unavailable; the caller falls back to static images.
    const renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    container.appendChild(this.canvas);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1.05;
    this.renderer = renderer;

    this.scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const studio = createStudioEnvironment();
    this.envRT = pmrem.fromScene(studio, 0.02);
    this.scene.environment = this.envRT.texture;
    studio.traverse((o) => {
      o.geometry?.dispose();
      o.material?.dispose();
    });
    pmrem.dispose();

    this.camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
    this.camera.position.set(0, 0, CAM_Z);

    this.scene.add(new THREE.HemisphereLight(0xfffbea, 0x5d7a2a, 0.55));
    const key = new THREE.DirectionalLight(0xfff3dc, 1.8);
    key.position.set(4, 6, 6);
    const rim = new THREE.DirectionalLight(0xe4f2ff, 2.2);
    rim.position.set(-5, 3, -4);
    const bounce = new THREE.DirectionalLight(0xc8e39a, 0.5);
    bounce.position.set(-4, -2, 5);
    this.scene.add(key, rim, bounce);

    // flight (position, scale) > tilt (lean toward viewer / sideways) > spin (around the tin's own axis)
    this.flight = new THREE.Group();
    this.tilt = new THREE.Group();
    this.spin = new THREE.Group();
    this.flight.add(this.tilt);
    this.tilt.add(this.spin);
    this.flight.visible = false;
    this.scene.add(this.flight);

    this.mouse = { x: 0, y: 0, sx: 0, sy: 0 };
    this.state = null;
    this.prev = null;
    this.trailDebt = 0;
    this.lidDebt = 0;
    this.lidBurst = false;
    this.introAt = -1;
    this.landed = false;
    this.landAt = -1;
    this.timer = new THREE.Timer();
    this.timer.connect(document);
    this.slots = [];
    this.keys = null;
    this.keysAt = -Infinity;

    this.onResize = () => {
      this.resize();
      this.keys = null;
    };
    this.onPointer = (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('resize', this.onResize);
    window.addEventListener('pointermove', this.onPointer, { passive: true });
    this.resize();
  }

  async load() {
    // Start fetching the lid sticker straight away; it downloads while we wait for fonts.
    const stickerLoad = new THREE.TextureLoader().loadAsync('/images/lid-sticker.webp');

    // The label is drawn with Poppins, so wait for it (but never hang on a slow font).
    // If it arrives late, the label is redrawn once it does.
    let fontsLoaded = false;
    const fonts = Promise.all(
      ['700 64px Poppins', '600 232px Poppins', '500 31px Poppins', '400 25px Poppins'].map((f) => document.fonts.load(f))
    ).then(() => {
      fontsLoaded = true;
    });
    await Promise.race([fonts, wait(3000)]).catch(() => {});

    const sticker = await stickerLoad;
    sticker.colorSpace = THREE.SRGBColorSpace;
    sticker.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    if (this.disposed) return false;

    this.tin = createTin({
      label: makeLabelTexture(this.renderer, this.origin),
      sticker,
      emboss: makeEmbossNormalMap(),
      powder: makePowderTexture(),
    });
    this.spin.add(this.tin.group);
    if (!fontsLoaded) {
      fonts
        .then(() => {
          if (!this.disposed) this.tin.setLabel(makeLabelTexture(this.renderer, this.origin));
        })
        .catch(() => {});
    }

    this.leaves = createLeaves(makeLeafTexture());
    this.flight.add(this.leaves.group);

    this.mound = createMound({ lite: this.lite });
    this.mound.group.visible = false;
    this.scene.add(this.mound.group);

    this.emitter = new PowderEmitter(this.reduced ? 600 : this.lite ? 1400 : 2800);
    this.scene.add(this.emitter.points);

    this.dust = createDust(this.reduced ? 100 : this.lite ? 200 : 340);
    this.scene.add(this.dust);

    this.slots = [...document.querySelectorAll('[data-tin]')];
    this.resize();
    this.renderer.compile(this.scene, this.camera);
    this.loop = (now) => {
      this.raf = requestAnimationFrame(this.loop);
      this.timer.update(now);
      this.frame();
    };
    this.raf = requestAnimationFrame(this.loop);
    return true;
  }

  // Called when the loader lifts: the tin drops into its powder heap.
  startIntro() {
    if (this.introAt >= 0) return;
    this.introAt = this.timer.getElapsed();
    if (this.reduced) this.landed = true;
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.pxScale = (this.renderer.getPixelRatio() * h) / (2 * Math.tan((FOV / 2) * DEG));
    for (const p of [this.emitter?.points, this.dust]) {
      if (p) p.material.uniforms.uScale.value = this.pxScale;
    }
    if (this.mound) this.mound.uniforms.uScale.value = this.pxScale;
  }

  // Slot positions in document pixels. They don't change with scroll, so they're measured
  // only on resize and twice a second (to catch late layout shifts from fonts and images).
  readKeys(scrollY, vh, t) {
    if (this.keys && t - this.keysAt < 0.5) return this.keys;
    this.keysAt = t;
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - vh);
    this.keys = this.slots.map((el, i) => {
      const sec = el.closest('section') || el;
      const r = el.getBoundingClientRect();
      const d = el.dataset;
      return {
        top: Math.min(sec.getBoundingClientRect().top + scrollY, maxScroll),
        x: r.left + r.width / 2,
        y: r.top + scrollY + r.height / 2,
        h: r.height,
        // every other stop adds a full turn, so the tin twirls one way, then back
        yaw: (parseFloat(d.yaw) || 0) + (this.reduced ? 0 : (i % 2) * 360),
        tilt: parseFloat(d.tilt) || 0,
        lean: parseFloat(d.lean) || 0,
        lid: parseFloat(d.lid) || 0,
        powder: parseFloat(d.powder) || 0,
      };
    });
    return this.keys;
  }

  // Where the tin should be for this scroll position, in document pixels.
  targetAt(keys, scrollY, vh) {
    let i = 0;
    while (i < keys.length - 1 && scrollY >= keys[i + 1].top - 0.5) i++;
    const a = keys[i];
    const b = keys[Math.min(i + 1, keys.length - 1)];
    // Stay parked while the section is on screen; fly only during the last screen before the
    // next stop, so tall sections (the shop, the reviews) don't drag the tin across their content.
    let t = 0;
    if (a !== b) {
      const flyStart = Math.max(a.top + 0.12 * vh, b.top - 0.88 * vh);
      const flyEnd = Math.max(flyStart + 1, b.top - 0.12 * vh);
      t = ease(clamp((scrollY - flyStart) / (flyEnd - flyStart), 0, 1));
    }
    const m = Math.sin(t * Math.PI);
    return {
      x: lerp(a.x, b.x, t),
      y: lerp(a.y, b.y, t) + (this.reduced ? 0 : m * 0.1 * vh), // dip mid-flight
      h: lerp(a.h, b.h, t) * (1 + m * 0.08),
      yaw: lerp(a.yaw, b.yaw, t),
      tilt: lerp(a.tilt, b.tilt, t),
      lean: lerp(a.lean, b.lean, t),
      lid: lerp(a.lid, b.lid, t),
      powder: lerp(a.powder, b.powder, t),
      moving: m,
    };
  }

  frame() {
    const dt = Math.max(1e-4, Math.min(this.timer.getDelta(), 0.05));
    const t = this.timer.getElapsed();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const sy = window.scrollY;
    if (!this.slots.length) return;

    const keys = this.readKeys(sy, vh, t);
    const tg = this.targetAt(keys, sy, vh);
    if (!this.state) this.state = { ...tg };
    const s = this.state;
    const k = 1 - Math.exp(-dt * 3.2);
    const ky = 1 - Math.exp(-dt * 2.6);
    s.x += (tg.x - s.x) * k;
    s.y += (tg.y - s.y) * k;
    s.h += (tg.h - s.h) * k;
    s.yaw += (tg.yaw - s.yaw) * ky;
    s.tilt += (tg.tilt - s.tilt) * k;
    s.lean += (tg.lean - s.lean) * k;
    s.lid += (tg.lid - s.lid) * (1 - Math.exp(-dt * 2.4));
    s.powder += (tg.powder - s.powder) * k;

    const m = this.mouse;
    const km = 1 - Math.exp(-dt * 2);
    m.sx += (m.x - m.sx) * km;
    m.sy += (m.y - m.sy) * km;

    // document pixels -> world units on the z = 0 plane
    const halfH = Math.tan((FOV / 2) * DEG) * CAM_Z;
    const unit = (2 * halfH) / vh;
    const scale = Math.max(0.001, s.h * unit);
    const scatter = smooth(clamp(sy / (vh * 0.42), 0, 1));
    const rest = s.powder * (1 - scatter); // 1 = sitting still in the heap
    const free = 1 - rest;

    let wx = (s.x - vw / 2) * unit;
    let wy = (vh / 2 - (s.y - sy)) * unit;
    wx += (Math.sin(t * 1.1) * 0.02 + m.sx * 0.06) * scale * free;
    wy += ((Math.sin(t * 1.6) * 0.035 + Math.sin(t * 2.9) * 0.012) * free + m.sy * 0.04 * free) * scale;
    const wz = Math.sin(t * 0.9) * 0.12 * free;

    // Intro: fall from above the viewport, land with a puff, settle with a small bounce.
    let drop = 0;
    if (this.introAt < 0) {
      drop = halfH * 3;
    } else if (!this.reduced) {
      const age = t - this.introAt;
      const fall = 0.75;
      if (age < fall) {
        const p = age / fall;
        drop = (1 - p * p) * (halfH * 1.4 + scale);
      } else {
        if (!this.landed) this.land(wx, wy - scale * 0.5, scale);
        const a = age - fall;
        drop = Math.exp(-a * 6) * Math.sin(a * 16) * 0.035 * scale;
      }
    }
    this.flight.visible = this.introAt >= 0;

    const prev = this.prev || { x: wx, y: wy };
    const vxn = (wx - prev.x) / dt / scale;
    const vyn = (wy - prev.y) / dt / scale;
    this.prev = { x: wx, y: wy };

    this.flight.position.set(wx, wy + drop, wz);
    this.flight.scale.setScalar(scale);
    const lean = s.lean - clamp(vxn * 5, -22, 22) * free + Math.sin(t * 1.3) * 2 * free;
    const tilt = s.tilt + clamp(vyn * 3, -16, 16) * free - m.sy * 6 * free + Math.sin(t * 1.7 + 1) * 2 * free;
    this.tilt.rotation.set(tilt * DEG, m.sx * 10 * DEG * free, lean * DEG);
    this.spin.rotation.y = s.yaw * DEG;
    this.tin.setLid(s.lid);
    this.leaves.update(t, rest);
    this.leaves.group.visible = rest < 0.98 || this.landed;

    this.updateMound(keys[0], sy, vw, vh, unit, scatter, t);
    this.emit(dt, tg.moving, vxn, vyn, wx, wy + drop, wz, scale, s.lid);
    this.emitter.update(dt);

    const du = this.dust.material.uniforms;
    du.uTime.value = t;
    du.uScroll.value = sy / vh;
    du.uHalf.value.set(halfH * this.camera.aspect, halfH);

    this.renderer.render(this.scene, this.camera);
  }

  // The heap sits under the hero slot (exactly, without smoothing, so it scrolls with the page).
  updateMound(k0, sy, vw, vh, unit, scatter, t) {
    const { group, uniforms: u } = this.mound;
    group.visible = this.introAt >= 0 && scatter < 0.999;
    if (!group.visible) return;
    const mh = k0.h * unit;
    const cy = (vh / 2 - (k0.y - sy)) * unit;
    group.position.set((k0.x - vw / 2) * unit, cy - mh * 0.56, -0.05);
    group.scale.setScalar(mh);
    u.uTime.value = t;
    u.uSize.value = 0.0062 * mh;
    this.mound.setScatter(scatter);
    const age = this.landAt < 0 ? -1 : t - this.landAt;
    u.uPuff.value = age < 0 ? 0 : Math.exp(-age * 3.2) * Math.min(1, age * 18);
  }

  // The landing puff: a ring of fine dust kicked out low around the tin's base.
  land(x, baseY, scale) {
    this.landed = true;
    this.landAt = this.timer.getElapsed();
    const count = this.reduced ? 80 : this.lite ? 260 : 480;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 0.4 + Math.random() * 1.1;
      this.emitter.spawn(
        x + Math.cos(a) * (0.42 + Math.random() * 0.15) * scale,
        baseY + (0.1 + Math.random() * 0.25) * scale,
        Math.sin(a) * 0.32 * scale,
        Math.cos(a) * sp * scale,
        (0.15 + Math.random() * 0.7) * scale,
        Math.sin(a) * sp * 0.5 * scale,
        (0.012 + Math.random() * 0.022) * scale,
        1 + Math.random() * 1.4,
        0.7
      );
    }
  }

  emit(dt, moving, vxn, vyn, x, y, z, scale, lid) {
    if (this.introAt < 0) return;
    const rate = this.reduced ? 0.25 : 1;

    // dust trail while flying between sections
    const speed = Math.hypot(vxn, vyn);
    if (moving > 0.05 && speed > 0.25) {
      this.trailDebt += speed * dt * (this.lite ? 50 : 90) * rate;
      while (this.trailDebt >= 1) {
        this.trailDebt -= 1;
        const a = Math.random() * Math.PI * 2;
        const rr = Math.sqrt(Math.random()) * 0.36 * scale;
        this.emitter.spawn(
          x + Math.cos(a) * rr,
          y + Math.sin(a) * rr - 0.2 * scale,
          z + (Math.random() - 0.5) * 0.3 * scale,
          (-vxn * 0.12 + (Math.random() - 0.5) * 0.3) * scale,
          (-vyn * 0.12 + (Math.random() - 0.3) * 0.3) * scale,
          (Math.random() - 0.5) * 0.2 * scale,
          (0.01 + Math.random() * 0.02) * scale,
          0.9 + Math.random() * 1.1,
          0.65
        );
      }
    }

    // wisps rising from the open tin
    if (lid > 0.3) {
      if (lid > 0.6 && !this.lidBurst) {
        this.lidBurst = true;
        this.lidDebt += (this.lite ? 120 : 220) * rate;
      }
      this.lidDebt += lid * dt * (this.lite ? 50 : 90) * rate;
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.tilt.getWorldQuaternion(new THREE.Quaternion()));
      const p = new THREE.Vector3();
      while (this.lidDebt >= 1) {
        this.lidDebt -= 1;
        const a = Math.random() * Math.PI * 2;
        const rr = Math.sqrt(Math.random()) * this.tin.mouthRadius;
        p.set(Math.cos(a) * rr, this.tin.mouthY, Math.sin(a) * rr);
        this.tin.group.localToWorld(p);
        const sp = (0.25 + Math.random() * 0.45) * scale;
        this.emitter.spawn(
          p.x,
          p.y,
          p.z,
          up.x * sp + (Math.random() - 0.5) * 0.2 * scale,
          up.y * sp,
          up.z * sp + (Math.random() - 0.5) * 0.2 * scale,
          (0.01 + Math.random() * 0.022) * scale,
          1.4 + Math.random() * 1.6,
          0.6
        );
      }
    } else if (lid < 0.1) {
      this.lidBurst = false;
    }
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.timer.dispose();
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('pointermove', this.onPointer);
    this.scene.traverse((o) => {
      o.geometry?.dispose();
      const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      for (const mat of mats) {
        for (const v of Object.values(mat)) if (v?.isTexture) v.dispose();
        mat.dispose();
      }
    });
    this.envRT.dispose();
    this.renderer.dispose();
    this.canvas.remove();
  }
}
