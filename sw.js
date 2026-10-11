// SafaBoxBD: ক্যাশ (অফলাইনে দ্রুত খোলা)। index.html এর পাশে একই ফোল্ডারে রাখুন।
const CACHE = 'sbx-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
function put(r, resp) {
  if (resp && (resp.ok || resp.type === 'opaque')) { const c = resp.clone(); caches.open(CACHE).then(ca => ca.put(r, c)).catch(() => {}); }
}
// নেট থাকলে নতুন ভার্সন, ধীর/অফলাইন হলে ক্যাশ
function netFirst(r) {
  return new Promise(res => {
    let done = false;
    const t = setTimeout(() => caches.match(r, { ignoreSearch: true }).then(m => { if (m && !done) { done = true; res(m); } }), 3500);
    fetch(r).then(resp => { clearTimeout(t); put(r, resp); if (!done) { done = true; res(resp); } })
      .catch(() => { clearTimeout(t); caches.match(r, { ignoreSearch: true }).then(m => { if (!done) { done = true; res(m || Response.error()); } }); });
  });
}
// সিডিএন ফাইল (Tailwind, আইকন, ফন্ট): ক্যাশ থেকে সাথে সাথে
function cacheFirst(r) {
  return caches.match(r).then(m => m || fetch(r).then(resp => { put(r, resp); return resp; }));
}
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.hostname === 'script.google.com' || u.hostname === 'script.googleusercontent.com') return; // সিঙ্ক কখনো ক্যাশ নয়
  if (r.mode === 'navigate' || u.origin === location.origin) e.respondWith(netFirst(r));
  else e.respondWith(cacheFirst(r));
});
