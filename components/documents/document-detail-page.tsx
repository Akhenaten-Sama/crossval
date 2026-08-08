"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { callApi } from "@/components/app/api-client";
import { money } from "@/components/app/format";
import Totals from "@/components/app/totals";
import type { ApiDocument } from "@/components/app/types";

export default function DocumentDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const [document, setDocument] = useState<ApiDocument | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [discountBasis, setDiscountBasis] = useState<"percent" | "fixed">("percent");

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

  async function addLineItem(event: FormEvent<HTMLFormElement>) {
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
      const body = await callApi<{ document: ApiDocument }>(`/api/documents/${document.id}/line-items`, {
        method: "POST",
        body: JSON.stringify({
          description: form.get("description"),
          quantity: Number(form.get("quantity")),
          unitPrice: Number(form.get("unitPrice")),
          discountType,
          discountPercent: discountType === "percent" ? discountValue : null,
          discountAmount: discountType === "fixed" ? discountValue : null,
          taxPercent: form.get("taxPercent") ? Number(form.get("taxPercent")) : null
        })
      });
      setDocument(body.document);
      event.currentTarget.reset();
      setMessage("Line item added.");
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Could not add line item");
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

  return (
    <>
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
      {loading ? <div className="panel">Loading document...</div> : null}

      {document ? (
        <div className="detail-layout">
          <section className="panel">
            <div className="section-heading">
              <div>
                <h2>Overview</h2>
                <p className="muted">All totals are recalculated by the API after every mutation.</p>
              </div>
              <span className={`status ${document.status}`}>{document.status}</span>
            </div>
            <Totals totals={document.displayTotals} />
            <form className="form-grid" onSubmit={updateMetadata}>
              <h3>Metadata</h3>
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
              <button type="submit" disabled={document.status === "finalized"}>
                Save details
              </button>
            </form>
          </section>

          <section className="panel content-panel">
            <div className="section-heading">
              <h2>Line items</h2>
              <span className="muted">{document.lineItems.length} lines</span>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Qty</th>
                    <th>Unit</th>
                    <th>Discount</th>
                    <th>Tax</th>
                    <th>Total</th>
                    <th></th>
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
                          <button type="button" className="danger compact" disabled={document.status === "finalized"} onClick={() => removeLineItem(line.id)}>
                            Remove
                          </button>
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

            {document.status === "draft" ? (
              <form className="line-form" onSubmit={addLineItem}>
                <h3>Add line item</h3>
                <div className="field-row four">
                  <label>
                    Description
                    <input name="description" required placeholder="Widget A" />
                  </label>
                  <label>
                    Quantity
                    <input name="quantity" type="number" min="1" step="1" required defaultValue="1" />
                  </label>
                  <label>
                    Unit price
                    <input name="unitPrice" type="number" min="0" step="0.01" required placeholder="100.00" />
                  </label>
                  <label>
                    Tax %
                    <input name="taxPercent" type="number" min="0" max="100" step="0.01" placeholder="5" />
                  </label>
                </div>
                <div className="field-row four">
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
                      />
                      <div className="basis-toggle" aria-label="Discount basis">
                        <button
                          type="button"
                          className={discountBasis === "percent" ? "active" : undefined}
                          onClick={() => setDiscountBasis("percent")}
                          aria-pressed={discountBasis === "percent"}
                        >
                          %
                        </button>
                        <button
                          type="button"
                          className={discountBasis === "fixed" ? "active" : undefined}
                          onClick={() => setDiscountBasis("fixed")}
                          aria-pressed={discountBasis === "fixed"}
                        >
                          $
                        </button>
                      </div>
                    </div>
                  </div>
                  <button type="submit">Add line</button>
                </div>
              </form>
            ) : (
              <div className="read-only-note">Finalized documents are read-only. Duplicate this document to make a new draft.</div>
            )}
          </section>
        </div>
      ) : null}
    </>
  );
}
