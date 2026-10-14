// 앱 파일을 기기에 저장해 두어, 인터넷이 약해도 빠르게 열리게 합니다.
// 앱을 고치면 VERSION 숫자를 올려야 휴대폰에도 새 버전이 반영됩니다.
const VERSION = "aria-shorts-v2";   // 2026-10-14 음악 선택·황실 액자
const FILES = ["./", "index.html", "style.css", "video.js", "app.js", "logo.jpg", "icon-192.png", "icon-512.png", "manifest.webmanifest"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 새 버전을 먼저 받아 보고, 안 되면(오프라인) 저장해 둔 파일을 씀
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
