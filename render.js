// ── render.js ──
// Fetches data.json and populates the right page based on <body data-page="…">

// ─── Constellation slot configs (the 9 orbits on the home page) ───
// Films get assigned to slots by order — first 9 from data.films.
const SLOTS = [
  { radius: '17vmin', speed: '140s', start: '0s',    xs: 1.12, ys: 0.96, rot: -1,   bob: '0s'   },
  { radius: '20vmin', speed: '175s', start: '-32s',  xs: 1.12, ys: 0.96, rot: 0.6,  bob: '-1s', ccw: true },
  { radius: '24vmin', speed: '115s', start: '-25s',  xs: 1.15, ys: 0.95, rot: -0.7, bob: '-2s'  },
  { radius: '30vmin', speed: '200s', start: '-66s',  xs: 1.22, ys: 0.93, rot: 1,    bob: '-3s', ccw: true },
  { radius: '33vmin', speed: '150s', start: '-55s',  xs: 1.22, ys: 0.93, rot: -0.5, bob: '-4s'  },
  { radius: '35vmin', speed: '105s', start: '-46s',  xs: 1.25, ys: 0.92, rot: 0.8,  bob: '-5s', ccw: true },
  { radius: '40vmin', speed: '125s', start: '-75s',  xs: 1.30, ys: 0.90, rot: -1.1, bob: '-6s'  },
  { radius: '43vmin', speed: '185s', start: '-130s', xs: 1.32, ys: 0.89, rot: 0.4,  bob: '-7s', ccw: true },
  { radius: '46vmin', speed: '220s', start: '-160s', xs: 1.35, ys: 0.88, rot: -0.6, bob: '-8s'  }
];

// ─── Helpers ───
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

function catLabel(data, id) {
  const c = data.categories.find(c => c.id === id);
  return c ? c.label : id;
}

// ─── Data source ───
// In production: fetch live data from /api/data (KV-backed, admin-editable).
// Fallback: window.__DATA__ from the static data.js (works for local file:// dev).
async function loadData() {
  try {
    const res = await fetch('/api/data', { cache: 'no-cache' });
    if (res.ok) return await res.json();
  } catch (_) { /* network/CORS — fall through */ }
  if (window.__DATA__) return window.__DATA__;
  throw new Error('No data available (no /api/data and no window.__DATA__)');
}

// ─── Renderers ───

function renderHero(data) {
  const root = document.getElementById('hero');
  if (!root) return;
  root.innerHTML = `
    <h1>${esc(data.hero.title)}</h1>
    <p class="subtitle">${esc(data.hero.subtitle)}</p>
    <p class="location">${esc(data.hero.location)}</p>
    <a class="cta" href="work.html">See my work</a>
  `;
}

