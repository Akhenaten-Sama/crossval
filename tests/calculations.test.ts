import { describe, expect, it } from "vitest";
import { calculateDocumentTotals, calculateLineTotals } from "@/lib/calculations";
import type { DocumentRecord, LineItemInput } from "@/lib/types";

describe("pricing calculations", () => {
  it("matches the assignment sample with discount before tax", () => {
    const document = documentWithLines([
      line("Widget A", 2, 10000, { type: "percent", value: 10 }, 5),
      line("Widget B", 1, 5000, null, 5),
      line("Service fee", 1, 20000, { type: "fixed", amountCents: 2000 }, null)
    ]);

    const totals = calculateDocumentTotals(document);

    expect(totals.lines.map((item) => item.totals)).toEqual([
      {
        subtotalCents: 20000,
        discountCents: 2000,
        afterDiscountCents: 18000,
        taxCents: 900,
        totalCents: 18900
      },
      {
        subtotalCents: 5000,
        discountCents: 0,
        afterDiscountCents: 5000,
        taxCents: 250,
        totalCents: 5250
      },
      {
        subtotalCents: 20000,
        discountCents: 2000,
        afterDiscountCents: 18000,
        taxCents: 0,
        totalCents: 18000
      }
    ]);
    expect(totals.subtotalCents).toBe(45000);
    expect(totals.discountCents).toBe(4000);
    expect(totals.taxCents).toBe(1150);
    expect(totals.grandTotalCents).toBe(42150);
  });

  it("rounds percentage discounts and tax to cents per line", () => {
    const totals = calculateLineTotals(line("Rounding", 3, 3333, { type: "percent", value: 12.5 }, 8.875));

    expect(totals.subtotalCents).toBe(9999);
    expect(totals.discountCents).toBe(1250);
    expect(totals.afterDiscountCents).toBe(8749);
    expect(totals.taxCents).toBe(776);
    expect(totals.totalCents).toBe(9525);
  });

  it("supports zero-priced lines and 100 percent discounts", () => {
    expect(calculateLineTotals(line("Free", 1, 0, null, 10))).toMatchObject({
      subtotalCents: 0,
      discountCents: 0,
      taxCents: 0,
      totalCents: 0
    });
    expect(calculateLineTotals(line("Comped", 2, 2500, { type: "percent", value: 100 }, 10))).toMatchObject({
      subtotalCents: 5000,
      discountCents: 5000,
      taxCents: 0,
      totalCents: 0
    });
  });
});

function line(description: string, quantity: number, unitPriceCents: number, discount: LineItemInput["discount"], taxPercent: number | null): LineItemInput {
  return { description, details: "", quantity, unitPriceCents, discount, taxPercent };
}

function documentWithLines(lines: LineItemInput[]): DocumentRecord {
  return {
    id: "doc_1",
    userId: "user_1",
    title: "Sample",
    description: "",
    customer: "Acme",
    issueDate: "2026-08-08",
    status: "draft",
    createdAt: "2026-08-08T00:00:00.000Z",
    updatedAt: "2026-08-08T00:00:00.000Z",
    finalizedAt: null,
    lineItems: lines.map((item, index) => ({ ...item, id: `line_${index}`, documentId: "doc_1" }))
  };
}
