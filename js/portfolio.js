// Onglet Profil & Projets.
import { PROFILE, SKILLS, PROJECTS, TIMELINE } from './data/profile.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const ICONS = {
  cad: '<path d="M12 2 3 7v10l9 5 9-5V7z"/><path d="M3 7l9 5 9-5M12 12v10"/>',
  cnc: '<path d="M9 2h6v5H9zM12 7v6"/><path d="m10 13 2 4 2-4"/><path d="M3 21h18M5 21v-3h14v3"/>',
  robot: '<circle cx="6" cy="19" r="2"/><path d="M4 22h8M6 17V12l7-5 4 3"/><circle cx="13" cy="7" r="1.6"/><path d="M17 10l3 2-1 3"/>',
  print: '<path d="M4 4h16v4H4zM8 8v3h8V8"/><path d="M12 11v2"/><path d="M6 21h12M7 18h10M8 15h8"/>',
  plane: '<path d="M2 13l8-2 4-8 2 1-2 8 7 2v2l-7-1-2 6h-2l1-6-9 1z"/>',
  shield: '<path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
  team: '<circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M2 20c0-3.5 2.7-6 6-6s6 2.5 6 6M14 20c0-2.7 1.4-5 4-5s4 2 4 5"/>',
};

function icon(k) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ICONS[k] || ''}</svg>`;
}

// Visuels génératifs des cartes projet (aucune image externe).
function art(kind) {
  const grid = '<defs><pattern id="pg-KIND" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M16 0H0V16" fill="none" stroke="rgba(255,255,255,.05)"/></pattern></defs><rect width="300" height="112" fill="url(#pg-KIND)"/>'.replace(/KIND/g, kind);
  const a = 'stroke="var(--accent)" fill="none" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"';
  const h = 'stroke="#7fe3ff" fill="none" stroke-width="1" stroke-linecap="round"';
  const shapes = {
    cad: `<g ${a}><path d="M150 18 206 46v40l-56 28-56-28V46z"/><path d="M94 46l56 28 56-28M150 74v40" opacity=".6"/></g><g ${h} opacity=".7"><ellipse cx="150" cy="60" rx="18" ry="9"/><path d="M60 92h40M60 88v8M100 88v8M200 30h40M200 26v8M240 26v8"/></g>`,
    cnc: `<g ${h} opacity=".8"><path d="M30 90h240"/><path d="M40 90V70h40v-14h60v22h50V60h70v30" stroke-dasharray="3 3"/></g><g ${a}><path d="M120 10h20v22h-20zM130 32v14"/><path d="m124 46 6 10 6-10"/></g><path d="M40 70h40v-14h60" stroke="var(--accent)" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
    robot: `<g ${a}><circle cx="90" cy="96" r="10"/><path d="M70 106h40M90 86V60l50-26 40 20"/><circle cx="140" cy="34" r="6"/><path d="M180 54l18 10-6 14"/></g><g ${h} opacity=".7"><path d="M200 78a70 70 0 0 0-110-60" stroke-dasharray="2 4"/><rect x="210" y="70" width="40" height="26" rx="3"/></g>`,
    print: `<g ${h} opacity=".55">${Array.from({ length: 9 }, (_, i) => `<path d="M${100 - i * 2} ${96 - i * 6}h${100 + i * 4}"/>`).join('')}</g><g ${a}><path d="M80 12h140v14H80zM140 26v12M136 38h8l-4 6z"/></g>`,
    web: `<g ${a}><rect x="70" y="16" width="160" height="84" rx="8"/><path d="M70 32h160"/><circle cx="82" cy="24" r="2"/><circle cx="90" cy="24" r="2"/></g><g ${h} opacity=".8"><rect x="84" y="44" width="56" height="40" rx="4"/><path d="M152 46h64M152 58h50M152 70h58M152 82h36"/></g>`,
    car: `<g ${a}><path d="M40 84c10-14 30-20 60-22l30-20c30-6 60-6 86 2l30 20c16 2 26 8 30 20"/><circle cx="96" cy="88" r="13"/><circle cx="214" cy="88" r="13"/></g><path d="M20 101h260" ${h} opacity=".6"/><g ${h} opacity=".7"><path d="M232 30c6-4 14-4 20 0M226 22c10-7 22-7 32 0"/></g>`,
  };
  return `<svg viewBox="0 0 300 112" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${grid}${shapes[kind] || ''}</svg>`;
}

export function renderProfile(root, { onGarage } = {}) {
  const p = PROFILE;
  const c = p.contact;
  const links = [
    c.email && `<a class="btn" href="mailto:${esc(c.email)}">✉️ Email</a>`,
    c.linkedin && `<a class="btn" href="${esc(c.linkedin)}" target="_blank" rel="noopener">in LinkedIn</a>`,
    c.github && `<a class="btn" href="${esc(c.github)}" target="_blank" rel="noopener">⌥ GitHub</a>`,
  ].filter(Boolean);

  root.innerHTML = `<div class="p-wrap">
    <header class="hero">
      <div class="hero-top">
        <div class="avatar" aria-hidden="true">${esc(p.initials)}</div>
        <div><h1>${esc(p.name)}</h1><div class="role">${esc(p.role)}</div></div>
      </div>
      <p class="pitch">${p.pitch}</p>
      <div class="facts">${p.facts.map((f) => `<span class="fact"><i>${f.icon}</i>${esc(f.label)}</span>`).join('')}</div>
      <div class="cta-row">
        <button class="btn primary" type="button" data-go="garage">🏎️ Ouvrir l’Atelier</button>
        <a class="btn" href="#competences">Compétences</a>
      </div>
    </header>

    <section class="sec" id="competences">
      <div class="sec-h"><h2>Compétences & outils</h2><span>${SKILLS.length} domaines</span></div>
      <div class="skills">${SKILLS.map((s) => `<article class="skill">
        <div class="si">${icon(s.icon)}</div>
        <div><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p>
        <div class="tags">${s.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div></div>
      </article>`).join('')}</div>
    </section>

    <section class="sec">
      <div class="sec-h"><h2>Projets</h2><span>Glisser →</span></div>
      <div class="projects">${PROJECTS.map((x) => `<article class="proj">
        <div class="art">${art(x.art)}<span class="k">${esc(x.key)}</span></div>
        <div class="body"><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p>
        <div class="tags">${x.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div></div>
      </article>`).join('')}</div>
    </section>

    <section class="sec">
      <div class="sec-h"><h2>Parcours</h2><span>Trajectoire</span></div>
      <div class="timeline">${TIMELINE.map((t) => `<div class="tl${t.future ? ' future' : ''}">
        <small>${esc(t.when)}</small><h3>${esc(t.title)}</h3><p>${esc(t.text)}</p></div>`).join('')}</div>
    </section>

    ${links.length ? `<section class="sec"><div class="sec-h"><h2>Contact</h2><span>Échangeons</span></div><div class="contact">${links.join('')}</div></section>` : ''}

    <p class="foot">© ${new Date().getFullYear()} ${esc(p.name)} · Garage Studio</p>
  </div>`;

  root.addEventListener('click', (e) => {
    const go = e.target.closest('[data-go]');
    if (go && onGarage) onGarage();
    const a = e.target.closest('a[href^="#"]');
    if (a) {
      e.preventDefault();
      const t = root.querySelector(a.getAttribute('href'));
      if (t) root.scrollTo({ top: t.offsetTop - 10, behavior: 'smooth' });
    }
  });
}
