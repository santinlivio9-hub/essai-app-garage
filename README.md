# Livio Santin — Ingénierie · Garage · Armurerie

PWA mobile optimisée pour iPhone / Safari iOS : plein écran, safe areas, `100dvh`, zéro scroll parasite, hors-ligne.
Trois volets accessibles par la barre de navigation translucide :

1. **Ingénierie** — profil GMP / aéronautique, pôles de compétences dépliables, projets, parcours.
2. **Garage** — showroom de 5 véhicules : vernis, teintes, jantes, vitres teintées, feux de jour / projecteurs,
   capot avec baie moteur animée, synthèse moteur temps réel (Web Audio) avec compte-tours et coup de gaz.
3. **Armurerie** — configurateur modulaire de 5 armes (accessoires montés à leur emplacement mécanique) et banc de
   tir : sélecteur Safe / Semi / Auto, cadence réelle, rechargement animé, recul, flamme de bouche, éjection des
   douilles, cible avec groupement, détonations synthétisées (avec / sans silencieux).

HTML5 + Tailwind CSS (compilé en fichier statique) + JavaScript vanilla en modules ES. Aucune dépendance au runtime,
aucun fichier image ou son : tout est vectoriel (SVG) ou synthétisé dans le navigateur.

## Lancer

```bash
python3 -m http.server 8000      # puis http://localhost:8000
```

Le son démarre au premier geste (START dans le Garage, FIRE dans l'Armurerie). Sur iPhone, il sort même avec le
bouton silencieux activé. Installation : Safari → Partager → **Sur l'écran d'accueil**.

### Développement

```bash
npm install            # Tailwind CLI (dépendance de dev uniquement)
npm run build:css      # régénère css/tailwind.css après modification des classes utilitaires
npm run test:audio     # bancs d'essai hors-ligne : moteurs + détonations (niveaux, brillance, durée)
```

Après un déploiement, incrémenter `VERSION` dans `sw.js`.

## Architecture

```
index.html                     Les 3 vues + barre de navigation
css/tailwind.css               Utilitaires Tailwind compilés (source : css/tailwind.src.css)
css/app.css                    Design tokens, glassmorphism, studios, HUD, tiroirs, matériaux SVG
js/main.js                     Navigation, chargement différé des univers, garde-fous tactiles iOS, SW
js/core/                       Partagé : contexte audio unique (déverrouillage iOS), tiroir, utilitaires
js/profile/data.js             ✏️ Contenu du profil (textes, pôles, projets, contacts)
js/cars/*.js                   Un fichier par véhicule : géométrie en mm réels, teintes, specs, profil sonore
js/garage/                     Rendu par calques, jantes, rayons X moteur, compte-tours, contrôleur
js/audio/                      Simulation mécanique + DSP moteur (AudioWorklet, repli ScriptProcessor)
js/armory/weapons/*.js         Une arme par fichier : pièces en mm réels, points de montage, specs, signature sonore
js/armory/accessories.js       Optiques, magnifier, PEQ-15, lampes, bouche, poignées, douilles
js/armory/renderer.js          Caméra auto-cadrée, recul à ressort, culasse, flamme, faisceaux, particules
js/armory/gun-audio.js         Synthèse des détonations et bruits mécaniques + réverbération de stand
js/armory/target.js            Cible du banc de tir (dispersion selon optique, montée en rafale)
js/armory/armory.js            Contrôleur : configuration, tir, rechargement, fiche balistique
tools/                         Captures Playwright, bancs d'essai audio, génération d'icônes
```

## Personnaliser

- Profil : `js/profile/data.js` (les contacts laissés vides ne s'affichent pas).
- Véhicule : `js/cars/<id>.js` — arme : `js/armory/weapons/<id>.js`.

Les puissances de la Corvette Stage 3 sont des estimations typiques de ce niveau de préparation. L'Armurerie est
une simulation visuelle et sonore à vocation ludique et pédagogique.
