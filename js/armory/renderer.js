// Rendu de l'armurerie. Les armes sont dessinées en millimètres réels dans un repère
// y-vers-le-haut ; une « caméra » (matrice d'échelle retournée) les cadre dans le studio
// et se recadre en douceur quand un accessoire allonge la silhouette.
import { tween, ease } from '../core/util.js';
import { rect, circle } from './shapes.js';
import {
  rdsSVG, holoSVG, magnifierSVG, peqSVG, PEQ_EMIT, pistolLightSVG, PISTOL_LIGHT_EMIT,
  rifleLightSVG, RIFLE_LIGHT_EMIT, compSVG, supSVG, sdSVG, gripSVG, casingSVG,
} from './accessories.js';

const f = (n) => (+n).toFixed(2);
const SOLID = new Set(['metal', 'poly', 'steel', 'black', 'rubber', 'pad', 'optic', 'tan', 'rail']);

const DEFS = `
  <linearGradient id="w-shade" x1="0" y1="1" x2="0" y2="0">
    <stop offset="0" stop-color="#fff" stop-opacity=".34"/><stop offset=".08" stop-color="#fff" stop-opacity=".14"/><stop offset=".3" stop-color="#fff" stop-opacity=".03"/>
    <stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/>
  </linearGradient>
  <linearGradient id="w-steel" x1="0" y1="1" x2="0" y2="0">
    <stop offset="0" stop-color="#6d7177"/><stop offset=".3" stop-color="#3a3d41"/><stop offset=".7" stop-color="#26282b"/><stop offset="1" stop-color="#121315"/>
  </linearGradient>
  <linearGradient id="w-glass" x1="0" y1="1" x2="0" y2="0">
    <stop offset="0" stop-color="#9fe7ff" stop-opacity=".9"/><stop offset=".5" stop-color="#2b6b8a" stop-opacity=".9"/><stop offset="1" stop-color="#0b2433"/>
  </linearGradient>
  <linearGradient id="w-brass" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#7a5a1c"/><stop offset=".4" stop-color="#f1cf7a"/><stop offset="1" stop-color="#8a6420"/>
  </linearGradient>
  <pattern id="w-stipple" width="2.4" height="2.4" patternUnits="userSpaceOnUse">
    <rect width="2.4" height="2.4" fill="rgba(0,0,0,.18)"/><circle cx=".6" cy=".6" r=".5" fill="rgba(255,255,255,.08)"/><circle cx="1.8" cy="1.8" r=".5" fill="rgba(0,0,0,.35)"/>
  </pattern>
  <radialGradient id="w-flash"><stop offset="0" stop-color="#fffbe6"/><stop offset=".25" stop-color="#ffd36b" stop-opacity=".95"/><stop offset=".6" stop-color="#ff7a1a" stop-opacity=".5"/><stop offset="1" stop-color="#ff4a00" stop-opacity="0"/></radialGradient>
  <radialGradient id="w-hot"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".3" stop-color="#e8f2ff" stop-opacity=".45"/><stop offset="1" stop-color="#cfe2ff" stop-opacity="0"/></radialGradient>
  <radialGradient id="w-floor"><stop offset="0" stop-color="#000" stop-opacity=".7"/><stop offset=".6" stop-color="#000" stop-opacity=".3"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
  <radialGradient id="w-smoke"><stop offset="0" stop-color="#d8dde3" stop-opacity=".35"/><stop offset="1" stop-color="#d8dde3" stop-opacity="0"/></radialGradient>`;

export class ArmRenderer {
  constructor(svg) {
    this.svg = svg;
    this.cam = { s: 1, tx: 0, ty: 0 };
    this.size = { w: 390, h: 400 };
    this.rec = { x: 0, vx: 0, a: 0, va: 0 };
    this.slide = { t: 1, locked: false };
    this.stockT = 0;
    this.flipT = 0;
    this.particles = [];
    this.flashT = 0;
  }

  fit(w, h) {
    if (!w || !h) return;
    this.size = { w, h };
    this.svg.setAttribute('viewBox', `0 0 ${f(w)} ${f(h)}`);
    if (this.box) this.frame(false);
  }

