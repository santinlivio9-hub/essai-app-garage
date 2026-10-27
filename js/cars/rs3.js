// Audi RS 3 Berline (8Y) — géométrie en millimètres réels (x depuis l'avant, y depuis le sol).
export default {
  id: 'rs3',
  brand: 'Audi Sport',
  name: 'RS 3 Berline',
  mark: 'RS3',
  gen: '8Y · 2.5 TFSI quattro',
  length: 4542,

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

  geo: {
    wheels: [
      { x: 905, y: 325, R: 325, rim: 241, arch: 362 },
      { x: 3536, y: 325, R: 325, rim: 241, arch: 362 },
    ],
    sill: 160,
    top: `M 70 95 L 15 150 C 0 260 0 380 10 460 C 25 560 70 650 150 720 C 180 750 230 770 300 785
      C 750 860 1250 935 1680 990 C 1880 1150 2130 1320 2380 1378 C 2650 1420 3050 1418 3280 1388
      C 3550 1330 3800 1160 3980 1075 C 4150 1065 4350 1060 4470 1065 L 4505 1078
      C 4530 1000 4545 900 4542 800 C 4540 600 4530 420 4500 300 C 4480 220 4450 190 4400 170`,
    rearBottom: [[4180, 200]],
    frontBottom: [[480, 150], [200, 110]],
    roof: 1410, crease: [[600, 770], [4350, 930]],
    glass: `M 1820 1002 C 1990 1150 2180 1290 2400 1346 C 2700 1386 3080 1384 3260 1354
      C 3470 1306 3680 1170 3810 1072 C 3400 1050 2600 1025 1820 1002 Z`,
    pillars: ['M 2828 1372 L 2905 1370 L 2895 1026 L 2818 1023 Z', 'M 3545 1270 L 3580 1250 L 3584 1056 L 3550 1054 Z'],
    trimGlass: true,
    seats: [[2700, 1190], [3460, 1170]], steering: [2150, 1060],
    mirror: 'M 1815 998 C 1820 1083 1910 1110 2010 1100 C 2040 1068 2025 1010 1965 988 Z',
    lines: [
      { k: 'gap', d: 'M 1650 985 C 1610 800 1598 500 1620 305' },
      { k: 'gap', d: 'M 2862 1022 L 2862 305' },
      { k: 'gap', d: 'M 3812 1070 C 3800 960 3760 880 3700 830 C 3540 780 3280 700 3220 540 C 3196 470 3188 380 3192 305' },
      { k: 'gap', d: 'M 520 772 C 900 840 1300 905 1665 975' },
      { k: 'gap', d: 'M 4040 1052 C 4200 1044 4360 1042 4470 1048' },
      { k: 'gap', d: 'M 4200 980 C 4170 940 4170 900 4200 870 C 4240 850 4280 870 4290 910 C 4295 950 4260 985 4200 980 Z' },
      { k: 'crease', d: 'M 600 770 C 1600 800 3000 862 4350 930' },
      { k: 'crease', d: 'M 1320 470 C 2000 455 2700 445 3210 450' },
    ],
    trims: [
      { k: 'black', d: 'M 1250 160 L 1258 300 C 1900 312 2600 312 3210 300 L 3216 160 Z' },
      { k: 'carbon', d: 'M 15 150 L 70 95 L 200 110 L 480 150 L 486 120 L 210 76 L 58 62 L -10 120 Z' },
      { k: 'mesh', d: 'M 18 300 C 120 334 300 344 430 322 C 410 242 300 192 130 180 C 70 200 28 250 18 300 Z' },
      { k: 'black', d: 'M 1342 620 C 1385 612 1425 592 1436 560 L 1416 392 C 1384 380 1352 390 1344 412 Z' },
      { k: 'black', d: 'M 3990 205 L 4480 205 L 4458 96 L 4060 96 Z' },
      { k: 'carbon', d: 'M 4380 1062 L 4508 1080 L 4512 1052 L 4392 1044 Z' },
      { k: 'black', d: 'M 15 150 C 6 200 4 230 6 260 L 60 258 C 70 220 90 180 120 150 Z' },
    ],
    exhausts: [{ x: 4420, y: 175, rx: 95, ry: 46 }],
    head: {
      d: 'M 25 560 C 60 660 130 740 240 772 L 700 815 C 640 760 500 700 360 664 C 230 630 120 600 25 560 Z',
      drl: 'M 50 600 C 150 700 330 762 680 808', c: [250, 715], matrix: true,
    },
    tail: { d: 'M 4170 1012 L 4522 1040 C 4536 992 4541 962 4541 930 C 4400 930 4260 958 4170 986 Z', c: [4440, 985] },
    handles: [[2560, 935, 230], [3330, 955, 210]],
    door: {
      panel: 'M 1650 985 L 2860 1022 L 2860 302 L 1620 302 C 1598 500 1610 800 1650 985 Z',
      glass: 'M 1820 1002 C 1990 1150 2180 1290 2400 1346 C 2600 1372 2760 1374 2828 1372 L 2818 1023 C 2400 1014 2100 1008 1820 1002 Z',
      hinge: 1630,
    },
    hood: { d: 'M 300 785 C 750 860 1250 935 1680 990 L 1672 960 C 1250 905 750 830 314 758 Z', pivot: [1672, 975], angle: 34 },
    bay: { x: 240, y: 420, w: 1400, h: 500 },
  },
};
