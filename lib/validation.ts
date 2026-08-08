import { z } from "zod";
import { dollarsToCents } from "./money";
import type { Discount, LineItemInput } from "./types";

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly status = 400
  ) {
    super(message);
  }
}

export const documentPayloadSchema = z.object({
  title: z.string().trim().min(1, "title is required"),
  description: z.string().trim().max(500, "description must be 500 characters or fewer").optional().default(""),
  customer: z.string().trim().min(1, "customer is required"),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "issueDate must be YYYY-MM-DD")
});

const rawLineItemSchema = z
  .object({
    description: z.string().trim().min(1, "description is required"),
    quantity: z.number({ invalid_type_error: "quantity must be a number" }),
    unitPrice: z.number({ invalid_type_error: "unitPrice must be a number" }),
    discountType: z.enum(["none", "percent", "fixed"]).default("none"),
    discountPercent: z.number().optional().nullable(),
    discountAmount: z.number().optional().nullable(),
    taxPercent: z.number().optional().nullable()
  })
  .superRefine((value, ctx) => {
    if (!Number.isInteger(value.quantity) || value.quantity < 1) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "quantity must be an integer greater than or equal to 1", path: ["quantity"] });
    }
    if (value.unitPrice < 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "unitPrice must be greater than or equal to 0", path: ["unitPrice"] });
    }
    if (value.discountType === "percent") {
      if (value.discountPercent === null || value.discountPercent === undefined) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "discountPercent is required for percent discounts", path: ["discountPercent"] });
      } else if (value.discountPercent < 0 || value.discountPercent > 100) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "discountPercent must be between 0 and 100", path: ["discountPercent"] });
      }
      if (value.discountAmount) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "a line may have percent discount or fixed discount, not both", path: ["discountAmount"] });
      }
    }
    if (value.discountType === "fixed") {
      if (value.discountAmount === null || value.discountAmount === undefined) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "discountAmount is required for fixed discounts", path: ["discountAmount"] });
      } else if (value.discountAmount < 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "discountAmount must be greater than or equal to 0", path: ["discountAmount"] });
      }
      if (value.discountPercent) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "a line may have percent discount or fixed discount, not both", path: ["discountPercent"] });
      }
    }
    if (value.discountType === "none" && (value.discountAmount || value.discountPercent)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "discountType must be fixed or percent when a discount value is supplied", path: ["discountType"] });
    }
    if (value.taxPercent !== null && value.taxPercent !== undefined && (value.taxPercent < 0 || value.taxPercent > 100)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "taxPercent must be between 0 and 100", path: ["taxPercent"] });
    }
  });

export function parseLineItemPayload(payload: unknown): LineItemInput {
  const result = rawLineItemSchema.safeParse(payload);
  if (!result.success) {
    throw new ValidationError(result.error.issues[0]?.message ?? "invalid line item");
  }

  const value = result.data;
  const unitPriceCents = dollarsToCents(value.unitPrice);
  let discount: Discount = null;

  if (value.discountType === "percent") {
    discount = { type: "percent", value: value.discountPercent ?? 0 };
  }

  if (value.discountType === "fixed") {
    discount = { type: "fixed", amountCents: dollarsToCents(value.discountAmount ?? 0) };
  }

  const line: LineItemInput = {
    description: value.description,
    quantity: value.quantity,
    unitPriceCents,
    discount,
    taxPercent: value.taxPercent ?? null
  };

  const subtotalCents = line.quantity * line.unitPriceCents;
  if (line.discount?.type === "fixed" && line.discount.amountCents > subtotalCents) {
    throw new ValidationError("fixed discount must not exceed the line subtotal");
  }

  return line;
}

export function getZodMessage(error: unknown): string {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? "invalid request";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "invalid request";
}
