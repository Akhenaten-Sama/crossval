import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { ApiError, jsonError, serializeDocument } from "@/lib/api";
import { deleteDraftDocument, findDocumentForUser, updateDocumentMetadata } from "@/lib/repository";
import { documentPayloadSchema, getZodMessage } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Params) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const document = await findDocumentForUser(id, user.id);
    if (!document) {
      return jsonError("document not found", 404);
    }
    return NextResponse.json({ document: serializeDocument(document) });
  } catch (error) {
    return routeError(error);
  }
}

export async function PUT(request: NextRequest, context: Params) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const payload = documentPayloadSchema.parse(await request.json());

    const updated = await updateDocumentMetadata(id, user.id, payload);

    return NextResponse.json({ document: serializeDocument(updated) });
  } catch (error) {
    return routeError(error);
  }
}

export async function DELETE(_request: NextRequest, context: Params) {
  try {
    const user = await requireUser();
    const { id } = await context.params;

    await deleteDraftDocument(id, user.id);

    return NextResponse.json({ ok: true });
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
