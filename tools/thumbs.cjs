// Vignettes 3D des sélecteurs et menus (fond transparent, WebP) : node tools/thumbs.cjs
// Voitures et armes : rendues depuis l'app elle-même ; accessoires : pièce seule, éclairage studio.
// Serveur requis : python3 -m http.server 8765. Sortie : assets/thumbs/*.webp
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const GL = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const OUT = path.join(__dirname, '..', 'assets', 'thumbs');

const save = (name, url) => {
  fs.writeFileSync(path.join(OUT, `${name}.webp`), Buffer.from(url.split(',')[1], 'base64'));
  console.log('·', name);
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ args: GL });
  const ctx = await b.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 1, serviceWorkers: 'block' });
  const p = await ctx.newPage();
  p.setDefaultTimeout(300000);
  p.on('pageerror', (e) => console.log('pageerror:', e.message));
  // recadrage sur les pixels opaques, puis centrage dans une vignette w×h (marge pad)
  await p.addInitScript(() => {
    window.__trim = (src, w, h, pad = 0.06) => {
      const c = document.createElement('canvas');
      c.width = src.width;
      c.height = src.height;
      const x = c.getContext('2d');
      x.drawImage(src, 0, 0);
      const d = x.getImageData(0, 0, c.width, c.height).data;
      let x0 = c.width; let y0 = c.height; let x1 = 0; let y1 = 0;
      for (let y = 0; y < c.height; y++) for (let i = 0; i < c.width; i++) {
        if (d[(y * c.width + i) * 4 + 3] > 8) { x0 = Math.min(x0, i); x1 = Math.max(x1, i); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      }
      const o = document.createElement('canvas');
      o.width = w;
      o.height = h;
      const k = Math.min((w * (1 - pad * 2)) / (x1 - x0 + 1), (h * (1 - pad * 2)) / (y1 - y0 + 1));
      const dw = (x1 - x0 + 1) * k;
      const dh = (y1 - y0 + 1) * k;
      const ox = o.getContext('2d');
      ox.imageSmoothingQuality = 'high';
      ox.drawImage(c, x0, y0, x1 - x0 + 1, y1 - y0 + 1, (w - dw) / 2, (h - dh) / 2, dw, dh);
      return o.toDataURL('image/webp', 0.9);
    };
  });
  const only = process.argv[2] || 'cars,weapons,acc';

  // ---- voitures ----
  if (only.includes('cars')) {
    await p.goto('http://localhost:8765/index.html#garage');
    await p.evaluate(() => { localStorage.clear(); localStorage.setItem('ls-tab', 'garage'); });
    await p.reload();
    await p.waitForFunction(() => window.__ls && window.__ls.garage && window.__ls.garage.scene.rigs.size === 5, null, { timeout: 300000 });
    const n = await p.evaluate(() => window.__ls.garage.scene.cars.length);
    for (let i = 0; i < n; i++) {
      const url = await p.evaluate((i) => {
        const s = window.__ls.garage.scene;
        const st = s.stage;
        const car = s.cars[i];
        const r = s.rigs.get(car.id);
        const T = st.camera.position.constructor;
        for (const ch of st.scene.children) if (!ch.isLight) ch.visible = ch === r.root;
        st.renderer.setSize(768, 432, false);
        const cam = st.camera;
        cam.aspect = 384 / 216;
        cam.fov = 22;
        cam.updateProjectionMatrix();
        const t = r.slot.clone().add(new T(0, r.size.y * 0.42, 0));
        const dir = new T(0.86, 0.16, 0.48).normalize();
        cam.position.copy(t).addScaledVector(dir, r.size.z * 2.75);
        cam.lookAt(t);
        st.renderer.setClearColor(0x000000, 0);
        st.renderer.render(st.scene, cam);
        return window.__trim(st.renderer.domElement, 240, 120, 0.04);
      }, i);
      save(`car-${await p.evaluate((i) => window.__ls.garage.scene.cars[i].id, i)}`, url);
    }
  }

  // ---- armes ----
  if (only.includes('weapons')) {
    await p.goto('http://localhost:8765/index.html#armory');
    const ids = ['canik', 'mp5', 'hk416', 'benelli', 'glock17'];
    for (let i = 0; i < ids.length; i++) {
      // configuration d'origine, sans accessoire
      const cfg = { [ids[i]]: { optic: 'none', laser: 'none', light: 'none', grip: 'none', muzzle: ids[i] === 'canik' ? 'comp-int' : 'none', mag: 'std', stock: 'collapsed', metal: 'orig', poly: 'orig' } };
      await p.evaluate(([i, c]) => { localStorage.clear(); localStorage.setItem('ls-tab', 'armory'); localStorage.setItem('ls-armory-v1', JSON.stringify({ idx: i, cfg: c })); }, [i, cfg]);
      await p.reload();
      await p.waitForFunction(() => window.__ls && window.__ls.armory && window.__ls.armory.renderer.rig, null, { timeout: 300000 });
      await p.waitForTimeout(1500);
      const url = await p.evaluate(() => {
        const r = window.__ls.armory.renderer;
        const st = r.stage;
        const T = st.camera.position.constructor;
        const B = r.rig.root.children.find((c) => c.isMesh); // ombre de contact
        if (B) B.visible = false;
        st.renderer.setSize(768, 384, false);
        const cam = st.camera;
        cam.aspect = 2;
        cam.updateProjectionMatrix();
        const box = new (r.rig.box.constructor)().setFromObject(r.rig.recoil);
        const c = box.getCenter(new T());
        const len = box.max.x - box.min.x;
        const h = box.max.y - box.min.y;
        const fov = cam.fov * Math.PI / 180;
        const d = Math.max((len * 0.56) / Math.tan(Math.atan(Math.tan(fov / 2) * cam.aspect)), (h * 0.56) / Math.tan(fov / 2));
        cam.position.copy(c).add(new T(0, 0, d));
        cam.lookAt(c);
        st.renderer.setClearColor(0x000000, 0);
        st.renderer.render(st.scene, cam);
        return window.__trim(st.renderer.domElement, 240, 120, 0.04);
      });
      save(`gun-${ids[i]}`, url);
    }
  }

  // ---- accessoires ----
  if (only.includes('acc')) {
    if (!(await p.evaluate(() => !!(window.__ls && window.__ls.armory)))) {
      await p.goto('http://localhost:8765/index.html#armory');
      await p.evaluate(() => { localStorage.clear(); localStorage.setItem('ls-tab', 'armory'); });
      await p.reload();
      await p.waitForFunction(() => window.__ls && window.__ls.armory && window.__ls.armory.renderer.rig, null, { timeout: 300000 });
    }
    const keys = ['rds', 'holo', 'magnifier', 'peq', 'light:pistol', 'light:rifle', 'comp', 'supRifle', 'sd', 'stubby', 'angled', 'handstop'];
    for (const k of keys) {
      const url = await p.evaluate(async (k) => {
        const r = window.__ls.armory.renderer;
        const st = r.stage;
        const THREE = await import('three');
        const scene = new THREE.Scene();
        scene.environment = st.scene.environment;
        const key = new THREE.DirectionalLight(0xffffff, 2.4);
        key.position.set(1.5, 3, 2.5);
        const rim = new THREE.DirectionalLight(0x9fc4ff, 1);
        rim.position.set(-2, 1, -2);
        scene.add(key, rim, new THREE.HemisphereLight(0xdde6f0, 0x15171a, 0.6));
        const obj = await r.accessory(k);
        const holder = new THREE.Group();
        holder.add(obj);
        scene.add(holder);
        holder.rotation.y = -0.5;
        holder.rotation.x = 0.12;
        holder.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(holder);
        const c = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        st.renderer.setSize(480, 320, false);
        const cam = new THREE.PerspectiveCamera(24, 1.5, 0.001, 10);
        const fov = cam.fov * Math.PI / 180;
        const d = Math.max((Math.max(size.x, size.z) * 0.62) / Math.tan(Math.atan(Math.tan(fov / 2) * 1.5)), (size.y * 0.62) / Math.tan(fov / 2)) + size.z;
        cam.position.copy(c).add(new THREE.Vector3(0, size.y * 0.15, d));
        cam.lookAt(c);
        st.renderer.setClearColor(0x000000, 0);
        st.renderer.render(scene, cam);
        return window.__trim(st.renderer.domElement, 180, 120, 0.06);
      }, k);
      save(`acc-${k.replace(':', '-')}`, url);
    }
  }
  await b.close();
})();
