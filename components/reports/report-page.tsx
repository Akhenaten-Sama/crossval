"use client";

import { FormEvent, useState } from "react";
import { callApi } from "@/components/app/api-client";
import Breadcrumbs from "@/components/app/breadcrumbs";
import LoadingButton from "@/components/app/loading-button";
import { ToastViewport, useToasts } from "@/components/app/toasts";
import type { Summary } from "@/components/app/types";

const today = new Date().toISOString().slice(0, 10);

export default function ReportPage() {
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const { dismissToast, showToast, toasts } = useToasts();

  async function runReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsRunning(true);
    try {
      const body = await callApi<{ summary: Summary }>(`/api/reports/summary?from=${from}&to=${to}`);
      setSummary(body.summary);
      showToast("Report refreshed.");
    } catch (apiError) {
      const message = apiError instanceof Error ? apiError.message : "Could not run report";
      setError(message);
      showToast(message, "error");
    } finally {
      setIsRunning(false);
    }
  }

  const averageDocumentCents = summary?.documentCount ? Math.round(summary.grandTotalCents / summary.documentCount) : 0;
  const effectiveDiscountRate = summary?.grandTotalCents ? Math.round((summary.discountCents / (summary.grandTotalCents + summary.discountCents)) * 1000) / 10 : 0;
  const taxShare = summary?.grandTotalCents ? Math.round((summary.taxCents / summary.grandTotalCents) * 1000) / 10 : 0;

  return (
    <>
      <ToastViewport dismissToast={dismissToast} toasts={toasts} />
      <Breadcrumbs items={[{ label: "Reports" }]} />
      <header className="page-header">
        <div>
          <p className="eyebrow">Reports</p>
          <h1>Issue date summary</h1>
          <p>Review document count, grand total, tax, and discounts over an inclusive date range.</p>
        </div>
      </header>

      <section className="panel content-panel report-panel">
        <div className="report-toolbar">
          <form className="report-form" onSubmit={runReport}>
            <label>
              From
              <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
            </label>
            <label>
              To
              <input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
            </label>
            <LoadingButton type="submit" loading={isRunning}>
              Run report
            </LoadingButton>
          </form>
        </div>
          {error ? <div className="message error">{error}</div> : null}
          {summary ? (
            <div className="report-results">
              <div className="report-kpis">
                <ReportMetric label="Documents" value={String(summary.documentCount)} />
                <ReportMetric label="Grand total" value={summary.displayTotals.grandTotal} emphasis />
                <ReportMetric label="Avg. document" value={formatMoney(averageDocumentCents)} />
                <ReportMetric label="Discount rate" value={`${effectiveDiscountRate}%`} />
              </div>

              <div className="report-insight-grid">
                <section className="report-card report-summary-card">
                  <p className="eyebrow">Snapshot</p>
                  <h2>{summary.documentCount === 1 ? "1 document in range" : `${summary.documentCount} documents in range`}</h2>
                  <p>
                    The selected period generated <strong>{summary.displayTotals.grandTotal}</strong> after <strong>{summary.displayTotals.discount}</strong> in discounts and <strong>{summary.displayTotals.tax}</strong> in tax.
                  </p>
                  <div className="report-ratios">
                    <span>Tax share: {taxShare}%</span>
                    <span>Discount rate: {effectiveDiscountRate}%</span>
                  </div>
                </section>

                <section className="report-card">
                  <div className="report-card-heading">
                    <div>
                      <p className="eyebrow">Breakdown</p>
                      <h2>Money movement</h2>
                    </div>
                  </div>
                  <div className="report-bars">
                    <ReportBar label="Grand total" value={summary.displayTotals.grandTotal} amount={summary.grandTotalCents} max={Math.max(summary.grandTotalCents, summary.taxCents, summary.discountCents, 1)} tone="total" />
                    <ReportBar label="Tax" value={summary.displayTotals.tax} amount={summary.taxCents} max={Math.max(summary.grandTotalCents, summary.taxCents, summary.discountCents, 1)} tone="tax" />
                    <ReportBar label="Discount" value={summary.displayTotals.discount} amount={summary.discountCents} max={Math.max(summary.grandTotalCents, summary.taxCents, summary.discountCents, 1)} tone="discount" />
                  </div>
                </section>
              </div>
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

function ReportMetric({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className={`report-metric ${emphasis ? "emphasis" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ReportBar({ label, value, amount, max, tone }: { label: string; value: string; amount: number; max: number; tone: "total" | "tax" | "discount" }) {
  const width = `${Math.max(4, Math.round((amount / max) * 100))}%`;

  return (
    <div className="report-bar-row">
      <div className="report-bar-label">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="report-bar-track" aria-hidden="true">
        <span className={`report-bar ${tone}`} style={{ width }} />
      </div>
    </div>
  );
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", { currency: "USD", style: "currency" }).format(cents / 100);
}
