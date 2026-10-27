// Accessoires : catalogue (libellés, masses, allongement). Les modèles 3D sont dans armory/scene3d.js.

export const CATALOG = {
  optic: {
    none: { name: 'Organes d’origine' },
    rds: { name: 'Red dot RMR / 407C', mass: 45 },
    holo: { name: 'EOTech EXPS3', mass: 317 },
  },
  laser: {
    none: { name: 'Aucun' },
    peq: { name: 'PEQ-15 / NGAL', mass: 216 },
  },
  light: {
    none: { name: 'Aucune' },
    pistol: { name: 'SureFire X300 Ultra', mass: 130 },
    rifle: { name: 'SureFire Scout M600', mass: 160 },
  },
  muzzle: {
    none: { name: 'Bouche d’origine' },
    comp: { name: 'Compensateur ajouré', mass: 70, len: 46 },
    sup: { name: 'Silencieux détachable', mass: 380 },
    sd: { name: 'Modérateur intégral SD', mass: 520 },
    'comp-int': { name: 'Compensateur intégré', mass: 0 },
  },
  grip: {
    none: { name: 'Aucune' },
    stubby: { name: 'Poignée courte (stubby)', mass: 55 },
    angled: { name: 'Poignée inclinée (AFG)', mass: 60 },
    handstop: { name: 'Butée de main', mass: 25 },
  },
  stock: {
    collapsed: { name: 'Rétractée' },
    extended: { name: 'Déployée' },
  },
  mag: {
    std: { name: 'Standard' },
    ext: { name: 'Étendu + talon alu', mass: 45 },
  },
};
