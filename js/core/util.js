// Utilitaires partagés.
export const $ = (s, r = document) => r.querySelector(s);
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const fx = (n) => (+n).toFixed(1);

export function load(key) {
  try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; }
}

export function save(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* navigation privée */ }
}

export function tween(dur, ease, step, done) {
  const t0 = performance.now();
  let raf = 0;
  const f = (now) => {
    const k = Math.min(1, (now - t0) / dur);
    step(ease(k));
    if (k < 1) raf = requestAnimationFrame(f);
    else if (done) done();
  };
  raf = requestAnimationFrame(f);
  return () => cancelAnimationFrame(raf);
}

export const ease = {
  in3: (k) => k * k * k,
  out3: (k) => 1 - Math.pow(1 - k, 3),
  inOut3: (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
};

// Remplace les paires de coordonnées (mm, y vers le haut) d'un tracé SVG par des unités écran.
export function mapPath(d, X, Y) {
  return d.replace(/(-?\d+(?:\.\d+)?)[\s,]+(-?\d+(?:\.\d+)?)/g, (_, a, b) => `${fx(X(+a))} ${fx(Y(+b))}`);
}

// Carte des menus de personnalisation : un visuel (vignette 3D, aperçu, icône) au-dessus du libellé.
export function card(attrs, label, visual, pressed, cls = '') {
  return `<button class="opt${cls ? ` ${cls}` : ''}" type="button" ${attrs} aria-pressed="${!!pressed}"><span class="opt-v">${visual}</span><span class="opt-l">${esc(label)}</span></button>`;
}

// Vignette 3D pré-rendue (tools/thumbs.cjs → assets/thumbs/).
export const thumb = (name) => `<img src="assets/thumbs/${name}.webp" alt="" decoding="async" draggable="false">`;
