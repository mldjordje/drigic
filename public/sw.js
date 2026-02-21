self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      const cacheKeys = await caches.keys();
      await Promise.all(cacheKeys.map((key) => caches.delete(key)));
    })()
  );
});

self.addEventListener("push", (event) => {
  if (!event.data) {
    return;
  }

  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = {};
  }

  const title = payload.title || "Dr Igic";
  const body = payload.body || "Imate novo obavestenje.";
  const url = payload.url || "/beauty-pass";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      data: { url },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || "/beauty-pass";

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      const existing = allClients.find((client) => client.url.includes(self.location.origin));
      if (existing) {
        await existing.focus();
        if ("navigate" in existing) {
          await existing.navigate(targetUrl);
        }
        return;
      }
      await self.clients.openWindow(targetUrl);
    })()
  );
});
