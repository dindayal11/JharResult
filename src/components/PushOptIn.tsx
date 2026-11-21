"use client";

import { useEffect, useState } from "react";

function applicationKey(value: string) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const raw = atob((value + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

export default function PushOptIn() {
  const [supported, setSupported] = useState(false);
  const [state, setState] = useState<"idle" | "subscribed" | "working" | "error">("idle");

  useEffect(() => {
    const available = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setSupported(available);
    if (!available) return;
    navigator.serviceWorker.register("/sw.js").then(async (registration) => {
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) setState("subscribed");
    }).catch(() => setState("error"));
  }, []);

  async function enable() {
    setState("working");
    try {
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) throw new Error("Notifications are not configured yet.");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Notification permission was not granted.");
      const registration = await navigator.serviceWorker.register("/sw.js");
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: applicationKey(key) });
      const response = await fetch("/api/push/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(subscription) });
      if (!response.ok) throw new Error("Could not save your notification preference.");
      setState("subscribed");
    } catch (error) {
      console.error(error);
      setState("error");
    }
  }

  if (!supported || state === "subscribed") return null;
  return (
    <aside aria-label="JharResult notifications" style={{ position: "fixed", zIndex: 40, right: 14, bottom: 14, maxWidth: 310, padding: 13, border: "1px solid #dbe4ef", borderRadius: 12, background: "#fff", boxShadow: "0 8px 28px rgba(15,23,42,.14)" }}>
      <strong style={{ display: "block", color: "#173f70", fontSize: 14 }}>Get JharResult Updates</strong>
      <p style={{ margin: "5px 0 10px", color: "#526174", fontSize: 12, lineHeight: 1.5 }}>Receive alerts for new jobs, results, admit cards and important updates. You can turn them off anytime.</p>
      <button type="button" onClick={enable} disabled={state === "working"} style={{ border: 0, borderRadius: 7, padding: "9px 12px", background: "#173f70", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
        {state === "working" ? "Please wait..." : state === "error" ? "Try Again" : "Enable Notifications"}
      </button>
    </aside>
  );
}
