// CareCircle Service Worker — Push Notifications

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
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-72.png",
    data: payload.data || {},
    vibrate: [100, 50, 100],
    tag: payload.tag || "carecircle-notification",
    renotify: true,
    actions: [],
  };

  // Add actions based on notification type
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
