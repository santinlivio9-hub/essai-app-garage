// Heckler & Koch HK416 A5 (canon 14,5") — profil gauche, millimètres réels (axe du canon y = 168).
import { picatinny, serrations, mlok, rect, circle } from '../shapes.js';

export default {
  id: 'hk416',
  maker: 'Heckler & Koch',
  name: 'HK416 A5',
  short: 'HK416 A5',
  mark: '416',
  type: 'rifle',
  variant: 'Piston court · garde-main flottant M-LOK',
  specs: {
    caliber: '5,56×45 mm OTAN', action: 'Emprunt de gaz à piston court · culasse rotative',
    barrel: '368 mm (14,5")', length: 813, weight: 3490, rof: 850,
    v0: 880, bullet: 4.0, feed: 'Chargeur 30 coups STANAG',
  },
  capacity: { std: 30, ext: 35 },
  modes: ['safe', 'semi', 'auto'],
  defaults: { metal: 'black', poly: 'black', pad: 'alu', optic: 'holo', magnifier: true, laser: 'peq', light: 'none', muzzle: 'none', grip: 'angled', stock: 'extended', mag: 'std' },
  slots: { optic: ['none', 'rds', 'holo'], magnifier: true, laser: ['none', 'peq'], light: ['none', 'rifle'], muzzle: ['none', 'comp', 'sup'], grip: ['none', 'stubby', 'angled', 'handstop'], stock: ['collapsed', 'extended'] },
  stockTravel: 90,
  recoil: { kick: 7, rise: 2.2, slide: 0 },
  sound: { kind: 'rifle', blastTau: 0.024, lp: 7500, boom: [140, 45, 0.1], crack: 1, mech: [0.008, 0.022], gain: 1.15 },
  mounts: {
    rail: null,
    optic: { x: 128, y: 199 },
    magnifier: { x: 30, y: 199 },
    laser: { x: 420, y: 199 },
    light: { x: 474, y: 150, side: true },
    grip: { x: 360, y: 119 },
    muzzle: { x: 648, y: 168, r: 11 },
    eject: { x: 170, y: 186 },
    pivot: { x: -200, y: 150 },
    magAxis: [0.12, -1],
    selector: { x: 60, y: 132, angles: { safe: -90, semi: 0, auto: 90 } },
  },
  parts: [
    { k: 'black', d: 'M -200 154 L 0 154 L 0 182 L -200 182 Z' },
    { k: 'line', d: 'M -10 154 L -10 182 M -6 154 L -6 182' },
    // carcasse supérieure + rail continu
    { k: 'metal', d: 'M 2 150 L 236 150 L 236 190 L 2 190 C 0 190 -1 189 -1 187 L -1 153 C -1 151 0 150 2 150 Z' },
    { k: 'line', d: 'M 4 158 L 230 158 M 150 160 L 150 186' },
    { k: 'black', d: picatinny(0, 562, 199, 1, 9) },
    { g: 'ch', k: 'black', d: 'M -14 184 L 8 184 L 8 192 L -14 192 C -16 192 -17 190 -17 188 C -17 186 -16 184 -14 184 Z' },
    // garde-main flottant
    { k: 'metal', d: 'M 234 128 L 560 128 C 566 128 568 132 568 138 L 568 190 L 234 190 Z' },
    { k: 'dark', d: mlok(250, 552, 172, 30, 7) + mlok(266, 552, 146, 30, 7) },
    { k: 'black', d: picatinny(268, 540, 128, -1, 6) },
    { k: 'hl', d: 'M 236 189 L 566 189' },
    // canon + cache-flamme
    { k: 'steel', d: 'M 568 161 L 648 161 L 648 175 L 568 175 Z' },
    { g: 'muzzleStd', k: 'steel', d: 'M 648 158 L 702 158 C 705 158 706 160 706 162 L 706 174 C 706 176 705 178 702 178 L 648 178 Z' },
    { g: 'muzzleStd', k: 'dark', d: serrations(668, 700, 159, 165, 6.5) + serrations(668, 700, 171, 177, 6.5) },
    // organes de visée de secours repliés
    { k: 'black', d: 'M 524 199 L 552 199 L 552 205 L 530 208 Z M 8 199 L 34 199 L 30 207 L 10 206 Z' },
    // carcasse inférieure
    { k: 'metal', d: 'M 18 150 L 236 150 L 236 120 C 236 116 234 112 230 112 L 150 112 L 150 106 C 150 100 146 96 140 96 L 96 96 C 92 96 88 98 86 102 L 82 112 L 30 112 C 24 112 18 118 18 124 Z' },
    { k: 'metal', d: 'M 150 112 L 232 112 L 228 96 L 154 96 Z' },
    { k: 'dark', d: 'M 96 110 L 98 101 L 143 101 L 145 110 Z' },
    { k: 'black', d: 'M 112 110 C 111 105 112 102 115 100 L 118 100 C 116 104 116 107 118 110 Z' },
    { k: 'line', d: 'M 20 140 L 232 140' },
    { k: 'steel', d: rect(136, 122, 148, 128, 1.5) + ' ' + rect(132, 136, 150, 144, 2) },
    // poignée ergonomique
    { k: 'poly', d: 'M 34 112 L 82 112 C 76 80 70 40 64 8 C 63 2 60 0 54 0 L 32 0 C 26 0 22 4 24 10 C 28 40 30 70 34 112 Z' },
    { k: 'stipple', d: 'M 32 92 L 74 92 C 70 70 66 46 62 20 L 30 20 C 32 46 33 70 32 92 Z' },
    { k: 'pict', d: circle(48, 140, 1.6) },
    { k: 'pictRed', d: circle(60, 146, 1.6) + circle(72, 140, 1.6) },
    // chargeur
    { g: 'mag', k: 'black', d: 'M 156 98 C 158 40 162 -10 176 -92 L 238 -86 C 228 -10 226 40 224 98 Z' },
    { g: 'mag', k: 'line', d: 'M 166 80 C 168 40 172 0 184 -70 M 214 80 C 214 40 216 0 224 -70' },
    { g: 'magExt', k: 'pad', d: 'M 176 -92 L 238 -86 L 236 -114 L 178 -120 Z' },
    // crosse CTR
    { g: 'stock', k: 'poly', d: 'M -205 98 L -194 98 C -190 98 -188 102 -188 106 L -188 140 C -170 150 -140 152 -100 152 L -60 152 L -60 186 L -190 192 L -205 192 C -210 192 -212 188 -212 184 L -212 106 C -212 101 -210 98 -205 98 Z' },
    { g: 'stock', k: 'rubber', d: 'M -212 98 L -203 98 L -203 192 L -212 192 Z' },
    { g: 'stock', k: 'line', d: 'M -180 186 L -70 182 M -150 152 L -150 186' },
  ],
};
