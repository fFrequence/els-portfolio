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

// Cards on the home page that should shy away from the cursor.
// render.js calls window.refreshRepelTargets() after the constellation is in the DOM.
let repelCards = [];
function refreshRepelTargets() {
  repelCards = document.querySelectorAll('#constellation .float');
}
window.refreshRepelTargets = refreshRepelTargets;
refreshRepelTargets();

const REPEL_RADIUS = 220;
const REPEL_MAX    = 38;
const REPEL_LERP   = 0.08;

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

// Hover targets — runs on whatever links/buttons exist at load (nav, footer).
// render.js calls this again after it injects content with links inside.
function wireHoverTargets() {
  document.querySelectorAll('a, button, [data-hover]').forEach(el => {
    if (el.dataset.cursorWired) return;
    el.dataset.cursorWired = '1';
    el.addEventListener('mouseenter', () => cursor && cursor.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursor && cursor.classList.remove('hover'));
  });
}
window.wireHoverTargets = wireHoverTargets;
wireHoverTargets();

// ── Page transitions ──
// render.js adds 'loaded' after data is ready; here we just wire up link interception.
function wirePageTransitions() {
  document.querySelectorAll('a[href]').forEach(a => {
    if (a.dataset.transitionWired) return;
    const href = a.getAttribute('href');
    if (!href) return;
    if (a.target === '_blank') return;
    if (!/^[^/]+\.html(#.*)?$/.test(href) && href !== 'index.html') return;
    a.dataset.transitionWired = '1';
    a.addEventListener('click', e => {
      e.preventDefault();
      document.body.classList.add('leaving');
      setTimeout(() => { window.location.href = href; }, 380);
    });
  });
}
window.wirePageTransitions = wirePageTransitions;
wirePageTransitions();

// ── Hamburger nav toggle ──
(function () {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (!toggle || !links) return;
  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.classList.toggle('open', open);
  });
  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.classList.remove('open');
    });
  });
})();