  // ---------- construction ----------

  build(wpn, cfg, { instant = false } = {}) {
    const first = this.wpn !== wpn;
    this.wpn = wpn;
    this.cfg = { ...cfg };
    const m = wpn.mounts;
    const hide = this.hidden(wpn, cfg);

    const parts = wpn.parts.map((p) => {
      if (p.g && hide.has(p.g)) return '';
      const cls = p.g ? ` data-g="${p.g}"` : '';
      let s = `<path class="m-${p.k}" d="${p.d}"/>`;
      if (SOLID.has(p.k)) s += `<path class="m-shade" d="${p.d}"/>`;
      return p.g ? `<g${cls}>${s}</g>` : s;
    }).join('');

    // dispositifs de bouche
    const sup = wpn.type === 'pistol' ? { R: 18, L: 170 } : { R: 22, L: 165 };
    let under = '';
    let muzzle = '';
    let tip = m.muzzle.tip || m.muzzle.x;
    if (wpn.id === 'hk416' && cfg.muzzle === 'none') tip = 706;
    if (wpn.id === 'glock17') tip = 187.5;
    const thread = m.muzzle.thread && (cfg.muzzle === 'comp' || cfg.muzzle === 'sup') ? m.muzzle.thread : 0;
    const mx = m.muzzle.x + thread;
    if (thread) muzzle += `<path class="m-steel" d="${rect(m.muzzle.x, m.muzzle.y - 5, mx, m.muzzle.y + 5, 1)}"/>`;
    if (cfg.muzzle === 'comp') {
      muzzle += `<g transform="translate(${mx} ${m.muzzle.y})">${compSVG(m.muzzle.r)}</g>`;
      tip = mx + 46;
    } else if (cfg.muzzle === 'sup') {
      muzzle += `<g transform="translate(${mx + 7} ${m.muzzle.y})">${supSVG(sup.R, sup.L)}</g>`;
      tip = mx + 7 + sup.L;
    } else if (cfg.muzzle === 'sd') {
      under = sdSVG(m.sd.x0, m.sd.x1, m.muzzle.y, m.sd.r);
      tip = m.sd.x1;
    } else if (cfg.muzzle === 'comp-int') {
      tip = m.muzzle.x;
    }
    this.tip = [tip, m.muzzle.y];

    // optiques
    let acc = '';
    if (m.rail && cfg.optic !== 'none') {
      // embase à griffes (claw mount) pour le MP5
      const r = m.rail;
      acc += `<path class="m-optic" d="${rect(r.x0, r.y - 10, r.x1, r.y - 3, 1)}"/><path class="m-optic" d="${railTeeth(r.x0, r.x1, r.y)}"/>`;
      for (const cx of r.claw) acc += `<path class="m-optic" d="${rect(cx - 9, 176, cx + 9, r.y - 9, 2)}"/><path class="m-shade" d="${rect(cx - 9, 176, cx + 9, r.y - 9, 2)}"/>`;
    }
    if (cfg.optic === 'rds') acc += `<g transform="translate(${m.optic.x} ${m.optic.y})">${rdsSVG(m.optic.on !== 'slide')}</g>`;
    if (cfg.optic === 'holo') {
      acc += `<g transform="translate(${m.optic.x} ${m.optic.y})">${holoSVG()}</g>`;
      if (cfg.magnifier && m.magnifier) acc += `<g class="magnifier" transform="translate(${m.magnifier.x} ${m.magnifier.y})">${magnifierSVG()}</g>`;
    }

    // laser / lampe / poignée
    this.emit = { laser: null, light: null };
    if (cfg.laser === 'peq' && m.laser) {
      acc += `<g transform="translate(${m.laser.x} ${m.laser.y})">${peqSVG(m.laser.side)}</g>`;
      const dy = m.laser.side ? PEQ_EMIT.sideDy : 0;
      this.emit.laser = { vis: [m.laser.x + PEQ_EMIT.vis[0], m.laser.y + PEQ_EMIT.vis[1] + dy], ir: [m.laser.x + PEQ_EMIT.ir[0], m.laser.y + PEQ_EMIT.ir[1] + dy] };
    }
    if (cfg.light === 'pistol' && m.light) {
      acc += `<g transform="translate(${m.light.x} ${m.light.y})">${pistolLightSVG()}</g>`;
      this.emit.light = [m.light.x + PISTOL_LIGHT_EMIT[0], m.light.y + PISTOL_LIGHT_EMIT[1]];
    } else if (cfg.light === 'rifle' && m.light) {
      let lx = m.light.x;
      if (m.light.under && cfg.grip !== 'none' && cfg.grip !== 'handstop') lx += 22;
      acc += `<g transform="translate(${lx} ${m.light.y})">${rifleLightSVG(m.light.under)}</g>`;
      this.emit.light = [lx + RIFLE_LIGHT_EMIT[0], m.light.y + RIFLE_LIGHT_EMIT[1] - (m.light.under ? 24 : 0)];
    }
    if (cfg.grip && cfg.grip !== 'none' && m.grip) {
      let gx = m.grip.x;
      if (m.light && m.light.under && cfg.light !== 'none') gx -= 10;
      acc += `<g transform="translate(${gx} ${m.grip.y})">${gripSVG(cfg.grip)}</g>`;
    }

    // sélecteur de tir
    let sel = '';
    if (m.selector) {
      const s = m.selector;
      sel = `<g class="selector" transform="rotate(${s.angles[cfg.mode] || 0} ${s.x} ${s.y})">
        <path class="m-steel" d="M ${s.x - 3} ${s.y} L ${s.x - 2} ${s.y + 17} L ${s.x + 2} ${s.y + 17} L ${s.x + 3} ${s.y} Z"/>
        <path class="m-steel" d="${circle(s.x, s.y, 5)}"/><path class="m-shade" d="${circle(s.x, s.y, 5)}"/></g>`;
    }

    const fxs = this.fxSVG();

    this.svg.innerHTML = `<defs>${DEFS}${this.beamDefs()}</defs>
      <g id="a-cam">
        <ellipse class="a-floor" cx="0" cy="0" rx="10" ry="10" fill="url(#w-floor)"/>
        <g id="a-rec">
          <g class="a-fx-back">${fxs.back}</g>
          <g class="a-solid">${under}${parts}${sel}${muzzle}${acc}</g>
          <g class="a-fx">${fxs.front}</g>
        </g>
        <g class="a-parts"></g>
      </g>`;

    this.camEl = this.svg.querySelector('#a-cam');
    this.recEl = this.svg.querySelector('#a-rec');
    this.partsEl = this.svg.querySelector('.a-parts');
    this.flashEl = this.svg.querySelector('.flash');
    this.jetsEl = this.svg.querySelector('.jets');
    this.puffEl = this.svg.querySelector('.puff');
    this.floorEl = this.svg.querySelector('.a-floor');
    this.slideEls = [...this.svg.querySelectorAll('[data-g="slide"]')];
    this.magEls = [...this.svg.querySelectorAll('[data-g="mag"], [data-g="magExt"]')];
    this.stockEls = [...this.svg.querySelectorAll('[data-g="stock"]')];
    this.cockEls = [...this.svg.querySelectorAll('[data-g="cock"], [data-g="ch"]')];
    this.flipEl = this.svg.querySelector('.magnifier .flip');
    this.setLight(cfg.lightOn);
    this.setLaser(cfg.laserMode);

    // états animés conservés d'une reconstruction à l'autre
    const stockTarget = cfg.stock === 'extended' ? 1 : 0;
    const flipTarget = cfg.magFlip ? 1 : 0;
    if (first) {
      this.stockT = stockTarget;
      this.flipT = flipTarget;
      this.slide.locked = false;
      this.particles = [];
    }
    this.applyStock();
    this.applyFlip();
    this.applySlide(0);
    this.animateTo('stockT', stockTarget, 420, () => this.applyStock());
    this.animateTo('flipT', flipTarget, 380, () => this.applyFlip());

    this.measure();
    this.frame(!(first || instant));
    this.applyRecoil();
  }

