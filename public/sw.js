/* HeritageHub service worker — offline support for saved/RSVP'd events. */
const VERSION = "hh-v1";
const APP_SHELL = `${VERSION}-shell`;
const RUNTIME = `${VERSION}-runtime`;
const TILES = `${VERSION}-tiles`;

const SHELL_URLS = ["/", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(APP_SHELL).then((c) => c.addAll(SHELL_URLS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // Map tiles: cache-first, capped so basic maps work with poor signal.
  if (/tile\.openstreetmap\.org|api\.mapbox\.com/.test(url.host)) {
    event.respondWith(
      caches.open(TILES).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        const res = await fetch(request);
        cache.put(request, res.clone());
        return res;
      })
    );
    return;
  }

  // Navigations: network-first, fall back to cached shell offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          caches.open(RUNTIME).then((c) => c.put(request, res.clone()));
          return res;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match("/")))
    );
    return;
  }

  // Static assets: stale-while-revalidate.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          caches.open(RUNTIME).then((c) => c.put(request, res.clone()));
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

// Push notifications (Phase 1.5): upcoming RSVP reminders & organizer updates.
self.addEventListener("push", (event) => {
  const data = (() => {
    try {
      return event.data ? event.data.json() : {};
    } catch {
      return {};
    }
  })();
  const title = data.title || "HeritageHub";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "You have an event update.",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow(event.notification.data?.url || "/"));
});
