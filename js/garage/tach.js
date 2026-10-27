// Compte-tours HUD : arc 240°, zone rouge, aiguille, lecture numérique.
const NS = 'http://www.w3.org/2000/svg';
const A0 = -210; // angle de départ (degrés, 0 = 3 h)
const SWEEP = 240;

const rad = (d) => (d * Math.PI) / 180;
const pt = (cx, cy, r, d) => [cx + r * Math.cos(rad(d)), cy + r * Math.sin(rad(d))];

function arc(cx, cy, r, d0, d1) {
  const [x0, y0] = pt(cx, cy, r, d0);
  const [x1, y1] = pt(cx, cy, r, d1);
  return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 ${d1 - d0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

export class Tach {
  constructor(host) {
    this.host = host;
    this.svg = document.createElementNS(NS, 'svg');
    this.svg.setAttribute('viewBox', '0 0 118 74');
    host.appendChild(this.svg);
    this.shown = 0;
  }

  configure(engine) {
    const ev = engine.type === 'ev';
    this.max = ev ? 20000 : Math.ceil((engine.limiter + 400) / 1000) * 1000;
    this.red = ev ? 20001 : engine.redline;
    this.ev = ev;
    const cx = 59;
    const cy = 46;
    const r = 34;
    const step = ev ? 2000 : 1000;
    const label = ev ? 4000 : this.max > 7000 ? 2000 : 1000;
    let ticks = '';
    let nums = '';
    for (let v = 0; v <= this.max; v += step / 2) {
      const d = A0 + (v / this.max) * SWEEP;
      const major = v % step === 0;
      const [x0, y0] = pt(cx, cy, r - (major ? 6 : 3.5), d);
      const [x1, y1] = pt(cx, cy, r, d);
      const red = v >= this.red;
      ticks += `<line x1="${x0.toFixed(2)}" y1="${y0.toFixed(2)}" x2="${x1.toFixed(2)}" y2="${y1.toFixed(2)}" stroke="${red ? '#ff453a' : 'rgba(255,255,255,.55)'}" stroke-width="${major ? 1.3 : 0.7}"/>`;
      if (major && v % label === 0) {
        const [tx, ty] = pt(cx, cy, r - 12, d);
        nums += `<text x="${tx.toFixed(1)}" y="${(ty + 2.6).toFixed(1)}" text-anchor="middle">${v / 1000}</text>`;
      }
    }
    const dRed = A0 + (this.red / this.max) * SWEEP;
    this.svg.innerHTML = `
      <defs><linearGradient id="tach-g" x1="0" x2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".2"/><stop offset="1" stop-color="var(--accent)"/></linearGradient></defs>
      <path d="${arc(cx, cy, r + 3, A0, A0 + SWEEP)}" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="2.5" stroke-linecap="round"/>
      <path class="tach-fill" d="${arc(cx, cy, r + 3, A0, A0 + SWEEP)}" fill="none" stroke="url(#tach-g)" stroke-width="2.5" stroke-linecap="round" pathLength="1" stroke-dasharray="0 1"/>
      ${ev ? '' : `<path d="${arc(cx, cy, r - 1.2, dRed, A0 + SWEEP)}" fill="none" stroke="#ff453a" stroke-opacity=".75" stroke-width="2.4"/>`}
      ${ticks}
      <g font-family="ui-monospace,SF Mono,Menlo,monospace" font-size="6.2" fill="rgba(255,255,255,.6)">${nums}</g>
      <g class="tach-needle"><line x1="${cx}" y1="${cy}" x2="${cx + r - 3}" y2="${cy}" stroke="#ff453a" stroke-width="1.6" stroke-linecap="round"/><line x1="${cx}" y1="${cy}" x2="${cx - 7}" y2="${cy}" stroke="#ff453a" stroke-width="2.4" stroke-linecap="round"/></g>
      <circle cx="${cx}" cy="${cy}" r="3.4" fill="#0b0c0e" stroke="rgba(255,255,255,.35)" stroke-width=".8"/>
      <text x="${cx}" y="66" text-anchor="middle" class="tach-rpm" font-family="ui-monospace,SF Mono,Menlo,monospace" font-size="10.5" font-weight="700" fill="#fff">0</text>
      <text x="${cx}" y="72.5" text-anchor="middle" font-size="4.6" letter-spacing=".6" fill="rgba(255,255,255,.45)">${ev ? 'MOTEUR TR/MIN' : 'TR/MIN'}</text>
      <circle class="tach-shift" cx="${cx}" cy="16" r="2" fill="#ff453a" opacity="0"/>`;
    this.needle = this.svg.querySelector('.tach-needle');
    this.fill = this.svg.querySelector('.tach-fill');
    this.readout = this.svg.querySelector('.tach-rpm');
    this.shift = this.svg.querySelector('.tach-shift');
    this.cx = cx;
    this.cy = cy;
    this.shown = 0;
    this.lastText = '';
    this.lastD = '';
    this.lastSh = '';
    this.set(0, 1);
  }

  set(rpm, dt) {
    // inertie d'aiguille
    this.shown += (rpm - this.shown) * Math.min(1, dt * 22);
    const v = Math.max(0, Math.min(this.max, this.shown));
    const d = (A0 + (v / this.max) * SWEEP).toFixed(1);
    if (d !== this.lastD) {
      this.lastD = d;
      this.needle.setAttribute('transform', `rotate(${d} ${this.cx} ${this.cy})`);
      this.fill.setAttribute('stroke-dasharray', `${(v / this.max).toFixed(3)} 1`);
    }
    const txt = String(Math.round(v / 10) * 10);
    if (txt !== this.lastText) {
      this.readout.textContent = txt;
      this.lastText = txt;
    }
    const sh = !this.ev && v > this.red * 0.94 ? ((performance.now() / 60) % 2 > 1 ? '1' : '.2') : '0';
    if (sh !== this.lastSh) {
      this.lastSh = sh;
      this.shift.setAttribute('opacity', sh);
    }
  }
}
