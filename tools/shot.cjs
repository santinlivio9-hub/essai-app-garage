// Capture d'écran d'une page locale : node tools/shot.cjs <url> <out.png> [w] [h] [dpr]
const { chromium } = require('playwright');
(async () => {
  const [url, out, w = '940', h = '2000', dpr = '1'] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: +dpr });
  const logs = [];
  p.on('console', (m) => logs.push(m.type() + ': ' + m.text()));
  p.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
  await p.goto(url);
  await p.waitForTimeout(1500);
  await p.screenshot({ path: out });
  if (logs.length) console.log(logs.join('\n'));
  await b.close();
})();
