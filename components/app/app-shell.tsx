import Link from "next/link";

export default function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
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
