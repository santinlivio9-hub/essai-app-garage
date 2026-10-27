// Générateurs de formes en millimètres (y vers le haut).
const n = (v) => +v.toFixed(2);

export function rect(x0, y0, x1, y1, r = 0) {
  if (!r) return `M ${n(x0)} ${n(y0)} L ${n(x1)} ${n(y0)} L ${n(x1)} ${n(y1)} L ${n(x0)} ${n(y1)} Z`;
  return `M ${n(x0 + r)} ${n(y0)} L ${n(x1 - r)} ${n(y0)} Q ${n(x1)} ${n(y0)} ${n(x1)} ${n(y0 + r)} L ${n(x1)} ${n(y1 - r)} Q ${n(x1)} ${n(y1)} ${n(x1 - r)} ${n(y1)} L ${n(x0 + r)} ${n(y1)} Q ${n(x0)} ${n(y1)} ${n(x0)} ${n(y1 - r)} L ${n(x0)} ${n(y0 + r)} Q ${n(x0)} ${n(y0)} ${n(x0 + r)} ${n(y0)} Z`;
}

// Rail Picatinny vu de profil (pas MIL-STD-1913 : 10,01 mm). dir = 1 dents vers le haut, -1 vers le bas.
export function picatinny(x0, x1, y, dir = 1, h = 9) {
  const base = y - dir * h;
  const top = y;
  const mid = y - dir * 3.2;
  let d = `M ${n(x0)} ${n(base)} L ${n(x0)} ${n(mid)}`;
  for (let x = x0; x < x1 - 0.5; x += 10.01) {
    const a = Math.min(x + 1, x1);
    const b = Math.min(x + 5.2, x1);
    d += ` L ${n(a)} ${n(mid)} L ${n(a + 0.6)} ${n(top)} L ${n(b - 0.6)} ${n(top)} L ${n(b)} ${n(mid)}`;
  }
  return `${d} L ${n(x1)} ${n(mid)} L ${n(x1)} ${n(base)} Z`;
}

// Fentes M-LOK (oblongues) le long d'une ligne.
export function mlok(x0, x1, yc, w = 32, h = 7) {
  let d = '';
  for (let x = x0; x + w <= x1; x += w + 8) d += rect(x, yc - h / 2, x + w, yc + h / 2, h / 2) + ' ';
  return d;
}

// Stries verticales (traits).
export function serrations(x0, x1, y0, y1, step = 3.2, slant = 0) {
  let d = '';
  for (let x = x0; x <= x1; x += step) d += `M ${n(x)} ${n(y0)} L ${n(x + slant)} ${n(y1)} `;
  return d;
}

// Traits horizontaux.
export function ribs(x0, x1, y0, y1, step = 4) {
  let d = '';
  for (let y = y0; y <= y1; y += step) d += `M ${n(x0)} ${n(y)} L ${n(x1)} ${n(y)} `;
  return d;
}

export function circle(cx, cy, r) {
  return `M ${n(cx - r)} ${n(cy)} A ${n(r)} ${n(r)} 0 1 0 ${n(cx + r)} ${n(cy)} A ${n(r)} ${n(r)} 0 1 0 ${n(cx - r)} ${n(cy)} Z`;
}
