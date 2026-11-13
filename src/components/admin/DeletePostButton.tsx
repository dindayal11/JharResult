"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type DeletePostButtonProps = {
  postId: number;
  postTitle: string;
};

export default function DeletePostButton({ postId, postTitle }: DeletePostButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function confirmDelete() {
    if (busy) return;
    setBusy(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Could not delete this post.");
      }

      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete this post.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError("");
          setOpen(true);
        }}
        style={{
          display: "inline-block",
          padding: "6px 12px",
          border: "0",
          borderRadius: 6,
          background: "#fee2e2",
          color: "#b91c1c",
          fontWeight: 700,
          cursor: "pointer",
        }}
        aria-label={`Delete post: ${postTitle}`}
      >
        Delete
      </button>

      {open && (
        <div
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !busy) setOpen(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 18,
            background: "rgba(15, 23, 42, 0.62)",
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={`delete-post-title-${postId}`}
            aria-describedby={`delete-post-description-${postId}`}
            style={{
              width: "100%",
              maxWidth: 440,
              padding: 22,
              borderRadius: 12,
              background: "#fff",
              boxShadow: "0 24px 70px rgba(0,0,0,.28)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span
                aria-hidden="true"
                style={{
                  display: "grid",
                  placeItems: "center",
                  width: 38,
                  height: 38,
                  borderRadius: 999,
                  background: "#fee2e2",
                  color: "#b91c1c",
                  fontSize: 20,
                  fontWeight: 800,
                }}
              >
                !
              </span>
              <h2 id={`delete-post-title-${postId}`} style={{ margin: 0, color: "#172033", fontSize: 19 }}>
                Confirm Post Deletion
              </h2>
            </div>

            <p id={`delete-post-description-${postId}`} style={{ margin: "0 0 8px", color: "#475569", lineHeight: 1.55 }}>
              Are you sure you want to permanently delete this post?
            </p>
            <p style={{ margin: "0 0 16px", padding: 11, borderRadius: 7, background: "#f8fafc", color: "#172033", fontWeight: 700, overflowWrap: "anywhere" }}>
              {postTitle}
            </p>
            <p style={{ margin: "0 0 18px", color: "#b91c1c", fontSize: 13 }}>
              This action cannot be undone.
            </p>

            {error && (
              <p role="alert" style={{ margin: "0 0 14px", color: "#b91c1c", fontSize: 13 }}>
                {error}
              </p>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 9, flexWrap: "wrap" }}>
              <button
                type="button"
                disabled={busy}
                onClick={() => setOpen(false)}
                style={{
                  padding: "10px 15px",
                  border: "1px solid #cbd5e1",
                  borderRadius: 7,
                  background: "#fff",
                  color: "#334155",
                  fontWeight: 700,
                  cursor: busy ? "not-allowed" : "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={confirmDelete}
                style={{
                  padding: "10px 15px",
                  border: 0,
                  borderRadius: 7,
                  background: busy ? "#fca5a5" : "#dc2626",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: busy ? "wait" : "pointer",
                }}
              >
                {busy ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
