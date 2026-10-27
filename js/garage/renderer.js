// Rendu « studio » par calques SVG : teinte de base + ombrage (multiply) + reflets d'horizon
// + paillettes métal + nacre + reflets spéculaires, tous découpés au masque de carrosserie.
import { wheelSVG } from './wheels.js';
import { xraySVG } from './xray.js';

export const G = 350; // ligne de sol (unités SVG)
const K = 0.178; // px SVG par mm — échelle commune : les gabarits relatifs sont respectés
const f = (n) => (+n).toFixed(1);
const CONTENT = { x: 48, y: 40, w: 904, h: 372 };

export function mapper(car) {
  const x0 = 500 - (car.length * K) / 2;
  const X = (x) => x0 + x * K;
  const Y = (y) => G - y * K;
  const path = (d) => d.replace(/(-?\d+(?:\.\d+)?)[\s,]+(-?\d+(?:\.\d+)?)/g, (_, a, b) => `${f(X(+a))} ${f(Y(+b))}`);
  return { X, Y, path, k: K, x0, x1: X(car.length) };
}

function archPoints(m, w, yb, extra = 0) {
  const cx = m.X(w.x);
  const cy = m.Y(w.y);
  const ra = w.arch * K + extra;
  const dy = yb - cy;
  const ax = Math.sqrt(Math.max(ra * ra - dy * dy, 0));
  return { cx, cy, ra, ax };
}

function bodyPath(car, m) {
  const g = car.geo;
  const yb = m.Y(g.sill);
  let d = m.path(g.top.replace(/\s+/g, ' '));
  for (const [x, y] of g.rearBottom) d += ` L ${f(m.X(x))} ${f(m.Y(y))}`;
  for (const w of [g.wheels[1], g.wheels[0]]) {
    const a = archPoints(m, w, yb);
    d += ` L ${f(a.cx + a.ax)} ${f(yb)} A ${f(a.ra)} ${f(a.ra)} 0 1 0 ${f(a.cx - a.ax)} ${f(yb)}`;
  }
  for (const [x, y] of g.frontBottom) d += ` L ${f(m.X(x))} ${f(m.Y(y))}`;
  return d + ' Z';
}

function flarePath(m, w, yb, extra) {
  const a = archPoints(m, w, yb, extra);
  return `M ${f(a.cx + a.ax)} ${f(yb)} A ${f(a.ra)} ${f(a.ra)} 0 1 0 ${f(a.cx - a.ax)} ${f(yb)}`;
}

function stops(list, y0, y1) {
  return list.map(([y, c, o]) => `<stop offset="${Math.min(1, Math.max(0, (y - y0) / (y1 - y0))).toFixed(4)}" stop-color="${c}" stop-opacity="${o}"/>`).join('');
}

