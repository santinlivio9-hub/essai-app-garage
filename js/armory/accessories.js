// Accessoires : catalogue (libellés, masses, allongement) + dessins en millimètres
// dans le repère local du point d'ancrage (y vers le haut).
import { rect, circle, ribs, serrations } from './shapes.js';

export const CATALOG = {
  optic: {
    none: { name: 'Organes d’origine' },
    rds: { name: 'Red dot RMR / 407C', mass: 45 },
    holo: { name: 'EOTech EXPS3', mass: 317 },
  },
  laser: {
    none: { name: 'Aucun' },
    peq: { name: 'PEQ-15 / NGAL', mass: 216 },
  },
  light: {
    none: { name: 'Aucune' },
    pistol: { name: 'SureFire X300 Ultra', mass: 130 },
    rifle: { name: 'SureFire Scout M600', mass: 160 },
  },
  muzzle: {
    none: { name: 'Bouche d’origine' },
    comp: { name: 'Compensateur ajouré', mass: 70, len: 46 },
    sup: { name: 'Silencieux détachable', mass: 380 },
    sd: { name: 'Modérateur intégral SD', mass: 520 },
    'comp-int': { name: 'Compensateur intégré', mass: 0 },
  },
  grip: {
    none: { name: 'Aucune' },
    stubby: { name: 'Poignée courte (stubby)', mass: 55 },
    angled: { name: 'Poignée inclinée (AFG)', mass: 60 },
    handstop: { name: 'Butée de main', mass: 25 },
  },
  stock: {
    collapsed: { name: 'Rétractée' },
    extended: { name: 'Déployée' },
  },
  mag: {
    std: { name: 'Standard' },
    ext: { name: 'Étendu + talon alu', mass: 45 },
  },
};

const P = (k, d) => `<path class="m-${k}" d="${d}"/>`;
const S = (k, d) => `<path class="m-${k}" d="${d}"/><path class="m-shade" d="${d}"/>`;

export function rdsSVG(onRail) {
  const y = onRail ? 30 : 0;
  let s = '';
  if (onRail) {
    s += S('optic', rect(-4, 0, 50, 30, 2)) + P('line', 'M -2 14 L 48 14') + S('steel', circle(22, 9, 4));
  }
  s += S('optic', `M 0 ${y} L 46 ${y} L 46 ${y + 7} C 46 ${y + 18} 40 ${y + 26} 30 ${y + 26} L 14 ${y + 26} C 6 ${y + 26} 1 ${y + 20} 0 ${y + 12} Z`);
  s += P('glass', `M 33 ${y + 9} L 41 ${y + 9} L 39 ${y + 23} L 31 ${y + 24} Z`);
  s += S('optic', rect(18, y + 25, 26, y + 29, 1));
  s += P('hl', `M 2 ${y + 13} C 4 ${y + 20} 8 ${y + 25} 14 ${y + 25.5}`);
  s += `<circle class="led" cx="36" cy="${y + 16}" r="1.3"/>`;
  return s;
}

export function holoSVG() {
  return S('optic', rect(0, 0, 98, 26, 2))
    + S('black', rect(56, 4, 86, 12, 2))
    + S('optic', 'M 20 26 L 98 26 L 98 64 C 98 70 94 72 88 72 L 30 72 C 24 72 20 70 20 64 Z')
    + P('line', rect(28, 32, 92, 66, 3))
    + S('steel', rect(4, 26, 18, 31, 1.5))
    + P('glass', rect(96, 30, 99, 68, 1))
    + P('hl', 'M 22 70 L 96 70');
}

export function magnifierSVG() {
  return S('optic', rect(0, 0, 64, 20, 2)) + S('steel', circle(52, 10, 4))
    + `<g class="flip">`
    + S('optic', rect(10, 18, 40, 36, 2))
    + S('optic', rect(-14, 35, 84, 65, 5))
    + S('rubber', 'M -26 31 L -14 35 L -14 65 L -26 69 Z')
    + S('optic', rect(84, 37, 92, 63, 2))
    + P('line', serrations(-8, 6, 36, 64, 2.4))
    + P('glass', rect(91, 39, 93, 61, 1))
    + `</g>`;
}

export function peqSVG(side) {
  const t = side ? 'translate(0 -29)' : '';
  return `<g transform="${t}">`
    + S('optic', rect(6, 0, 98, 8, 1))
    + S('tan', 'M 0 8 L 104 8 L 108 13 L 108 46 C 108 48 106 50 104 50 L 4 50 C 2 50 0 48 0 46 Z')
    + P('line', 'M 4 30 L 96 30 M 70 8 L 70 50')
    + P('glass', circle(102, 22, 3.6) + circle(102, 37, 4.2))
    + S('steel', rect(16, 50, 30, 54, 1)) + S('black', circle(80, 46, 5))
    + `</g>`;
}

