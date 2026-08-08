"use client";

import { useState } from "react";
import { callApi } from "./api-client";

export default function AuthPanel({ onAuthenticated }: { onAuthenticated?: () => void }) {
  const [email, setEmail] = useState("demo@example.com");
  const [password, setPassword] = useState("password123");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function authenticate(mode: "signup" | "login") {
    setError(null);
    setMessage(null);
    try {
      await callApi(`/api/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      setMessage(mode === "signup" ? "Account created." : "Logged in.");
      onAuthenticated?.();
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Authentication failed");
    }
  }

  return (
    <section className="panel auth-panel">
      <div>
        <p className="eyebrow">Account</p>
        <h2>Sign in to your workspace</h2>
      </div>
      {error ? <div className="message error">{error}</div> : null}
      {message ? <div className="message success">{message}</div> : null}
      <div className="form-grid">
        <label>
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        <div className="actions">
          <button type="button" onClick={() => authenticate("login")}>
            Log in
          </button>
          <button type="button" className="secondary" onClick={() => authenticate("signup")}>
            Sign up
          </button>
        </div>
      </div>
    </section>
  );
}
