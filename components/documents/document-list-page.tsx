"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AuthPanel from "@/components/app/auth-panel";
import { callApi } from "@/components/app/api-client";
import type { ApiDocument } from "@/components/app/types";

export default function DocumentListPage() {
  const [documents, setDocuments] = useState<ApiDocument[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadDocuments() {
    setLoading(true);
    setError(null);
    try {
      const body = await callApi<{ documents: ApiDocument[] }>("/api/documents");
      setDocuments(body.documents);
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Could not load documents");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    callApi<{ documents: ApiDocument[] }>("/api/documents")
      .then((body) => {
        if (active) {
          setDocuments(body.documents);
        }
      })
      .catch((apiError) => {
        if (active) {
          setError(apiError instanceof Error ? apiError.message : "Could not load documents");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Documents</p>
          <h1>Customer documents</h1>
          <p>Draft, finalize, duplicate, and review server-calculated totals.</p>
        </div>
        <Link className="button-link" href="/documents/new">
          New document
        </Link>
      </header>

      <div className="content-grid">
        <AuthPanel onAuthenticated={loadDocuments} />
        <section className="panel content-panel">
          <div className="section-heading">
            <h2>All documents</h2>
            <button type="button" className="secondary" onClick={loadDocuments}>
              Refresh
            </button>
          </div>
          {error ? <div className="message error">{error}</div> : null}
          {loading ? <p className="muted">Loading documents...</p> : null}
          {!loading && documents.length === 0 ? <EmptyState /> : null}
          {documents.length > 0 ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Customer</th>
                    <th>Issue date</th>
                    <th>Status</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((document) => (
                    <tr key={document.id}>
                      <td>
                        <Link href={`/documents/${document.id}`}>{document.title}</Link>
                      </td>
                      <td>{document.customer}</td>
                      <td>{document.issueDate}</td>
                      <td>
                        <span className={`status ${document.status}`}>{document.status}</span>
                      </td>
                      <td className="amount">{document.displayTotals.grandTotal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </div>
    </>
  );
}

function EmptyState() {
  return (
    <div className="empty-state">
      <h3>No documents yet</h3>
      <p>Create a draft document, add lines, then finalize it when the pricing is ready.</p>
      <Link className="button-link" href="/documents/new">
        Create first document
      </Link>
    </div>
  );
}
