// Armurerie 3D : l'arme sélectionnée en vraie 3D (orbite), accessoires montés à leurs emplacements,
// teintes Cérakote / polymère, recul, glissière, flamme, douilles, laser et lampe.
// Même contrat que l'ancien rendu SVG (build, fire, magOut, magIn, rack, shellIn, tick…).
import { THREE, Stage3D, loadModel, unloadModel, normalize, splitMesh, contactShadow, ease } from '../core/stage3d.js';
import { METAL, POLY, PADS } from './weapons/index.js';

// Accessoires 3D (assets/models/selection.json) : pièce retenue, orientation, longueur réelle (m).
const ACC = {
  holo: { file: 'assets/models/eotech.glb', rotate: [0, 90, 0], length: 0.097 },
  rds: { file: 'assets/models/reddots.glb', keep: /^Object_(23|24|25|26)$/, length: 0.046 },
  magnifier: { file: 'assets/models/reddots.glb', keep: /^Object_(14|15|16)$/, length: 0.11 },
  peq: { file: 'assets/models/peq15.glb', rotate: [0, 90, 0], length: 0.137, color: '#8a7458' },
  angled: { file: 'assets/models/afg.glb', keep: /^Object_(4|5|6)$/, rotate: [0, 90, 0], length: 0.1 },
  supPistol: { file: 'assets/models/suppressors.glb', keep: /^Object_6$/, length: 0.18, center: true },
  supRifle: { file: 'assets/models/suppressors.glb', keep: /^Object_12$/, length: 0.17, center: true },
  sd: { file: 'assets/models/suppressors.glb', keep: /^Object_4$/, length: 0.316, center: true },
};

const BRASS = new THREE.MeshStandardMaterial({ color: 0xc9a04a, roughness: 0.3, metalness: 1 });
const HULL = new THREE.MeshStandardMaterial({ color: 0x9c1b18, roughness: 0.5, metalness: 0.1 });

// Texture radiale partagée (flamme, halo, fumée).
let glowTex = null;
function glow() {
  if (glowTex) return glowTex;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(255,255,255,.7)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 64, 64);
  glowTex = new THREE.CanvasTexture(c);
  return glowTex;
}

function sprite(color) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glow(), color, transparent: true, opacity: 0, depthWrite: false,
    blending: THREE.NormalBlending, toneMapped: false, // canvas transparent : pas de mélange additif
  }));
  s.renderOrder = 5;
  return s;
}

// Teinte moyenne d'une texture (pour recolorer sans perdre le grain : couleur = cible / moyenne).
const avgCache = new WeakMap();
function textureAverage(tex) {
  if (avgCache.has(tex)) return avgCache.get(tex);
  let out = new THREE.Color(0.5, 0.5, 0.5);
  try {
    const c = document.createElement('canvas');
    c.width = c.height = 8;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(tex.image, 0, 0, 8, 8);
    const d = x.getImageData(0, 0, 8, 8).data;
    let r = 0;
    let g = 0;
    let b = 0;
    for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
    const n = (d.length / 4) * 255; // moyenne ramenée sur 0…1
    out = new THREE.Color().setRGB(r / n, g / n, b / n, THREE.SRGBColorSpace);
  } catch { /* image non lisible : teinte moyenne par défaut */ }
  avgCache.set(tex, out);
  return out;
}

function tintTo(mat, hex) {
  if (!hex) {
    mat.color.setRGB(1, 1, 1);
    return;
  }
  const t = new THREE.Color(hex);
  if (!mat.map) {
    mat.color.copy(t);
    return;
  }
  const a = textureAverage(mat.map);
  const f = (v, w) => THREE.MathUtils.clamp(v / Math.max(w, 0.03), 0, 8);
  mat.color.setRGB(f(t.r, a.r), f(t.g, a.g), f(t.b, a.b));
}

function topNodes(root, re) {
  const out = [];
  root.traverse((n) => {
    if (n !== root && re.test(n.name) && !out.some((o) => { for (let p = n.parent; p; p = p.parent) if (p === o) return true; return false; })) out.push(n);
  });
  return out;
}

function meshesOf(root) {
  const out = [];
  root.traverse((m) => { if (m.isMesh) out.push(m); });
  return out;
}

// Boîte de l'arme et de ses accessoires, sans les effets (laser, cône de lampe, ombre).
function solidBox(root) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3();
  const b = new THREE.Box3();
  root.traverse((m) => {
    if (!m.isMesh || m.userData.fx || !m.visible) return;
    for (let p = m; p; p = p.parent) if (p.userData.fx) return;
    if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
    box.union(b.copy(m.geometry.boundingBox).applyMatrix4(m.matrixWorld));
  });
  return box;
}

// Fond d'un chargeur dans son propre axe (chargeurs courbes / inclinés compris) : centre, largeur
// (dans le plan de tir), épaisseur et angle d'inclinaison, à partir des sommets les plus bas le long de l'axe.
function magFoot(mag, axis) {
  mag.updateMatrixWorld(true);
  const a = new THREE.Vector3(axis[0], axis[1], 0).normalize();
  const t = new THREE.Vector3(-a.y, a.x, 0); // perpendiculaire dans le plan de tir
  const v = new THREE.Vector3();
  const pts = [];
  let far = -Infinity;
  mag.traverse((m) => {
    if (!m.isMesh || !m.visible) return;
    const pos = m.geometry.attributes.position;
    const idx = m.geometry.index;
    const n = idx ? idx.count : pos.count;
    for (let i = 0; i < n; i += 1) {
      v.fromBufferAttribute(pos, idx ? idx.getX(i) : i).applyMatrix4(m.matrixWorld);
      const d = v.dot(a);
      pts.push(v.x, v.y, v.z, d);
      if (d > far) far = d;
    }
  });
  let t0 = Infinity; let t1 = -Infinity; let z0 = Infinity; let z1 = -Infinity;
  const c = new THREE.Vector3();
  let k = 0;
  for (let i = 0; i < pts.length; i += 4) {
    if (pts[i + 3] < far - 0.014) continue; // bande de 14 mm : fonds arrondis compris
    v.set(pts[i], pts[i + 1], pts[i + 2]);
    const u = v.dot(t);
    t0 = Math.min(t0, u); t1 = Math.max(t1, u);
    z0 = Math.min(z0, v.z); z1 = Math.max(z1, v.z);
    c.add(v);
    k += 1;
  }
  c.divideScalar(Math.max(1, k));
  // ramène le centre sur la face inférieure, au milieu de l'empreinte
  const mid = (t0 + t1) / 2;
  c.addScaledVector(t, mid - c.dot(t)).addScaledVector(a, far - c.dot(a));
  c.z = (z0 + z1) / 2;
  return { center: c, w: Math.max(0.016, t1 - t0), d: Math.max(0.014, z1 - z0), angle: Math.atan2(a.x, -a.y) };
}