export const PEQ_EMIT = { vis: [108, 22], ir: [108, 37], sideDy: -29 };

export function pistolLightSVG() {
  return S('optic', rect(6, -6, 58, 0, 1))
    + S('optic', 'M 0 -6 L 62 -6 L 62 -34 L 0 -34 C -4 -34 -6 -30 -6 -26 L -6 -14 C -6 -10 -4 -6 0 -6 Z')
    + S('optic', rect(62, -38, 88, -2, 3))
    + P('line', serrations(66, 84, -36, -4, 3.5))
    + P('glass', rect(88, -35, 91, -5, 1))
    + S('steel', 'M -6 -16 L -14 -20 L -14 -28 L -6 -28 Z');
}

export const PISTOL_LIGHT_EMIT = [91, -20];

export function rifleLightSVG(under) {
  const t = under ? 'translate(0 -24)' : '';
  return `<g transform="${t}">`
    + (under ? S('optic', rect(30, 12, 74, 24, 2)) : '')
    + S('rubber', rect(-14, -10, 0, 10, 3))
    + S('optic', rect(0, -12, 100, 12, 3))
    + P('line', serrations(8, 40, -11, 11, 2.5))
    + S('optic', rect(100, -16, 136, 16, 4))
    + P('glass', rect(136, -13, 139, 13, 1))
    + `</g>`;
}

export const RIFLE_LIGHT_EMIT = [139, 0];

export function compSVG(r) {
  const R = r + 1.5;
  return S('steel', rect(0, -R, 46, R, 2))
    + P('dark', rect(9, R - 5, 15, R + 0.2, 1) + rect(20, R - 5, 26, R + 0.2, 1) + rect(31, R - 5, 37, R + 0.2, 1))
    + P('dark', rect(24, -R * 0.45, 40, R * 0.45, 2))
    + P('hl', `M 1 ${R - 0.8} L 45 ${R - 0.8}`);
}

export function supSVG(R, L) {
  return S('steel', rect(-7, -R * 0.72, 0, R * 0.72, 1.5))
    + S('optic', rect(0, -R, L, R, R * 0.28))
    + P('line', `M ${L * 0.12} ${-R} L ${L * 0.12} ${R} M ${L * 0.86} ${-R} L ${L * 0.86} ${R}`)
    + P('hl', `M 4 ${R - 1.2} L ${L - 4} ${R - 1.2}`)
    + P('dark', rect(L - 1, -3, L + 0.4, 3));
}

export function sdSVG(x0, x1, yc, r) {
  return S('optic', rect(x0, yc - r, x1, yc + r, 6))
    + P('line', ribs(x0 + 8, x1 - 8, yc - r + 8, yc + r - 8, 9))
    + S('optic', `M ${x1 - 70} ${yc + r} L ${x1 - 66} ${yc + r + 22} C ${x1 - 64} ${yc + r + 28} ${x1 - 58} ${yc + r + 30} ${x1 - 50} ${yc + r + 30} L ${x1 - 40} ${yc + r + 30} C ${x1 - 34} ${yc + r + 30} ${x1 - 30} ${yc + r + 26} ${x1 - 30} ${yc + r + 20} L ${x1 - 30} ${yc + r} Z`)
    + P('dark', circle(x1 - 48, yc + r + 18, 5))
    + P('dark', rect(x1 - 1, yc - 4, x1 + 0.4, yc + 4));
}

export function gripSVG(kind) {
  if (kind === 'stubby') {
    return S('optic', rect(-4, -8, 44, 0, 1))
      + S('poly', 'M 4 -8 L 40 -8 L 37 -50 C 37 -54 34 -56 30 -56 L 14 -56 C 10 -56 7 -54 7 -50 Z')
      + P('line', ribs(9, 36, -48, -14, 5));
  }
  if (kind === 'angled') {
    return S('poly', 'M 0 0 L 84 0 L 84 -7 C 66 -10 46 -20 26 -32 C 16 -38 6 -36 2 -28 Z')
      + P('line', 'M 10 -24 L 70 -6 M 8 -16 L 74 -3');
  }
  return S('poly', 'M 0 0 L 28 0 L 24 -17 C 22 -21 17 -21 15 -17 Z');
}

// Douilles éjectées (dimensions réelles).
export function casingSVG(kind) {
  if (kind === 'shotgun') return S('pad', rect(-10, -35, 10, 35, 2)) + `<path class="m-brass" d="${rect(-10.5, -35, 10.5, -22, 1)}"/>`;
  if (kind === 'rifle') return `<path class="m-brass" d="M -4.8 -22 L 4.8 -22 L 4.8 10 L 3 14 L 3 22 L -3 22 L -3 14 L -4.8 10 Z"/>`;
  return `<path class="m-brass" d="${rect(-5, -9.5, 5, 9.5, 1)}"/>`;
}
