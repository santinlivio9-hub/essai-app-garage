// Contrôleur de l'Atelier Garage : état, personnalisation live, moteur, gestes.
import { CARS, FINISHES, RIM_FINISHES } from '../cars/index.js';
import { GarageScene } from './scene3d.js';
import { hexToHsl, hslToHex, pearlTone } from '../core/color.js';
import { creditHTML, creditsReady } from '../core/credits.js';
import { Tach } from './tach.js';
import { Sheet } from '../core/sheet.js';
import { Picker } from '../core/picker.js';
import { card } from '../core/util.js';
import { EngineSim } from '../audio/engine-sim.js';
import { EngineAudio, dspProfile } from '../audio/engine-audio.js';

const STORE = 'ls-garage-v2';
const sv = (p) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const ICON = {
  drl: sv('<path d="M3 10c4-3 10-3 14 0"/><path d="M5 14h10"/><path d="M19 9l2-1M19 12h3M19 15l2 1"/>'),
  beam: sv('<path d="M9 6c-4 0-6 3-6 6s2 6 6 6c1.5 0 2-1 2-6s-.5-6-2-6z"/><path d="M14 8l7-2M14 12h8M14 16l7 2"/>'),
  hood: sv('<path d="M3 16h18M5 16l3-6h8l3 6"/><path d="M8 10l2-4"/><circle cx="7" cy="18.5" r="1.5"/><circle cx="17" cy="18.5" r="1.5"/>'),
  door: sv('<path d="M5 20V8l6-5h8v17z"/><path d="M5 11h14M15 14h2"/>'),
  frame: sv('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 15l5-4 4 3 3-2 6 4"/>'),
};
// Aperçus dessinés des menus : jante (5 doubles branches) teintée selon la finition, étrier, vitre.
let uid = 0;
function rimSVG(base, hi, lo) {
  const id = `rg${uid++}`;
  let win = '';
  for (let k = 0; k < 5; k++) {
    const a = (k * 72 - 90) * Math.PI / 180;
    const p = (r, d) => `${(22 + r * Math.cos(a + d)).toFixed(2)} ${(22 + r * Math.sin(a + d)).toFixed(2)}`;
    win += `<path d="M${p(6, 0.2)}L${p(13.6, 0.13)}A13.6 13.6 0 0 1 ${p(13.6, 1.12)}L${p(6, 1.05)}Z"/>`;
  }
  return `<svg viewBox="0 0 44 44"><defs><radialGradient id="${id}" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="${hi}"/><stop offset=".5" stop-color="${base}"/><stop offset="1" stop-color="${lo}"/></radialGradient></defs>
    <circle cx="22" cy="22" r="21" fill="#0d0e10"/><circle cx="22" cy="22" r="20.2" fill="none" stroke="#26282c" stroke-width="1.2"/>
    <circle cx="22" cy="22" r="16" fill="url(#${id})"/><circle cx="22" cy="22" r="15.2" fill="none" stroke="rgba(0,0,0,.35)" stroke-width=".8"/>
    <g fill="#0a0b0c">${win}</g><circle cx="22" cy="22" r="4.4" fill="url(#${id})" stroke="rgba(0,0,0,.4)" stroke-width=".6"/><circle cx="22" cy="22" r="1.6" fill="#1a1b1d"/></svg>`;
}
function caliperSVG(hex) {
  return `<svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="17" fill="#2b2e33"/><circle cx="22" cy="22" r="17" fill="none" stroke="#565b62" stroke-width="2" stroke-dasharray="1.5 2.2"/><circle cx="22" cy="22" r="6" fill="#16171a"/>
    <path d="M9 13a17 17 0 0 1 26 0l-4 4a11 11 0 0 0-18 0z" fill="${hex}" stroke="rgba(0,0,0,.5)" stroke-width=".8"/>
    <path d="M12 12.6a15.5 15.5 0 0 1 20 0" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="1" stroke-linecap="round"/></svg>`;
}
function windowSVG(pct) {
  const a = (0.1 + (pct / 100) * 0.86).toFixed(2);
  return `<svg viewBox="0 0 84 44"><defs><linearGradient id="wsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fc2e6"/><stop offset="1" stop-color="#e8d9c2"/></linearGradient></defs>
    <path d="M6 38 L20 10 Q22 6 27 6 H62 Q68 6 71 11 L79 38 Z" fill="url(#wsky)"/><path d="M14 38 L26 24 L36 30 L48 18 L60 28 L79 38Z" fill="#5b6f5a" opacity=".8"/>
    <path id="wtint" d="M6 38 L20 10 Q22 6 27 6 H62 Q68 6 71 11 L79 38 Z" fill="#05070a" fill-opacity="${a}"/>
    <path d="M6 38 L20 10 Q22 6 27 6 H62 Q68 6 71 11 L79 38 Z M44 6 V38" fill="none" stroke="#c9ced4" stroke-width="1.6"/><path d="M24 10 L30 10 L22 26" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="1.4" stroke-linecap="round"/></svg>`;
}

