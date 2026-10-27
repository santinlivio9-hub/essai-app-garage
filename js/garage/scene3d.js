// Garage 3D : showroom complet, les cinq voitures sur leurs emplacements, orbite autour de la voiture
// active, matériaux (teinte, vernis, vitres, jantes, étriers, feux) pilotés en direct.
import { THREE, Stage3D, loadModel, normalize, contactShadow, splitMesh } from '../core/stage3d.js';

const ROOM = { file: 'assets/models/showroom.glb', scale: 0.035 };
// Bande nord de la galerie (repérée au lancer de rayons) : piliers en z ≈ −20,5 et z ≈ −13 tous les 7,5 m
// (x = −29,5, −22, −14, −6,5, 1, 8,5…), cloisons en z ≈ −6. Les voitures sont entre deux piliers.
const SLOTS = [-25.75, -10.75, 4.75, 19.75, 34.75].map((x) => new THREE.Vector3(x, 0, -16.8));
const BOUNDS = { x0: -35.5, x1: 44.5, z0: -20.3, z1: -8, y0: 0.25, y1: 3.9 };
const VIEW = new THREE.Vector3(0.74, 0.22, 0.6).normalize(); // trois-quarts avant droit

// Vernis : réglages PBR de la peinture (MeshPhysicalMaterial).
const FINISH = {
  gloss: { metalness: 0.05, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.03, iridescence: 0 },
  metal: { metalness: 0.62, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.04, iridescence: 0 },
  pearl: { metalness: 0.35, roughness: 0.26, clearcoat: 1, clearcoatRoughness: 0.04, iridescence: 0.85 },
  satin: { metalness: 0.32, roughness: 0.5, clearcoat: 0.6, clearcoatRoughness: 0.38, iridescence: 0 },
  mat: { metalness: 0.12, roughness: 0.8, clearcoat: 0, clearcoatRoughness: 0, iridescence: 0 },
};

// Jantes : teinte multipliée à la texture d'origine (ou couleur pleine si le modèle n'en a pas).
const RIMS = {
  silver: { tint: '#ffffff', flat: '#c9ced3', rough: 1 },
  gunmetal: { tint: '#8c939b', flat: '#5d636a', rough: 1 },
  black: { tint: '#3b3e43', flat: '#18191b', rough: 0.8 },
  'black-mat': { tint: '#37393c', flat: '#1f2022', rough: 2.2 },
  bronze: { tint: '#dcb27a', flat: '#8c6c40', rough: 1 },
  chrome: { tint: '#ffffff', flat: '#e4e7ea', rough: 0.35 },
};

const TRIM = {
  black: () => new THREE.MeshStandardMaterial({ color: 0x0c0d0e, roughness: 0.55, metalness: 0.1 }),
  chrome: () => new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.1, metalness: 1 }),
  interior: () => new THREE.MeshStandardMaterial({ color: 0x1b1c1e, roughness: 0.7, metalness: 0.05 }),
};

function paintMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0x888888, iridescenceIOR: 1.3, iridescenceThicknessRange: [260, 720], envMapIntensity: 1.15,
  });
}

function glassMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0x05070a, metalness: 0, roughness: 0.04, transparent: true, opacity: 0.5, envMapIntensity: 1.6, depthWrite: false,
  });
}

function lampMaterial(src) {
  const m = src.clone();
  m.emissive = new THREE.Color(0xffffff);
  m.emissiveMap = src.map || null;
  m.emissiveIntensity = 0;
  return m;
}

// Nœuds dont le nom correspond, sans leurs descendants (déjà inclus).
function topNodes(root, re) {
  const out = [];
  root.traverse((n) => {
    if (n !== root && re.test(n.name) && !out.some((o) => isAncestor(o, n))) out.push(n);
  });
  return out;
}

function isAncestor(a, n) {
  for (let p = n.parent; p; p = p.parent) if (p === a) return true;
  return false;
}

