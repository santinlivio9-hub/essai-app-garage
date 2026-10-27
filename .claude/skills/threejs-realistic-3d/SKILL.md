---
name: threejs-realistic-3d
description: Intégrer des modèles 3D glTF/GLB photoréalistes (voitures, armes, décors) dans une PWA mobile avec Three.js — éclairage HDR, matériaux PBR (peinture, vernis, verre, carbone, métal), rotation 360°, compression pour iPhone, pièces animées (capot, portières, culasse) et vérification des licences. À utiliser dès qu'on ajoute, remplace, optimise ou anime un modèle 3D, ou qu'on construit une scène (garage, stand de tir).
---

# Modèles 3D réalistes avec Three.js (mobile / Safari iOS)

Le réalisme vient de **trois choses** : un bon modèle (topologie + pièces séparées), un **éclairage HDR**
(Image-Based Lighting) et des **matériaux PBR** bien réglés. Le code ne remplace pas un bon modèle : on
n'essaie jamais de « sculpter » une voiture ou une arme en primitives.

## 1. Sources de modèles et licences

- Sketchfab (filtre « Downloadable », format glTF) — CC-BY : créditer l'auteur dans l'app (écran « Crédits »).
  CC-BY-NC : usage non commercial uniquement. Refuser « Editorial » / sans licence claire.
- CGTrader, TurboSquid (payants, souvent meilleurs), Poly Haven (HDRI et décors CC0).
- Avant d'intégrer : noter auteur, URL, licence dans `assets/models/CREDITS.md`. Ne jamais intégrer un modèle
  extrait d'un jeu vidéo ou d'un configurateur constructeur (droits non cédés).
- Ne pas télécharger à la place de l'utilisateur : il fournit le fichier ou le lien de téléchargement direct.

## 2. Contrôle d'un modèle avant intégration

Inspecter le GLB (`npx @gltf-transform/cli inspect model.glb`) et vérifier :
- **Pièces séparées et nommées** : carrosserie (peinte), vitres, jantes ×4, étriers, phares, feux, capot,
  portières (pivot à la charnière), intérieur, moteur. Pour une arme : carcasse, culasse/glissière, chargeur,
  canon, rails, points de montage. Sinon, les teintes et animations sont impossibles → signaler à l'utilisateur.
- Échelle réelle (1 unité = 1 m), origine au sol au centre, avant vers +Z (voiture) / bouche vers +X (arme).
- Triangles : viser ≤ 300 k par voiture, ≤ 120 k par arme pour iPhone. Textures ≤ 2048².
- Matériau de peinture unique et partagé (pour changer la teinte en une ligne).

## 3. Optimisation (obligatoire pour iPhone)

```bash
npx @gltf-transform/cli optimize in.glb out.glb --compress draco --texture-compress ktx2 --texture-size 2048
```
- Draco (géométrie) ou Meshopt + KTX2/Basis (textures GPU) : divise souvent le poids par 5 à 10.
- Cible : < 8 Mo par voiture, < 4 Mo par arme. Charger à la demande (jamais tout au démarrage).
- Mettre en cache via le service worker (stratégie cache-first, versionnée).
- Décodeurs (`DRACOLoader`, `KTX2Loader`) hébergés localement dans `vendor/` pour le hors-ligne.

## 4. Rendu photoréaliste

```js
renderer.toneMapping = THREE.ACESFilmicToneMapping; // ou AgX
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); // 3× sur iPhone = trop coûteux
scene.environment = pmrem.fromEquirectangular(hdr).texture; // HDRI studio (Poly Haven)
```
- **Peinture voiture** : `MeshPhysicalMaterial` — `color`, `metalness` 0.5–0.9 (métallisé) ou 0 (unie),
  `roughness` 0.25–0.4, `clearcoat` 1, `clearcoatRoughness` 0.03 (brillant) / 0.35 (satiné) / 0.8 + clearcoat 0
  (mat). Nacré : `iridescence` 0.6–1 + `iridescenceIOR` 1.3. Paillettes : `normalMap` de bruit fin, `normalScale` faible.
- **Vitres** : `transmission` (coûteux) ou plus léger `opacity` + `envMapIntensity`, teinte = `color` + opacité
  pilotée par le curseur 10–95 %.
- **Jantes / acier** : metalness 1, roughness 0.2–0.45. **Carbone** : texture sergé + clearcoat.
  **Cérakote / polymère** : metalness 0.1–0.3, roughness 0.6–0.85.
- **Phares** : `emissive` + `emissiveIntensity`, faisceau = `SpotLight` (ombres désactivées sur mobile) ;
  halo via sprite additif ou post-process bloom léger.
- **Sol** : ombre de contact (`ContactShadows` ou plan avec texture d'AO précalculée) + réflexion
  (`Reflector` coûteux → préférer un plan semi-réfléchissant + SSR désactivé sur mobile).

## 5. Interaction

- `OrbitControls` : rotation 360° à un doigt, pinch-zoom borné (`minDistance`/`maxDistance`),
  `maxPolarAngle` < π/2 (jamais sous le sol), `enablePan = false`, amortissement (`enableDamping`).
- Vues prédéfinies (avant 3/4, profil, arrière, intérieur, moteur) animées par interpolation caméra.
- Animations de pièces : rotation autour du pivot de la charnière (capot, portières), translation de la
  glissière/culasse, éjection du chargeur. Créer un `Object3D` pivot si le modèle n'en a pas.
- Garage complet : décor GLB séparé (atelier/showroom), voitures sur emplacements, caméra qui se déplace
  d'une place à l'autre ; ne rendre en haute qualité que la voiture active.

## 6. Performance & robustesse sur iPhone

- 60 fps visés ; rendre **à la demande** (seulement si caméra/objet bouge) pour économiser la batterie.
- Pas d'ombres dynamiques multiples ; une lumière directionnelle + HDRI suffisent.
- `renderer.info` pour surveiller draw calls (< 150) et textures. Fusionner les petites pièces statiques.
- Gérer la perte de contexte WebGL (`webglcontextlost`) et fournir un repli (image fixe) si WebGL absent.
- Three.js en module ES versionné et vendu localement (pas de CDN au runtime : la PWA doit marcher hors-ligne).

## 7. Vérification

- Captures Playwright de chaque vue (avant/profil/arrière/capot ouvert) sur viewport iPhone, avant/après.
- Mesurer le poids des GLB et le temps de chargement ; tester sur un vrai iPhone dès que possible
  (les GPU mobiles diffèrent de Chromium headless, qui utilise SwiftShader).
