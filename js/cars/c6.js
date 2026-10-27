// Citroën C6 Exclusive (2012) — géométrie en millimètres réels.
export default {
  id: 'c6',
  brand: 'Citroën',
  name: 'C6 Exclusive',
  mark: 'C6',
  gen: '2012 · V6 3.0 HDi 240 Biturbo',
  length: 4908,

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

  geo: {
    wheels: [
      { x: 1040, y: 339, R: 339, rim: 229, arch: 375 },
      { x: 3940, y: 339, R: 339, rim: 229, arch: 375 },
    ],
    sill: 170,
    top: `M 90 120 L 25 170 C 0 280 -5 400 10 500 C 30 600 100 690 220 740 C 600 830 1300 950 1900 1030
      C 2120 1170 2350 1340 2620 1415 C 2900 1470 3250 1468 3520 1430 C 3800 1390 3950 1250 4050 1170
      C 4150 1100 4400 1080 4860 1092 L 4890 1100 C 4905 1000 4910 900 4908 800
      C 4905 600 4890 420 4850 300 C 4830 230 4790 190 4730 175`,
    rearBottom: [[4500, 200]],
    frontBottom: [[560, 160], [240, 130]],
    roof: 1464, crease: [[900, 820], [4600, 1000]],
    glass: `M 2020 1040 C 2200 1180 2400 1320 2640 1376 C 2900 1420 3250 1420 3500 1386
      C 3750 1346 3900 1240 4000 1170 C 4060 1130 4150 1102 4260 1090 C 3700 1080 2800 1060 2020 1040 Z`,
    pillars: ['M 2985 1420 L 3060 1420 L 3058 1060 L 2984 1058 Z', 'M 3760 1340 L 3820 1310 L 3830 1078 L 3768 1076 Z'],
    chromeGlass: true,
    seats: [[2840, 1250], [3640, 1240]], steering: [2420, 1120],
    mirror: 'M 2010 1030 C 2016 1112 2110 1144 2210 1134 C 2240 1100 2224 1042 2162 1020 Z',
    lines: [
      { k: 'gap', d: 'M 1890 1035 C 1860 850 1840 550 1850 320' },
      { k: 'gap', d: 'M 3010 1060 L 3005 320' },
      { k: 'gap', d: 'M 3830 1078 C 3820 980 3780 900 3720 860 C 3560 820 3420 720 3380 560 C 3360 470 3355 400 3360 320' },
      { k: 'gap', d: 'M 600 806 C 1100 890 1500 960 1880 1020' },
      { k: 'gap', d: 'M 4280 1078 C 4500 1070 4700 1072 4860 1080' },
      { k: 'crease', d: 'M 900 820 C 2000 880 3300 950 4600 1000' },
      { k: 'crease', d: 'M 1450 520 C 2200 505 3000 505 3560 520' },
    ],
    trims: [
      { k: 'chrome', d: 'M 2020 1040 C 2800 1060 3700 1080 4260 1090 L 4250 1068 C 3700 1058 2800 1038 2030 1018 Z' },
      { k: 'chrome', d: 'M 10 470 C 60 480 150 490 262 500 L 256 522 C 150 512 60 502 12 492 Z' },
      { k: 'chrome', d: 'M 2700 960 L 2920 966 L 2920 990 L 2700 984 Z' },
      { k: 'chrome', d: 'M 3500 984 L 3700 990 L 3700 1012 L 3500 1006 Z' },
      { k: 'mesh', d: 'M 20 260 C 150 282 300 292 422 280 C 402 222 300 200 150 195 C 80 210 35 232 20 260 Z' },
      { k: 'black', d: 'M 4300 205 L 4840 205 L 4820 120 L 4360 120 Z' },
    ],
    exhausts: [],
    head: {
      d: 'M 30 560 C 80 640 160 700 280 740 C 500 790 700 822 910 842 C 700 792 480 732 300 682 C 180 644 90 602 30 560 Z',
      drl: 'M 50 584 C 220 700 520 790 890 836', c: [330, 720],
    },
    tail: { d: 'M 4600 1085 L 4895 1098 C 4906 1040 4907 980 4905 930 C 4850 960 4780 1000 4700 1030 C 4660 1050 4620 1068 4600 1085 Z', c: [4800, 1040] },
    handles: [],
    door: {
      panel: 'M 1890 1035 L 3008 1060 L 3005 318 L 1850 310 C 1840 550 1860 850 1890 1035 Z',
      glass: 'M 2020 1040 C 2200 1180 2400 1320 2640 1376 C 2800 1404 2920 1418 2985 1420 L 2984 1058 C 2600 1050 2300 1046 2020 1040 Z',
      hinge: 1870,
    },
    hood: { d: 'M 220 740 C 600 830 1300 950 1900 1030 L 1890 1000 C 1300 920 600 800 236 712 Z', pivot: [1890, 1015], angle: 30 },
    bay: { x: 320, y: 420, w: 1500, h: 560 },
  },
};
