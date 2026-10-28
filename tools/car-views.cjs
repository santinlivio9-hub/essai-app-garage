// Vues d'une voiture du garage (avant, profil, arrière, roue, dessus) : node tools/car-views.cjs <outdir> <carIdx>
const { chromium, devices } = require('playwright');
const GL = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
(async () => {
  const [out, idx = '3', debug = ''] = process.argv.slice(2);
  const b = await chromium.launch({ args: GL });
  const ctx = await b.newContext({ ...devices['iPhone 14 Pro'], viewport: { width: 393, height: 852 }, serviceWorkers: 'block' });
  const p = await ctx.newPage();
  p.setDefaultTimeout(180000);
  const logs = [];
  p.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
  await p.goto('http://localhost:8765/index.html#garage');
  await p.evaluate((i) => { localStorage.clear(); localStorage.setItem('ls-garage-v2', JSON.stringify({ idx: +i })); }, idx);
  await p.reload();
  await p.waitForTimeout(10000);
  if (debug.startsWith('#')) {
    await p.evaluate((hex) => window.__ls.garage.setPaint(hex, 'test'), debug);
  } else if (debug) {
    // couleurs de repérage par mesh : 'Object_4=#ff0000,Object_12=#00ff00'
    await p.evaluate((d) => {
      const s = window.__ls.garage.scene;
      const map = Object.fromEntries(d.split(',').map((x) => x.split('=')));
      s.current.body.traverse((m) => {
        if (!m.isMesh) return;
        const k = Object.keys(map).find((n) => (n.startsWith('role:') ? m.userData.role === n.slice(5) : m.name === n || m.name.startsWith(n + '~')));
        if (k) { m.material = m.material.clone(); m.material.color.set(map[k]); m.material.map = null; m.material.metalness = 0; m.material.roughness = 0.6; }
      });
      s.stage.invalidate();
    }, debug);
  }
  const views = { front: [0, 0.9, 6], side: [6, 0.8, 0], rear: [-0.5, 1.2, -6], wheel: [2.6, 0.5, 1.6], top: [2, 4.5, 3], q34: [4, 1.4, 4.5] };
  for (const [n, v] of Object.entries(views)) {
    await p.evaluate(([v, n]) => {
      const s = window.__ls.garage.scene;
      const st = s.stage;
      const r = s.current;
      const T = st.camera.position.constructor;
      const t = r.slot.clone().add(new T(n === 'wheel' ? 0.8 : 0, n === 'wheel' ? 0.35 : 0.6, n === 'wheel' ? 1.45 : 0));
      st.controls.minDistance = 0.5;
      st.controls.target.copy(t);
      st.camera.position.copy(t).add(new T(...v));
      st.controls.update();
      st.invalidate();
    }, [v, n]);
    await p.waitForTimeout(2000);
    await p.screenshot({ path: `${out}/car${idx}-${n}.png`, clip: { x: 8, y: 50, width: 377, height: 520 } });
  }
  if (logs.length) console.log(logs.join('\n'));
  await b.close();
})();