const inBox = (b) => (v) => v.x >= b.x[0] && v.x <= b.x[1] && v.y >= b.y[0] && v.y <= b.y[1];

// ---------- pièces sans modèle dédié (lampes, compensateur, poignées, talon, extension de tube) ----------
// Formes de révolution (LatheGeometry) et profils extrudés biseautés : pas de « blocs » bruts.

const MAT = {
  ano: () => new THREE.MeshPhysicalMaterial({ color: 0x1a1b1d, roughness: 0.42, metalness: 0.75, clearcoat: 0.25, clearcoatRoughness: 0.5 }),
  poly: () => new THREE.MeshStandardMaterial({ color: 0x18191b, roughness: 0.78, metalness: 0.05 }),
  steel: () => new THREE.MeshStandardMaterial({ color: 0x2c2e31, roughness: 0.3, metalness: 1 }),
  bore: () => new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.9, metalness: 0.2, side: THREE.DoubleSide }),
  chrome: () => new THREE.MeshStandardMaterial({ color: 0xe8ecf0, roughness: 0.06, metalness: 1 }),
};

function cylinder(r0, r1, len, mat) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, len, 28), mat);
  m.rotation.z = -Math.PI / 2; // axe le long de +X
  return m;
}

// Profil [rayon, x] tourné autour de l'axe +X (faces visibles des deux côtés : profils ouverts).
function lathe(profile, mat, seg = 40) {
  mat.side = THREE.DoubleSide;
  const g = new THREE.LatheGeometry(profile.map(([r, x]) => new THREE.Vector2(r, x)), seg);
  const m = new THREE.Mesh(g, mat);
  m.rotation.z = -Math.PI / 2; // axe de révolution Y → +X
  return m;
}

// Rectangle arrondi extrudé et biseauté : w (x) × h (y), épaisseur d (z), centré.
function rounded(w, h, d, r, mat, bevel = 0.0012) {
  const s = new THREE.Shape();
  const x = -w / 2 + bevel;
  const y = -h / 2 + bevel;
  const W = w - bevel * 2;
  const H = h - bevel * 2;
  const rr = Math.min(r, W / 2, H / 2);
  s.moveTo(x + rr, y);
  s.lineTo(x + W - rr, y);
  s.quadraticCurveTo(x + W, y, x + W, y + rr);
  s.lineTo(x + W, y + H - rr);
  s.quadraticCurveTo(x + W, y + H, x + W - rr, y + H);
  s.lineTo(x + rr, y + H);
  s.quadraticCurveTo(x, y + H, x, y + H - rr);
  s.lineTo(x, y + rr);
  s.quadraticCurveTo(x, y, x + rr, y);
  const g = new THREE.ExtrudeGeometry(s, { depth: d - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 6 });
  g.translate(0, 0, -(d - bevel * 2) / 2);
  return new THREE.Mesh(g, mat);
}

// Collier Picatinny : semelle + mâchoire + vis de serrage.
function railClamp(len, mat, screw = true) {
  const g = new THREE.Group();
  const base = rounded(len, 0.007, 0.024, 0.0015, mat);
  base.position.y = -0.0035;
  g.add(base);
  for (const z of [-0.0105, 0.0105]) {
    const lip = rounded(len, 0.004, 0.0035, 0.001, mat, 0.0006);
    lip.position.set(0, 0.0005, z);
    g.add(lip);
  }
  if (screw) {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.0042, 0.0042, 0.004, 18), MAT.steel());
    s.rotation.x = Math.PI / 2;
    s.position.set(0, -0.0035, 0.0135);
    g.add(s);
  }
  return g;
}

// Optique de lampe : réflecteur chromé, LED, verre légèrement teinté (émissif quand allumée).
function lampFace(r, x) {
  const g = new THREE.Group();
  const refl = lathe([[0.0012, x - 0.009], [r * 0.55, x - 0.006], [r * 0.92, x - 0.0015], [r * 0.92, x - 0.0012]], MAT.chrome(), 32);
  const led = new THREE.Mesh(new THREE.CircleGeometry(0.0016, 12), new THREE.MeshBasicMaterial({ color: 0xfff6c8 }));
  led.rotation.y = Math.PI / 2;
  led.position.x = x - 0.0085;
  const lens = new THREE.Mesh(new THREE.CircleGeometry(r * 0.93, 32), new THREE.MeshPhysicalMaterial({
    color: 0x9fb4c6, emissive: 0xfff4dc, emissiveIntensity: 0, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.35, clearcoat: 1,
  }));
  lens.rotation.y = Math.PI / 2;
  lens.position.x = x - 0.0011;
  g.add(refl, led, lens);
  return { g, lens };
}

