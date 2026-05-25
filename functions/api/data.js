// /api/data — read/write the site content from KV.
//
//   GET  /api/data                → JSON, returns current data (or SEED if KV empty)
//   GET  /api/data?format=js      → JavaScript, sets window.__DATA__ — used by front-end <script>
//   POST /api/data                → write new data to KV (requires Authorization: Bearer <ADMIN_PASSWORD>)
//
// Bindings expected (set in Cloudflare Pages → Settings):
//   - DATA            (KV namespace, binding name "DATA" → els_data)
//   - ADMIN_PASSWORD  (secret, the shared admin password)

const KV_KEY = 'site';

// Bootstrap seed — only used the very first time KV is empty.
// Once the admin saves anything, KV has the real data and this is never read again.
const SEED = {
  version: 1,
  hero: {
    title: "Welcome.",
    subtitle: "I'm Edouard Le Scouarnec.",
    location: "Director — Paris"
  },
  eras: [
    { id: "freshest", label: "Freshest Sh*t",     year: 2026 },
    { id: "still",    label: "Still Pretty Good", year: 2025 },
    { id: "humble",   label: "The Humble Era",    year: 2024 }
  ],
  categories: [
    { id: "all",         label: "All Works" },
    { id: "commercial",  label: "Commercial" },
    { id: "music-video", label: "Music Video" },
    { id: "narrative",   label: "Narrative" }
  ],
  films: [
    { id: "betclic_la_ligne",        title: "Betclic — La Ligne",        year: 2026, era: "freshest", category: "commercial", agency: "Publicis", vimeo: "1183049164", thumb: "assets/betclic_la_ligne.jpg",        fps: "23.976", ei: "800",  clip: "A001C001", duration: "0:35" },
    { id: "harrys_chocalin",         title: "Harry's — Chocalin",        year: 2026, era: "freshest", category: "commercial", agency: "BETC",     vimeo: "1028199498", thumb: "assets/harrys_chocalin.jpg",         fps: "23.976", ei: "1600", clip: "A002C001", duration: "1:02" },
    { id: "econocom_laeroport",      title: "Econocom — L'Aéroport",     year: 2026, era: "freshest", category: "commercial", agency: "DDB",      vimeo: "1118684712", thumb: "assets/econocom_laeroport.jpg",      fps: "25",     ei: "800",  clip: "A003C001", duration: "0:45" },
    { id: "econocom_lhopital",       title: "Econocom — L'Hôpital",      year: 2026, era: "freshest", category: "commercial", agency: "DDB",      vimeo: "1118683671", thumb: "assets/econocom_lhopital.jpg",       fps: "23.976", ei: "1600", clip: "A004C001", duration: "0:30" },
    { id: "fresh_la_frisee",         title: "FRESH — La Frisée",         year: 2025, era: "still",    category: "commercial", agency: "Marcel",   vimeo: "1086025854", thumb: "assets/fresh_la_frisee.jpg",         fps: "24",     ei: "800",  clip: "A005C001", duration: "1:15" },
    { id: "phytoxil_le_druide",      title: "Phytoxil — Le Druide",      year: 2025, era: "still",    category: "commercial", agency: null,       vimeo: "1164260465", thumb: "assets/phytoxil_le_druide.jpg",      fps: "23.976", ei: "800",  clip: "A006C001", duration: "2:10" },
    { id: "acova_le_collectionneur", title: "Acova — Le Collectionneur", year: 2025, era: "still",    category: "commercial", agency: null,       vimeo: "1012687169", thumb: "assets/acova_le_collectionneur.jpg", fps: "23.976", ei: "400",  clip: "A007C001", duration: "0:55" },
    { id: "econocom_le_bureau",      title: "Econocom — Le Bureau",      year: 2024, era: "humble",   category: "commercial", agency: "DDB",      vimeo: "1118687696", thumb: "assets/econocom_le_bureau.jpg",      fps: "25",     ei: "1600", clip: "A008C001", duration: "0:40" },
    { id: "econocom_la_classe",      title: "Econocom — La Classe",      year: 2024, era: "humble",   category: "commercial", agency: "DDB",      vimeo: "1118682226", thumb: "assets/econocom_la_classe.jpg",      fps: "23.976", ei: "400",  clip: "A009C001", duration: "1:30" }
  ],
  bio: [
    "Based in Paris, <strong>Edouard Le Scouarnec</strong> is a director working across commercial, music video, and narrative formats. Trained in cinematography, he brings a particular <strong>attention to light and gesture</strong> — finding the precise moment where story and image align.",
    "His work is defined by <strong>restraint</strong> — clean compositions, deliberate pacing, and a refusal to over-explain. He believes the <strong>most powerful images</strong> are those that leave room for the viewer. Silence is never emptiness; it is direction.",
    "Currently based in Paris and open to <strong>international work</strong>. Available for commercial campaigns, branded content, and narrative projects. Fluent in French and English."
  ],
  disciplines: ["Commercial Direction", "Music Video", "Narrative Short Film", "Branded Content"],
  clients: ["Betclic", "Harry's", "Econocom", "La Redoute", "Citroën", "Renault", "Décathlon", "Canal+"],
  agencies: [
    { region: "France",       name: "Players",               contact: null,                 address: ["8 rue d'Aboukir", "75002 Paris"],                          emails: ["hello@players.paris", "melanie@players.paris"] },
    { region: "Canada / USA", name: "Lovely Animals Studio", contact: null,                 address: ["123 Melrose Avenue", "Los Ángeles"],                       emails: ["rob@lovelyanimals.studio"] },
    { region: "UK",           name: "FORM London",           contact: null,                 address: ["27 Midwood Cl, London NW2 6YL", "United Kingdom"],         emails: ["hello@form.london.com"] },
    { region: "Middle East",  name: "Viewfinder Management", contact: "Brigitte Janoschka", address: ["Geistenstrasse 18", "D-40476 Düsseldorf, Germany"],        emails: ["info@view-finder.de"] }
  ],
  email: "els@edouardlescouarnec.com",
  socials: {
    instagram: "https://www.instagram.com/edouard_le_scouarnec/",
    vimeo:     "https://vimeo.com/edouardlescouarnec",
    linkedin:  "https://www.linkedin.com/in/%C3%A9douard-le-scouarnec-b733422b/"
  },
  copyright: "© 2026 ELS"
};

