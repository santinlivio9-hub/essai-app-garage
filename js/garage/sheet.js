// Bottom sheet rétractable : glisser vers le haut pour ouvrir, vers le bas pour replier.
// Glisser vers le bas quand il est déjà replié déclenche le « mode vitrine ».

export class Sheet {
  constructor(el, { onToggle, onDismiss } = {}) {
    this.el = el;
    this.head = el.querySelector('.sheet-head');
    this.body = el.querySelector('.sheet-body');
    this.open = false;
    this.onToggle = onToggle;
    this.onDismiss = onDismiss;
    this.bind();
  }

  get travel() {
    const h = this.el.offsetHeight;
    const peek = parseFloat(getComputedStyle(this.el).getPropertyValue('--peek')) || 58;
    return Math.max(0, h - peek);
  }

  set(open) {
    this.open = open;
    this.el.classList.toggle('open', open);
    this.el.style.transform = '';
    this.head.setAttribute('aria-expanded', String(open));
    if (this.onToggle) this.onToggle(open);
  }

  bind() {
    let y0 = 0;
    let t0 = 0;
    let base = 0;
    let dragging = false;
    let moved = false;
    let id = null;

    const down = (e) => {
      id = e.pointerId;
      y0 = e.clientY;
      t0 = performance.now();
      base = this.open ? 0 : this.travel;
      dragging = true;
      moved = false;
      this.head.setPointerCapture(id);
    };
    const move = (e) => {
      if (!dragging || e.pointerId !== id) return;
      const dy = e.clientY - y0;
      if (Math.abs(dy) > 4) moved = true;
      if (!moved) return;
      this.el.classList.add('dragging');
      const travel = this.travel;
      let y = base + dy;
      if (y < 0) y *= 0.25; // résistance élastique
      if (y > travel) y = travel + (y - travel) * 0.35;
      this.el.style.transform = `translateY(${y}px)`;
    };
    const up = (e) => {
      if (!dragging || e.pointerId !== id) return;
      dragging = false;
      this.el.classList.remove('dragging');
      const dy = e.clientY - y0;
      const v = dy / Math.max(1, performance.now() - t0); // px/ms
      if (!moved) {
        this.set(!this.open);
        return;
      }
      const travel = this.travel;
      const y = base + dy;
      if (!this.open && dy > 36 && this.onDismiss) {
        this.el.style.transform = '';
        this.onDismiss();
        return;
      }
      const open = v < -0.35 ? true : v > 0.35 ? false : y < travel / 2;
      this.set(open);
    };

    this.head.addEventListener('pointerdown', down);
    this.head.addEventListener('pointermove', move);
    this.head.addEventListener('pointerup', up);
    this.head.addEventListener('pointercancel', up);
    this.head.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.set(!this.open);
      }
    });
  }
}
