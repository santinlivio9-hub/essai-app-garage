# Passation — LS Studio (Garage + Armurerie)

Dernière mise à jour : 27/10/2026. À lire en début de session, avec les skills `.claude/skills/garage-armurerie`
et `.claude/skills/threejs-realistic-3d`.

## Où en est le projet

- **Dépôt** : `santinlivio9-hub/essai-app-garage`, branche de travail `claude/download-selection-models-6n3u11`
  (contient aussi l'historique de `claude/portfolio-garage-pwa-85bqzn`). Ne pas pousser sur `main` sans demande.
- **App** : PWA iPhone (Safari iOS), HTML + Tailwind compilé + JS vanilla (modules ES) + Three.js r170 local
  (`vendor/three`, importmap dans `index.html`). Deux onglets : **Garage** et **Armurerie**, tous deux en 3D.
- **Modèles** : 17 modèles Sketchfab (`assets/models/selection.json`, crédits `CREDITS.md` + fiches de l'app).
  `npm run models:fetch` (jeton `SKETCHFAB_TOKEN`, jamais affiché) → `assets/models/src/` (non versionné),
  `npm run models:optimize` → GLB Meshopt + WebP ≤ 2048 dans `assets/models/` (≈ 17 Mo versionnés).
  `mp5-kit` (licence Standard) : téléchargé, jamais publié (`.gitignore`).
- **Garage 3D** (`js/garage/scene3d.js`) : showroom à l'échelle 0,035 ; voitures entre les piliers
  (`SLOTS`), caméra bornée (`BOUNDS`) ; tout élément du décor entre caméra et voiture est découpé dans le shader.
  Peinture / vernis / vitres / jantes / étriers / phares pilotés par les matériaux nommés dans le bloc `model`
  de chaque `js/cars/<id>.js`. Capot et portière articulés : Corvette et C6 seulement (pièces séparées).
- **Armurerie 3D** (`js/armory/scene3d.js`) : armes orientées bouche vers +X, à la longueur réelle ; points de
  montage = cotes mm des fiches (depuis la bouche), recalées par lancer de rayons sur la surface du modèle.
  Pièces mobiles par nom ou par zone (`magBox`, `stockBox`, `slideAbove`). Une seule arme en mémoire à la fois.
- **Audio** inchangé (Web Audio, `js/audio/`, `js/armory/gun-audio.js`).
- **Tests** : `npm run test:audio` ; `python3 -m http.server 8765` puis `node tools/phone.cjs <dossier> <scénario>`
  (WebGL logiciel : lent, compter 1 à 3 min par scénario).

## Limites connues / pistes

- Textures en WebP (KTX2 impossible ici : `toktx` non installable). WebP = léger à télécharger mais plus de
  mémoire GPU ; passer en KTX2 si l'outil devient disponible.
- RS3 (471 k triangles) et Camaro (338 k) au-dessus de la cible de 300 k ; simplification automatique écartée
  (abîme les normales). Version allégée à faire à la main si l'iPhone peine.
- RS3, Camaro, Tesla : capot / portières non séparés dans le modèle → options masquées pour ces voitures.
- Tesla : un seul matériau d'origine, réparti par mesh (`meshes` dans `js/cars/tesla.js`).
- Lampes, compensateur, poignée courte, butée, talon de chargeur : pièces simples générées (pas de modèle dédié).
- Sélecteur de tir non animé (pièce non séparée dans les modèles).
- À valider sur un vrai iPhone : fluidité, mémoire (garage ≈ 100 Mo de textures GPU), rendu des matériaux.

## Points d'attention

- Corvette « Stage 3 » : puissance affichée ≈ 610 ch = estimation (à confirmer par l'utilisateur).
- Armurerie : rester au niveau configurateur / jeu (aucune information technique réelle sensible).
- Committer avec la ligne `Co-Authored-By` habituelle et pousser sur la branche de travail.
