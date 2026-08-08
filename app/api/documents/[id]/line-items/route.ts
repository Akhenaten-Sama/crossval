import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { ApiError, ensureDraft, jsonError, serializeDocument } from "@/lib/api";
import { updateDb } from "@/lib/store";
import { getZodMessage, parseLineItemPayload } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Params) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const payload = parseLineItemPayload(await request.json());

    const document = await updateDb((db) => {
      const found = db.documents.find((candidate) => candidate.id === id && candidate.userId === user.id);
      if (!found) {
        throw new Response("document not found", { status: 404 });
      }
      ensureDraft(found);
      found.lineItems.push({ ...payload, id: crypto.randomUUID(), documentId: found.id });
      found.updatedAt = new Date().toISOString();
      return found;
    });

    return NextResponse.json({ document: serializeDocument(document) }, { status: 201 });
  } catch (error) {
    return routeError(error);
  }
}

export async function PUT(request: NextRequest, context: Params) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const body = await request.json();
    const lineItemId = String(body.lineItemId ?? "");
    if (!lineItemId) {
      return jsonError("lineItemId is required");
    }
    const payload = parseLineItemPayload(body);

    const document = await updateDb((db) => {
      const found = db.documents.find((candidate) => candidate.id === id && candidate.userId === user.id);
      if (!found) {
        throw new Response("document not found", { status: 404 });
      }
      ensureDraft(found);
      const index = found.lineItems.findIndex((line) => line.id === lineItemId);
      if (index === -1) {
        throw new Response("line item not found", { status: 404 });
      }
      found.lineItems[index] = { ...payload, id: lineItemId, documentId: found.id };
      found.updatedAt = new Date().toISOString();
      return found;
    });

    return NextResponse.json({ document: serializeDocument(document) });
  } catch (error) {
    return routeError(error);
  }
}

export async function DELETE(request: NextRequest, context: Params) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const lineItemId = new URL(request.url).searchParams.get("lineItemId");
    if (!lineItemId) {
      return jsonError("lineItemId is required");
    }

    const document = await updateDb((db) => {
      const found = db.documents.find((candidate) => candidate.id === id && candidate.userId === user.id);
      if (!found) {
        throw new Response("document not found", { status: 404 });
      }
      ensureDraft(found);
      const before = found.lineItems.length;
      found.lineItems = found.lineItems.filter((line) => line.id !== lineItemId);
      if (found.lineItems.length === before) {
        throw new Response("line item not found", { status: 404 });
      }
      found.updatedAt = new Date().toISOString();
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
