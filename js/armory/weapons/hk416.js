// Heckler & Koch HK416 A5 (canon 14,5") — données, modèle 3D, points de montage (mm, depuis la bouche) et profil sonore.

export default {
  id: 'hk416',
  maker: 'Heckler & Koch',
  name: 'HK416 A5',
  short: 'HK416 A5',
  mark: '416',
  type: 'rifle',
  // Modèle 3D (assets/models/selection.json) : un seul mesh, découpé par zones.
  model: {
    file: 'assets/models/hk416.glb', rotate: [0, 180, 0],
    cutRaw: { z: -4.5 }, // chargeur et cartouches posés à côté de l'arme
    magBox: { x: [-0.045, 0.04], y: [-1, -0.035] }, stockBox: { x: [-1, -0.25], y: [-1, 1] }, stockMove: 0.06,
    metal: /^material$|Sights/,
  },
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
};
