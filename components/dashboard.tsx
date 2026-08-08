"use client";

import { FormEvent, useMemo, useState } from "react";

type ApiDocument = {
  id: string;
  title: string;
  customer: string;
  issueDate: string;
  status: "draft" | "finalized";
  lineItems: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPriceCents: number;
    discount: { type: "percent"; value: number } | { type: "fixed"; amountCents: number } | null;
    taxPercent: number | null;
  }>;
  totals: {
    subtotalCents: number;
    discountCents: number;
    taxCents: number;
    grandTotalCents: number;
    lines: Array<{
      id: string;
      totals: {
        subtotalCents: number;
        discountCents: number;
        afterDiscountCents: number;
        taxCents: number;
        totalCents: number;
      };
    }>;
  };
  displayTotals: {
    subtotal: string;
    discount: string;
    tax: string;
    grandTotal: string;
  };
};

type Summary = {
  documentCount: number;
  grandTotalCents: number;
  taxCents: number;
  discountCents: number;
  displayTotals: {
    grandTotal: string;
    tax: string;
    discount: string;
  };
};

const today = new Date().toISOString().slice(0, 10);

export default function Dashboard() {
  const [email, setEmail] = useState("demo@example.com");
  const [password, setPassword] = useState("password123");
  const [documents, setDocuments] = useState<ApiDocument[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [reportFrom, setReportFrom] = useState(today);
  const [reportTo, setReportTo] = useState(today);

  const selectedDocument = useMemo(() => documents.find((document) => document.id === selectedId) ?? documents[0] ?? null, [documents, selectedId]);

  async function callApi<T>(path: string, options?: RequestInit): Promise<T> {
    setError(null);
    setMessage(null);
    const response = await fetch(path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers
      }
    });
    const body = await response.json();
    if (!response.ok) {
      throw new Error(body.error ?? "Request failed");
    }
    return body as T;
  }

  async function refreshDocuments() {
    const body = await callApi<{ documents: ApiDocument[] }>("/api/documents");
    setDocuments(body.documents);
    setSelectedId((current) => current ?? body.documents[0]?.id ?? null);
  }

  async function authenticate(mode: "signup" | "login") {
    try {
      await callApi(`/api/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      setMessage(mode === "signup" ? "Account created." : "Logged in.");
      await refreshDocuments();
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Authentication failed");
    }
  }

  async function createDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const body = await callApi<{ document: ApiDocument }>("/api/documents", {
        method: "POST",
        body: JSON.stringify({
          title: form.get("title"),
          customer: form.get("customer"),
          issueDate: form.get("issueDate")
        })
      });
      setDocuments((current) => [body.document, ...current]);
      setSelectedId(body.document.id);
      event.currentTarget.reset();
      setMessage("Draft document created.");
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Could not create document");
    }
  }

  async function addLineItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedDocument) {
      return;
    }
    const form = new FormData(event.currentTarget);
    try {
      const body = await callApi<{ document: ApiDocument }>(`/api/documents/${selectedDocument.id}/line-items`, {
        method: "POST",
        body: JSON.stringify({
          description: form.get("description"),
          quantity: Number(form.get("quantity")),
          unitPrice: Number(form.get("unitPrice")),
          discountType: form.get("discountType"),
          discountPercent: form.get("discountPercent") ? Number(form.get("discountPercent")) : null,
          discountAmount: form.get("discountAmount") ? Number(form.get("discountAmount")) : null,
          taxPercent: form.get("taxPercent") ? Number(form.get("taxPercent")) : null
        })
      });
      upsertDocument(body.document);
      event.currentTarget.reset();
      setMessage("Line item added.");
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Could not add line item");
    }
  }

  async function removeLineItem(lineItemId: string) {
    if (!selectedDocument) {
      return;
    }
    try {
      const body = await callApi<{ document: ApiDocument }>(`/api/documents/${selectedDocument.id}/line-items?lineItemId=${lineItemId}`, {
        method: "DELETE"
      });
      upsertDocument(body.document);
      setMessage("Line item removed.");
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Could not remove line item");
    }
  }

  async function finalizeDocument() {
    if (!selectedDocument) {
      return;
    }
    try {
      const body = await callApi<{ document: ApiDocument }>(`/api/documents/${selectedDocument.id}/finalize`, { method: "POST" });
      upsertDocument(body.document);
      setMessage("Document finalized.");
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Could not finalize document");
    }
  }

  async function duplicateDocument() {
    if (!selectedDocument) {
      return;
    }
    try {
      const body = await callApi<{ document: ApiDocument }>(`/api/documents/${selectedDocument.id}/duplicate`, { method: "POST" });
      setDocuments((current) => [body.document, ...current]);
      setSelectedId(body.document.id);
      setMessage("Document duplicated into a new draft.");
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Could not duplicate document");
    }
  }

  async function runReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const body = await callApi<{ summary: Summary }>(`/api/reports/summary?from=${reportFrom}&to=${reportTo}`);
      setSummary(body.summary);
      setMessage("Report refreshed.");
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Could not run report");
    }
  }

  function upsertDocument(document: ApiDocument) {
    setDocuments((current) => current.map((candidate) => (candidate.id === document.id ? document : candidate)));
    setSelectedId(document.id);
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <h1>Multi-Rate Pricing Calculator</h1>
          <p>Server-calculated documents with discounts, tax, finalization, and date-range reporting.</p>
        </div>
      </header>

      {error ? <div className="message error">{error}</div> : null}
      {message ? <div className="message success">{message}</div> : null}

      <section className="grid two-column">
        <div className="grid">
          <div className="panel">
            <h2>Account</h2>
            <div className="form-grid">
              <label>
                Email
                <input value={email} onChange={(event) => setEmail(event.target.value)} />
              </label>
              <label>
                Password
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
              </label>
              <div className="actions">
                <button type="button" onClick={() => authenticate("signup")}>
                  Sign up
                </button>
                <button type="button" className="secondary" onClick={() => authenticate("login")}>
                  Log in
                </button>
                <button type="button" className="secondary" onClick={refreshDocuments}>
                  Refresh
                </button>
              </div>
            </div>
          </div>

          <form className="panel form-grid" onSubmit={createDocument}>
            <h2>New Document</h2>
            <label>
              Title
              <input name="title" required placeholder="August services" />
            </label>
            <label>
              Customer
              <input name="customer" required placeholder="Acme Co." />
            </label>
            <label>
              Issue date
              <input name="issueDate" required type="date" defaultValue={today} />
            </label>
            <button type="submit">Create draft</button>
          </form>

          <form className="panel form-grid" onSubmit={runReport}>
            <h2>Summary Report</h2>
            <div className="report">
              <label>
                From
                <input type="date" value={reportFrom} onChange={(event) => setReportFrom(event.target.value)} />
              </label>
              <label>
                To
                <input type="date" value={reportTo} onChange={(event) => setReportTo(event.target.value)} />
              </label>
              <button type="submit">Run</button>
            </div>
            {summary ? (
              <div className="totals">
                <Total label="Documents" value={String(summary.documentCount)} />
                <Total label="Grand total" value={summary.displayTotals.grandTotal} />
                <Total label="Tax" value={summary.displayTotals.tax} />
                <Total label="Discount" value={summary.displayTotals.discount} />
              </div>
            ) : null}
          </form>
        </div>

        <div className="grid">
          <div className="panel">
            <h2>Documents</h2>
            <div className="document-list">
              {documents.map((document) => (
                <button key={document.id} type="button" className="secondary" onClick={() => setSelectedId(document.id)}>
                  {document.title} - {document.displayTotals.grandTotal}
                </button>
              ))}
              {documents.length === 0 ? <p>No documents loaded.</p> : null}
            </div>
          </div>

          {selectedDocument ? (
            <article className="card">
              <div className="card-header">
                <div>
                  <h3>{selectedDocument.title}</h3>
                  <p>
                    {selectedDocument.customer} - {selectedDocument.issueDate}
                  </p>
                </div>
                <span className={`status ${selectedDocument.status}`}>{selectedDocument.status}</span>
              </div>

              <div className="totals">
                <Total label="Subtotal" value={selectedDocument.displayTotals.subtotal} />
                <Total label="Discount" value={selectedDocument.displayTotals.discount} />
                <Total label="Tax" value={selectedDocument.displayTotals.tax} />
                <Total label="Grand total" value={selectedDocument.displayTotals.grandTotal} />
              </div>

              <LineTable document={selectedDocument} onRemove={removeLineItem} />

              <div className="actions">
                <button type="button" onClick={finalizeDocument} disabled={selectedDocument.status === "finalized"}>
                  Finalize
                </button>
                <button type="button" className="secondary" onClick={duplicateDocument}>
                  Duplicate
                </button>
              </div>

              {selectedDocument.status === "draft" ? (
                <form className="form-grid" onSubmit={addLineItem}>
                  <h3>Add Line</h3>
                  <div className="row">
                    <label>
                      Description
                      <input name="description" required placeholder="Widget A" />
                    </label>
                    <label>
                      Qty
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
                  <div className="row">
                    <label>
                      Discount
                      <select name="discountType" defaultValue="none">
                        <option value="none">None</option>
                        <option value="percent">Percent</option>
                        <option value="fixed">Fixed</option>
                      </select>
                    </label>
                    <label>
                      Discount %
                      <input name="discountPercent" type="number" min="0" max="100" step="0.01" />
                    </label>
                    <label>
                      Discount $
                      <input name="discountAmount" type="number" min="0" step="0.01" />
                    </label>
                    <button type="submit">Add line</button>
                  </div>
                </form>
              ) : null}
            </article>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function Total({ label, value }: { label: string; value: string }) {
  return (
    <div className="total-box">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function LineTable({ document, onRemove }: { document: ApiDocument; onRemove: (lineItemId: string) => void }) {
  const totalsByLineId = new Map(document.totals.lines.map((line) => [line.id, line.totals]));

  return (
    <table className="line-table">
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
              <td>{totals ? money(totals.totalCents) : "$0.00"}</td>
              <td>
                <button type="button" className="danger" disabled={document.status === "finalized"} onClick={() => onRemove(line.id)}>
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
  );
}

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}