// Lampes (repère : collier de rail en y = 0, faisceau vers +X).
function flashlight(kind) {
  const g = new THREE.Group();
  const ano = MAT.ano();
  let face;
  if (kind === 'pistol') {
    // SureFire X300 Ultra : corps à facettes, tête Ø 32 mm, collier T-slot intégré, palettes arrière.
    const body = rounded(0.058, 0.026, 0.03, 0.006, ano, 0.0018);
    body.position.set(0.03, -0.019, 0);
    const top = rounded(0.046, 0.008, 0.022, 0.002, ano);
    top.position.set(0.034, -0.004, 0);
    const neck = lathe([[0.0125, 0.055], [0.0135, 0.062], [0.0155, 0.068]], ano);
    const head = lathe([[0.0155, 0.068], [0.016, 0.084], [0.0162, 0.085], [0.0162, 0.0885], [0.0148, 0.0895], [0.0135, 0.0895]], ano);
    for (const n of [neck, head]) n.position.y = -0.019;
    const pads = [-1, 1].map((sd) => {
      const p = rounded(0.012, 0.016, 0.004, 0.003, MAT.poly(), 0.0008);
      p.position.set(0.004, -0.017, sd * 0.016);
      return p;
    });
    const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.003, 16), MAT.steel());
    screw.rotation.x = Math.PI / 2;
    screw.position.set(0.04, -0.005, 0.0125);
    g.add(body, top, neck, head, ...pads, screw);
    face = lampFace(0.0135, 0.0895);
    face.g.position.y = -0.019;
    g.userData.emit = new THREE.Vector3(0.09, -0.019, 0);
  } else {
    // SureFire Scout M600 : tube Ø 25,4 mm, tête Ø 30 mm moletée, interrupteur arrière, embase déportée.
    const yc = -0.024;
    const prof = [
      [0, 0], [0.0085, 0], [0.0105, 0.002], [0.0115, 0.006], [0.0118, 0.016], [0.0112, 0.018], [0.0127, 0.02],
      [0.0127, 0.074], [0.0134, 0.078], [0.015, 0.088], [0.015, 0.1], [0.0144, 0.1012], [0.0152, 0.102],
      [0.0152, 0.1105], [0.0138, 0.112], [0.0128, 0.112],
    ];
    const tube = lathe(prof, ano, 48);
    tube.position.y = yc;
    // moletage de la tête : bagues fines
    for (let i = 0; i < 5; i += 1) {
      const ring = lathe([[0.0151, 0.0895 + i * 0.002], [0.0154, 0.090 + i * 0.002], [0.0151, 0.0905 + i * 0.002]], ano, 32);
      ring.position.y = yc;
      g.add(ring);
    }
    const cap = lathe([[0, -0.004], [0.006, -0.004], [0.0075, -0.002], [0.0078, 0.001]], new THREE.MeshStandardMaterial({ color: 0x0c0c0d, roughness: 0.9 }), 24);
    cap.position.y = yc;
    const arm = rounded(0.03, 0.014, 0.014, 0.003, ano);
    arm.position.set(0.048, -0.008, 0);
    const clamp = railClamp(0.034, ano);
    clamp.position.set(0.048, 0, 0);
    g.add(tube, cap, arm, clamp);
    face = lampFace(0.0128, 0.112);
    face.g.position.y = yc;
    g.userData.emit = new THREE.Vector3(0.112, yc, 0);
  }
  g.add(face.g);
  g.userData.lens = face.lens;
  return g;
}

// Compensateur ajouré : vrais évents (tube ouvert sur le dessus), âme noire, épaulement fileté.
function compensator(r) {
  const g = new THREE.Group();
  const steel = MAT.steel();
  steel.side = THREE.DoubleSide;
  const R = r + 0.0035;
  const L = 0.05;
  const ports = [[0.012, 0.019], [0.023, 0.03], [0.034, 0.041]];
  const open = 1.2; // ouverture angulaire des évents (rad), centrée sur le dessus
  let x = 0;
  const seg = (x0, x1, partial) => {
    const geo = partial
      ? new THREE.CylinderGeometry(R, R, x1 - x0, 40, 1, true, Math.PI * 1.5 + open / 2, Math.PI * 2 - open)
      : new THREE.CylinderGeometry(R, R, x1 - x0, 40, 1, true);
    const m = new THREE.Mesh(geo, steel);
    m.rotation.z = -Math.PI / 2;
    m.position.x = (x0 + x1) / 2;
    g.add(m);
    if (partial) {
      // flancs des évents
      for (const xx of [x0, x1]) {
        const ring = new THREE.Mesh(new THREE.RingGeometry(r * 0.75, R, 40, 1, Math.PI / 2 + open / 2, Math.PI * 2 - open), steel);
        ring.rotation.y = Math.PI / 2;
        ring.position.x = xx;
        g.add(ring);
      }
    }
  };
  for (const [p0, p1] of ports) {
    seg(x, p0, false);
    seg(p0, p1, true);
    x = p1;
  }
  seg(x, L, false);
  const bore = lathe([[r * 0.75, 0], [r * 0.75, L]], MAT.bore(), 24);
  const front = lathe([[r * 0.75, L], [R - 0.0015, L], [R, L - 0.0015]], steel, 40);
  const back = lathe([[r + 0.0005, -0.006], [R - 0.0008, -0.006], [R - 0.0008, 0], [R, 0.0008]], steel, 40);
  g.add(bore, front, back);
  return g;
}

// Poignées avant (repère : rail en y = 0, la poignée pend vers -Y).
function smallGrip(kind) {
  const mat = MAT.poly();
  const g = new THREE.Group();
  const clamp = railClamp(kind === 'stubby' ? 0.036 : 0.032, mat, false);
  g.add(clamp);
  if (kind === 'stubby') {
    const prof = [[0, -0.062], [0.013, -0.062], [0.0155, -0.059], [0.016, -0.054]];
    for (let i = 0; i < 4; i += 1) {
      const y = -0.054 + i * 0.011;
      prof.push([0.0152, y + 0.0045], [0.0162, y + 0.0085]);
    }
    prof.push([0.0142, -0.011], [0.012, -0.007], [0, -0.007]);
    const body = new THREE.Mesh(new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 36), mat);
    g.add(body);
  } else {
    // butée de main : profil en crochet extrudé
    const s = new THREE.Shape();
    s.moveTo(-0.022, -0.006);
    s.lineTo(0.014, -0.006);
    s.quadraticCurveTo(0.02, -0.007, 0.02, -0.013);
    s.lineTo(0.017, -0.026);
    s.quadraticCurveTo(0.0155, -0.029, 0.012, -0.027);
    s.quadraticCurveTo(0.004, -0.018, -0.022, -0.012);
    s.lineTo(-0.022, -0.006);
    const geo = new THREE.ExtrudeGeometry(s, { depth: 0.018, bevelEnabled: true, bevelThickness: 0.0015, bevelSize: 0.0012, bevelSegments: 3, curveSegments: 10 });
    geo.translate(0, 0, -0.009);
    g.add(new THREE.Mesh(geo, mat));
  }
  return g;
}

