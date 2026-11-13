"use client";

import { useState } from "react";

type SharePostButtonProps = {
  title: string;
};

export default function SharePostButton({ title }: SharePostButtonProps) {
  const [status, setStatus] = useState<"idle" | "shared" | "copied" | "error">("idle");
  const [isSharing, setIsSharing] = useState(false);

  async function copyPageLink() {
    const url = window.location.href;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = url;
        textArea.setAttribute("readonly", "");
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        const copied = document.execCommand("copy");
        document.body.removeChild(textArea);
        if (!copied) throw new Error("Clipboard copy failed");
      }
      setStatus("copied");
    } catch {
      setStatus("error");
    }
  }

  async function sharePage() {
    if (isSharing) return;

    const shareData = {
      title,
      text: title,
      url: window.location.href,
    };

    if (typeof navigator.share !== "function") {
      await copyPageLink();
      return;
    }

    setIsSharing(true);
    try {
      await navigator.share(shareData);
      setStatus("shared");
    } catch (error) {
      // Closing the native share sheet is not an error and should not trigger a copy.
      if (error instanceof Error && error.name === "AbortError") return;
      // Some browsers reject share payloads; provide a useful copy-link fallback.
      await copyPageLink();
    } finally {
      setIsSharing(false);
    }
  }

  return (
    <section
      aria-label="Share this post"
      style={{
        margin: "22px 0",
        padding: "18px",
        border: "1px solid #dce3ec",
        borderRadius: 9,
        background: "#f8fafc",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 14,
        flexWrap: "wrap",
      }}
    >
      <div style={{ minWidth: 0, flex: "1 1 220px" }}>
        <strong style={{ display: "block", color: "#173f70", fontSize: 17 }}>
          Share this Post
        </strong>
        <span style={{ display: "block", color: "#52657c", fontSize: 13, lineHeight: 1.5, marginTop: 4 }}>
          Help others discover this update by sharing it with friends and family.
        </span>
        {status !== "idle" && (
          <span
            role="status"
            aria-live="polite"
            style={{
              display: "block",
              marginTop: 7,
              color: status === "error" ? "#b42318" : "#187344",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {status === "copied"
              ? "Link copied! You can now paste and share it."
              : status === "shared"
                ? "Share menu opened successfully."
                : status === "error"
                  ? "Could not copy the link. Please copy the page URL from your browser."
                  : ""}
          </span>
        )}
      </div>

      <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={sharePage}
          disabled={isSharing}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "11px 18px",
            border: 0,
            borderRadius: 6,
            background: "#173f70",
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
            cursor: isSharing ? "wait" : "pointer",
            opacity: isSharing ? 0.75 : 1,
          }}
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 15V3m0 0L7.5 7.5M12 3l4.5 4.5M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {isSharing ? "Sharing..." : "Share"}
        </button>
        <button
          type="button"
          onClick={copyPageLink}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "11px 16px",
            border: "1px solid #cbd5e1",
            borderRadius: 6,
            background: "#fff",
            color: "#173f70",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" />
            <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" stroke="currentColor" strokeWidth="1.8" />
          </svg>
          Copy Link
        </button>
      </div>
    </section>
  );
}
