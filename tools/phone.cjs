// Captures en émulation iPhone : node tools/phone.cjs <outdir> [scenario]
const { chromium, devices } = require('playwright');
(async () => {
  const [out, scenario = 'basic', w = '393', h = '852'] = process.argv.slice(2);
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 14 Pro'], viewport: { width: +w, height: +h } });
  const p = await ctx.newPage();
  const logs = [];
  p.on('console', (m) => { if (m.type() !== 'log') logs.push(m.type() + ': ' + m.text()); });
  p.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
  await p.goto('http://localhost:8765/index.html#profile');
  await p.evaluate(() => localStorage.clear());
  await p.goto('http://localhost:8765/index.html#profile');
  await p.waitForTimeout(800);
  const shot = (n) => p.screenshot({ path: `${out}/${scenario}-${n}.png` });
  if (scenario === 'basic') {
    await shot('profile');
    await p.evaluate(() => document.querySelector('.scroll').scrollTo(0, 900));
    await p.waitForTimeout(400);
    await shot('profile2');
    await p.tap('[data-tab="garage"]');
    await p.waitForTimeout(900);
    await shot('garage');
    await p.tap('[data-seg="finish"]');
    await p.waitForTimeout(300);
    await shot('finish');
    await p.tap('[data-seg="rims"]');
    await p.waitForTimeout(300);
    await shot('rims');
    await p.tap('[data-seg="workshop"]');
    await p.tap('[data-toggle="lights"]');
    await p.tap('[data-toggle="hood"]');
    await p.waitForTimeout(1600);
    await shot('workshop');
    await p.tap('.sheet-head');
    await p.waitForTimeout(700);
    await shot('sheet');
  } else if (scenario === 'engine') {
    await p.tap('[data-tab="garage"]');
    await p.waitForTimeout(600);
    await p.tap('#btn-start');
    await p.waitForTimeout(2500);
    const box = await p.locator('#btn-gas').boundingBox();
    await p.mouse.move(box.x + 40, box.y + 30);
    await p.mouse.down();
    await p.waitForTimeout(500);
    await shot('rev');
    await p.mouse.up();
    await p.waitForTimeout(300);
    const st = await p.evaluate(() => ({ audio: document.querySelector('#audio-warn').className }));
    console.log(JSON.stringify(st));
  } else if (scenario === 'swipe') {
    await p.tap('[data-tab="garage"]');
    await p.waitForTimeout(600);
    for (let i = 1; i < 5; i++) {
      await p.tap(`.chip[data-i="${i}"]`);
      await p.waitForTimeout(1500);
      await shot('car' + i);
    }
  } else if (scenario === 'vitrine') {
    await p.tap('[data-tab="garage"]');
    await p.waitForTimeout(600);
    await p.tap('[data-seg="workshop"]');
    await p.tap('[data-vitrine]');
    await p.waitForTimeout(900);
    await shot('vitrine');
  }
  if (logs.length) console.log(logs.join('\n'));
  await b.close();
})();
