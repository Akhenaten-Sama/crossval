import { describe, expect, it } from "vitest";
import { ensureDraft } from "@/lib/api";
import { buildSummaryReport } from "@/lib/reports";
import type { DocumentRecord } from "@/lib/types";

describe("document lifecycle", () => {
  it("allows draft edits and rejects finalized edits", () => {
    expect(() => ensureDraft(makeDocument("draft"))).not.toThrow();
    expect(() => ensureDraft(makeDocument("finalized"))).toThrow("Finalized documents are read-only");
  });
});

describe("summary reports", () => {
  it("filters by owner and inclusive issue date range", () => {
    const documents = [
      makeDocument("finalized", "user_1", "2026-08-01", 10000, 1000, 500),
      makeDocument("finalized", "user_1", "2026-08-08", 20000, 0, 1000),
      makeDocument("finalized", "user_1", "2026-08-09", 99900, 0, 0),
      makeDocument("finalized", "user_2", "2026-08-08", 99900, 0, 0)
    ];

    expect(buildSummaryReport(documents, "user_1", "2026-08-01", "2026-08-08")).toEqual({
      documentCount: 2,
      grandTotalCents: 30500,
      taxCents: 1500,
      discountCents: 1000
    });
  });
});

function makeDocument(status: "draft" | "finalized", userId = "user_1", issueDate = "2026-08-08", subtotalCents = 10000, discountCents = 0, taxCents = 0): DocumentRecord {
  return {
    id: crypto.randomUUID(),
    userId,
    title: "Document",
    description: "",
    customer: "Customer",
    issueDate,
    status,
    createdAt: "2026-08-08T00:00:00.000Z",
    updatedAt: "2026-08-08T00:00:00.000Z",
    finalizedAt: status === "finalized" ? "2026-08-08T00:00:00.000Z" : null,
    lineItems: [
      {
        id: crypto.randomUUID(),
        documentId: "doc",
        description: "Line",
        details: "",
        quantity: 1,
        unitPriceCents: subtotalCents,
        discount: discountCents ? { type: "fixed", amountCents: discountCents } : null,
        taxPercent: taxCents ? (taxCents / (subtotalCents - discountCents)) * 100 : null
      }
    ]
  };
}
