"use client";

import { useEffect, useState } from "react";
import { subscribeToPush, unsubscribeFromPush, isPushSubscribed } from "@/lib/push";

export default function PushPrompt() {
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    isPushSubscribed().then(setSubscribed);
  }, []);

  if (subscribed === null) return null;
  if (!("PushManager" in window)) return null;

  const toggle = async () => {
    setLoading(true);
    if (subscribed) {
      const ok = await unsubscribeFromPush();
      if (ok) setSubscribed(false);
    } else {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        const ok = await subscribeToPush();
        if (ok) setSubscribed(true);
      }
    }
    setLoading(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
    >
      {loading ? "..." : subscribed ? "Disable notifications" : "Enable notifications"}
    </button>
  );
}
