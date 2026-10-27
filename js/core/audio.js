// Contexte Web Audio unique partagé par le Garage et l'Armurerie.
// Doit être créé dans un geste utilisateur (exigence iOS).

let ctx = null;
let tag = null;

// Un WAV silencieux joué en boucle bascule la session audio iOS en « lecture » :
// le son sort même quand le bouton silencieux de l'iPhone est activé.
function silentWav() {
  const n = 800;
  const b = new Uint8Array(44 + n);
  const v = new DataView(b.buffer);
  const s = (o, t) => [...t].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  s(0, 'RIFF'); v.setUint32(4, 36 + n, true); s(8, 'WAVEfmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true);
  s(36, 'data'); v.setUint32(40, n, true); b.fill(128, 44);
  let str = '';
  b.forEach((x) => { str += String.fromCharCode(x); });
  return 'data:audio/wav;base64,' + btoa(str);
}

export function audioCtx() {
  return ctx;
}

export function unlockAudio() {
  if (ctx) {
    if (ctx.state !== 'running') ctx.resume();
    return ctx;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch { /* Safari < 17 */ }
  try {
    tag = new Audio(silentWav());
    tag.loop = true;
    tag.setAttribute('playsinline', '');
    const p = tag.play();
    if (p && p.catch) p.catch(() => {});
  } catch { /* sans incidence */ }
  ctx = new AC({ latencyHint: 'interactive' });
  ctx.resume();
  return ctx;
}

export function suspendAudio() {
  if (ctx && ctx.state === 'running') ctx.suspend();
}

export function resumeAudio() {
  if (ctx && ctx.state !== 'running') ctx.resume();
}
