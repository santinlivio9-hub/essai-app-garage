// Contrôleur de l'Armurerie : configuration modulaire, banc de tir, rechargement, audio.
import { WEAPONS, METAL, POLY, PADS, MODE_LABEL } from './weapons/index.js';
import { CATALOG } from './accessories.js';
import { ArmoryScene } from './scene3d.js';
import { GunAudio } from './gun-audio.js';
import { Target } from './target.js';
import { Sheet } from '../core/sheet.js';
import { creditHTML, creditsReady } from '../core/credits.js';
import { $, esc, load, save, tween, ease } from '../core/util.js';

const STORE = 'ls-armory-v1';
const SEGS = [
  ['optic', 'Optique'], ['tac', 'Laser · Lampe'], ['muzzle', 'Bouche'], ['grip', 'Poignée'],
  ['stock', 'Crosse'], ['mag', 'Chargeur'], ['finish', 'Finition'],
];
const RANGE = { pistol: 15, smg: 25, rifle: 50, shotgun: 15 };
const SIGMA = { pistol: 0.3, smg: 0.24, rifle: 0.13, shotgun: 0.2 };

const sv = (p) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const ICON = {
  none: sv('<circle cx="12" cy="12" r="8"/><path d="M6.5 17.5l11-11"/>'),
  rds: sv('<path d="M4 17h16v-3c0-4-3-7-7-7h-2C7 7 4 10 4 14z"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/>'),
  holo: sv('<rect x="3" y="7" width="18" height="11" rx="2"/><circle cx="13" cy="12.5" r="3"/><path d="M13 9.5v-1M13 16.5v-1M10 12.5H9M17 12.5h-1"/>'),
  mag3: sv('<rect x="3" y="9" width="15" height="7" rx="2"/><path d="M18 10l3-1v7l-3-1M7 9v7"/>'),
  flip: sv('<path d="M4 8h12l-3-3M20 16H8l3 3"/>'),
  peq: sv('<rect x="3" y="7" width="14" height="10" rx="1.5"/><path d="M17 10h4M17 14h2"/>'),
  laser: sv('<circle cx="6" cy="12" r="2"/><path d="M8 12h13" stroke-dasharray="2 2"/>'),
  ir: sv('<path d="M3 12c3-5 6-5 9 0s6 5 9 0"/>'),
  light: sv('<path d="M3 9h9v6H3zM12 8l4-2v12l-4-2"/><path d="M18 9l3-1M18 12h3M18 15l3 1"/>'),
  beam: sv('<path d="M3 12h4M9 7l12-3v16L9 17z"/>'),
  comp: sv('<rect x="3" y="9" width="18" height="6" rx="1"/><path d="M8 9v3M12 9v3M16 9v3"/>'),
  sup: sv('<rect x="2" y="8" width="20" height="8" rx="3"/><path d="M6 8v8M18 8v8"/>'),
  sd: sv('<rect x="2" y="8" width="20" height="8" rx="3"/><path d="M5 10h14M5 14h14"/>'),
  stubby: sv('<path d="M5 6h14M8 6l1 13h6l1-13"/>'),
  angled: sv('<path d="M3 7h18M5 7c4 4 8 7 13 8"/>'),
  handstop: sv('<path d="M3 7h18M9 7l2 6h2l2-6"/>'),
  collapsed: sv('<path d="M3 9h8v8H5a2 2 0 0 1-2-2zM11 12h10"/>'),
  extended: sv('<path d="M3 9h5v8H5a2 2 0 0 1-2-2zM8 12h13M10 10l-2 2 2 2"/>'),
  std: sv('<path d="M8 3h7l-1 12H9z"/><path d="M9 15h5v3H9z"/>'),
  ext: sv('<path d="M8 3h7l-1 12H9z"/><path d="M8 15h7v5H8z" fill="currentColor"/>'),
};

const MUZZLE_ICON = { none: 'none', comp: 'comp', sup: 'sup', sd: 'sd', 'comp-int': 'comp' };

