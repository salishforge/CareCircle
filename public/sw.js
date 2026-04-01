// CareCircle Service Worker — Push Notifications + Offline Support

const CACHE_NAME = "carecircle-v1";
const OFFLINE_URL = "/offline.html";

// Precache offline fallback on install
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll([OFFLINE_URL, "/icons/icon.svg"])
    )
  );
  self.skipWaiting();
});

// Clean old caches on activate
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Serve offline fallback for navigation requests
self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(OFFLINE_URL))
    );
  }
});

// Push notification handling
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "CareCircle", body: event.data.text() };
  }

  const options = {
    body: payload.body || "",
    icon: "/icons/icon.svg",
    badge: "/icons/icon.svg",
    data: payload.data || {},
    vibrate: [100, 50, 100],
    tag: payload.tag || "carecircle-notification",
    renotify: true,
    actions: [],
  };

  if (payload.data?.type === "ESCALATION") {
    options.actions = [
      { action: "view", title: "View Details" },
      { action: "dismiss", title: "Dismiss" },
    ];
    options.requireInteraction = true;
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || "CareCircle", options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlMap = {
    ESCALATION: "/",
    SHIFT_REMINDER: "/calendar",
    MEDICATION_REMINDER: "/medications",
    MEAL_REMINDER: "/meals",
    PATIENT_REQUEST: "/requests",
  };

  const type = event.notification.data?.type;
  const url = urlMap[type] || "/";

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
