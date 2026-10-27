// Glock 17 Gen5 MOS — profil gauche, millimètres réels (x : arrière de culasse → bouche, y : bas de crosse → haut).
import { picatinny, serrations, rect, circle } from '../shapes.js';

export default {
  id: 'glock17',
  maker: 'Glock',
  name: 'Glock 17 Gen5 MOS',
  short: 'G17 Gen5',
  mark: 'G17',
  type: 'pistol',
  variant: 'Pistolet de dotation · culasse MOS',
  specs: {
    caliber: '9×19 mm Parabellum', action: 'Safe Action · culasse calée (Browning modifié)',
    barrel: '114 mm · Glock Marksman Barrel', length: 202, weight: 640, rof: null,
    v0: 360, bullet: 8.0, feed: 'Chargeur 17 coups',
  },
  capacity: { std: 17, ext: 22 },
  modes: ['safe', 'semi'],
  defaults: { metal: 'black', poly: 'black', pad: 'red', optic: 'none', light: 'none', muzzle: 'none', mag: 'std' },
  slots: { optic: ['none', 'rds'], light: ['none', 'pistol'], laser: false, muzzle: ['none', 'comp', 'sup'], grip: false, stock: false, magnifier: false },
  recoil: { kick: 9, rise: 5.5, slide: 26 },
  sound: { kind: 'pistol', blastTau: 0.016, lp: 5200, boom: [180, 55, 0.07], crack: 0, mech: [0.012, 0.034], gain: 1 },
  mounts: {
    optic: { x: 30, y: 136, on: 'slide' },
    light: { x: 132, y: 91 },
    muzzle: { x: 186, y: 121, r: 6.5, thread: 12 },
    eject: { x: 102, y: 134 },
    pivot: { x: 25, y: 50 },
    magAxis: [-0.3, -1],
  },
  parts: [
    // carcasse polymère
    { k: 'poly', d: 'M 4 108 L 180 108 L 180 103 C 180 98 177 96 172 96 L 128 96 C 126 96 125 95 124 93 C 122 84 121 76 118 72 C 116 69 112 68 107 68 L 88 68 C 84 68 82 70 80 73 L 76 82 C 72 60 64 30 60 10 L 60 6 L -24 6 L -24 10 C -20 40 -12 70 -6 92 C -9 95 -10 98 -7 101 C -4 103 0 104 4 104 Z' },
    { k: 'stipple', d: 'M -14 20 L 54 20 C 58 40 64 62 70 78 L -4 86 C -8 60 -12 40 -14 20 Z' },
    { k: 'dark', d: 'M 89 92 C 87 92 86 90 86 88 L 88 77 C 89 74 91 73 94 73 L 106 73 C 110 73 113 75 114 79 L 116 89 C 116 91 115 92 113 92 Z' },
    { k: 'poly', d: picatinny(130, 172, 96, -1, 5) },
    { k: 'black', d: 'M 99 92 C 98 86 97 81 99 77 L 103 77 C 102 81 102 86 104 92 Z' },
    { k: 'black', d: 'M 100.5 88 L 101.5 80' },
    { k: 'steel', d: 'M 58 104.5 L 80 104.5 L 82 107.5 L 60 108 Z' },
    { k: 'steel', d: rect(99, 100, 108, 105.5, 1) },
    { k: 'black', d: rect(75, 84, 83, 91, 1) },
    { k: 'line', d: 'M -22 12 L 59 12 M 0 104 L 178 104' },
    // culasse
    { g: 'slide', k: 'metal', d: 'M 2 108 L 182 108 C 185 108 186 110 186 112 L 186 128 C 186 132 184 134 181 135 L 178 136 L 6 136 C 3 136 1 135 0 133 L 0 112 C 0 110 0.5 108 2 108 Z' },
    { g: 'slide', k: 'line', d: serrations(6, 34, 111, 133, 3.4) + serrations(152, 176, 111, 133, 3.4) },
    { g: 'slide', k: 'hl', d: 'M 4 134.5 L 178 134.5 M 186 113 L 186 127' },
    { g: 'slide', k: 'steel', d: 'M 84 131.5 L 122 131.5 L 122 136 L 84 136 Z' },
    { g: 'slide', k: 'black', d: 'M 8 136 L 8 142 L 20 142 L 20 136 Z M 174 136 L 175 141 L 180 141 L 180 136 Z' },
    { g: 'mosplate', k: 'black', d: rect(30, 135.5, 62, 138.5, 0.8) },
    { k: 'steel', d: 'M 186 115.5 L 187.5 115.5 L 187.5 127 L 186 127 Z' },
    // chargeur
    { g: 'mag', k: 'poly', d: 'M -25 6 L 60 6 L 61 1 C 61 0 60 -1 58 -1 L -23 -1 C -25 -1 -26 0 -26 1 Z' },
    { g: 'magExt', k: 'pad', d: 'M -27 6 L 62 6 L 62 -20 C 62 -23 60 -25 57 -25 L -22 -25 C -25 -25 -27 -23 -27 -20 Z' },
    { g: 'magExt', k: 'line', d: 'M -24 -6 L 59 -6 M -24 -11 L 59 -11 M -24 -16 L 59 -16' },
  ],
};