function defaults(w) {
  const d = w.defaults;
  return {
    metal: d.metal, poly: d.poly, pad: d.pad, optic: d.optic || 'none', magnifier: !!d.magnifier, magFlip: false,
    laser: d.laser || 'none', laserMode: d.laser === 'peq' ? 'vis' : 'off', light: d.light || 'none', lightOn: false,
    muzzle: d.muzzle || 'none', grip: d.grip || 'none', stock: d.stock || 'collapsed', mag: d.mag || 'std', mode: 'semi',
  };
}

export class Armory {
  constructor(root) {
    this.root = root;
    const saved = load(STORE);
    this.idx = Math.min(WEAPONS.length - 1, Math.max(0, saved.idx | 0));
    this.seg = saved.seg || 'optic';
    this.cfg = {};
    for (const w of WEAPONS) this.cfg[w.id] = { ...defaults(w), ...(saved.cfg && saved.cfg[w.id]) };
    this.studio = $('#a-studio', root);
    this.renderer = new ArmoryScene($('#stage-arm', root));
    if (!this.renderer.ok) this.studio.classList.add('no-3d');
    this.loader = $('#a-loader', root);
    this.audio = new GunAudio();
    this.target = new Target($('#a-target', root));
    this.sheet = new Sheet($('#a-sheet', root), { onDismiss: () => this.setVitrine(true) });
    this.rail = $('#a-rail', root);
    this.segEl = $('#a-seg', root);
    this.btnFire = $('#a-fire', root);
    this.btnReload = $('#a-reload', root);
    this.btnMode = $('#a-mode', root);
    this.ammoEl = $('#a-ammo', root);
    this.active = false;
    this.trigger = false;
    this.busy = false;

    this.buildPicker();
    this.bind();
    this.observe();
    this.mount(true);
    creditsReady.then(() => this.renderSheet());
    this.last = performance.now();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  get w() { return WEAPONS[this.idx]; }
  get c() { return this.cfg[this.w.id]; }

  persist() {
    const cfg = {};
    for (const id in this.cfg) {
      const { lightOn, magFlip, ...rest } = this.cfg[id];
      cfg[id] = rest;
    }
    save(STORE, { idx: this.idx, seg: this.seg, cfg });
  }

  setActive(on) {
    this.active = on;
    this.renderer.setActive(on);
    if (on) this.fit();
    else this.trigger = false;
  }

  // ---------- montage ----------

  mount(first = false) {
    const w = this.w;
    const c = this.c;
    if (!w.modes.includes(c.mode)) c.mode = 'semi';
    this.applyColors();
    this.ammo = this.capacity();
    this.chambered = true;
    this.reloading = false;
    // le modèle 3D arrive de façon asynchrone : indicateur pendant le chargement
    this.loader.classList.add('show');
    const idx = this.idx;
    this.renderer.build(w, c).then(() => {
      if (idx !== this.idx) return;
      this.loader.classList.remove('show');
      this.renderer.lockSlide(false);
      this.renderSheet();
    }, () => this.loader.classList.remove('show'));
    this.target.clear();
    this.target.setRange(RANGE[w.type]);
    const seg = SEGS.find(([k]) => k === this.seg);
    if (!seg || !this.segAvailable(this.seg)) this.seg = 'optic';
    this.renderSegs();
    this.renderRail();
    this.updateTexts();
    this.updateAmmo();
    this.updateMode();
  }

  rebuild() {
    this.renderer.build(this.w, this.c).then(() => this.renderSheet());
    this.updateTexts();
    this.persist();
  }

  capacity() {
    return this.c.mag === 'ext' ? this.w.capacity.ext : this.w.capacity.std;
  }

  displayName() {
    const w = this.w;
    return this.c.muzzle === 'sd' && w.nameSD ? w.nameSD : w.name;
  }

  ballistics() {
    const w = this.w;
    const s = w.specs;
    const v0 = this.c.muzzle === 'sd' && s.v0SD ? s.v0SD : s.v0;
    const e = Math.round(0.5 * (s.bullet / 1000) * v0 * v0);
    return { v0, e };
  }

  mass() {
    const c = this.c;
    let m = this.w.specs.weight;
    const add = (slot, id) => { const a = CATALOG[slot][id]; if (a && a.mass) m += a.mass; };
    add('optic', c.optic);
    if (c.optic === 'holo' && c.magnifier && this.w.slots.magnifier) m += 400;
    if (c.optic === 'rds' && this.w.type !== 'pistol') m += 60;
    add('laser', c.laser);
    add('light', c.light);
    add('muzzle', c.muzzle);
    add('grip', c.grip);
    add('mag', c.mag);
    return m;
  }

  updateTexts() {
    const w = this.w;
    const s = w.specs;
    const { v0, e } = this.ballistics();
    $('#a-maker', this.root).textContent = w.maker;
    $('#a-name', this.root).textContent = this.displayName();
    $('#a-variant', this.root).textContent = this.c.muzzle === 'sd' ? 'Modérateur intégral · munition subsonique' : w.variant;
    $('#a-counter', this.root).textContent = `${String(this.idx + 1).padStart(2, '0')} / ${String(WEAPONS.length).padStart(2, '0')}`;
    const mark = $('#a-mark', this.root);
    if (mark.textContent !== w.mark) mark.textContent = w.mark;
    $('#a-badges', this.root).innerHTML = [
      [s.caliber.split(' ')[0], 'calibre'], [`${this.capacity()}+1`, 'coups'], [`${e} J`, 'énergie'],
    ].map(([v, k]) => `<span class="badge">${esc(v)} <small>${k}</small></span>`).join('');
    $('#a-dots', this.root).innerHTML = WEAPONS.map((_, i) => `<i class="${i === this.idx ? 'on' : ''}"></i>`).join('');
    for (const b of this.picker.children) b.setAttribute('aria-selected', String(+b.dataset.i === this.idx));
    const chip = this.picker.children[this.idx];
    if (chip) this.picker.scrollTo({ left: chip.offsetLeft - (this.picker.clientWidth - chip.offsetWidth) / 2, behavior: 'smooth' });
    $('#a-sum', this.root).textContent = `${s.caliber.split(' ')[0]} · ${v0} m/s · ${e} J`;
    this.renderSheet();
  }

  renderSheet() {
    const w = this.w;
    const s = w.specs;
    const c = this.c;
    const { v0, e } = this.ballistics();
    const len = this.renderer.box ? Math.round(this.renderer.box.w / 5) * 5 : s.length;
    const suppressed = c.muzzle === 'sup' || c.muzzle === 'sd';
    const rows = [
      ['Calibre', s.caliber], ['Fonctionnement', s.action], ['Canon', s.barrel],
      ['Alimentation', `${this.capacity()} coups${w.capacity.tube ? ' (tube)' : ''} + 1 chambré`],
      ['Longueur', `≈ ${len} mm`], ['Masse (à vide)', `≈ ${(this.mass() / 1000).toFixed(2).replace('.', ',')} kg`],
      ['Cadence', s.rof ? `${s.rof} coups/min` : 'Coup par coup'], ['Vitesse initiale', `≈ ${v0} m/s`],
      ['Énergie à la bouche', `≈ ${e} J`], ['Modes', w.modes.map((m) => MODE_LABEL[m]).join(' · ')],
    ];
    const acc = [];
    const push = (slot, id) => { if (id && id !== 'none' && CATALOG[slot][id]) acc.push(CATALOG[slot][id].name); };
    push('optic', c.optic);
    if (c.optic === 'holo' && c.magnifier && w.slots.magnifier) acc.push(`Magnifier G33 ×3 (${c.magFlip ? 'basculé' : 'en ligne'})`);
    push('laser', c.laser);
    push('light', c.light);
    push('muzzle', c.muzzle);
    push('grip', c.grip);
    if (w.slots.stock) acc.push(`Crosse ${CATALOG.stock[c.stock].name.toLowerCase()}`);
    if (c.mag === 'ext') acc.push(w.capacity.tube ? 'Extension de tube +2' : 'Talon de chargeur alu +5');
    $('#a-sheet-body', this.root).innerHTML = `
      <div class="spec-grid">${rows.map(([k, v]) => `<div class="spec"><small>${k}</small><b>${esc(v)}</b></div>`).join('')}</div>
      <h4>Signature sonore</h4><p>${suppressed
    ? (w.specs.v0SD && c.muzzle === 'sd' ? 'Modérateur intégral et munition subsonique : pas de claquement supersonique, détonation sourde, la mécanique de culasse devient le bruit dominant.' : w.sound.crack ? 'Silencieux : souffle de bouche fortement atténué, mais le projectile reste supersonique — le « claquement » balistique subsiste.' : 'Silencieux : détonation sourde et étouffée (« thwip » des gaz ralentis) ; on entend nettement le claquement sec de la culasse.')
    : c.muzzle === 'comp' || c.muzzle === 'comp-int' ? 'Compensateur : les gaz déviés vers le haut réduisent le relèvement mais rendent la détonation plus sèche et plus forte pour le tireur.' : 'Configuration d’origine : attaque très brève, résonance métallique de la culasse et queue d’écho du stand.'}</p>
      <h4>Accessoires montés</h4>${acc.length ? `<ul>${acc.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '<p>Aucun — configuration d’origine.</p>'}
      <h4>Banc de tir</h4><p>Sélecteur ${w.modes.map((m) => MODE_LABEL[m]).join(' / ')}. Touchez la cible pour l’effacer. Simulation visuelle et sonore à vocation ludique et pédagogique.</p>
      <h4>Modèles 3D</h4><ul class="credits">${creditHTML([w.id, ...this.accIds()])}</ul>`;
  }

  // Identifiants (selection.json) des accessoires 3D montés, pour les crédits.
  accIds() {
    const c = this.c;
    const ids = [];
    if (c.optic === 'holo') ids.push('eotech');
    if ((c.optic === 'rds' && this.w.id !== 'canik') || (c.optic === 'holo' && c.magnifier)) ids.push('reddots');
    if (c.laser === 'peq') ids.push('peq15');
    if (c.muzzle === 'sup' || c.muzzle === 'sd') ids.push('suppressors');
    if (c.grip === 'angled') ids.push('afg');
    return [...new Set(ids)];
  }

  // ---------- sélecteur d'arme ----------

  buildPicker() {
    this.picker = $('#a-picker', this.root);
    this.picker.innerHTML = WEAPONS.map((w, i) => `<button class="chip" type="button" role="tab" data-i="${i}" aria-selected="false">${esc(w.short)}</button>`).join('');
    this.picker.addEventListener('click', (e) => {
      const b = e.target.closest('.chip');
      if (b && +b.dataset.i !== this.idx) this.go(+b.dataset.i, +b.dataset.i > this.idx ? 1 : -1);
    });
  }

  go(i, dir) {
    if (this.busy) return;
    this.busy = true;
    this.trigger = false;
    const svg = $('#stage-arm', this.root);
    tween(220, ease.in3, (k) => {
      svg.style.transform = `translateX(${-dir * 40 * k}%)`;
      svg.style.opacity = String(1 - k);
    }, () => {
      this.idx = i;
      this.mount();
      this.persist();
      tween(380, ease.out3, (k) => {
        svg.style.transform = `translateX(${dir * 40 * (1 - k)}%)`;
        svg.style.opacity = String(k);
      }, () => {
        svg.style.transform = '';
        this.busy = false;
      });
    });
  }

  // ---------- personnalisation ----------

  segAvailable(k) {
    const s = this.w.slots;
    if (k === 'tac') return !!(s.laser || s.light);
    if (k === 'grip') return !!s.grip;
    if (k === 'stock') return !!s.stock;
    if (k === 'muzzle') return s.muzzle && s.muzzle.length > 1;
    return true;
  }

  renderSegs() {
    this.segEl.innerHTML = SEGS.filter(([k]) => this.segAvailable(k))
      .map(([k, l]) => `<button type="button" role="tab" data-seg="${k}" aria-selected="${k === this.seg}">${l}</button>`).join('');
  }

  pill(attr, val, label, icon, pressed) {
    return `<button class="pill" type="button" ${attr}="${val}" aria-pressed="${!!pressed}"><span class="ico">${ICON[icon] || ''}</span>${esc(label)}</button>`;
  }

  renderRail() {
    for (const b of this.segEl.children) b.setAttribute('aria-selected', String(b.dataset.seg === this.seg));
    const w = this.w;
    const s = w.slots;
    const c = this.c;
    let h = '';
    const sep = '<span class="sep"></span>';
    if (this.seg === 'optic') {
      h = s.optic.map((o) => this.pill('data-optic', o, CATALOG.optic[o].name, o, c.optic === o)).join('');
      if (s.magnifier && c.optic === 'holo') {
        h += sep + this.pill('data-toggle', 'magnifier', 'Magnifier G33 ×3', 'mag3', c.magnifier);
        if (c.magnifier) h += this.pill('data-toggle', 'magFlip', c.magFlip ? 'Remettre en ligne' : 'Basculer', 'flip', c.magFlip);
      }
    } else if (this.seg === 'tac') {
      if (s.laser) {
        h += s.laser.map((o) => this.pill('data-laser', o, CATALOG.laser[o].name, o === 'none' ? 'none' : 'peq', c.laser === o)).join('');
        if (c.laser === 'peq') {
          h += this.pill('data-lmode', 'vis', 'Laser visible', 'laser', c.laserMode === 'vis');
          h += this.pill('data-lmode', 'ir', 'IR (NVG)', 'ir', c.laserMode === 'ir');
          h += this.pill('data-lmode', 'off', 'Laser off', 'none', c.laserMode === 'off');
        }
        if (s.light) h += sep;
      }
      if (s.light) {
        h += s.light.map((o) => this.pill('data-light', o, CATALOG.light[o].name, o === 'none' ? 'none' : 'light', c.light === o)).join('');
        if (c.light !== 'none') h += this.pill('data-toggle', 'lightOn', c.lightOn ? 'Éteindre' : 'Allumer', 'beam', c.lightOn);
      }
    } else if (this.seg === 'muzzle') {
      h = s.muzzle.map((o) => this.pill('data-muzzle', o, CATALOG.muzzle[o].name, MUZZLE_ICON[o], c.muzzle === o)).join('');
    } else if (this.seg === 'grip') {
      h = s.grip.map((o) => this.pill('data-grip', o, CATALOG.grip[o].name, o, c.grip === o)).join('');
    } else if (this.seg === 'stock') {
      h = s.stock.map((o) => this.pill('data-stock', o, `Crosse ${CATALOG.stock[o].name.toLowerCase()}`, o, c.stock === o)).join('');
    } else if (this.seg === 'mag') {
      const std = w.capacity.tube ? `Tube ${w.capacity.std} coups` : `Standard ${w.capacity.std} cps`;
      const ext = w.capacity.tube ? `Extension ${w.capacity.ext} coups` : `Étendu ${w.capacity.ext} cps · talon alu`;
      h = this.pill('data-mag', 'std', std, 'std', c.mag === 'std') + this.pill('data-mag', 'ext', ext, 'ext', c.mag === 'ext');
      if (c.mag === 'ext' && !w.capacity.tube) {
        h += sep + PADS.map((p) => `<button class="rim-dot" type="button" data-pad="${p.id}" aria-pressed="${c.pad === p.id}" aria-label="Talon ${p.name}" title="Talon ${p.name}" style="--b:${p.hex};--hi:#fff;--lo:#000;border-radius:8px"></button>`).join('');
      }
    } else {
      h = METAL.map((m) => `<button class="swatch" type="button" data-metal="${m.id}" aria-pressed="${c.metal === m.id}"><i style="--c:${m.hex}"></i><span>${esc(m.name)}</span></button>`).join('');
      h += sep + POLY.map((p) => `<button class="swatch" type="button" data-poly="${p.id}" aria-pressed="${c.poly === p.id}"><i style="--c:${p.hex};border-radius:10px"></i><span>Polym. ${esc(p.name)}</span></button>`).join('');
    }
    this.rail.innerHTML = h;
  }

  applyColors() {
    this.renderer.colors(this.c);
  }

  onRail(e) {
    const b = e.target.closest('button');
    if (!b) return;
    const c = this.c;
    const d = b.dataset;
    let rebuild = true;
    let rerail = true;
    if (d.optic) c.optic = d.optic;
    else if (d.laser) { c.laser = d.laser; if (c.laser === 'peq' && c.laserMode === 'off') c.laserMode = 'vis'; }
    else if (d.lmode) { c.laserMode = d.lmode; this.renderer.setLaser(c.laserMode); rebuild = false; }
    else if (d.light) c.light = d.light;
    else if (d.muzzle) c.muzzle = d.muzzle;
    else if (d.grip) c.grip = d.grip;
    else if (d.stock) c.stock = d.stock;
    else if (d.mag) {
      c.mag = d.mag;
      this.ammo = this.capacity();
      this.updateAmmo();
    } else if (d.pad) { c.pad = d.pad; rebuild = false; }
    else if (d.metal) { c.metal = d.metal; rebuild = false; rerail = false; }
    else if (d.poly) { c.poly = d.poly; rebuild = false; rerail = false; }
    else if (d.toggle) {
      c[d.toggle] = !c[d.toggle];
      if (d.toggle === 'lightOn') { this.renderer.setLight(c.lightOn); rebuild = false; }
    } else return;
    this.applyColors();
    if (rebuild) this.rebuild();
    else { this.renderSheet(); this.persist(); }
    if (rerail) {
      const x = this.rail.scrollLeft;
      this.renderRail();
      this.rail.scrollLeft = x;
    } else {
      const key = d.metal ? 'data-metal' : 'data-poly';
      for (const el of this.rail.querySelectorAll(`[${key}]`)) el.setAttribute('aria-pressed', String(el === b));
    }
    this.updateTexts();
  }

  setVitrine(on) {
    this.root.classList.toggle('vitrine', on);
    if (on) this.sheet.set(false);
  }

  // ---------- tir ----------

  bind() {
    this.segEl.addEventListener('click', (e) => {
      const b = e.target.closest('[data-seg]');
      if (!b) return;
      this.seg = b.dataset.seg;
      this.renderRail();
      this.rail.scrollLeft = 0;
      this.persist();
    });
    this.rail.addEventListener('click', (e) => this.onRail(e));
    $('#a-restore', this.root).addEventListener('click', () => this.setVitrine(false));

    const fire = (on) => (e) => {
      if (e.cancelable) e.preventDefault();
      if (on) {
        this.audio.unlock();
        if (e.pointerId != null) this.btnFire.setPointerCapture(e.pointerId);
        this.pull();
      } else {
        this.trigger = false;
      }
      this.btnFire.classList.toggle('pressed', on);
    };
    this.btnFire.addEventListener('pointerdown', fire(true));
    this.btnFire.addEventListener('pointerup', fire(false));
    this.btnFire.addEventListener('pointercancel', fire(false));
    this.btnFire.addEventListener('contextmenu', (e) => e.preventDefault());
    this.btnReload.addEventListener('click', () => { this.audio.unlock(); this.reload(); });
    this.btnMode.addEventListener('click', () => { this.audio.unlock(); this.cycleMode(); });

    // le studio sert à tourner autour de l'arme (un doigt) et à zoomer (deux doigts)
  }

  cycleMode() {
    const modes = this.w.modes;
    const c = this.c;
    c.mode = modes[(modes.indexOf(c.mode) + 1) % modes.length];
    this.audio.fx('select');
    this.renderer.setSelector(c.mode);
    this.updateMode();
    this.persist();
  }

  updateMode() {
    const m = this.c.mode;
    this.btnMode.querySelector('b').textContent = MODE_LABEL[m];
    this.btnMode.dataset.mode = m;
  }

  updateAmmo() {
    const tube = this.w.capacity.tube;
    this.ammoEl.innerHTML = `<b>${this.ammo}</b><span>${this.chambered ? '+1' : '+0'}</span><small>/${this.capacity()}${tube ? ' tube' : ''}</small>`;
    this.ammoEl.classList.toggle('low', this.ammo <= Math.max(2, this.capacity() * 0.15));
    this.ammoEl.classList.toggle('empty', !this.chambered && this.ammo === 0);
  }

  pull() {
    if (this.reloading || this.busy) return;
    if (this.c.mode === 'safe') {
      this.btnMode.classList.remove('nope');
      void this.btnMode.offsetWidth;
      this.btnMode.classList.add('nope');
      return;
    }
    this.trigger = true;
    this.nextShot = performance.now();
    if (this.c.mode === 'semi') {
      this.shoot(0);
      this.trigger = false;
    }
  }

  shoot(when) {
    const w = this.w;
    const c = this.c;
    if (!this.chambered) {
      this.audio.fx('dry', when);
      this.trigger = false;
      return false;
    }
    this.chambered = false;
    if (this.ammo > 0) {
      this.ammo--;
      this.chambered = true;
    }
    const last = !this.chambered;
    this.audio.shot(w, c, when);
    const suppressed = c.muzzle === 'sup' || c.muzzle === 'sd';
    const comp = c.muzzle === 'comp' || c.muzzle === 'comp-int';
    this.renderer.fire({ suppressed, comp, last: last && w.type === 'pistol' });
    let sigma = SIGMA[w.type];
    if (c.optic === 'rds') sigma *= 0.72;
    if (c.optic === 'holo') sigma *= c.magnifier && !c.magFlip && w.slots.magnifier ? 0.45 : 0.66;
    if (c.laser === 'peq' && c.laserMode === 'vis') sigma *= 0.9;
    let rise = c.mode === 'auto' ? w.recoil.rise * 0.022 : 0;
    if (comp) rise *= 0.6;
    if (c.grip !== 'none' && w.slots.grip) rise *= 0.8;
    if (c.stock === 'extended') rise *= 0.85;
    this.target.shot({ sigma, rise, pellets: w.type === 'shotgun' ? 9 : 0 });
    this.updateAmmo();
    if (navigator.vibrate) navigator.vibrate(w.type === 'shotgun' ? 28 : 12);
    return true;
  }

  async reload() {
    if (this.reloading || this.busy) return;
    const w = this.w;
    const cap = this.capacity();
    if (this.ammo >= cap && this.chambered) return;
    this.reloading = true;
    this.trigger = false;
    this.btnReload.classList.add('busy');
    const r = this.renderer;
    const A = this.audio;
    const wait = (ms) => new Promise((res) => setTimeout(res, ms));
    try {
      if (w.capacity.tube) {
        while (this.ammo < cap) {
          A.fx('shell');
          await r.shellIn();
          this.ammo++;
          this.updateAmmo();
          await wait(90);
        }
        if (!this.chambered) {
          A.fx('release');
          await r.rack(40, 90, 70);
          this.chambered = true;
          this.ammo--;
          if (this.ammo < cap) {
            A.fx('shell');
            await r.shellIn();
            this.ammo++;
          }
        }
      } else {
        A.fx('magOut');
        await r.magOut();
        await wait(160);
        A.fx('magIn');
        await r.magIn();
        this.ammo = cap;
        this.updateAmmo();
        await wait(120);
        if (!this.chambered) {
          if (w.type === 'pistol') {
            A.fx('release');
            r.lockSlide(false);
          } else if (w.id === 'mp5') {
            A.fx('rack');
            await r.rack(48, 230, 90);
          } else {
            A.fx('release');
            await r.rack(20, 60, 60);
          }
          this.chambered = true;
          this.ammo--;
        } else if (w.id === 'mp5') {
          // le célèbre « HK slap »
          A.fx('rack');
          await r.rack(48, 230, 90);
        }
      }
    } finally {
      this.updateAmmo();
      this.reloading = false;
      this.btnReload.classList.remove('busy');
    }
  }

  loop(now) {
    requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    if (!this.active) return;
    // rafale : tirs planifiés à la cadence réelle, son programmé à l'échantillon près
    if (this.trigger && this.c.mode === 'auto' && this.w.specs.rof) {
      const interval = 60000 / this.w.specs.rof;
      let guard = 0;
      while (this.trigger && this.nextShot <= now + 4 && guard++ < 4) {
        const when = Math.max(0, (this.nextShot - now) / 1000);
        if (!this.shoot(when)) break;
        this.nextShot += interval;
      }
    }
    this.renderer.tick(dt);
    this.target.tick(dt);
  }

  observe() {
    const ro = new ResizeObserver(() => this.fit());
    ro.observe(this.studio);
    ro.observe($('#a-deck', this.root));
  }

  fit() {
    const r = this.studio.getBoundingClientRect();
    this.renderer.fit(r.width, r.height);
    if (!this.root.classList.contains('vitrine')) {
      this.root.style.setProperty('--sheet-h', `${Math.round($('#a-deck', this.root).offsetHeight + 58)}px`);
    }
  }
}
