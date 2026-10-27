// Contrôleur de l'Atelier Garage : état, personnalisation live, moteur, gestes.
import { CARS, FINISHES, RIM_STYLES, RIM_FINISHES } from '../cars/index.js';
import { StageRenderer, hexToHsl, hslToHex, pearlTone } from './renderer.js';
import { rimIconSVG } from './wheels.js';
import { Tach } from './tach.js';
import { Sheet } from './sheet.js';
import { EngineSim } from '../audio/engine-sim.js';
import { EngineAudio, dspProfile } from '../audio/engine-audio.js';

const STORE = 'ls-garage-v1';
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
    rimStyle: car.rim.style, rimFinish: car.rim.finish, caliper: car.rim.caliper,
    tint: 35, lights: false, hood: false, door: false,
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
    this.renderer = new StageRenderer($('#stage-floor', root), $('#stage-car', root));
    this.carSvg = $('#stage-car', root);
    this.tach = new Tach($('#tach', root));
    this.audio = new EngineAudio();
    this.btnStart = $('#btn-start', root);
    this.btnGas = $('#btn-gas', root);
    this.gasFill = $('#gas-fill', root);
    this.rail = $('#rail', root);
    this.sheet = new Sheet($('#sheet', root), { onDismiss: () => this.setVitrine(true) });
    this.offset = 0;
    this.busy = false;
    this.active = false;
    this.shake = { x: 0, y: 0, r: 0, roll: 0 };
    this.visCrank = 0;

    this.buildPicker();
    this.bindEngine();
    this.bindSegments();
    this.bindStudio();
    this.observe();
    this.mount(true);
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
    this.renderer.mount(car, c);
    this.applyRim();
    this.sim = new EngineSim(car);
    this.tach.configure(car.engine);
    this.audio.setProfile(dspProfile(car));
    this.carSvg.style.setProperty('--scan-h', `${(car.geo.bay.h * 0.178 - 2).toFixed(1)}px`);
    document.documentElement.style.setProperty('--accent', accentFrom(c.paint));
    this.root.classList.toggle('is-hood', c.hood);
    this.updateTexts();
    this.renderRail();
    if (!first) this.renderer.setOffset(this.offset);
  }

  updateTexts() {
    const car = this.car;
    $('#car-brand', this.root).textContent = car.brand;
    const mark = $('#studio-mark', this.root);
    mark.classList.add('swap');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      mark.textContent = car.mark;
      mark.classList.remove('swap');
    }));
    $('#car-name', this.root).textContent = car.name;
    $('#car-gen', this.root).textContent = car.gen;
    $('#car-counter', this.root).textContent = `${String(this.idx + 1).padStart(2, '0')} / ${String(CARS.length).padStart(2, '0')}`;
    const s = car.specs;
    $('#badges', this.root).innerHTML = [
      [s.power, 'puissance'], [s.torque, 'couple'], [s.sprint, '0-100'],
    ].map(([v, k]) => `<span class="badge">${esc(v)} <small>${k}</small></span>`).join('');
    $('#hood-callout', this.root).innerHTML = `<h3>${esc(car.underHood.title)}</h3><ul>${car.underHood.lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>`;
    $('#dots', this.root).innerHTML = CARS.map((_, i) => `<i class="${i === this.idx ? 'on' : ''}"></i>`).join('');
    for (const b of this.picker.children) b.setAttribute('aria-selected', String(+b.dataset.i === this.idx));
    const chip = this.picker.children[this.idx];
    // défilement local du sélecteur (scrollIntoView ferait aussi défiler la vue entière)
    if (chip) this.picker.scrollTo({ left: chip.offsetLeft - (this.picker.clientWidth - chip.offsetWidth) / 2, behavior: 'smooth' });
    $('#sheet-sum', this.root).textContent = `${s.power} · ${s.torque} · ${s.sprint}`;
    this.renderSheet();
  }

  renderSheet() {
    const car = this.car;
    const s = car.specs;
    const c = this.c;
    const fin = FINISHES.find((f) => f.id === c.finish);
    const rim = RIM_STYLES.find((r) => r.id === c.rimStyle);
    const rf = RIM_FINISHES.find((r) => r.id === c.rimFinish);
    const ev = car.engine.type === 'ev';
    const specs = [
      ['Puissance', s.power], ['Couple', s.torque], ['0 – 100 km/h', s.sprint], ['V max', s.vmax],
      [ev ? 'Motorisation' : 'Moteur', s.engine], [ev ? 'Batterie' : 'Cylindrée', s.displacement],
      ['Transmission', s.gearbox], ['Architecture', s.drive], ['Masse', s.weight],
      ['Zone rouge', ev ? `${car.engine.redline.toLocaleString('fr-FR')} tr/min moteur` : `${car.engine.redline.toLocaleString('fr-FR')} tr/min`],
    ];
    $('#sheet-body', this.root).innerHTML = `
      <div class="spec-grid">${specs.map(([k, v]) => `<div class="spec"><small>${k}</small><b>${esc(v)}</b></div>`).join('')}</div>
      <h4>Sous le capot</h4><p>${esc(car.underHood.text)}</p>
      <h4>Signatures &amp; préparation</h4><ul>${car.extras.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      <h4>Configuration actuelle</h4>
      <dl class="cfg">
        <dt>Teinte</dt><dd>${esc(c.paintName || c.paint)}</dd>
        <dt>Finition</dt><dd>${fin ? fin.name : ''}</dd>
        <dt>Jantes</dt><dd>${rim ? rim.name : ''} · ${rf ? rf.name : ''}</dd>
        <dt>Vitrage</dt><dd>${c.tint} %</dd>
      </dl>`;
  }

  // ---------- sélecteur de véhicule ----------

  buildPicker() {
    this.picker = $('#car-picker', this.root);
    this.picker.innerHTML = CARS.map((car, i) => `<button class="chip" type="button" role="tab" data-i="${i}" aria-selected="false">${esc(car.name)}</button>`).join('');
    this.picker.addEventListener('click', (e) => {
      const b = e.target.closest('.chip');
      if (!b) return;
      const i = +b.dataset.i;
      if (i !== this.idx) this.go(i, i > this.idx ? 1 : -1);
    });
  }

  go(i, dir) {
    if (this.busy) return;
    this.busy = true;
    this.stopEngine();
    const R = this.renderer.wheelsPx ? this.renderer.wheelsPx[0].R : 60;
    const out = -dir * 1150;
    const startAngle = this.renderer.wheelAngle || 0;
    tween(480, (k) => k * k * k, (e) => {
      this.offset = out * e;
      this.renderer.setOffset(this.offset);
      this.renderer.setWheelAngle(startAngle + ((this.offset / R) * 180) / Math.PI);
    }, () => {
      this.idx = i;
      this.offset = -out;
      this.mount();
      this.persist();
      tween(720, (k) => 1 - Math.pow(1 - k, 3), (e) => {
        this.offset = -out * (1 - e);
        this.renderer.setOffset(this.offset);
        this.renderer.setWheelAngle(((this.offset / R) * 180) / Math.PI);
      }, () => {
        this.offset = 0;
        this.renderer.setOffset(0);
        this.busy = false;
      });
    });
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
        this.renderer.setTint(this.c.tint);
        $('#tint-out', this.root).textContent = `${this.c.tint} %`;
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
      html = FINISHES.map((f) => `<button class="pill" type="button" data-finish="${f.id}" aria-pressed="${f.id === c.finish}"><span class="pv fin-pv" data-f="${f.id}" style="--c:${c.paint};--pc:${pc}"></span>${f.name}</button>`).join('');
    } else if (this.seg === 'rims') {
      html = RIM_STYLES.map((r) => `<button class="pill" type="button" data-rim="${r.id}" aria-pressed="${r.id === c.rimStyle}"><span class="pv">${rimIconSVG(r.id)}</span>${r.name}</button>`).join('');
      html += '<span class="sep"></span>';
      html += RIM_FINISHES.map((r) => `<button class="rim-dot" type="button" data-rimfin="${r.id}" aria-pressed="${r.id === c.rimFinish}" aria-label="${r.name}" title="${r.name}" style="--b:${r.base};--hi:${r.hi};--lo:${r.lo}"></button>`).join('');
      html += '<span class="sep"></span>';
      html += CALIPERS.map((k) => `<button class="rim-dot" type="button" data-caliper="${k.hex}" aria-pressed="${k.hex === c.caliper}" aria-label="Étriers ${k.name}" title="Étriers ${k.name}" style="--b:${k.hex};--hi:${k.hex};--lo:#000;border-radius:8px"></button>`).join('');
    } else if (this.seg === 'glass') {
      html = `<div class="tint-ctl"><label for="tint">Teinte des vitres</label>
        <input id="tint" type="range" min="10" max="95" step="1" value="${c.tint}" aria-label="Opacité des vitres">
        <output id="tint-out">${c.tint} %</output></div>`;
    } else {
      const t = (k, ico, label) => `<button class="pill no-pv" type="button" data-toggle="${k}" aria-pressed="${!!c[k]}"><span class="ico">${ico}</span>${label}</button>`;
      html = t('lights', '💡', 'Phares') + t('hood', '🔧', 'Capot') + t('door', '🚪', 'Portière')
        + '<button class="pill no-pv" type="button" data-vitrine="1"><span class="ico">🖼️</span>Vitrine</button>';
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
      this.renderer.setFinish(c.finish);
      this.renderer.sweep();
    } else if (b.dataset.rim) {
      c.rimStyle = b.dataset.rim;
      this.renderer.setRims(c.rimStyle);
    } else if (b.dataset.rimfin) {
      c.rimFinish = b.dataset.rimfin;
      this.applyRim();
    } else if (b.dataset.caliper) {
      c.caliper = b.dataset.caliper;
      this.applyRim();
    } else if (b.dataset.toggle) {
      const k = b.dataset.toggle;
      c[k] = !c[k];
      if (k === 'lights') this.renderer.setLights(c.lights);
      if (k === 'hood') {
        this.renderer.setHood(c.hood);
        this.root.classList.toggle('is-hood', c.hood);
      }
      if (k === 'door') this.renderer.setDoor(c.door);
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
    const group = b.dataset.paint ? '[data-paint]' : b.dataset.finish ? '[data-finish]' : b.dataset.rim ? '[data-rim]'
      : b.dataset.rimfin ? '[data-rimfin]' : b.dataset.caliper ? '[data-caliper]' : null;
    if (group) {
      for (const x of this.rail.querySelectorAll(group)) x.setAttribute('aria-pressed', String(x === b));
      const lab = this.rail.querySelector('label.swatch');
      if (lab && b.dataset.paint) lab.setAttribute('aria-pressed', 'false');
    } else if (b.dataset.toggle) {
      b.setAttribute('aria-pressed', String(!!this.c[b.dataset.toggle]));
    }
  }

  setPaint(hex, name) {
    const c = this.c;
    c.paint = hex;
    c.paintName = name;
    this.renderer.setPaint(hex);
    document.documentElement.style.setProperty('--accent', accentFrom(hex));
    if (name === 'Teinte sur mesure') {
      for (const x of this.rail.querySelectorAll('[data-paint]')) x.setAttribute('aria-pressed', 'false');
      const lab = this.rail.querySelector('label.swatch');
      if (lab) lab.setAttribute('aria-pressed', 'true');
    }
  }

  applyRim() {
    const c = this.c;
    const rf = RIM_FINISHES.find((r) => r.id === c.rimFinish) || RIM_FINISHES[0];
    const st = document.documentElement.style;
    st.setProperty('--rim', rf.base);
    st.setProperty('--rim-hi', rf.hi);
    st.setProperty('--rim-lo', rf.lo);
    st.setProperty('--caliper', c.caliper);
  }

  setVitrine(on) {
    this.root.classList.toggle('vitrine', on);
    if (on) this.sheet.set(false);
  }

  // ---------- moteur ----------

  bindEngine() {
    this.btnStart.addEventListener('click', () => {
      if (this.busy) return;
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
      if (p > 0.45) this.renderer.flash(p);
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
    const fill = `scaleX(${o.throttle.toFixed(2)})`;
    if (fill !== this._fill) {
      this.gasFill.style.transform = fill;
      this._fill = fill;
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
    const tr = `translate3d(${sh.x.toFixed(2)}px, ${sh.y.toFixed(2)}px, 0) rotate(${(-sh.roll).toFixed(3)}deg)`;
    if (tr !== this._tr) {
      this.carSvg.style.transform = tr;
      this._tr = tr;
    }

    // baie moteur animée (pistons / rotors) quand le capot est ouvert
    if (this.c.hood) {
      this.visCrank += (o.rpm / 60) * 360 * dt * 0.06;
      this.renderer.setEngine(this.visCrank);
    }
  }

  // ---------- gestes & mise en page ----------

  bindStudio() {
    let x0 = 0;
    let y0 = 0;
    let id = null;
    const s = this.studio;
    s.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button')) return;
      id = e.pointerId;
      x0 = e.clientX;
      y0 = e.clientY;
    });
    const end = (e) => {
      if (e.pointerId !== id) return;
      id = null;
      const dx = e.clientX - x0;
      const dy = e.clientY - y0;
      if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.3) {
        const dir = dx < 0 ? 1 : -1;
        this.go((this.idx + dir + CARS.length) % CARS.length, dir);
        $('#hint', this.root).style.opacity = 0;
      } else if (dy < -40 && Math.abs(dy) > Math.abs(dx) && this.root.classList.contains('vitrine')) {
        this.setVitrine(false);
      }
    };
    s.addEventListener('pointerup', end);
    s.addEventListener('pointercancel', () => { id = null; });
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
    this.renderer.fit(r.width, r.height);
    const deck = $('#deck', this.root);
    const peek = 58;
    if (!this.root.classList.contains('vitrine')) {
      this.root.style.setProperty('--sheet-h', `${Math.round(deck.offsetHeight + peek)}px`);
    }
  }
}

function tween(dur, ease, step, done) {
  const t0 = performance.now();
  const f = (now) => {
    const k = Math.min(1, (now - t0) / dur);
    step(ease(k));
    if (k < 1) requestAnimationFrame(f);
    else if (done) done();
  };
  requestAnimationFrame(f);
}
