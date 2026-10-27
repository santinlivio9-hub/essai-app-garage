// Contenu du portfolio — à personnaliser librement (textes, projets, liens de contact).
// Les champs de contact laissés vides ne sont pas affichés.

export const PROFILE = {
  name: 'Livio Santin',
  initials: 'LS',
  role: 'Génie Mécanique & Productique · BUT GMP',
  pitch: 'Étudiant en <strong>BUT Génie Mécanique et Productique</strong>, en route vers le <strong>cycle ingénieur</strong>. J’allie rigueur théorique, maîtrise de la <strong>CAO de pointe</strong> et une vraie passion pour la mécanique — de la conception numérique jusqu’à la pièce usinée.',
  facts: [
    { icon: '⚙️', label: 'BUT GMP' },
    { icon: '🎓', label: 'Futur cycle ingénieur' },
    { icon: '✈️', label: 'Élève pilote PPL(A)' },
    { icon: '🎖️', label: 'Réserviste AAE' },
  ],
  contact: {
    email: '', // ex. 'prenom.nom@exemple.fr'
    linkedin: '', // ex. 'https://www.linkedin.com/in/...'
    github: 'https://github.com/santinlivio9-hub',
  },
};

export const SKILLS = [
  {
    icon: 'cad',
    title: 'Modélisation & Conception 3D',
    text: 'Conception volumique et surfacique, assemblages complexes, mise en plan et cotation fonctionnelle.',
    tags: ['CATIA V5', 'Surfaces', 'Assemblages', 'Mise en plan'],
  },
  {
    icon: 'cnc',
    title: 'Usinage & FAO',
    text: 'Programmation commande numérique, gammes et contrats de phase, simulation et vérification des trajectoires avant usinage.',
    tags: ['Programmation CN', 'VERICUT', 'Gammes', 'Conditions de coupe'],
  },
  {
    icon: 'robot',
    title: 'Robotique & Automatisation',
    text: 'Implantation et simulation de cellules robotisées : trajectoires, zones d’interférence, temps de cycle.',
    tags: ['FANUC Roboguide', 'Cellules', 'Temps de cycle'],
  },
  {
    icon: 'print',
    title: 'Prototypage rapide',
    text: 'Du fichier CAO au prototype physique : tranchage, réglages d’impression FDM et découpe.',
    tags: ['Impression 3D FDM', 'Cura', 'Creality CR-10', 'Découpe'],
  },
  {
    icon: 'plane',
    title: 'Rigueur aéronautique',
    text: 'Élève pilote PPL(A) : discipline des check-lists, préparation et navigation, prise de décision sous contrainte.',
    tags: ['Check-lists', 'Navigation', 'Facteurs humains'],
  },
  {
    icon: 'shield',
    title: 'Esprit d’équipe & engagement',
    text: 'Réserve opérationnelle dans l’Armée de l’Air et de l’Espace : discipline, réactivité, sens du collectif.',
    tags: ['Réserve opérationnelle', 'Discipline', 'Réactivité'],
  },
  {
    icon: 'team',
    title: 'Gestion de projet & esprit d’entreprise',
    text: 'Direction d’une association sportive tactique (airsoft) : événementiel, logistique de terrain, budget et conception d’outils web.',
    tags: ['Direction associative', 'Logistique', 'Événementiel', 'Outils web'],
  },
];

export const PROJECTS = [
  { key: 'CAO', art: 'cad', title: 'Assemblage mécanique sous CATIA V5', text: 'Modélisation paramétrique de pièces, contraintes d’assemblage, surfaces de style et mise en plan cotée.', tags: ['CATIA V5', 'GSD', 'Assembly Design'] },
  { key: 'FAO', art: 'cnc', title: 'Chaîne numérique & simulation VERICUT', text: 'De la gamme d’usinage au programme CN, validation des trajectoires et détection des collisions en simulation.', tags: ['FAO', 'VERICUT', 'ISO'] },
  { key: 'ROBOT', art: 'robot', title: 'Cellule robotisée FANUC', text: 'Implantation d’une cellule sous Roboguide : positionnement, trajectoires, optimisation du temps de cycle.', tags: ['Roboguide', 'Simulation'] },
  { key: 'PROTO', art: 'print', title: 'Prototypage FDM', text: 'Itérations rapides de pièces fonctionnelles : orientation, supports, remplissage et tolérances d’ajustement.', tags: ['Cura', 'CR-10', 'PLA / PETG'] },
  { key: 'WEB', art: 'web', title: 'Outils web associatifs', text: 'Conception d’outils en ligne pour l’organisation d’événements tactiques : inscriptions, logistique, communication.', tags: ['Web', 'Organisation'] },
  { key: 'APP', art: 'car', title: 'Garage Studio (cette app)', text: 'PWA iPhone : rendu par calques vectoriels, synthèse moteur temps réel Web Audio, interface HUD glassmorphism.', tags: ['PWA', 'Web Audio', 'SVG'] },
];

export const TIMELINE = [
  { when: 'En cours', title: 'BUT Génie Mécanique & Productique', text: 'Conception, industrialisation, méthodes, usinage, matériaux et dimensionnement.' },
  { when: 'Objectif', title: 'Cycle ingénieur', text: 'Poursuite d’études vers un diplôme d’ingénieur en mécanique / productique.', future: true },
  { when: 'Formation', title: 'Élève pilote PPL(A)', text: 'Pilotage avion, navigation et procédures.' },
  { when: 'Engagement', title: 'Réserve opérationnelle — Armée de l’Air et de l’Espace', text: 'Discipline, réactivité, engagement au service du collectif.' },
  { when: 'Associatif', title: 'Direction d’association sportive tactique', text: 'Gestion d’événements, logistique de terrain, encadrement et outils numériques.' },
];