const CALIPERS = [
  { name: 'Rouge', hex: '#c8102e' }, { name: 'Jaune', hex: '#f2b705' }, { name: 'Bleu', hex: '#1f5fbf' },
  { name: 'Vert', hex: '#2f8f46' }, { name: 'Noir', hex: '#1b1c1e' }, { name: 'Gris', hex: '#6b7076' },
];

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function load() {
  try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch { return {}; }
}

function save(data) {
  try { localStorage.setItem(STORE, JSON.stringify(data)); } catch { /* navigation privée */ }
}

function defaults(car) {
  const p = car.paints[0];
  return {
    paint: p.hex, paintName: p.name, finish: p.finish,
    rimFinish: car.rim.finish, caliper: car.rim.caliper,
    tint: 35, drl: true, lights: false, hood: false, door: false,
  };
}

// Couleur d'accent de l'interface dérivée de la teinte (lisible sur fond sombre).
function accentFrom(hex) {
  const [h, s, l] = hexToHsl(hex);
  if (s < 0.16 || l < 0.08) return '#cfd5dc';
  return hslToHex(h, Math.min(0.78, Math.max(0.45, s)), Math.min(0.68, Math.max(0.56, l)));
}

export class Garage {
  constructor(root) {
    this.root = root;
    const saved = load();
    this.idx = Math.min(CARS.length - 1, Math.max(0, saved.idx | 0));
    this.seg = saved.seg || 'paint';
    this.cfg = {};
    for (const c of CARS) this.cfg[c.id] = { ...defaults(c), ...(saved.cfg && saved.cfg[c.id]), hood: false, door: false };

    this.studio = $('#studio', root);
    this.loader = $('#g-loader', root);
    this.scene = new GarageScene($('#stage-3d', root), CARS, {
      onProgress: (k) => this.studio.style.setProperty('--load', k.toFixed(2)),
    });
    this.scene.cfgOf = (id) => this.cfg[id];
    if (!this.scene.ok) this.studio.classList.add('no-3d');
    this.tach = new Tach($('#tach', root));
    this.audio = new EngineAudio();
    this.btnStart = $('#btn-start', root);
    this.btnGas = $('#btn-gas', root);
    this.gasPct = $('#gas-pct', root);
    this.rail = $('#rail', root);
    this.sheet = new Sheet($('#sheet', root), { onDismiss: () => this.setVitrine(true) });
    this.busy = false;
    this.active = false;
    this.shake = { x: 0, y: 0, r: 0, roll: 0 };

    this.buildPicker();
    this.bindEngine();
    this.bindSegments();
    this.bindStudio();
    this.observe();
    this.mount(true);
    creditsReady.then(() => this.renderSheet());
    this.scene.rig(this.idx).catch(() => this.studio.classList.add('no-3d')).finally(() => this.scene.preloadAll(this.idx));
    this.loop = this.loop.bind(this);
    this.last = performance.now();
    requestAnimationFrame(this.loop);
  }

  get car() { return CARS[this.idx]; }
  get c() { return this.cfg[this.car.id]; }

  persist() {
    const cfg = {};
    for (const id in this.cfg) {
      const { hood, door, ...rest } = this.cfg[id];
      cfg[id] = rest;
    }
    save({ idx: this.idx, seg: this.seg, cfg });
  }