// Talon de chargeur étendu : rehausse (couleur du chargeur) + semelle aluminium biseautée, dans l'axe du chargeur.
function magPad(foot, ext = 0.018) {
  const g = new THREE.Group();
  const sleeve = rounded(foot.w, ext, foot.d, 0.003, MAT.poly(), 0.0008);
  sleeve.position.y = -ext / 2 + 0.001;
  const alu = new THREE.MeshPhysicalMaterial({ color: 0xb9bec4, roughness: 0.28, metalness: 1, clearcoat: 0.6, clearcoatRoughness: 0.2 });
  const plate = rounded(foot.w * 1.1 + 0.004, 0.008, foot.d * 1.12 + 0.002, 0.004, alu, 0.0022);
  plate.position.y = -ext - 0.003;
  plate.userData.pad = true;
  // lèvre avant de préhension
  const lip = rounded(0.006, 0.011, foot.d * 1.12 + 0.002, 0.0025, alu, 0.0018);
  lip.position.set(foot.w * 0.55 + 0.004, -ext - 0.0045, 0);
  lip.userData.pad = true;
  g.add(lip);
  g.add(sleeve, plate);
  g.rotation.z = foot.angle;
  return g;
}

// Extension de magasin tubulaire : tube, bouchon et collier sur le canon.
function tubeExt(len, rTube, gap) {
  const g = new THREE.Group();
  const ano = MAT.ano();
  g.add(lathe([[rTube, 0], [rTube, len - 0.012], [rTube + 0.0012, len - 0.011], [rTube + 0.0012, len - 0.002], [rTube - 0.001, len], [0, len]], ano, 36));
  const clampMat = MAT.steel();
  const c1 = lathe([[rTube + 0.0022, len - 0.03], [rTube + 0.0022, len - 0.018]], clampMat, 36);
  const bridge = rounded(0.012, gap, 0.012, 0.002, clampMat);
  bridge.position.set(len - 0.024, gap / 2, 0);
  g.add(c1, bridge);
  return g;
}

export class ArmoryScene {
  constructor(canvas) {
    this.stage = new Stage3D(canvas, { fov: 26, near: 0.01, far: 60, env: 1.35 });
    this.ok = this.stage.ok;
    this.rig = null;
    this.acc = new Map();
    this.box = null;
    this.particles = [];
    this.rec = { x: 0, vx: 0, a: 0, va: 0 };
    this.slideT = 1;
    this.locked = false;
    this.flashT = 0;
    this.puffT = 0;
    this.token = 0;
    if (!this.ok) return;
    const st = this.stage;
    const ctl = st.controls;
    ctl.minPolarAngle = 0.25;
    ctl.maxPolarAngle = Math.PI - 0.25;
    ctl.rotateSpeed = 0.85;
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(1.5, 3, 2.5);
    const rim = new THREE.DirectionalLight(0x9fc4ff, 0.8);
    rim.position.set(-2, 1, -2);
    st.scene.add(key, rim, new THREE.HemisphereLight(0xdde6f0, 0x15171a, 0.5));
    // effets partagés
    this.flash = sprite(0xffb050);
    this.jets = [sprite(0xffa040), sprite(0xffa040)];
    this.puff = sprite(0x9aa0a8);
    this.flashLight = new THREE.PointLight(0xffa24a, 0, 2.5, 2);
    st.scene.add(this.flash, ...this.jets, this.puff, this.flashLight);
    this.laser = new THREE.Mesh(new THREE.CylinderGeometry(0.0016, 0.0016, 12, 6),
      new THREE.MeshBasicMaterial({ color: 0x38ff6a, transparent: true, opacity: 0.85, depthWrite: false, toneMapped: false }));
    this.laser.userData.fx = true;
    this.laser.rotation.z = -Math.PI / 2;
    this.laser.visible = false;
    this.beam = new THREE.SpotLight(0xfff4e0, 0, 6, 0.32, 0.6, 1.2);
    this.cone = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1.1, 24, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xfff1d6, transparent: true, opacity: 0.07, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
    this.cone.userData.fx = true;
    this.cone.rotation.z = Math.PI / 2;
    this.cone.visible = false;
    st.onFrame = () => false;
  }

  setActive(on) { if (this.ok) this.stage.setActive(on); }

  fit(w, h) {
    if (!this.ok) return;
    this.stage.resize(w, h);
    if (this.rig) this.frame(true);
  }

  // ---------- préparation d'une arme (une fois par visite) ----------

  async prepare(w) {
    const M = w.model;
    const obj = (await loadModel(M.file)).clone(true);
    if (M.remove) for (const n of topNodes(obj, M.remove)) n.removeFromParent();
    if (M.cutRaw) {
      for (const m of meshesOf(obj)) {
        const t = splitMesh(m, obj, (v) => v.z < M.cutRaw.z);
        if (t) t.removeFromParent();
      }
    }
    const L = w.specs.length / 1000;
    const body = normalize(obj, { rotate: M.rotate, length: L, axis: 'x', ground: false });
    body.updateMatrixWorld(true);

    // bouche : centre des sommets les plus en avant
    let maxX = -Infinity;
    const v = new THREE.Vector3();
    const pts = [];
    for (const m of meshesOf(body)) {
      const p = m.geometry.attributes.position;
      for (let i = 0; i < p.count; i += 1) {
        v.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld);
        if (v.x > maxX - 0.006) pts.push(v.clone());
        if (v.x > maxX) maxX = v.x;
      }
    }
    const near = pts.filter((p) => p.x > maxX - 0.003);
    const tip = near.reduce((a, p) => a.add(p), new THREE.Vector3()).divideScalar(Math.max(1, near.length));

    // pièces mobiles
    const parts = {};
    const group = (name) => {
      if (!parts[name]) {
        parts[name] = new THREE.Group();
        body.add(parts[name]);
      }
      return parts[name];
    };
    const take = (name, re) => { for (const n of topNodes(body, re)) group(name).attach(n); };
    const carve = (name, test) => {
      for (const m of meshesOf(body)) {
        if (Object.values(parts).some((g) => g !== parts[name] && m.parent && isIn(m, g))) continue;
        const t = splitMesh(m, body, test);
        if (t) group(name).attach(t);
      }
    };
    const isIn = (m, g) => { for (let p = m.parent; p; p = p.parent) if (p === g) return true; return false; };
    if (M.magExt) take('magExt', M.magExt);
    if (M.mag) take('mag', M.mag);
    if (M.magBox) carve('mag', inBox(M.magBox));
    if (M.stock) take('stock', M.stock);
    if (M.stockBox) carve('stock', inBox(M.stockBox));
    if (M.optic) take('optic0', M.optic);
    if (M.slide) take('slide', M.slide);
    if (M.slideAbove != null) carve('slide', (p) => p.y > M.slideAbove);
    if (M.bolt) take('bolt', M.bolt);
    if (parts.magExt && parts.mag) parts.mag.add(parts.magExt);

