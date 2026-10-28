// Point d'entrée : navigation Garage / Armurerie, garde-fous tactiles iOS, service worker.
import { suspendAudio, resumeAudio } from './core/audio.js';

const TAB_KEY = 'ls-tab';

// iOS : bloque le pinch-zoom et le double-tap zoom, sans gêner les zones défilantes.
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });
document.addEventListener('touchmove', (e) => {
  if (e.touches.length > 1) {
    e.preventDefault();
    return;
  }
  if (!e.target.closest('.rail, .picker, .seg, .sheet-body, input[type="range"]')) e.preventDefault();
}, { passive: false });

const views = {
  garage: document.getElementById('view-garage'),
  armory: document.getElementById('view-armory'),
};
const tabs = [...document.querySelectorAll('.tab')];
const modules = {};
window.__ls = modules; // accès des scripts de test (tools/*.cjs)

// Chaque univers n'est chargé qu'à sa première ouverture (démarrage plus rapide).
async function ensure(name) {
  if (modules[name]) return modules[name];
  if (name === 'garage') {
    const { Garage } = await import('./garage/garage.js');
    modules.garage = new Garage(views.garage);
  } else if (name === 'armory') {
    const { Armory } = await import('./armory/armory.js');
    modules.armory = new Armory(views.armory);
  }
  return modules[name];
}

async function show(name) {
  if (!views[name]) name = 'garage';
  for (const [k, el] of Object.entries(views)) el.classList.toggle('is-active', k === name);
  for (const t of tabs) t.setAttribute('aria-selected', String(t.dataset.tab === name));
  try { localStorage.setItem(TAB_KEY, name); } catch { /* navigation privée */ }
  await ensure(name);
  for (const [k, m] of Object.entries(modules)) if (m) m.setActive(k === name);
}

for (const t of tabs) t.addEventListener('click', () => show(t.dataset.tab));

let initial = 'garage';
try { initial = localStorage.getItem(TAB_KEY) || 'garage'; } catch { /* idem */ }
const hash = location.hash.replace('#', '');
if (views[hash]) initial = hash;
show(initial);
window.addEventListener('hashchange', () => {
  const h = location.hash.replace('#', '');
  if (views[h]) show(h);
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    for (const m of Object.values(modules)) if (m) m.setActive(false);
    suspendAudio();
  } else {
    resumeAudio();
    const cur = Object.keys(views).find((k) => views[k].classList.contains('is-active'));
    if (modules[cur]) modules[cur].setActive(true);
  }
});

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
