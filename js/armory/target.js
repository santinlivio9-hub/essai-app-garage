// Cible miniature du banc de tir : impacts, groupement, montée du canon en rafale.
const NS = 'http://www.w3.org/2000/svg';
const RING_CM = 25; // rayon du visuel extérieur (cm)

function gauss() {
  let u = 0;
  let v = 0;
  while (!u) u = Math.random();
  while (!v) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export class Target {
  constructor(host, onClear) {
    this.host = host;
    this.svg = document.createElementNS(NS, 'svg');
    this.svg.setAttribute('viewBox', '0 0 100 74');
    host.appendChild(this.svg);
    this.svg.innerHTML = `
      <g transform="translate(37 37)">
        ${[30, 24, 18, 12, 6].map((r, i) => `<circle r="${r}" fill="${i === 4 ? 'rgba(255,69,58,.35)' : 'none'}" stroke="rgba(255,255,255,${0.12 + i * 0.05})" stroke-width=".6"/>`).join('')}
        <path d="M -33 0 H 33 M 0 -33 V 33" stroke="rgba(255,255,255,.1)" stroke-width=".4"/>
        <g class="hits"></g>
      </g>
      <text x="76" y="22" text-anchor="middle" class="t-k">DIST.</text>
      <text x="76" y="31" text-anchor="middle" class="t-v" id="t-dist">15 m</text>
      <text x="76" y="47" text-anchor="middle" class="t-k">GROUPE</text>
      <text x="76" y="56" text-anchor="middle" class="t-v" id="t-group">—</text>`;
    this.hitsEl = this.svg.querySelector('.hits');
    this.distEl = this.svg.querySelector('#t-dist');
    this.groupEl = this.svg.querySelector('#t-group');
    this.hits = [];
    this.climb = 0;
    host.addEventListener('click', () => {
      this.clear();
      if (onClear) onClear();
    });
  }

  setRange(m) {
    this.distEl.textContent = `${m} m`;
  }

  clear() {
    this.hits = [];
    this.hitsEl.innerHTML = '';
    this.groupEl.textContent = '—';
  }

  // sigma : dispersion (1 = rayon du visuel) ; rise : montée par coup en rafale ; pellets : chevrotines
  shot({ sigma, rise = 0, pellets = 0 }) {
    this.climb += rise;
    const cx = gauss() * sigma;
    const cy = gauss() * sigma - this.climb;
    const pts = pellets ? Array.from({ length: pellets }, () => [cx + gauss() * 0.16, cy + gauss() * 0.16]) : [[cx, cy]];
    for (const [x, y] of pts) {
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', (x * 30).toFixed(2));
      c.setAttribute('cy', (y * 30).toFixed(2));
      c.setAttribute('r', pellets ? '0.9' : '1.5');
      c.setAttribute('class', 'hit');
      this.hitsEl.appendChild(c);
      this.hits.push([x, y, c]);
    }
    while (this.hits.length > 60) this.hits.shift()[2].remove();
    this.updateGroup();
  }

  updateGroup() {
    const last = this.hits.slice(-30);
    if (last.length < 2) return;
    let d = 0;
    for (let i = 0; i < last.length; i++) {
      for (let j = i + 1; j < last.length; j++) d = Math.max(d, Math.hypot(last[i][0] - last[j][0], last[i][1] - last[j][1]));
    }
    this.groupEl.textContent = `${Math.round(d * RING_CM)} cm`;
  }

  tick(dt) {
    this.climb *= Math.exp(-dt * 3.2);
  }
}
