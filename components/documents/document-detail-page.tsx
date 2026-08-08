"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { callApi } from "@/components/app/api-client";
import Breadcrumbs from "@/components/app/breadcrumbs";
import { money } from "@/components/app/format";
import { DocumentDetailSkeleton } from "@/components/app/skeletons";
import Totals from "@/components/app/totals";
import type { ApiDocument } from "@/components/app/types";

type LineItem = ApiDocument["lineItems"][number];

export default function DocumentDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const [document, setDocument] = useState<ApiDocument | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [discountBasis, setDiscountBasis] = useState<"percent" | "fixed">("percent");
  const [editingLine, setEditingLine] = useState<LineItem | null>(null);
  const [isLineModalOpen, setIsLineModalOpen] = useState(false);

  const totalsByLineId = useMemo(() => new Map(document?.totals.lines.map((line) => [line.id, line.totals]) ?? []), [document]);

  useEffect(() => {
    let active = true;

    callApi<{ document: ApiDocument }>(`/api/documents/${id}`)
      .then((body) => {
        if (active) {
          setDocument(body.document);
        }
      })
      .catch((apiError) => {
        if (active) {
          setError(apiError instanceof Error ? apiError.message : "Could not load document");
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
  }, [id]);

  async function updateMetadata(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!document) {
      return;
    }
    setError(null);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    try {
      const body = await callApi<{ document: ApiDocument }>(`/api/documents/${document.id}`, {
        method: "PUT",
        body: JSON.stringify({
          title: form.get("title"),
          customer: form.get("customer"),
          issueDate: form.get("issueDate")
        })
      });
      setDocument(body.document);
      setMessage("Document details saved.");
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Could not update document");
    }
  }

  function openLineModal(line?: LineItem) {
    setEditingLine(line ?? null);
    setDiscountBasis(line?.discount?.type === "fixed" ? "fixed" : "percent");
    setIsLineModalOpen(true);
    setError(null);
    setMessage(null);
  }

  function closeLineModal() {
    setIsLineModalOpen(false);
    setEditingLine(null);
  }

  async function submitLineItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!document) {
      return;
    }
    setError(null);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const discountValue = form.get("discountValue") ? Number(form.get("discountValue")) : null;
    const discountType = discountValue === null ? "none" : discountBasis;
    try {
      const payload = {
        lineItemId: editingLine?.id,
        description: form.get("description"),
        quantity: Number(form.get("quantity")),
        unitPrice: Number(form.get("unitPrice")),
        discountType,
        discountPercent: discountType === "percent" ? discountValue : null,
        discountAmount: discountType === "fixed" ? discountValue : null,
        taxPercent: form.get("taxPercent") ? Number(form.get("taxPercent")) : null
      };
      const body = await callApi<{ document: ApiDocument }>(`/api/documents/${document.id}/line-items`, {
        method: editingLine ? "PUT" : "POST",
        body: JSON.stringify(payload)
      });
      setDocument(body.document);
      event.currentTarget.reset();
      closeLineModal();
      setMessage(editingLine ? "Line item updated." : "Line item added.");
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Could not save line item");
    }
  }

  async function removeLineItem(lineItemId: string) {
    if (!document) {
      return;
    }
    setError(null);
    setMessage(null);
    try {
      const body = await callApi<{ document: ApiDocument }>(`/api/documents/${document.id}/line-items?lineItemId=${lineItemId}`, {
        method: "DELETE"
      });
      setDocument(body.document);
      setMessage("Line item removed.");
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Could not remove line item");
    }
  }

  async function finalizeDocument() {
    if (!document) {
      return;
    }
    setError(null);
    setMessage(null);
    try {
      const body = await callApi<{ document: ApiDocument }>(`/api/documents/${document.id}/finalize`, { method: "POST" });
      setDocument(body.document);
      setMessage("Document finalized.");
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Could not finalize document");
    }
  }

  async function duplicateDocument() {
    if (!document) {
      return;
    }
    setError(null);
    setMessage(null);
    try {
      const body = await callApi<{ document: ApiDocument }>(`/api/documents/${document.id}/duplicate`, { method: "POST" });
      router.push(`/documents/${body.document.id}`);
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Could not duplicate document");
    }
  }

  if (loading) {
    return <DocumentDetailSkeleton />;
  }

  return (
    <>
      <Breadcrumbs items={[{ label: "Documents", href: "/documents" }, { label: document?.title ?? "Document" }]} />
      <header className="page-header">
        <div>
          <p className="eyebrow">Document</p>
          <h1>{document?.title ?? "Document detail"}</h1>
          <p>{document ? `${document.customer} - issued ${document.issueDate}` : "Loading document..."}</p>
        </div>
        <div className="header-actions">
          <Link className="button-link secondary-link" href="/documents">
            Back to documents
          </Link>
          <button type="button" onClick={duplicateDocument} disabled={!document}>
            Duplicate
          </button>
          <button type="button" onClick={finalizeDocument} disabled={!document || document.status === "finalized"}>
            Finalize
          </button>
        </div>
      </header>

      {error ? <div className="message error">{error}</div> : null}
      {message ? <div className="message success">{message}</div> : null}
      {document ? (
        <div className="document-workspace">
          <section className="panel document-overview-panel">
            <div className="overview-header">
              <div>
                <h2>Overview</h2>
                <p className="muted">Server-calculated totals update after every document change.</p>
              </div>
              <span className={`status ${document.status}`}>{document.status}</span>
            </div>
            <Totals totals={document.displayTotals} />
            <div className="document-facts">
              <div>
                <span>Customer</span>
                <strong>{document.customer}</strong>
              </div>
              <div>
                <span>Issue date</span>
                <strong>{document.issueDate}</strong>
              </div>
              <div>
                <span>Line items</span>
                <strong>{document.lineItems.length}</strong>
              </div>
            </div>
          </section>

          <section className="panel metadata-panel">
            <form className="form-grid" onSubmit={updateMetadata}>
              <div className="section-heading">
                <div>
                  <h2>Document details</h2>
                  <p className="muted">Draft metadata remains editable until the document is finalized.</p>
                </div>
                <button type="submit" disabled={document.status === "finalized"}>
                  Save details
                </button>
              </div>
              <div className="field-row">
                <label>
                  Title
                  <input name="title" required defaultValue={document.title} disabled={document.status === "finalized"} />
                </label>
                <label>
                  Customer
                  <input name="customer" required defaultValue={document.customer} disabled={document.status === "finalized"} />
                </label>
                <label>
                  Issue date
                  <input name="issueDate" type="date" required defaultValue={document.issueDate} disabled={document.status === "finalized"} />
                </label>
              </div>
            </form>
          </section>

          <section className="panel content-panel line-items-panel">
            <div className="section-heading">
              <div>
                <h2>Line items</h2>
                <p className="muted">Add, edit, and remove billable rows while this document is in draft.</p>
              </div>
              <button type="button" onClick={() => openLineModal()} disabled={document.status === "finalized"}>
                Add line
              </button>
            </div>
            <div className="table-wrap scroll-table-wrap frozen-table-wrap">
              <table className="data-table frozen-table line-items-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Qty</th>
                    <th>Unit</th>
                    <th>Discount</th>
                    <th>Tax</th>
                    <th>Total</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {document.lineItems.map((line) => {
                    const totals = totalsByLineId.get(line.id);
                    return (
                      <tr key={line.id}>
                        <td>{line.description}</td>
                        <td>{line.quantity}</td>
                        <td>{money(line.unitPriceCents)}</td>
                        <td>{totals ? money(totals.discountCents) : "$0.00"}</td>
                        <td>{totals ? money(totals.taxCents) : "$0.00"}</td>
                        <td className="amount">{totals ? money(totals.totalCents) : "$0.00"}</td>
                        <td>
                          <div className="table-actions">
                            <button type="button" className="secondary compact" disabled={document.status === "finalized"} onClick={() => openLineModal(line)}>
                              Edit
                            </button>
                            <button type="button" className="danger compact" disabled={document.status === "finalized"} onClick={() => removeLineItem(line.id)}>
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {document.lineItems.length === 0 ? (
                    <tr>
                      <td colSpan={7}>No line items yet.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            {document.status === "finalized" ? (
              <div className="read-only-note">Finalized documents are read-only. Duplicate this document to make a new draft.</div>
            ) : null}
          </section>
        </div>
      ) : null}

      {document && isLineModalOpen ? (
        <LineItemModal
          key={editingLine?.id ?? "new-line"}
          discountBasis={discountBasis}
          line={editingLine}
          onBasisChange={setDiscountBasis}
          onClose={closeLineModal}
          onSubmit={submitLineItem}
        />
      ) : null}
    </>
  );
}

function LineItemModal({
  discountBasis,
  line,
  onBasisChange,
  onClose,
  onSubmit
}: {
  discountBasis: "percent" | "fixed";
  line: LineItem | null;
  onBasisChange: (basis: "percent" | "fixed") => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const discountValue = line?.discount?.type === "percent" ? line.discount.value : line?.discount?.type === "fixed" ? line.discount.amountCents / 100 : "";

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="line-item-modal-title">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Line item</p>
            <h2 id="line-item-modal-title">{line ? "Edit line item" : "Add line item"}</h2>
          </div>
          <button type="button" className="secondary compact" onClick={onClose}>
            Close
          </button>
        </div>

        <form className="modal-form" onSubmit={onSubmit}>
          <div className="field-row two">
            <label>
              Description
              <input name="description" required placeholder="Widget A" defaultValue={line?.description ?? ""} autoFocus />
            </label>
            <label>
              Quantity
              <input name="quantity" type="number" min="1" step="1" required defaultValue={line?.quantity ?? 1} />
            </label>
          </div>
          <div className="field-row two">
            <label>
              Unit price
              <input name="unitPrice" type="number" min="0" step="0.01" required placeholder="100.00" defaultValue={line ? line.unitPriceCents / 100 : ""} />
            </label>
            <label>
              Tax %
              <input name="taxPercent" type="number" min="0" max="100" step="0.01" placeholder="5" defaultValue={line?.taxPercent ?? ""} />
            </label>
          </div>
          <div className="discount-control">
            <label htmlFor="discountValue">Discount</label>
            <div className="discount-input-row">
              <input
                id="discountValue"
                name="discountValue"
                type="number"
                min="0"
                max={discountBasis === "percent" ? "100" : undefined}
                step="0.01"
                placeholder={discountBasis === "percent" ? "10" : "20.00"}
                defaultValue={discountValue}
              />
              <div className="basis-toggle" aria-label="Discount basis">
                <button type="button" className={discountBasis === "percent" ? "active" : undefined} onClick={() => onBasisChange("percent")} aria-pressed={discountBasis === "percent"}>
                  %
                </button>
                <button type="button" className={discountBasis === "fixed" ? "active" : undefined} onClick={() => onBasisChange("fixed")} aria-pressed={discountBasis === "fixed"}>
                  $
                </button>
              </div>
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit">{line ? "Save changes" : "Add line"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
