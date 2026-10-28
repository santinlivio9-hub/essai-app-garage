// Chevrolet Corvette C6 Z06 « Full Modif » — données, modèle 3D et profil sonore.
export default {
  id: 'corvette',
  brand: 'Chevrolet',
  name: 'Corvette C6 Z06',
  short: 'Corvette',
  gen: 'C6 · LS7 7.0 V8 atmo · Stage 3',
  length: 4460,
  // Modèle 3D (assets/models/selection.json) : matériaux pilotés par l'interface, repérés par leur nom.
  model: {
    file: 'assets/models/corvette.glb', rotate: [0, 0, 0],
    paint: /CarPaint/, glass: /Glass_Window/, rim: /Wheel1A_Material/, caliper: /CalliperGloss/,
    lamp: /CM_Light_Max/, tail: /LightGlassNormal_Red/,
    hood: /Hood6/, door: /DoorL_/,
  },

  paints: [
    { name: 'Bordeaux Nacré', hex: '#5c0f1d', finish: 'pearl' },
    { name: 'Torch Red', hex: '#c0141c', finish: 'gloss' },
    { name: 'Velocity Yellow', hex: '#f0c414', finish: 'gloss' },
    { name: 'Jetstream Blue', hex: '#3a6ea8', finish: 'metal' },
    { name: 'Inferno Orange', hex: '#cf5418', finish: 'metal' },
    { name: 'Cyber Gray', hex: '#4b4f55', finish: 'metal' },
    { name: 'Arctic White', hex: '#eceeee', finish: 'gloss' },
    { name: 'Black', hex: '#0c0c0d', finish: 'gloss' },
  ],
  rim: { style: 'track', finish: 'black', caliper: '#d11a1a' },

  specs: {
    power: '≈ 610 ch', torque: '≈ 690 Nm', sprint: '≈ 3,6 s', vmax: '> 320 km/h',
    engine: 'V8 LS7 atmo · Stage 3', displacement: '7 011 cm³',
    gearbox: 'Tremec T56 · 6 manuelle', drive: 'Propulsion · carter sec', weight: '1 420 kg',
  },
  underHood: {
    title: 'LS7 · 7.0 V8 atmo · Stage 3',
    lines: ['Arbre à cames Stage 3 · culasses retravaillées', 'Ordre d’allumage 1-8-7-2-6-5-4-3', 'Collecteurs long-tube · cartographie', 'Bielles titane · carter sec'],
    text: 'Base LS7 de série (512 ch, 7 litres atmosphériques, bielles titane, carter sec issu de la C6.R) préparée Stage 3 : arbre à cames plus pointu, culasses retravaillées, collecteurs long-tube et reprogrammation. Les chiffres de puissance sont des estimations typiques de ce niveau de préparation. Le ralenti devient lourd, saccadé, très « came ».',
  },
  extras: ['Préparation moteur Stage 3 (puissance estimée)', 'Aileron GT carbone sur cols de cygne', 'Capot ventilé à extracteur d’air', 'Splitter avant carbone + jupes latérales', 'Jantes track multi-bâtons forgées'],

  engine: { type: 'v8', idle: 880, flare: 1650, redline: 7200, limiter: 7300, revUp: 9600, revDown: 6000, crankTime: 0.9, crankRpm: 210, lope: 70, pops: 0.45, shake: 1.15 },
  sound: {
    type: 'ice', cyl: 8, order: [1, 8, 7, 2, 6, 5, 4, 3], bank: [0, 1, 0, 1, 1, 0, 1, 0],
    amp: [1.0, 0.92, 0.97, 0.9, 0.95, 1.0, 0.9, 0.96], skew: [0, 2, -2, 3, -1, 1, -3, 2],
    pulseTau: 0.0046, rough: 0.46, lumpy: 0.55,
    res: [[78, 2.2, 1.2], [215, 2.8, 0.75], [560, 3.5, 0.32], [1500, 4, 0.08]], resB: 1.08, bankDelay: 0.9, direct: 0.7,
    lp: 700, lpThr: 2800, lpRpm: 1500, drive: 2.0,
    intake: 0.45, turbo: null, whine: null, clatter: 0,
    starter: { amt: 1.0, f: 105 }, gain: 0.5,
  },

};