  setActive(on) {
    this.active = on;
    this.scene.setActive(on);
    if (on) {
      this.fit();
    } else {
      this.stopEngine();
    }
  }

  // ---------- montage d'un véhicule ----------

  mount(first = false) {
    const car = this.car;
    const c = this.c;
    this.sim = new EngineSim(car);
    this.tach.configure(car.engine);
    this.audio.setProfile(dspProfile(car));
    document.documentElement.style.setProperty('--accent', accentFrom(c.paint));
    this.root.classList.toggle('is-hood', c.hood);
    this.updateTexts();
    this.renderRail();
    // la voiture est peut-être encore en chargement : indicateur jusqu'à son arrivée
    const idx = this.idx;
    this.loader.classList.add('show');
    const focus = this.scene.focus(idx, first);
    this.scene.rig(idx).then(() => {
      if (idx === this.idx) this.loader.classList.remove('show');
    }, () => this.loader.classList.remove('show'));
    return focus;
  }

  updateTexts() {
    const car = this.car;
    // sur la vue 3D : le nom seul (les caractéristiques sont dans la fiche technique)
    const title = $('#car-name', this.root);
    title.innerHTML = `<span>${esc(car.brand)}</span> ${esc(car.name)}`;
    title.classList.remove('swap');
    void title.offsetWidth;
    title.classList.add('swap');
    this.picker.select(this.idx);
    const s = car.specs;
    $('#sheet-sum', this.root).textContent = `${s.power} · ${s.torque} · ${s.sprint}`;
    this.renderSheet();
  }

  renderSheet() {
    const car = this.car;
    const s = car.specs;
    const c = this.c;
    const fin = FINISHES.find((f) => f.id === c.finish);
    const rf = RIM_FINISHES.find((r) => r.id === c.rimFinish);
    const ev = car.engine.type === 'ev';
    const specs = [
      ['Puissance', s.power], ['Couple', s.torque], ['0 – 100 km/h', s.sprint], ['V max', s.vmax],
      [ev ? 'Motorisation' : 'Moteur', s.engine], [ev ? 'Batterie' : 'Cylindrée', s.displacement],
      ['Transmission', s.gearbox], ['Architecture', s.drive], ['Masse', s.weight],
      ['Zone rouge', ev ? `${car.engine.redline.toLocaleString('fr-FR')} tr/min moteur` : `${car.engine.redline.toLocaleString('fr-FR')} tr/min`],
    ];
    $('#sheet-body', this.root).innerHTML = `
      <p class="lead">${esc(car.gen)}</p>
      <div class="spec-grid">${specs.map(([k, v]) => `<div class="spec"><small>${k}</small><b>${esc(v)}</b></div>`).join('')}</div>
      <h4>Sous le capot</h4><p>${esc(car.underHood.text)}</p>
      <h4>Signatures &amp; préparation</h4><ul>${car.extras.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      <h4>Configuration actuelle</h4>
      <dl class="cfg">
        <dt>Teinte</dt><dd>${esc(c.paintName || c.paint)}</dd>
        <dt>Finition</dt><dd>${fin ? fin.name : ''}</dd>
        <dt>Jantes</dt><dd>${rf ? rf.name : ''}</dd>
        <dt>Vitrage</dt><dd>${c.tint} %</dd>
      </dl>
      <h4>Modèles 3D</h4><ul class="credits">${creditHTML([car.id, 'showroom'])}</ul>`;
  }

  // ---------- sélecteur de véhicule ----------

  buildPicker() {
    this.picker = new Picker($('#car-picker', this.root),
      CARS.map((car) => ({ label: car.short, title: `${car.brand} ${car.name}`, img: `assets/thumbs/car-${car.id}.webp` })),
      (i) => this.go(i));
  }

  // Changement de voiture : capot et portière refermés, puis la caméra glisse jusqu'à la place suivante.
  async go(i) {
    if (this.busy) return;
    this.busy = true;
    this.stopEngine();
    this.scene.shake(0, 0);
    const c = this.c;
    if (c.hood) { c.hood = false; this.scene.hood(false); }
    if (c.door) { c.door = false; this.scene.door(false); }
    this.idx = i;
    this.persist();
    try {
      await this.mount();
    } finally {
      this.busy = false;
    }
  }

