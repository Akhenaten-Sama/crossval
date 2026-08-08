import { NextResponse } from "next/server";
import { calculateDocumentTotals } from "./calculations";
import { formatMoney } from "./money";
import type { DocumentRecord } from "./types";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status = 400
  ) {
    super(message);
  }
}

export function jsonError(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function serializeDocument(document: DocumentRecord) {
  const totals = calculateDocumentTotals(document);
  const lineItems = document.lineItems.map((line) => ({ ...line, details: line.details ?? "" }));

  return {
    ...document,
    description: document.description ?? "",
    lineItems,
    totals,
    displayTotals: {
      subtotal: formatMoney(totals.subtotalCents),
      discount: formatMoney(totals.discountCents),
      tax: formatMoney(totals.taxCents),
      grandTotal: formatMoney(totals.grandTotalCents)
    }
  };
}

export function ensureDraft(document: DocumentRecord): void {
  if (document.status === "finalized") {
    throw new ApiError("Finalized documents are read-only", 409);
  }
}
