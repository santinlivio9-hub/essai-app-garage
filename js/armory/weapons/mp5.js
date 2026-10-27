// Heckler & Koch MP5A3 / MP5-SD — profil gauche, millimètres réels (axe du canon y = 150).
import { picatinny, serrations, ribs, rect, circle } from '../shapes.js';

export default {
  id: 'mp5',
  maker: 'Heckler & Koch',
  name: 'MP5A3',
  nameSD: 'MP5-SD',
  short: 'MP5A3',
  mark: 'MP5',
  type: 'smg',
  variant: 'Poignée Navy ambidextre · sélecteur S-E-F',
  specs: {
    caliber: '9×19 mm Parabellum', action: 'Culasse non calée à retard par galets · tir culasse fermée',
    barrel: '225 mm', length: 550, weight: 2880, rof: 800,
    v0: 400, v0SD: 285, bullet: 8.0, feed: 'Chargeur courbe 30 coups',
  },
  capacity: { std: 30, ext: 35 },
  modes: ['safe', 'semi', 'auto'],
  defaults: { metal: 'black', poly: 'black', pad: 'alu', optic: 'none', laser: 'none', light: 'none', muzzle: 'none', grip: 'none', stock: 'collapsed', mag: 'std' },
  slots: { optic: ['none', 'rds', 'holo'], magnifier: true, laser: ['none', 'peq'], light: ['none', 'rifle'], muzzle: ['none', 'comp', 'sd'], grip: ['none', 'stubby', 'angled', 'handstop'], stock: ['collapsed', 'extended'] },
  stockTravel: 150,
  recoil: { kick: 6, rise: 1.6, slide: 0 },
  sound: { kind: 'smg', blastTau: 0.02, lp: 5000, boom: [150, 48, 0.08], crack: 0, mech: [0.01, 0.028], gain: 1 },
  mounts: {
    rail: { x0: 22, x1: 212, y: 206, claw: [70, 175] },
    optic: { x: 112, y: 206 },
    magnifier: { x: 22, y: 206 },
    laser: { x: 300, y: 134, side: true },
    light: { x: 340, y: 106, under: true },
    grip: { x: 306, y: 106 },
    muzzle: { x: 448, y: 150, r: 11 },
    sd: { x0: 296, x1: 612, r: 26 },
    eject: { x: 214, y: 176 },
    pivot: { x: -120, y: 140 },
    magAxis: [0.3, -1],
    selector: { x: 122, y: 112, angles: { safe: 50, semi: 0, auto: -50 } },
  },
  parts: [
    // boîtier de culasse tôle emboutie
    { k: 'metal', d: 'M 6 124 L 300 124 L 300 176 L 6 176 C 2 176 0 174 0 170 L 0 130 C 0 126 2 124 6 124 Z' },
    { k: 'line', d: 'M 8 168.5 L 296 168.5 M 8 131 L 296 131' },
    { k: 'hl', d: 'M 4 175 L 298 175' },
    { k: 'steel', d: 'M 18 176 L 18 186 C 18 192 22 196 30 196 L 44 196 C 50 196 54 192 54 186 L 54 176 Z' },
    { k: 'dark', d: circle(36, 186, 3.5) },
    // tube d'armement + levier
    { k: 'metal', d: 'M 296 160 L 404 160 L 404 179 L 296 179 Z' },
    { k: 'dark', d: 'M 306 168 L 372 168 L 372 171 L 306 171 Z' },
    { g: 'cock', k: 'steel', d: 'M 349 167 L 361 167 L 373 187 C 375 192 372 196 367 196 C 362 196 358 192 357 188 Z' },
    // avant (masqué en version SD)
    { g: 'front', k: 'metal', d: 'M 376 179 L 376 200 C 376 206 380 208 388 208 L 398 208 C 404 208 406 204 406 200 L 406 179 Z' },
    { g: 'front', k: 'dark', d: circle(391, 197, 5) },
    { g: 'front', k: 'steel', d: 'M 395 142 L 420 142 L 420 158 L 395 158 Z' },
    { g: 'muzzleStd', k: 'steel', d: 'M 418 139 L 448 139 L 448 161 L 418 161 Z' },
    { g: 'muzzleStd', k: 'line', d: 'M 426 139 L 426 161 M 436 139 L 436 161' },
    // garde-mains : classique ou tri-rail (choisi automatiquement)
    { g: 'hgSlim', k: 'poly', d: 'M 290 124 L 292 160 L 396 160 C 401 160 403 156 402 150 L 398 122 C 397 116 392 112 385 112 L 302 110 C 295 110 290 116 290 124 Z' },
    { g: 'hgSlim', k: 'line', d: ribs(300, 392, 120, 152, 8) },
    { g: 'hgRail', k: 'black', d: 'M 290 158 L 404 158 L 404 108 C 404 106 402 105 400 105 L 294 105 C 292 105 290 106 290 108 Z' },
    { g: 'hgRail', k: 'black', d: picatinny(296, 400, 105, -1, 6) },
    { g: 'hgRail', k: 'rail', d: rect(296, 128, 400, 141) },
    { g: 'hgRail', k: 'line', d: serrations(298, 398, 128, 141, 10.01) },
    // carcasse Navy (polymère) + poignée
    { k: 'poly', d: 'M 104 124 L 248 124 L 248 104 C 248 100 246 98 242 98 L 200 98 C 196 80 192 74 184 72 L 166 72 C 160 72 158 76 160 82 L 164 98 L 150 98 C 148 70 142 30 136 8 C 134 2 130 0 124 0 L 102 0 C 96 0 93 4 94 10 C 100 40 106 70 108 98 L 106 98 C 104 100 104 104 104 108 Z' },
    { k: 'dark', d: 'M 170 96 L 167 84 C 166 79 168 77 172 77 L 182 77 C 187 77 190 81 192 88 L 194 96 Z' },
    { k: 'black', d: 'M 176 96 C 175 90 175 85 178 81 L 181 81 C 180 86 180 91 182 96 Z' },
    { k: 'line', d: 'M 104 68 C 110 64 116 64 120 68 M 102 48 C 108 44 114 44 118 48 M 100 28 C 106 24 112 24 116 28 M 106 110 L 246 110' },
    { k: 'pict', d: circle(108, 122, 1.6) },
    { k: 'pictRed', d: circle(122, 126, 1.6) + circle(135, 122, 1.6) + circle(138, 117, 1.6) },
    // puits de chargeur
    { k: 'metal', d: 'M 236 124 L 268 124 L 268 98 L 236 98 Z' },
    // chargeur courbe
    { g: 'mag', k: 'black', d: 'M 238 100 C 240 50 250 -10 276 -64 L 306 -54 C 284 -4 270 50 266 100 Z' },
    { g: 'mag', k: 'line', d: 'M 244 80 C 246 50 252 10 268 -30 M 258 80 C 262 50 270 10 288 -30' },
    { g: 'magExt', k: 'pad', d: 'M 276 -64 L 306 -54 L 298 -79 L 268 -89 Z' },
    // crosse A3 rétractable
    { g: 'stock', k: 'black', d: rect(-112, 158, 160, 166, 3) + ' ' + rect(-112, 132, 160, 140, 3) },
    { g: 'stock', k: 'rubber', d: 'M -130 70 C -122 70 -114 72 -112 80 L -108 170 C -108 176 -112 178 -118 178 L -128 178 C -134 178 -136 174 -136 168 L -138 80 C -138 74 -136 70 -130 70 Z' },
    { g: 'stock', k: 'line', d: ribs(-134, -112, 82, 170, 6) },
  ],
};
