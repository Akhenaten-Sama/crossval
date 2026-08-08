import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { ApiError, ensureDraft, jsonError, serializeDocument } from "@/lib/api";
import { updateDb } from "@/lib/store";
import { documentPayloadSchema, getZodMessage } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Params) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const document = await updateDb((db) => db.documents.find((candidate) => candidate.id === id && candidate.userId === user.id));
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

    const updated = await updateDb((db) => {
      const document = db.documents.find((candidate) => candidate.id === id && candidate.userId === user.id);
      if (!document) {
        throw new Response("document not found", { status: 404 });
      }
      ensureDraft(document);
      document.title = payload.title;
      document.customer = payload.customer;
      document.issueDate = payload.issueDate;
      document.updatedAt = new Date().toISOString();
      return document;
    });

    return NextResponse.json({ document: serializeDocument(updated) });
  } catch (error) {
    return routeError(error);
  }
}

export async function DELETE(_request: NextRequest, context: Params) {
  try {
    const user = await requireUser();
    const { id } = await context.params;

    await updateDb((db) => {
      const index = db.documents.findIndex((candidate) => candidate.id === id && candidate.userId === user.id);
      if (index === -1) {
        throw new Response("document not found", { status: 404 });
      }
      ensureDraft(db.documents[index]);
      db.documents.splice(index, 1);
    });

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
