// Copie Three.js et les modules utilisés dans vendor/three (l'app ne charge rien depuis un CDN) :
// node tools/vendor-three.cjs
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const src = path.join(root, 'node_modules', 'three');
const dst = path.join(root, 'vendor', 'three');
const files = [
  ['build/three.module.min.js', 'three.module.min.js'],
  ['examples/jsm/controls/OrbitControls.js', 'addons/controls/OrbitControls.js'],
  ['examples/jsm/loaders/GLTFLoader.js', 'addons/loaders/GLTFLoader.js'],
  ['examples/jsm/utils/BufferGeometryUtils.js', 'addons/utils/BufferGeometryUtils.js'],
  ['examples/jsm/environments/RoomEnvironment.js', 'addons/environments/RoomEnvironment.js'],
  ['examples/jsm/libs/meshopt_decoder.module.js', 'addons/libs/meshopt_decoder.module.js'],
  ['LICENSE', 'LICENSE'],
];
for (const [from, to] of files) {
  fs.mkdirSync(path.dirname(path.join(dst, to)), { recursive: true });
  fs.copyFileSync(path.join(src, from), path.join(dst, to));
}
console.log(`three ${require(path.join(src, 'package.json')).version} → vendor/three`);
