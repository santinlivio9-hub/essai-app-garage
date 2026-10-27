// Synthèse des sons d'armes (Web Audio). Aucun échantillon : chaque son est calculé
// dans le navigateur puis mis en cache sous forme d'AudioBuffer.
//
// Détonation = attaque de souffle très brève (bruit filtré) + « boom » grave en glissando
// + claquement supersonique (onde en N) pour le 5,56 + résonance métallique de la culasse
// (modes amortis inharmoniques) + queue d'écho (réverbération de stand).
// Silencieux : souffle fortement atténué et assourdi (« thwip ») — la mécanique ressort.
import { unlockAudio } from '../core/audio.js';

class Filt {
  constructor(type, f, q, sr) {
    const w = (2 * Math.PI * Math.min(f, sr * 0.45)) / sr;
    const al = Math.sin(w) / (2 * q);
    const c = Math.cos(w);
    const a0 = 1 + al;
    let b0;
    let b1;
    let b2;
    if (type === 'lp') { b0 = (1 - c) / 2; b1 = 1 - c; b2 = b0; }
    else if (type === 'hp') { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = b0; }
    else { b0 = al; b1 = 0; b2 = -al; }
    this.b0 = b0 / a0; this.b1 = b1 / a0; this.b2 = b2 / a0;
    this.a1 = (-2 * c) / a0; this.a2 = (1 - al) / a0;
    this.z1 = 0; this.z2 = 0;
  }
  run(x) {
    const y = this.b0 * x + this.z1;
    this.z1 = this.b1 * x - this.a1 * y + this.z2;
    this.z2 = this.b2 * x - this.a2 * y;
    return y;
  }
}

const rnd = () => Math.random() * 2 - 1;

// Résonance métallique (somme de modes amortis) + tic de bruit.
function clank(out, sr, t0, { freqs, taus, gain, noise = 0.6, ntau = 0.0015 }) {
  const i0 = Math.floor(t0 * sr);
  const len = Math.min(out.length - i0, Math.floor(0.12 * sr));
  const ph = freqs.map(() => Math.random() * 6.28);
  const hp = new Filt('hp', 1200, 0.7, sr);
  for (let i = 0; i < len; i++) {
    const t = i / sr;
    let s = 0;
    for (let k = 0; k < freqs.length; k++) s += Math.sin(2 * Math.PI * freqs[k] * t + ph[k]) * Math.exp(-t / taus[k]) / (k + 1);
    s += hp.run(rnd()) * noise * Math.exp(-t / ntau);
    out[i0 + i] += s * gain;
  }
}

// Frottement (glissière, chargeur) : bruit passe-bande avec enveloppe.
function scrape(out, sr, t0, dur, f, gain) {
  const i0 = Math.floor(t0 * sr);
  const len = Math.min(out.length - i0, Math.floor(dur * sr));
  const bp = new Filt('bp', f, 1.4, sr);
  for (let i = 0; i < len; i++) {
    const k = i / len;
    const env = Math.sin(Math.PI * k) * (0.6 + 0.4 * Math.random());
    out[i0 + i] += bp.run(rnd()) * env * gain;
  }
}

function normalize(a, peak) {
  let m = 0;
  for (const v of a) m = Math.max(m, Math.abs(v));
  if (m > 0) for (let i = 0; i < a.length; i++) a[i] *= peak / m;
  return a;
}

const MECH = {
  pistol: { freqs: [2350, 3900, 5600, 7300], taus: [0.012, 0.008, 0.006, 0.004] },
  smg: { freqs: [1850, 3150, 4700, 6900], taus: [0.016, 0.01, 0.007, 0.005] },
  rifle: { freqs: [1650, 2900, 4300, 6100], taus: [0.018, 0.011, 0.008, 0.005] },
  shotgun: { freqs: [980, 1720, 2860, 4200], taus: [0.03, 0.02, 0.012, 0.008] },
};

