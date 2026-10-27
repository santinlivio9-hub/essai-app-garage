// Citroën C6 Exclusive (2012) — données, modèle 3D et profil sonore.
export default {
  id: 'c6',
  brand: 'Citroën',
  name: 'C6 Exclusive',
  mark: 'C6',
  gen: '2012 · V6 3.0 HDi 240 Biturbo',
  length: 4908,
  // Modèle 3D (assets/models/selection.json) : modèle sans textures, matériaux redéfinis ici.
  model: {
    file: 'assets/models/c6.glb', rotate: [0, 90, 0],
    paint: /^material$/, glass: /material_4/, rim: /^Material$/, tail: /Color_A07/,
    trim: { '^Color_M08$': 'black', 'DefaultMaterial_0': 'chrome' },
    hood: /C-bonnet/, door: /C-doors_60/,
  },

  paints: [
    { name: 'Noir Obsidien', hex: '#111215', finish: 'metal' },
    { name: 'Gris Thorium', hex: '#6d7176', finish: 'metal' },
    { name: 'Gris Aluminium', hex: '#a7abae', finish: 'metal' },
    { name: 'Bleu Montebello', hex: '#1d2a44', finish: 'pearl' },
    { name: 'Rouge Lucifer', hex: '#5e0d14', finish: 'pearl' },
    { name: 'Brun Hickory', hex: '#3d2e26', finish: 'metal' },
    { name: 'Blanc Nacré', hex: '#ebeae4', finish: 'pearl' },
  ],
  rim: { style: 'classic', finish: 'silver', caliper: '#3b3e42' },

  specs: {
    power: '240 ch', torque: '450 Nm', sprint: '8,3 s', vmax: '243 km/h',
    engine: 'V6 60° HDi biturbo', displacement: '2 993 cm³',
    gearbox: 'Aisin 6 auto', drive: 'Traction · Hydractive III+', weight: '1 890 kg',
  },
  underHood: {
    title: 'V6 3.0 HDi 240 · biturbo',
    lines: ['Ordre d’allumage 1-4-2-5-3-6', 'Deux turbos parallèles', 'Injection piézo 2 000 bar', 'Filtre à particules FAP'],
    text: 'Un grand V6 diesel feutré : injection piézo multiple très étouffée, deux turbos parallèles et une insonorisation de limousine. Le tout posé sur la suspension hydropneumatique Hydractive III+.',
  },
  extras: ['Suspension hydropneumatique Hydractive III+', 'Vitrage acoustique feuilleté', 'Lunette arrière concave · vitrage de custode profilé', 'Feux LED effilés sur les ailes', 'Affichage tête haute'],

  engine: { type: 'v6d', idle: 760, flare: 1080, redline: 4500, limiter: 4700, revUp: 3300, revDown: 2600, crankTime: 0.75, crankRpm: 230, lope: 6, pops: 0, shake: 0.18 },
  sound: {
    type: 'ice', cyl: 6, order: [1, 4, 2, 5, 3, 6], bank: [0, 1, 0, 1, 0, 1],
    amp: [1.0, 0.96, 0.98, 0.95, 0.99, 0.97], skew: [0, 1, -1, 1, 0, -1],
    pulseTau: 0.0052, rough: 0.22, lumpy: 0.04,
    res: [[64, 2.0, 1.1], [168, 2.4, 0.5], [390, 3, 0.16]], resB: 1.04, bankDelay: 0.5, direct: 0.8,
    lp: 380, lpThr: 900, lpRpm: 500, drive: 1.15,
    intake: 0.18, turbo: { amt: 0.22, spool: 1500, f0: 1700, f1: 2400 }, whine: null, clatter: 0.5,
    starter: { amt: 0.55, f: 130 }, gain: 0.42,
  },

};
