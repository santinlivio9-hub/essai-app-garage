// Génération procédurale des roues (pneu, disque, étrier, jante) en SVG.
// Les couleurs de jante passent par les variables CSS --rim, --rim-hi, --rim-lo, --caliper.

const f = (n) => n.toFixed(2);
const pol = (cx, cy, a, r) => [cx + r * Math.sin(a), cy - r * Math.cos(a)];
const DEG = Math.PI / 180;

function polygon(pts) {
  return 'M' + pts.map((p) => `${f(p[0])} ${f(p[1])}`).join('L') + 'Z';
}

// Branche effilée entre les rayons r0 et r1, demi-largeurs w0 / w1 (px).
function taper(cx, cy, a, r0, r1, w0, w1, bend = 0) {
  const steps = bend ? 6 : 1;
  const left = [];
  const right = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const r = r0 + (r1 - r0) * t;
    const w = w0 + (w1 - w0) * t;
    const th = a + bend * Math.pow(t, 1.35);
    left.push(pol(cx, cy, th - w / r, r));
    right.push(pol(cx, cy, th + w / r, r));
  }
  return polygon(left.concat(right.reverse()));
}

const STYLES = {
  // Audi RS : 5 doubles branches
  rs(cx, cy, r) {
    const d = [];
    for (let i = 0; i < 5; i++) {
      const a = i * 72 * DEG;
      d.push(taper(cx, cy, a - 7.5 * DEG, r * 0.26, r * 0.93, r * 0.07, r * 0.05));
      d.push(taper(cx, cy, a + 7.5 * DEG, r * 0.26, r * 0.93, r * 0.07, r * 0.05));
    }
    return { d: d.join(''), hub: 0.3 };
  },
  // Track : 7 doubles bâtons fins
  track(cx, cy, r) {
    const d = [];
    for (let i = 0; i < 7; i++) {
      const a = (i * 360) / 7 * DEG;
      d.push(taper(cx, cy, a - 5 * DEG, r * 0.25, r * 0.94, r * 0.045, r * 0.032));
      d.push(taper(cx, cy, a + 5 * DEG, r * 0.25, r * 0.94, r * 0.045, r * 0.032));
    }
    return { d: d.join(''), hub: 0.28 };
  },
  // Forgée 10 branches droites
  forged(cx, cy, r) {
    const d = [];
    for (let i = 0; i < 10; i++) {
      d.push(taper(cx, cy, i * 36 * DEG, r * 0.25, r * 0.94, r * 0.065, r * 0.042));
    }
    return { d: d.join(''), hub: 0.28 };
  },
  // Classique : 6 branches en Y
  classic(cx, cy, r) {
    const d = [];
    for (let i = 0; i < 6; i++) {
      const a = i * 60 * DEG;
      d.push(taper(cx, cy, a, r * 0.24, r * 0.58, r * 0.08, r * 0.06));
      d.push(taper(cx, cy, a - 3 * DEG, r * 0.55, r * 0.94, r * 0.05, r * 0.04, -9 * DEG));
      d.push(taper(cx, cy, a + 3 * DEG, r * 0.55, r * 0.94, r * 0.05, r * 0.04, 9 * DEG));
    }
    return { d: d.join(''), hub: 0.28 };
  },
  // Tesla Arachnid : turbine à pales incurvées
  arachnid(cx, cy, r) {
    const d = [];
    for (let i = 0; i < 10; i++) {
      d.push(taper(cx, cy, i * 36 * DEG, r * 0.3, r * 0.95, r * 0.075, r * 0.05, 26 * DEG));
    }
    return { d: d.join(''), hub: 0.34 };
  },
};

export function spokesPath(style, cx, cy, r) {
  return (STYLES[style] || STYLES.rs)(cx, cy, r);
}

function caliperPath(cx, cy, r) {
  // Étrier sur l'arrière haut du disque (la voiture regarde vers la gauche).
  const a0 = 18 * DEG;
  const a1 = 74 * DEG;
  const ri = r * 0.56;
  const ro = r * 0.86;
  const p0 = pol(cx, cy, a0, ro);
  const p1 = pol(cx, cy, a1, ro);
  const p2 = pol(cx, cy, a1, ri);
  const p3 = pol(cx, cy, a0, ri);
  return `M${f(p0[0])} ${f(p0[1])}A${f(ro)} ${f(ro)} 0 0 1 ${f(p1[0])} ${f(p1[1])}` +
    `L${f(p2[0])} ${f(p2[1])}A${f(ri)} ${f(ri)} 0 0 0 ${f(p3[0])} ${f(p3[1])}Z`;
}

// Roue complète. Les groupes .rot tournent (jante + disque), l'étrier reste fixe.
export function wheelSVG(i, cx, cy, R, r, style) {
  const s = spokesPath(style, cx, cy, r);
  const nuts = [];
  for (let k = 0; k < 5; k++) {
    const p = pol(cx, cy, (k * 72 + 36) * DEG, r * s.hub * 0.62);
    nuts.push(`<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${f(r * 0.028)}"/>`);
  }
  return `<g class="wheel" data-i="${i}">
    <circle cx="${f(cx)}" cy="${f(cy)}" r="${f(R)}" fill="url(#g-tire)"/>
    <circle cx="${f(cx)}" cy="${f(cy)}" r="${f(R * 0.985)}" fill="none" stroke="#000" stroke-opacity=".6" stroke-width="1.4"/>
    <path d="M${f(cx - R * 0.86)} ${f(cy - R * 0.36)}A${f(R * 0.93)} ${f(R * 0.93)} 0 0 1 ${f(cx + R * 0.6)} ${f(cy - R * 0.7)}" fill="none" stroke="#fff" stroke-opacity=".07" stroke-width="${f(R * 0.06)}" stroke-linecap="round"/>
    <circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="#060607"/>
    <g class="rot">
      <circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 0.84)}" fill="url(#g-disc)"/>
      <circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 0.66)}" fill="none" stroke="#2c2e31" stroke-width="${f(r * 0.1)}" stroke-dasharray="${f(r * 0.03)} ${f(r * 0.09)}"/>
      <circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 0.4)}" fill="#26282b"/>
    </g>
    <path class="caliper" d="${caliperPath(cx, cy, r)}"/>
    <path d="${caliperPath(cx, cy, r)}" fill="url(#g-caliper-shade)"/>
    <g class="rot">
      <path class="spokes" d="${s.d}"/>
      <circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * s.hub)}" class="hub"/>
      <g class="nuts">${nuts.join('')}</g>
      <circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * s.hub * 0.38)}" class="cap"/>
    </g>
    <circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 0.965)}" fill="none" class="lip" stroke-width="${f(r * 0.07)}"/>
    <circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 0.925)}" fill="none" class="lip-in" stroke-width="${f(r * 0.02)}"/>
    <circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="url(#g-rimshade)"/>
  </g>`;
}

// Icône de jante pour l'interface.
export function rimIconSVG(style) {
  const s = spokesPath(style, 20, 20, 17);
  return `<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="19.5" fill="#0a0a0b"/>
    <circle cx="20" cy="20" r="17" fill="#1a1b1d"/><path d="${s.d}" fill="var(--rim)"/>
    <circle cx="20" cy="20" r="${f(17 * s.hub)}" fill="var(--rim)"/>
    <circle cx="20" cy="20" r="16.4" fill="none" stroke="var(--rim-hi)" stroke-width="1.2"/></svg>`;
}