  // ---------- personnalisation ----------

  bindSegments() {
    this.segEl = $('#seg', this.root);
    this.segEl.addEventListener('click', (e) => {
      const b = e.target.closest('[data-seg]');
      if (!b) return;
      this.seg = b.dataset.seg;
      this.renderRail();
      this.persist();
    });
    this.rail.addEventListener('click', (e) => this.onRail(e));
    this.rail.addEventListener('input', (e) => {
      if (e.target.id === 'tint') {
        this.c.tint = +e.target.value;
        this.scene.tint(this.scene.current, this.c.tint);
        $('#tint-out', this.root).textContent = `${this.c.tint} %`;
        e.target.style.setProperty('--k', ((this.c.tint - 10) / 85).toFixed(3));
        const w = this.rail.querySelector('#wtint');
        if (w) w.setAttribute('fill-opacity', (0.1 + (this.c.tint / 100) * 0.86).toFixed(2));
      } else if (e.target.id === 'paint-custom') {
        this.setPaint(e.target.value, 'Teinte sur mesure');
      }
    });
    this.rail.addEventListener('change', () => { this.renderSheet(); this.persist(); });
    $('#restore', this.root).addEventListener('click', () => this.setVitrine(false));
  }

  renderRail() {
    for (const b of this.segEl.children) b.setAttribute('aria-selected', String(b.dataset.seg === this.seg));
    const car = this.car;
    const c = this.c;
    let html = '';
    if (this.seg === 'paint') {
      html = car.paints.map((p) => `<button class="swatch" type="button" data-paint="${p.hex}" data-name="${esc(p.name)}" aria-pressed="${p.hex === c.paint}"><i style="--c:${p.hex}"></i><span>${esc(p.name)}</span></button>`).join('');
      const custom = !car.paints.some((p) => p.hex === c.paint);
      html += `<label class="swatch" aria-pressed="${custom}"><i style="--c:conic-gradient(from 90deg,#e53935,#fdd835,#43a047,#1e88e5,#8e24aa,#e53935)"></i><span>Sur mesure</span>
        <input id="paint-custom" type="color" value="${c.paint}" style="position:absolute;opacity:0;width:1px;height:1px;pointer-events:none"></label>`;
    } else if (this.seg === 'finish') {
      const pc = pearlTone(c.paint);
      html = FINISHES.map((f) => card(`data-finish="${f.id}"`, f.name, `<span class="fin-pv" data-f="${f.id}" style="--c:${c.paint};--pc:${pc}"></span>`, f.id === c.finish)).join('');
    } else if (this.seg === 'rims') {
      html = RIM_FINISHES.map((r) => card(`data-rimfin="${r.id}"`, r.name, rimSVG(r.base, r.hi, r.lo), r.id === c.rimFinish, 'sq')).join('');
      html += '<span class="sep"></span>';
      html += CALIPERS.map((k) => card(`data-caliper="${k.hex}" aria-label="Étriers ${k.name}"`, `Étriers ${k.name.toLowerCase()}`, caliperSVG(k.hex), k.hex === c.caliper, 'sq')).join('');
    } else if (this.seg === 'glass') {
      html = `<div class="tint-ctl"><span class="tint-pv">${windowSVG(c.tint)}</span>
        <span class="tint-in"><label for="tint">Teinte des vitres <output id="tint-out">${c.tint} %</output></label>
        <input id="tint" type="range" min="10" max="95" step="1" value="${c.tint}" aria-label="Opacité des vitres" style="--k:${((c.tint - 10) / 85).toFixed(3)}"></span></div>`;
    } else {
      const t = (k, ico, label) => card(`data-toggle="${k}"`, label, `${ico}<i class="led"></i>`, !!c[k], 'tog');
      // capot et portière seulement si le modèle 3D les a en pièces séparées
      html = t('drl', ICON.drl, 'Feux de jour') + t('lights', ICON.beam, 'Projecteurs')
        + (car.model.hood ? t('hood', ICON.hood, 'Capot') : '') + (car.model.door ? t('door', ICON.door, 'Portière') : '')
        + card('data-vitrine="1"', 'Vitrine', ICON.frame, false, 'tog');
    }
    this.rail.innerHTML = html;
    this.rail.scrollLeft = 0;
  }

