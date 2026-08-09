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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function closeMenu() {
    setIsMenuOpen(false);
  }

  async function logout() {
    setIsLoggingOut(true);
    try {
      closeMenu();
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
      <aside className={`sidebar ${isMenuOpen ? "menu-open" : ""}`}>
        <Link className="brand" href="/" onClick={closeMenu}>
          <span>MR</span>
          <strong>Multi-Rate</strong>
        </Link>
        <button type="button" className="menu-toggle" aria-controls="primary-navigation" aria-expanded={isMenuOpen} aria-label="Toggle navigation menu" onClick={() => setIsMenuOpen((open) => !open)}>
          <span />
          <span />
          <span />
        </button>
        <div className="sidebar-menu" id="primary-navigation">
          <Link className="sidebar-action" href="/documents/new" onClick={closeMenu}>
            New Document
          </Link>
          <nav className="nav-list" aria-label="Primary navigation">
            <Link href="/documents" onClick={closeMenu}>
              Documents
            </Link>
            <Link href="/reports" onClick={closeMenu}>
              Reports
            </Link>
            <Link href="/account" onClick={closeMenu}>
              Account
            </Link>
          </nav>
          <LoadingButton type="button" className="sidebar-logout" onClick={logout} loading={isLoggingOut}>
            Log out
          </LoadingButton>
        </div>
      </aside>
      <div className="main-frame">{children}</div>
    </div>
  );
}
