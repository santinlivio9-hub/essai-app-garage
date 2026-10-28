// Heckler & Koch MP5A3 / MP5-SD — données, modèle 3D, points de montage (mm, depuis la bouche) et profil sonore.

export default {
  id: 'mp5',
  maker: 'Heckler & Koch',
  name: 'MP5A3',
  nameSD: 'MP5-SD',
  short: 'MP5A3',
  type: 'smg',
  // Modèle 3D (assets/models/selection.json).
  model: {
    file: 'assets/models/mp5.glb', rotate: [0, -90, 0],
    magBox: { x: [0.085, 0.145], y: [-1, -0.02] }, stock: /Buttstock/, stockMove: 0.035,
    metal: /Body|Mag__Barrel|Attachments/, poly: /Grip|Buttstock/,
  },
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
};
