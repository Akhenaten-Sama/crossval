import { calculateDocumentTotals } from "./calculations";
import type { DocumentRecord } from "./types";

export type SummaryTotals = {
  documentCount: number;
  grandTotalCents: number;
  taxCents: number;
  discountCents: number;
};

export function buildSummaryReport(documents: DocumentRecord[], userId: string, from: string, to: string): SummaryTotals {
  return documents
    .filter((document) => document.userId === userId && document.issueDate >= from && document.issueDate <= to)
    .reduce<SummaryTotals>(
      (acc, document) => {
        const totals = calculateDocumentTotals(document);
        return {
          documentCount: acc.documentCount + 1,
          grandTotalCents: acc.grandTotalCents + totals.grandTotalCents,
          taxCents: acc.taxCents + totals.taxCents,
          discountCents: acc.discountCents + totals.discountCents
        };
      },
      {
        documentCount: 0,
        grandTotalCents: 0,
        taxCents: 0,
        discountCents: 0
      }
    );
}
