// Graphe Web Audio : synthétiseur (AudioWorklet, repli ScriptProcessor) → égaliseur
// « caisse » → compresseur → sortie. Doit être déverrouillé dans un geste utilisateur (iOS).

import { unlockAudio, suspendAudio, resumeAudio } from '../core/audio.js';

const WORKLET_URL = new URL('./engine-dsp.js', import.meta.url).href;

// Profil transmis au DSP : timbre + régimes de référence.
export function dspProfile(car) {
  return { ...car.sound, idle: car.engine.idle, redline: car.engine.redline };
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
    body.connect(comp).connect(this.master).connect(ctx.destination);

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