function renderConstellation(data) {
  const root = document.getElementById('constellation');
  if (!root) return;
  const films = data.films.slice(0, 9);
  root.innerHTML = films.map((film, i) => {
    const slot = SLOTS[i] || SLOTS[SLOTS.length - 1];
    const ccwClass = slot.ccw ? ' ccw' : '';
    const catStr = `${esc(catLabel(data, film.category))} · ${film.year}`;
    return `
      <div class="orbiter${ccwClass}" style="--radius:${slot.radius}; --speed:${slot.speed}; --start:${slot.start}; --xs:${slot.xs}; --ys:${slot.ys};">
        <div class="float" style="--rot:${slot.rot}deg; --bob:${slot.bob};">
          <div class="camera-card" style="width:260px;"
               data-title="${esc(film.title)}"
               data-cat="${catStr}"
               data-vimeo="${esc(film.vimeo)}" data-hover>
            <div class="card-hud"><span>FPS ${esc(film.fps)} EI ${esc(film.ei)}</span><span><span class="rec-dot"></span>REC</span></div>
            <div class="card-thumb" style="height:163px;">
              <img src="${esc(film.thumb)}" alt="${esc(film.title)}">
              <div class="corner-brackets"></div>
              <div class="crosshair"></div>
            </div>
            <div class="card-hud-bottom"><span><span class="stby-dot"></span>STBY</span><span>CLIP ${esc(film.clip)}</span><span>${esc(film.duration)}</span></div>
            <div class="card-meta-hover">
              <div class="card-title">${esc(film.title)}</div>
              <div class="card-cat">${catStr}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderWork(data) {
  // Film count
  const countEl = document.getElementById('film-count');
  if (countEl) countEl.textContent = String(data.films.length).padStart(2, '0') + ' FILMS';

  // Gallery
  const gallery = document.getElementById('gallery');
  if (gallery) {
    gallery.innerHTML = data.eras.map(era => {
      const eraFilms = data.films.filter(f => f.era === era.id);
      if (!eraFilms.length) return '';
      return `
        <div class="year-section">
          <div class="year-heading">
            <h2>${esc(era.label)}</h2>
            <span class="year-tag">// ${era.year}</span>
            <span class="year-scroll">— SCROLL</span>
          </div>
          <div class="cards-grid">
            ${eraFilms.map((film, idx) => {
              const metaLine = `${esc(catLabel(data, film.category))} · ${film.year}${film.agency ? ' · Agence : ' + esc(film.agency) : ''}`;
              const agencyTag = film.agency ? esc(film.agency.toUpperCase()) : '—';
              return `
                <div class="work-card" data-category="${esc(film.category)}"
                     data-title="${esc(film.title)}" data-meta="${metaLine}"
                     data-vimeo="${esc(film.vimeo)}">
                  <div class="camera-card">
                    <div class="card-hud"><span>FPS ${esc(film.fps)} EI ${esc(film.ei)}</span><span><span class="rec-dot"></span>REC</span></div>
                    <div class="card-thumb">
                      <img src="${esc(film.thumb)}" alt="${esc(film.title)}">
                      <div class="corner-brackets"></div>
                      <div class="crosshair"></div>
                    </div>
                    <div class="card-hud-bottom">
                      <span><span class="stby-dot"></span>STBY</span>
                      <span>CLIP ${esc(film.clip)}</span>
                      <span class="agency">AGENCE · ${agencyTag}</span>
                    </div>
                  </div>
                  <div class="work-card-info">
                    <div class="work-card-title">${esc(film.title)}</div>
                    <div class="work-card-meta">${esc(catLabel(data, film.category))} · ${film.year}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('');
  }

}

function renderAbout(data) {
  const bio = document.getElementById('about-bio');
  if (bio) bio.innerHTML = data.bio.map(p => `<p class="bio">${p}</p>`).join('');

  const disc = document.getElementById('about-disciplines');
  if (disc) disc.innerHTML = data.disciplines.map(d => `<li>${esc(d)}</li>`).join('');

  const clients = document.getElementById('about-clients');
  if (clients) clients.innerHTML = data.clients.map(c =>
    `<span class="client-tag">${esc(c)}</span>`
  ).join('');

  const ag = document.getElementById('about-agencies');
  if (ag) ag.innerHTML = data.agencies.map(a =>
    `<li><span class="agency-name">${esc(a.name)}</span><span class="agency-city">${esc(a.region)}</span></li>`
  ).join('');
}

function renderContact(data) {
  const emailEl = document.getElementById('contact-email');
  if (emailEl) {
    emailEl.href = 'mailto:' + data.email;
    emailEl.textContent = data.email.toUpperCase();
  }

  const agRoot = document.getElementById('contact-agencies');
  if (agRoot) {
    agRoot.innerHTML = data.agencies.map(a => `
      <div class="agency-entry">
        <div class="agency-location">${esc(a.region)}</div>
        <div class="agency-info">
          <div class="agency-name">${esc(a.name)}</div>
          ${a.contact ? `<div class="agency-contact">${esc(a.contact)}</div>` : ''}
          ${a.address && a.address.length ? `<div class="agency-address">${a.address.map(esc).join('<br>')}</div>` : ''}
          ${(a.emails || []).map(e => `<a class="agency-email" href="mailto:${esc(e)}">${esc(e.toUpperCase())}</a>`).join('')}
        </div>
      </div>
    `).join('');
  }

  const socialsRoot = document.getElementById('contact-socials');
  if (socialsRoot) {
    socialsRoot.innerHTML = `
      <a class="social-link" href="${esc(data.socials.instagram)}" target="_blank" rel="noopener">Instagram</a>
      <a class="social-link" href="${esc(data.socials.vimeo)}" target="_blank" rel="noopener">Vimeo</a>
      <a class="social-link" href="${esc(data.socials.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>
    `;
  }
}

// ─── Footer (shared) ───
function renderFooter(data) {
  const ig = document.getElementById('footer-instagram');
  const vm = document.getElementById('footer-vimeo');
  const ln = document.getElementById('footer-linkedin');
  if (ig) ig.href = data.socials.instagram;
  if (vm) vm.href = data.socials.vimeo;
  if (ln) ln.href = data.socials.linkedin;

  const ticker = document.getElementById('ticker-inner');
  if (ticker) {
    const parts = data.clients.map(c => `${c.toUpperCase()} · COMMERCIAL`).join(' &nbsp;&nbsp;·&nbsp;&nbsp; ');
    const content = parts + ' &nbsp;&nbsp;·&nbsp;&nbsp; ';
    ticker.innerHTML = content + content;
  }

  const copy = document.getElementById('footer-copy');
  if (copy) copy.textContent = data.copyright;
}

// ─── Modal wiring (home + work) ───
function wireModal() {
  const modal = document.getElementById('modal');
  if (!modal) return;
  const modalTitle = document.getElementById('modal-title');
  const modalMeta = document.getElementById('modal-meta');
  const modalIframe = document.getElementById('modal-iframe');
  const modalShare = document.getElementById('modal-share');
  const closeBtn = document.getElementById('modal-close-btn');
  const toast = document.getElementById('toast');

  function open(card) {
    const id = card.dataset.vimeo;
    modalTitle.textContent = card.dataset.title || '';
    modalMeta.textContent = card.dataset.meta || card.dataset.cat || '';
    modalIframe.src = id ? `https://player.vimeo.com/video/${id}?autoplay=1&color=F0EDE8&title=0&byline=0&portrait=0` : '';
    modal.classList.add('open');
  }
  function close() {
    modal.classList.remove('open');
    modalIframe.src = '';
  }

  document.querySelectorAll('.camera-card[data-vimeo], .work-card[data-vimeo]').forEach(card => {
    if (card.classList.contains('empty')) return;
    card.addEventListener('click', () => open(card));
  });

  if (closeBtn) closeBtn.addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  if (modalShare) {
    modalShare.addEventListener('click', () => {
      navigator.clipboard.writeText(window.location.href);
      if (toast) {
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
      }
    });
  }
}

// ─── Boot ───
(async function init() {
  let data;
  try {
    data = await loadData();
  } catch (err) {
    console.error('[render] data load failed', err);
    document.body.classList.add('loaded');
    return;
  }

  const page = document.body.dataset.page;
  if (page === 'home')    { renderHero(data); renderConstellation(data); }
  if (page === 'work')    { renderWork(data); }
  if (page === 'about')   { renderAbout(data); }
  if (page === 'contact') { renderContact(data); }

  renderFooter(data);
  wireModal();

  // Let cursor.js pick up the newly rendered cards, links, and buttons
  if (typeof window.refreshRepelTargets === 'function') window.refreshRepelTargets();
  if (typeof window.wireHoverTargets    === 'function') window.wireHoverTargets();
  if (typeof window.wirePageTransitions === 'function') window.wirePageTransitions();

  // Reveal the page
  document.body.classList.add('loaded');
})();