// Regroupe des pièces sous un pivot placé à la charnière, sans les déplacer.
function makePivot(body, nodes, kind) {
  const box = new THREE.Box3();
  for (const n of nodes) box.expandByObject(n);
  const pivot = new THREE.Group();
  const c = box.getCenter(new THREE.Vector3());
  if (kind === 'hood') pivot.position.set(0, box.max.y, box.min.z); // charnière côté pare-brise
  else pivot.position.set(c.x > 0 ? box.max.x : box.min.x, c.y, box.max.z); // charnière avant de portière
  body.add(pivot);
  body.updateMatrixWorld(true);
  for (const n of nodes) pivot.attach(n);
  pivot.userData.side = Math.sign(c.x) || 1;
  pivot.userData.box = box;
  return pivot;
}

export class GarageScene {
  constructor(canvas, cars, { onProgress } = {}) {
    this.cars = cars;
    this.stage = new Stage3D(canvas, { fov: 38, near: 0.1, far: 220, env: 0.9 });
    this.ok = this.stage.ok;
    this.rigs = new Map();
    this.pending = new Map();
    this.onProgress = onProgress;
    this.active = -1;
    if (!this.ok) return;
    const st = this.stage;
    const ctl = st.controls;
    ctl.minDistance = 3.4;
    ctl.maxDistance = 10.5;
    ctl.minPolarAngle = 0.32;
    ctl.maxPolarAngle = 1.5;
    ctl.addEventListener('change', () => this.clampCamera());

    st.scene.add(new THREE.HemisphereLight(0xdfe8f5, 0x202326, 0.6));
    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(-6, 10, 8);
    st.scene.add(key);

    // feux et retour de flamme : un seul jeu, déplacé sur la voiture active
    this.beams = [-1, 1].map((s) => {
      const l = new THREE.SpotLight(0xeaf2ff, 0, 30, 0.42, 0.55, 1.4);
      l.userData.side = s;
      st.scene.add(l, l.target);
      return l;
    });
    this.pop = new THREE.PointLight(0xff7a26, 0, 6, 2);
    st.scene.add(this.pop);
    this.popLevel = 0;
    st.onFrame = (dt) => this.frame(dt);

    // tout élément du décor entre la caméra et la voiture (pilier, kiosque) est découpé
    this.cut = { value: 0 };
    loadModel(ROOM.file).then((room) => {
      room.scale.setScalar(ROOM.scale);
      const done = new Set();
      room.traverse((m) => {
        if (!m.isMesh || done.has(m.material)) return;
        done.add(m.material);
        m.material.onBeforeCompile = (sh) => {
          sh.uniforms.uCut = this.cut;
          sh.vertexShader = sh.vertexShader
            .replace('#include <common>', '#include <common>\nvarying vec3 vCutPos;')
            .replace('#include <begin_vertex>', '#include <begin_vertex>\nvCutPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
          sh.fragmentShader = sh.fragmentShader
            .replace('#include <common>', '#include <common>\nvarying vec3 vCutPos;\nuniform float uCut;')
            .replace('void main() {', 'void main() {\n  if (vCutPos.y > 0.05 && vCutPos.y < 3.7 && length(vViewPosition) < uCut) discard;');
        };
      });
      st.scene.add(room);
      st.invalidate();
    }).catch(() => {});
  }

  setActive(on) { if (this.ok) this.stage.setActive(on); }

  resize(w, h) {
    if (!this.ok) return;
    this.stage.resize(w, h);
    if (this.active >= 0 && !this.view) this.focus(this.active, true);
  }

  // ---------- chargement ----------

  // Charge la voiture i (une seule fois) ; la configuration est appliquée dès qu'elle est prête.
  rig(i) {
    const car = this.cars[i];
    if (this.rigs.has(car.id)) return Promise.resolve(this.rigs.get(car.id));
    if (!this.pending.has(car.id)) {
      this.pending.set(car.id, loadModel(car.model.file).then((obj) => {
        const r = this.build(car, obj, SLOTS[i]);
        this.rigs.set(car.id, r);
        this.stage.scene.add(r.root);
        if (this.cfgOf) this.apply(r, this.cfgOf(car.id));
        this.stage.invalidate();
        return r;
      }));
    }
    return this.pending.get(car.id);
  }

  // Les autres voitures arrivent ensuite, une par une, pour ne pas saturer le réseau ni la mémoire.
  async preloadAll(first) {
    const order = this.cars.map((_, i) => i).sort((a, b) => Math.abs(a - first) - Math.abs(b - first));
    let done = 0;
    for (const i of order) {
      try { await this.rig(i); } catch { /* modèle indisponible : la place reste vide */ }
      done++;
      if (this.onProgress) this.onProgress(done / order.length);
    }
  }

  build(car, obj, slot) {
    const M = car.model;
    const mats = { paint: paintMaterial(), glass: glassMaterial(), rim: [], caliper: [], head: [], tail: [] };
    const seen = new Map();
    const once = (m, f) => {
      if (!seen.has(m)) seen.set(m, f(m));
      return seen.get(m);
    };
    const meshes = [];
    obj.traverse((m) => { if (m.isMesh) meshes.push(m); });

    if (M.meshes) {
      // modèle à matériau unique : rôle attribué pièce par pièce
      const role = {};
      for (const [k, list] of Object.entries(M.meshes)) for (const n of list) role[n] = k;
      const rim = new THREE.MeshPhysicalMaterial({ color: 0xc9ced3, metalness: 1, roughness: 0.28 });
      const lamp = new THREE.MeshPhysicalMaterial({ color: 0xdfe6ee, metalness: 0.9, roughness: 0.15, emissive: 0xffffff, emissiveIntensity: 0 });
      const tail = new THREE.MeshPhysicalMaterial({ color: 0x5a0408, metalness: 0.2, roughness: 0.2, emissive: 0xff1a1a, emissiveIntensity: 0 });
      const black = TRIM.black();
      const interior = TRIM.interior();
      mats.rim.push(rim);
      mats.head.push(lamp);
      mats.tail.push(tail);
      const by = { paint: mats.paint, glass: mats.glass, rim, lamp, tail, black };
      for (const m of meshes) m.material = by[role[m.name]] || interior;
    } else {
      const trims = Object.entries(M.trim || {}).map(([re, k]) => [new RegExp(re), TRIM[k]()]);
      for (const m of meshes) {
        const n = m.material.name || '';
        if (M.paint && M.paint.test(n)) m.material = mats.paint;
        else if (M.glass && M.glass.test(n)) m.material = mats.glass;
        else if (M.rim && M.rim.test(n)) {
          m.material = once(m.material, (src) => {
            const x = src.clone();
            x.userData.rough0 = x.roughness;
            x.userData.textured = !!x.map;
            if (!x.map) { x.metalness = 1; x.roughness = 0.3; x.userData.rough0 = 0.3; }
            mats.rim.push(x);
            return x;
          });
        } else if (M.caliper && M.caliper.test(n)) {
          m.material = once(m.material, (src) => { const x = src.clone(); mats.caliper.push(x); return x; });
        } else if (M.tail && M.tail.test(n)) {
          m.material = once(m.material, (src) => {
            const x = src.clone();
            x.emissive = new THREE.Color(0xff1a1a);
            x.emissiveIntensity = 0;
            mats.tail.push(x);
            return x;
          });
        } else {
          const t = trims.find(([re]) => re.test(n));
          if (t) m.material = t[1];
        }
      }
    }

    const body = normalize(obj, { rotate: M.rotate, length: car.length / 1000, axis: 'z' });

    // blocs optiques : la moitié avant devient le phare (émissif), l'arrière reste tel quel
    if (M.lamp) {
      const lampMeshes = [];
      body.traverse((m) => { if (m.isMesh && M.lamp.test(m.material.name || '')) lampMeshes.push(m); });
      const head = new Map();
      for (const m of lampMeshes) {
        const front = splitMesh(m, body, (v) => v.z > 0);
        if (!front) continue;
        if (!head.has(m.material)) {
          const x = lampMaterial(m.material);
          head.set(m.material, x);
          mats.head.push(x);
        }
        front.material = head.get(m.material);
      }
    }

    // pièces articulées (pivots calculés dans le repère de la voiture, avant placement)
    const hingeOf = (re, kind) => {
      const nodes = re ? topNodes(body, re) : [];
      return nodes.length ? makePivot(body, nodes, kind) : null;
    };
    const hood = hingeOf(M.hood, 'hood');
    const door = hingeOf(M.door, 'door');

    const size = new THREE.Box3().setFromObject(body).getSize(new THREE.Vector3());
    const root = new THREE.Group();
    root.position.copy(slot);
    const shake = new THREE.Group();
    shake.add(body);
    root.add(shake, contactShadow(size.x * 1.35, size.z * 1.18));

    return { car, root, body, shake, mats, size, slot, hood, door };
  }

  get current() { return this.rigs.get(this.cars[this.active]?.id); }

  apply(r, c) {
    if (!r || !c) return;
    this.paint(r, c.paint);
    this.finish(r, c.finish);
    this.tint(r, c.tint);
    this.rimFinish(r, c.rimFinish);
    this.caliper(r, c.caliper);
    this.lamps(r, c.drl, c.lights);
  }

  // ---------- caméra ----------

  fitDistance() {
    const cam = this.stage.camera;
    const v = THREE.MathUtils.degToRad(cam.fov);
    const h = 2 * Math.atan(Math.tan(v / 2) * cam.aspect);
    return THREE.MathUtils.clamp(2.7 / Math.sin(Math.min(v, h) / 2), 4.2, 10.5);
  }

  home(i) {
    const target = SLOTS[i].clone().add(new THREE.Vector3(0, 0.62, 0));
    return { target, position: target.clone().addScaledVector(VIEW, this.fitDistance()) };
  }

  // Amène la caméra sur la voiture i (glissé dans le showroom d'une place à l'autre).
  async focus(i, instant = false) {
    if (!this.ok) return;
    const st = this.stage;
    const prev = this.active;
    this.active = i;
    this.view = null;
    const { target, position } = this.home(i);
    this.attachLights();
    if (instant || prev < 0) {
      st.controls.target.copy(target);
      st.camera.position.copy(position);
      st.invalidate();
      return;
    }
    // détour par le recul : on voit défiler le showroom entre deux places
    const mid = target.clone().lerp(st.controls.target, 0.5);
    const up = mid.clone().add(new THREE.Vector3(0, 1.4, 9.5));
    const p0 = st.camera.position.clone();
    const t0 = st.controls.target.clone();
    await st.animate(1250, (k) => {
      st.controls.target.lerpVectors(t0, target, k);
      const a = p0.clone().lerp(up, k);
      const b = up.clone().lerp(position, k);
      st.camera.position.lerpVectors(a, b, k);
    });
  }

  clampCamera() {
    const p = this.stage.camera.position;
    p.x = THREE.MathUtils.clamp(p.x, BOUNDS.x0, BOUNDS.x1);
    p.y = THREE.MathUtils.clamp(p.y, BOUNDS.y0, BOUNDS.y1);
    p.z = THREE.MathUtils.clamp(p.z, BOUNDS.z0, BOUNDS.z1);
  }

  // ---------- matériaux ----------

  paint(r, hex) {
    if (!r) return;
    r.mats.paint.color.set(hex);
    this.stage.invalidate();
  }

  finish(r, id) {
    if (!r) return;
    Object.assign(r.mats.paint, FINISH[id] || FINISH.gloss);
    r.mats.paint.needsUpdate = true;
    this.stage.invalidate();
  }

  tint(r, pct) {
    if (!r) return;
    r.mats.glass.opacity = 0.1 + (pct / 100) * 0.86;
    this.stage.invalidate();
  }

  rimFinish(r, id) {
    if (!r) return;
    const f = RIMS[id] || RIMS.silver;
    for (const m of r.mats.rim) {
      m.color.set(m.userData.textured === false || !m.map ? f.flat : f.tint);
      m.roughness = Math.min(1, (m.userData.rough0 ?? 0.3) * f.rough);
      if (id === 'chrome') m.metalness = 1;
    }
    this.stage.invalidate();
  }

  caliper(r, hex) {
    if (!r) return;
    for (const m of r.mats.caliper) m.color.set(hex);
    this.stage.invalidate();
  }

  lamps(r, drl, lights) {
    if (!r) return;
    for (const m of r.mats.head) m.emissiveIntensity = lights ? 2.6 : drl ? 0.75 : 0;
    for (const m of r.mats.tail) m.emissiveIntensity = lights ? 2 : 0;
    if (r === this.current) for (const b of this.beams) b.intensity = lights ? 160 : 0;
    this.stage.invalidate();
  }

  attachLights() {
    const r = this.current;
    const c = this.cfgOf && r ? this.cfgOf(r.car.id) : null;
    const L = r ? r.size.z : 4.6;
    const slot = SLOTS[this.active];
    for (const b of this.beams) {
      const s = b.userData.side;
      b.position.set(slot.x + s * 0.62, 0.68, slot.z + L / 2 - 0.15);
      b.target.position.set(slot.x + s * 1.1, 0, slot.z + L / 2 + 9);
      b.intensity = c && c.lights ? 160 : 0;
    }
    this.pop.position.set(slot.x + 0.45, 0.38, slot.z - L / 2 - 0.25);
  }

  // ---------- capot, portière, vie du moteur ----------

  async hood(open) {
    const r = this.current;
    if (!r || !r.hood) return;
    const st = this.stage;
    const p = r.hood;
    const a0 = p.rotation.x;
    const a1 = open ? -0.95 : 0;
    const slot = r.slot;
    const L = r.size.z;
    if (open) {
      this.view = 'hood';
      const target = slot.clone().add(new THREE.Vector3(0, 0.72, L * 0.3));
      st.fly(target, target.clone().add(new THREE.Vector3(1.2, 2.4, 2.9)), 1000);
    } else if (this.view === 'hood') {
      this.view = null;
      const h = this.home(this.active);
      st.fly(h.target, h.position, 1000);
    }
    await st.animate(900, (k) => { p.rotation.x = a0 + (a1 - a0) * k; });
  }

  async door(open) {
    const r = this.current;
    if (!r || !r.door) return;
    const st = this.stage;
    const p = r.door;
    const s = p.userData.side;
    const a0 = p.rotation.y;
    const a1 = open ? -s * 1.05 : 0;
    if (open) {
      this.view = 'door';
      const target = r.slot.clone().add(new THREE.Vector3(s * 0.7, 0.85, 0.2));
      st.fly(target, target.clone().add(new THREE.Vector3(s * 4.4, 1.3, 2.4)), 1000);
    } else if (this.view === 'door') {
      this.view = null;
      const h = this.home(this.active);
      st.fly(h.target, h.position, 1000);
    }
    await st.animate(850, (k) => { p.rotation.y = a0 + (a1 - a0) * k; });
  }

  // Vibrations de caisse (amplitudes en px de l'ancien rendu, converties en mètres / radians).
  shake(y, roll) {
    const r = this.current;
    if (!r) return;
    const py = y * 0.0011;
    const rz = THREE.MathUtils.degToRad(-roll) * 0.6;
    if (Math.abs(r.shake.position.y - py) < 1e-5 && Math.abs(r.shake.rotation.z - rz) < 1e-5) return;
    r.shake.position.y = py;
    r.shake.rotation.z = rz;
    this.stage.invalidate();
  }

  flash(amount) {
    this.popLevel = Math.max(this.popLevel, amount);
    this.stage.invalidate();
  }

  frame(dt) {
    const st = this.stage;
    this.cut.value = st.camera.position.distanceTo(st.controls.target) - 3.1;
    if (this.popLevel <= 0.001) {
      if (this.pop.intensity) this.pop.intensity = 0;
      return false;
    }
    this.pop.intensity = 40 * this.popLevel;
    this.popLevel *= Math.exp(-dt * 18);
    return true;
  }
}
