import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { ApiError, jsonError, serializeDocument } from "@/lib/api";
import { addLineItem, deleteLineItem, updateLineItem } from "@/lib/repository";
import { getZodMessage, parseLineItemPayload } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Params) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const payload = parseLineItemPayload(await request.json());

    const document = await addLineItem(id, user.id, payload);

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

    const document = await updateLineItem(id, user.id, lineItemId, payload);

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

    const document = await deleteLineItem(id, user.id, lineItemId);

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
