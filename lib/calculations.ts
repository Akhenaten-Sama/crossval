import type { DocumentRecord, DocumentTotals, LineItem, LineItemInput, LineTotals } from "./types";

export function calculateLineTotals(line: LineItemInput): LineTotals {
  const subtotalCents = line.quantity * line.unitPriceCents;
  const discountCents = calculateDiscountCents(line, subtotalCents);
  const afterDiscountCents = subtotalCents - discountCents;
  const taxCents = Math.round(afterDiscountCents * ((line.taxPercent ?? 0) / 100));
  const totalCents = afterDiscountCents + taxCents;

  return {
    subtotalCents,
    discountCents,
    afterDiscountCents,
    taxCents,
    totalCents
  };
}

export function calculateDocumentTotals(document: Pick<DocumentRecord, "lineItems">): DocumentTotals {
  const lines = document.lineItems.map((line) => ({
    ...line,
    details: line.details ?? "",
    totals: calculateLineTotals(line)
  }));

  return lines.reduce<DocumentTotals>(
    (acc, line) => ({
      subtotalCents: acc.subtotalCents + line.totals.subtotalCents,
      discountCents: acc.discountCents + line.totals.discountCents,
      taxCents: acc.taxCents + line.totals.taxCents,
      grandTotalCents: acc.grandTotalCents + line.totals.totalCents,
      lines: [...acc.lines, line]
    }),
    {
      subtotalCents: 0,
      discountCents: 0,
      taxCents: 0,
      grandTotalCents: 0,
      lines: [] as Array<LineItem & { totals: LineTotals }>
    }
  );
}

function calculateDiscountCents(line: LineItemInput, subtotalCents: number): number {
  if (!line.discount) {
    return 0;
  }

  if (line.discount.type === "fixed") {
    return line.discount.amountCents;
  }

  return Math.round(subtotalCents * (line.discount.value / 100));
}
