"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();

  if (pathname === "/auth") {
    return <main className="auth-frame">{children}</main>;
  }

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <Link className="brand" href="/">
          <span>MR</span>
          <strong>Multi-Rate</strong>
        </Link>
        <nav className="nav-list" aria-label="Primary navigation">
          <Link href="/documents">Documents</Link>
          <Link href="/documents/new">New Document</Link>
          <Link href="/reports">Reports</Link>
        </nav>
      </aside>
      <div className="main-frame">{children}</div>
    </div>
  );
}
