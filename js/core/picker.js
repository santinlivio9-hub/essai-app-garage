// Sélecteur commun Garage / Armurerie : une vignette 3D + un nom court par modèle, tous visibles d'un coup,
// avec un indicateur qui glisse sous le modèle choisi.
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export class Picker {
  // items : [{ label, title, img }] ; onPick(i) appelé quand on touche un autre modèle.
  constructor(el, items, onPick) {
    this.el = el;
    this.i = -1;
    el.style.setProperty('--n', items.length);
    el.innerHTML = '<i class="pick-glow" aria-hidden="true"></i>' + items.map((it, i) => `
      <button class="pick" type="button" role="tab" data-i="${i}" aria-selected="false" aria-label="${esc(it.title)}">
        <span class="pick-img"><img src="${it.img}" alt="" decoding="async" draggable="false"></span>
        <span class="pick-lbl">${esc(it.label)}</span>
      </button>`).join('');
    this.buttons = [...el.querySelectorAll('.pick')];
    el.addEventListener('click', (e) => {
      const b = e.target.closest('.pick');
      if (b && +b.dataset.i !== this.i) onPick(+b.dataset.i);
    });
  }

  select(i) {
    if (i === this.i) return;
    this.i = i;
    this.el.style.setProperty('--i', i);
    for (const b of this.buttons) b.setAttribute('aria-selected', String(+b.dataset.i === i));
  }
}