export function synthShot(sr, snd, { suppressed = false, comp = false, subsonic = false } = {}) {
  const len = Math.floor(0.5 * sr);
  const out = new Float32Array(len);
  const tau = snd.blastTau * (suppressed ? 1.5 : 1);
  const lp1 = new Filt('lp', suppressed ? 850 : snd.lp * (comp ? 1.2 : 1), 0.7, sr);
  const lp2 = new Filt('lp', suppressed ? 1100 : snd.lp * 1.4, 0.6, sr);
  const hp = new Filt('hp', suppressed ? 140 : 70, 0.7, sr);
  const pf = new Filt('bp', 2100, 1.1, sr);
  const blastG = suppressed ? 0.11 : comp ? 1.25 : 1;
  const [f0, f1, btau] = snd.boom;
  let ph = 0;
  for (let i = 0; i < len; i++) {
    const t = i / sr;
    const atk = 1 - Math.exp(-t / 0.00022);
    // souffle de bouche
    const n = rnd();
    let b = hp.run(lp2.run(lp1.run(n))) * atk * Math.exp(-t / tau) * 2.2 * blastG;
    // « thwip » des gaz ralentis par les chicanes
    if (suppressed) b += pf.run(n) * Math.exp(-t / 0.0075) * atk * 0.22;
    // boom grave
    const fq = f1 + (f0 - f1) * Math.exp(-t / 0.018);
    ph += (2 * Math.PI * fq) / sr;
    b += Math.sin(ph) * Math.exp(-t / btau) * atk * (suppressed ? 0.22 : 0.9);
    out[i] = b;
  }
  // claquement supersonique (onde en N) — subsiste même avec un silencieux en 5,56
  if (snd.crack && !subsonic) {
    const w = Math.floor(0.00035 * sr);
    const g = suppressed ? 1.4 : 1.6;
    for (let i = 0; i < w; i++) out[i + 2] += g * (1 - (2 * i) / w);
  }
  // mécanique de culasse
  const mech = MECH[snd.kind] || MECH.pistol;
  const mg = suppressed ? 0.09 : 0.12;
  clank(out, sr, snd.mech[0] + Math.random() * 0.002, { ...mech, gain: mg * 0.8 });
  clank(out, sr, snd.mech[1] + Math.random() * 0.004, { ...mech, gain: mg });
  return normalize(out, suppressed ? (snd.crack && !subsonic ? 0.5 : 0.22) : 0.95 * (snd.gain || 1) / 1.2);
}

function synthMisc(sr, kind) {
  const out = new Float32Array(Math.floor(0.5 * sr));
  const m = MECH.smg;
  switch (kind) {
    case 'dry':
      clank(out, sr, 0.002, { freqs: [3200, 5200], taus: [0.006, 0.004], gain: 0.3, noise: 0.4 });
      return normalize(out, 0.35);
    case 'select':
      clank(out, sr, 0.002, { freqs: [4100, 6600], taus: [0.004, 0.003], gain: 0.3, noise: 0.5, ntau: 0.0008 });
      return normalize(out, 0.25);
    case 'magOut':
      clank(out, sr, 0.004, { freqs: [3600, 5400], taus: [0.005, 0.004], gain: 0.2, noise: 0.5 });
      scrape(out, sr, 0.02, 0.12, 2400, 0.25);
      clank(out, sr, 0.15, { freqs: [900, 1500, 2700], taus: [0.03, 0.02, 0.01], gain: 0.25, noise: 0.3 });
      return normalize(out, 0.5);
    case 'magIn':
      scrape(out, sr, 0.0, 0.08, 2000, 0.25);
      clank(out, sr, 0.085, { ...m, gain: 0.5, noise: 1, ntau: 0.003 });
      return normalize(out, 0.7);
    case 'rack':
      scrape(out, sr, 0.0, 0.14, 2800, 0.3);
      clank(out, sr, 0.13, { ...m, gain: 0.3 });
      clank(out, sr, 0.27, { freqs: [1700, 2950, 4400, 6600], taus: [0.02, 0.012, 0.008, 0.005], gain: 0.6, noise: 1.1, ntau: 0.003 });
      return normalize(out, 0.75);
    case 'release':
      clank(out, sr, 0.004, { freqs: [1700, 2950, 4400, 6600], taus: [0.02, 0.012, 0.008, 0.005], gain: 0.6, noise: 1.1, ntau: 0.003 });
      return normalize(out, 0.7);
    case 'shell':
      scrape(out, sr, 0.0, 0.07, 1300, 0.3);
      clank(out, sr, 0.07, { freqs: [700, 1400, 2300], taus: [0.025, 0.015, 0.01], gain: 0.4, noise: 0.6, ntau: 0.004 });
      return normalize(out, 0.55);
    case 'ting':
      clank(out, sr, 0.002, { freqs: [5200, 7900, 11200], taus: [0.05, 0.035, 0.02], gain: 0.4, noise: 0.15 });
      clank(out, sr, 0.09, { freqs: [5150, 7800], taus: [0.035, 0.02], gain: 0.2, noise: 0.1 });
      return normalize(out, 0.12);
    case 'thud':
      clank(out, sr, 0.002, { freqs: [380, 720, 1300], taus: [0.03, 0.02, 0.01], gain: 0.4, noise: 0.5, ntau: 0.004 });
      return normalize(out, 0.14);
    default:
      return out;
  }
}

