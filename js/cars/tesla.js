// Tesla Model S Plaid — géométrie en millimètres réels.
export default {
  id: 'tesla',
  brand: 'Tesla',
  name: 'Model S Plaid',
  mark: 'PLAID',
  gen: 'Tri-moteur · 1 020 ch',
  length: 4970,

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

  geo: {
    wheels: [
      { x: 950, y: 352, R: 360, rim: 267, arch: 385 },
      { x: 3910, y: 352, R: 360, rim: 267, arch: 385 },
    ],
    sill: 140,
    top: `M 80 110 L 20 150 C 0 240 -5 350 5 440 C 20 540 80 620 200 670 C 600 760 1250 880 1850 960
      C 2070 1130 2330 1320 2600 1385 C 2850 1435 3150 1440 3400 1415 C 3800 1370 4250 1220 4720 1060
      L 4890 1070 C 4920 1000 4935 900 4935 800 C 4932 600 4920 420 4880 300 C 4860 220 4820 180 4760 165`,
    rearBottom: [[4500, 180]],
    frontBottom: [[500, 140], [220, 110]],
    roof: 1431, crease: [[700, 700], [4700, 1020]],
    glass: `M 2000 980 C 2200 1150 2420 1310 2660 1356 C 2950 1396 3250 1396 3420 1376
      C 3800 1330 4180 1200 4420 1110 C 3700 1060 2800 1015 2000 980 Z`,
    pillars: ['M 3030 1400 L 3105 1398 L 3100 1030 L 3025 1028 Z', 'M 3820 1290 L 3880 1270 L 3884 1076 L 3826 1074 Z'],
    trimGlass: true,
    seats: [[2860, 1220], [3700, 1200]], steering: [2440, 1080],
    mirror: 'M 2000 972 C 2006 1054 2100 1086 2200 1076 C 2230 1044 2214 986 2152 964 Z',
    lines: [
      { k: 'gap', d: 'M 1880 965 C 1850 800 1830 500 1840 262' },
      { k: 'gap', d: 'M 3065 1022 L 3058 268' },
      { k: 'gap', d: 'M 3884 1076 C 3870 960 3820 880 3740 840 C 3560 800 3400 700 3360 540 C 3340 450 3336 360 3340 268' },
      { k: 'gap', d: 'M 260 690 C 800 790 1400 895 1840 948' },
      { k: 'gap', d: 'M 4440 1120 C 4600 1084 4720 1066 4880 1074' },
      { k: 'crease', d: 'M 700 700 C 1900 800 3300 920 4700 1020' },
      { k: 'crease', d: 'M 1400 400 C 2200 385 3000 385 3560 400' },
    ],
    trims: [
      { k: 'black', d: 'M 1338 140 L 1342 230 C 2000 236 2800 236 3592 230 L 3594 140 Z' },
      { k: 'carbon', d: 'M 4700 1062 L 4896 1074 L 4890 1040 L 4712 1046 Z' },
      { k: 'black', d: 'M 4300 185 L 4880 185 L 4860 95 L 4360 95 Z' },
      { k: 'black', d: 'M 15 190 C 120 210 300 214 460 200 L 470 150 L 20 150 Z' },
    ],
    exhausts: [],
    head: {
      d: 'M 20 520 C 80 600 170 650 300 680 C 500 720 700 745 860 756 C 680 720 480 680 330 640 C 200 610 90 570 20 520 Z',
      drl: 'M 40 540 C 200 640 480 710 840 752', c: [260, 650], matrix: true,
    },
    tail: { d: 'M 4500 1112 L 4890 1072 C 4910 1030 4925 990 4930 960 C 4800 980 4640 1040 4500 1082 Z', c: [4800, 1040] },
    handles: [[2560, 905, 230, 'flush'], [3420, 935, 210, 'flush']],
    door: {
      panel: 'M 1880 965 L 3062 1022 L 3058 266 L 1840 260 C 1830 500 1850 800 1880 965 Z',
      glass: 'M 2000 980 C 2200 1150 2420 1310 2660 1356 C 2850 1384 2960 1398 3030 1400 L 3025 1028 C 2600 1008 2300 994 2000 980 Z',
      hinge: 1860,
    },
    hood: { d: 'M 200 670 C 600 760 1250 880 1850 960 L 1840 930 C 1250 850 600 730 216 642 Z', pivot: [1840, 945], angle: 32 },
    bay: { x: 300, y: 380, w: 1450, h: 540 },
  },
};
