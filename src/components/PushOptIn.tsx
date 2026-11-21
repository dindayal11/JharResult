"use client";

import { useEffect, useState } from "react";

type OptInState = "idle" | "subscribed" | "working" | "denied" | "error";

function applicationKey(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const raw = atob((value + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

async function saveSubscription(subscription: PushSubscription) {
  const response = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription),
  });
  if (!response.ok) {
    const result = await response.json().catch(() => null);
    throw new Error(result?.error || "We couldn't save your notification subscription. Please try again.");
  }
}

export default function PushOptIn() {
  const [supported, setSupported] = useState(false);
  const [state, setState] = useState<OptInState>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    const available =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setSupported(available);
    if (!available) return;

    navigator.serviceWorker.register("/sw.js")
      .then(async (registration) => {
        if (!active) return;
        if (Notification.permission === "denied") {
          setState("denied");
          return;
        }
        if (Notification.permission === "granted") {
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            try {
              await saveSubscription(subscription);
              if (active) setState("subscribed");
            } catch (error) {
              if (active) {
                setMessage(error instanceof Error ? error.message : "Could not save your subscription.");
                setState("error");
              }
            }
          }
        }
      })
      .catch((error) => {
        console.error("Service worker registration failed:", error);
        if (active) {
          setMessage("Notifications could not be initialized. Please refresh the page and try again.");
          setState("error");
        }
      });

    return () => { active = false; };
  }, []);

  async function enable() {
    setState("working");
    setMessage("");
    try {
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) throw new Error("Notifications are not configured yet. Please try again later.");

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState("denied");
        setMessage("Notifications are blocked for this site. Open your browser's Site Settings, change Notifications to Allow, then return here and tap the button again.");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationKey(key),
        });
      }

      await saveSubscription(subscription);
      setState("subscribed");
    } catch (error) {
      console.error("JharResult notification setup failed:", error);
      setMessage(error instanceof Error ? error.message : "Notifications could not be enabled. Please try again.");
      setState("error");
    }
  }

  if (!supported || state === "subscribed") return null;

  return (
    <aside
      aria-label="JharResult notifications"
      role="dialog"
      aria-live="polite"
      style={{
        position: "fixed",
        zIndex: 1000,
        right: 14,
        bottom: 14,
        width: "min(390px, calc(100vw - 28px))",
        boxSizing: "border-box",
        padding: 18,
        border: "1px solid #dbe4ef",
        borderRadius: 16,
        background: "#fff",
        boxShadow: "0 12px 36px rgba(15,23,42,.2)",
      }}
    >
      <strong style={{ display: "block", color: "#173f70", fontSize: 19 }}>
        Get JharResult Updates
      </strong>
      <p style={{ margin: "8px 0 14px", color: "#526174", fontSize: 14, lineHeight: 1.55 }}>
        Allow notifications to receive new Jharkhand jobs, results, admit cards and important education updates. You can turn them off anytime.
      </p>

      {message && (
        <p role="alert" style={{ margin: "0 0 12px", padding: 10, borderRadius: 8, background: "#fff7ed", color: "#9a3412", fontSize: 13, lineHeight: 1.5 }}>
          {message}
        </p>
      )}

      {state === "denied" && (
        <p style={{ margin: "0 0 12px", color: "#526174", fontSize: 13, lineHeight: 1.5 }}>
          In Chrome, tap the site icon beside the address, open Site settings, set Notifications to Allow, then come back here.
        </p>
      )}

      <button
        type="button"
        onClick={enable}
        disabled={state === "working"}
        style={{
          border: 0,
          borderRadius: 9,
          padding: "12px 18px",
          background: "#173f70",
          color: "#fff",
          fontWeight: 700,
          fontSize: 15,
          cursor: state === "working" ? "wait" : "pointer",
          opacity: state === "working" ? 0.7 : 1,
        }}
      >
        {state === "working"
          ? "Enabling..."
          : state === "denied"
            ? "I've Allowed It — Try Again"
            : state === "error"
              ? "Try Again"
              : "Allow Notifications"}
      </button>
    </aside>
  );
}
