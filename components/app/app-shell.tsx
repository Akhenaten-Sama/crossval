"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { callApi } from "./api-client";
import LoadingButton from "./loading-button";

export default function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function logout() {
    setIsLoggingOut(true);
    try {
      await callApi("/api/auth/logout", { method: "POST" });
      router.push("/auth");
      router.refresh();
    } catch {
      setIsLoggingOut(false);
    }
  }

  if (pathname === "/auth") {
    return <>{children}</>;
  }

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <Link className="brand" href="/">
          <span>MR</span>
          <strong>Multi-Rate</strong>
        </Link>
        <Link className="sidebar-action" href="/documents/new">
          New Document
        </Link>
        <nav className="nav-list" aria-label="Primary navigation">
          <Link href="/documents">Documents</Link>
          <Link href="/reports">Reports</Link>
          <Link href="/account">Account</Link>
        </nav>
        <LoadingButton type="button" className="sidebar-logout" onClick={logout} loading={isLoggingOut}>
          Log out
        </LoadingButton>
      </aside>
      <div className="main-frame">{children}</div>
    </div>
  );
}
