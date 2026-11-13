/* Service worker do painel (app instalável).
   - Painel e arquivos dele ficam guardados para abrir rápido e funcionar sem internet.
   - HTML, JS e CSS: tenta a internet primeiro (pega sempre a versão nova) e usa a cópia guardada se cair.
   - Imagens e fontes: usa a cópia guardada e atualiza por trás.
   - /api (assistente de IA) nunca é guardado.
   Ao publicar uma versão nova, suba o número em CACHE. */
const CACHE = 'painel-maxxs-v2';
const SHELL = [
  "painel.html",
  "assets/css/painel.css",
  "assets/js/store.js",
  "assets/js/painel.js",
  "assets/js/ia.js",
  "assets/js/app.js",
  "painel.webmanifest",
  "assets/img/app/icon-192.png",
  "assets/img/app/icon-512.png",
  "assets/img/app/apple-180.png",
  "assets/img/logo-branco.svg",
  "assets/img/logo.svg",
  "assets/img/icone.svg",
  "assets/img/favicon.png",
  "assets/fonts/saira-latin-700-normal.woff2",
  "assets/fonts/saira-latin-800-normal.woff2",
  "assets/fonts/manrope-latin-400-normal.woff2",
  "assets/fonts/manrope-latin-600-normal.woff2",
  "assets/fonts/manrope-latin-700-normal.woff2",
  "assets/fonts/manrope-latin-800-normal.woff2"
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('painel-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    if (req.mode === 'navigate') return (await cache.match('painel.html')) || Response.error();
    throw err;
  }
}
async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req, { ignoreSearch: true });
  const net = fetch(req).then((res) => { if (res && res.ok) cache.put(req, res.clone()); return res; }).catch(() => null);
  return hit || (await net) || Response.error();
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;            // fotos externas, Google, Meta: direto
  if (url.pathname.startsWith('/api/')) return;               // assistente de IA: sempre ao vivo
  if (/\.(mp4|webm|mov)$/i.test(url.pathname)) return;        // vídeo: o navegador cuida
  if (req.mode === 'navigate' || /\.(js|css|webmanifest|json)$/i.test(url.pathname)) { e.respondWith(networkFirst(req)); return; }
  if (/\.(png|jpe?g|webp|svg|gif|ico|woff2?)$/i.test(url.pathname)) { e.respondWith(cacheFirst(req)); }
});
