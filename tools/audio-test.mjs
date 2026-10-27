// Banc d'essai hors-ligne du synthétiseur : node tools/audio-test.mjs [dossier_wav]
import { createRequire } from 'module';
import { writeFileSync } from 'fs';
import { CARS } from '../js/cars/index.js';
import { EngineSim } from '../js/audio/engine-sim.js';
import { dspProfile } from '../js/audio/engine-audio.js';
const require = createRequire(import.meta.url);
require('../js/audio/engine-dsp.js');
const SR = 48000, FPS = 60, STEP = SR / FPS;
const outDir = process.argv[2];

function wav(data) {
  const b = Buffer.alloc(44 + data.length * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + data.length * 2, 4); b.write('WAVEfmt ', 8);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(SR, 24);
  b.writeUInt32LE(SR * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(data.length * 2, 40);
  for (let i = 0; i < data.length; i++) b.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(data[i] * 32767))), 44 + i * 2);
  return b;
}
function stats(a) { let pk = 0, s = 0; for (const v of a) { pk = Math.max(pk, Math.abs(v)); s += v * v; } return { pk: pk.toFixed(2), rms: Math.sqrt(s / a.length).toFixed(3) }; }
function domFreq(a, lo = 20, hi = 400) { // autocorrélation
  let best = 0, bl = 0;
  for (let lag = Math.floor(SR / hi); lag < SR / lo; lag++) { let s = 0; for (let i = 0; i < 8000; i++) s += a[i] * a[i + lag]; if (s > best) { best = s; bl = lag; } }
  return (SR / bl).toFixed(1);
}
for (const car of CARS) {
  const sim = new EngineSim(car); const dsp = new globalThis.EngineDSP(SR);
  dsp.setProfile(dspProfile(car));
  const total = 11 * FPS; const buf = new Float32Array(total * STEP); const P = {};
  const marks = {}; let maxRpm = 0;
  for (let f = 0; f < total; f++) {
    const t = f / FPS;
    if (f === 6) sim.start();
    if (t >= 3 && t < 3 + 1 / FPS) sim.press(true);
    if (t >= 4.2 && t < 4.2 + 1 / FPS) sim.press(false);
    if (t >= 6 && t < 6 + 1 / FPS) sim.press(true);
    if (t >= 6.05 && t < 6.05 + 1 / FPS) sim.press(false);
    if (t >= 7 && t < 7 + 1 / FPS) sim.press(true);
    if (t >= 9 && t < 9 + 1 / FPS) sim.press(false);
    if (t >= 9.8 && t < 9.8 + 1 / FPS) sim.stop();
    const o = sim.update(1 / FPS);
    if (o.events) for (const ev of o.events) dsp.message(ev);
    for (const p of o.pops) dsp.message({ type: 'pop', amt: p });
    Object.assign(P, o);
    maxRpm = Math.max(maxRpm, o.rpm);
    const seg = buf.subarray(f * STEP, (f + 1) * STEP);
    dsp.render(seg, null, STEP, P);
    if (Math.abs(t - 2.5) < 1e-6) marks.idleRpm = o.rpm.toFixed(0);
  }
  const sl = (a, b) => buf.subarray(a * SR, b * SR);
  let nan = buf.some((v) => !Number.isFinite(v));
  console.log(car.id.padEnd(9), 'crank', stats(sl(0.1, 0.9)), 'idle', stats(sl(1.5, 3)), 'rev', stats(sl(3.3, 4.2)), 'limiter', stats(sl(8, 9)), 'off', stats(sl(10.6, 11)),
    'idleRpm', marks.idleRpm, 'max', maxRpm.toFixed(0), 'f_idle', domFreq(sl(1.6, 2.2)), nan ? 'NaN!' : '');
  if (outDir) writeFileSync(`${outDir}/${car.id}.wav`, wav(buf));
}
