// Gros plans des accessoires 3D de l'armurerie : node tools/closeup.cjs <outdir> <weaponIdx> '<cfg json>' <slot,slot…>
// Chaque slot (light, magx, grip, muzzle, optic, laser…) est cadré de près sous deux angles.
const { chromium, devices } = require('playwright');
const GL = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
(async () => {
  const [out, idx = '0', cfgJson = '{}', slots = 'light,magx'] = process.argv.slice(2);
  const b = await chromium.launch({ args: GL });
  const ctx = await b.newContext({ ...devices['iPhone 14 Pro'], viewport: { width: 393, height: 852 }, serviceWorkers: 'block' });
  const p = await ctx.newPage();
  p.setDefaultTimeout(180000);
  const logs = [];
  p.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
  await p.goto('http://localhost:8765/index.html#armory');
  const cfg = JSON.parse(cfgJson);
  await p.evaluate(([i, c]) => {
    localStorage.clear();
    localStorage.setItem('ls-tab', 'armory');
    localStorage.setItem('ls-armory-v1', JSON.stringify({ idx: +i, seg: 'optic', cfg: c }));
  }, [idx, cfg]);
  await p.reload();
  await p.waitForTimeout(9000);
  await p.screenshot({ path: `${out}/close-${idx}-all.png`, clip: { x: 8, y: 50, width: 377, height: 420 } });
  for (const slot of slots.split(',')) {
    for (const [n, dir] of [['a', [0.35, 0.15, 1]], ['b', [-0.5, -0.45, 0.75]]]) {
      const ok = await p.evaluate(([s, d]) => {
        const r = window.__ls.armory.renderer;
        const rig = r.rig;
        const m = rig.mounts[s] || (rig.parts[s] && { obj: rig.parts[s] });
        if (!m) return false;
        const T = r.stage.camera.position.constructor;
        rig.root.updateMatrixWorld(true);
        const box = new (Object.getPrototypeOf(r.stage.scene).constructor === Object ? Object : Object)();
        const p = new T();
        m.obj.getWorldPosition(p);
        const dv = new T(...d).normalize().multiplyScalar(0.22);
        r.stage.controls.minDistance = 0.01;
        r.stage.controls.target.copy(p);
        r.stage.camera.position.copy(p).add(dv);
        r.stage.controls.update();
        r.stage.invalidate();
        return true;
      }, [slot, dir]);
      if (!ok) { console.log('pas de', slot); break; }
      await p.waitForTimeout(1500);
      await p.screenshot({ path: `${out}/close-${idx}-${slot}-${n}.png`, clip: { x: 8, y: 50, width: 377, height: 420 } });
    }
  }
  if (logs.length) console.log(logs.join('\n'));
  await b.close();
})();