    // matériaux teintables (clonés : le modèle en cache reste intact)
    const metal = [];
    const poly = [];
    const clones = new Map();
    for (const m of meshesOf(body)) {
      const n = m.material.name || '';
      const onSlide = parts.slide && isIn(m, parts.slide);
      const role = onSlide && M.metal ? 'metal' : M.poly && M.poly.test(n) ? 'poly' : M.metal && M.metal.test(n) ? 'metal' : null;
      if (!role) continue;
      const k = `${role}:${m.material.uuid}`;
      if (!clones.has(k)) {
        const c = m.material.clone();
        clones.set(k, c);
        (role === 'metal' ? metal : poly).push(c);
      }
      m.material = clones.get(k);
    }

    // repère de recul : pivot au niveau de la poignée
    const mm = w.mounts;
    const at = (p) => new THREE.Vector3(tip.x - (mm.muzzle.x - p.x) / 1000, tip.y + (p.y - mm.muzzle.y) / 1000, tip.z);
    const pivot = at(mm.pivot);
    const recoil = new THREE.Group();
    recoil.position.copy(pivot);
    body.position.sub(pivot);
    recoil.add(body);
    const root = new THREE.Group();
    root.add(recoil);
    const box = new THREE.Box3().setFromObject(root);
    const shadow = contactShadow(L * 1.3, Math.max(0.12, L * 0.35), 0.55);
    shadow.position.y = box.min.y - 0.025;
    root.add(shadow);
    return { w, root, recoil, body, parts, tip, at, metal, poly, mounts: {}, L, box };
  }

  // ---------- montage d'une configuration ----------

  async build(w, c) {
    if (!this.ok) return;
    const token = ++this.token;
    this.cfg = c;
    let r = this.rig;
    if (!r || r.w !== w) {
      const prev = r;
      r = await this.prepare(w);
      if (token !== this.token) return;
      if (prev) {
        this.stage.scene.remove(prev.root);
        if (prev.w.model.file !== w.model.file) unloadModel(prev.w.model.file);
      }
      this.rig = r;
      this.stage.scene.add(r.root);
      this.rec = { x: 0, vx: 0, a: 0, va: 0 };
      this.slideT = 1;
      this.locked = false;
      this.frame(true);
    }
    await this.mount(r, c, token);
    if (token !== this.token) return;
    this.colors(c);
    this.applyStock(c.stock === 'extended' ? 1 : 0);
    this.applyFlip(c.magFlip ? 1 : 0);
    if (r.parts.optic0) r.parts.optic0.visible = c.optic === 'rds';
    if (r.parts.magExt) r.parts.magExt.visible = c.mag === 'ext';
    this.setLight(c.lightOn);
    this.setLaser(c.laserMode);
    const b = solidBox(r.recoil);
    const len = (b.max.x - b.min.x) * 1000;
    // un accessoire qui allonge l'arme (silencieux…) : la caméra recule pour tout garder dans le cadre
    if (this.box && this.box.id === w.id && Math.abs(len - this.box.w) > this.box.w * 0.04) this.frame(false);
    else if (!this.box || this.box.id !== w.id) this.frame(true);
    this.box = { w: len, id: w.id };
    this.stage.invalidate();
  }

  async part(key) {
    const a = ACC[key];
    const obj = (await loadModel(a.file)).clone(true);
    if (a.keep) for (const m of meshesOf(obj)) if (!a.keep.test(m.name)) m.removeFromParent();
    const n = normalize(obj, { rotate: a.rotate || [0, 0, 0], length: a.length, axis: 'x', ground: !a.center });
    if (a.color) for (const m of meshesOf(n)) { m.material = m.material.clone(); m.material.color.set(a.color); m.material.roughness = 0.7; }
    return n;
  }

  // Surface de l'arme au droit de p (rayon vertical ou latéral), pour poser l'accessoire dessus.
  surface(r, p, dir) {
    const ray = new THREE.Raycaster();
    const o = p.clone();
    const d = new THREE.Vector3();
    if (dir === 'down') { o.y += 0.25; d.set(0, -1, 0); } else if (dir === 'up') { o.y -= 0.25; d.set(0, 1, 0); } else { o.z += 0.25; d.set(0, 0, -1); }
    ray.set(o, d);
    ray.far = 0.5;
    r.root.updateMatrixWorld(true);
    // le chargeur (souvent courbé sous le garde-main) n'est pas une surface de montage
    const mag = r.parts.mag;
    const onMag = (o) => { for (let q = o; q; q = q.parent) if (q === mag) return true; return false; };
    const hit = ray.intersectObject(r.body, true).find((h) => h.object.visible && !h.object.userData.acc && !(mag && onMag(h.object)));
    if (!hit) return p.clone();
    const q = r.body.worldToLocal(hit.point.clone());
    return q;
  }

  // Bout avant du magasin tubulaire (sous le canon) : sommets les plus en avant dans la bande du tube.
  tubeEnd(r) {
    const tip = r.tip;
    const v = new THREE.Vector3();
    let best = null;
    r.body.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(r.body.matrixWorld).invert();
    for (const m of meshesOf(r.body)) {
      if (m.userData.acc) continue;
      const mat = new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld);
      const p = m.geometry.attributes.position;
      for (let i = 0; i < p.count; i += 1) {
        v.fromBufferAttribute(p, i).applyMatrix4(mat);
        if (v.y < tip.y - 0.016 && v.y > tip.y - 0.045 && Math.abs(v.z - tip.z) < 0.02 && (!best || v.x > best.x)) best = v.clone();
      }
    }
    const x = best ? best.x : tip.x - 0.1;
    // rayon et axe du tube : sommets proches de ce bout
    let y0 = Infinity; let y1 = -Infinity;
    for (const m of meshesOf(r.body)) {
      const mat = new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld);
      const p = m.geometry.attributes.position;
      for (let i = 0; i < p.count; i += 1) {
        v.fromBufferAttribute(p, i).applyMatrix4(mat);
        if (v.x > x - 0.01 && v.x < x - 0.002 && v.y < tip.y - 0.012 && v.y > tip.y - 0.05 && Math.abs(v.z - tip.z) < 0.02) { y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y); }
      }
    }
    const ok = y1 > y0;
    return { x, y: ok ? (y0 + y1) / 2 : tip.y - 0.027, z: tip.z, r: ok ? Math.min(0.014, Math.max(0.008, (y1 - y0) / 2)) : 0.011 };
  }

  async mount(r, c, token) {
    const w = r.w;
    const mm = w.mounts;
    const want = new Map();
    const pistol = w.type === 'pistol';
    // points de montage (repère du corps), recalés sur la surface réelle du modèle
    const top = (m) => this.surface(r, r.body.localToWorld(r.at(m)), 'down');
    const under = (m) => this.surface(r, r.body.localToWorld(r.at(m)), 'up');
    const side = (m) => this.surface(r, r.body.localToWorld(r.at(m)), 'side');

    if (c.optic === 'holo' || (c.optic === 'rds' && !r.parts.optic0)) {
      const p = top(mm.optic);
      want.set('optic', { key: c.optic, pos: p, parent: pistol && r.parts.slide ? 'slide' : null });
      if (c.optic === 'holo' && c.magnifier && w.slots.magnifier && mm.magnifier) {
        want.set('magnifier', { key: 'magnifier', pos: top(mm.magnifier) });
      }
    }
    if (c.laser === 'peq' && mm.laser) {
      want.set('laser', mm.laser.side ? { key: 'peq', pos: side(mm.laser), rot: [Math.PI / 2, 0, 0] } : { key: 'peq', pos: top(mm.laser) });
    }
    if (c.light && c.light !== 'none' && mm.light) {
      const p = mm.light.side ? side(mm.light) : under(mm.light);
      want.set('light', { key: `light:${c.light}`, pos: p, rot: mm.light.side ? [-Math.PI / 2, 0, 0] : [0, 0, 0], make: () => flashlight(c.light) });
    }
    if (c.grip && c.grip !== 'none' && mm.grip) {
      want.set('grip', c.grip === 'angled' ? { key: 'angled', pos: under(mm.grip), hang: true } : { key: `grip:${c.grip}`, pos: under(mm.grip), make: () => smallGrip(c.grip) });
    }
    const tip = r.tip.clone();
    if (c.muzzle === 'sup') {
      const k = pistol ? 'supPistol' : 'supRifle';
      want.set('muzzle', { key: k, pos: tip.clone().add(new THREE.Vector3(ACC[k].length / 2 - 0.006, 0, 0)) });
    } else if (c.muzzle === 'sd' && mm.sd) {
      const x0 = r.at({ x: mm.sd.x0, y: mm.muzzle.y }).x;
      want.set('muzzle', { key: 'sd', pos: new THREE.Vector3(x0 + ACC.sd.length / 2, tip.y, tip.z) });
    } else if (c.muzzle === 'comp') {
      want.set('muzzle', { key: 'comp', pos: tip.clone().add(new THREE.Vector3(-0.004, 0, 0)), make: () => compensator((mm.muzzle.r || 7) / 1000) });
    }
    if (c.mag === 'ext' && !r.parts.magExt) {
      if (w.capacity.tube) {
        const t = r.tube || (r.tube = this.tubeEnd(r));
        const len = Math.max(0.04, tip.x - 0.012 - t.x);
        want.set('magx', { key: 'tubeExt', pos: new THREE.Vector3(t.x - 0.004, t.y, t.z), make: () => tubeExt(len + 0.004, t.r, Math.max(0.004, tip.y - t.y - (mm.muzzle.r || 10) / 1000)) });
      } else if (r.parts.mag) {
        const f = r.foot || (r.foot = magFoot(r.parts.mag, mm.magAxis || [0, -1]));
        want.set('magx', { key: 'pad', pos: r.body.worldToLocal(f.center.clone()), parent: 'mag', make: () => magPad(f) });
      }
    }

    // retire les accessoires qui ne sont plus voulus, pose les nouveaux
    r.mounts ||= {};
    for (const [slot, cur] of Object.entries(r.mounts)) {
      const nx = want.get(slot);
      if (!nx || nx.key !== cur.key) {
        cur.obj.removeFromParent();
        delete r.mounts[slot];
      }
    }
    for (const [slot, d] of want) {
      if (r.mounts[slot]) {
        r.mounts[slot].obj.position.copy(d.pos);
        continue;
      }
      const obj = d.make ? d.make() : await this.part(d.key);
      if (token !== this.token) return;
      obj.traverse((m) => { m.userData.acc = true; });
      if (d.rot) obj.rotation.set(...d.rot);
      const holder = new THREE.Group();
      holder.add(obj);
      if (d.hang) {
        const b = new THREE.Box3().setFromObject(obj);
        obj.position.y -= b.max.y;
      }
      holder.position.copy(d.pos);
      (d.parent && r.parts[d.parent] ? r.parts[d.parent] : r.body).add(holder);
      r.mounts[slot] = { key: d.key, obj: holder, d };
    }
    const lt = r.mounts.light;
    this.emitLight = lt ? lt.obj.children[0] : null;
    const lz = r.mounts.laser;
    this.emitLaser = lz ? lz.obj : null;
  }

  // Pièce seule, hors arme (vignettes du menu de personnalisation : tools/thumbs.cjs).
  async accessory(key) {
    const make = {
      'light:pistol': () => flashlight('pistol'), 'light:rifle': () => flashlight('rifle'),
      comp: () => compensator(0.009), stubby: () => smallGrip('stubby'), handstop: () => smallGrip('handstop'),
    };
    return make[key] ? make[key]() : this.part(key);
  }

  // ---------- caméra ----------

  frame(instant) {
    const r = this.rig;
    if (!r) return;
    const st = this.stage;
    const cam = st.camera;
    const b = solidBox(r.recoil);
    const ctr = b.getCenter(new THREE.Vector3());
    const len = b.max.x - b.min.x;
    const hfov = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2) * cam.aspect);
    const d = Math.max((len * 0.55) / Math.tan(hfov / 2), ((b.max.y - b.min.y) * 0.9) / Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2));
    const dir = new THREE.Vector3(0.16, 0.1, 1).normalize();
    const pos = ctr.clone().addScaledVector(dir, d);
    st.controls.minDistance = d * 0.45;
    st.controls.maxDistance = d * 1.8;
    if (instant) {
      st.controls.target.copy(ctr);
      cam.position.copy(pos);
      st.invalidate();
    } else st.fly(ctr, pos, 700);
  }

  // ---------- teintes ----------

  colors(c) {
    const r = this.rig;
    if (!r) return;
    const mt = METAL.find((m) => m.id === c.metal) || METAL[0];
    const pl = POLY.find((p) => p.id === c.poly) || POLY[0];
    for (const m of r.metal) tintTo(m, mt.orig ? null : mt.hex);
    for (const m of r.poly) tintTo(m, pl.orig ? null : pl.hex);
    const pad = (PADS.find((p) => p.id === c.pad) || PADS[0]).hex;
    const x = r.mounts && r.mounts.magx;
    if (x) x.obj.traverse((m) => { if (m.userData.pad) m.material.color.set(pad); });
    this.stage.invalidate();
  }

  // ---------- crosse, magnifier ----------

  applyStock(t) {
    const r = this.rig;
    if (!r || !r.parts.stock) return;
    const move = r.w.model.stockMove || 0.06;
    const p = r.parts.stock;
    const x0 = p.position.x;
    const x1 = (1 - t) * move; // rétractée : la crosse avance sur son tube
    this.stage.animate(420, (k) => { p.position.x = x0 + (x1 - x0) * k; });
  }

  applyFlip(t) {
    const r = this.rig;
    const m = r && r.mounts && r.mounts.magnifier;
    if (!m) return;
    const o = m.obj;
    const a0 = o.rotation.x;
    const a1 = t ? -Math.PI / 2 : 0;
    this.stage.animate(380, (k) => { o.rotation.x = a0 + (a1 - a0) * k; });
  }

  // ---------- laser, lampe, sélecteur ----------

  setLight(on) {
    const r = this.rig;
    const holder = r && r.mounts && r.mounts.light;
    const st = this.stage;
    if (!holder) {
      this.beam.intensity = 0;
      this.cone.visible = false;
      return;
    }
    const g = holder.obj.children[0];
    const emit = g.userData.emit.clone();
    g.userData.lens.material.emissiveIntensity = on ? 6 : 0;
    if (!this.beam.parent || this.beam.parent !== g) {
      g.add(this.beam, this.beam.target, this.cone);
    }
    this.beam.position.copy(emit);
    this.beam.target.position.copy(emit).add(new THREE.Vector3(3, 0, 0));
    this.cone.position.copy(emit).add(new THREE.Vector3(0.55, 0, 0));
    this.beam.intensity = on ? 30 : 0;
    this.cone.visible = !!on;
    st.invalidate();
  }

  setLaser(mode) {
    const r = this.rig;
    const holder = r && r.mounts && r.mounts.laser;
    if (!holder) {
      this.laser.visible = false;
      this.stage.invalidate();
      return;
    }
    // faisceau rattaché au corps de l'arme (repère en mètres), devant l'émetteur du PEQ
    if (this.laser.parent !== r.body) r.body.add(this.laser);
    r.root.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(holder.obj);
    const front = r.body.worldToLocal(new THREE.Vector3(b.max.x, b.min.y + (b.max.y - b.min.y) * 0.4, (b.min.z + b.max.z) / 2));
    this.laser.position.copy(front).add(new THREE.Vector3(6, 0, 0));
    this.laser.visible = mode === 'vis';
    this.stage.invalidate();
  }

  setSelector() { /* sélecteur non modélisé séparément dans les modèles retenus */ }

  // ---------- tir ----------

  fire({ suppressed, comp, last }) {
    const r = this.rig;
    if (!r) return;
    const w = r.w;
    const rc = w.recoil;
    const c = this.cfg || {};
    const k = (comp ? 0.7 : 1) * (suppressed ? 0.85 : 1) * (c.grip && c.grip !== 'none' ? 0.88 : 1) * (c.stock === 'extended' ? 0.85 : 1);
    const R = this.rec;
    R.vx += rc.kick * 34 * (0.85 + Math.random() * 0.3) * (R.x > rc.kick * 0.6 ? 0.35 : 1);
    R.va += rc.rise * 34 * k * (0.8 + Math.random() * 0.4) * (R.a > rc.rise * 0.8 ? 0.3 : 1);
    if (rc.slide || r.parts.bolt) {
      this.slideT = 0;
      this.locked = !!last;
    }
    // flamme à la bouche (ou au bout du silencieux)
    const end = this.muzzleWorld();
    const sc = (0.05 + Math.random() * 0.04) * (w.type === 'pistol' ? 0.8 : 1.2);
    this.flash.position.copy(end).add(new THREE.Vector3(sc * 0.35, 0, 0));
    this.flash.scale.set(sc * 1.6, sc, 1);
    this.flash.material.opacity = suppressed ? 0 : 1;
    this.flashLight.position.copy(end);
    this.flashLight.intensity = suppressed ? 0.4 : 3.5;
    for (const [i, j] of this.jets.entries()) {
      j.position.copy(end).add(new THREE.Vector3(-0.012 - i * 0.012, 0.03, 0));
      j.scale.set(0.02, 0.05, 1);
      j.material.opacity = comp && !suppressed ? 0.9 : 0;
    }
    this.flashT = 0.045;
    this.puff.position.copy(end);
    this.puff.material.opacity = suppressed ? 0.35 : 0.22;
    this.puffT = 0.5;
    this.eject();
    this.stage.invalidate();
  }

  muzzleWorld() {
    const r = this.rig;
    const m = r.mounts && r.mounts.muzzle;
    r.root.updateMatrixWorld(true);
    if (m) {
      const b = new THREE.Box3().setFromObject(m.obj);
      return new THREE.Vector3(b.max.x, (b.min.y + b.max.y) / 2, (b.min.z + b.max.z) / 2);
    }
    return r.body.localToWorld(r.tip.clone());
  }

  eject() {
    const r = this.rig;
    const w = r.w;
    const kind = w.type === 'shotgun' ? 'shotgun' : w.type === 'rifle' ? 'rifle' : 'pistol';
    const dims = { pistol: [0.0048, 0.019], rifle: [0.0048, 0.045], shotgun: [0.0105, 0.07] }[kind];
    const g = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.CylinderGeometry(dims[0], dims[0], dims[1], 12), kind === 'shotgun' ? HULL : BRASS);
    g.add(hull);
    if (kind === 'shotgun') {
      const head = new THREE.Mesh(new THREE.CylinderGeometry(dims[0] * 1.04, dims[0] * 1.04, 0.012, 12), BRASS);
      head.position.y = -dims[1] / 2 + 0.006;
      g.add(head);
    }
    const p = r.body.localToWorld(r.at(w.mounts.eject));
    g.position.copy(p);
    this.stage.scene.add(g);
    this.particles.push({
      g, t: 0,
      v: new THREE.Vector3(-0.4 - Math.random() * 0.4, 1.4 + Math.random() * 0.6, 1.1 + Math.random() * 0.6),
      s: new THREE.Vector3(Math.random() * 20, Math.random() * 20, Math.random() * 20),
    });
  }

  lockSlide(on) {
    this.locked = on;
    this.slideT = 1;
    this.applySlide(on ? this.slideTravel() * 0.92 : 0);
  }

  slideTravel() {
    const r = this.rig;
    if (!r) return 0;
    return (r.w.recoil.slide || 40) / 1000;
  }

  applySlide(off) {
    const r = this.rig;
    if (!r) return;
    const p = r.parts.slide || r.parts.bolt;
    if (p) p.position.x = -off;
  }

  // ---------- rechargement (promesses, comme l'ancien rendu) ----------

  magOut(dur = 320) {
    const p = this.rig && this.rig.parts.mag;
    if (!p) return this.dip(dur);
    const ax = new THREE.Vector3(...(this.rig.w.mounts.magAxis || [0, -1]), 0).normalize();
    return this.stage.animate(dur, (k) => {
      p.position.copy(ax).multiplyScalar(0.14 * k);
      p.visible = k < 0.98;
    }, (k) => k * k * k);
  }

  magIn(dur = 360) {
    const p = this.rig && this.rig.parts.mag;
    if (!p) return this.dip(dur, true);
    const ax = new THREE.Vector3(...(this.rig.w.mounts.magAxis || [0, -1]), 0).normalize();
    p.visible = true;
    return this.stage.animate(dur, (k) => { p.position.copy(ax).multiplyScalar(0.09 * (1 - k)); }, ease.out3);
  }

  // Chargeur non séparable du modèle : l'arme bascule légèrement pendant la manipulation.
  dip(dur, back = false) {
    const r = this.rig;
    if (!r) return Promise.resolve();
    const a0 = r.root.rotation.x;
    const a1 = back ? 0 : 0.35;
    return this.stage.animate(dur, (k) => { r.root.rotation.x = a0 + (a1 - a0) * k; });
  }

  rack(dist = 55, back = 220, fwd = 120) {
    const r = this.rig;
    const p = r && (r.parts.bolt || r.parts.slide);
    if (!p) return new Promise((res) => setTimeout(res, back + fwd));
    const d = dist / 1000;
    return this.stage.animate(back, (k) => { p.position.x = -d * k; }, ease.out3)
      .then(() => this.stage.animate(fwd, (k) => { p.position.x = -d * (1 - k); }, (k) => k * k * k));
  }

  shellIn() {
    const r = this.rig;
    if (!r) return Promise.resolve();
    const shell = cylinder(0.0105, 0.0105, 0.07, HULL);
    const p = r.body.localToWorld(r.at(r.w.mounts.shell || r.w.mounts.eject));
    this.stage.scene.add(shell);
    return this.stage.animate(240, (k) => {
      shell.position.copy(p).add(new THREE.Vector3(0.02 * (1 - k), -0.07 * (1 - k) - 0.02, 0.01));
    }, ease.out3).then(() => { shell.removeFromParent(); shell.geometry.dispose(); });
  }

  // ---------- boucle ----------

  tick(dt) {
    const r = this.rig;
    if (!r || !this.ok) return false;
    const w = 38;
    const z = 0.62;
    const R = this.rec;
    R.vx += (-w * w * R.x - 2 * z * w * R.vx) * dt;
    R.x += R.vx * dt;
    R.va += (-w * w * R.a - 2 * z * w * R.va) * dt;
    R.a += R.va * dt;
    const maxA = r.w.recoil.rise * 1.6;
    if (R.a > maxA) { R.a = maxA; R.va = Math.min(R.va, 0); }
    const maxX = r.w.recoil.kick * 1.4;
    if (R.x > maxX) { R.x = maxX; R.vx = Math.min(R.vx, 0); }
    const moving = Math.abs(R.x) > 0.01 || Math.abs(R.vx) > 0.05 || Math.abs(R.a) > 0.005 || Math.abs(R.va) > 0.02;
    r.recoil.position.x = -R.x / 1000 + (r.pivotX ?? (r.pivotX = r.recoil.position.x));
    r.recoil.rotation.z = THREE.MathUtils.degToRad(R.a);

    let busy = moving;
    if (this.slideT < 1) {
      this.slideT = Math.min(1, this.slideT + dt / 0.07);
      const t = this.slideT;
      const travel = this.slideTravel();
      let off = Math.sin(Math.min(1, t * 1.6) * Math.PI) * travel;
      if (this.locked && t > 0.3) off = travel * 0.92;
      this.applySlide(off);
      busy = true;
    }
    if (this.flashT > 0) {
      this.flashT -= dt;
      if (this.flashT <= 0) {
        this.flash.material.opacity = 0;
        for (const j of this.jets) j.material.opacity = 0;
        this.flashLight.intensity = 0;
      }
      busy = true;
    }
    if (this.puffT > 0) {
      this.puffT -= dt;
      const k = 1 - Math.max(0, this.puffT) / 0.5;
      const s = 0.04 + k * 0.16;
      this.puff.scale.set(s, s, 1);
      this.puff.position.y += dt * 0.08;
      this.puff.position.x += dt * 0.12;
      this.puff.material.opacity *= 0.93;
      if (this.puffT <= 0) this.puff.material.opacity = 0;
      busy = true;
    }
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.t += dt;
      p.v.y -= 9.8 * dt;
      p.g.position.addScaledVector(p.v, dt);
      p.g.rotation.x += p.s.x * dt;
      p.g.rotation.y += p.s.y * dt;
      p.g.rotation.z += p.s.z * dt;
      if (p.t > 0.75) {
        p.g.removeFromParent();
        p.g.traverse((m) => { if (m.isMesh) m.geometry.dispose(); });
        this.particles.splice(i, 1);
      }
      busy = true;
    }
    if (busy) this.stage.invalidate();
    return busy;
  }
}
