// Tesla Model S Plaid — données, modèle 3D et profil sonore.
export default {
  id: 'tesla',
  brand: 'Tesla',
  name: 'Model S Plaid',
  mark: 'PLAID',
  gen: 'Tri-moteur · 1 020 ch',
  length: 4970,
  // Modèle 3D (assets/models/selection.json) : un seul matériau d'origine, réparti ici pièce par pièce.
  model: {
    file: 'assets/models/tesla.glb', rotate: [0, 90, 0],
    meshes: {
      paint: ['Object_2'], glass: ['Object_11', 'Object_16'], rim: ['Object_13', 'Object_14'],
      lamp: ['Object_3'], tail: ['Object_18'], black: ['Object_23', 'Object_10'],
    },
    interior: 'black',
  },

  paints: [
    { name: 'Rouge Signature', hex: '#9c0d16', finish: 'pearl' },
    { name: 'Ultra Red', hex: '#b0141c', finish: 'pearl' },
    { name: 'Rouge Multicouche', hex: '#8f0c12', finish: 'metal' },
    { name: 'Stealth Grey', hex: '#4c4f53', finish: 'metal' },
    { name: 'Lunar Silver', hex: '#b7bbbe', finish: 'metal' },
    { name: 'Bleu Outremer', hex: '#1d3b6e', finish: 'metal' },
    { name: 'Blanc Perle', hex: '#ecedeb', finish: 'pearl' },
    { name: 'Noir Uni', hex: '#0b0b0c', finish: 'gloss' },
  ],
  rim: { style: 'arachnid', finish: 'gunmetal', caliper: '#c8102e' },

  specs: {
    power: '1 020 ch', torque: '1 420 Nm', sprint: '2,1 s', vmax: '322 km/h',
    engine: '3 moteurs électriques', displacement: '100 kWh',
    gearbox: 'Réducteur 1 rapport', drive: 'Intégrale · torque vectoring', weight: '2 162 kg',
  },
  underHood: {
    title: 'Plaid · tri-moteur',
    lines: ['Rotors à manchon carbone', '20 000 tr/min max', 'Double onduleur SiC arrière', 'Batterie 100 kWh'],
    text: 'Trois moteurs à rotor gainé de carbone tournant jusqu’à 20 000 tr/min, pilotés par des onduleurs au carbure de silicium : une poussée linéaire et un sifflement électrique qui monte sans aucune rupture.',
  },
  extras: ['Jantes Arachnid 21" turbine', 'Becquet arrière carbone', 'Garde au sol abaissée', 'Poignées affleurantes'],

  engine: { type: 'ev', idle: 0, flare: 0, redline: 20000, limiter: 20000, revUp: 17000, revDown: 9000, crankTime: 0.9, crankRpm: 0, lope: 0, pops: 0, shake: 0.05 },
  sound: { type: 'ev', gain: 0.5 },

};
