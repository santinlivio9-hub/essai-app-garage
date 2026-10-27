// Point d'entrée : navigation, garde-fous tactiles iOS, service worker.
import { renderProfile } from './portfolio.js';
import { Garage } from './garage/garage.js';

const TAB_KEY = 'ls-tab';

// iOS : bloque le pinch-zoom et le double-tap zoom, sans gêner les zones défilantes.
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });
document.addEventListener('touchmove', (e) => {
  if (e.touches.length > 1) {
    e.preventDefault();
    return;
  }
  if (!e.target.closest('.scroll, .rail, .picker, .seg, .projects, .sheet-body, input[type="range"]')) e.preventDefault();
}, { passive: false });

const views = {
  profile: document.getElementById('view-profile'),
  garage: document.getElementById('view-garage'),
};
const tabs = [...document.querySelectorAll('.tab')];
let garage = null;

function show(name) {
  for (const [k, el] of Object.entries(views)) el.classList.toggle('is-active', k === name);
  for (const t of tabs) t.setAttribute('aria-selected', String(t.dataset.tab === name));
  if (name === 'garage' && !garage) garage = new Garage(views.garage);
  if (garage) garage.setActive(name === 'garage');
  try { localStorage.setItem(TAB_KEY, name); } catch { /* navigation privée */ }
}

for (const t of tabs) t.addEventListener('click', () => show(t.dataset.tab));

renderProfile(document.getElementById('profile-root'), { onGarage: () => show('garage') });

let initial = 'profile';
try { initial = localStorage.getItem(TAB_KEY) || 'profile'; } catch { /* idem */ }
const hash = location.hash.replace('#', '');
if (hash === 'garage' || hash === 'profile') initial = hash;
show(views[initial] ? initial : 'profile');

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
