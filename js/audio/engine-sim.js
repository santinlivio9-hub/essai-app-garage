// Simulation mécanique (thread principal) : démarreur, allumage, inertie, rupteur,
// retours de flamme. Pilote à la fois l'aiguille du compte-tours et le synthétiseur.

export class EngineSim {
  constructor(car) {
    this.e = car.engine;
    this.isEV = this.e.type === 'ev';
    this.state = 'off';
    this.rpm = 0;
    this.thr = 0;
    this.input = 0;
    this.t = 0;
    this.clock = 0;
    this.cutT = 0;
    this.popT = 0;
    this.idleTarget = this.e.idle;
    this.crank = 0;
    this.pressAt = 0;
    this.holdUntil = 0;
    this.lastHighThr = -10;
    this.events = [];
  }

  get running() { return this.state === 'run' || this.state === 'catch'; }
  get busy() { return this.state === 'crank' || this.state === 'catch'; }

  start() {
    if (this.state !== 'off' && this.state !== 'stopping') return;
    this.t = 0;
    if (this.isEV) {
      this.state = 'run';
      this.events.push({ type: 'click' }, { type: 'wake' });
      setTimeout(() => this.events.push({ type: 'click' }), 260);
    } else {
      this.state = 'crank';
    }
  }

  stop() {
    if (this.state === 'off') return;
    this.state = 'stopping';
    this.input = 0;
    if (this.isEV) this.events.push({ type: 'click' });
  }

  press(on) {
    const now = this.clock;
    if (on) {
      this.input = 1;
      this.pressAt = now;
    } else {
      // un tapotement bref devient un vrai coup de gaz d'au moins 160 ms
      this.holdUntil = Math.max(this.holdUntil, this.pressAt + 0.16);
      this.input = 0;
    }
  }

  update(dt) {
    const e = this.e;
    dt = Math.min(dt, 0.05);
    this.clock += dt;
    this.t += dt;
    const out = { rpm: 0, throttle: 0, ignition: 0, starter: 0, cut: 0, flare: 0, pops: [] };
    const want = this.input || this.clock < this.holdUntil ? 1 : 0;
    const canRev = this.state === 'run';
    const tIn = canRev ? want : 0;
    this.thr += (tIn - this.thr) * Math.min(1, (tIn > this.thr ? 11 : 15) * dt);
    if (this.thr > 0.45) this.lastHighThr = this.clock;

    switch (this.state) {
      case 'off':
        this.rpm = 0;
        break;

      case 'crank': {
        const T = e.crankTime;
        this.rpm += (e.crankRpm - this.rpm) * Math.min(1, 14 * dt);
        out.starter = 1;
        out.ignition = this.t > T * 0.62 ? 1 : 0;
        if (out.ignition) out.flare = 0.6;
        if (this.t >= T) {
          this.state = 'catch';
          this.t = 0;
          this.idleTarget = e.flare;
        }
        break;
      }

      case 'catch':
        out.ignition = 1;
        out.flare = 0.3;
        this.rpm += (e.flare - this.rpm) * Math.min(1, 7 * dt);
        if (this.rpm > e.flare * 0.95 || this.t > 0.6) {
          this.state = 'run';
          this.t = 0;
        }
        break;

      case 'run': {
        out.ignition = 1;
        // ralenti accéléré à froid qui redescend progressivement
        this.idleTarget = e.idle + (this.idleTarget - e.idle) * Math.exp(-dt / 0.85);
        if (this.thr > 0.02) {
          const k = 1 - 0.38 * Math.pow(this.rpm / e.limiter, 2);
          this.rpm += e.revUp * this.thr * k * dt;
        } else {
          this.rpm -= e.revDown * (0.3 + (0.7 * this.rpm) / e.redline) * dt;
        }
        if (this.rpm < this.idleTarget) this.rpm += (this.idleTarget - this.rpm) * Math.min(1, 9 * dt);
        // rupteur
        if (this.cutT > 0) {
          this.cutT -= dt;
          out.cut = 1;
        }
        if (this.rpm >= e.limiter) {
          if (this.isEV) {
            this.rpm = e.limiter;
          } else {
            this.rpm = e.limiter - 80 - Math.random() * 110;
            this.cutT = 0.016 + Math.random() * 0.014;
            out.cut = 1;
            if (e.pops && Math.random() < e.pops * 0.6) out.pops.push(0.25 + Math.random() * 0.35);
          }
        }
        // retours de flamme au lever de pied
        if (e.pops && this.thr < 0.08 && this.rpm > 3200 && this.clock - this.lastHighThr < 0.12) {
          this.popT = 0.45 + Math.random() * 0.5;
        }
        if (this.popT > 0) {
          this.popT -= dt;
          const chance = e.pops * 16 * dt * Math.min(1, this.rpm / e.redline + 0.2);
          if (Math.random() < chance) out.pops.push(0.25 + Math.random() * 0.75);
        }
        break;
      }

      case 'stopping':
        out.ignition = 0;
        this.rpm -= Math.max(this.isEV ? e.revDown : e.revDown * 0.38, this.rpm * 2.2) * dt;
        if (this.rpm <= 25) {
          this.rpm = 0;
          this.state = 'off';
        }
        break;

      default:
        break;
    }

    this.rpm = Math.max(0, this.rpm);
    let shown = this.rpm;
    if (this.state === 'run' && !this.isEV) {
      // ralenti « qui cherche » (arbre à cames, hachage)
      const near = Math.max(0, 1 - (this.rpm - e.idle) / 900);
      shown += near * e.lope * (Math.sin(this.clock * 8.7) * 0.6 + Math.sin(this.clock * 3.1) * 0.4);
    }
    this.crank = (this.crank + (shown / 60) * 360 * dt) % 72000;
    out.rpm = shown;
    out.throttle = this.thr;
    if (this.events.length) {
      out.events = this.events;
      this.events = [];
    }
    return out;
  }
}