  hidden(wpn, cfg) {
    const h = new Set();
    if (cfg.optic !== 'none') h.add('mosplate');
    if (cfg.mag !== 'ext') h.add('magExt');
    if (cfg.mag === 'ext') h.add('tubeStd'); else h.add('tubeExt');
    if (cfg.muzzle && cfg.muzzle !== 'none' && cfg.muzzle !== 'comp-int') h.add('muzzleStd');
    if (cfg.muzzle === 'sd') h.add('front');
    const railed = (cfg.laser && cfg.laser !== 'none') || (cfg.light && cfg.light !== 'none') || (cfg.grip && cfg.grip !== 'none');
    h.add(railed ? 'hgSlim' : 'hgRail');
    return h;
  }

  beamDefs() {
    return `<linearGradient id="w-beam" gradientUnits="objectBoundingBox" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#f4f8ff" stop-opacity=".55"/><stop offset=".25" stop-color="#dfeaff" stop-opacity=".2"/><stop offset="1" stop-color="#dfeaff" stop-opacity="0"/></linearGradient>
      <linearGradient id="w-laser" gradientUnits="objectBoundingBox" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#5dff7a"/><stop offset=".6" stop-color="#5dff7a" stop-opacity=".7"/><stop offset="1" stop-color="#5dff7a" stop-opacity=".15"/></linearGradient>`;
  }

