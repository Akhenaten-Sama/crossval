"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Breadcrumbs from "./breadcrumbs";
import { callApi } from "./api-client";

export default function AccountPage({ email }: { email: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const form = new FormData(event.currentTarget);
    try {
      await callApi("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: form.get("currentPassword"),
          newPassword: form.get("newPassword")
        })
      });
      event.currentTarget.reset();
      setMessage("Password updated.");
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Could not update password");
    }
  }

  async function logout() {
    await callApi("/api/auth/logout", { method: "POST" });
    router.push("/auth");
    router.refresh();
  }

  return (
    <>
      <Breadcrumbs items={[{ label: "Account" }]} />
      <header className="page-header">
        <div>
          <p className="eyebrow">Account</p>
          <h1>Workspace security</h1>
          <p>Manage your login credentials for this pricing workspace.</p>
        </div>
        <button type="button" className="secondary" onClick={logout}>
          Log out
        </button>
      </header>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <form className="panel form-grid content-panel" onSubmit={changePassword}>
          <h2>Change password</h2>
          {error ? <div className="message error">{error}</div> : null}
          {message ? <div className="message success">{message}</div> : null}
          <div className="field-row">
            <label>
              Current password
              <input name="currentPassword" type="password" required />
            </label>
            <label>
              New password
              <input name="newPassword" type="password" minLength={8} required />
            </label>
          </div>
          <button type="submit">Update password</button>
        </form>

        <aside className="panel">
          <p className="eyebrow">Signed in as</p>
          <h2 className="break-words">{email}</h2>
          <p className="muted">Documents and reports are scoped to your user account through `userId`.</p>
        </aside>
      </section>
    </>
  );
}
