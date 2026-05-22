// ── Cursor + ambient glow ──
const cursor = document.getElementById('cursor');
const glow = document.getElementById('cursor-glow');

let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let glowX = mouseX;
let glowY = mouseY;

document.addEventListener('mousemove', e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  if (cursor) {
    cursor.style.left = mouseX + 'px';
    cursor.style.top = mouseY + 'px';
  }
});

// Cards on the home page that should shy away from the cursor
const repelCards = document.querySelectorAll('#constellation .float');
const REPEL_RADIUS = 220;  // px — distance at which cards start being pushed
const REPEL_MAX    = 38;   // px — maximum push when cursor is right on the card center
const REPEL_LERP   = 0.08; // smoothing factor (lower = slower / more catchable)

function tick() {
  // Ambient glow lerp
  glowX += (mouseX - glowX) * 0.12;
  glowY += (mouseY - glowY) * 0.12;
  if (glow) {
    glow.style.transform = `translate(${glowX}px, ${glowY}px) translate(-50%, -50%)`;
  }

  // Card repulsion
  repelCards.forEach(card => {
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = cx - mouseX;
    const dy = cy - mouseY;
    const dist = Math.hypot(dx, dy) || 1;

    let targetX = 0, targetY = 0;
    if (dist < REPEL_RADIUS) {
      // Quadratic falloff so the push fades smoothly to 0 at the edge of the field
      const t = 1 - dist / REPEL_RADIUS;
      const force = t * t * REPEL_MAX;
      targetX = (dx / dist) * force;
      targetY = (dy / dist) * force;
    }

    const curX = parseFloat(card.dataset.px) || 0;
    const curY = parseFloat(card.dataset.py) || 0;
    const nx = curX + (targetX - curX) * REPEL_LERP;
    const ny = curY + (targetY - curY) * REPEL_LERP;
    card.dataset.px = nx;
    card.dataset.py = ny;
    card.style.setProperty('--push-x', nx.toFixed(2) + 'px');
    card.style.setProperty('--push-y', ny.toFixed(2) + 'px');
  });

  requestAnimationFrame(tick);
}
tick();

document.querySelectorAll('a, button, [data-hover]').forEach(el => {
  el.addEventListener('mouseenter', () => cursor && cursor.classList.add('hover'));
  el.addEventListener('mouseleave', () => cursor && cursor.classList.remove('hover'));
});

// ── Page transitions ──
requestAnimationFrame(() => document.body.classList.add('loaded'));

document.querySelectorAll('a[href]').forEach(a => {
  const href = a.getAttribute('href');
  if (!href) return;
  if (a.target === '_blank') return;
  if (!/^[^/]+\.html(#.*)?$/.test(href) && href !== 'index.html') return;
  a.addEventListener('click', e => {
    e.preventDefault();
    document.body.classList.add('leaving');
    setTimeout(() => { window.location.href = href; }, 380);
  });
});