  fxSVG() {
    const [tx, ty] = this.tip;
    let s = '';
    let back = '';
    const L = this.emit.light;
    if (L) {
      s += `<g class="beam"><path d="M ${f(L[0])} ${f(L[1] + 7)} L ${f(L[0] + 2600)} ${f(L[1] + 520)} L ${f(L[0] + 2600)} ${f(L[1] - 520)} L ${f(L[0])} ${f(L[1] - 7)} Z" fill="url(#w-beam)"/>
        <circle cx="${f(L[0])}" cy="${f(L[1])}" r="34" fill="url(#w-hot)"/></g>`;
    }
    const Z = this.emit.laser;
    if (Z) {
      s += `<g class="laser-vis"><rect x="${f(Z.vis[0])}" y="${f(Z.vis[1] - 1.6)}" width="3200" height="3.2" fill="url(#w-laser)" opacity=".28"/>
          <rect x="${f(Z.vis[0])}" y="${f(Z.vis[1] - 0.45)}" width="3200" height=".9" fill="url(#w-laser)"/>
          <circle cx="${f(Z.vis[0] + 1)}" cy="${f(Z.vis[1])}" r="5" fill="#5dff7a" opacity=".5"/></g>
        <g class="laser-ir"><path d="M ${f(Z.ir[0])} ${f(Z.ir[1])} L ${f(Z.ir[0] + 3200)} ${f(Z.ir[1])}" stroke="#b58cff" stroke-width=".8" stroke-dasharray="6 7" opacity=".55"/>
          <circle cx="${f(Z.ir[0] + 1)}" cy="${f(Z.ir[1])}" r="4" fill="#b58cff" opacity=".35"/></g>`;
    }
    back = s;
    s = '';
    const big = { pistol: 1, smg: 1.15, rifle: 1.7, shotgun: 2.1 }[this.wpn.type] || 1;
    const r = 26 * big;
    let star = '';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const rr = i % 2 ? r * 0.35 : r * (i % 4 ? 0.75 : 1.25);
      star += `${i ? 'L' : 'M'} ${f(Math.cos(a) * rr * 1.5 + r * 0.5)} ${f(Math.sin(a) * rr)} `;
    }
    s += `<g class="flash" transform="translate(${f(tx)} ${f(ty)})" opacity="0">
        <circle cx="${f(r * 0.4)}" cy="0" r="${f(r * 1.6)}" fill="url(#w-flash)" opacity=".7"/>
        <path d="${star}Z" fill="url(#w-flash)"/></g>`;
    // jets du compensateur (vers le haut)
    const vents = this.ventPositions();
    s += `<g class="jets" opacity="0">${vents.map(([vx, vy]) => `<path d="M ${f(vx - 3)} ${f(vy)} C ${f(vx - 6)} ${f(vy + 18)} ${f(vx + 2)} ${f(vy + 34)} ${f(vx)} ${f(vy + 46)} C ${f(vx + 5)} ${f(vy + 30)} ${f(vx + 7)} ${f(vy + 16)} ${f(vx + 3)} ${f(vy)} Z" fill="url(#w-flash)"/>`).join('')}</g>`;
    s += `<circle class="puff" cx="${f(tx + 8)}" cy="${f(ty)}" r="16" fill="url(#w-smoke)" opacity="0"/>`;
    return { back, front: s };
  }

  ventPositions() {
    const m = this.wpn.mounts;
    const c = this.cfg;
    if (c.muzzle === 'comp-int' && m.vents) return [[m.vents.x - 6, m.vents.y], [m.vents.x + 4, m.vents.y]];
    if (c.muzzle === 'comp') {
      const x0 = m.muzzle.x + (m.muzzle.thread || 0);
      const y = m.muzzle.y + m.muzzle.r + 1.5;
      return [[x0 + 12, y], [x0 + 23, y], [x0 + 34, y]];
    }
    return [];
  }

  // ---------- caméra ----------

  measure() {
    const solid = this.svg.querySelector('.a-solid');
    try {
      const b = solid.getBBox();
      this.box = { x: b.x, y: b.y, w: b.width, h: b.height };
    } catch {
      this.box = { x: -250, y: -120, w: 1000, h: 350 };
    }
  }

  frame(animate) {
    const { w, h } = this.size;
    const b = this.box;
    const s = Math.min((w * 0.9) / b.w, (h * 0.56) / b.h, (w * 0.9) / 245);
    const cx = w * 0.5;
    const cy = h * 0.55;
    const target = { s, tx: cx - s * (b.x + b.w / 2), ty: cy + s * (b.y + b.h / 2) };
    const floor = { x: b.x + b.w / 2, y: b.y - 18 / s, rx: b.w * 0.55, ry: 10 / s };
    this.floorEl.setAttribute('cx', f(floor.x));
    this.floorEl.setAttribute('cy', f(floor.y));
    this.floorEl.setAttribute('rx', f(floor.rx));
    this.floorEl.setAttribute('ry', f(floor.ry));
    if (this._camStop) this._camStop();
    if (!animate) {
      this.cam = target;
      this.applyCam();
      return;
    }
    const from = { ...this.cam };
    this._camStop = tween(420, ease.inOut3, (k) => {
      this.cam = { s: from.s + (target.s - from.s) * k, tx: from.tx + (target.tx - from.tx) * k, ty: from.ty + (target.ty - from.ty) * k };
      this.applyCam();
    });
  }

  applyCam() {
    const c = this.cam;
    this.camEl.setAttribute('transform', `matrix(${c.s.toFixed(4)} 0 0 ${(-c.s).toFixed(4)} ${f(c.tx)} ${f(c.ty)})`);
  }

  // ---------- états animés ----------

  animateTo(key, target, dur, apply) {
    const stopKey = '_stop_' + key;
    if (this[stopKey]) this[stopKey]();
    const from = this[key];
    if (from === target) return;
    this[stopKey] = tween(dur, ease.inOut3, (k) => {
      this[key] = from + (target - from) * k;
      apply();
    }, () => {
      this.measure();
      this.frame(true);
    });
  }

  applyStock() {
    const dx = -(this.wpn.stockTravel || 0) * this.stockT;
    for (const el of this.stockEls) el.setAttribute('transform', `translate(${f(dx)} 0)`);
  }

  applyFlip() {
    if (this.flipEl) this.flipEl.setAttribute('transform', `translate(0 ${f(-44 * this.flipT)})`);
  }

  applySlide(off) {
    for (const el of this.slideEls) el.setAttribute('transform', `translate(${f(-off)} 0)`);
  }

  setLight(on) {
    this.svg.classList.toggle('light-on', !!on && !!this.emit.light);
  }

  setLaser(mode) {
    this.svg.classList.toggle('laser-vis-on', mode === 'vis' && !!this.emit.laser);
    this.svg.classList.toggle('laser-ir-on', mode === 'ir' && !!this.emit.laser);
  }

  setSelector(mode) {
    const s = this.wpn.mounts.selector;
    const el = this.svg.querySelector('.selector');
    if (!s || !el) return;
    el.setAttribute('transform', `rotate(${s.angles[mode] || 0} ${s.x} ${s.y})`);
  }

  // ---------- tir ----------

  fire({ suppressed, comp, last }) {
    const r = this.wpn.recoil;
    const k = (comp ? 0.7 : 1) * (suppressed ? 0.85 : 1) * (this.cfg.grip && this.cfg.grip !== 'none' ? 0.88 : 1) * (this.cfg.stock === 'extended' ? 0.85 : 1);
    this.rec.vx += r.kick * 34 * (0.85 + Math.random() * 0.3) * (this.rec.x > r.kick * 0.6 ? 0.35 : 1);
    this.rec.va += r.rise * 34 * k * (0.8 + Math.random() * 0.4) * (this.rec.a > r.rise * 0.8 ? 0.3 : 1);
    if (r.slide) {
      this.slide.t = 0;
      this.slide.locked = !!last;
    }
    // flamme
    this.flashEl.setAttribute('opacity', suppressed ? '0' : '1');
    const sc = 0.7 + Math.random() * 0.6;
    this.flashEl.setAttribute('transform', `translate(${f(this.tip[0])} ${f(this.tip[1])}) rotate(${f((Math.random() - 0.5) * 30)}) scale(${f(sc)} ${f(sc * (0.8 + Math.random() * 0.4))})`);
    if (this.jetsEl) this.jetsEl.setAttribute('opacity', comp && !suppressed ? '1' : '0');
    this.flashT = 0.045;
    this.puffEl.setAttribute('opacity', suppressed ? '.9' : '.6');
    this.puffT = 0.5;
    this.eject();
  }

  eject() {
    const e = this.wpn.mounts.eject;
    const kind = this.wpn.type === 'shotgun' ? 'shotgun' : this.wpn.type === 'rifle' ? 'rifle' : 'pistol';
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.innerHTML = casingSVG(kind);
    this.partsEl.appendChild(g);
    this.particles.push({ el: g, x: e.x, y: e.y, vx: -(380 + Math.random() * 260), vy: 1500 + Math.random() * 700, a: Math.random() * 90, va: 900 + Math.random() * 900, t: 0 });
  }

  lockSlide(on) {
    this.slide.locked = on;
    this.slide.t = 1;
    this.applySlide(on ? this.wpn.recoil.slide * 0.92 : 0);
  }

  // Animations de rechargement (appelées par le contrôleur, renvoient une promesse).
  magOut(dur = 320) {
    const ax = this.wpn.mounts.magAxis || [0, -1];
    return new Promise((res) => tween(dur, ease.in3, (k) => {
      for (const el of this.magEls) {
        el.setAttribute('transform', `translate(${f(ax[0] * 140 * k)} ${f(ax[1] * 140 * k)})`);
        el.setAttribute('opacity', f(1 - k));
      }
    }, res));
  }

  magIn(dur = 360) {
    const ax = this.wpn.mounts.magAxis || [0, -1];
    return new Promise((res) => tween(dur, ease.out3, (k) => {
      for (const el of this.magEls) {
        el.setAttribute('transform', `translate(${f(ax[0] * 90 * (1 - k))} ${f(ax[1] * 90 * (1 - k))})`);
        el.setAttribute('opacity', f(Math.min(1, k * 2)));
      }
    }, res));
  }

  rack(dist = 55, back = 220, fwd = 120) {
    const els = this.cockEls.length ? this.cockEls : this.slideEls;
    return new Promise((res) => tween(back, ease.out3, (k) => {
      for (const el of els) el.setAttribute('transform', `translate(${f(-dist * k)} 0)`);
    }, () => tween(fwd, ease.in3, (k) => {
      for (const el of els) el.setAttribute('transform', `translate(${f(-dist * (1 - k))} 0)`);
    }, res)));
  }

  shellIn() {
    const s = this.wpn.mounts.shell;
    if (!s) return Promise.resolve();
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.innerHTML = `<g transform="rotate(90)">${casingSVG('shotgun')}</g>`;
    this.partsEl.appendChild(g);
    return new Promise((res) => tween(240, ease.out3, (k) => {
      g.setAttribute('transform', `translate(${f(s.x + 20 * (1 - k))} ${f(s.y - 70 * (1 - k))})`);
      g.setAttribute('opacity', f(k < 0.8 ? 1 : (1 - k) * 5));
    }, () => { g.remove(); res(); }));
  }

  // ---------- boucle ----------

  tick(dt) {
    // recul : ressort amorti (ω ≈ 38 rad/s, ζ ≈ 0,62)
    const w = 38;
    const z = 0.62;
    const R = this.rec;
    R.vx += (-w * w * R.x - 2 * z * w * R.vx) * dt;
    R.x += R.vx * dt;
    R.va += (-w * w * R.a - 2 * z * w * R.va) * dt;
    R.a += R.va * dt;
    const maxA = this.wpn.recoil.rise * 1.6;
    if (R.a > maxA) { R.a = maxA; R.va = Math.min(R.va, 0); }
    const maxX = this.wpn.recoil.kick * 1.4;
    if (R.x > maxX) { R.x = maxX; R.vx = Math.min(R.vx, 0); }
    const moving = Math.abs(R.x) > 0.01 || Math.abs(R.vx) > 0.05 || Math.abs(R.a) > 0.005 || Math.abs(R.va) > 0.02;
    if (moving) this.applyRecoil();

    // culasse
    if (this.wpn.recoil.slide && this.slide.t < 1) {
      this.slide.t = Math.min(1, this.slide.t + dt / 0.07);
      const t = this.slide.t;
      let off = Math.sin(Math.min(1, t * 1.6) * Math.PI) * this.wpn.recoil.slide;
      if (this.slide.locked && t > 0.3) off = this.wpn.recoil.slide * 0.92;
      this.applySlide(off);
    }

    if (this.flashT > 0) {
      this.flashT -= dt;
      if (this.flashT <= 0) {
        this.flashEl.setAttribute('opacity', '0');
        if (this.jetsEl) this.jetsEl.setAttribute('opacity', '0');
      }
    }
    if (this.puffT > 0) {
      this.puffT -= dt;
      const k = 1 - Math.max(0, this.puffT) / 0.5;
      this.puffEl.setAttribute('r', f(14 + k * 40));
      this.puffEl.setAttribute('cx', f(this.tip[0] + 8 + k * 30));
      this.puffEl.setAttribute('cy', f(this.tip[1] + k * 14));
      this.puffEl.setAttribute('opacity', f(0.6 * (1 - k)));
    }

    // douilles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.t += dt;
      p.vy -= 9800 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.a += p.va * dt;
      p.el.setAttribute('transform', `translate(${f(p.x)} ${f(p.y)}) rotate(${f(p.a)})`);
      p.el.setAttribute('opacity', f(Math.max(0, 1 - p.t / 0.75)));
      if (p.t > 0.75) {
        p.el.remove();
        this.particles.splice(i, 1);
      }
    }
    return moving || this.particles.length > 0;
  }

  applyRecoil() {
    const p = this.wpn.mounts.pivot;
    this.recEl.setAttribute('transform', `translate(${f(-this.rec.x)} 0) rotate(${f(this.rec.a)} ${p.x} ${p.y})`);
  }
}

function railTeeth(x0, x1, y) {
  let d = '';
  for (let x = x0 + 1; x < x1 - 4; x += 10.01) d += rect(x, y - 3.5, x + 4.2, y, 0.5) + ' ';
  return d;
}
