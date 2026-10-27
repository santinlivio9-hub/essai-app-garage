// Chevrolet Corvette C6 Z06 « Full Modif » — géométrie en millimètres réels.
export default {
  id: 'corvette',
  brand: 'Chevrolet',
  name: 'Corvette C6 Z06',
  mark: 'Z06',
  gen: 'C6 · LS7 7.0 V8 · Full Modif',
  length: 4460,

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
    power: '512 ch', torque: '637 Nm', sprint: '3,9 s', vmax: '318 km/h',
    engine: 'V8 LS7 small-block', displacement: '7 011 cm³',
    gearbox: 'Tremec T56 · 6 manuelle', drive: 'Propulsion · carter sec', weight: '1 420 kg',
  },
  underHood: {
    title: 'LS7 · 7.0 V8 atmo',
    lines: ['Ordre d’allumage 1-8-7-2-6-5-4-3', 'Bielles titane · carter sec', 'Zone rouge 7 000 tr/min', 'Vilebrequin cross-plane'],
    text: 'Le plus gros small-block jamais monté en série : 7 litres atmosphériques, bielles en titane et lubrification à carter sec issue de la C6.R. Le vilebrequin cross-plane donne ce glouglou lourd et saccadé au ralenti.',
  },
  extras: ['Aileron GT carbone sur cols de cygne', 'Capot bombé à extracteur d’air', 'Splitter avant carbone + jupes latérales', 'Jantes track multi-bâtons forgées'],

  engine: { type: 'v8', idle: 760, flare: 1600, redline: 7000, limiter: 7100, revUp: 8800, revDown: 5600, crankTime: 0.9, crankRpm: 210, lope: 40, pops: 0.35, shake: 1.0 },
  sound: {
    type: 'ice', cyl: 8, order: [1, 8, 7, 2, 6, 5, 4, 3], bank: [0, 1, 0, 1, 1, 0, 1, 0],
    amp: [1.0, 0.92, 0.97, 0.9, 0.95, 1.0, 0.9, 0.96], skew: [0, 2, -2, 3, -1, 1, -3, 2],
    pulseTau: 0.0046, rough: 0.42, lumpy: 0.34,
    res: [[78, 2.2, 1.2], [215, 2.8, 0.75], [560, 3.5, 0.32], [1500, 4, 0.08]], resB: 1.08, bankDelay: 0.9, direct: 0.7,
    lp: 700, lpThr: 2800, lpRpm: 1500, drive: 2.0,
    intake: 0.45, turbo: null, whine: null, clatter: 0,
    starter: { amt: 1.0, f: 105 }, gain: 0.5,
  },

  geo: {
    wheels: [
      { x: 1000, y: 325, R: 325, rim: 229, arch: 362 },
      { x: 3686, y: 339, R: 339, rim: 241, arch: 378 },
    ],
    sill: 140,
    top: `M 80 90 L 20 140 C 0 220 0 320 20 400 C 50 470 120 540 220 590 C 400 660 700 745 1000 790
      C 1250 828 1550 880 1700 905 C 1850 925 1950 935 2050 940 C 2250 1050 2450 1180 2650 1235
      C 2850 1265 3050 1262 3180 1235 C 3450 1170 3750 1050 4000 990 C 4200 965 4350 960 4440 962
      C 4460 900 4465 800 4462 700 C 4458 520 4440 360 4400 250 C 4380 190 4350 160 4300 150`,
    rearBottom: [[4150, 170]],
    frontBottom: [[500, 130], [200, 100]],
    roof: 1244, crease: [[700, 700], [4300, 860]],
    glass: `M 2150 950 C 2300 1060 2480 1160 2680 1200 C 2850 1226 3030 1223 3150 1200
      C 3280 1150 3400 1070 3500 990 C 3000 975 2500 960 2150 950 Z`,
    hatch: 'M 3235 1214 C 3480 1150 3760 1050 3990 986 L 3950 962 C 3720 1022 3480 1106 3290 1166 Z',
    pillars: [],
    seats: [[3010, 1110]], steering: [2520, 1010],
    mirror: 'M 2150 948 C 2155 1030 2250 1062 2350 1052 C 2380 1020 2362 962 2300 940 Z',
    lines: [
      { k: 'gap', d: 'M 2080 945 C 2040 780 2020 500 2030 275' },
      { k: 'gap', d: 'M 3470 985 C 3480 800 3470 500 3440 280' },
      { k: 'gap', d: 'M 400 660 C 800 740 1500 860 2045 925' },
      { k: 'crease', d: 'M 700 700 C 1700 760 3000 820 4300 860' },
      { k: 'crease', d: 'M 1420 420 C 2100 400 2800 395 3320 410' },
    ],
    trims: [
      { k: 'carbon', d: 'M -70 66 L 620 92 L 640 128 L 20 140 L -50 108 Z' },
      { k: 'carbon', d: 'M 1312 140 L 1318 255 C 1900 268 2600 268 3372 255 L 3368 140 Z' },
      { k: 'black', d: 'M 1400 862 C 1500 878 1600 892 1720 902 L 1724 925 C 1600 915 1500 902 1400 886 Z' },
      { k: 'black', d: 'M 1500 700 L 1560 704 L 1520 480 L 1460 476 Z' },
      { k: 'black', d: 'M 1600 706 L 1660 710 L 1620 486 L 1560 482 Z' },
      { k: 'black', d: 'M 1700 712 L 1760 716 L 1720 492 L 1660 488 Z' },
      { k: 'mesh', d: 'M 20 260 C 140 290 300 300 440 290 C 420 220 320 180 160 170 C 90 185 40 220 20 260 Z' },
      { k: 'black', d: 'M 4000 175 L 4420 175 L 4400 70 L 4060 70 Z' },
    ],
    wing: {
      plate: 'M 3990 1180 L 4430 1222 L 4450 1440 L 4060 1410 Z',
      foil: 'M 4050 1336 C 4120 1384 4290 1394 4440 1360 C 4320 1334 4160 1318 4050 1336 Z',
      posts: ['M 4050 978 C 4062 1080 4100 1180 4140 1330 L 4190 1330 C 4150 1180 4112 1080 4112 974 Z'],
    },
    exhausts: [{ x: 4400, y: 170, rx: 70, ry: 60 }, { x: 4280, y: 160, rx: 60, ry: 52 }],
    marker: 'M 320 420 L 440 426 L 440 456 L 320 450 Z',
    head: {
      d: 'M 60 450 C 120 520 220 580 340 620 C 460 650 560 668 650 678 C 560 640 420 590 300 546 C 200 510 110 476 60 450 Z',
      drl: 'M 90 478 C 220 560 420 630 640 674', c: [300, 580],
    },
    tail: { d: 'M 4280 905 L 4455 935 C 4462 900 4463 860 4462 830 L 4300 840 Z', c: [4420, 880], round: true },
    handles: [],
    door: {
      panel: 'M 2080 945 L 3470 985 C 3480 800 3470 500 3440 278 L 2030 272 C 2020 500 2040 780 2080 945 Z',
      glass: 'M 2150 950 C 2300 1060 2480 1160 2680 1200 C 2850 1226 3030 1223 3150 1200 C 3280 1150 3400 1070 3500 990 C 3000 975 2500 960 2150 950 Z',
      hinge: 2050,
    },
    hood: { d: 'M 400 660 C 700 745 1000 790 1250 828 C 1550 880 1850 925 2050 940 L 2045 912 C 1850 898 1550 852 1250 800 C 1000 762 700 718 410 632 Z', pivot: [420, 650], angle: -24 },
    bay: { x: 520, y: 340, w: 1480, h: 560 },
  },
};
