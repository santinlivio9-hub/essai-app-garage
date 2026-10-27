// Compresse les modèles pour iPhone : node tools/optimize-models.mjs [id ...]
// assets/models/src/<id>.glb → assets/models/<id>.glb
// Même chaîne que `gltf-transform optimize`, sans flatten ni palette ni simplify (abîme les normales,
// ex. portières de la C6) : la hiérarchie et les
// matériaux restent intacts (pièces animables — capot, portières, roues, culasse — et matériau de
// peinture unique à teinter). Au-delà de MAX_CALLS draw calls, chaque mesh est rattaché au groupe pivot
// qui le contient (PIVOT), sinon à la racine du modèle, puis join() fusionne par matériau dans chaque groupe.
// En dessous, les pièces restent séparées (même anonymes) pour pouvoir les animer plus tard.
// Géométrie Meshopt (décodeur three/examples/jsm/libs/meshopt_decoder.module.js), textures WebP ≤ 2048².
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NodeIO, Logger } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, instance, join, weld, resample, prune, sparse, textureCompress, meshopt } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
import sharp from 'sharp';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'models');
const only = process.argv.slice(2);
const list = JSON.parse(fs.readFileSync(path.join(dir, 'selection.json'), 'utf8'))
  .filter((m) => !only.length || only.includes(m.id));
// Cibles de la skill threejs-realistic-3d
const budget = { car: 8, scene: 8, weapon: 4, accessory: 4 };
// Groupes à garder séparés (pièces animables ou à manipuler)
const MAX_CALLS = 100;
const PIVOT = /wheel|door|hood|bonnet|trunk|boot|tailgate|steering|slide|bolt|magazine|trigger|hammer|charging|roue|porti|capot|coffre|volant|culasse|chargeur|gachette|detente/i;

await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready]);
const io = new NodeIO().setLogger(new Logger(Logger.Verbosity.ERROR)).registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });

// Produit de matrices 4×4 (ordre colonnes, comme glTF)
const mul = (a, b) => Array.from({ length: 16 }, (_, i) => [0, 1, 2, 3]
  .reduce((s, k) => s + a[k * 4 + (i % 4)] * b[(i >> 2) * 4 + k], 0));

// Au-delà de MAX_CALLS : rattache chaque mesh feuille au groupe pivot le plus haut qui le contient (sinon à la racine),
// en conservant sa position monde ; les nœuds animés ou servant d'os ne bougent pas. Un groupe qui
// contient plus de la moitié des meshes est un conteneur (ex. racine nommée « Wheel1A »), pas un pivot.
const gather = () => (doc) => {
  const root = doc.getRoot();
  const meshes = new Map();
  const count = (n) => { const c = (n.getMesh() ? 1 : 0) + n.listChildren().reduce((s, k) => s + count(k), 0); meshes.set(n, c); return c; };
  const fixed = new Set();
  for (const a of root.listAnimations()) for (const c of a.listChannels()) fixed.add(c.getTargetNode());
  for (const n of root.listNodes()) n.getSkin()?.listJoints().forEach((j) => fixed.add(j));
  for (const scene of root.listScenes()) for (const top of scene.listChildren()) {
    const total = count(top);
    const visit = (node, chain) => {
      for (const child of node.listChildren()) visit(child, [...chain, child]);
      if (node === top || !node.getMesh() || node.listChildren().length || node.getSkin() || chain.some((n) => fixed.has(n))) return;
      const i = Math.max(0, chain.slice(0, -1).findIndex((n) => PIVOT.test(n.getName()) && meshes.get(n) * 2 < total));
      if (i === chain.length - 2) return;
      // Matrice relative au groupe cible = produit des matrices locales qui les séparent
      const m = chain.slice(i + 1).reduce((a, n) => mul(a, n.getMatrix()), [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
      node.setMatrix(m);
      chain[i].addChild(node);
    };
    visit(top, [top]);
  }
};

const mb = (n) => n / 1048576;
const drawCalls = (doc) => doc.getRoot().listNodes().reduce((n, node) => n + (node.getMesh()?.listPrimitives().length || 0), 0);
const triangles = (doc) => doc.getRoot().listMeshes().reduce((n, mesh) => n + mesh.listPrimitives()
  .reduce((t, p) => t + (p.getIndices() || p.getAttribute('POSITION')).getCount() / 3, 0), 0);

let over = 0;
for (const m of list) {
  const src = path.join(dir, 'src', m.id + '.glb');
  const dst = path.join(dir, m.id + '.glb');
  if (!fs.existsSync(src)) { console.error(`! ${m.id} : src/${m.id}.glb absent (lancer fetch-models)`); over++; continue; }
  const doc = await io.read(src);
  const calls = drawCalls(doc);
  const merge = calls > MAX_CALLS ? [gather(), prune(), join()] : [join({ keepMeshes: true })];
  await doc.transform(
    dedup(),
    instance({ min: 5 }),
    ...merge,
    weld(),
    resample(),
    prune({ keepAttributes: false, keepSolidTextures: false }),
    sparse(),
    textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [2048, 2048] }),
    meshopt({ encoder: MeshoptEncoder, level: 'high' }),
  );
  await io.write(dst, doc);
  const a = mb(fs.statSync(src).size), b = mb(fs.statSync(dst).size);
  const ok = b <= budget[m.kind];
  if (!ok) over++;
  console.log(`${ok ? '+' : '!'} ${m.id.padEnd(12)} ${a.toFixed(1).padStart(5)} → ${b.toFixed(1).padStart(4)} Mo (cible ${budget[m.kind]})  draw calls ${calls} → ${drawCalls(doc)}  triangles ${Math.round(triangles(doc) / 1000)} k`);
}
process.exit(over ? 1 : 0);
