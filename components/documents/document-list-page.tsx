"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type KeyboardEvent, useEffect, useState } from "react";
import { callApi } from "@/components/app/api-client";
import Breadcrumbs from "@/components/app/breadcrumbs";
import LoadingButton from "@/components/app/loading-button";
import { DocumentListSkeleton } from "@/components/app/skeletons";
import { ToastViewport, useToasts } from "@/components/app/toasts";
import type { ApiDocument } from "@/components/app/types";

export default function DocumentListPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<ApiDocument[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { dismissToast, showToast, toasts } = useToasts();

  async function loadDocuments() {
    setIsRefreshing(true);
    setError(null);
    try {
      const body = await callApi<{ documents: ApiDocument[] }>("/api/documents");
      setDocuments(body.documents);
      showToast("Documents refreshed.");
    } catch (apiError) {
      showToast(apiError instanceof Error ? apiError.message : "Could not load documents", "error");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
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

  function openDocument(id: string) {
    router.push(`/documents/${id}`);
  }

  function handleDocumentRowKeyDown(event: KeyboardEvent<HTMLTableRowElement>, id: string) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openDocument(id);
    }
  }

  return (
    <>
      <ToastViewport dismissToast={dismissToast} toasts={toasts} />
      <Breadcrumbs items={[{ label: "Documents" }]} />
      <header className="page-header">
        <div>
          <p className="eyebrow">Documents</p>
          <h1>Customer documents</h1>
          <p>Draft, finalize, duplicate, and review server-calculated totals.</p>
        </div>
      </header>

      {loading ? (
        <DocumentListSkeleton />
      ) : (
        <section className="panel content-panel">
          <div className="section-heading">
            <h2>All documents</h2>
            <LoadingButton type="button" className="secondary" onClick={loadDocuments} loading={isRefreshing}>
              Refresh
            </LoadingButton>
          </div>
          {error ? <div className="message error">{error}</div> : null}
          {documents.length === 0 ? <EmptyState /> : null}
          {documents.length > 0 ? (
            <div className="table-wrap scroll-table-wrap frozen-table-wrap documents-table-wrap">
              <table className="data-table frozen-table documents-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Description</th>
                    <th>Customer</th>
                    <th>Issue date</th>
                    <th>Status</th>
                    <th className="total-column">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((document) => (
                    <tr
                      className="clickable-row"
                      key={document.id}
                      onClick={() => openDocument(document.id)}
                      onKeyDown={(event) => handleDocumentRowKeyDown(event, document.id)}
                      role="link"
                      tabIndex={0}
                    >
                      <td>
                        <span className="row-link-text">{document.title}</span>
                      </td>
                      <td>{document.description || "—"}</td>
                      <td>{document.customer}</td>
                      <td>{document.issueDate}</td>
                      <td>
                        <span className={`status ${document.status}`}>{document.status}</span>
                      </td>
                      <td className="amount total-column">{document.displayTotals.grandTotal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      )}
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
