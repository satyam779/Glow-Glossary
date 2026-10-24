import * as THREE from 'three';

// A small product-photography studio for reflections: a neutral grey dome with softbox
// panels and black flags. The tall bright strips give the steel its crisp vertical
// highlights; the flags give it the dark bands that make metal read as metal.
export function createStudioEnvironment() {
  const scene = new THREE.Scene();

  const dome = new THREE.SphereGeometry(20, 48, 24);
  const pos = dome.attributes.position;
  const cols = new Float32Array(pos.count * 3);
  const top = new THREE.Color('#ffffff');
  const mid = new THREE.Color('#d2d5cf');
  const low = new THREE.Color('#5b5f59');
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const t = pos.getY(i) / 20;
    if (t > 0) c.copy(mid).lerp(top, Math.pow(t, 0.6));
    else c.copy(mid).lerp(low, Math.pow(-t, 0.5));
    c.toArray(cols, i * 3);
  }
  dome.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  scene.add(new THREE.Mesh(dome, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));

  const panel = (w, h, color, power, x, y, z) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(power), side: THREE.DoubleSide })
    );
    m.position.set(x, y, z);
    m.lookAt(0, 0, 0);
    scene.add(m);
  };
  panel(10, 3, 0xfffcf4, 5, 0, 12, 4); // overhead key
  panel(2.6, 14, 0xffffff, 10, -11, 1, 6); // tall strip, front-left: the main highlight
  panel(1.4, 14, 0xffffff, 6, 7, 1, 12); // narrow strip, front-right: second highlight
  panel(1.2, 14, 0xeef6ff, 6, 12, 1, -3); // rim strip, back-right
  panel(2, 14, 0x000000, 1, 12, 0, 5); // black flag, right: dark band between highlights
  panel(3, 14, 0x000000, 1, -9, 0, -9); // black flag, back-left
  panel(6, 2, 0xd8e8b0, 1.2, 0, -10, 6); // faint matcha bounce from below

  return scene;
}
