/* Synthèse moteur temps réel.
 * Chargé deux fois : comme module AudioWorklet (registerProcessor) et comme script
 * classique sur le thread principal (repli ScriptProcessor pour les vieux iOS).
 *
 * Modèle thermique : le vilebrequin avance en degrés (cycle 4 temps = 720°). Chaque
 * cylindre déclenche, à son angle d'allumage réel, une impulsion de pression dans sa
 * ligne d'échappement (banc A / banc B). Les impulsions excitent des résonateurs de
 * ligne (passe-bandes) ; les écarts d'amplitude et de calage entre cylindres créent les
 * sous-harmoniques qui font le caractère (vocalise du 5 cylindres, glouglou du V8
 * cross-plane). S'y ajoutent admission, turbo, compresseur, cliquetis diesel,
 * démarreur et retours de flamme.
 * Modèle électrique : sifflements d'onduleur / moteur proportionnels au régime.
 */
(function () {
  const TAU = Math.PI * 2;

  class Biquad {
    constructor() { this.b0 = 0; this.b1 = 0; this.b2 = 0; this.a1 = 0; this.a2 = 0; this.z1 = 0; this.z2 = 0; }
    bandpass(f, q, sr) {
      const w = (TAU * Math.min(f, sr * 0.45)) / sr;
      const al = Math.sin(w) / (2 * q);
      const a0 = 1 + al;
      this.b0 = al / a0; this.b1 = 0; this.b2 = -al / a0;
      this.a1 = (-2 * Math.cos(w)) / a0; this.a2 = (1 - al) / a0;
      return this;
    }
    lowpass(f, q, sr) {
      const w = (TAU * Math.min(f, sr * 0.45)) / sr;
      const al = Math.sin(w) / (2 * q);
      const c = Math.cos(w);
      const a0 = 1 + al;
      this.b0 = (1 - c) / 2 / a0; this.b1 = (1 - c) / a0; this.b2 = this.b0;
      this.a1 = (-2 * c) / a0; this.a2 = (1 - al) / a0;
      return this;
    }
    highpass(f, q, sr) {
      const w = (TAU * Math.min(f, sr * 0.45)) / sr;
      const al = Math.sin(w) / (2 * q);
      const c = Math.cos(w);
      const a0 = 1 + al;
      this.b0 = (1 + c) / 2 / a0; this.b1 = -(1 + c) / a0; this.b2 = this.b0;
      this.a1 = (-2 * c) / a0; this.a2 = (1 - al) / a0;
      return this;
    }
    run(x) {
      const y = this.b0 * x + this.z1;
      this.z1 = this.b1 * x - this.a1 * y + this.z2;
      this.z2 = this.b2 * x - this.a2 * y;
      return y;
    }
  }

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

  class EngineDSP {
    constructor(sr) {
      this.sr = sr;
      this.p = null;
      this.rpm = 0;
      this.thr = 0;
      this.kRpm = 1 - Math.exp(-1 / (0.012 * sr));
      this.kThr = 1 - Math.exp(-1 / (0.03 * sr));
      this.popEnv = 0;
      this.clickEnv = 0;
      this.wakeEnv = 0;
      this.wakePh = 0;
      this.contact = 0;
      this.hp = new Biquad().highpass(24, 0.7, sr);
      this.hpS = new Biquad().highpass(90, 0.7, sr);
      this.lpS = new Biquad().lowpass(1800, 0.7, sr);
      this.mechHP = new Biquad().highpass(2600, 0.8, sr);
      this.mechEnv = 0;
      this.side = 0;
      this.out = 0;
    }

    setProfile(p) {
      const sr = this.sr;
      this.p = p;
      this.phase = 0;
      this.next = 0;
      this.rpm = 0;
      this.thr = 0;
      this.boost = 0;
      this.popEnv = 0;
      this.clickEnv = 0;
      this.stPh = 0;
      this.whPh = 0;
      this.tbPh = 0;
      this.evPh = [0, 0, 0, 0, 0];
      if (p.type === 'ev') {
        this.evNoise = new Biquad().lowpass(600, 0.7, sr);
        this.evClick = new Biquad().bandpass(420, 1.2, sr);
        this.lp = new Biquad().lowpass(6000, 0.6, sr);
        return;
      }
      const n = p.cyl;
      this.base = [];
      this.ev = [];
      for (let j = 0; j < n; j++) {
        const a = (j * 720) / n + (p.skew ? p.skew[j] : 0);
        this.base.push((a + 720) % 720);
        this.ev.push((a + 720) % 720);
      }
      this.s1 = [0, 0];
      this.s2 = [0, 0];
      this.res = [[], []];
      for (let b = 0; b < 2; b++) {
        const k = b === 1 ? p.resB || 1 : 1;
        for (const [f, q, g] of p.res) this.res[b].push({ f: new Biquad().bandpass(f * k, q, sr), g });
      }
      const dl = Math.max(1, Math.round(((p.bankDelay || 0) / 1000) * sr));
      this.dBuf = new Float32Array(dl + 2);
      this.dIdx = 0;
      this.dLen = dl;
      this.lp1 = new Biquad().lowpass(p.lp, 0.7, sr);
      this.lp2 = new Biquad().lowpass(p.lp * 1.6, 0.6, sr);
      this.intakeBP = new Biquad().bandpass(1100, 1.1, sr);
      this.clatBP = new Biquad().bandpass(3200, 1.4, sr);
      this.clatLP = new Biquad().lowpass(2600, 0.7, sr);
      this.turbBP = new Biquad().bandpass(3000, 2, sr);
      this.stBP1 = new Biquad().bandpass(420, 0.9, sr);
      this.stBP2 = new Biquad().bandpass(1500, 2.5, sr);
      this.popHP = new Biquad().highpass(900, 0.7, sr);
      this.lastLp = -1;
    }

    message(m) {
      if (m.type === 'profile') this.setProfile(m.profile);
      else if (m.type === 'pop') this.popEnv = Math.min(1.5, this.popEnv + m.amt);
      else if (m.type === 'click') this.contact = 1;
      else if (m.type === 'wake') { this.wakeEnv = 1; this.wakePh = 0; }
    }

    render(L, R, n, P) {
      const p = this.p;
      if (!p) { L.fill(0); if (R) R.fill(0); return; }
      if (p.type === 'ev') {
        this.renderEV(L, n, P);
        if (R) R.set(L);
      } else this.renderICE(L, n, P, R);
    }

    fire(j, P) {
      const p = this.p;
      const b = p.bank[j];
      let amp = p.amp[j];
      const idleN = clamp(1 - (this.rpm - p.idle) / 1400, 0, 1);
      if (P.ignition > 0.5) {
        // rupteur : coupure partielle (un allumage sur deux), d'où le « brap-brap »
        if (P.cut > 0.5) amp *= j % 2 ? 0.05 : 0.55;
        const overrun = this.thr < 0.05 && this.rpm > p.idle * 1.6;
        const load = overrun ? 0.16 : 0.34 + 0.66 * this.thr;
        amp *= load * (1 + p.lumpy * idleN * (Math.random() * 2 - 1));
        if (P.flare) amp *= 1 + P.flare;
        this.clickEnv += (p.clatter || 0) * (0.6 + 0.4 * idleN);
      } else {
        amp *= P.starter > 0.5 ? 0.12 : 0.06;
      }
      this.s1[b] += amp;
      this.s2[b] += amp;
      // distribution : soupapes et chaîne, un « tic » métallique par allumage
      if (P.ignition > 0.5 || P.starter > 0.5) this.mechEnv += 0.5 + 0.5 * this.thr;
      // nouveau calage pour le prochain cycle (dispersion de combustion)
      const jit = p.lumpy * idleN * 10 + 0.6;
      this.ev[j] = (this.base[j] + (Math.random() * 2 - 1) * jit + 720) % 720;
    }

    renderICE(out, n, P, R) {
      const p = this.p;
      const sr = this.sr;
      const N = p.cyl;
      // coefficients par bloc
      const rpmEst = Math.max(this.rpm, 80);
      const tau1 = p.pulseTau * Math.sqrt(900 / Math.max(rpmEst, 400));
      const d1 = Math.exp(-1 / (tau1 * sr));
      const d2 = Math.exp(-1 / (tau1 * 0.22 * sr));
      const rN = this.rpm / p.redline;
      const lpF = p.lp + this.thr * p.lpThr + rN * p.lpRpm;
      if (Math.abs(lpF - this.lastLp) > 8) {
        this.lp1.lowpass(lpF, 0.75, sr);
        this.lp2.lowpass(lpF * 1.7, 0.6, sr);
        this.lastLp = lpF;
      }
      if (p.turbo) {
        const tf = p.turbo.f0 + this.boost * p.turbo.f1;
        this.turbBP.bandpass(tf, 3, sr);
      }
      const dPop = Math.exp(-1 / (0.006 * sr));
      const dMech = Math.exp(-1 / (0.0018 * sr));
      const mech = (p.mech ?? 0.05) * (0.25 + 0.75 * clamp(rN, 0, 1));
      // V-moteurs : chaque banc a sa sortie d'échappement, légèrement écartées dans l'espace stéréo
      const width = p.bank && p.bank.some((x) => x) ? 0.22 : 0;
      const dClk = Math.exp(-1 / (0.0007 * sr));
      const starter = P.starter;
      const drive = p.drive;
      const norm = 1 / Math.tanh(drive);

      for (let i = 0; i < n; i++) {
        this.rpm += (P.rpm - this.rpm) * this.kRpm;
        this.thr += (P.throttle - this.thr) * this.kThr;

        // compression pendant le lancement : le démarreur ralentit avant chaque PMH
        let gap = this.ev[this.next] - this.phase;
        if (gap < 0) gap += 720;
        const cmp = Math.pow(1 - clamp(gap / (720 / N), 0, 1), 3);
        let rpm = this.rpm;
        if (starter > 0.01) rpm *= 1 - 0.45 * cmp * starter;

        // avance du vilebrequin + allumages franchis
        let remain = (360 * rpm) / 60 / sr;
        let guard = 0;
        while (remain > 0 && guard++ < 16) {
          let d = this.ev[this.next] - this.phase;
          if (d < 0) d += 720;
          if (d <= remain) {
            this.phase = this.ev[this.next];
            remain -= d;
            this.fire(this.next, P);
            this.next = (this.next + 1) % N;
          } else {
            this.phase += remain;
            if (this.phase >= 720) this.phase -= 720;
            remain = 0;
          }
        }

        const noise = Math.random() * 2 - 1;
        let sig = 0;
        let diff = 0;
        for (let b = 0; b < 2; b++) {
          this.s1[b] *= d1;
          this.s2[b] *= d2;
          let e = (this.s1[b] - this.s2[b]) * (1 + p.rough * noise);
          if (b === 0 && this.popEnv > 1e-4) {
            e += this.popEnv * (Math.random() * 2 - 1) * 1.6;
          }
          let y = e * p.direct;
          const rs = this.res[b];
          for (let k = 0; k < rs.length; k++) y += rs[k].f.run(e) * rs[k].g;
          if (b === 1 && this.dLen > 1) {
            this.dBuf[this.dIdx] = y;
            const r = (this.dIdx + 1) % (this.dLen + 1);
            y = this.dBuf[r];
          }
          sig += y;
          diff += b ? -y : y;
        }
        if (this.dLen > 1) this.dIdx = (this.dIdx + 1) % (this.dLen + 1);

        // silencieux / ligne : passe-bas dynamique puis saturation douce
        let x = this.lp2.run(this.lp1.run(sig) * 0.85 + sig * 0.15);
        x = Math.tanh(x * drive) * norm * 0.6;

        // crépitements (partie aiguë des retours de flamme)
        if (this.popEnv > 1e-4) {
          x += this.popHP.run(noise * this.popEnv) * 0.35;
          this.popEnv *= dPop;
        }

        // admission
        if (p.intake) x += this.intakeBP.run(noise) * p.intake * this.thr * (0.2 + rN) * 0.5;

        // cliquetis d'injection diesel (étouffé)
        if (this.clickEnv > 1e-4) {
          x += this.clatLP.run(this.clatBP.run(noise * this.clickEnv)) * 0.5;
          this.clickEnv *= dClk;
        }

        // turbo : sifflement + souffle
        if (p.turbo) {
          const tgt = this.thr * clamp((this.rpm - p.turbo.spool) / 2200, 0, 1);
          this.boost += (tgt - this.boost) * (tgt > this.boost ? 0.00004 : 0.00012);
          this.tbPh += (p.turbo.f0 + this.boost * p.turbo.f1) / sr;
          if (this.tbPh > 1) this.tbPh -= 1;
          const b2 = this.boost * this.boost;
          x += (Math.sin(TAU * this.tbPh) * 0.04 + this.turbBP.run(noise) * 0.18) * p.turbo.amt * b2;
        }

        // compresseur volumétrique à lobes (sifflement proportionnel au régime)
        if (p.whine) {
          this.whPh += ((this.rpm / 60) * p.whine.ratio) / sr;
          if (this.whPh > 1) this.whPh -= 1;
          const w = Math.sin(TAU * this.whPh) + 0.45 * Math.sin(TAU * 2 * this.whPh) + 0.2 * Math.sin(TAU * 3 * this.whPh);
          x += w * p.whine.amt * (0.12 + 0.88 * this.thr) * Math.pow(clamp(rN, 0, 1), 1.3) * 0.12;
        }

        // démarreur : moteur électrique + pignon, chargé par les compressions
        if (starter > 0.01) {
          const fs = p.starter.f * (1 - 0.3 * cmp);
          this.stPh += fs / sr;
          if (this.stPh > 1) this.stPh -= 1;
          const saw = 2 * this.stPh - 1;
          const st = this.stBP1.run(saw + noise * 0.4) * 0.8 + this.stBP2.run(saw * 0.6 + noise * 0.3) * 0.35;
          x += st * starter * p.starter.amt * (0.6 + 0.4 * cmp) * 0.22;
        }

        // bruit mécanique (distribution), surtout audible à haut régime
        if (this.mechEnv > 1e-4) {
          x += this.mechHP.run(noise) * this.mechEnv * mech;
          this.mechEnv *= dMech;
        }

        const y = this.hp.run(x) * p.gain;
        if (R) {
          this.side = width ? this.lpS.run(this.hpS.run(Math.tanh(diff * drive) * norm)) * width * p.gain : 0;
          out[i] = y + this.side;
          R[i] = y - this.side;
        } else out[i] = y;
      }
    }

    renderEV(out, n, P) {
      const sr = this.sr;
      const p = this.p;
      for (let i = 0; i < n; i++) {
        this.rpm += (P.rpm - this.rpm) * this.kRpm;
        this.thr += (P.throttle - this.thr) * this.kThr;
        const m = Math.max(0, this.rpm);
        const nrm = m / 20000;
        const on = P.ignition;
        const f1 = 28 + m * 0.088;
        const f2 = f1 * 1.335;
        const f3 = 18 + m * 0.046;
        const ph = this.evPh;
        ph[0] += f1 / sr; ph[1] += f2 / sr; ph[2] += f3 / sr; ph[3] += (36 + nrm * 70) / sr; ph[4] += 2800 / sr;
        for (let k = 0; k < 5; k++) if (ph[k] > 1) ph[k] -= 1;
        const load = 0.15 + 0.85 * this.thr;
        const lvl = Math.min(1, nrm * 6) * load;
        let x = (Math.sin(TAU * ph[0]) * 0.5 + Math.sin(TAU * 2 * ph[0]) * 0.12 + Math.sin(TAU * ph[1]) * 0.28 + Math.sin(TAU * ph[2]) * 0.3) * lvl * 0.22;
        // poussée sourde (couple)
        x += Math.sin(TAU * ph[3]) * this.thr * Math.min(1, nrm * 8) * 0.16;
        // porteuse MLI audible à basse vitesse
        x += Math.sin(TAU * ph[4]) * on * (0.012 + 0.03 * this.thr) * Math.max(0, 1 - nrm * 3);
        // air / roulement
        const noise = Math.random() * 2 - 1;
        x += this.evNoise.run(noise) * Math.pow(nrm, 1.5) * 0.45;
        // contacteurs HT + carillon de mise sous tension
        if (this.contact > 1e-3) {
          x += this.evClick.run(noise * this.contact) * 0.9;
          this.contact *= Math.exp(-1 / (0.012 * sr));
        }
        if (this.wakeEnv > 1e-3) {
          this.wakePh += (240 + (1 - this.wakeEnv) * 520) / sr;
          if (this.wakePh > 1) this.wakePh -= 1;
          x += (Math.sin(TAU * this.wakePh) + 0.3 * Math.sin(TAU * 2 * this.wakePh)) * this.wakeEnv * (1 - this.wakeEnv) * 0.6;
          this.wakeEnv *= Math.exp(-1 / (0.55 * sr));
        }
        out[i] = this.hp.run(this.lp.run(x)) * p.gain;
      }
    }
  }

  globalThis.EngineDSP = EngineDSP;

  if (typeof registerProcessor === 'function') {
    class EngineProcessor extends AudioWorkletProcessor {
      static get parameterDescriptors() {
        return [
          { name: 'rpm', defaultValue: 0, minValue: 0, maxValue: 30000, automationRate: 'k-rate' },
          { name: 'throttle', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
          { name: 'ignition', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
          { name: 'starter', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
          { name: 'cut', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
          { name: 'flare', defaultValue: 0, minValue: 0, maxValue: 2, automationRate: 'k-rate' },
        ];
      }
      constructor() {
        super();
        this.dsp = new EngineDSP(sampleRate);
        this.P = { rpm: 0, throttle: 0, ignition: 0, starter: 0, cut: 0, flare: 0 };
        this.port.onmessage = (e) => this.dsp.message(e.data);
      }
      process(_in, outputs, params) {
        const out = outputs[0];
        const P = this.P;
        P.rpm = params.rpm[0];
        P.throttle = params.throttle[0];
        P.ignition = params.ignition[0];
        P.starter = params.starter[0];
        P.cut = params.cut[0];
        P.flare = params.flare[0];
        this.dsp.render(out[0], out[1], out[0].length, P);
        return true;
      }
    }
    registerProcessor('engine-dsp', EngineProcessor);
  }
})();