// Texture de paillettes générée une fois (évite les filtres SVG coûteux sur mobile).
let FLAKE_URL = null;
function flakeTexture() {
  if (FLAKE_URL) return FLAKE_URL;
  try {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const x = c.getContext('2d');
    for (let i = 0; i < 800; i++) {
      const a = Math.pow(Math.random(), 4) * 0.95;
      x.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`;
      x.fillRect(Math.random() * 128, Math.random() * 128, 1, 1);
    }
    FLAKE_URL = c.toDataURL('image/png');
  } catch {
    FLAKE_URL = '';
  }
  return FLAKE_URL;
}

const STATIC_DEFS = `
  <radialGradient id="g-tire" cx="50%" cy="50%" r="50%">
    <stop offset=".68" stop-color="#18191b"/><stop offset=".76" stop-color="#2a2b2e"/><stop offset=".86" stop-color="#1f2022"/>
    <stop offset=".95" stop-color="#101112"/><stop offset="1" stop-color="#050506"/>
  </radialGradient>
  <radialGradient id="g-disc" cx="45%" cy="40%" r="60%">
    <stop offset="0" stop-color="#7c7f83"/><stop offset=".7" stop-color="#46494d"/><stop offset="1" stop-color="#2a2c2f"/>
  </radialGradient>
  <linearGradient id="g-rimshade" x1="0" y1="0" x2=".25" y2="1">
    <stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".42" stop-color="#fff" stop-opacity="0"/>
    <stop offset=".62" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".5"/>
  </linearGradient>
  <linearGradient id="g-caliper-shade" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".4"/>
  </linearGradient>
  <radialGradient id="g-cavity" cx="50%" cy="40%" r="55%">
    <stop offset="0" stop-color="#16171a"/><stop offset=".8" stop-color="#08090a"/><stop offset="1" stop-color="#030304"/>
  </radialGradient>
  <radialGradient id="g-shadow" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="#000" stop-opacity=".85"/><stop offset=".55" stop-color="#000" stop-opacity=".5"/><stop offset="1" stop-color="#000" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="g-black" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#26282c"/><stop offset=".25" stop-color="#0d0e10"/><stop offset="1" stop-color="#050506"/>
  </linearGradient>
  <linearGradient id="g-gloss" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/>
  </linearGradient>
  <linearGradient id="g-chrome" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#ffffff"/><stop offset=".4" stop-color="#a3a9b0"/><stop offset=".52" stop-color="#2e3237"/>
    <stop offset=".8" stop-color="#cdd2d7"/><stop offset="1" stop-color="#f5f7f9"/>
  </linearGradient>
  <pattern id="p-carbon" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <rect width="4" height="4" fill="#121316"/><rect width="2" height="2" fill="#24262b"/><rect x="2" y="2" width="2" height="2" fill="#24262b"/>
  </pattern>
  <pattern id="p-mesh" width="6" height="10.4" patternUnits="userSpaceOnUse">
    <rect width="6" height="10.4" fill="#040405"/>
    <path d="M3 0L6 1.7V5.2L3 6.9L0 5.2V1.7ZM3 6.9V10.4" fill="none" stroke="#2b2d31" stroke-width=".7"/>
  </pattern>
  <linearGradient id="g-lamp" x1="0" y1="0" x2="1" y2=".6">
    <stop offset="0" stop-color="#55626f"/><stop offset=".35" stop-color="#121820"/><stop offset=".62" stop-color="#3d4854"/><stop offset="1" stop-color="#0a0d10"/>
  </linearGradient>
  <linearGradient id="g-tail" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#7a0c12"/><stop offset=".5" stop-color="#3a0408"/><stop offset="1" stop-color="#1c0204"/>
  </linearGradient>
  <linearGradient id="g-glassbg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#3a3f47"/><stop offset=".55" stop-color="#1d2026"/><stop offset="1" stop-color="#0d0f12"/>
  </linearGradient>
  <linearGradient id="g-glassref" x1="0" y1="0" x2="1" y2=".55">
    <stop offset="0" stop-color="#fff" stop-opacity=".02"/><stop offset=".28" stop-color="#fff" stop-opacity=".2"/>
    <stop offset=".36" stop-color="#fff" stop-opacity=".03"/><stop offset=".62" stop-color="#fff" stop-opacity=".1"/><stop offset=".72" stop-color="#fff" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="g-cabin" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#1c1e22"/><stop offset=".5" stop-color="#0d0e10"/><stop offset="1" stop-color="#050506"/>
  </linearGradient>
  <linearGradient id="g-seat" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#3a3c41"/><stop offset="1" stop-color="#121316"/>
  </linearGradient>
  <linearGradient id="g-mirror" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/>
  </linearGradient>
  <linearGradient id="g-sweep" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".42"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
  </linearGradient>
  <radialGradient id="g-glow-w"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".18" stop-color="#dcebff" stop-opacity=".6"/><stop offset=".5" stop-color="#9cc6ff" stop-opacity=".16"/><stop offset="1" stop-color="#9cc6ff" stop-opacity="0"/></radialGradient>
  <radialGradient id="g-glow-r"><stop offset="0" stop-color="#ffd0d0" stop-opacity=".95"/><stop offset=".22" stop-color="#ff2a2a" stop-opacity=".6"/><stop offset="1" stop-color="#ff0000" stop-opacity="0"/></radialGradient>
  <radialGradient id="g-pool"><stop offset="0" stop-color="#e6f0ff" stop-opacity=".4"/><stop offset=".6" stop-color="#bcd6ff" stop-opacity=".1"/><stop offset="1" stop-color="#bcd6ff" stop-opacity="0"/></radialGradient>
  <radialGradient id="g-flame" cx="15%" cy="50%" r="85%"><stop offset="0" stop-color="#fff6d0"/><stop offset=".35" stop-color="#ffb02e"/><stop offset=".75" stop-color="#ff4a12" stop-opacity=".7"/><stop offset="1" stop-color="#ff2a00" stop-opacity="0"/></radialGradient>
  <linearGradient id="g-reflmask" gradientUnits="userSpaceOnUse" x1="0" y1="${G}" x2="0" y2="${G + 120}">
    <stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
  </linearGradient>
  <mask id="m-reflect" maskUnits="userSpaceOnUse" x="-3000" y="${G}" width="7000" height="200">
    <rect x="-3000" y="${G}" width="7000" height="200" fill="url(#g-reflmask)"/>
  </mask>`;

export class StageRenderer {
  constructor(floorSvg, carSvg) {
    this.floor = floorSvg;
    this.svg = carSvg;
    this.car = null;
    this.pistons = [];
    this.rotors = [];
    this.floor.innerHTML = `<defs>
      <linearGradient id="g-floor" gradientUnits="userSpaceOnUse" x1="0" y1="${G}" x2="0" y2="${G + 420}">
        <stop offset="0" stop-color="#16181c"/><stop offset=".35" stop-color="#0c0d10"/><stop offset="1" stop-color="#050607"/>
      </linearGradient>
      <radialGradient id="g-spot"><stop offset="0" stop-color="#fff" stop-opacity=".09"/><stop offset=".6" stop-color="#fff" stop-opacity=".03"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
      <linearGradient id="g-cove" gradientUnits="userSpaceOnUse" x1="0" y1="${G - 60}" x2="0" y2="${G}">
        <stop offset="0" stop-color="#16181c" stop-opacity="0"/><stop offset="1" stop-color="#16181c"/>
      </linearGradient>
    </defs>
    <rect x="-4000" y="${G - 60}" width="9000" height="60" fill="url(#g-cove)"/>
    <rect x="-4000" y="${G}" width="9000" height="4000" fill="url(#g-floor)"/>
    <ellipse cx="500" cy="${G + 8}" rx="560" ry="64" fill="url(#g-spot)"/>
    <ellipse cx="500" cy="${G + 6}" rx="480" ry="30" fill="none" stroke="#fff" stroke-opacity=".06" stroke-width="1"/>
    <ellipse cx="500" cy="${G + 6}" rx="500" ry="33" fill="none" stroke="#fff" stroke-opacity=".03" stroke-width="3"/>`;
  }

  fit(w, h) {
    if (!w || !h) return;
    const s = Math.min(w / CONTENT.w, h / CONTENT.h);
    const vw = w / s;
    const vh = h / s;
    const vx = CONTENT.x + CONTENT.w / 2 - vw / 2;
    const vy = CONTENT.y - (vh - CONTENT.h) * 0.6;
    const vb = `${f(vx)} ${f(vy)} ${f(vw)} ${f(vh)}`;
    this.svg.setAttribute('viewBox', vb);
    this.floor.setAttribute('viewBox', vb);
    this.view = { vx, vy, vw, vh, s };
  }

  // Position écran (px CSS, relative au conteneur) d'un point SVG.
  toScreen(x, y) {
    const v = this.view;
    return v ? [(x - v.vx) * v.s, (y - v.vy) * v.s] : [0, 0];
  }

  mount(car, state) {
    const m = mapper(car);
    car._map = m;
    this.car = car;
    const g = car.geo;
    const P = (d) => m.path(d);
    const yb = m.Y(g.sill);
    const body = bodyPath(car, m);
    const roofY = m.Y(g.roof);
    const botY = m.Y(80);
    const sillTop = m.Y(g.sill + 150);
    const [c0, c1] = g.crease.map(([x, y]) => [m.X(x), m.Y(y)]);
    const ang = (Math.atan2(c1[1] - c0[1], c1[0] - c0[0]) * 180) / Math.PI;
    const creaseY = c0[1] + ((500 - c0[0]) * (c1[1] - c0[1])) / (c1[0] - c0[0]);
    const mid = creaseY + (sillTop - creaseY) * 0.55;
    const W = 'white';
    const B = 'black';

    const sharp = stops([
      [roofY, W, 0.34], [creaseY - 16, W, 0.1], [creaseY - 3, W, 0.46], [creaseY, W, 0.04], [creaseY + 1.5, B, 0.32],
      [creaseY + 14, B, 0.12], [mid, W, 0.09], [sillTop - 4, B, 0.14], [sillTop, B, 0.45], [botY, B, 0.62],
    ], roofY, botY);
    const soft = stops([
      [roofY, W, 0.2], [creaseY - 12, W, 0.15], [creaseY + 12, W, 0.03], [mid, B, 0.08], [sillTop, B, 0.3], [botY, B, 0.5],
    ], roofY, botY);
    const gt = `gradientUnits="userSpaceOnUse" x1="500" y1="${f(roofY)}" x2="500" y2="${f(botY)}" gradientTransform="rotate(${ang.toFixed(2)} 500 ${f(creaseY)})"`;

    const [wf, wr] = g.wheels;
    const wheelsPx = g.wheels.map((w) => ({ cx: m.X(w.x), cy: m.Y(w.y), R: w.R * K, r: w.rim * K }));
    this.wheelsPx = wheelsPx;

    const defs = `${STATIC_DEFS}
      <pattern id="p-flake" width="64" height="64" patternUnits="userSpaceOnUse"><image href="${flakeTexture()}" width="64" height="64"/></pattern>
      <clipPath id="clip-body"><path d="${body}"/></clipPath>
      <clipPath id="clip-glass"><path d="${P(g.glass)}"/></clipPath>
      <clipPath id="clip-sill"><rect x="-200" y="-200" width="1400" height="${f(yb + 200)}"/></clipPath>
      <linearGradient id="g-sharp" ${gt}>${sharp}</linearGradient>
      <linearGradient id="g-soft" ${gt}>${soft}</linearGradient>
      <linearGradient id="g-shadex" gradientUnits="userSpaceOnUse" x1="${f(m.x0)}" y1="0" x2="${f(m.x1)}" y2="0">
        <stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset=".06" stop-color="#000" stop-opacity=".2"/>
        <stop offset=".17" stop-color="#000" stop-opacity="0"/><stop offset=".84" stop-color="#000" stop-opacity="0"/>
        <stop offset=".94" stop-color="#000" stop-opacity=".22"/><stop offset="1" stop-color="#000" stop-opacity=".55"/>
      </linearGradient>
      <linearGradient id="g-streak" gradientUnits="userSpaceOnUse" x1="${f(c0[0])}" y1="0" x2="${f(c1[0])}" y2="0">
        <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".25" stop-color="#fff" stop-opacity=".55"/>
        <stop offset=".55" stop-color="#fff" stop-opacity=".85"/><stop offset=".85" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="g-rimlight" gradientUnits="userSpaceOnUse" x1="${f(m.x0)}" y1="0" x2="${f(m.x1)}" y2="0">
        <stop offset="0" stop-color="#fff" stop-opacity=".05"/><stop offset=".3" stop-color="#fff" stop-opacity=".55"/>
        <stop offset=".5" stop-color="#fff" stop-opacity=".9"/><stop offset=".75" stop-color="#fff" stop-opacity=".45"/><stop offset="1" stop-color="#fff" stop-opacity=".05"/>
      </linearGradient>
      <linearGradient id="g-pearl" gradientUnits="userSpaceOnUse" x1="${f(m.x0)}" y1="${f(roofY)}" x2="${f(m.x1)}" y2="${f(botY)}">
        <stop offset="0" style="stop-color:var(--pearl)" stop-opacity="0"/><stop offset=".22" style="stop-color:var(--pearl)" stop-opacity=".75"/>
        <stop offset=".45" style="stop-color:var(--pearl)" stop-opacity=".05"/><stop offset=".68" style="stop-color:var(--pearl)" stop-opacity=".6"/>
        <stop offset="1" style="stop-color:var(--pearl)" stop-opacity="0"/>
      </linearGradient>`;

    // ——— Éléments ———
    const cavities = g.wheels.map((w) => {
      const a = archPoints(m, w, yb);
      return `<circle cx="${f(a.cx)}" cy="${f(a.cy)}" r="${f(a.ra)}" fill="url(#g-cavity)"/>`;
    }).join('');
    const wheels = wheelsPx.map((w, i) => wheelSVG(i, w.cx, w.cy, w.R, w.r, state.rimStyle)).join('');
    const shadows = wheelsPx.map((w) => `<ellipse cx="${f(w.cx)}" cy="${f(G + 1)}" rx="${f(w.R * 0.95)}" ry="5" fill="url(#g-shadow)"/>`).join('');
    const flares = g.wheels.map((w) => `<path d="${flarePath(m, w, yb, 1.2)}" class="flare-sh"/><path d="${flarePath(m, w, yb, 5)}" class="flare-hl"/>`).join('');

    const streak = `M ${f(c0[0])} ${f(c0[1] - 2)} L ${f(c1[0])} ${f(c1[1] - 2)} L ${f(c1[0])} ${f(c1[1] - 6)} L ${f(c0[0])} ${f(c0[1] - 9)} Z`;
    const topLine = P(g.top.replace(/\s+/g, ' '));

    const lines = g.lines.map((l) => {
      const d = P(l.d);
      if (l.k === 'gap') return `<path d="${d}" class="ln-gap"/><path d="${d}" class="ln-gap-hl" transform="translate(0 .9)"/>`;
      return `<path d="${d}" class="ln-crease-hl"/><path d="${d}" class="ln-crease-sh" transform="translate(0 1.6)"/>`;
    }).join('');

    const trims = g.trims.map((t) => {
      const d = P(t.d);
      if (t.k === 'carbon') return `<path d="${d}" fill="url(#p-carbon)"/><path d="${d}" fill="url(#g-gloss)"/>`;
      if (t.k === 'mesh') return `<path d="${d}" fill="url(#p-mesh)"/><path d="${d}" fill="url(#g-gloss)" opacity=".6"/>`;
      if (t.k === 'chrome') return `<path d="${d}" fill="url(#g-chrome)"/>`;
      return `<path d="${d}" fill="url(#g-black)"/>`;
    }).join('');

    const exhausts = (g.exhausts || []).map((e) => {
      const cx = m.X(e.x);
      const cy = m.Y(e.y);
      const ry = e.ry * K * 0.8;
      const len = e.rx * K * 1.6;
      return `<rect x="${f(cx - len)}" y="${f(cy - ry)}" width="${f(len)}" height="${f(ry * 2)}" rx="${f(ry * 0.5)}" fill="url(#g-chrome)" opacity=".85"/>
        <ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(ry * 0.4)}" ry="${f(ry)}" fill="#bfc4ca"/>
        <ellipse cx="${f(cx + 0.3)}" cy="${f(cy)}" rx="${f(ry * 0.28)}" ry="${f(ry * 0.78)}" fill="#050505"/>`;
    }).join('');
    const ex0 = g.exhausts && g.exhausts[0];
    this.exhaust = ex0 ? [m.X(ex0.x) + 0.5, m.Y(ex0.y)] : null;
    const flame = this.exhaust
      ? `<path class="flame" d="M ${f(this.exhaust[0])} ${f(this.exhaust[1] - 3.5)} C ${f(this.exhaust[0] + 18)} ${f(this.exhaust[1] - 9)} ${f(this.exhaust[0] + 34)} ${f(this.exhaust[1] - 3)} ${f(this.exhaust[0] + 46)} ${f(this.exhaust[1])} C ${f(this.exhaust[0] + 34)} ${f(this.exhaust[1] + 3)} ${f(this.exhaust[0] + 18)} ${f(this.exhaust[1] + 8)} ${f(this.exhaust[0])} ${f(this.exhaust[1] + 3.5)} Z" fill="url(#g-flame)"/>`
      : '';

    const wing = g.wing
      ? `<g class="wing">${g.wing.posts.map((d) => `<path d="${P(d)}" fill="url(#p-carbon)"/><path d="${P(d)}" fill="url(#g-gloss)"/>`).join('')}
        <path d="${P(g.wing.plate)}" fill="url(#p-carbon)" opacity=".94"/><path d="${P(g.wing.plate)}" fill="url(#g-gloss)"/>
        <path d="${P(g.wing.plate)}" fill="none" stroke="#000" stroke-opacity=".6" stroke-width=".8"/>
        <path d="${P(g.wing.foil)}" fill="#08090a"/><path d="${P(g.wing.foil)}" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width=".7"/></g>`
      : '';

    // Habitacle visible derrière le vitrage (s'efface quand la teinte augmente)
    const seat = ([x, y]) => {
      const hx = m.X(x);
      const hy = m.Y(y);
      const s = K;
      return `<rect x="${f(hx - 70 * s)}" y="${f(hy - 80 * s)}" width="${f(150 * s)}" height="${f(170 * s)}" rx="${f(50 * s)}" fill="url(#g-seat)"/>
        <path d="M ${f(hx - 30 * s)} ${f(hy + 90 * s)} C ${f(hx - 140 * s)} ${f(hy + 200 * s)} ${f(hx - 170 * s)} ${f(hy + 420 * s)} ${f(hx - 150 * s)} ${f(hy + 600 * s)} L ${f(hx + 150 * s)} ${f(hy + 600 * s)} C ${f(hx + 130 * s)} ${f(hy + 400 * s)} ${f(hx + 110 * s)} ${f(hy + 200 * s)} ${f(hx + 60 * s)} ${f(hy + 90 * s)} Z" fill="url(#g-seat)"/>`;
    };
    const steer = g.steering
      ? `<ellipse cx="${f(m.X(g.steering[0]))}" cy="${f(m.Y(g.steering[1]))}" rx="${f(40 * K)}" ry="${f(190 * K)}" transform="rotate(-24 ${f(m.X(g.steering[0]))} ${f(m.Y(g.steering[1]))})" fill="none" stroke="#2b2d31" stroke-width="2.4"/>`
      : '';
    const pillars = (g.pillars || []).map((d) => `<path d="${P(d)}" fill="#050506"/>`).join('');
    const glassD = P(g.glass);
    const glassFrame = g.chromeGlass
      ? `<path d="${glassD}" fill="none" stroke="url(#g-chrome)" stroke-width="2.4"/>`
      : `<path d="${glassD}" fill="none" stroke="#050506" stroke-width="${g.trimGlass ? 3 : 1.6}"/>`;
    const hatch = g.hatch ? `<path d="${P(g.hatch)}" fill="#0b0d10"/><path d="${P(g.hatch)}" fill="url(#g-glassref)"/>` : '';

    const handles = (g.handles || []).map(([x, y, len, type]) => {
      const hx = m.X(x);
      const hy = m.Y(y);
      const w = len * K;
      if (type === 'flush') return `<rect x="${f(hx - w / 2)}" y="${f(hy - 2.4)}" width="${f(w)}" height="4.8" rx="2.4" fill="none" stroke="#000" stroke-opacity=".5" stroke-width=".8"/><rect x="${f(hx - w / 2 + 1)}" y="${f(hy - 1.6)}" width="${f(w - 2)}" height="1" rx=".5" fill="#fff" opacity=".18"/>`;
      return `<rect x="${f(hx - w / 2)}" y="${f(hy - 3)}" width="${f(w)}" height="6" rx="3" fill="#000" opacity=".45"/><rect x="${f(hx - w / 2 + 1)}" y="${f(hy - 3.6)}" width="${f(w - 2)}" height="5" rx="2.5" class="paint"/><rect x="${f(hx - w / 2 + 1)}" y="${f(hy - 3.6)}" width="${f(w - 2)}" height="5" rx="2.5" fill="url(#g-mirror)"/>`;
    }).join('');

    // Feux
    const head = g.head;
    const hc = [m.X(head.c[0]), m.Y(head.c[1])];
    const tc = [m.X(g.tail.c[0]), m.Y(g.tail.c[1])];
    this.headPx = hc;
    const headD = P(head.d);
    const lamps = `<path d="${headD}" fill="url(#g-lamp)" class="lamp-head"/>
      <path d="${headD}" fill="none" stroke="#000" stroke-opacity=".7" stroke-width=".8"/>
      <circle cx="${f(hc[0] - 6)}" cy="${f(hc[1] + 1)}" r="3.4" class="proj"/><circle cx="${f(hc[0] + 6)}" cy="${f(hc[1] + 2.4)}" r="3" class="proj"/>
      <path d="${P(head.drl)}" class="drl-base"/>
      <g class="drl-segs" data-drl="${P(head.drl)}" data-matrix="${head.matrix ? 1 : 0}"></g>
      <path d="${P(g.tail.d)}" fill="url(#g-tail)" class="lamp-tail"/>
      <path d="${P(g.tail.d)}" fill="url(#g-gloss)" opacity=".8"/>
      ${g.marker ? `<path d="${P(g.marker)}" fill="#a35a00" class="lamp-marker"/>` : ''}`;

    const beamLen = 360;
    const beam = `<linearGradient id="g-beamx" gradientUnits="userSpaceOnUse" x1="${f(hc[0])}" y1="0" x2="${f(hc[0] - beamLen)}" y2="0">
        <stop offset="0" stop-color="#eaf3ff" stop-opacity=".42"/><stop offset=".4" stop-color="#cfe2ff" stop-opacity=".14"/><stop offset="1" stop-color="#cfe2ff" stop-opacity="0"/></linearGradient>`;
    const fx = `<g class="fx">
      <path class="beam" d="M ${f(hc[0])} ${f(hc[1] - 3)} L ${f(hc[0] - beamLen)} ${f(hc[1] - 46)} L ${f(hc[0] - beamLen)} ${f(G + 10)} L ${f(hc[0])} ${f(hc[1] + 5)} Z" fill="url(#g-beamx)"/>
      <ellipse class="beam" cx="${f(hc[0] - 175)}" cy="${f(G + 3)}" rx="200" ry="13" fill="url(#g-pool)"/>
      <circle class="glow-head" cx="${f(hc[0])}" cy="${f(hc[1])}" r="54" fill="url(#g-glow-w)"/>
      <circle class="glow-tail" cx="${f(tc[0])}" cy="${f(tc[1])}" r="34" fill="url(#g-glow-r)"/>
      ${flame}
    </g>`;

    // Portière
    const door = g.door;
    const doorD = `${P(door.panel)} ${P(door.glass)}`;
    const hingeX = m.X(door.hinge);
    this.hingeX = hingeX;
    const seatSide = g.seats[0]
      ? (() => {
        const [x, y] = g.seats[0];
        const hx = m.X(x);
        const hy = m.Y(y);
        return `<path d="M ${f(hx - 14)} ${f(hy - 12)} C ${f(hx + 2)} ${f(hy - 14)} ${f(hx + 6)} ${f(hy + 2)} ${f(hx + 4)} ${f(hy + 18)} L ${f(hx + 12)} ${f(hy + 62)} L ${f(hx - 56)} ${f(hy + 64)} C ${f(hx - 62)} ${f(hy + 54)} ${f(hx - 50)} ${f(hy + 48)} ${f(hx - 22)} ${f(hy + 46)} L ${f(hx - 22)} ${f(hy + 16)} C ${f(hx - 24)} ${f(hy)} ${f(hx - 22)} ${f(hy - 10)} ${f(hx - 14)} ${f(hy - 12)} Z" fill="url(#g-seat)"/>`;
      })()
      : '';
    const sillY = m.Y(g.sill + 150);
    const doorEls = `<g class="door-ap"><path d="${doorD}" fill="url(#g-cabin)"/>${seatSide}
        <path d="M ${f(hingeX)} ${f(sillY - 3)} H ${f(m.X(door.hinge) + 1200 * K)}" stroke="url(#g-chrome)" stroke-width="1.6" opacity=".7"/>
        <path d="${P(door.panel)}" fill="none" stroke="#000" stroke-width="1.2"/></g>
      <g class="door"><g class="door-t">
        <path d="${P(door.glass)}" fill="#0b0d10" class="door-glass"/><path d="${P(door.glass)}" fill="url(#g-glassref)"/>
        <path d="${P(door.panel)}" class="paint"/><path d="${P(door.panel)}" fill="url(#g-mirror)" opacity=".6"/>
        <path d="${P(door.panel)}" fill="#000" class="door-dark"/>
      </g></g>`;

    // Capot
    const hood = g.hood;
    const pv = [m.X(hood.pivot[0]), m.Y(hood.pivot[1])];
    this.hoodPivot = pv;
    this.hoodAngle = hood.angle;
    const hoodD = P(hood.d);
    const hoodEls = `<g class="bay-gap"><path d="${hoodD}" fill="#07080a" transform="translate(0 2)"/><path d="${hoodD}" fill="#0c0d10"/></g>
      <g class="hood"><g class="hood-t">
        <path d="${hoodD}" fill="#1a1b1e" transform="translate(0 9)" class="hood-under"/>
        <path d="${hoodD}" fill="#101113" transform="translate(0 5)" class="hood-under"/>
        <path d="${hoodD}" class="paint"/><path d="${hoodD}" fill="url(#g-mirror)" opacity=".7"/>
      </g></g>`;

    const xr = xraySVG(car);

    // Noyau statique du véhicule : réutilisé tel quel pour le reflet au sol
    // (une copie réelle plutôt qu'un <use>, pour que les styles CSS s'appliquent).
    const core = `<g clip-path="url(#clip-sill)">${cavities}</g>
        <g class="wheels">${wheels}</g>
        <g class="body">
          <path d="${body}" class="paint body-base"/>
          <g clip-path="url(#clip-body)">
            <rect class="l-shade" x="0" y="0" width="1000" height="${G + 20}" fill="url(#g-shadex)"/>
            <rect class="l-sharp" x="0" y="0" width="1000" height="${G + 20}" fill="url(#g-sharp)"/>
            <rect class="l-soft" x="0" y="0" width="1000" height="${G + 20}" fill="url(#g-soft)"/>
            <rect class="l-flake" x="0" y="0" width="1000" height="${G + 20}" fill="url(#p-flake)"/>
            <rect class="l-pearl" x="0" y="0" width="1000" height="${G + 20}" fill="url(#g-pearl)"/>
            <path class="l-streak" d="${streak}" fill="url(#g-streak)"/>
            <path class="l-rim" d="${topLine}" fill="none" stroke="url(#g-rimlight)" stroke-width="2.4"/>
            ${flares}
            <rect class="sweep" x="-260" y="0" width="150" height="${G + 20}" fill="url(#g-sweep)" transform="skewX(-18)"/>
          </g>
          <path d="${body}" fill="none" stroke="#000" stroke-opacity=".35" stroke-width=".7"/>
          ${lines}${trims}${lamps}${exhausts}${wing}
          <g class="glass">
            <path d="${glassD}" fill="url(#g-glassbg)"/>
            <g clip-path="url(#clip-glass)" class="interior">${g.seats.map(seat).join('')}${steer}</g>
            <path d="${glassD}" fill="#030405" class="tint"/>
            <path d="${glassD}" fill="url(#g-glassref)"/>
            ${pillars}${glassFrame}
          </g>
          ${hatch}
          <path d="${P(g.mirror)}" class="paint"/><path d="${P(g.mirror)}" fill="url(#g-mirror)"/>
          <path d="${P(g.mirror)}" fill="none" stroke="#000" stroke-opacity=".5" stroke-width=".7"/>
          ${handles}
        </g>`;

    this.svg.innerHTML = `<defs>${defs}${beam}</defs>
      <g id="car-move">
        <g class="reflect" mask="url(#m-reflect)"><g transform="matrix(1 0 0 -1 0 ${2 * G})" opacity=".2">${core}</g></g>
        <ellipse cx="500" cy="${G + 2}" rx="${f((m.x1 - m.x0) * 0.56)}" ry="17" fill="url(#g-shadow)"/>
        ${shadows}
        ${core}
        ${doorEls}${hoodEls}
        <g class="xray">${xr.parts.join('')}</g>
        ${fx}
      </g>`;

    this.moveEl = this.svg.querySelector('#car-move');
    this.collectWheels();
    this.hoodEl = this.svg.querySelector('.hood-t');
    this.doorEl = this.svg.querySelector('.door-t');
    this.doorDark = this.svg.querySelector('.door-dark');
    this.sweepEls = [...this.svg.querySelectorAll('.sweep')];
    this.flameEl = this.svg.querySelector('.flame');
    this.pistons = xr.pistons.map((p, i) => ({ ...p, el: this.svg.querySelectorAll('.x-piston')[i], rod: this.svg.querySelectorAll('.x-rod')[i] }));
    this.rotors = [...this.svg.querySelectorAll('.x-rotor')].map((el) => ({ el, cx: el.dataset.cx, cy: el.dataset.cy, ratio: +el.dataset.ratio }));
    this.buildDRL();
    this.hoodT = 0;
    this.doorT = 0;
    this.wheelAngle = 0;
    this.applyState(state);
  }

  collectWheels() {
    this.rotEls = [...this.svg.querySelectorAll('.wheel')].map((w) => {
      const p = this.wheelsPx[+w.dataset.i];
      return { els: [...w.querySelectorAll('.rot')], cx: p.cx, cy: p.cy };
    });
  }

  buildDRL() {
    for (const host of this.svg.querySelectorAll('.drl-segs')) this.buildDRLHost(host);
  }

  buildDRLHost(host) {
    const d = host.dataset.drl;
    const tmp = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    tmp.setAttribute('d', d);
    host.appendChild(tmp);
    let len = 60;
    try { len = tmp.getTotalLength() || 60; } catch { /* rendu hors DOM */ }
    host.removeChild(tmp);
    const n = host.dataset.matrix === '1' ? 9 : 1;
    const seg = len / n;
    let html = '';
    for (let i = 0; i < n; i++) {
      html += `<path d="${d}" class="drl" style="stroke-dasharray:${f(seg * 0.82)} ${f(len * 2)};stroke-dashoffset:${f(-i * seg)};transition-delay:${i * 55}ms"/>`;
    }
    host.innerHTML = html;
  }

  applyState(s) {
    this.setPaint(s.paint, false);
    this.setFinish(s.finish);
    this.setTint(s.tint);
    this.setLights(s.lights);
    this.setHood(s.hood, true);
    this.setDoor(s.door, true);
  }

  setPaint(hex, sweep = true) {
    const root = this.svg;
    root.style.setProperty('--paint', hex);
    root.style.setProperty('--pearl', pearlTone(hex));
    if (sweep) this.sweep();
  }

  setFinish(id) {
    this.svg.dataset.finish = id;
  }

  setTint(pct) {
    this.svg.style.setProperty('--tint', (pct / 100).toFixed(3));
    this.svg.style.setProperty('--cabin', (1 - Math.pow(pct / 100, 1.4) * 0.92).toFixed(3));
  }

  setLights(on) {
    this.svg.classList.toggle('lights-on', !!on);
  }

  setRims(style) {
    if (!this.car) return;
    const html = this.wheelsPx.map((w, i) => wheelSVG(i, w.cx, w.cy, w.R, w.r, style)).join('');
    for (const holder of this.svg.querySelectorAll('.wheels')) holder.innerHTML = html;
    this.collectWheels();
    this.setWheelAngle(this.wheelAngle);
  }

  setHood(open, instant = false) {
    this.svg.classList.toggle('hood-open', !!open);
    this.animate('hoodT', open ? 1 : 0, instant ? 0 : 900, (t) => {
      const e = easeInOut(t);
      this.hoodEl.setAttribute('transform', `rotate(${(this.hoodAngle * e).toFixed(2)} ${f(this.hoodPivot[0])} ${f(this.hoodPivot[1])})`);
      this.svg.classList.toggle('hood-moving', t > 0.001);
    });
  }

  setDoor(open, instant = false) {
    this.svg.classList.toggle('door-open', !!open);
    this.animate('doorT', open ? 1 : 0, instant ? 0 : 750, (t) => {
      const e = easeInOut(t);
      const sx = 1 - e * 0.7;
      const hx = this.hingeX;
      this.doorEl.setAttribute('transform', `translate(${f(hx)} 0) scale(${sx.toFixed(3)} ${(1 + e * 0.035).toFixed(3)}) translate(${f(-hx)} ${f(-e * 4)})`);
      this.doorDark.setAttribute('opacity', (e * 0.35).toFixed(3));
      this.svg.classList.toggle('door-moving', t > 0.001);
    });
  }

  animate(key, target, dur, apply) {
    cancelAnimationFrame(this['_raf_' + key]);
    const from = this[key];
    if (!dur || from === target) {
      this[key] = target;
      apply(target);
      return;
    }
    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur);
      this[key] = from + (target - from) * k;
      apply(this[key]);
      if (k < 1) this['_raf_' + key] = requestAnimationFrame(step);
    };
    this['_raf_' + key] = requestAnimationFrame(step);
  }

  sweep() {
    const els = this.sweepEls;
    if (!els || !els.length) return;
    cancelAnimationFrame(this._sweepRaf);
    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / 900);
      for (const el of els) el.setAttribute('x', f(-260 + easeInOut(k) * 1500));
      if (k < 1) this._sweepRaf = requestAnimationFrame(step);
    };
    this._sweepRaf = requestAnimationFrame(step);
  }

  setOffset(dx) {
    this.moveEl.setAttribute('transform', `translate(${f(dx)} 0)`);
  }

  setWheelAngle(deg) {
    this.wheelAngle = deg;
    for (const w of this.rotEls) {
      const t = `rotate(${(deg % 360).toFixed(2)} ${f(w.cx)} ${f(w.cy)})`;
      for (const el of w.els) el.setAttribute('transform', t);
    }
  }

  setEngine(crankDeg) {
    if (!this.pistons.length && !this.rotors.length) return;
    for (const p of this.pistons) {
      const a = ((crankDeg - p.th) * Math.PI) / 180;
      const c = Math.cos(a);
      const s = Math.sin(a);
      const y = p.top + (p.travel * (1 - c)) / 2;
      p.el.setAttribute('y', f(y));
      p.rod.setAttribute('y1', f(y + p.ph * 0.6));
      p.rod.setAttribute('x2', f(p.cx + (p.travel / 2) * s));
      p.rod.setAttribute('y2', f(p.crankY - (p.travel / 2) * c));
    }
    for (const r of this.rotors) r.el.setAttribute('transform', `rotate(${((crankDeg * r.ratio) % 360).toFixed(1)} ${r.cx} ${r.cy})`);
  }

  flash(amount) {
    if (!this.flameEl) return;
    this.flameEl.style.opacity = Math.min(1, 0.4 + amount).toFixed(2);
    this.flameEl.setAttribute('transform', `translate(${f(this.exhaust[0])} ${f(this.exhaust[1])}) scale(${(0.6 + Math.random() * 0.7).toFixed(2)} ${(0.7 + Math.random() * 0.5).toFixed(2)}) translate(${f(-this.exhaust[0])} ${f(-this.exhaust[1])})`);
    clearTimeout(this._flameT);
    this._flameT = setTimeout(() => { this.flameEl.style.opacity = 0; }, 45 + Math.random() * 50);
  }
}

function easeInOut(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Teinte d'interférence de la nacre : rotation de teinte + éclaircissement.
export function pearlTone(hex) {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex((h + 24) % 360, Math.min(1, s * 0.95 + 0.08), Math.min(0.7, l * 0.55 + 0.2));
}

export function hexToHsl(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, l];
}

export function hslToHex(h, s, l) {
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const c = (n) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));
  return '#' + [c(0), c(8), c(4)].map((v) => v.toString(16).padStart(2, '0')).join('');
}
