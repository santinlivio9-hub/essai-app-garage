// Génère les icônes PNG à partir de icons/icon.svg : node tools/make-icons.cjs
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
(async () => {
  const root = path.join(__dirname, '..');
  const svg = fs.readFileSync(path.join(root, 'icons/icon.svg'), 'utf8');
  const b = await chromium.launch();
  for (const [name, size, pad] of [['icon-180.png', 180, 0], ['icon-192.png', 192, 0], ['icon-512.png', 512, 0], ['icon-maskable-512.png', 512, 0.1]]) {
    const p = await b.newPage({ viewport: { width: size, height: size } });
    const inner = Math.round(size * (1 - pad * 2));
    await p.setContent(`<html><body style="margin:0;background:#07080a;display:grid;place-items:center;width:${size}px;height:${size}px">
      <div style="width:${inner}px;height:${inner}px">${svg.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</div></body></html>`);
    await p.screenshot({ path: path.join(root, 'icons', name) });
    await p.close();
  }
  await b.close();
})();
