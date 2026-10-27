# LS Studio — Garage · Armurerie

PWA mobile optimisée pour iPhone / Safari iOS : plein écran, safe areas, `100dvh`, zéro scroll parasite, hors-ligne.
Deux volets accessibles par la barre de navigation translucide :

1. **Garage** — showroom 3D (Metallic Showroom Gallery) avec les 5 voitures sur leurs emplacements : rotation 360°
   autour de la voiture active, teintes et vernis PBR (brillant, métallisé, nacré, satiné, mat), vitres teintées,
   finition des jantes, étriers, feux de jour / projecteurs, capot et portière articulés (selon le modèle),
   synthèse moteur temps réel (Web Audio) avec compte-tours, coup de gaz, vibrations et retours de flamme.
2. **Armurerie** — configurateur 3D de 5 armes (accessoires montés à leur emplacement) et banc de tir :
   sélecteur Safe / Semi / Auto, cadence réelle, rechargement animé, recul, glissière, flamme de bouche, éjection
   des douilles, laser, lampe, cible avec groupement, détonations synthétisées (avec / sans silencieux).

HTML5 + Tailwind CSS (compilé en fichier statique) + JavaScript vanilla en modules ES + Three.js (r170, hébergé
dans `vendor/`, aucun CDN au runtime). Modèles glTF Sketchfab compressés (Meshopt + WebP), sons synthétisés.

## Lancer

```bash
python3 -m http.server 8000      # puis http://localhost:8000
```

Le son démarre au premier geste (START dans le Garage, FIRE dans l'Armurerie). Sur iPhone, il sort même avec le
bouton silencieux activé. Installation : Safari → Partager → **Sur l'écran d'accueil**.

### Développement

```bash
npm install                        # Tailwind, glTF Transform, Three.js (dépendances de dev uniquement)
npm run build:css                  # régénère css/tailwind.css après modification des classes utilitaires
npm run test:audio                 # bancs d'essai hors-ligne : moteurs + détonations
SKETCHFAB_TOKEN=… npm run models:fetch   # télécharge les originaux de assets/models/selection.json
npm run models:optimize            # compresse pour iPhone : assets/models/src → assets/models
node tools/vendor-three.cjs        # recopie Three.js dans vendor/three
node tools/phone.cjs <dossier> <scénario>   # captures iPhone (basic, engine, swipe, armory, shoot, combos, vitrine)
```

Après un déploiement, incrémenter `VERSION` dans `sw.js` (les modèles 3D sont mis en cache à leur premier chargement).

## Architecture

```
index.html                     Les 2 vues + barre de navigation ; importmap Three.js
css/app.css                    Design tokens, glassmorphism, studios, HUD, tiroirs
js/main.js                     Navigation, chargement différé des univers, garde-fous tactiles iOS, SW
js/core/stage3d.js             Socle 3D : rendu à la demande, IBL, orbite, chargement glTF, normalisation
js/core/                       Partagé : audio unique (déverrouillage iOS), tiroir, couleurs, crédits
js/cars/*.js                   Un fichier par véhicule : teintes, specs, modèle 3D (matériaux, pièces), son
js/garage/scene3d.js           Showroom, placement des voitures, matériaux, capot / portière, feux, caméra
js/garage/garage.js            Contrôleur : personnalisation, moteur, compte-tours, fiche technique
js/audio/                      Simulation mécanique + DSP moteur (AudioWorklet, repli ScriptProcessor)
js/armory/weapons/*.js         Une arme par fichier : specs, modèle 3D, points de montage (mm), son
js/armory/scene3d.js           Arme 3D, accessoires, teintes, recul, glissière, flamme, douilles, laser, lampe
js/armory/accessories.js       Catalogue des accessoires (libellés, masses)
js/armory/gun-audio.js         Synthèse des détonations et bruits mécaniques + réverbération de stand
js/armory/target.js            Cible du banc de tir (dispersion selon optique, montée en rafale)
js/armory/armory.js            Contrôleur : configuration, tir, rechargement, fiche balistique
assets/models/                 GLB optimisés, selection.json (sources), CREDITS.md (auteurs, licences)
tools/                         Téléchargement / optimisation des modèles, captures Playwright, bancs audio
```

## Personnaliser

- Véhicule : `js/cars/<id>.js` — arme : `js/armory/weapons/<id>.js` (bloc `model` pour le rendu 3D).
- Modèles 3D : `assets/models/selection.json`, puis `models:fetch` et `models:optimize`.

Les puissances de la Corvette Stage 3 sont des estimations typiques de ce niveau de préparation. L'Armurerie est
une simulation visuelle et sonore à vocation ludique et pédagogique. Les auteurs des modèles 3D sont crédités dans
les fiches de l'app et dans `assets/models/CREDITS.md`.
