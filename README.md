# Livio Santin — Portfolio & Garage Studio

Web App mobile (PWA) optimisée pour iPhone / Safari iOS : plein écran, safe areas, `100dvh`, zéro scroll parasite.
Deux volets accessibles par la barre flottante : **📁 Profil & Projets** et **🏎️ Atelier Garage**.

Aucune dépendance, aucun build : HTML + CSS (variables) + JavaScript ES modules.

## Lancer en local

```bash
python3 -m http.server 8000
# puis http://localhost:8000 (le son nécessite un geste : bouton START)
```

Pour l'installer sur iPhone : héberger le dossier (GitHub Pages, Netlify…) en HTTPS, ouvrir dans Safari → Partager → **Sur l'écran d'accueil**. Le service worker rend l'app utilisable hors-ligne.

## Architecture

```
index.html                 Structure des deux vues + barre d'onglets
css/app.css                Design tokens, glassmorphism, studio, HUD, bottom sheet, calques SVG
js/main.js                 Navigation, garde-fous tactiles iOS, service worker
js/portfolio.js            Rendu de l'onglet Profil
js/data/profile.js         ✏️ Contenu du portfolio (textes, projets, contacts)
js/cars/*.js               Un fichier par véhicule : géométrie (mm réels), teintes, specs, profil sonore
js/garage/renderer.js      Rendu studio par calques SVG (teinte, multiply, reflets, paillettes, nacre)
js/garage/wheels.js        Jantes procédurales (RS 5×2, Track, Forgée, Y, Arachnid), disques, étriers
js/garage/xray.js          Vue technique de la baie moteur (pistons calés sur l'ordre d'allumage)
js/garage/garage.js        Contrôleur : personnalisation live, moteur, gestes, transitions
js/garage/tach.js          Compte-tours HUD
js/garage/sheet.js         Bottom sheet rétractable (geste vers le bas = mode Vitrine)
js/audio/engine-sim.js     Mécanique : démarreur, ralenti à froid, inertie, rupteur, retours de flamme
js/audio/engine-dsp.js     Synthèse temps réel (AudioWorklet + repli ScriptProcessor)
js/audio/engine-audio.js   Graphe Web Audio, déverrouillage iOS (y compris bouton silencieux)
sw.js · manifest.webmanifest · icons/
tools/                     Outils de dev (captures Playwright, banc d'essai audio, génération d'icônes)
```

### Rendu des véhicules

Chaque silhouette est vectorisée à partir des cotes réelles (longueur, empattement, hauteur, diamètre de roue) à une
échelle commune : les gabarits relatifs sont respectés. La carrosserie est composée de calques découpés au masque
de caisse : teinte de base → ombrage `multiply` → reflets d'horizon (nets en brillant, diffus en mat/satiné) →
paillettes métal → nacre (`screen`, teinte d'interférence calculée) → reflets spéculaires et balayage lumineux.
Pas de filtres SVG coûteux : tout est en dégradés, plus fluide sur mobile.

### Moteur audio

Le vilebrequin avance en degrés ; chaque cylindre déclenche, à son angle d'allumage réel, une impulsion dans sa ligne
d'échappement (banc A/B), qui excite des résonateurs de ligne. Les écarts entre cylindres créent le caractère :
5 cylindres 1-2-4-5-3 (RS 3), V8 cross-plane 1-8-7-2-6-5-4-3 / 1-7-2-6-5-4-8-3 (glouglou + compresseur Eaton sur la ZL1),
V6 diesel biturbo 1-4-2-5-3-6 très étouffé (C6), double onduleur linéaire (Tesla).

Banc d'essai hors-ligne : `node tools/audio-test.mjs [dossier_wav]` (niveaux par phase + export WAV).

## Personnaliser

- Textes, projets et liens : `js/data/profile.js` (les contacts vides ne s'affichent pas).
- Teintes / specs / sonorité d'un véhicule : `js/cars/<id>.js`.
- Après un déploiement, incrémenter `VERSION` dans `sw.js`.
