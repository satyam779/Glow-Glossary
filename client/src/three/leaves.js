import * as THREE from 'three';

// A curved tea leaf: a subdivided plane pinched to a point at both ends,
// folded along the midrib and arched along its length.
function leafGeometry() {
  const g = new THREE.PlaneGeometry(1, 1, 6, 18);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i);
    const v = p.getY(i) + 0.5;
    const w = 0.36 * Math.pow(Math.sin(Math.PI * Math.min(1, v * 1.03)), 0.85) * (1 - 0.18 * v);
    const z = -Math.abs(u) * w * 0.6 + Math.sin(v * Math.PI) * 0.07 - v * v * 0.08;
    p.setXYZ(i, u * w, v - 0.5, z);
  }
  g.computeVertexNormals();
  return g;
}

// Three leaves that drift in a loose orbit around the tin, like a product shot.
export function createLeaves(texture) {
  const group = new THREE.Group();
  const geo = leafGeometry();
  const mat = new THREE.MeshStandardMaterial({
    map: texture,
    side: THREE.DoubleSide,
    roughness: 0.5,
    metalness: 0,
    envMapIntensity: 0.6,
  });

  const leaves = [0, 1, 2].map((i) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.scale.setScalar(0.26 + i * 0.03);
    group.add(mesh);
    return {
      mesh,
      phase: (i / 3) * Math.PI * 2 + 0.4,
      radius: 0.6 + i * 0.05,
      height: [0.38, -0.18, 0.08][i],
      speed: 0.2 + i * 0.04,
    };
  });

  return {
    group,
    update(t, calm = 0) {
      const amp = 1 - calm * 0.6;
      for (const l of leaves) {
        const a = l.phase + t * l.speed;
        l.mesh.position.set(
          Math.cos(a) * l.radius,
          l.height + Math.sin(t * 0.8 + l.phase) * 0.07 * amp,
          Math.sin(a) * l.radius * 0.7
        );
        l.mesh.rotation.set(
          0.9 + Math.sin(t * 0.5 + l.phase) * 0.5 * amp,
          -a + Math.PI / 2,
          0.6 + Math.sin(t * 0.37 + l.phase * 2) * 0.6 * amp
        );
      }
    },
  };
}