// Réponse impulsionnelle de stand de tir couvert (premières réflexions + queue diffuse).
function impulse(ctx, seconds = 1.3) {
  const sr = ctx.sampleRate;
  const len = Math.floor(seconds * sr);
  const buf = ctx.createBuffer(2, len, sr);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    const lp = new Filt('lp', 5200, 0.6, sr);
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      d[i] = lp.run(rnd()) * Math.exp(-t / 0.32) * (1 - Math.exp(-t / 0.004));
    }
    for (const [dt, g] of [[0.011, 0.5], [0.019, 0.35], [0.031, 0.3], [0.047, 0.2]]) {
      const i = Math.floor((dt + ch * 0.002) * sr);
      d[i] += g;
    }
  }
  return buf;
}

export class GunAudio {
  constructor() {
    this.ctx = null;
    this.cache = new Map();
  }

  unlock() {
    if (this.ctx) {
      unlockAudio();
      return true;
    }
    const ctx = unlockAudio();
    if (!ctx) return false;
    this.ctx = ctx;
    this.out = ctx.createGain();
    this.out.gain.value = 0.8;
    const lim = ctx.createDynamicsCompressor();
    lim.threshold.value = -8;
    lim.knee.value = 2;
    lim.ratio.value = 12;
    lim.attack.value = 0.001;
    lim.release.value = 0.12;
    this.verb = ctx.createConvolver();
    this.verb.buffer = impulse(ctx);
    this.wet = ctx.createGain();
    this.wet.gain.value = 0.32;
    this.dry = ctx.createGain();
    this.dry.connect(lim);
    this.wet.connect(this.verb).connect(lim);
    lim.connect(this.out).connect(ctx.destination);
    return true;
  }

  buffer(key, make) {
    let list = this.cache.get(key);
    if (!list) {
      list = [];
      this.cache.set(key, list);
    }
    if (list.length < 3) {
      const data = make(this.ctx.sampleRate);
      const b = this.ctx.createBuffer(1, data.length, this.ctx.sampleRate);
      b.getChannelData(0).set(data);
      list.push(b);
      return b;
    }
    return list[(Math.random() * list.length) | 0];
  }

  play(buf, { when = 0, gain = 1, wet = 0.32, rate = 1 } = {}) {
    if (!this.ctx) return;
    const s = this.ctx.createBufferSource();
    s.buffer = buf;
    s.playbackRate.value = rate;
    const g = this.ctx.createGain();
    g.gain.value = gain;
    s.connect(g);
    g.connect(this.dry);
    const w = this.ctx.createGain();
    w.gain.value = wet;
    g.connect(w).connect(this.wet);
    s.start(this.ctx.currentTime + Math.max(0, when));
  }

  shot(wpn, cfg, when = 0) {
    if (!this.ctx) return;
    const suppressed = cfg.muzzle === 'sup' || cfg.muzzle === 'sd';
    const comp = cfg.muzzle === 'comp' || cfg.muzzle === 'comp-int';
    const subsonic = cfg.muzzle === 'sd';
    const key = `${wpn.id}|${cfg.muzzle}`;
    const b = this.buffer(key, (sr) => synthShot(sr, wpn.sound, { suppressed, comp, subsonic }));
    this.play(b, { when, rate: 0.97 + Math.random() * 0.06, wet: suppressed ? 0.12 : 0.36 });
    // douille qui tombe au sol
    const drop = wpn.type === 'shotgun' ? 'thud' : 'ting';
    this.play(this.buffer(drop, (sr) => synthMisc(sr, drop)), { when: when + 0.38 + Math.random() * 0.25, wet: 0.2, rate: 0.9 + Math.random() * 0.25 });
  }

  fx(kind, when = 0, gain = 1) {
    if (!this.ctx) return;
    this.play(this.buffer(kind, (sr) => synthMisc(sr, kind)), { when, gain, wet: 0.15, rate: 0.97 + Math.random() * 0.06 });
  }

  get now() {
    return this.ctx ? this.ctx.currentTime : 0;
  }
}
