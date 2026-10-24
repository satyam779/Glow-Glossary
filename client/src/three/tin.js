import * as THREE from 'three';

// Profiles are [radius, height] pairs spun around Y. Proportions follow the real 30 g tin:
// 1.2 tall, ~1.03 wide; lid ≈ 22% of the height, a thin steel band, the label (45%),
// then a deep steel base (27%).
const BODY = [
  [0, -0.6],
  [0.47, -0.6],
  [0.49, -0.597],
  [0.499, -0.588],
  [0.504, -0.576],
  [0.506, -0.565],
  [0.503, -0.553],
  [0.498, -0.546],
  [0.497, -0.53],
  [0.5, -0.522],
  [0.5, 0.33],
  [0.494, 0.338],
  [0.489, 0.346],
  [0.489, 0.488],
  [0.487, 0.498],
  [0.48, 0.502],
  [0.475, 0.497],
];
const INNER = [
  [0.475, 0.497],
  [0.474, 0.486],
  [0.474, 0.36],
];

const LID_PIVOT = 0.468;
const LID = [
  [0.494, 0.345],
  [0.505, 0.336],
  [0.514, 0.34],
  [0.517, 0.35],
  [0.512, 0.362],
  [0.512, 0.565],
  [0.516, 0.576],
  [0.512, 0.589],
  [0.501, 0.598],
  [0.472, 0.6],
  [0.458, 0.595],
  [0.445, 0.591],
  [0, 0.591],
];

const POWDER = [
  [0, 0.385],
  [0.18, 0.381],
  [0.36, 0.374],
  [0.474, 0.365],
];

const LABEL_H = 0.54;
const LABEL_Y = -0.006;

// LatheGeometry spaces v by point index, which stretches textures along long straight runs.
// Re-map v by arc length (in the same units as the circumference) so the emboss tiles evenly.
function lathe(points, segments, dy = 0) {
  const pts = points.map(([r, y]) => new THREE.Vector2(r, y + dy));
  const geo = new THREE.LatheGeometry(pts, segments);
  const cum = [0];
  for (let j = 1; j < pts.length; j++) cum.push(cum[j - 1] + pts[j].distanceTo(pts[j - 1]));
  const circ = Math.PI * 2 * 0.5;
  const uv = geo.attributes.uv;
  for (let i = 0; i <= segments; i++) {
    for (let j = 0; j < pts.length; j++) uv.setY(i * pts.length + j, cum[j] / circ);
  }
  uv.needsUpdate = true;
  return geo;
}

export function createTin({ label, sticker, emboss, powder }) {
  const group = new THREE.Group();

  emboss.repeat.set(7, 7);
  const metal = new THREE.MeshPhysicalMaterial({
    color: 0xe8eaec,
    metalness: 1,
    roughness: 0.16,
    normalMap: emboss,
    normalScale: new THREE.Vector2(0.4, 0.4),
    envMapIntensity: 1.2,
    side: THREE.DoubleSide,
  });
  const innerMetal = new THREE.MeshStandardMaterial({
    color: 0x8e9396,
    metalness: 1,
    roughness: 0.45,
    envMapIntensity: 0.55,
    side: THREE.DoubleSide,
  });
  const seamMat = new THREE.MeshStandardMaterial({ color: 0x2a2d2b, metalness: 0.6, roughness: 0.6 });
  const labelMat = new THREE.MeshPhysicalMaterial({
    map: label,
    roughness: 0.4,
    metalness: 0,
    clearcoat: 0.6,
    clearcoatRoughness: 0.18,
    envMapIntensity: 0.85,
  });
  const stickerMat = new THREE.MeshPhysicalMaterial({
    map: sticker,
    roughness: 0.42,
    metalness: 0,
    clearcoat: 0.5,
    clearcoatRoughness: 0.22,
    envMapIntensity: 0.75,
  });
  powder.repeat.set(6, 2);
  const powderMat = new THREE.MeshStandardMaterial({
    map: powder,
    color: 0xa9bb92,
    roughness: 1,
    metalness: 0,
    side: THREE.DoubleSide,
  });

  const body = new THREE.Mesh(lathe(BODY, 160), metal);
  const inner = new THREE.Mesh(lathe(INNER, 96), innerMetal);

  // the shadowed gap under the lid
  const seam = new THREE.Mesh(new THREE.CylinderGeometry(0.5008, 0.5008, 0.007, 128, 1, true), seamMat);
  seam.position.y = 0.333;

  // thetaStart = PI puts u = 0.5 (the front panel) on +Z, facing the camera.
  const labelMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5035, 0.5035, LABEL_H, 192, 1, true, Math.PI, Math.PI * 2),
    labelMat
  );
  labelMesh.position.y = LABEL_Y;

  const powderMesh = new THREE.Mesh(lathe(POWDER, 64), powderMat);

  const lid = new THREE.Group();
  lid.position.y = LID_PIVOT;
  const lidMesh = new THREE.Mesh(lathe(LID, 160, -LID_PIVOT), metal);
  const stickerMesh = new THREE.Mesh(new THREE.CircleGeometry(0.432, 128), stickerMat);
  stickerMesh.rotation.x = -Math.PI / 2;
  stickerMesh.position.y = 0.5925 - LID_PIVOT;
  lid.add(lidMesh, stickerMesh);

  group.add(body, inner, seam, labelMesh, powderMesh, lid);
  group.scale.setScalar(1 / 1.2); // normalise: tin height = 1 unit

  return {
    group,
    // Local point at the tin's mouth (pre-scale units), used to emit powder when the lid lifts.
    mouthY: 0.5,
    mouthRadius: 0.46,
    setLabel(tex) {
      labelMat.map?.dispose();
      labelMat.map = tex;
      labelMat.needsUpdate = true;
    },
    setLid(open) {
      const o = THREE.MathUtils.clamp(open, 0, 1);
      const e = o * o * (3 - 2 * o);
      lid.position.set(e * 0.16, LID_PIVOT + e * 0.6, e * -0.04);
      lid.rotation.set(e * -0.22, 0, e * -0.42);
      powderMesh.visible = o > 0.001;
    },
  };
}
