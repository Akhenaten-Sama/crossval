import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { ApiError, jsonError, serializeDocument } from "@/lib/api";
import { updateDb } from "@/lib/store";
import { getZodMessage } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, context: Params) {
  try {
    const user = await requireUser();
    const { id } = await context.params;

    const document = await updateDb((db) => {
      const source = db.documents.find((candidate) => candidate.id === id && candidate.userId === user.id);
      if (!source) {
        throw new ApiError("document not found", 404);
      }

      const now = new Date().toISOString();
      const created = {
        ...source,
        id: crypto.randomUUID(),
        title: `${source.title} (copy)`,
        status: "draft" as const,
        createdAt: now,
        updatedAt: now,
        finalizedAt: null,
        lineItems: source.lineItems.map((line) => ({
          ...line,
          id: crypto.randomUUID(),
          documentId: ""
        }))
      };
      created.lineItems = created.lineItems.map((line) => ({ ...line, documentId: created.id }));
      db.documents.push(created);
      return created;
    });

    return NextResponse.json({ document: serializeDocument(document) }, { status: 201 });
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
