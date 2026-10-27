// Banc d'essai hors-ligne des détonations : node tools/gun-audio-test.mjs [dossier_wav]
import { writeFileSync } from 'fs';
import { WEAPONS } from '../js/armory/weapons/index.js';
import { synthShot } from '../js/armory/gun-audio.js';
const SR = 48000;
const out = process.argv[2];
function stats(a) {
  let pk = 0; let e = 0; let hf = 0; let prev = 0; let t90 = 0; let tot = 0;
  for (const v of a) { pk = Math.max(pk, Math.abs(v)); e += v * v; hf += (v - prev) ** 2; prev = v; }
  for (let i = 0; i < a.length; i++) { tot += a[i] * a[i]; if (tot < e * 0.9) t90 = i; }
  return `peak ${pk.toFixed(2)}  rms ${Math.sqrt(e / a.length).toFixed(3)}  brillance ${(hf / e).toFixed(3)}  t90 ${(t90 / SR * 1000).toFixed(0)} ms`;
}
function wav(d) {
  const b = Buffer.alloc(44 + d.length * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + d.length * 2, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(d.length * 2, 40);
  d.forEach((v, i) => b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), 44 + i * 2));
  return b;
}
for (const w of WEAPONS) {
  for (const muzzle of w.slots.muzzle) {
    const sup = muzzle === 'sup' || muzzle === 'sd';
    const a = synthShot(SR, w.sound, { suppressed: sup, comp: muzzle.startsWith('comp'), subsonic: muzzle === 'sd' });
    console.log(`${w.id.padEnd(8)} ${muzzle.padEnd(8)} ${stats(a)}`);
    if (out) writeFileSync(`${out}/${w.id}-${muzzle}.wav`, wav(a));
  }
}
