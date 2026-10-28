// Benelli M4 (Super 90) — données, modèle 3D, points de montage (mm, depuis la bouche) et profil sonore.

export default {
  id: 'benelli',
  maker: 'Benelli',
  name: 'Benelli M4 Super 90',
  short: 'Benelli M4',
  type: 'shotgun',
  // Modèle 3D (assets/models/selection.json).
  model: {
    file: 'assets/models/benelli.glb', rotate: [0, -90, 0],
    remove: /12g_12gauge/, // cartouche posée à côté
    bolt: /bolt_TTI/, stockBox: { x: [-1, -0.2], y: [-1, 1] }, stockMove: 0.07,
    metal: /TTI_Benelli|matchsaverz/,
  },
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
};
