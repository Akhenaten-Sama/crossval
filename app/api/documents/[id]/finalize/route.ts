import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { ApiError, ensureDraft, jsonError, serializeDocument } from "@/lib/api";
import { updateDb } from "@/lib/store";
import { getZodMessage } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, context: Params) {
  try {
    const user = await requireUser();
    const { id } = await context.params;

    const document = await updateDb((db) => {
      const found = db.documents.find((candidate) => candidate.id === id && candidate.userId === user.id);
      if (!found) {
        throw new ApiError("document not found", 404);
      }
      ensureDraft(found);
      for (const line of found.lineItems) {
        if (line.quantity < 1) {
          throw new ApiError("cannot finalize: every line quantity must be greater than or equal to 1");
        }
        if (line.unitPriceCents < 0) {
          throw new ApiError("cannot finalize: line unit prices must be greater than or equal to 0");
        }
      }
      const now = new Date().toISOString();
      found.status = "finalized";
      found.finalizedAt = now;
      found.updatedAt = now;
      return found;
    });

    return NextResponse.json({ document: serializeDocument(document) });
  } catch (error) {
    return routeError(error);
  }
}

function routeError(error: unknown) {
  if (error instanceof ApiError) {
    return jsonError(error.message, error.status);
  }
  if (error instanceof Response) {
    return jsonError(error.status === 401 ? "Authentication required" : "request failed", error.status);
  }
  return jsonError(getZodMessage(error));
}