  onRail(e) {
    const b = e.target.closest('button, label');
    if (!b) return;
    const c = this.c;
    if (b.dataset.paint) {
      this.setPaint(b.dataset.paint, b.dataset.name);
    } else if (b.tagName === 'LABEL') {
      const input = $('#paint-custom', this.root);
      if (input && e.target !== input) input.click();
      return;
    } else if (b.dataset.finish) {
      c.finish = b.dataset.finish;
      this.scene.finish(this.scene.current, c.finish);
    } else if (b.dataset.rimfin) {
      c.rimFinish = b.dataset.rimfin;
      this.applyRim();
    } else if (b.dataset.caliper) {
      c.caliper = b.dataset.caliper;
      this.applyRim();
    } else if (b.dataset.toggle) {
      const k = b.dataset.toggle;
      c[k] = !c[k];
      if (k === 'lights' || k === 'drl') this.scene.lamps(this.scene.current, c.drl, c.lights);
      if (k === 'hood') {
        if (c.hood && c.door) { c.door = false; this.scene.door(false); this.markDoor(); }
        this.scene.hood(c.hood);
        this.root.classList.toggle('is-hood', c.hood);
      }
      if (k === 'door') {
        if (c.door && c.hood) {
          c.hood = false;
          this.scene.hood(false);
          this.root.classList.remove('is-hood');
          const h = this.rail.querySelector('[data-toggle="hood"]');
          if (h) h.setAttribute('aria-pressed', 'false');
        }
        this.scene.door(c.door);
      }
    } else if (b.dataset.vitrine) {
      this.setVitrine(true);
      return;
    } else {
      return;
    }
    this.markPressed(b);
    this.renderSheet();
    this.persist();
  }

  markPressed(b) {
    const group = b.dataset.paint ? '[data-paint]' : b.dataset.finish ? '[data-finish]'
      : b.dataset.rimfin ? '[data-rimfin]' : b.dataset.caliper ? '[data-caliper]' : null;
    if (group) {
      for (const x of this.rail.querySelectorAll(group)) x.setAttribute('aria-pressed', String(x === b));
      const lab = this.rail.querySelector('label.swatch');
      if (lab && b.dataset.paint) lab.setAttribute('aria-pressed', 'false');
    } else if (b.dataset.toggle) {
      b.setAttribute('aria-pressed', String(!!this.c[b.dataset.toggle]));
    }
  }

  markDoor() {
    const d = this.rail.querySelector('[data-toggle="door"]');
    if (d) d.setAttribute('aria-pressed', 'false');
  }

  setPaint(hex, name) {
    const c = this.c;
    c.paint = hex;
    c.paintName = name;
    this.scene.paint(this.scene.current, hex);
    document.documentElement.style.setProperty('--accent', accentFrom(hex));
    if (name === 'Teinte sur mesure') {
      for (const x of this.rail.querySelectorAll('[data-paint]')) x.setAttribute('aria-pressed', 'false');
      const lab = this.rail.querySelector('label.swatch');
      if (lab) lab.setAttribute('aria-pressed', 'true');
    }
  }

  applyRim() {
    const r = this.scene.current;
    this.scene.rimFinish(r, this.c.rimFinish);
    this.scene.caliper(r, this.c.caliper);
  }

  setVitrine(on) {
    this.root.classList.toggle('vitrine', on);
    if (on) this.sheet.set(false);
  }

  // ---------- moteur ----------