// ─── Helpers ───

async function getStoredData(env) {
  const raw = await env.DATA.get(KV_KEY, 'json');
  return raw || SEED;
}

function checkAuth(request, env) {
  const header = request.headers.get('Authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/);
  if (!match) return false;
  return match[1] === env.ADMIN_PASSWORD;
}

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...(init.headers || {})
    }
  });
}

// ─── GET ───
// Returns JSON by default, or a JS snippet (window.__DATA__ = …) when ?format=js
export async function onRequestGet({ env, request }) {
  const data = await getStoredData(env);
  const url = new URL(request.url);

  if (url.searchParams.get('format') === 'js') {
    const body = `window.__DATA__ = ${JSON.stringify(data)};`;
    return new Response(body, {
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        // 60s cache so we don't hammer KV on every page view, but updates land quickly.
        'Cache-Control': 'public, max-age=60'
      }
    });
  }

  return jsonResponse(data);
}

// ─── POST ───
// Body: full updated data object (JSON). Admin sends Authorization: Bearer <password>.
export async function onRequestPost({ env, request }) {
  if (!checkAuth(request, env)) {
    return jsonResponse({ error: 'unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'invalid json' }, { status: 400 });
  }

  // Light validation — we want to refuse obviously-broken payloads but trust the admin UI.
  if (!body || typeof body !== 'object' || !Array.isArray(body.films) || !Array.isArray(body.eras)) {
    return jsonResponse({ error: 'invalid shape' }, { status: 400 });
  }

  await env.DATA.put(KV_KEY, JSON.stringify(body));
  return jsonResponse({ ok: true });
}

// Block other methods explicitly.
export async function onRequest({ request }) {
  return new Response('Method Not Allowed', {
    status: 405,
    headers: { 'Allow': 'GET, POST' }
  });
}
