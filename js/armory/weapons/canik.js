// Canik TTI Combat (Smoke) — données, modèle 3D, points de montage (mm, depuis la bouche) et profil sonore.

export default {
  id: 'canik',
  maker: 'Canik × Taran Tactical',
  name: 'Canik TTI Combat',
  short: 'TTI Combat',
  mark: 'TTI',
  type: 'pistol',
  // Modèle 3D (Canik Rival S, assets/models/selection.json) : pièces repérées par leur nom.
  model: {
    file: 'assets/models/canik.glb', rotate: [0, 180, 0],
    remove: /low001_mag|mag002/, // chargeurs posés à côté de l'arme
    slide: /_slide_low_0$/, mag: /mag001_mag|follower_low_mag|BezierCircle_low_mag|mag_exten/, magExt: /mag_exten/,
    optic: /optic_low|opt_plate|opt_mount/, // red dot d'origine, affiché avec l'option « Red dot »
    metal: /slide_low|comp_low/, poly: /frame_low/,
  },
  variant: 'Cérakote Smoke · compensateur intégré',
  specs: {
    caliber: '9×19 mm Parabellum', action: 'Culasse calée · percuteur lancé',
    barrel: '117 mm · compensateur taillé dans la culasse', length: 199, weight: 830, rof: null,
    v0: 365, bullet: 8.0, feed: 'Chargeur 18 coups',
  },
  capacity: { std: 18, ext: 23 },
  modes: ['safe', 'semi'],
  defaults: { metal: 'smoke', poly: 'black', pad: 'alu', optic: 'none', light: 'none', muzzle: 'comp-int', mag: 'std' },
  slots: { optic: ['none', 'rds'], light: ['none', 'pistol'], laser: false, muzzle: ['comp-int'], grip: false, stock: false, magnifier: false },
  recoil: { kick: 8, rise: 4, slide: 26 },
  sound: { kind: 'pistol', blastTau: 0.017, lp: 6200, boom: [190, 55, 0.07], crack: 0, mech: [0.012, 0.034], gain: 1.05, comp: true },
  mounts: {
    optic: { x: 28, y: 136, on: 'slide' },
    light: { x: 130, y: 89 },
    muzzle: { x: 199, y: 121, r: 7, integrated: true },
    vents: { x: 183, y: 134 },
    eject: { x: 100, y: 134 },
    pivot: { x: 25, y: 50 },
    magAxis: [-0.3, -1],
  },
};
