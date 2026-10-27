// Contenu de l'onglet Profil & Ingénierie — à personnaliser librement.
// Les champs de contact laissés vides ne sont pas affichés.

export const PROFILE = {
  name: 'Livio Santin',
  initials: 'LS',
  role: 'BUT Génie Mécanique & Productique · orientation ingénieur mécanique',
  pitch: 'Étudiant en <strong>BUT GMP</strong> en route vers le <strong>cycle ingénieur mécanique</strong>, <strong>réserviste opérationnel</strong> de l’Armée de l’Air et de l’Espace et <strong>élève pilote PPL(A)</strong>. Une même exigence relie ces univers : la rigueur — de la cotation d’une pièce à la check-list d’un vol solo.',
  facts: [
    { icon: 'gear', label: 'BUT GMP' },
    { icon: 'cap', label: 'Orientation ingénieur' },
    { icon: 'shield', label: 'Réserviste AAE' },
    { icon: 'plane', label: 'Élève pilote PPL(A)' },
  ],
  contact: {
    email: '', // ex. 'prenom.nom@exemple.fr'
    linkedin: '', // ex. 'https://www.linkedin.com/in/...'
    github: 'https://github.com/santinlivio9-hub',
  },
};

// Pôles de compétences (cartes interactives : toucher pour déplier).
export const POLES = [
  {
    icon: 'cad',
    title: 'Conception & RDM',
    summary: 'Modélisation CAO, tolérancement et dimensionnement.',
    points: [
      'Modélisation volumique, surfacique et assemblages complexes sous CATIA V5',
      'Tolérancement géométrique (GPS / ISO) et cotation fonctionnelle, chaînes de cotes',
      'Dimensionnement mécanique : statique, RDM (traction, flexion, torsion), roulements',
    ],
    tags: ['CATIA V5', 'GPS / ISO', 'Chaînes de cotes', 'RDM'],
  },
  {
    icon: 'cnc',
    title: 'Usinage & Robotique industrielle',
    summary: 'Chaîne numérique de la FAO à la cellule robotisée.',
    points: [
      'Programmation FAO, gammes d’usinage et contrats de phase',
      'Simulation et vérification des trajectoires sous VERICUT avant passage machine',
      'Intégration robotique et simulation de cellules sous FANUC Roboguide',
    ],
    tags: ['FAO', 'VERICUT', 'FANUC Roboguide', 'Gammes'],
  },
  {
    icon: 'print',
    title: 'Fabrication additive',
    summary: 'Du fichier CAO au prototype fonctionnel.',
    points: [
      'Tranchage sous Cura : orientation, supports, remplissage, paramètres matière',
      'Prototypage fonctionnel sur Creality CR-10 et itérations rapides',
      'Prise en compte des jeux et ajustements propres au FDM',
    ],
    tags: ['Cura', 'CR-10', 'FDM', 'Prototypage'],
  },
  {
    icon: 'plane',
    title: 'Culture aéronautique & sécurité',
    summary: 'La discipline du vol appliquée à l’ingénierie.',
    points: [
      'Rigueur des check-lists, y compris en vol solo',
      'Gestion des paramètres machine sous contrainte temporelle',
      'Préparation, navigation et prise de décision structurée',
    ],
    tags: ['PPL(A)', 'Check-lists', 'Facteurs humains'],
  },
  {
    icon: 'team',
    title: 'Engagement & logistique de terrain',
    summary: 'Réserve militaire, encadrement et outils web.',
    points: [
      'Réserve opérationnelle de l’Armée de l’Air et de l’Espace : discipline et réactivité',
      'Encadrement associatif tactique (airsoft) : événementiel et logistique de terrain',
      'Conception d’outils web pour l’organisation et la communication',
    ],
    tags: ['Réserve AAE', 'Encadrement', 'Logistique', 'Web'],
  },
];

export const PROJECTS = [
  { key: 'CAO', art: 'cad', title: 'Assemblage mécanique sous CATIA V5', text: 'Modélisation paramétrique, contraintes d’assemblage, surfaces de style et mise en plan cotée.', tags: ['CATIA V5', 'Assembly Design'] },
  { key: 'FAO', art: 'cnc', title: 'Chaîne numérique & VERICUT', text: 'De la gamme d’usinage au programme CN, validation des trajectoires et détection des collisions.', tags: ['FAO', 'VERICUT'] },
  { key: 'ROBOT', art: 'robot', title: 'Cellule robotisée FANUC', text: 'Implantation sous Roboguide : positionnement, trajectoires, temps de cycle.', tags: ['Roboguide'] },
  { key: 'PROTO', art: 'print', title: 'Prototypage FDM', text: 'Pièces fonctionnelles : orientation, supports, remplissage et tolérances.', tags: ['Cura', 'CR-10'] },
  { key: 'WEB', art: 'web', title: 'Outils web associatifs', text: 'Inscriptions, logistique et communication pour des événements tactiques.', tags: ['Web'] },
  { key: 'APP', art: 'car', title: 'Cette application', text: 'PWA iPhone : rendu vectoriel par calques, synthèse audio temps réel, interface HUD.', tags: ['PWA', 'Web Audio', 'SVG'] },
];

export const TIMELINE = [
  { when: 'En cours', title: 'BUT Génie Mécanique & Productique', text: 'Conception, industrialisation, méthodes, usinage, matériaux et dimensionnement.' },
  { when: 'Objectif', title: 'Cycle ingénieur mécanique', text: 'Poursuite d’études vers un diplôme d’ingénieur.', future: true },
  { when: 'Formation', title: 'Élève pilote PPL(A)', text: 'Pilotage avion, vol solo, navigation et procédures.' },
  { when: 'Engagement', title: 'Réserve opérationnelle — Armée de l’Air et de l’Espace', text: 'Discipline, réactivité, engagement au service du collectif.' },
  { when: 'Associatif', title: 'Encadrement d’association sportive tactique', text: 'Événementiel, logistique de terrain, encadrement et outils numériques.' },
];
