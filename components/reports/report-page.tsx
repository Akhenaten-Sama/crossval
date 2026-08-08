"use client";

import { FormEvent, useState } from "react";
import { callApi } from "@/components/app/api-client";
import { Total } from "@/components/app/totals";
import type { Summary } from "@/components/app/types";

const today = new Date().toISOString().slice(0, 10);

export default function ReportPage() {
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      const body = await callApi<{ summary: Summary }>(`/api/reports/summary?from=${from}&to=${to}`);
      setSummary(body.summary);
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Could not run report");
    }
  }

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Reports</p>
          <h1>Issue date summary</h1>
          <p>Review document count, grand total, tax, and discounts over an inclusive date range.</p>
        </div>
      </header>

      <section className="panel content-panel">
          <form className="report-form" onSubmit={runReport}>
            <label>
              From
              <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
            </label>
            <label>
              To
              <input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
            </label>
            <button type="submit">Run report</button>
          </form>
          {error ? <div className="message error">{error}</div> : null}
          {summary ? (
            <div className="totals report-totals">
              <Total label="Documents" value={String(summary.documentCount)} />
              <Total label="Grand total" value={summary.displayTotals.grandTotal} strong />
              <Total label="Tax" value={summary.displayTotals.tax} />
              <Total label="Discount" value={summary.displayTotals.discount} />
            </div>
          ) : (
            <div className="empty-state">
              <h3>No report yet</h3>
              <p>Choose a date range and run the report after creating documents.</p>
            </div>
          )}
      </section>
    </>
  );
}
