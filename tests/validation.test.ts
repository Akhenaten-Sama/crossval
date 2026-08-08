import { describe, expect, it } from "vitest";
import { parseLineItemPayload } from "@/lib/validation";

describe("line item validation", () => {
  it("normalizes a valid fixed discount line to cents", () => {
    expect(
      parseLineItemPayload({
        description: "Service",
        quantity: 2,
        unitPrice: 19.99,
        discountType: "fixed",
        discountAmount: 5,
        taxPercent: 7.5
      })
    ).toEqual({
      description: "Service",
      quantity: 2,
      unitPriceCents: 1999,
      discount: { type: "fixed", amountCents: 500 },
      taxPercent: 7.5
    });
  });

  it.each([
    [{ description: "Bad", quantity: 0, unitPrice: 10, discountType: "none" }, "quantity must be an integer greater than or equal to 1"],
    [{ description: "Bad", quantity: 1, unitPrice: -1, discountType: "none" }, "unitPrice must be greater than or equal to 0"],
    [{ description: "Bad", quantity: 1, unitPrice: 10, discountType: "percent", discountPercent: 101 }, "discountPercent must be between 0 and 100"],
    [{ description: "Bad", quantity: 1, unitPrice: 10, discountType: "fixed", discountAmount: 11 }, "fixed discount must not exceed the line subtotal"],
    [{ description: "Bad", quantity: 1, unitPrice: 10, discountType: "none", discountAmount: 1 }, "discountType must be fixed or percent when a discount value is supplied"],
    [{ description: "Bad", quantity: 1, unitPrice: 10, discountType: "none", taxPercent: -1 }, "taxPercent must be between 0 and 100"]
  ])("rejects invalid payloads with specific errors", (payload, message) => {
    expect(() => parseLineItemPayload(payload)).toThrow(message);
  });
});
