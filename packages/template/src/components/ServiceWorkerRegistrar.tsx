"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          console.log("[SW] Registered, scope:", reg.scope);
        })
        .catch((err) => {
          console.error("[SW] Registration failed:", err);
        });
    }
  }, []);

  return null;
}
