"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Breadcrumbs from "./breadcrumbs";
import { callApi } from "./api-client";
import LoadingButton from "./loading-button";
import { ToastViewport, useToasts } from "./toasts";

export default function AccountPage({ email }: { email: string }) {
  const router = useRouter();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { dismissToast, showToast, toasts } = useToasts();

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsChangingPassword(true);

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await callApi("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: form.get("currentPassword"),
          newPassword: form.get("newPassword")
        })
      });
      formElement.reset();
      showToast("Password updated.");
    } catch (apiError) {
      showToast(apiError instanceof Error ? apiError.message : "Could not update password", "error");
    } finally {
      setIsChangingPassword(false);
    }
  }

  async function logout() {
    setIsLoggingOut(true);
    try {
      await callApi("/api/auth/logout", { method: "POST" });
      router.push("/auth");
      router.refresh();
    } catch (apiError) {
      showToast(apiError instanceof Error ? apiError.message : "Could not log out", "error");
      setIsLoggingOut(false);
    }
  }

  return (
    <>
      <ToastViewport dismissToast={dismissToast} toasts={toasts} />
      <Breadcrumbs items={[{ label: "Account" }]} />
      <header className="page-header">
        <div>
          <p className="eyebrow">Account</p>
          <h1>Workspace security</h1>
          <p>Manage your login credentials for this pricing workspace.</p>
        </div>
        <LoadingButton type="button" className="secondary" onClick={logout} loading={isLoggingOut}>
          Log out
        </LoadingButton>
      </header>

      <section className="account-layout grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <form className="panel form-grid content-panel" onSubmit={changePassword}>
          <h2>Change password</h2>
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
          <LoadingButton type="submit" loading={isChangingPassword}>
            Update password
          </LoadingButton>
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
