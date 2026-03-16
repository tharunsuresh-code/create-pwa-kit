import type { FeaturePack } from "../types";

export const pushPack: FeaturePack = {
  name: "push",
  deps: {
    "web-push": "^3.6.7",
  },
  devDeps: {
    "@types/web-push": "^3.6.3",
  },
  files: [
    {
      templateSrc: "src/lib/push.ts",
      dest: "src/lib/push.ts",
    },
    {
      templateSrc: "src/app/api/push/subscribe/route.ts",
      dest: "src/app/api/push/subscribe/route.ts",
    },
    {
      templateSrc: "src/app/api/push/unsubscribe/route.ts",
      dest: "src/app/api/push/unsubscribe/route.ts",
    },
    {
      templateSrc: "src/app/api/push/send/route.ts",
      dest: "src/app/api/push/send/route.ts",
    },
    {
      templateSrc: "src/components/PushPrompt.tsx",
      dest: "src/components/PushPrompt.tsx",
    },
  ],
  injections: [
    {
      file: "public/sw.js",
      marker: "// FEATURE_INJECT: push_handlers",
      content: `// ─── IDB helpers ──────────────────────────────────────────────────────────
const IDB_NAME = "{{PROJECT_NAME}}-push";
const IDB_STORE = "meta";

function openPushIDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function getFromIDB(key) {
  return openPushIDB().then(
    (db) =>
      new Promise((resolve) => {
        const tx = db.transaction(IDB_STORE, "readonly");
        const r = tx.objectStore(IDB_STORE).get(key);
        r.onsuccess = () => resolve(r.result ?? null);
        r.onerror = () => resolve(null);
      })
  );
}

// ─── Push subscription auto-refresh ────────────────────────────────────────
self.addEventListener("pushsubscriptionchange", (event) => {
  const options = event.oldSubscription?.options;
  if (!options) return;
  event.waitUntil(
    Promise.all([
      self.registration.pushManager.subscribe(options),
      getFromIDB("device_id"),
    ])
      .then(([newSub, deviceId]) => {
        if (!deviceId) return;
        return fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: newSub.toJSON(), deviceId }),
        });
      })
      .catch(console.error)
  );
});

// ─── Push ──────────────────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  let data = { title: "{{PROJECT_NAME_TITLE}}", body: "You have a new notification." };
  if (event.data) {
    try { data = event.data.json(); } catch { data.body = event.data.text(); }
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192.png",
      data: { url: data.url || "/" },
    })
  );
});

// ─── Notification click ────────────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((c) => c.url.includes(self.location.origin));
        if (existing) return existing.focus().then(() => existing.navigate(targetUrl));
        return self.clients.openWindow(targetUrl);
      })
  );
});`,
    },
  ],
  envVars: [
    "",
    "# Push Notifications (generate with: npx web-push generate-vapid-keys)",
    "NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key",
    "VAPID_PRIVATE_KEY=your-vapid-private-key",
    "VAPID_MAILTO=mailto:hello@example.com",
    "CRON_SECRET=your-cron-secret",
  ],
};
