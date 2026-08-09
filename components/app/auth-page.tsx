"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { callApi } from "./api-client";
import LoadingButton from "./loading-button";
import { ToastViewport, useToasts } from "./toasts";

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const { dismissToast, showToast, toasts } = useToasts();

  async function submit() {
    setLoading(true);
    try {
      await callApi(`/api/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      router.push("/documents");
      router.refresh();
    } catch (apiError) {
      showToast(apiError instanceof Error ? apiError.message : "Authentication failed", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page min-h-screen w-full bg-[radial-gradient(circle_at_top_left,#ccfbf1,transparent_34%),linear-gradient(135deg,#f8fafc_0%,#eef2f7_45%,#e6f4f1_100%)] px-6 py-10 text-slate-950">
      <ToastViewport dismissToast={dismissToast} toasts={toasts} />
      <div className="auth-grid mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="auth-marketing hidden lg:block">
          <div className="mb-8 inline-flex rounded-full border border-teal-200 bg-white/70 px-4 py-2 text-sm font-semibold text-teal-800 shadow-sm">
            Server-calculated pricing workspace
          </div>
          <h1 className="max-w-2xl text-5xl font-black leading-[1.02] tracking-normal text-slate-950">
            Multi-rate documents with totals you can trust.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
            Create drafts, apply discounts and tax per line, finalize immutable records, and report totals by issue date.
          </p>
          <div className="mt-10 grid max-w-2xl grid-cols-3 gap-4">
            <Metric label="Line-level" value="Tax" />
            <Metric label="Draft lock" value="Finalize" />
            <Metric label="Owner scoped" value="Data" />
          </div>
        </section>

        <section className="auth-card-shell mx-auto w-full max-w-md rounded-2xl border border-white/70 bg-white/90 p-7 shadow-2xl shadow-slate-300/60 backdrop-blur">
          <div className="mb-7">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-700 text-base font-black text-white shadow-lg shadow-teal-700/20">
              MR
            </div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-700">Secure access</p>
            <h2 className="mt-2 text-3xl font-black tracking-normal text-slate-950">{mode === "login" ? "Welcome back" : "Create your account"}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {mode === "login" ? "Log in to continue to your document workspace." : "Register to start creating customer pricing documents."}
            </p>
          </div>

          <div className="auth-mode-tabs mb-6 grid grid-cols-2 border-b border-slate-200" role="tablist" aria-label="Authentication mode">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "login"}
              className={`auth-tab relative min-h-11 text-sm font-extrabold transition ${
                mode === "login"
                  ? "text-teal-800 after:absolute after:inset-x-0 after:bottom-[-1px] after:h-0.5 after:rounded-full after:bg-teal-700"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              onClick={() => setMode("login")}
            >
              Log in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "signup"}
              className={`auth-tab relative min-h-11 text-sm font-extrabold transition ${
                mode === "signup"
                  ? "text-teal-800 after:absolute after:inset-x-0 after:bottom-[-1px] after:h-0.5 after:rounded-full after:bg-teal-700"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              onClick={() => setMode("signup")}
            >
              Sign up
            </button>
          </div>

          <div className="auth-form grid gap-4">
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Email
              <input
                className="auth-input h-12 rounded-lg border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Password
              <input
                className="auth-input h-12 rounded-lg border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
                placeholder="Enter your password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <LoadingButton
              type="button"
              className="auth-submit mt-2 h-12 rounded-lg bg-teal-700 text-sm font-black text-white shadow-lg shadow-teal-700/20 transition hover:bg-teal-800 disabled:opacity-60"
              onClick={submit}
              loading={loading}
            >
              {mode === "login" ? "Log in" : "Create account"}
            </LoadingButton>
          </div>
        </section>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card rounded-xl border border-white/70 bg-white/70 p-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <strong className="mt-2 block text-xl font-black text-slate-950">{value}</strong>
    </div>
  );
}
