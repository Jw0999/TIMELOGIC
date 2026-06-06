// TimeLogic PWA service worker.
// Caches the app shell so the app launches instantly and stays installable.
// Attendance data is always fetched live from the API (never cached) so records
// and verification can never be served stale.

const CACHE = "timelogic-shell-v1";
const SHELL = ["/", "/index.html", "/manifest.webmanifest", "/icon-192.png", "/apple-touch-icon.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  // Never cache API calls — attendance must always be live.
  if (req.method !== "GET" || req.url.includes("/api/")) return;

  // App shell + static assets: cache-first, fall back to network.
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match("/index.html"));
    })
  );
});
