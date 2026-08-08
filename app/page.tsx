import Link from "next/link";

export default function Home() {
  return (
    <>
      <header className="page-header home-header">
        <div>
          <p className="eyebrow">Pricing operations</p>
          <h1>Multi-Rate Pricing Calculator</h1>
          <p>Create customer documents, apply line-level discounts and tax, finalize records, and report totals by issue date.</p>
        </div>
        <div className="header-actions">
          <Link className="button-link" href="/documents">
            View documents
          </Link>
          <Link className="button-link secondary-link" href="/reports">
            Run report
          </Link>
        </div>
      </header>

      <section className="home-grid">
        <Link className="module-card" href="/documents">
          <span>01</span>
          <h2>Documents</h2>
          <p>Review all drafts and finalized documents with server-computed totals.</p>
        </Link>
        <Link className="module-card" href="/documents/new">
          <span>02</span>
          <h2>New Draft</h2>
          <p>Create metadata first, then add line items on a focused document detail page.</p>
        </Link>
        <Link className="module-card" href="/reports">
          <span>03</span>
          <h2>Reports</h2>
          <p>Summarize count, grand total, tax, and discount across an issue-date range.</p>
        </Link>
      </section>
    </>
  );
}
