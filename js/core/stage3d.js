// Socle Three.js partagé (Garage + Armurerie) : rendu à la demande, éclairage IBL, orbite bornée,
// chargement des modèles glTF (Meshopt) avec cache, normalisation à l'échelle réelle.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

export { THREE };

const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const cache = new Map();

// Chaque fichier n'est téléchargé et décodé qu'une fois ; le service worker le garde hors-ligne.
export function loadModel(url) {
  if (!cache.has(url)) {
    cache.set(url, loader.loadAsync(url).then((g) => g.scene).catch((e) => {
      cache.delete(url);
      throw e;
    }));
  }
  return cache.get(url);
}

export const ease = {
  out3: (k) => 1 - Math.pow(1 - k, 3),
  inOut3: (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
};

// Oriente un modèle (avant / bouche vers `forward` après rotation), le met à l'échelle réelle
// (longueur en mètres le long de l'axe avant) et le pose au sol, centré.
// `rotate` : rotation [x, y, z] en degrés appliquée avant la mesure.
export function normalize(obj, { rotate = [0, 0, 0], length, axis = 'z', ground = true }) {
  const wrap = new THREE.Group();
  obj.rotation.set(...rotate.map(THREE.MathUtils.degToRad));
  wrap.add(obj);
  wrap.updateMatrixWorld(true);
  let box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3());
  const s = length / size[axis];
  obj.scale.multiplyScalar(s);
  wrap.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(obj);
  const c = box.getCenter(new THREE.Vector3());
  obj.position.sub(new THREE.Vector3(c.x, ground ? box.min.y : c.y, c.z));
  wrap.updateMatrixWorld(true);
  return wrap;
}

// Détache d'un mesh les triangles dont le centre vérifie test(v), v exprimé dans le repère de `root`
// (ex. séparer les blocs optiques avant/arrière fusionnés dans un même mesh). Renvoie le nouveau mesh.
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _c = new THREE.Vector3();
export function splitMesh(mesh, root, test) {
  const g = mesh.geometry;
  const pos = g.attributes.position;
  const idx = g.index ? g.index.array : Array.from({ length: pos.count }, (_, i) => i);
  root.updateMatrixWorld(true);
  const m = new THREE.Matrix4().copy(root.matrixWorld).invert().multiply(mesh.matrixWorld);
  const keep = [];
  const take = [];
  for (let i = 0; i < idx.length; i += 3) {
    _a.fromBufferAttribute(pos, idx[i]);
    _b.fromBufferAttribute(pos, idx[i + 1]);
    _c.fromBufferAttribute(pos, idx[i + 2]);
    _a.add(_b).add(_c).divideScalar(3).applyMatrix4(m);
    (test(_a) ? take : keep).push(idx[i], idx[i + 1], idx[i + 2]);
  }
  if (!take.length) return null;
  const part = (list) => {
    const out = new THREE.BufferGeometry();
    for (const k in g.attributes) out.setAttribute(k, g.attributes[k]);
    out.setIndex(list);
    return out;
  };
  const twin = new THREE.Mesh(part(take), mesh.material);
  twin.name = `${mesh.name}~part`;
  twin.position.copy(mesh.position);
  twin.quaternion.copy(mesh.quaternion);
  twin.scale.copy(mesh.scale);
  mesh.parent.add(twin);
  if (keep.length) mesh.geometry = part(keep);
  else mesh.visible = false;
  return twin;
}

// Texture d'ombre de contact (dégradé radial), partagée.
let shadowTex = null;
export function contactShadow(w, l, opacity = 0.75) {
  if (!shadowTex) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(64, 64, 4, 64, 64, 64);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(0.55, 'rgba(0,0,0,.55)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 128, 128);
    shadowTex = new THREE.CanvasTexture(c);
  }
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, l),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity, depthWrite: false, toneMapped: false }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.004;
  m.renderOrder = 1;
  return m;
}

export class Stage3D {
  constructor(canvas, { fov = 32, near = 0.05, far = 400, env = 1 } = {}) {
    this.canvas = canvas;
    this.dirty = true;
    this.anims = new Set();
    this.active = false;
    this.ok = true;
    try {
      this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch {
      this.ok = false;
      return;
    }
    const r = this.renderer;
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); // 3× sur iPhone = trop coûteux
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1;
    r.outputColorSpace = THREE.SRGBColorSpace;
    this.scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(r);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = env;
    pmrem.dispose();
    this.camera = new THREE.PerspectiveCamera(fov, 1, near, far);
    this.controls = new OrbitControls(this.camera, canvas);
    const ctl = this.controls;
    ctl.enableDamping = true;
    ctl.dampingFactor = 0.09;
    ctl.enablePan = false;
    ctl.rotateSpeed = 0.75;
    ctl.zoomSpeed = 0.8;
    ctl.addEventListener('change', () => { this.dirty = true; });
    // bord gauche réservé au geste « retour » d'iOS
    canvas.addEventListener('pointerdown', (e) => {
      if (e.clientX < 22) e.stopImmediatePropagation();
    }, { capture: true });
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this.ok = false;
      canvas.dispatchEvent(new CustomEvent('stage-lost', { bubbles: true }));
    });
    canvas.addEventListener('webglcontextrestored', () => {
      this.ok = true;
      this.dirty = true;
    });
    this.tick = this.tick.bind(this);
    this.last = performance.now();
    requestAnimationFrame(this.tick);
  }

  invalidate() { this.dirty = true; }

  setActive(on) {
    this.active = on;
    if (on) this.dirty = true;
  }

  resize(w, h) {
    if (!this.ok || !w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.dirty = true;
  }

  // Animation pilotée par la boucle de rendu : step(k) reçoit la progression lissée (0 → 1).
  animate(dur, step, easing = ease.inOut3) {
    return new Promise((resolve) => {
      const a = { t0: performance.now(), dur, step, easing, resolve };
      this.anims.add(a);
      this.dirty = true;
    });
  }

  // Déplace la caméra et le point visé ensemble.
  fly(target, position, dur = 900) {
    const t0 = this.controls.target.clone();
    const p0 = this.camera.position.clone();
    return this.animate(dur, (k) => {
      this.controls.target.lerpVectors(t0, target, k);
      this.camera.position.lerpVectors(p0, position, k);
    });
  }

  tick(now) {
    requestAnimationFrame(this.tick);
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    if (!this.ok || !this.active) return;
    for (const a of this.anims) {
      const k = Math.min(1, (now - a.t0) / a.dur);
      a.step(a.easing(k));
      if (k >= 1) {
        this.anims.delete(a);
        a.resolve();
      }
    }
    if (this.anims.size) this.dirty = true;
    if (this.onFrame && this.onFrame(dt, now)) this.dirty = true;
    // l'amortissement de l'orbite déclenche lui-même « change » tant qu'il bouge
    this.controls.update();
    if (!this.dirty) return;
    this.dirty = false;
    this.renderer.render(this.scene, this.camera);
  }
}
