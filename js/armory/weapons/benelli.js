// Benelli M4 (Super 90) — profil gauche, millimètres réels (axe du canon y = 160).
import { picatinny, serrations, rect, circle } from '../shapes.js';

export default {
  id: 'benelli',
  maker: 'Benelli',
  name: 'Benelli M4 Super 90',
  short: 'M4 Super 90',
  mark: 'M4',
  type: 'shotgun',
  variant: 'A.R.G.O. double piston · crosse télescopique squelette',
  specs: {
    caliber: '12/76 (calibre 12, chambre 3")', action: 'Semi-automatique A.R.G.O. (deux pistons auto-régulés)',
    barrel: '470 mm (18,5")', length: 885, weight: 3820, rof: null,
    v0: 400, bullet: 32, feed: 'Magasin tubulaire 4 + 1',
  },
  capacity: { std: 4, ext: 6, tube: true },
  modes: ['safe', 'semi'],
  defaults: { metal: 'black', poly: 'black', pad: 'alu', optic: 'rds', light: 'none', muzzle: 'none', stock: 'collapsed', mag: 'std' },
  slots: { optic: ['none', 'rds', 'holo'], magnifier: false, laser: false, light: ['none', 'rifle'], muzzle: ['none', 'comp'], grip: false, stock: ['collapsed', 'extended'] },
  stockTravel: 125,
  recoil: { kick: 14, rise: 5, slide: 0 },
  sound: { kind: 'shotgun', blastTau: 0.034, lp: 4200, boom: [110, 38, 0.16], crack: 0, mech: [0.03, 0.07], gain: 1.2 },
  mounts: {
    optic: { x: 96, y: 187 },
    light: { x: 520, y: 132, side: true },
    muzzle: { x: 725, y: 160, r: 10 },
    eject: { x: 160, y: 178 },
    pivot: { x: -150, y: 135 },
    shell: { x: 168, y: 128 },
  },
  parts: [
    { k: 'black', d: 'M -170 150 L 0 150 L 0 170 L -170 170 Z' },
    // boîtier
    { k: 'metal', d: 'M 0 128 L 236 128 C 242 128 246 132 248 138 L 250 152 L 250 172 C 250 176 248 178 244 178 L 0 178 Z' },
    { k: 'black', d: picatinny(18, 236, 187, 1, 9) },
    { k: 'black', d: 'M 196 187 L 200 205 L 212 205 L 216 187 Z' },
    { k: 'dark', d: circle(206, 199, 3) },
    { k: 'dark', d: 'M 120 128 L 214 128 L 214 132 L 120 132 Z' },
    { k: 'steel', d: circle(150, 142, 4.5) },
    { k: 'line', d: 'M 4 168 L 240 168' },
    // canon, guidon, tube magasin
    { k: 'steel', d: 'M 248 151 L 725 151 L 725 169 L 248 169 Z' },
    { k: 'black', d: 'M 686 169 L 688 190 L 692 190 L 693 176 L 699 176 L 700 190 L 704 190 L 706 169 Z' },
    { k: 'metal', d: 'M 236 118 L 622 118 L 622 142 L 236 142 Z' },
    { g: 'tubeStd', k: 'steel', d: 'M 622 116 L 646 116 C 650 116 652 118 652 122 L 652 138 C 652 142 650 144 646 144 L 622 144 Z' },
    { g: 'tubeExt', k: 'metal', d: 'M 622 118 L 700 118 L 700 142 L 622 142 Z' },
    { g: 'tubeExt', k: 'steel', d: 'M 700 116 L 722 116 C 726 116 728 118 728 122 L 728 138 C 728 142 726 144 722 144 L 700 144 Z' },
    { k: 'black', d: 'M 598 112 L 614 112 L 614 172 L 598 172 Z' },
    // garde-main
    { k: 'poly', d: 'M 252 112 L 480 112 C 486 112 488 116 488 122 L 488 160 L 470 166 L 262 166 C 256 166 252 162 252 156 Z' },
    { k: 'line', d: serrations(300, 470, 116, 160, 14) },
    // carcasse + poignée
    { k: 'poly', d: 'M 40 128 L 210 128 L 210 118 C 210 112 206 108 200 108 L 182 108 C 178 92 172 84 162 84 L 126 84 C 120 84 116 88 114 94 L 112 108 L 92 108 C 86 74 80 36 74 8 C 73 2 70 0 64 0 L 44 0 C 38 0 34 4 36 10 C 42 40 46 74 48 108 L 44 108 C 41 110 40 114 40 118 Z' },
    { k: 'dark', d: 'M 122 106 L 125 96 C 126 91 129 89 134 89 L 162 89 C 168 89 172 93 174 100 L 176 106 Z' },
    { k: 'black', d: 'M 140 106 C 139 99 140 95 143 92 L 146 92 C 144 96 144 101 146 106 Z' },
    { k: 'stipple', d: 'M 50 96 L 86 96 C 82 70 78 44 72 18 L 44 18 C 46 44 49 70 50 96 Z' },
    { k: 'steel', d: rect(176, 110, 188, 116, 2) },
    // crosse télescopique squelette
    { g: 'stock', k: 'rubber', d: 'M -148 84 L -132 84 L -132 184 L -148 184 C -151 184 -153 182 -153 179 L -153 89 C -153 86 -151 84 -148 84 Z' },
    { g: 'stock', k: 'poly', d: 'M -132 166 L -30 166 L -30 178 L -132 178 Z M -132 90 L -116 90 L -36 134 L -36 148 L -46 148 L -132 104 Z M -46 128 L -30 128 L -30 178 L -46 178 Z M -132 104 L -120 108 L -120 166 L -132 166 Z' },
    { g: 'stock', k: 'line', d: 'M -128 172 L -34 172' },
  ],
};
