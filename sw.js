// 오프라인 지원. 네트워크 우선, 실패하면 마지막으로 받아둔 파일, 그것도 없으면 안내 문구.
// 절대 빈 응답을 돌려주지 않는다 (빈 응답이면 홈 화면 앱이 하얀 화면으로 멈춘다).
const CACHE = 'travel-ledger-v2';
const ASSETS = ['./', './index.html', './manifest.json', './icon.svg', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(ASSETS.map(a => c.add(a).catch(() => {})))));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  let url; try { url = new URL(e.request.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return; // 폰트 등 바깥 요청은 브라우저에 맡긴다
  e.respondWith((async () => {
    try {
      const res = await fetch(e.request);
      if (res && res.ok) { try { const c = await caches.open(CACHE); await c.put(e.request, res.clone()); } catch (err) {} }
      return res;
    } catch (err) {
      const cached = await caches.match(e.request, { ignoreSearch: true });
      if (cached) return cached;
      if (e.request.mode === 'navigate') {
        const idx = (await caches.match('./index.html')) || (await caches.match('./'));
        if (idx) return idx;
      }
      return new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><div style="font-family:-apple-system,sans-serif;padding:28px 20px;line-height:1.6"><b>인터넷 연결이 없어서 앱을 불러오지 못했어요.</b><br>기록은 그대로 있어요. 와이파이나 데이터를 켜고 앱을 완전히 닫았다가 다시 열어 주세요.</div>', { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }
  })());
});
