self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch {}
  const title = data.title || "JharResult Update";
  const options = {
    body: data.body || "A new update is available on JharResult.",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: data.tag || "jharresult-update",
    renotify: false,
    data: { url: data.url || "/" }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of windows) {
      if ("focus" in client) {
        await client.navigate(target);
        return client.focus();
      }
    }
    return clients.openWindow(target);
  })());
});
