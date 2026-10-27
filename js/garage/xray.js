// Vue technique « rayons X » de la baie moteur : schéma vectoriel animé
// (pistons calés sur l'ordre d'allumage réel, rotors du compresseur, rotor électrique).

const f = (n) => n.toFixed(1);

function firingAngles(sound) {
  const map = {};
  if (!sound || !sound.order) return map;
  const n = sound.order.length;
  sound.order.forEach((cyl, j) => { map[cyl] = (j * 720) / n + (sound.skew ? sound.skew[j] : 0); });
  return map;
}

function cylinderRow(out, cyls, angles, x0, x1, yTop, yBot, alpha) {
  const n = cyls.length;
  const pitch = (x1 - x0) / n;
  const cw = pitch * 0.72;
  const ch = yBot - yTop;
  const ph = ch * 0.3;
  const travel = ch * 0.42;
  const crankY = yBot + ch * 0.5;
  cyls.forEach((cyl, i) => {
    const cx = x0 + pitch * (i + 0.5);
    const xl = cx - cw / 2;
    out.parts.push(`<g opacity="${alpha}">
      <rect x="${f(xl)}" y="${f(yTop)}" width="${f(cw)}" height="${f(ch + ch * 0.12)}" rx="1.5" class="x-line"/>
      <rect class="x-piston" x="${f(xl + 1)}" y="${f(yTop + 1)}" width="${f(cw - 2)}" height="${f(ph)}" rx="1"/>
      <line class="x-rod" x1="${f(cx)}" y1="${f(yTop + ph)}" x2="${f(cx)}" y2="${f(crankY)}"/>
      <circle cx="${f(cx)}" cy="${f(crankY)}" r="${f(travel / 2 + 1.5)}" class="x-line x-faint"/>
    </g>`);
    out.pistons.push({ i: out.pistons.length, cx, top: yTop + 1, ph, travel, crankY, th: angles[cyl] || 0 });
  });
  return { crankY, ch };
}

function turbo(out, cx, cy, r, label) {
  out.parts.push(`<g class="x-turbo">
    <circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" class="x-line"/>
    <path class="x-line" d="M${f(cx)} ${f(cy - r * 0.2)}a${f(r * 0.2)} ${f(r * 0.2)} 0 1 1 ${f(r * 0.2)} ${f(r * 0.2)}a${f(r * 0.45)} ${f(r * 0.45)} 0 1 1 ${f(-r * 0.45)} ${f(-r * 0.25)}a${f(r * 0.7)} ${f(r * 0.7)} 0 1 1 ${f(r * 0.66)} ${f(r * 0.5)}"/>
    <g class="x-rotor" data-cx="${f(cx)}" data-cy="${f(cy)}" data-ratio="9"><path class="x-line x-faint" d="M${f(cx - r * 0.5)} ${f(cy)}H${f(cx + r * 0.5)}M${f(cx)} ${f(cy - r * 0.5)}V${f(cy + r * 0.5)}"/></g>
    ${label ? `<text x="${f(cx)}" y="${f(cy + r + 9)}" class="x-txt" text-anchor="middle">${label}</text>` : ''}
  </g>`);
}

function lobeRotor(cx, cy, r) {
  let d = '';
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 2;
    const x = cx + Math.cos(a) * r * 0.62;
    const y = cy + Math.sin(a) * r * 0.62;
    d += `M${f(cx)} ${f(cy)}L${f(x)} ${f(y)}`;
    d += `M${f(x + Math.cos(a) * r * 0.32)} ${f(y + Math.sin(a) * r * 0.32)}a${f(r * 0.32)} ${f(r * 0.32)} 0 1 0 0.01 0`;
  }
  return d;
}

