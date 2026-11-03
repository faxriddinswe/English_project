const VERSION = "sherzod-public-v12";
const SHELL = ["/offline", "/icons/icon-192.png", "/icons/icon-512.png"];
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    (async () => {
      if (
        self.location.hostname === "localhost" ||
        self.location.hostname === "127.0.0.1"
      ) {
        // In local development, clear caches immediately and do not cache dynamic dev chunks
        const keys = await caches.keys();
        await Promise.all(
          keys
            .filter((k) => k.startsWith("sherzod-public-"))
            .map((k) => caches.delete(k)),
        );
        return;
      }
      const cache = await caches.open(VERSION);
      await cache.addAll(SHELL);
      const page = await cache.match("/offline");
      const html = await page.text();
      const assets = [
        ...html.matchAll(
          /(?:src|href)="(\/_next\/static\/[^"?]+(?:\?[^" ]*)?)"/g,
        ),
      ].map((m) => m[1].replaceAll("&amp;", "&"));
      await Promise.allSettled(
        [
          ...new Set(assets),
          "/fonts/LiberationSans-Regular.ttf",
          "/fonts/LiberationSans-Bold.ttf",
        ].map((url) => cache.add(url)),
      );
    })(),
  );
});
self.addEventListener("activate", (event) =>
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("sherzod-public-") && k !== VERSION)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  ),
);
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
self.addEventListener("fetch", (event) => {
  const request = event.request,
    url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (
    self.location.hostname === "localhost" ||
    self.location.hostname === "127.0.0.1"
  ) {
    // In local development, do not cache Next.js dev bundles or chunks to prevent stale chunk hydration errors
    return;
  }
  if (/^\/(api|teacher|student|login|change-password)(\/|$)/.test(url.pathname))
    return;
  if (request.mode === "navigate") {
    // Public HTML is network-only too: CMS changes never remain in stale HTML caches.
    event.respondWith(fetch(request).catch(() => caches.match("/offline")));
    return;
  }
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/fonts/") ||
    url.pathname.startsWith("/icons/")
  ) {
    event.respondWith(
      caches.open(VERSION).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone());
        return response;
      }),
    );
  }
});
