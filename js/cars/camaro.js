// Chevrolet Camaro ZL1 1LE (6e génération) — données, modèle 3D et profil sonore.
export default {
  id: 'camaro',
  brand: 'Chevrolet',
  name: 'Camaro ZL1 1LE',
  mark: 'ZL1',
  gen: 'Gen 6 · LT4 6.2 V8 Supercharged',
  length: 4783,
  // Modèle 3D (assets/models/selection.json) : matériaux pilotés par l'interface, repérés par leur nom.
  model: {
    file: 'assets/models/camaro.glb', rotate: [0, 0, 0],
    paint: /camaroPaint/, glass: /camaroWindow/, rim: /wheelsWheel1A/, caliper: /wheelsCaliperLFSG2/,
    lamp: /camaroLight_/, tail: /RED_GLASS/,
  },

  paints: [
    { name: 'Gris Satin Shadow', hex: '#34373b', finish: 'satin' },
    { name: 'Noir Satiné', hex: '#17181a', finish: 'satin' },
    { name: 'Satin Steel Gray', hex: '#5b5f63', finish: 'mat' },
    { name: 'Red Hot', hex: '#b3131b', finish: 'gloss' },
    { name: 'Riverside Blue', hex: '#1f4d88', finish: 'metal' },
    { name: 'Shock', hex: '#cfd22b', finish: 'gloss' },
    { name: 'Crush', hex: '#ec6a14', finish: 'gloss' },
    { name: 'Summit White', hex: '#eeeeec', finish: 'gloss' },
  ],
  rim: { style: 'forged', finish: 'black-mat', caliper: '#c8102e' },

  specs: {
    power: '650 hp · 659 ch', torque: '881 Nm', sprint: '3,7 s', vmax: '277 km/h',
    engine: 'V8 LT4 compresseur', displacement: '6 162 cm³',
    gearbox: 'Tremec TR6060 · 6 manuelle', drive: 'Propulsion · eLSD', weight: '1 750 kg',
  },
  underHood: {
    title: 'LT4 · 6.2 V8 compresseur',
    lines: ['Eaton TVS R1740 · 0,7 bar', 'Ordre d’allumage 1-7-2-6-5-4-8-3', 'Injection directe · AFM', 'Zone rouge 6 500 tr/min'],
    text: 'Le compresseur volumétrique Eaton à quatre lobes logé dans le V du bloc produit le sifflement aigu qui monte avec les tours, posé sur le grondement cross-plane du LT4.',
  },
  extras: ['Capot carbone à extracteur central', 'Canards aérodynamiques avant', 'Aileron carbone massif 1LE', 'Amortisseurs Multimatic DSSV'],

  engine: { type: 'v8sc', idle: 720, flare: 1650, redline: 6500, limiter: 6600, revUp: 8000, revDown: 5000, crankTime: 0.85, crankRpm: 215, lope: 26, pops: 0.4, shake: 0.95 },
  sound: {
    type: 'ice', cyl: 8, order: [1, 7, 2, 6, 5, 4, 8, 3], bank: [0, 0, 1, 1, 0, 1, 1, 0],
    amp: [1.0, 0.95, 0.92, 0.97, 0.94, 0.9, 1.0, 0.93], skew: [0, -2, 2, -1, 3, -2, 1, -1],
    pulseTau: 0.0044, rough: 0.38, lumpy: 0.22,
    res: [[72, 2.2, 1.25], [198, 2.8, 0.8], [520, 3.4, 0.34], [1350, 4, 0.1]], resB: 1.06, bankDelay: 0.7, direct: 0.75,
    lp: 650, lpThr: 2600, lpRpm: 1400, drive: 2.1,
    intake: 0.4, turbo: null, whine: { amt: 0.2, ratio: 9.6 }, clatter: 0,
    starter: { amt: 1.0, f: 110 }, gain: 0.48,
  },

};
