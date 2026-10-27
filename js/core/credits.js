// Crédits des modèles 3D (licences CC-BY : auteur et lien obligatoires), lus dans selection.json.
import { esc } from './util.js';

let list = null;
const ready = fetch('assets/models/selection.json')
  .then((r) => (r.ok ? r.json() : []))
  .then((l) => { list = l; return l; })
  .catch(() => { list = []; return list; });

export const creditsReady = ready;

const LICENSE = {
  'CC Attribution': 'CC BY 4.0',
  'CC Attribution-NonCommercial-ShareAlike': 'CC BY-NC-SA 4.0',
};

// Paragraphe « modèle par auteur (licence) » pour les identifiants donnés.
export function creditHTML(ids) {
  if (!list) return '';
  const rows = ids.map((id) => list.find((m) => m.id === id)).filter(Boolean);
  return rows.map((m) => `<li><a href="${esc(m.url)}" target="_blank" rel="noopener">${esc(m.name)}</a> · ${esc(m.author)} · ${esc(LICENSE[m.license] || m.license)}</li>`).join('');
}
