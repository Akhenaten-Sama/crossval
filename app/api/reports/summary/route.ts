import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { calculateDocumentTotals } from "@/lib/calculations";
import { formatMoney } from "@/lib/money";
import { readDb } from "@/lib/store";
import { jsonError } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const params = new URL(request.url).searchParams;
    const from = params.get("from");
    const to = params.get("to");

    if (!from || !to) {
      return jsonError("from and to query parameters are required");
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
      return jsonError("from and to must be YYYY-MM-DD dates");
    }
    if (from > to) {
      return jsonError("from must be before or equal to to");
    }

    const db = await readDb();
    const documents = db.documents.filter((document) => document.userId === user.id && document.issueDate >= from && document.issueDate <= to);
    const summary = documents.reduce(
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

    return NextResponse.json({
      summary: {
        ...summary,
        displayTotals: {
          grandTotal: formatMoney(summary.grandTotalCents),
          tax: formatMoney(summary.taxCents),
          discount: formatMoney(summary.discountCents)
        }
      }
    });
  } catch (error) {
    if (error instanceof Response) {
      return jsonError(error.status === 401 ? "Authentication required" : "request failed", error.status);
    }
    return jsonError("unable to build report", 500);
  }
}
