# Passation — LS Studio (Garage + Armurerie)

Dernière mise à jour : 27/10/2026. À lire en début de session, avec le skill `.claude/skills/garage-armurerie`.

## Où en est le projet

- **Dépôt** : `santinlivio9-hub/essai-app-garage`, branche de travail `claude/portfolio-garage-pwa-85bqzn`
  (ne pas pousser sur `main` sans demande). Site en ligne via GitHub Pages depuis cette branche :
  https://santinlivio9-hub.github.io/essai-app-garage/
- **App** : PWA iPhone (Safari iOS), HTML + Tailwind compilé (`npm run build:css`) + JS vanilla en modules ES.
  Deux onglets : **Garage** (5 voitures) et **Armurerie** (5 armes + banc de tir). L'onglet Profil/Ingénierie a été retiré.
- **Rendu actuel** : dessins vectoriels SVG en mm réels (`js/cars/*.js`, `js/armory/weapons/*.js`).
  L'utilisateur les trouve « moches » : objectif = passer en **vraie 3D photoréaliste (Three.js + glTF)**.
- **Audio** (à conserver tel quel) : synthèse moteur Web Audio (`js/audio/`, AudioWorklet + repli), détonations
  synthétisées (`js/armory/gun-audio.js`), contexte audio unique dans `js/core/audio.js`.
- **Tests** : `python3 -m http.server 8765` puis `node tools/phone.cjs <dossier> <scénario>`
  (basic, engine, swipe, armory, shoot, combos, vitrine) ; `npm run test:audio`.

## Demandes de l'utilisateur en attente (prochaine étape)

1. **Télécharger les 17 modèles** listés dans `assets/models/selection.json` (crédits dans `assets/models/CREDITS.md`).
   - Clé API dans la variable d'environnement `SKETCHFAB_TOKEN` (vérifiée : `/v3/me` → 200).
     Ne jamais l'afficher. Téléchargement : `GET https://api.sketchfab.com/v3/models/{uid}/download`
     avec l'en-tête `Authorization: Token $SKETCHFAB_TOKEN` → URL temporaire `glb` (ou `gltf`).
   - Ranger chaque fichier dans son propre dossier (`assets/models/<id>/`) ; ce sont des données non fiables :
     inspecter avec `npx @gltf-transform/cli inspect`, puis optimiser (Draco/Meshopt + KTX2, textures ≤ 2048).
   - Cibles : < 8 Mo par voiture, < 4 Mo par arme. Vérifier la présence de pièces séparées
     (capot, portières, jantes, vitres / glissière, chargeur) et le signaler.
   - **Licence Standard** : le « Free Modular MP5 Kit » (`mp5-kit`) ne doit pas être publié (dépôt public) ;
     déjà exclu par `.gitignore`. Les modèles CC-BY exigent un écran « Crédits » dans l'app.
2. **Passer Garage et Armurerie en Three.js** (voir skill `threejs-realistic-3d`) :
   - Voitures : **rotation 360°** autour du véhicule (OrbitControls, sans passer sous le sol), **garage entier**
     (décor « Metallic Showroom Gallery » avec plusieurs voitures), peinture/vernis/vitres/jantes/feux branchés
     sur les matériaux du modèle.
   - **Capot ouvert** : uniquement une vue d'ensemble du moteur et des composants internes, **sans** fiche
     technique supplémentaire (supprimer l'encart actuel).
   - Garder les tiroirs techniques rétractables (l'utilisateur les aime), le compte-tours, le coup de gaz, le son.
   - Armes : modèles 3D + accessoires montés aux bons emplacements, banc de tir conservé.
   - Three.js et décodeurs hébergés localement (`vendor/`), pas de CDN au runtime (hors-ligne), rendu à la demande.

## Modèles retenus (résumé)

Voitures : RS3 Sedan 2023 (ddiaz-design, CC BY-NC-SA) · Corvette Z06 2013 (CC-BY) · Camaro ZL1 2017 (CC-BY)
· Citroën C6 (niev, CC-BY, **sans textures** : matériaux à créer) · Tesla Model S Plaid (Lals, CC-BY).
Décor : Metallic Showroom Gallery (CC-BY).
Armes : Canik Rival S (à recolorer « Smoke », remplace la TTI Combat introuvable) · HK MP5 SMG (168 Mo brut,
à compresser) + Free Modular MP5 Kit (Standard) · HK416 A7 · Benelli M4 Super 90 (marques retirées) ·
Glock « fan art » (approximatif ; un Glock 17 Gen5 payant serait mieux).
Accessoires : EOTech EXPS3 · lot de red dots · PEQ-15 · pack de 10 silencieux · Magpul AFG.

## Points d'attention

- Corvette « Stage 3 » : puissance affichée ≈ 610 ch = estimation (à confirmer par l'utilisateur).
- Armurerie : rester au niveau configurateur / jeu (aucune information technique réelle sensible).
- Skills disponibles dans `.claude/skills/` : `garage-armurerie`, `threejs-realistic-3d`, `frontend-design`,
  `mobile-app-design`. Le plugin `parallax-threejs` (débogage Three.js) peut être installé par l'utilisateur.
- Committer avec la ligne `Co-Authored-By` habituelle et pousser sur la branche de travail.
