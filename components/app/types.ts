export type ApiDocument = {
  id: string;
  title: string;
  description: string;
  customer: string;
  issueDate: string;
  status: "draft" | "finalized";
  lineItems: Array<{
    id: string;
    description: string;
    details: string;
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

export type Summary = {
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
