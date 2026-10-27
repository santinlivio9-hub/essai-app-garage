// Chevrolet Camaro ZL1 1LE (6e génération) — géométrie en millimètres réels.
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

  geo: {
    wheels: [
      { x: 1000, y: 333, R: 333, rim: 241, arch: 370 },
      { x: 3811, y: 333, R: 333, rim: 241, arch: 372 },
    ],
    sill: 150,
    top: `M 90 110 L 25 160 C 5 260 0 380 10 500 C 20 620 40 720 90 800 C 140 830 200 845 300 855
      C 900 905 1500 960 2150 1025 C 2350 1150 2560 1280 2780 1330 C 2980 1360 3250 1360 3400 1335
      C 3640 1290 3900 1140 4120 1068 C 4350 1060 4580 1062 4730 1065
      C 4760 1000 4780 900 4780 800 C 4780 600 4770 420 4740 300 C 4720 220 4690 180 4630 160`,
    rearBottom: [[4400, 190]],
    frontBottom: [[520, 150], [220, 120]],
    roof: 1348, crease: [[800, 830], [4500, 1000]],
    glass: `M 2330 1022 C 2450 1130 2600 1240 2790 1290 C 2980 1318 3220 1318 3390 1298
      C 3560 1262 3760 1160 3900 1082 C 3400 1064 2800 1040 2330 1022 Z`,
    pillars: ['M 3405 1300 L 3478 1290 L 3486 1068 L 3412 1066 Z'],
    trimGlass: true,
    seats: [[3150, 1170], [3700, 1110]], steering: [2660, 1070],
    mirror: 'M 2310 1010 C 2316 1092 2410 1122 2510 1112 C 2540 1080 2524 1022 2462 1000 Z',
    lines: [
      { k: 'gap', d: 'M 2190 1010 C 2150 800 2130 500 2140 285' },
      { k: 'gap', d: 'M 3480 1072 C 3500 800 3490 500 3460 290' },
      { k: 'gap', d: 'M 300 845 C 900 893 1500 948 2140 1012' },
      { k: 'gap', d: 'M 4140 1052 C 4350 1046 4560 1048 4730 1052' },
      { k: 'crease', d: 'M 800 830 C 1800 880 2800 930 3300 958 C 3600 990 3950 1000 4500 992' },
      { k: 'crease', d: 'M 1420 440 C 2100 420 2800 420 3420 440' },
    ],
    trims: [
      { k: 'carbon', d: 'M 700 905 C 1000 935 1300 960 1620 990 L 1630 1018 C 1300 992 1000 966 720 938 Z' },
      { k: 'carbon', d: 'M 26 560 L -70 584 L -66 604 L 20 592 Z' },
      { k: 'carbon', d: 'M 22 446 L -58 458 L -56 476 L 18 474 Z' },
      { k: 'black', d: 'M -50 88 L 570 128 L 576 160 L 25 160 L -60 120 Z' },
      { k: 'black', d: 'M 1322 150 L 1330 290 C 1900 300 2700 300 3490 290 L 3490 150 Z' },
      { k: 'mesh', d: 'M 15 300 C 150 324 320 334 452 312 C 422 232 300 192 120 180 C 70 200 30 250 15 300 Z' },
      { k: 'mesh', d: 'M 40 700 C 60 640 80 600 100 580 L 300 600 C 260 640 230 690 220 740 Z' },
      { k: 'black', d: 'M 4250 195 L 4760 195 L 4740 90 L 4300 90 Z' },
    ],
    wing: {
      plate: 'M 4270 1172 L 4790 1210 L 4806 1330 L 4300 1310 Z',
      foil: 'M 4300 1244 C 4380 1294 4620 1304 4800 1272 C 4640 1246 4450 1230 4300 1244 Z',
      posts: ['M 4380 1064 L 4430 1064 L 4486 1250 L 4436 1250 Z'],
    },
    exhausts: [{ x: 4690, y: 175, rx: 70, ry: 60 }, { x: 4580, y: 168, rx: 62, ry: 54 }],
    head: {
      d: 'M 40 700 C 100 760 200 800 320 815 L 640 836 C 520 800 380 772 260 752 C 160 735 90 720 40 700 Z',
      drl: 'M 60 732 C 200 776 400 806 620 828', c: [300, 780],
    },
    tail: { d: 'M 4540 1052 L 4752 1062 C 4772 1000 4776 960 4776 930 C 4680 940 4600 970 4540 1002 Z', c: [4690, 1000] },
    handles: [[2900, 975, 220]],
    door: {
      panel: 'M 2190 1010 L 3480 1072 C 3500 800 3490 500 3460 288 L 2140 280 C 2130 500 2150 800 2190 1010 Z',
      glass: 'M 2330 1022 C 2450 1130 2600 1240 2790 1290 C 2980 1318 3220 1318 3405 1300 L 3412 1066 C 2800 1040 2600 1030 2330 1022 Z',
      hinge: 2170,
    },
    hood: { d: 'M 300 855 C 900 905 1500 960 2150 1025 L 2140 995 C 1500 932 900 878 312 828 Z', pivot: [2140, 1010], angle: 30 },
    bay: { x: 360, y: 400, w: 1700, h: 600 },
  },
};
