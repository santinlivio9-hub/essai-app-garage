// Glock 17 Gen5 MOS — données, modèle 3D, points de montage (mm, depuis la bouche) et profil sonore.

export default {
  id: 'glock17',
  maker: 'Glock',
  name: 'Glock 17 Gen5 MOS',
  short: 'G17 Gen5',
  type: 'pistol',
  // Modèle 3D (assets/models/selection.json) : un seul matériau, glissière découpée par la hauteur.
  model: {
    file: 'assets/models/glock17.glb', rotate: [0, 180, 0],
    slideAbove: 0.03, mag: /Cube022/, metal: /Material\.001/, poly: /Material\.001/,
  },
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
};
