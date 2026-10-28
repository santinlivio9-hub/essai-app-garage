// Graphe Web Audio : synthétiseur (AudioWorklet, repli ScriptProcessor) → égaliseur
// « caisse » → acoustique du garage (réverbération à convolution) → compresseur → sortie.
// Doit être déverrouillé dans un geste utilisateur (iOS).

import { unlockAudio, suspendAudio, resumeAudio } from '../core/audio.js';

const WORKLET_URL = new URL('./engine-dsp.js', import.meta.url).href;

// Profil transmis au DSP : timbre + régimes de référence.
export function dspProfile(car) {
  return { ...car.sound, idle: car.engine.idle, redline: car.engine.redline };
}

// Réponse impulsionnelle d'un grand garage / showroom (sol béton, vitrages) : premières réflexions
// nettes puis queue diffuse d'environ 1 s, aigus amortis plus vite que les graves.
function garageIR(ctx, seconds = 1.2) {
  const sr = ctx.sampleRate;
  const len = Math.floor(seconds * sr);
  const buf = ctx.createBuffer(2, len, sr);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let lpA = 0;
    let lpB = 0;
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      const n = Math.random() * 2 - 1;
      lpA += (n - lpA) * 0.35; // ≈ 4 kHz
      lpB += (n - lpB) * 0.06; // ≈ 500 Hz
      const k = Math.min(1, t / 0.4);
      d[i] = (lpA * (1 - k) + lpB * k * 2.2) * Math.exp(-t / 0.3) * (1 - Math.exp(-t / 0.008)) * 0.5;
    }
    for (const [dt, g] of [[0.009, 0.5], [0.017, 0.4], [0.026, 0.32], [0.041, 0.24], [0.067, 0.18], [0.093, 0.12]]) {
      const i0 = Math.floor((dt + ch * 0.0031) * sr);
      for (let j = 0; j < 16; j++) d[i0 + j] += g * Math.exp(-j / 4);
    }
  }
  return buf;
}

export class EngineAudio {
  constructor() {
    this.ctx = null;
    this.node = null;
    this.mode = 'none';
    this.ready = null;
    this.profile = null;
  }

  // À appeler de façon synchrone dans un gestionnaire de geste (pointerup / click).
  unlock() {
    if (this.ctx) {
      if (this.ctx.state !== 'running') this.ctx.resume();
      return this.ready;
    }
    this.ctx = unlockAudio();
    if (!this.ctx) return Promise.reject(new Error('Web Audio indisponible'));
    this.ready = this.build();
    return this.ready;
  }

  async build() {
    const ctx = this.ctx;
    const body = ctx.createBiquadFilter();
    body.type = 'lowshelf';
    body.frequency.value = 140;
    body.gain.value = 4;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.knee.value = 10;
    comp.ratio.value = 4;
    comp.attack.value = 0.004;
    comp.release.value = 0.15;
    this.master = ctx.createGain();
    this.master.gain.value = 0.9;
    // acoustique du garage : le son « remplit » la pièce au lieu de sortir sec du haut-parleur
    const verb = ctx.createConvolver();
    verb.buffer = garageIR(ctx);
    const wet = ctx.createGain();
    wet.gain.value = 0.2;
    const pre = ctx.createDelay(0.05);
    pre.delayTime.value = 0.012;
    body.connect(comp);
    body.connect(pre).connect(verb).connect(wet).connect(comp);
    comp.connect(this.master).connect(ctx.destination);

    try {
      if (!ctx.audioWorklet) throw new Error('no worklet');
      await ctx.audioWorklet.addModule(WORKLET_URL);
      this.node = new AudioWorkletNode(ctx, 'engine-dsp', { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2] });
      this.params = {};
      for (const k of ['rpm', 'throttle', 'ignition', 'starter', 'cut', 'flare']) this.params[k] = this.node.parameters.get(k);
      this.mode = 'worklet';
    } catch {
      // Repli : même DSP exécuté sur le thread principal.
      if (!globalThis.EngineDSP) await import(WORKLET_URL).catch(() => {});
      const dsp = new globalThis.EngineDSP(ctx.sampleRate);
      const P = { rpm: 0, throttle: 0, ignition: 0, starter: 0, cut: 0, flare: 0 };
      const sp = ctx.createScriptProcessor(1024, 0, 2);
      sp.onaudioprocess = (ev) => {
        const b = ev.outputBuffer;
        dsp.render(b.getChannelData(0), b.getChannelData(1), b.length, P);
      };
      this.dsp = dsp;
      this.P = P;
      this.node = sp;
      this.mode = 'script';
    }
    this.node.connect(body);
    if (this.profile) this.send({ type: 'profile', profile: this.profile });
    return this;
  }

  setProfile(profile) {
    this.profile = profile;
    this.send({ type: 'profile', profile });
  }

  send(msg) {
    if (!this.node) return;
    if (this.mode === 'worklet') this.node.port.postMessage(msg);
    else if (this.dsp) this.dsp.message(msg);
  }

  set(o) {
    if (!this.node) return;
    if (this.mode === 'worklet') {
      const t = this.ctx.currentTime;
      for (const k in this.params) this.params[k].setValueAtTime(o[k] || 0, t);
    } else if (this.P) {
      for (const k in this.P) this.P[k] = o[k] || 0;
    }
  }

  suspend() {
    suspendAudio();
  }

  resume() {
    resumeAudio();
  }
}
