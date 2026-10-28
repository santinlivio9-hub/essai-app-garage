// Audi RS 3 Berline (8Y) — données, modèle 3D et profil sonore.
export default {
  id: 'rs3',
  brand: 'Audi Sport',
  name: 'RS 3 Berline',
  short: 'RS 3',
  gen: '8Y · 2.5 TFSI quattro',
  length: 4542,
  // Modèle 3D (assets/models/selection.json) : matériaux pilotés par l'interface, repérés par leur nom.
  model: {
    file: 'assets/models/rs3.glb', rotate: [0, 0, 0],
    paint: /Paint_Material/, glass: /Window_Material/, rim: /Wheel1A_Material/, caliper: /CalliperA_Zon/,
    lamp: /LightA_Material/, tail: /red_glass/,
  },

  paints: [
    { name: 'Vert Kyalami', hex: '#3e7d3b', finish: 'gloss' },
    { name: 'Jaune Python', hex: '#e2c21a', finish: 'gloss' },
    { name: 'Gris Nardo', hex: '#8b8f91', finish: 'gloss' },
    { name: 'Bleu Ascari', hex: '#1d4f9c', finish: 'metal' },
    { name: 'Rouge Tango', hex: '#a3121b', finish: 'metal' },
    { name: 'Gris Daytona', hex: '#4a4e53', finish: 'pearl' },
    { name: 'Blanc Glacier', hex: '#e6e9ea', finish: 'metal' },
    { name: 'Noir Mythic', hex: '#0e0f11', finish: 'metal' },
  ],
  rim: { style: 'rs', finish: 'gunmetal', caliper: '#c8102e' },

  specs: {
    power: '400 ch', torque: '500 Nm', sprint: '3,8 s', vmax: '290 km/h',
    engine: '5 cyl. en ligne 2.5 TFSI', displacement: '2 480 cm³',
    gearbox: 'S tronic 7 rapports', drive: 'quattro · RS Torque Splitter', weight: '1 575 kg',
  },
  underHood: {
    title: '2.5 TFSI · 5 cylindres',
    lines: ['Ordre d’allumage 1-2-4-5-3', 'Turbo · injection directe + MPI', '400 ch de 5 600 à 7 000 tr/min', 'Bloc alu · 26 kg plus léger'],
    text: 'Le cinq-cylindres en ligne élu neuf fois « Engine of the Year ». Son ordre d’allumage décalé produit cette sonorité rauque et métallique propre aux Audi Sport, héritée des quattro de rallye.',
  },
  extras: ['Optiques Matrix LED à DRL numériques', 'Calandre Singleframe alvéolée noir brillant', 'Ailes élargies + ouïes de décharge', 'Échappement RS ovale'],

  engine: { type: 'i5', idle: 860, flare: 1950, redline: 7000, limiter: 7200, revUp: 11500, revDown: 6800, crankTime: 0.7, crankRpm: 250, lope: 12, pops: 0.55, shake: 0.45 },
  sound: {
    type: 'ice', cyl: 5, order: [1, 2, 4, 5, 3], bank: [0, 0, 0, 0, 0],
    amp: [1.0, 0.8, 0.94, 0.74, 0.88], skew: [0, 5, -4, 7, -2],
    pulseTau: 0.0034, rough: 0.32, lumpy: 0.08,
    res: [[118, 2.6, 1.0], [330, 3.5, 0.75], [880, 4.5, 0.32], [2100, 5, 0.1]], resB: 1, bankDelay: 0, direct: 0.55,
    lp: 950, lpThr: 3600, lpRpm: 1800, drive: 1.7,
    intake: 0.35, turbo: { amt: 0.32, spool: 2000, f0: 2600, f1: 3600 }, whine: null, clatter: 0,
    starter: { amt: 0.9, f: 120 }, gain: 0.8,
  },

};
