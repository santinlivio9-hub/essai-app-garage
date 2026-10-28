// Compte-tours HUD : cadran 240°, arc lumineux qui vire du vert au rouge, aiguille rétroéclairée,
// lecture numérique et rampe de LED de passage de rapport (s'allument en approche de la zone rouge).
const NS = 'http://www.w3.org/2000/svg';
const A0 = -210; // angle de départ (degrés, 0 = 3 h)
const SWEEP = 240;
const W = 126;
const H = 78;
const LEDS = ['#34d058', '#34d058', '#34d058', '#ffd23f', '#ffd23f', '#ff453a', '#ff453a'];

const rad = (d) => (d * Math.PI) / 180;
const pt = (cx, cy, r, d) => [cx + r * Math.cos(rad(d)), cy + r * Math.sin(rad(d))];

function arc(cx, cy, r, d0, d1) {
  const [x0, y0] = pt(cx, cy, r, d0);
  const [x1, y1] = pt(cx, cy, r, d1);
  return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 ${d1 - d0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

// Couleur de l'arc selon la part de zone rouge atteinte : accent → ambre → rouge.
function heat(k) {
  if (k < 0.72) return 'var(--accent)';
  if (k < 0.9) return '#ffb340';
  return '#ff453a';
}

let uid = 0;

export class Tach {
  constructor(host) {
    this.host = host;
    this.svg = document.createElementNS(NS, 'svg');
    this.svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    host.appendChild(this.svg);
    this.shown = 0;
    this.id = `t${uid++}`;
  }

  configure(engine) {
    const ev = engine.type === 'ev';
    this.max = ev ? 20000 : Math.ceil((engine.limiter + 400) / 1000) * 1000;
    this.red = ev ? 20001 : engine.redline;
    this.limiter = ev ? Infinity : engine.limiter;
    this.ev = ev;
    const cx = W / 2;
    const cy = 47;
    const r = 33;
    const step = ev ? 2000 : 1000;
    const label = ev ? 4000 : this.max > 7000 ? 2000 : 1000;
    const id = this.id;
    let ticks = '';
    let nums = '';
    for (let v = 0; v <= this.max; v += step / 4) {
      const d = A0 + (v / this.max) * SWEEP;
      const major = v % step === 0;
      const half = !major && v % (step / 2) === 0;
      const [x0, y0] = pt(cx, cy, r - (major ? 6.5 : half ? 4 : 2.6), d);
      const [x1, y1] = pt(cx, cy, r - 0.5, d);
      const red = v >= this.red;
      ticks += `<line x1="${x0.toFixed(2)}" y1="${y0.toFixed(2)}" x2="${x1.toFixed(2)}" y2="${y1.toFixed(2)}" stroke="${red ? '#ff5a4f' : major ? 'rgba(255,255,255,.85)' : 'rgba(255,255,255,.4)'}" stroke-width="${major ? 1.4 : 0.7}" stroke-linecap="round"/>`;
      if (major && v % label === 0) {
        const [tx, ty] = pt(cx, cy, r - 12.5, d);
        nums += `<text x="${tx.toFixed(1)}" y="${(ty + 2.4).toFixed(1)}" text-anchor="middle"${red ? ' fill="#ff6b61"' : ''}>${v / 1000}</text>`;
      }
    }
    const dRed = A0 + (this.red / this.max) * SWEEP;
    // rampe de LED (pas de LED pour la Tesla : pas de rapport à passer)
    let leds = '';
    if (!ev) {
      const n = LEDS.length;
      for (let i = 0; i < n; i++) {
        const x = cx + (i - (n - 1) / 2) * 7.4;
        leds += `<circle class="tach-led" cx="${x.toFixed(1)}" cy="6.5" r="2.3" fill="${LEDS[i]}" opacity=".14"/>`;
      }
    }
    this.svg.innerHTML = `
      <defs>
        <radialGradient id="${id}-face" cx=".5" cy=".55" r=".6"><stop offset="0" stop-color="#20252c"/><stop offset="1" stop-color="#0a0b0d"/></radialGradient>
        <linearGradient id="${id}-bezel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9dee4"/><stop offset=".5" stop-color="#5f656d"/><stop offset="1" stop-color="#2a2d32"/></linearGradient>
        <filter id="${id}-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <circle cx="${cx}" cy="${cy}" r="${r + 5.2}" fill="none" stroke="url(#${id}-bezel)" stroke-width="1.4" opacity=".55"/>
      <circle cx="${cx}" cy="${cy}" r="${r + 4.4}" fill="url(#${id}-face)"/>
      <path d="${arc(cx, cy, r + 1.6, A0, A0 + SWEEP)}" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="3.4" stroke-linecap="round"/>
      ${ev ? '' : `<path d="${arc(cx, cy, r + 1.6, dRed, A0 + SWEEP)}" fill="none" stroke="#ff453a" stroke-opacity=".38" stroke-width="3.4"/>`}
      <path class="tach-arc" d="${arc(cx, cy, r + 1.6, A0, A0 + SWEEP)}" fill="none" style="stroke:var(--accent)" stroke-width="3.4" stroke-linecap="round" pathLength="1" stroke-dasharray="0 1" filter="url(#${id}-glow)"/>
      ${ticks}
      <g font-family="ui-monospace,SF Mono,Menlo,monospace" font-size="6.4" font-weight="700" fill="rgba(255,255,255,.72)">${nums}</g>
      <g class="tach-needle" filter="url(#${id}-glow)"><path d="M${cx - 6} ${cy - 0.9} L${cx + r - 2} ${cy - 0.25} L${cx + r - 2} ${cy + 0.25} L${cx - 6} ${cy + 0.9} Z" fill="#ff4b3e"/></g>
      <circle cx="${cx}" cy="${cy}" r="4.2" fill="#15171a" stroke="rgba(255,255,255,.4)" stroke-width=".7"/>
      <circle cx="${cx}" cy="${cy}" r="1.4" fill="#ff4b3e"/>
      ${leds}
      <text x="${cx}" y="${H - 7.5}" text-anchor="middle" class="tach-rpm" font-family="ui-monospace,SF Mono,Menlo,monospace" font-size="11.5" font-weight="800" fill="#fff" letter-spacing=".3">0</text>
      <text x="${cx}" y="${H - 1.8}" text-anchor="middle" font-size="4.4" font-weight="700" letter-spacing=".9" fill="rgba(255,255,255,.45)">${ev ? 'MOTEUR · TR/MIN' : 'TR/MIN'}</text>`;
    this.needle = this.svg.querySelector('.tach-needle');
    this.fill = this.svg.querySelector('.tach-arc');
    this.readout = this.svg.querySelector('.tach-rpm');
    this.leds = [...this.svg.querySelectorAll('.tach-led')];
    this.cx = cx;
    this.cy = cy;
    this.shown = 0;
    this.lastText = '';
    this.lastD = '';
    this.lastHeat = '';
    this.lastLeds = '';
    this.lastHot = false;
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
    const k = this.ev ? v / this.max * 0.7 : v / this.red;
    const h = heat(k);
    if (h !== this.lastHeat) {
      this.lastHeat = h;
      this.fill.style.stroke = h;
    }
    const txt = String(Math.round(v / 10) * 10);
    if (txt !== this.lastText) {
      this.readout.textContent = txt;
      this.lastText = txt;
    }
    if (this.leds.length) {
      // LED progressives de 62 % à 97 % du régime maxi ; au rupteur, tout clignote
      const n = this.leds.length;
      const lit = Math.max(0, Math.min(n, Math.floor(((v / this.red) - 0.62) / 0.35 * n + 1)));
      const flash = v >= this.limiter - 120 && (performance.now() / 70) % 2 > 1;
      const key = flash ? 'f' : String(lit);
      if (key !== this.lastLeds) {
        this.lastLeds = key;
        this.leds.forEach((l, i) => l.setAttribute('opacity', flash ? '.12' : i < lit ? '1' : '.14'));
      }
      const hot = v > this.red * 0.94;
      if (hot !== this.lastHot) {
        this.lastHot = hot;
        this.host.classList.toggle('hot', hot);
      }
    }
  }
}
