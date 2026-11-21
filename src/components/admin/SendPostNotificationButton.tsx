"use client";

import { useState } from "react";

export default function SendPostNotificationButton({ postId }: { postId: number }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function send() {
    if (!window.confirm("Send a push notification about this published post to all subscribers?")) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/admin/posts/${postId}/notify`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Notification could not be sent.");
      setMessage(`Sent to ${data.sent} subscriber(s).`);
    } catch (error: any) {
      setMessage(error.message || "Notification failed.");
    } finally { setBusy(false); }
  }
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
    <button type="button" onClick={send} disabled={busy} style={{ border: 0, borderRadius: 6, padding: "6px 10px", background: busy ? "#94a3b8" : "#0f766e", color: "#fff", fontWeight: 700, cursor: busy ? "wait" : "pointer", fontSize: 12 }}>
      {busy ? "Sending..." : "Send Notification"}
    </button>
    {message && <small role="status" style={{ color: message.startsWith("Sent") ? "#166534" : "#b42318" }}>{message}</small>}
  </span>;
}
