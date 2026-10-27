// Télécharge les modèles Sketchfab de assets/models/selection.json :
// SKETCHFAB_TOKEN=<jeton API> node tools/fetch-models.cjs [id ...]
// Jeton : https://sketchfab.com/settings/password (section « API Token »).
// GLB si proposé → assets/models/src/<id>.glb, sinon archive glTF extraite dans assets/models/src/<id>/.
// Étape suivante : node tools/optimize-models.cjs
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const dir = path.join(__dirname, '..', 'assets', 'models');
const out = path.join(dir, 'src');
const token = process.env.SKETCHFAB_TOKEN;
if (!token) { console.error('SKETCHFAB_TOKEN manquant'); process.exit(1); }
const only = process.argv.slice(2);
const list = JSON.parse(fs.readFileSync(path.join(dir, 'selection.json'), 'utf8'))
  .filter((m) => !only.length || only.includes(m.id));

const mb = (n) => (n / 1048576).toFixed(1) + ' Mo';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// L'API limite le débit (429) : on attend puis on réessaie.
async function api(uid) {
  for (let i = 0; ; i++) {
    const r = await fetch(`https://api.sketchfab.com/v3/models/${uid}/download`, { headers: { Authorization: `Token ${token}` } });
    if (r.status !== 429 || i === 5) return r;
    const wait = (+r.headers.get('retry-after') || 30 * 2 ** i) * 1000;
    console.log(`  … limite atteinte, nouvel essai dans ${wait / 1000} s`);
    await sleep(wait);
  }
}

(async () => {
  fs.mkdirSync(out, { recursive: true });
  let failed = 0;
  for (const m of list) {
    const glb = path.join(out, m.id + '.glb');
    const folder = path.join(out, m.id);
    if (fs.existsSync(glb) || fs.existsSync(folder)) { console.log(`= ${m.id} déjà présent`); continue; }
    try {
      const r = await api(m.uid);
      if (!r.ok) throw new Error(`API ${r.status} ${await r.text()}`);
      const links = await r.json();
      const pick = links.glb || links.gltf;
      if (!pick) throw new Error('aucun format glb/gltf proposé');
      const f = await fetch(pick.url);
      if (!f.ok) throw new Error(`fichier ${f.status}`);
      const buf = Buffer.from(await f.arrayBuffer());
      if (links.glb) {
        fs.writeFileSync(glb, buf);
      } else {
        const zip = folder + '.zip';
        fs.writeFileSync(zip, buf);
        fs.mkdirSync(folder);
        execFileSync('unzip', ['-q', zip, '-d', folder]);
        fs.unlinkSync(zip);
      }
      console.log(`+ ${m.id} (${links.glb ? 'glb' : 'gltf'}, ${mb(buf.length)})`);
    } catch (e) {
      failed++;
      console.error(`! ${m.id} : ${e.message}`);
    }
  }
  process.exit(failed ? 1 : 0);
})();
