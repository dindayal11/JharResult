
"use client";

import { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
        console.log("Email:", email.trim().toLowerCase());
        console.log("Password length:", password.length);
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password
        })
      });

      const d = await r.json();

      if (!r.ok) {
        setError(d.error || "Login failed");
        return;
      }

      window.location.replace("/admin");
    } catch {
      setError("Server connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container" style={{ maxWidth: 440, padding: "70px 0" }}>
      <a className="brand" href="/">
        JHAR<span>RESULT</span>
      </a>

      <div className="panel" style={{ marginTop: 24 }}>
        <h1>Admin Login</h1>

        <form onSubmit={submit}>
          <label className="label">Email</label>
          <input
            className="field"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label className="label">Password</label>
          <input
            className="field"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="btn" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>

          {error && (
            <p style={{ color: "crimson", marginTop: 12 }}>{error}</p>
          )}
        </form>
      </div>
    </main>
  );
}