  bindEngine() {
    this.btnStart.addEventListener('click', () => {
      if (this.busy) return;
      // impulsion visuelle + retour haptique : le bouton « répond » au doigt
      this.btnStart.classList.remove('kick');
      void this.btnStart.offsetWidth;
      this.btnStart.classList.add('kick');
      if (navigator.vibrate) navigator.vibrate(18);
      const ready = this.audio.unlock();
      if (ready && ready.catch) ready.catch(() => $('#audio-warn', this.root).classList.add('show'));
      if (this.sim.state === 'off' || this.sim.state === 'stopping') this.sim.start();
      else this.sim.stop();
    });

    const press = (on) => (e) => {
      if (this.btnGas.disabled) return;
      if (e.cancelable) e.preventDefault();
      if (on && e.pointerId != null) this.btnGas.setPointerCapture(e.pointerId);
      this.sim.press(on);
      this.btnGas.classList.toggle('pressed', on);
    };
    this.btnGas.addEventListener('pointerdown', press(true));
    this.btnGas.addEventListener('pointerup', press(false));
    this.btnGas.addEventListener('pointercancel', press(false));
    this.btnGas.addEventListener('contextmenu', (e) => e.preventDefault());
    this.btnGas.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) press(true)(e); });
    this.btnGas.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') press(false)(e); });
  }

  stopEngine() {
    if (this.sim && this.sim.state !== 'off') this.sim.stop();
    if (this.btnGas) this.btnGas.classList.remove('pressed');
  }

  loop(now) {
    requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    const sim = this.sim;
    const o = sim.update(dt);
    if (o.events) for (const ev of o.events) this.audio.send(ev);
    for (const p of o.pops) {
      this.audio.send({ type: 'pop', amt: p });
      if (p > 0.45) this.scene.flash(p);
    }
    this.audio.set(o);
    if (!this.active) return;

    this.tach.set(o.rpm, dt);
    const state = sim.state;
    const running = state === 'run' || state === 'catch';
    this.btnStart.classList.toggle('running', running);
    this.btnStart.classList.toggle('cranking', state === 'crank');
    this.btnStart.setAttribute('aria-pressed', String(state !== 'off'));
    const label = state === 'off' ? 'START' : state === 'stopping' ? '···' : 'STOP';
    if (this.btnStart.dataset.label !== label) {
      this.btnStart.dataset.label = label;
      this.btnStart.querySelector('b').textContent = label;
    }
    const gasOn = state === 'run';
    if (this.btnGas.disabled === gasOn) this.btnGas.disabled = !gasOn;
    const fill = o.throttle.toFixed(2);
    if (fill !== this._fill) {
      this.btnGas.style.setProperty('--thr', fill);
      this._fill = fill;
      const pct = Math.round(o.throttle * 100);
      this.gasPct.firstChild.nodeValue = String(pct);
    }

    // vibrations de caisse + couple de réaction (transform composité, peu coûteux)
    const e = sim.e;
    let amp = 0;
    if (state === 'crank') amp = 0.9 * e.shake + 0.3;
    else if (running) {
      const idleN = Math.max(0, 1 - (o.rpm - e.idle) / 1800);
      amp = e.shake * (0.35 + 0.65 * idleN) * (state === 'catch' ? 1.6 : 1);
    }
    const sh = this.shake;
    sh.roll += ((running ? o.throttle * 0.55 * Math.max(e.shake, 0.25) : 0) - sh.roll) * Math.min(1, dt * 6);
    const t = now / 1000;
    sh.y = amp * (Math.sin(t * 61) * 0.6 + Math.sin(t * 37.3) * 0.4);
    sh.x = amp * 0.35 * Math.sin(t * 47.1);
    this.scene.shake(sh.y, sh.roll);
  }

  // ---------- gestes & mise en page ----------

  // Un doigt fait tourner la caméra autour de la voiture, deux doigts zooment (OrbitControls) ;
  // le changement de voiture passe par le sélecteur.
  bindStudio() {
    this.studio.addEventListener('pointerdown', (e) => {
      if (!e.target.closest('button')) $('#hint', this.root).style.opacity = 0;
    }, { once: true });
  }

  observe() {
    const ro = new ResizeObserver(() => this.fit());
    ro.observe(this.studio);
    ro.observe($('#deck', this.root));
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.stopEngine();
        this.audio.suspend();
      } else {
        this.audio.resume();
      }
    });
  }

  fit() {
    const r = this.studio.getBoundingClientRect();
    this.scene.resize(r.width, r.height);
    const deck = $('#deck', this.root);
    const peek = 58;
    if (!this.root.classList.contains('vitrine')) {
      this.root.style.setProperty('--sheet-h', `${Math.round(deck.offsetHeight + peek)}px`);
    }
  }
}
