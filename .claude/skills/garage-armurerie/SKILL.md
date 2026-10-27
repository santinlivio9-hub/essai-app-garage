---
name: garage-armurerie
description: Règles du projet « LS Studio » (PWA iPhone Garage + Armurerie) — direction visuelle, ergonomie, données techniques des 5 voitures et 5 armes, audio Web Audio, architecture du code et procédure de test. À charger avant toute modification de l'app (interface, véhicules, armes, sons, fiches techniques).
---

# Projet LS Studio — Garage & Armurerie

PWA mobile (Safari iOS d'abord) en HTML / Tailwind compilé / JavaScript vanilla (modules ES). Déployée sur
GitHub Pages depuis la branche de travail. L'onglet Ingénierie/Profil est **à retirer** : l'app ne garde que
**Garage** et **Armurerie**.

## Règles d'interface (non négociables)

1. **Viewport sanctuarisé** : la moitié haute de l'écran montre le véhicule ou l'arme, rien ne la masque
   (pas de pop-up, pas de carte opaque au centre).
2. **HUD verre** : conteneurs translucides `backdrop-filter: blur(16px)`, fond `rgba(255,255,255,.05)`,
   bordures fines ; thème sombre et technique commun aux deux univers.
3. **Données techniques** : badges discrets ou tiroir inférieur rétractable (glisser vers le bas pour replier).
4. **Visualisation en direct** : toute modification (teinte, vernis, accessoire) s'applique instantanément.
5. **Capot ouvert** = vue d'ensemble du moteur et des composants internes uniquement, **sans** fiche
   technique supplémentaire.
6. Voitures : rotation 360° autour du véhicule + garage complet (plusieurs voitures dans un même lieu).
7. Mobile : cibles tactiles ≥ 44 pt, safe areas, `100dvh`, pas de scroll de page, gestes sans conflit
   avec le retour système (bord gauche).

## Véhicules (données de référence)

| Modèle | Moteur | Puissance | Teinte d'origine | Signatures |
|---|---|---|---|---|
| Audi RS3 Berline 8Y | 5 cyl. 2.5 TFSI, ordre 1-2-4-5-3 | 400 ch / 500 Nm | Vert Kyalami | Singleframe alvéolée, Matrix LED |
| Corvette C6 Full Modif | LS7 7.0 V8 atmo Stage 3 | ≈ 610 ch (estimation) | Bordeaux nacré | aileron GT carbone, capot ventilé, splitter |
| Camaro ZL1 1LE | LT4 6.2 V8 compresseur | 650 hp (659 ch) | noir/gris satiné mat | canards, capot carbone, aileron |
| Citroën C6 Exclusive 2012 | V6 3.0 HDi biturbo | 240 ch / 450 Nm | Noir Obsidien | lunette concave, Hydractive III+, vitrage acoustique |
| Tesla Model S Plaid | tri-moteur | 1 020 ch | Rouge Signature | jantes Arachnid 21" |

Vernis : Brillant, Métallisé, Nacré, Satiné, Mat. Vitres 10–95 %. Feux de jour / projecteurs séparés.

## Armes (configurateur + banc de tir, usage ludique)

Canik TTI Combat (9×19, Smoke, compensateur intégré), HK MP5A3/MP5-SD (9×19, Navy S-E-F, 800 cps/min),
HK416 A5 (5,56 OTAN, piston court, 850 cps/min, Black/RAL8000), Benelli M4 (12/76, A.R.G.O.),
Glock 17 Gen5 MOS (9×19). Accessoires montés à leur emplacement exact : red dot, EOTech EXPS3 + G33
basculable, PEQ-15 (visible/IR), lampes X300/Scout, compensateur, silencieux, poignées, crosses, chargeurs
étendus. Garder le contenu au niveau « configurateur / jeu » : pas d'instructions techniques réelles
(fabrication, modification, contournement de réglementation).

## Architecture

- `js/core/` partagé (audio unique déverrouillé au geste, tiroir, utilitaires).
- `js/cars/*.js`, `js/armory/weapons/*.js` : une fiche par modèle (données + profil sonore).
- `js/audio/` : synthèse moteur (AudioWorklet + repli). `js/armory/gun-audio.js` : détonations synthétisées.
- Rendu actuel en SVG vectoriel ; migration prévue vers Three.js + glTF (voir skill `threejs-realistic-3d`).
- CSS : `css/tailwind.css` compilé (`npm run build:css`) + `css/app.css`. Service worker `sw.js` :
  incrémenter `VERSION` et mettre à jour la liste `ASSETS` à chaque ajout de fichier.

## Procédure de test avant chaque push

1. `node --check` sur les fichiers JS modifiés ; `npm run build:css` si des classes Tailwind changent.
2. `npm run test:audio` (niveaux moteurs + détonations, aucun NaN, crêtes < 1).
3. `python3 -m http.server 8765` puis `node tools/phone.cjs <dossier> <scénario>` (basic, engine, swipe,
   armory, shoot, combos, vitrine) ; regarder les captures, aucune `pageerror`.
4. Tester aussi 375×667 (iPhone SE) et le paysage.
5. Committer sur la branche de travail et pousser ; GitHub Pages se met à jour tout seul.
