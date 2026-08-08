"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { callApi } from "./api-client";

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("demo@example.com");
  const [password, setPassword] = useState("password123");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    try {
      await callApi(`/api/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      router.push("/documents");
      router.refresh();
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Authentication failed");
    }
  }

  return (
    <section className="auth-card">
      <div>
        <p className="eyebrow">Secure workspace</p>
        <h1>Multi-Rate Pricing Calculator</h1>
        <p>Sign in or create an account to manage documents, line items, finalization, and reports.</p>
      </div>

      <div className="segmented">
        <button type="button" className={mode === "login" ? undefined : "secondary"} onClick={() => setMode("login")}>
          Log in
        </button>
        <button type="button" className={mode === "signup" ? undefined : "secondary"} onClick={() => setMode("signup")}>
          Sign up
        </button>
      </div>

      {error ? <div className="message error">{error}</div> : null}

      <div className="form-grid">
        <label>
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        <button type="button" onClick={submit}>
          {mode === "login" ? "Log in" : "Create account"}
        </button>
      </div>
    </section>
  );
}