export function xraySVG(car) {
  const { X, Y } = car._map;
  const b = car.geo.bay;
  const x = X(b.x);
  const y = Y(b.y + b.h);
  const w = b.w * car._map.k;
  const h = b.h * car._map.k;
  const out = { parts: [], pistons: [] };
  const angles = firingAngles(car.sound);
  const type = car.engine.type;
  const c = 9;

  // Cadre HUD (coins) + voile translucide léger : le châssis reste visible.
  out.parts.push(`<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="6" class="x-veil"/>
    <path class="x-corner" d="M${f(x)} ${f(y + c)}V${f(y)}H${f(x + c)}M${f(x + w - c)} ${f(y)}H${f(x + w)}V${f(y + c)}M${f(x + w)} ${f(y + h - c)}V${f(y + h)}H${f(x + w - c)}M${f(x + c)} ${f(y + h)}H${f(x)}V${f(y + h - c)}"/>
    <rect class="x-scan" x="${f(x)}" y="${f(y)}" width="${f(w)}" height="2"/>`);

  if (type === 'ev') {
    const mx = x + w * 0.42;
    const my = y + h * 0.56;
    const r = h * 0.3;
    out.parts.push(`<circle cx="${f(mx)}" cy="${f(my)}" r="${f(r)}" class="x-line"/>
      <circle cx="${f(mx)}" cy="${f(my)}" r="${f(r * 0.78)}" class="x-line x-faint" stroke-dasharray="2 2.5"/>
      <g class="x-rotor" data-cx="${f(mx)}" data-cy="${f(my)}" data-ratio="1">
        <circle cx="${f(mx)}" cy="${f(my)}" r="${f(r * 0.55)}" class="x-fill"/>
        <path class="x-line" d="M${f(mx - r * 0.55)} ${f(my)}H${f(mx + r * 0.55)}M${f(mx)} ${f(my - r * 0.55)}V${f(my + r * 0.55)}M${f(mx - r * 0.39)} ${f(my - r * 0.39)}L${f(mx + r * 0.39)} ${f(my + r * 0.39)}M${f(mx + r * 0.39)} ${f(my - r * 0.39)}L${f(mx - r * 0.39)} ${f(my + r * 0.39)}"/>
      </g>
      <rect x="${f(x + w * 0.66)}" y="${f(y + h * 0.18)}" width="${f(w * 0.24)}" height="${f(h * 0.3)}" rx="3" class="x-line"/>
      <path class="x-line x-faint" d="M${f(x + w * 0.69)} ${f(y + h * 0.28)}h${f(w * 0.18)}M${f(x + w * 0.69)} ${f(y + h * 0.38)}h${f(w * 0.18)}"/>
      <circle cx="${f(x + w * 0.75)}" cy="${f(y + h * 0.72)}" r="${f(h * 0.13)}" class="x-line"/>
      <circle cx="${f(x + w * 0.86)}" cy="${f(y + h * 0.68)}" r="${f(h * 0.08)}" class="x-line"/>
      <path class="x-hv" d="M${f(x + w * 0.66)} ${f(y + h * 0.4)}C${f(x + w * 0.5)} ${f(y + h * 0.3)} ${f(x + w * 0.2)} ${f(y + h * 0.4)} ${f(x + w * 0.06)} ${f(y + h * 0.9)}"/>
      <text x="${f(mx)}" y="${f(my + r + 10)}" class="x-txt" text-anchor="middle">MOTEUR AV · 20 000 tr/min</text>
      <text x="${f(x + w * 0.78)}" y="${f(y + h * 0.14)}" class="x-txt" text-anchor="middle">ONDULEUR SiC</text>`);
    return out;
  }

  const bx0 = x + w * 0.06;
  const bx1 = x + w * (type === 'i5' ? 0.66 : 0.7);
  const yTop = y + h * 0.3;
  const yBot = y + h * 0.56;

  if (type === 'i5') {
    out.parts.push(`<rect x="${f(bx0 - 3)}" y="${f(yTop - h * 0.16)}" width="${f(bx1 - bx0 + 6)}" height="${f(h * 0.12)}" rx="3" class="x-line"/>`);
    cylinderRow(out, [1, 2, 3, 4, 5], angles, bx0, bx1, yTop, yBot, 1);
    out.parts.push(`<path class="x-line x-faint" d="M${f(bx0)} ${f(y + h * 0.92)}H${f(bx1)}"/>`);
    turbo(out, x + w * 0.82, y + h * 0.44, h * 0.15, 'TURBO');
    out.parts.push(`<text x="${f((bx0 + bx1) / 2)}" y="${f(y + h * 0.1)}" class="x-txt" text-anchor="middle">1 · 2 · 4 · 5 · 3</text>`);
  } else if (type === 'v6d') {
    cylinderRow(out, [4, 5, 6], angles, bx0 + w * 0.04, bx1 + w * 0.04, yTop - h * 0.08, yBot - h * 0.08, 0.45);
    cylinderRow(out, [1, 2, 3], angles, bx0, bx1, yTop, yBot, 1);
    turbo(out, x + w * 0.83, y + h * 0.3, h * 0.11, '');
    turbo(out, x + w * 0.83, y + h * 0.66, h * 0.11, 'BITURBO');
    for (let i = 0; i < 3; i++) {
      const cx = bx0 + ((bx1 - bx0) / 3) * (i + 0.5);
      out.parts.push(`<path class="x-inj" d="M${f(cx)} ${f(yTop - h * 0.2)}V${f(yTop - 1)}"/>`);
    }
  } else {
    // V8 : banc avant (impairs) + banc arrière (pairs) décalé
    cylinderRow(out, [2, 4, 6, 8], angles, bx0 + w * 0.04, bx1 + w * 0.04, yTop - h * 0.08, yBot - h * 0.08, 0.45);
    cylinderRow(out, [1, 3, 5, 7], angles, bx0, bx1, yTop, yBot, 1);
    if (type === 'v8sc') {
      const sx = bx0 + (bx1 - bx0) * 0.18;
      const sw = (bx1 - bx0) * 0.64;
      const sy = y + h * 0.02;
      const sh = h * 0.2;
      out.parts.push(`<rect x="${f(sx)}" y="${f(sy)}" width="${f(sw)}" height="${f(sh)}" rx="5" class="x-line"/>
        <g class="x-rotor" data-cx="${f(sx + sw * 0.36)}" data-cy="${f(sy + sh / 2)}" data-ratio="2.4"><path class="x-line" d="${lobeRotor(sx + sw * 0.36, sy + sh / 2, sh * 0.42)}"/></g>
        <g class="x-rotor" data-cx="${f(sx + sw * 0.64)}" data-cy="${f(sy + sh / 2)}" data-ratio="-2.4"><path class="x-line" d="${lobeRotor(sx + sw * 0.64, sy + sh / 2, sh * 0.42)}"/></g>
        <text x="${f(sx + sw + 6)}" y="${f(sy + sh * 0.7)}" class="x-txt">EATON TVS</text>`);
    } else {
      out.parts.push(`<path class="x-line" d="M${f(bx0 + 6)} ${f(yTop - h * 0.12)}C${f(bx0 + 30)} ${f(y + h * 0.02)} ${f(bx1 - 30)} ${f(y + h * 0.02)} ${f(bx1 - 6)} ${f(yTop - h * 0.12)}"/>
        <circle cx="${f(bx1 + w * 0.1)}" cy="${f(y + h * 0.18)}" r="${f(h * 0.09)}" class="x-line"/>
        <text x="${f(bx1 + w * 0.1)}" y="${f(y + h * 0.36)}" class="x-txt" text-anchor="middle">PAPILLON Ø90</text>`);
    }
  }
  return out;
}
